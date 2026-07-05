from fastapi import APIRouter
import os
import psutil

router = APIRouter()

@router.get("/")
async def health_check():
    """System health check and worker memory footprint."""
    process = psutil.Process(os.getpid())
    mem_info = process.memory_info()
    
    return {
        "status": "ok",
        "worker_rss_mb": mem_info.rss / (1024 * 1024)
    }
