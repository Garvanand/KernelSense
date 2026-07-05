from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.database import get_db
from backend.app.db.repositories.telemetry import TelemetryRepository
from pydantic import BaseModel
from typing import List

router = APIRouter()

class ProcessResponse(BaseModel):
    pid: int
    name: str
    cpu_percent: float
    mem_rss_bytes: int
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[ProcessResponse])
async def list_processes(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Get the latest snapshot of processes sorted by CPU usage."""
    repo = TelemetryRepository(db)
    processes = await repo.get_latest_processes(limit=limit)
    return processes
