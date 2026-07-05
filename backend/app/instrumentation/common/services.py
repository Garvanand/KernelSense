import psutil
import platform
import structlog
from typing import List
from backend.app.instrumentation.common.schema import Service

logger = structlog.get_logger(__name__)

def collect_services() -> List[Service]:
    """Collect running OS daemons/services."""
    services = []
    sys_os = platform.system().lower()
    
    if sys_os == "windows":
        try:
            for svc in psutil.win_service_iter():
                try:
                    s_dict = svc.as_dict()
                    services.append(Service(
                        name=s_dict.get('name', ''),
                        display_name=s_dict.get('display_name', ''),
                        status=s_dict.get('status', 'unknown')
                    ))
                except psutil.AccessDenied:
                    continue
        except Exception as e:
            logger.debug("win_service_iter_failed", error=str(e))
            
    elif sys_os == "linux":
        # On Linux, extracting systemctl status is expensive. 
        # For this tier, we'll return a stub or parse /run/systemd/units if implemented.
        pass
        
    return services
