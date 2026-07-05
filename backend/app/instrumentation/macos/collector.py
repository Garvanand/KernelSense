import platform
import psutil
from backend.app.instrumentation.common.schema import PlatformInfo
from backend.app.instrumentation.linux.psutil_collector import LinuxPsutilCollector

class MacOSCollector(LinuxPsutilCollector):
    """
    macOS telemetry collector.
    psutil works well for basic metrics, but dtrace is blocked by SIP.
    """
    def __init__(self):
        super().__init__()
        
    def collect(self):
        payload = super().collect()
        payload.platform_info.os = "macos"
        payload.platform_info.release = platform.release()
        payload.platform_info.reduced_fidelity = True # Blocked by SIP
        
        # Override macOS-specific fields
        mem = psutil.virtual_memory()
        if hasattr(mem, 'wired'):
            payload.system_metrics.macos_wired_bytes = mem.wired
            
        payload.system_metrics.linux_iowait_percent = None
        
        return payload
