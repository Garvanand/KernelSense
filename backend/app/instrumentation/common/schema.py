from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class OpenFile(BaseModel):
    path: str
    fd: Optional[int] = None

class SocketConnection(BaseModel):
    fd: Optional[int] = None
    family: int
    type: int
    laddr: str
    raddr: Optional[str] = None
    status: str

class ProcessPermissions(BaseModel):
    username: Optional[str] = None
    uids: Optional[List[int]] = None
    gids: Optional[List[int]] = None

class Service(BaseModel):
    name: str
    display_name: str
    status: str

class ProcessContext(BaseModel):
    """Normalized process-level telemetry."""
    pid: int
    ppid: Optional[int] = None
    name: str = ""
    status: str = ""
    create_time: float = 0.0
    
    # Resource usage
    cpu_percent: float = 0.0
    mem_rss_bytes: int = 0
    mem_vms_bytes: int = 0
    num_threads: int = 0
    
    # I/O (nullable on some platforms or due to permissions)
    io_read_bytes: Optional[int] = None
    io_write_bytes: Optional[int] = None
    
    # Platform specific process extensions
    num_fds: Optional[int] = None          # Linux/macOS
    cpu_affinity: Optional[List[int]] = None # Linux/Windows
    
    # Deep OS Interaction fields
    open_files: Optional[List[OpenFile]] = None
    sockets: Optional[List[SocketConnection]] = None
    permissions: Optional[ProcessPermissions] = None

class SystemMetrics(BaseModel):
    """Normalized system-wide telemetry."""
    # Core fields guaranteed across platforms
    cpu_percent: List[float] = Field(default_factory=list)
    cpu_user_percent: float = 0.0
    cpu_system_percent: float = 0.0
    cpu_idle_percent: float = 0.0
    cpu_freq_mhz: float = 0.0
    
    mem_total_bytes: int = 0
    mem_used_bytes: int = 0
    mem_percent: float = 0.0
    
    disk_read_bytes: int = 0
    disk_write_bytes: int = 0
    
    net_bytes_sent: int = 0
    net_bytes_recv: int = 0
    
    # Platform-specific nullable fields
    # Linux
    linux_iowait_percent: Optional[float] = None
    linux_load_avg: Optional[List[float]] = None
    linux_ebpf_sched_latency_ns: Optional[float] = None
    linux_ebpf_context_switches: Optional[int] = None
    
    # macOS
    macos_wired_bytes: Optional[int] = None
    macos_load_avg: Optional[List[float]] = None
    
    # Windows
    windows_commit_bytes: Optional[int] = None
    windows_etw_context_switches: Optional[int] = None

class PlatformInfo(BaseModel):
    """Information about the source platform and active capabilities."""
    os: str
    release: str
    reduced_fidelity: bool = False
    ebpf_active: bool = False
    etw_active: bool = False

class TelemetryPayload(BaseModel):
    """The root payload object emitted per sample."""
    timestamp: float
    platform_info: PlatformInfo
    system_metrics: SystemMetrics
    processes: List[ProcessContext] = Field(default_factory=list)
    services: Optional[List[Service]] = None
