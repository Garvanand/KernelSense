import asyncio
from sqlalchemy import select, update
from backend.app.db.database import AsyncSessionLocal
from backend.app.db.models.prediction import Prediction
from backend.app.api.ws import manager as ws_manager
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
            
            incidents_payload = []
            updated = False
            for p in predictions:
                payload = p.payload or {}
                if "incident_status" not in payload:
                    payload["incident_status"] = "active" if p.score > 0.8 else "dropped"
                    p.payload = payload
                    session.add(p)
                    updated = True
                    
                if payload.get("incident_status") == "active":
                    incidents_payload.append({
                        "id": str(p.id),
                        "entity_type": p.entity_type,
                        "entity_id": p.entity_id,
                        "incident_type": getattr(p, "anomaly_type", "unknown"),
                        "severity_score": p.score,
                        "explanation": payload.get("explanation", {})
                    })
                    
            if updated:
                await session.commit()
            
            if incidents_payload:
                asyncio.create_task(ws_manager.broadcast("incidents", incidents_payload))
