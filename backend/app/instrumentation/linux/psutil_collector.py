import psutil
import time
import platform
from backend.app.instrumentation.common.schema import ProcessContext, SystemMetrics, TelemetryPayload, PlatformInfo
from backend.app.instrumentation.common.base import BaseCollector
from backend.app.instrumentation.consent import consent_manager
from backend.app.instrumentation.common.open_files import collect_open_files
from backend.app.instrumentation.common.sockets import collect_sockets
from backend.app.instrumentation.common.permissions import collect_permissions
from backend.app.instrumentation.common.services import collect_services

class LinuxPsutilCollector(BaseCollector):
    def __init__(self):
        # Initialize initial CPU times to get valid percentages
        psutil.cpu_percent(percpu=True)
        psutil.cpu_times_percent()
        
        # Track context switches
        self._last_ctx_switches = psutil.cpu_stats().ctx_switches
        self._last_time = time.time()
        
    def collect(self) -> TelemetryPayload:
        ts = time.time()
        
        cpu_perc = psutil.cpu_percent(percpu=True)
        cpu_times = psutil.cpu_times_percent()
        mem = psutil.virtual_memory()
        disk = psutil.disk_io_counters() or psutil._common.sdiskio(0,0,0,0,0,0)
        net = psutil.net_io_counters() or psutil._common.snetio(0,0,0,0,0,0,0,0)
        
        load_avg = None
        if hasattr(psutil, 'getloadavg'):
            load_avg = list(psutil.getloadavg())
            
        # Compute context switch rate
        current_stats = psutil.cpu_stats()
        current_ctx = current_stats.ctx_switches
        time_delta = ts - self._last_time
        ctx_rate = 0
        if time_delta > 0:
            ctx_rate = int((current_ctx - self._last_ctx_switches) / time_delta)
            
        self._last_ctx_switches = current_ctx
        self._last_time = ts
            
        sys_metrics = SystemMetrics(
            cpu_percent=cpu_perc,
            cpu_user_percent=cpu_times.user,
            cpu_system_percent=cpu_times.system,
            cpu_idle_percent=cpu_times.idle,
            cpu_freq_mhz=psutil.cpu_freq().current if psutil.cpu_freq() else 0.0,
            mem_total_bytes=mem.total,
            mem_used_bytes=mem.used,
            mem_percent=mem.percent,
            disk_read_bytes=disk.read_bytes,
            disk_write_bytes=disk.write_bytes,
            net_bytes_sent=net.bytes_sent,
            net_bytes_recv=net.bytes_recv,
            linux_iowait_percent=getattr(cpu_times, 'iowait', None),
            linux_load_avg=load_avg,
            linux_ebpf_context_switches=ctx_rate, # Populate this for the frontend
            windows_etw_context_switches=ctx_rate # Populate this for the frontend
        )
        
        processes = []
        for p in psutil.process_iter(['pid', 'ppid', 'name', 'status', 'create_time', 'cpu_percent', 'memory_info', 'num_threads']):
            try:
                mem_cpu = p.info
                io_counters = None
                try:
                    io_counters = p.io_counters()
                except (psutil.AccessDenied, psutil.ZombieProcess, AttributeError):
                    pass
                
                # Deep Interaction Fields (only if consent granted, otherwise skip to save overhead)
                open_files_data = None
                sockets_data = None
                permissions_data = None
                
                if consent_manager.is_granted():
                    open_files_data = collect_open_files(p)
                    sockets_data = collect_sockets(p)
                    permissions_data = collect_permissions(p)
                    
                ctx = ProcessContext(
                    pid=p.pid,
                    ppid=p.ppid(),
                    name=p.name(),
                    status=p.status(),
                    create_time=p.create_time(),
                    cpu_percent=mem_cpu.get('cpu_percent', 0.0),
                    mem_rss_bytes=mem_cpu.get('memory_info', getattr(p, 'memory_info', lambda: None)()).rss,
                    mem_vms_bytes=mem_cpu.get('memory_info', getattr(p, 'memory_info', lambda: None)()).vms,
                    num_threads=p.num_threads(),
                    io_read_bytes=io_counters.read_bytes if io_counters else None,
                    io_write_bytes=io_counters.write_bytes if io_counters else None,
                    num_fds=p.num_fds() if hasattr(p, 'num_fds') else None,
                    cpu_affinity=p.cpu_affinity() if hasattr(p, 'cpu_affinity') else None,
                    open_files=open_files_data,
                    sockets=sockets_data,
                    permissions=permissions_data
                )
                processes.append(ctx)
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
                
        platform_info = PlatformInfo(
            os="linux",
            release=platform.release(),
            reduced_fidelity=False,
            ebpf_active=False,
            etw_active=False
        )
        
        # Collect services (only if elevated)
        services_data = collect_services() if consent_manager.is_granted() else None

        return TelemetryPayload(
            timestamp=ts,
            platform_info=platform_info,
            system_metrics=sys_metrics,
            processes=processes,
            services=services_data
        )
        
    def cleanup(self) -> None:
        pass
