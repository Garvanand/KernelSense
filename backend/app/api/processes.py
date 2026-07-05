from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.database import get_db
from backend.app.db.repositories.telemetry import TelemetryRepository
from pydantic import BaseModel
from typing import List, Optional, Any
from backend.app.access.state import AccessState
from backend.app.access.level_policy import filter_process_dict

router = APIRouter()

class ProcessResponse(BaseModel):
    pid: int
    name: str
    cpu_percent: float
    mem_rss_bytes: int
    
    # Power level fields
    ppid: Optional[int] = None
    create_time: Optional[float] = None
    mem_vms_bytes: Optional[int] = None
    num_threads: Optional[int] = None
    io_read_bytes: Optional[int] = None
    io_write_bytes: Optional[int] = None
    num_fds: Optional[int] = None
    cpu_affinity: Optional[List[int]] = None
    
    # Deep OS fields
    open_files: Optional[Any] = None
    sockets: Optional[Any] = None
    permissions: Optional[Any] = None
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[ProcessResponse])
async def list_processes(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Get the latest snapshot of processes sorted by CPU usage. Enforces access level."""
    repo = TelemetryRepository(db)
    processes = await repo.get_latest_processes(limit=limit)
    
    tier = AccessState.get_tier()
    
    # Convert SQLAlchemy models to dicts and filter them
    filtered = []
    for p in processes:
        # Convert ORM to dict using Pydantic
        p_dict = ProcessResponse.model_validate(p).model_dump()
        filtered.append(filter_process_dict(p_dict, tier))
        
    return filtered
