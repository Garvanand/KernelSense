from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
import random
from backend.app.db.database import get_db
from backend.app.db.repositories.telemetry import TelemetryRepository
from backend.app.db.models.scheduler_event import SchedulerEvent
from backend.app.access.state import AccessState
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class CoreUtilization(BaseModel):
    core_id: int
    utilization_percent: float

class SchedulerMetricsResponse(BaseModel):
    timestamp: float
    cores: List[CoreUtilization]
    context_switch_rate: int
    run_queue_latency_ms: float

class RawEventResponse(BaseModel):
    id: int
    timestamp: float
    event_type: str
    value: int

@router.get("/", response_model=SchedulerMetricsResponse)
async def get_scheduler_metrics(db: AsyncSession = Depends(get_db)):
    """Get aggregated scheduler metrics and per-core utilization."""
    repo = TelemetryRepository(db)
    
    # 1. Fetch latest system CPU composition
    resources = await repo.get_latest_resources(limit=1)
    base_cpu = resources[0].cpu_user_percent + resources[0].cpu_system_percent if resources else 10.0
    
    # Simulate a 16-core distribution around the base CPU load
    cores = []
    for i in range(16):
        # Add some jitter so they aren't all identical
        jitter = random.uniform(-10.0, 10.0)
        core_load = max(0.0, min(100.0, base_cpu + jitter))
        
        # Simulate a pinned CPU occasionally for visual effect
        if base_cpu > 40 and random.random() > 0.9:
            core_load = random.uniform(90.0, 100.0)
            
        cores.append(CoreUtilization(
            core_id=i,
            utilization_percent=round(core_load, 1)
        ))
        
    # 2. Fetch context switches (we'll fetch recent events and aggregate)
    stmt = (
        select(SchedulerEvent)
        .where(SchedulerEvent.event_type == "context_switch")
        .order_by(desc(SchedulerEvent.timestamp))
        .limit(1)
    )
    result = await db.execute(stmt)
    cs_event = result.scalars().first()
    cs_rate = cs_event.value if cs_event else random.randint(1500, 5000)
    
    # Simulate run-queue latency based on CPU pressure
    rq_latency = base_cpu * 0.15 + random.uniform(0.1, 1.2)
    
    return SchedulerMetricsResponse(
        timestamp=resources[0].timestamp if resources else 0.0,
        cores=cores,
        context_switch_rate=cs_rate,
        run_queue_latency_ms=round(rq_latency, 2)
    )

@router.get("/events", response_model=List[RawEventResponse])
async def get_raw_events(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Get raw scheduler event stream. Gated to Kernel/Research levels."""
    
    # Check Access Level
    tier = AccessState.get_tier()
    if tier not in ["kernel", "research"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Raw scheduler telemetry requires Kernel or Research clearance."
        )
        
    stmt = (
        select(SchedulerEvent)
        .order_by(desc(SchedulerEvent.timestamp))
        .limit(limit)
    )
    result = await db.execute(stmt)
    events = result.scalars().all()
    
    # For UI testing purposes, if DB is completely empty we generate dummy raw events
    if not events:
        import time
        now = time.time()
        return [
            RawEventResponse(
                id=i,
                timestamp=now - (i * 0.1),
                event_type=random.choice(["context_switch", "migration", "wakeup"]),
                value=random.randint(1, 100)
            ) for i in range(limit)
        ]
        
    return [
        RawEventResponse(
            id=e.id,
            timestamp=e.timestamp,
            event_type=e.event_type,
            value=e.value
        ) for e in events
    ]
