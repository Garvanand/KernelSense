import asyncio
import structlog
import traceback
import time
import numpy as np
from collections import deque
from typing import List

from backend.app.instrumentation.sampler import TelemetrySampler
from backend.app.instrumentation.common.schema import TelemetryPayload
from backend.app.db.models.process_snapshot import ProcessSnapshot
from backend.app.db.models.resource_metric import ResourceMetric
from backend.app.db.models.scheduler_event import SchedulerEvent
from backend.app.db.models.prediction import Prediction
from backend.app.db.database import AsyncSessionLocal
from backend.app.api.ws import manager as ws_manager
from backend.app.core.config import settings

logger = structlog.get_logger()


class InlineAnomalyDetector:
    """Statistical anomaly detector that runs inline during ingestion.
    Uses a rolling Z-score on memory growth rate per process."""
    
    def __init__(self, window_size: int = 60, z_threshold: float = 2.5):
        self.window_size = window_size
        self.z_threshold = z_threshold
        # Track memory history per PID: {pid: deque([mem_rss, ...])}
        self._mem_history: dict[int, deque] = {}
        # Track system-level metrics
        self._cpu_history: deque = deque(maxlen=window_size)
        self._mem_pct_history: deque = deque(maxlen=window_size)
    
    def detect(self, payload: TelemetryPayload) -> List[dict]:
        """Run anomaly detection on a payload. Returns list of anomaly dicts."""
        anomalies = []
        
        # System-level threshold alerts
        cpu_total = payload.system_metrics.cpu_user_percent + payload.system_metrics.cpu_system_percent
        self._cpu_history.append(cpu_total)
        self._mem_pct_history.append(payload.system_metrics.mem_percent)
        
        if cpu_total > settings.ALERT_CPU_THRESHOLD:
            anomalies.append({
                "type": "threshold_breach",
                "entity_type": "host",
                "entity_id": settings.AGENT_ID,
                "metric": "cpu_percent",
                "value": cpu_total,
                "threshold": settings.ALERT_CPU_THRESHOLD,
                "severity": min(1.0, cpu_total / 100.0),
            })
        
        if payload.system_metrics.mem_percent > settings.ALERT_MEM_THRESHOLD:
            anomalies.append({
                "type": "threshold_breach",
                "entity_type": "host",
                "entity_id": settings.AGENT_ID,
                "metric": "mem_percent",
                "value": payload.system_metrics.mem_percent,
                "threshold": settings.ALERT_MEM_THRESHOLD,
                "severity": min(1.0, payload.system_metrics.mem_percent / 100.0),
            })
        
        # Per-process memory leak detection (Z-score on RSS growth rate)
        for p in payload.processes[:50]:  # Top 50 only
            if p.pid not in self._mem_history:
                self._mem_history[p.pid] = deque(maxlen=self.window_size)
            
            history = self._mem_history[p.pid]
            history.append(p.mem_rss_bytes)
            
            if len(history) >= 10:
                arr = np.array(list(history))
                diffs = np.diff(arr)
                if len(diffs) > 1 and np.std(diffs) > 0:
                    z_score = (diffs[-1] - np.mean(diffs)) / np.std(diffs)
                    if z_score > self.z_threshold:
                        anomalies.append({
                            "type": "leak_anomaly",
                            "entity_type": "process",
                            "entity_id": str(p.pid),
                            "metric": "mem_rss_growth_rate",
                            "z_score": float(z_score),
                            "severity": min(1.0, float(z_score) / 5.0),
                            "process_name": p.name,
                        })
        
        # Prune dead PIDs
        active_pids = {p.pid for p in payload.processes}
        dead = [pid for pid in self._mem_history if pid not in active_pids]
        for pid in dead:
            del self._mem_history[pid]
        
        return anomalies


