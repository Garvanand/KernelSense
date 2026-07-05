import asyncio
from sqlalchemy import select, update
from backend.app.db.database import AsyncSessionLocal
from backend.app.db.models.prediction import Prediction
# Using the predictions table to also store incidents to avoid a schema migration
# We will encode 'incident_status' in the payload JSON: 'unconfirmed', 'active', 'resolved'

class IncidentEngineWorker:
    def __init__(self):
        self.running = False
        
    async def start(self):
        self.running = True
        print("Starting Incident Engine Worker...")
        asyncio.create_task(self._loop())
        
    async def stop(self):
        self.running = False
        
    async def _loop(self):
        while self.running:
            try:
                await self._process_predictions()
            except Exception as e:
                print(f"Error in Incident Engine: {e}")
            await asyncio.sleep(5) # Poll every 5 seconds
            
    async def _process_predictions(self):
        async with AsyncSessionLocal() as session:
            # Look for recent predictions with high confidence that haven't been promoted to incidents
            stmt = select(Prediction).where(Prediction.confidence > 0.85)
            result = await session.execute(stmt)
            predictions = result.scalars().all()
            
            for p in predictions:
                payload = p.payload or {}
                # Only process if it hasn't been evaluated
                if "incident_status" not in payload:
                    # Threshold check: requires a score above 0.8
                    if p.score > 0.8:
                        payload["incident_status"] = "active"
                    else:
                        payload["incident_status"] = "dropped"
                        
                    # Update row
                    p.payload = payload
                    session.add(p)
                    
            await session.commit()
