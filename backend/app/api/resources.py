from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.database import get_db
from backend.app.db.repositories.telemetry import TelemetryRepository
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class ResourceResponse(BaseModel):
    timestamp: float
    cpu_user_percent: float
    cpu_system_percent: float = 0.0
    cpu_idle_percent: float = 0.0
    mem_total_bytes: int = 0
    mem_used_bytes: int = 0
    mem_percent: float = 0.0
    disk_read_bytes: int = 0
    disk_write_bytes: int = 0
    net_bytes_sent: int = 0
    net_bytes_recv: int = 0
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[ResourceResponse])
async def list_resources(limit: int = 100, db: AsyncSession = Depends(get_db)):
    """Get the latest resource metrics time-series."""
    repo = TelemetryRepository(db)
    metrics = await repo.get_latest_resources(limit=limit)
    return metrics
