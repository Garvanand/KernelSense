from fastapi import APIRouter
from backend.app.ml.incident_engine import inject_anomaly

router = APIRouter()

@router.post("/inject-anomaly")
async def trigger_demo_anomaly(anomaly_type: str = "leak_anomaly", entity_id: str = "demo-process"):
    """
    Triggers an artificial anomaly for demonstration purposes.
    Supported types: leak_anomaly, deadlock_risk, cpu_spike
    """
    # This invokes the incident engine to broadcast an artificial anomaly
    # The incident engine needs a method to directly broadcast or inject this into the DB
    # We will simulate it by injecting into the incident queue or predictions table.
    
    await inject_anomaly(anomaly_type, entity_id, 0.95, 0.99)
    return {"status": "success", "message": f"Injected {anomaly_type} for {entity_id}"}
