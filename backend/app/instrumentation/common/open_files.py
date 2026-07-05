import psutil
import structlog
from typing import List
from backend.app.instrumentation.common.schema import OpenFile

logger = structlog.get_logger(__name__)

def collect_open_files(process: psutil.Process) -> List[OpenFile]:
    """Collect open file descriptors for a process."""
    try:
        files = process.open_files()
        return [OpenFile(path=f.path, fd=f.fd) for f in files]
    except (psutil.AccessDenied, psutil.NoSuchProcess):
        return []
    except Exception as e:
        logger.debug("failed_to_collect_open_files", pid=process.pid, error=str(e))
        return []
