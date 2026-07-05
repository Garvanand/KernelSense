import psutil
import time
import platform
from backend.app.instrumentation.common.schema import ProcessContext, SystemMetrics, PlatformInfo, TelemetryPayload
from backend.app.instrumentation.common.base import BaseCollector

class LinuxPsutilCollector(BaseCollector):
    def __init__(self):
        # Initialize initial CPU times to get valid percentages
        psutil.cpu_percent(percpu=True)
        psutil.cpu_times_percent()
        
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
            linux_load_avg=load_avg
        )
        
        processes = []
        for proc in psutil.process_iter(['pid', 'ppid', 'name', 'status', 'create_time', 'cpu_percent', 'memory_info', 'num_threads']):
            try:
                info = proc.info
                mem_info = info.get('memory_info')
                
                io_read, io_write = None, None
                try:
                    io_counters = proc.io_counters()
                    io_read = io_counters.read_bytes
                    io_write = io_counters.write_bytes
                except (psutil.AccessDenied, psutil.ZombieProcess, AttributeError):
                    pass
                
                num_fds = None
                try:
                    num_fds = proc.num_fds()
                except (psutil.AccessDenied, psutil.ZombieProcess, AttributeError, NotImplementedError):
                    pass
                    
                cpu_affinity = None
                try:
                    cpu_affinity = proc.cpu_affinity()
                except (psutil.AccessDenied, psutil.ZombieProcess, AttributeError, NotImplementedError):
                    pass

                processes.append(ProcessContext(
                    pid=info['pid'],
                    ppid=info.get('ppid'),
                    name=info.get('name') or "",
                    status=info.get('status') or "",
                    create_time=info.get('create_time') or 0.0,
                    cpu_percent=info.get('cpu_percent') or 0.0,
                    mem_rss_bytes=mem_info.rss if mem_info else 0,
                    mem_vms_bytes=mem_info.vms if mem_info else 0,
                    num_threads=info.get('num_threads') or 0,
                    io_read_bytes=io_read,
                    io_write_bytes=io_write,
                    num_fds=num_fds,
                    cpu_affinity=cpu_affinity
                ))
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
                
        platform_info = PlatformInfo(
            os="linux",
            release=platform.release(),
            reduced_fidelity=False,
            ebpf_active=False,
            etw_active=False
        )
        
        return TelemetryPayload(
            timestamp=ts,
            platform_info=platform_info,
            system_metrics=sys_metrics,
            processes=processes
        )
        
    def cleanup(self) -> None:
        pass
