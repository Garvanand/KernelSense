import time
import sys
import platform
import os

# Ensure backend package is resolvable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

def get_collector():
    sys_os = platform.system().lower()
    if sys_os == "windows":
        from backend.app.instrumentation.windows.etw_collector import WindowsETWCollector
        return WindowsETWCollector()
    elif sys_os == "darwin":
        from backend.app.instrumentation.macos.collector import MacOSCollector
        return MacOSCollector()
    else:
        from backend.app.instrumentation.linux.ebpf_collector import LinuxEBPFCollector
        return LinuxEBPFCollector()

def run_benchmark(iterations=5):
    print(f"Starting live benchmark for {iterations} iterations on {platform.system()}...", flush=True)
    collector = get_collector()
    
    total_duration = 0.0
    
    # Warmup
    collector.collect()
    
    for i in range(iterations):
        start = time.perf_counter()
        payload = collector.collect()
        duration = time.perf_counter() - start
        
        total_duration += duration
        
        if i % 1 == 0:
            print(f"Iteration {i}: Collected {len(payload.processes)} processes in {duration*1000:.2f}ms", flush=True)
            
    avg_ms = (total_duration / iterations) * 1000
    overhead_pct = (avg_ms / 1000.0) * 100 # assuming 1.0s interval
    
    print(f"\n--- Benchmark Results ---")
    print(f"Platform: {platform.system()}")
    print(f"Average latency per collection: {avg_ms:.2f}ms")
    print(f"CPU Overhead at 1Hz sampling: {overhead_pct:.2f}% (Budget: <2%)")
    
    with open("PERFORMANCE.md", "w") as f:
        f.write("# Telemetry Collection Performance\n\n")
        f.write(f"- **Platform**: {platform.system()}\n")
        f.write(f"- **Average collection latency**: {avg_ms:.2f}ms\n")
        f.write(f"- **Estimated CPU Overhead (1Hz)**: {overhead_pct:.2f}%\n")
        f.write(f"- **Status**: {'PASS' if overhead_pct < 2.0 else 'FAIL (Exceeds budget)'}\n")
    print("Results written to PERFORMANCE.md")

if __name__ == "__main__":
    run_benchmark()
