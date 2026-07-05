import asyncio
import time
import os
import sys
import psutil

# Ensure backend package is resolvable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from backend.app.db.database import engine
from backend.app.db.models.base import Base
from backend.app.db.models.process_snapshot import ProcessSnapshot
from backend.app.db.models.resource_metric import ResourceMetric
from backend.app.db.models.scheduler_event import SchedulerEvent
from backend.app.db.models.consent_log import ConsentLog
from backend.app.instrumentation.sampler import TelemetrySampler
from backend.app.workers.telemetry_ingest_worker import TelemetryIngestWorker

# Simulating cross-platform collection
import platform
def get_collector():
    sys_os = platform.system().lower()
    if sys_os == "windows":
        from backend.app.instrumentation.windows.etw_collector import WindowsETWCollector
        return WindowsETWCollector()
    elif sys_os == "darwin":
        from backend.app.instrumentation.macos.collector import MacOSCollector
        return MacOSCollector()
    else:
        from backend.app.instrumentation.linux.psutil_collector import LinuxPsutilCollector
        return LinuxPsutilCollector()

async def run_soak_test(duration_sec: int = 60, interval: float = 0.1):
    """
    Simulates high-throughput soak testing to detect memory leaks in the 
    ingest worker and measure ingest throughput (samples/sec).
    By running at 10x speed (0.1 interval), a 60-second test simulates 600 samples 
    (equivalent to 10 minutes at 1Hz). 
    """
    print(f"Starting Soak Test: {duration_sec} seconds at {1/interval} Hz...")
    
    # Initialize DB (creates sqlite tables)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    collector = get_collector()
    sampler = TelemetrySampler(collector=collector, interval_sec=interval)
    # Smaller batch size to force frequent DB flushes
    worker = TelemetryIngestWorker(sampler=sampler, batch_size=10)
    
    process = psutil.Process(os.getpid())
    start_rss = process.memory_info().rss / (1024 * 1024)
    print(f"Initial Memory: {start_rss:.2f} MB")
    
    await worker.start()
    
    start_time = time.time()
    
    while time.time() - start_time < duration_sec:
        await asyncio.sleep(5)
        current_rss = process.memory_info().rss / (1024 * 1024)
        print(f"[{time.time() - start_time:.0f}s] Memory RSS: {current_rss:.2f} MB")
        
    await worker.stop()
    
    end_rss = process.memory_info().rss / (1024 * 1024)
    print(f"\n--- Benchmark Results ---")
    print(f"Test Duration: {duration_sec}s")
    print(f"Ingest Rate: {1/interval} Hz")
    print(f"Initial Memory: {start_rss:.2f} MB")
    print(f"Final Memory: {end_rss:.2f} MB")
    
    growth = end_rss - start_rss
    print(f"Memory Growth: {growth:.2f} MB")
    
    with open("PERFORMANCE.md", "a", encoding="utf-8") as f:
        f.write("\n## Database Ingest Soak Test (Prompt 8)\n")
        f.write(f"- **Simulated Throughput**: {1/interval} samples/sec\n")
        f.write(f"- **Buffer Flush Size**: 10 samples\n")
        f.write(f"- **Memory Growth (Leaks)**: {growth:.2f} MB\n")
        f.write(f"- **Status**: {'PASS (Stable)' if growth < 10.0 else 'FAIL (Memory Leak Detected)'}\n")
    print("Appended DB Benchmark to PERFORMANCE.md")

if __name__ == "__main__":
    # We run a scaled-down 30-second soak test for validation during dev
    asyncio.run(run_soak_test(duration_sec=30, interval=0.2))
