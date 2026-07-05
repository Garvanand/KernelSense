import psutil
import structlog
from typing import Optional
from backend.app.instrumentation.common.schema import ProcessPermissions

logger = structlog.get_logger(__name__)

def collect_permissions(process: psutil.Process) -> Optional[ProcessPermissions]:
    """Collect ownership and permission context for a process."""
    try:
        # uids and gids are Unix only, fallback gracefully on Windows
        uids = list(process.uids()) if hasattr(process, 'uids') else None
        gids = list(process.gids()) if hasattr(process, 'gids') else None
        username = process.username()
        
        return ProcessPermissions(
            username=username,
            uids=uids,
            gids=gids
        )
    except (psutil.AccessDenied, psutil.NoSuchProcess):
        return None
    except Exception as e:
        logger.debug("failed_to_collect_permissions", pid=process.pid, error=str(e))
        return None
