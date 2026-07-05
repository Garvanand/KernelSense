import psutil
import structlog
from typing import List
from backend.app.instrumentation.common.schema import SocketConnection

logger = structlog.get_logger(__name__)

def collect_sockets(process: psutil.Process) -> List[SocketConnection]:
    """Collect active network sockets for a process (metadata only)."""
    try:
        conns = process.connections(kind='all')
        sockets = []
        for c in conns:
            laddr = f"{c.laddr.ip}:{c.laddr.port}" if c.laddr else ""
            raddr = f"{c.raddr.ip}:{c.raddr.port}" if c.raddr else None
            sockets.append(SocketConnection(
                fd=c.fd,
                family=c.family,
                type=c.type,
                laddr=laddr,
                raddr=raddr,
                status=c.status
            ))
        return sockets
    except (psutil.AccessDenied, psutil.NoSuchProcess):
        return []
    except Exception as e:
        logger.debug("failed_to_collect_sockets", pid=process.pid, error=str(e))
        return []
