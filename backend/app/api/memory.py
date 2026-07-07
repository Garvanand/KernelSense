from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.db.database import get_db
from backend.app.db.repositories.telemetry import TelemetryRepository
from backend.app.db.models.prediction import Prediction
from backend.app.db.models.resource_metric import ResourceMetric
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

    # Fetch latest resource metric which has real mem_total_bytes and mem_used_bytes
    stmt = select(ResourceMetric).order_by(desc(ResourceMetric.timestamp)).limit(1)
    result = await db.execute(stmt)
    latest = result.scalars().first()
    
    if latest and latest.mem_total_bytes > 0:
        total = latest.mem_total_bytes
        used = latest.mem_used_bytes
        free = total - used
        percent = latest.mem_percent
    else:
        # Fallback if DB is empty
        total = 16 * 1024 * 1024 * 1024
        used = 0
        free = total
        percent = 0.0
        
    composition = MemoryComposition(
        total_bytes=total,
        used_bytes=used,
        free_bytes=free,
        percent=percent
    )
    
    # Fetch current active leaks/anomalies from Predictions table
    stmt = (
        select(Prediction)
        .where(Prediction.prediction_type == "leak_anomaly")
        .order_by(desc(Prediction.timestamp))
        .limit(20)
    )
    result = await db.execute(stmt)
    predictions = result.scalars().all()
    
    anomalies = []
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
    
    resp = MemoryResponse(composition=composition, anomalies=anomalies)
    _cache["data"] = resp
    _cache["last_update"] = now
    return resp
