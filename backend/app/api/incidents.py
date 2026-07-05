from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.db.database import get_db
from backend.app.db.models.prediction import Prediction
from backend.app.llm.explain_incident import generate_incident_explanation, IncidentExplanationRequest, IncidentExplanationResponse
from backend.app.access.state import AccessState
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class IncidentResponse(BaseModel):
    id: int
    timestamp: float
    entity_type: str
    entity_id: str
    incident_type: str
    severity_score: float
    explanation: Optional[IncidentExplanationResponse] = None

@router.get("/", response_model=List[IncidentResponse])
async def get_active_incidents(db: AsyncSession = Depends(get_db)):
    """Get active incidents verified by the Incident Engine and optionally explained by the LLM."""
    
    tier = AccessState.get_tier()
    
    # We fetch rows from Prediction table where payload['incident_status'] == 'active'
    stmt = (
        select(Prediction)
        .order_by(desc(Prediction.timestamp))
        .limit(10)
    )
    result = await db.execute(stmt)
    predictions = result.scalars().all()
    
    incidents = []
    
    for p in predictions:
        payload = p.payload or {}
        # The Incident Engine marks predictions as 'active' if they cross the threshold
        if payload.get("incident_status") == "active":
            
            explanation = None
            # Only provide LLM Root Cause analysis if clearance is high enough
            if tier in ["research", "kernel", "power"]:
                req = IncidentExplanationRequest(
                    prediction_type=p.prediction_type,
                    entity_id=p.entity_id,
                    score=p.score,
                    confidence=p.confidence or 0.0,
                    telemetry_signals={"raw_score": p.score} # Minimal context
                )
                # This fetches from the local cache if already processed to bound costs
                explanation = await generate_incident_explanation(p.id, req)
            
            incidents.append(IncidentResponse(
                id=p.id,
                timestamp=p.timestamp,
                entity_type=p.entity_type,
                entity_id=p.entity_id,
                incident_type=p.prediction_type,
                severity_score=p.score,
                explanation=explanation
            ))
            
    return incidents
