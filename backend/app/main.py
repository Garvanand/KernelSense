import platform
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings
from backend.app.core.logging import setup_logging
from backend.app.api import processes, resources, health, access, memory, scheduler, incidents

from backend.app.db.database import engine
from backend.app.db.models.base import Base
from backend.app.db.models.process_snapshot import ProcessSnapshot
from backend.app.db.models.resource_metric import ResourceMetric
from backend.app.db.models.scheduler_event import SchedulerEvent
from backend.app.db.models.consent_log import ConsentLog
from backend.app.db.models.prediction import Prediction

from backend.app.instrumentation.sampler import TelemetrySampler
from backend.app.workers.telemetry_ingest_worker import TelemetryIngestWorker
from backend.app.ml.incident_engine import IncidentEngineWorker

# Setup structured logging
setup_logging()

# Global worker references
ingest_worker = None
incident_worker = None

def get_collector():
    sys_os = platform.system().lower()
    if sys_os == "windows":
        from backend.app.instrumentation.windows.etw_collector import WindowsETWCollector
        return WindowsETWCollector()
    elif sys_os == "darwin":
        from backend.app.instrumentation.macos.collector import MacOSCollector
        return MacOSCollector()
    else:
        from backend.app.instrumentation.linux.ebpf_collector import LinuxEBPFCollector
        return LinuxEBPFCollector()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB (creates tables if missing - acting as poor man's migration for local sqlite)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    # Start background ingest worker
    global ingest_worker, incident_worker
    
    # 1. Start Telemetry Ingestion
    collector = get_collector()
    sampler = TelemetrySampler(collector, interval_sec=1.0) # 1 Hz
    ingest_worker = TelemetryIngestWorker(sampler)
    await ingest_worker.start()
    
    # 2. Start Incident Engine
    incident_worker = IncidentEngineWorker()
    await incident_worker.start()
    
    yield
    
    if ingest_worker:
        await ingest_worker.stop()
    if incident_worker:
        await incident_worker.stop()

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(access.router, prefix="/api/v1/access", tags=["access"])
app.include_router(memory.router, prefix="/api/v1/memory", tags=["memory"])
app.include_router(scheduler.router, prefix="/api/v1/scheduler", tags=["scheduler"])
app.include_router(incidents.router, prefix="/api/v1/incidents", tags=["incidents"])
app.include_router(processes.router, prefix=f"{settings.API_V1_STR}/processes", tags=["processes"])
app.include_router(resources.router, prefix=f"{settings.API_V1_STR}/resources", tags=["resources"])
