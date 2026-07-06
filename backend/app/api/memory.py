from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.db.database import get_db
from backend.app.db.repositories.telemetry import TelemetryRepository
from backend.app.db.models.prediction import Prediction
from pydantic import BaseModel
from typing import List, Optional
import time

router = APIRouter()

_cache = {
    "data": None,
    "last_update": 0
}

class MemoryComposition(BaseModel):
    total_bytes: int
    used_bytes: int
    free_bytes: int
    percent: float

class MemoryAnomaly(BaseModel):
    pid: int
    score: float
    confidence: float
    time_to_exhaustion_sec: Optional[float] = None
    llm_explanation: Optional[str] = None

class MemoryResponse(BaseModel):
    composition: MemoryComposition
    anomalies: List[MemoryAnomaly]

@router.get("/", response_model=MemoryResponse)
async def get_memory_intelligence(db: AsyncSession = Depends(get_db)):
    """Get system memory composition and current leak anomalies."""
    
    now = time.time()
    if _cache["data"] and (now - _cache["last_update"]) < 1.0:
        return _cache["data"]

    repo = TelemetryRepository(db)
    
    # 1. Fetch latest system memory composition
    # The TelemetrySampler currently only saves 'mem_percent' in ResourceMetric.
    # To fake 'total', 'used', 'free' for this specific view demo without altering
    # the entire DB schema, we will assume a 16GB system for structural UI demonstration.
    # In a real impl, we'd fetch actual psutil.virtual_memory() fields.
    
    # Fetch latest resource metric
    resources = await repo.get_latest_resources(limit=1)
    
    TOTAL_SYS_MEM = 16 * 1024 * 1024 * 1024 # 16 GB baseline for visualization
    percent = 0.0
    used_bytes = 0
    free_bytes = TOTAL_SYS_MEM
    
    if resources:
        percent = resources[0].mem_percent
        used_bytes = int(TOTAL_SYS_MEM * (percent / 100.0))
        free_bytes = TOTAL_SYS_MEM - used_bytes
        
    composition = MemoryComposition(
        total_bytes=TOTAL_SYS_MEM,
        used_bytes=used_bytes,
        free_bytes=free_bytes,
        percent=percent
    )
    
    # 2. Fetch current active leaks/anomalies from Predictions table
    stmt = (
        select(Prediction)
        .where(Prediction.prediction_type == "leak_anomaly")
        .order_by(desc(Prediction.timestamp))
        .limit(20) # recent ones
    )
    result = await db.execute(stmt)
    predictions = result.scalars().all()
    
    anomalies = []
    
    # De-duplicate by PID (we only want the latest prediction per active PID)
    seen_pids = set()
    
    for p in predictions:
        if p.entity_type == "process" and p.entity_id not in seen_pids:
            seen_pids.add(p.entity_id)
            
            payload = p.payload or {}
            
            anomalies.append(MemoryAnomaly(
                pid=int(p.entity_id),
                score=p.score,
                confidence=p.confidence or 0.0,
                time_to_exhaustion_sec=payload.get("estimated_time_to_exhaustion_sec"),
                llm_explanation=payload.get("llm_explanation")
            ))
            
    return MemoryResponse(
        composition=composition,
        anomalies=anomalies
    )
