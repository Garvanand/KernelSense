from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.database import get_db
from backend.app.db.repositories.telemetry import TelemetryRepository
from pydantic import BaseModel
from typing import List

router = APIRouter()

class ResourceResponse(BaseModel):
    timestamp: float
    cpu_user_percent: float
    mem_percent: float
    disk_read_bytes: int
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[ResourceResponse])
async def list_resources(limit: int = 100, db: AsyncSession = Depends(get_db)):
    """Get the latest resource metrics time-series."""
    repo = TelemetryRepository(db)
    metrics = await repo.get_latest_resources(limit=limit)
    return metrics
