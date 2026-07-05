import time
import structlog
from typing import Optional
from backend.app.instrumentation.common.schema import TelemetryPayload
from backend.app.instrumentation.consent import consent_manager
from backend.app.instrumentation.linux.psutil_collector import LinuxPsutilCollector

logger = structlog.get_logger()

# Try importing bcc, but allow graceful degradation
try:
    from bcc import BPF
    BCC_AVAILABLE = True
except ImportError:
    BCC_AVAILABLE = False
    logger.warning("ebpf_collector", msg="bcc package not found. eBPF will be disabled.")

class LinuxEBPFCollector(LinuxPsutilCollector):
    def __init__(self):
        super().__init__()
        self.bpf = None
        self.active = False
        
        if BCC_AVAILABLE and consent_manager.is_granted():
            try:
                # Stub program for sched_switch
                bpf_text = """
                #include <uapi/linux/ptrace.h>
                #include <linux/sched.h>
                
                BPF_HASH(context_switches, u32, u64);
                
                TRACEPOINT_PROBE(sched, sched_switch) {
                    u32 key = 0;
                    u64 *val, zero = 0;
                    val = context_switches.lookup_or_init(&key, &zero);
                    (*val)++;
                    return 0;
                }
                """
                self.bpf = BPF(text=bpf_text)
                self.active = True
                logger.info("ebpf_collector_initialized")
            except Exception as e:
                logger.error("ebpf_collector_failed", error=str(e))
                self.active = False
                self.bpf = None
        
    def collect(self) -> TelemetryPayload:
        payload = super().collect()
        
        payload.platform_info.ebpf_active = self.active
        
        if self.active and self.bpf:
            try:
                # Extract data from eBPF map
                context_switches = self.bpf["context_switches"]
                key = context_switches.Key(0)
                if key in context_switches:
                    payload.system_metrics.linux_ebpf_context_switches = context_switches[key].value
                else:
                    payload.system_metrics.linux_ebpf_context_switches = 0
            except Exception as e:
                logger.error("ebpf_collect_error", error=str(e))
                
        return payload

    def cleanup(self) -> None:
        if self.bpf:
            self.bpf.cleanup()
            self.bpf = None
        self.active = False
