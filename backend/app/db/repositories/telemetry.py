from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.db.models.process_snapshot import ProcessSnapshot
from backend.app.db.models.resource_metric import ResourceMetric

class TelemetryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_latest_resources(self, limit: int = 100) -> List[ResourceMetric]:
        result = await self.session.execute(
            select(ResourceMetric).order_by(desc(ResourceMetric.timestamp)).limit(limit)
        )
        return list(result.scalars().all())

    async def get_latest_processes(self, limit: int = 50) -> List[ProcessSnapshot]:
        # Gets the most recent timestamp first
        latest_ts_result = await self.session.execute(
            select(ProcessSnapshot.timestamp).order_by(desc(ProcessSnapshot.timestamp)).limit(1)
        )
        latest_ts = latest_ts_result.scalar_one_or_none()
        
        if not latest_ts:
            return []
            
        result = await self.session.execute(
            select(ProcessSnapshot)
            .where(ProcessSnapshot.timestamp == latest_ts)
            .order_by(desc(ProcessSnapshot.cpu_percent))
            .limit(limit)
        )
        return list(result.scalars().all())
