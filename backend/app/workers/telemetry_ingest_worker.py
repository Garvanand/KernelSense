import asyncio
import structlog
import traceback
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from typing import List

from backend.app.instrumentation.sampler import TelemetrySampler
from backend.app.instrumentation.common.schema import TelemetryPayload
from backend.app.db.models.process_snapshot import ProcessSnapshot
from backend.app.db.models.resource_metric import ResourceMetric
from backend.app.db.models.scheduler_event import SchedulerEvent
from backend.app.db.database import AsyncSessionLocal
from backend.app.api.ws import manager as ws_manager

logger = structlog.get_logger()

class TelemetryIngestWorker:
    """
    Background worker that continuously pulls from the TelemetrySampler 
    and flushes batches to the database efficiently.
    """
    def __init__(self, sampler: TelemetrySampler, session_maker=AsyncSessionLocal, batch_size: int = 50):
        self.sampler = sampler
        self.session_maker = session_maker
        self.batch_size = batch_size
        self.running = False
        self._buffer: List[TelemetryPayload] = []
        self._task = None

    async def start(self):
        self.running = True
        self._task = asyncio.create_task(self._ingest_loop())
        logger.info("ingest_worker_started", batch_size=self.batch_size)

    async def stop(self):
        self.running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        # Flush remaining
        if self._buffer:
            await self._flush_buffer()
        logger.info("ingest_worker_stopped")

    async def _ingest_loop(self):
        while self.running:
            try:
                # In a real async scenario, the sampler would be async.
                # Since sampler is currently sync, we run it in a thread pool.
                payload = await asyncio.to_thread(self.sampler.collector.collect)
                
                if payload:
                    self._buffer.append(payload)
                    
                    # Convert payload to dict for JSON serialization and broadcast immediately
                    # Limit to top 100 processes to avoid massive WebSocket frames
                    payload_dict = payload.model_dump()
                    if len(payload_dict.get("processes", [])) > 100:
                        # Sort by cpu/memory to get the most relevant ones
                        sorted_procs = sorted(payload_dict["processes"], key=lambda x: (x.get("cpu_percent", 0) + x.get("mem_percent", 0)), reverse=True)
                        payload_dict["processes"] = sorted_procs[:100]
                        
                    asyncio.create_task(ws_manager.broadcast("telemetry", payload_dict))
                    
                if len(self._buffer) >= self.batch_size:
                    await self._flush_buffer()
                    
                await asyncio.sleep(self.sampler.interval_sec)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("ingest_loop_error", error=str(e), trace=traceback.format_exc())
                await asyncio.sleep(1) # Backoff

    async def _flush_buffer(self):
        if not self._buffer:
            return
            
        batch = self._buffer[:]
        self._buffer.clear()
        
        try:
            async with self.session_maker() as session:
                async with session.begin():
                    for payload in batch:
                        # Resource Metric
                        sys_metrics_dict = payload.system_metrics.model_dump(exclude={'cpu_percent', 'linux_load_avg', 'linux_ebpf_sched_latency_ns', 'linux_ebpf_context_switches', 'macos_load_avg', 'windows_etw_context_switches', 'cpu_freq_mhz'})
                        session.add(ResourceMetric(timestamp=payload.timestamp, **sys_metrics_dict))
                        
                        # Process Snapshots
                        for p in payload.processes:
                            session.add(ProcessSnapshot(timestamp=payload.timestamp, **p.model_dump(exclude={'num_fds', 'cpu_affinity'})))
                            
                        # Scheduler events (if any)
                        if payload.system_metrics.linux_ebpf_context_switches:
                            se = SchedulerEvent(
                                timestamp=payload.timestamp,
                                event_type="context_switch",
                                value=payload.system_metrics.linux_ebpf_context_switches
                            )
                            session.add(se)
                await session.commit()
                logger.debug("batch_flushed", count=len(batch))
        except Exception as e:
            logger.error("flush_failed", error=str(e), trace=traceback.format_exc())
            # In a resilient system, we might re-queue the batch or drop it.
            # Dropping here to avoid memory leak if DB is down.
