from enum import Enum
from typing import Set
import structlog
from backend.app.instrumentation.common.schema import TelemetryPayload, ProcessContext

logger = structlog.get_logger(__name__)

class AccessTier(str, Enum):
    GUEST = "guest"
    POWER = "power"
    RESEARCH = "research"

# Tier hierarchies (what encompasses what)
TIER_LEVELS = {
    AccessTier.GUEST: 1,
    AccessTier.POWER: 2,
    AccessTier.RESEARCH: 3
}

def filter_payload(payload: TelemetryPayload, tier: AccessTier) -> TelemetryPayload:
    """
    Enforce access-level policy by scrubbing the payload of unauthorized fields.
    Returns a safe, mutated copy of the payload (or mutates in place if Pydantic allows,
    but here we mutate the dict representation and reconstruct for safety).
    """
    level = TIER_LEVELS[tier]
    
    # Let's operate on the object directly for performance, 
    # setting restricted fields to None or default.
    
    # 1. GUEST LEVEL RESTRICTIONS (if level < POWER)
    if level < TIER_LEVELS[AccessTier.POWER]:
        # Guest cannot see services
        payload.services = None
        
        # Guest sees limited process details
        for proc in payload.processes:
            proc.ppid = None
            proc.create_time = 0.0
            proc.mem_vms_bytes = 0
            proc.num_threads = 0
            proc.io_read_bytes = None
            proc.io_write_bytes = None
            proc.num_fds = None
            proc.cpu_affinity = None
            proc.open_files = None
            proc.sockets = None
            proc.permissions = None

    # 2. POWER LEVEL RESTRICTIONS (if level < RESEARCH)
    if level < TIER_LEVELS[AccessTier.RESEARCH]:
        # Power cannot see eBPF/ETW scheduler metrics
        payload.system_metrics.linux_ebpf_sched_latency_ns = None
        payload.system_metrics.linux_ebpf_context_switches = None
        payload.system_metrics.windows_etw_context_switches = None
        
    return payload

def filter_process_dict(proc_dict: dict, tier: AccessTier) -> dict:
    """Filter a process dictionary for API response serialization."""
    level = TIER_LEVELS[tier]
    
    if level < TIER_LEVELS[AccessTier.POWER]:
        proc_dict['ppid'] = None
        proc_dict['create_time'] = 0.0
        proc_dict['mem_vms_bytes'] = 0
        proc_dict['num_threads'] = 0
        proc_dict['io_read_bytes'] = None
        proc_dict['io_write_bytes'] = None
        proc_dict['num_fds'] = None
        proc_dict['cpu_affinity'] = None
        proc_dict['open_files'] = None
        proc_dict['sockets'] = None
        proc_dict['permissions'] = None
        
    return proc_dict
