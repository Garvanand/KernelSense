from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_
from backend.app.db.database import get_db
from backend.app.db.models.resource_metric import ResourceMetric
from backend.app.db.models.process_snapshot import ProcessSnapshot
from typing import List, Dict, Any
import time

router = APIRouter()

@router.get("/history")
async def get_dvr_history(minutes: int = 5, limit: int = 300, db: AsyncSession = Depends(get_db)):
    """
    Fetch a historical timeline of telemetry for the DVR scrubber.
    Groups ResourceMetrics and ProcessSnapshots by timestamp.
    """
    current_time = time.time()
    start_time = current_time - (minutes * 60)
    
    # 1. Fetch System Metrics
    res_metrics_query = await db.execute(
        select(ResourceMetric)
        .where(ResourceMetric.timestamp >= start_time)
        .order_by(ResourceMetric.timestamp.asc())
        .limit(limit)
    )
    metrics = res_metrics_query.scalars().all()
    
    if not metrics:
        return []

    # Get the timestamps we actually care about
    timestamps = [m.timestamp for m in metrics]
    
    # 2. Fetch Process Snapshots for these exact timestamps
    # To avoid massive queries, we might just fetch processes for these timestamps
    proc_query = await db.execute(
        select(ProcessSnapshot)
        .where(ProcessSnapshot.timestamp.in_(timestamps))
    )
    processes = proc_query.scalars().all()
    
    # Group processes by timestamp
    proc_by_ts: Dict[float, List[Any]] = {}
    for p in processes:
        if p.timestamp not in proc_by_ts:
            proc_by_ts[p.timestamp] = []
        
        from backend.app.api.processes import ProcessResponse
        proc_by_ts[p.timestamp].append(ProcessResponse.model_validate(p).model_dump())

    # 3. Construct the Timeline Array
    history_frames = []
    for m in metrics:
        history_frames.append({
            "timestamp": m.timestamp,
            "system_metrics": {
                "cpu_user_percent": m.cpu_user_percent,
                "cpu_system_percent": m.cpu_system_percent,
                "cpu_idle_percent": m.cpu_idle_percent,
                "mem_total_bytes": m.mem_total_bytes,
                "mem_used_bytes": m.mem_used_bytes,
                "mem_percent": m.mem_percent,
                "disk_read_bytes": m.disk_read_bytes,
                "disk_write_bytes": m.disk_write_bytes,
                "net_bytes_sent": m.net_bytes_sent,
                "net_bytes_recv": m.net_bytes_recv,
                # Mock a multi-core array based on totals for visual effect if missing
                "cpu_percent": [m.cpu_user_percent + m.cpu_system_percent] * 8, 
                "linux_iowait_percent": m.linux_iowait_percent,
                "macos_wired_bytes": m.macos_wired_bytes,
                "windows_commit_bytes": m.windows_commit_bytes,
            },
            "processes": sorted(proc_by_ts.get(m.timestamp, []), key=lambda x: x["cpu_percent"], reverse=True)[:50]
        })
        
    return history_frames
