import asyncio
import os
import sys
import time
import random

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from backend.app.db.database import engine, AsyncSessionLocal
from backend.app.db.models.base import Base
from backend.app.db.models.resource_metric import ResourceMetric
from backend.app.db.models.process_snapshot import ProcessSnapshot

async def populate():
    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("Populating DB with synthetic telemetry for ML training...")
    
    async with AsyncSessionLocal() as session:
        async with session.begin():
            # Generate 200 time steps
            base_ts = time.time() - 200
            for i in range(200):
                ts = base_ts + i
                
                # Resource Metric
                rm = ResourceMetric(
                    timestamp=ts,
                    cpu_user_percent=random.uniform(5.0, 20.0),
                    cpu_system_percent=random.uniform(2.0, 10.0),
                    cpu_idle_percent=random.uniform(70.0, 93.0),
                    mem_total_bytes=16*1024*1024*1024,
                    mem_used_bytes=random.uniform(4, 12)*1024*1024*1024,
                    mem_percent=random.uniform(25.0, 75.0),
                    disk_read_bytes=random.randint(0, 1000000),
                    disk_write_bytes=random.randint(0, 1000000),
                    net_bytes_sent=random.randint(0, 1000000),
                    net_bytes_recv=random.randint(0, 1000000)
                )
                session.add(rm)
                
                # Process Snapshots (3 dummy processes per timestep)
                for pid in [100, 200, 300]:
                    ps = ProcessSnapshot(
                        timestamp=ts,
                        pid=pid,
                        ppid=1,
                        name=f"process_{pid}",
                        status="running",
                        create_time=base_ts - 1000,
                        cpu_percent=random.uniform(0.1, 5.0),
                        mem_rss_bytes=random.randint(10000000, 50000000),
                        mem_vms_bytes=random.randint(50000000, 100000000),
                        num_threads=random.randint(1, 10),
                        io_read_bytes=0,
                        io_write_bytes=0,
                        open_files=[{"path": "/tmp/test", "fd": 3}] if pid == 100 else None,
                        sockets=[],
                        permissions={"username": "test_user"}
                    )
                    session.add(ps)
                    
        await session.commit()
    print("Database populated.")

if __name__ == "__main__":
    asyncio.run(populate())
