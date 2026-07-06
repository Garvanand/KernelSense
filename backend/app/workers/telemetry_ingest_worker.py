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
                        rm = ResourceMetric(
                            timestamp=payload.timestamp,
                            cpu_user_percent=payload.system_metrics.cpu_user_percent,
                            cpu_system_percent=payload.system_metrics.cpu_system_percent,
                            cpu_idle_percent=payload.system_metrics.cpu_idle_percent,
                            mem_total_bytes=payload.system_metrics.mem_total_bytes,
                            mem_used_bytes=payload.system_metrics.mem_used_bytes,
                            mem_percent=payload.system_metrics.mem_percent,
                            disk_read_bytes=payload.system_metrics.disk_read_bytes,
                            disk_write_bytes=payload.system_metrics.disk_write_bytes,
                            net_bytes_sent=payload.system_metrics.net_bytes_sent,
                            net_bytes_recv=payload.system_metrics.net_bytes_recv,
                            linux_iowait_percent=payload.system_metrics.linux_iowait_percent,
                            macos_wired_bytes=payload.system_metrics.macos_wired_bytes,
                            windows_commit_bytes=payload.system_metrics.windows_commit_bytes
                        )
                        session.add(rm)
                        
                        # Process Snapshots
                        for p in payload.processes:
                            ps = ProcessSnapshot(
                                timestamp=payload.timestamp,
                                pid=p.pid,
                                ppid=p.ppid,
                                name=p.name,
                                status=p.status,
                                create_time=p.create_time,
                                cpu_percent=p.cpu_percent,
                                mem_rss_bytes=p.mem_rss_bytes,
                                mem_vms_bytes=p.mem_vms_bytes,
                                num_threads=p.num_threads,
                                io_read_bytes=p.io_read_bytes,
                                io_write_bytes=p.io_write_bytes,
                                open_files=[f.model_dump() for f in p.open_files] if p.open_files else None,
                                sockets=[s.model_dump() for s in p.sockets] if p.sockets else None,
                                permissions=p.permissions.model_dump() if p.permissions else None
                            )
                            session.add(ps)
                            
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