class TelemetryIngestWorker:
    def __init__(self, sampler: TelemetrySampler, session_maker=AsyncSessionLocal, batch_size: int = 50):
        self.sampler = sampler
        self.session_maker = session_maker
        self.batch_size = batch_size
        self.running = False
        self._buffer: List[TelemetryPayload] = []
        self._task = None
        self._purge_task = None
        self._anomaly_detector = InlineAnomalyDetector(
            z_threshold=settings.ANOMALY_ZSCORE_THRESHOLD
        )

    async def start(self):
        self.running = True
        self._task = asyncio.create_task(self._ingest_loop())
        self._purge_task = asyncio.create_task(self._purge_loop())
        logger.info("ingest_worker_started", batch_size=self.batch_size)

    async def stop(self):
        self.running = False
        for t in [self._task, self._purge_task]:
            if t:
                t.cancel()
                try:
                    await t
                except asyncio.CancelledError:
                    pass
        if self._buffer:
            await self._flush_buffer()
        logger.info("ingest_worker_stopped")

    async def _ingest_loop(self):
        while self.running:
            try:
                payload = await asyncio.to_thread(self.sampler.collector.collect)
                
                if payload:
                    self._buffer.append(payload)
                    
                    # --- Inline Anomaly Detection (Fix #3) ---
                    anomalies = self._anomaly_detector.detect(payload)
                    if anomalies:
                        asyncio.create_task(self._persist_anomalies(anomalies, payload.timestamp))
                        asyncio.create_task(ws_manager.broadcast("alerts", anomalies))
                    
                    # Broadcast telemetry
                    payload_dict = payload.model_dump()
                    procs = payload_dict.get("processes", [])
                    if len(procs) > 100:
                        procs.sort(key=lambda x: x.get("cpu_percent", 0), reverse=True)
                        payload_dict["processes"] = procs[:100]
                    asyncio.create_task(ws_manager.broadcast("telemetry", payload_dict))
                    
                if len(self._buffer) >= self.batch_size:
                    await self._flush_buffer()
                    
                await asyncio.sleep(self.sampler.interval_sec)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("ingest_loop_error", error=str(e), trace=traceback.format_exc())
                await asyncio.sleep(1)

    async def _flush_buffer(self):
        """Write batch to DB. NO purge here (Fix #8 — purge is on separate timer)."""
        if not self._buffer:
            return
        batch = self._buffer[:]
        self._buffer.clear()
        
        try:
            async with self.session_maker() as session:
                async with session.begin():
                    all_objects = []
                    for payload in batch:
                        sys_d = payload.system_metrics.model_dump(exclude={
                            'cpu_percent', 'linux_load_avg', 'linux_ebpf_sched_latency_ns',
                            'linux_ebpf_context_switches', 'macos_load_avg',
                            'windows_etw_context_switches', 'cpu_freq_mhz'
                        })
                        all_objects.append(ResourceMetric(timestamp=payload.timestamp, **sys_d))
                        for p in payload.processes:
                            all_objects.append(ProcessSnapshot(
                                timestamp=payload.timestamp,
                                **p.model_dump(exclude={'num_fds', 'cpu_affinity'})
                            ))
                        if payload.system_metrics.linux_ebpf_context_switches:
                            all_objects.append(SchedulerEvent(
                                timestamp=payload.timestamp,
                                event_type="context_switch",
                                value=payload.system_metrics.linux_ebpf_context_switches,
                            ))
                    session.add_all(all_objects)
                await session.commit()
                logger.debug("batch_flushed", count=len(batch), objects=len(all_objects))
        except Exception as e:
            logger.error("flush_failed", error=str(e), trace=traceback.format_exc())

    async def _purge_loop(self):
        """Fix #8: Separate purge timer — runs every 5 minutes, NOT inside write transactions."""
        while self.running:
            try:
                await asyncio.sleep(300)  # Every 5 minutes
                cutoff = time.time() - settings.DATA_RETENTION_SEC
                async with self.session_maker() as session:
                    from sqlalchemy import delete
                    r1 = await session.execute(delete(ResourceMetric).where(ResourceMetric.timestamp < cutoff))
                    r2 = await session.execute(delete(ProcessSnapshot).where(ProcessSnapshot.timestamp < cutoff))
                    await session.commit()
                    logger.info("purge_complete", metrics_deleted=r1.rowcount, snapshots_deleted=r2.rowcount)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("purge_error", error=str(e))

    async def _persist_anomalies(self, anomalies: list, timestamp: float):
        """Write detected anomalies to the Prediction table."""
        try:
            async with self.session_maker() as session:
                for a in anomalies:
                    session.add(Prediction(
                        timestamp=timestamp,
                        entity_type=a["entity_type"],
                        entity_id=a["entity_id"],
                        prediction_type=a["type"],
                        score=a["severity"],
                        confidence=0.9 if a["type"] == "threshold_breach" else 0.7,
                        payload=a,
                    ))
                await session.commit()
        except Exception as e:
            logger.error("anomaly_persist_error", error=str(e))
