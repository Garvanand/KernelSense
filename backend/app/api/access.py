from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List
from backend.app.access.level_policy import AccessTier, TIER_LEVELS
from backend.app.access.state import AccessState
from backend.app.instrumentation.consent import consent_manager

router = APIRouter()

class AccessInfo(BaseModel):
    current_tier: str
    unlocked_features: List[str]

@router.get("/current", response_model=AccessInfo)
async def get_current_access():
    tier = AccessState.get_tier()
    features = ["basic_metrics"]
    if TIER_LEVELS[tier] >= TIER_LEVELS[AccessTier.POWER]:
        features.extend(["open_files", "sockets", "permissions", "services", "io_counters"])
    if TIER_LEVELS[tier] >= TIER_LEVELS[AccessTier.RESEARCH]:
        features.extend(["ebpf_traces", "scheduler_latency", "context_switches"])
        
    return AccessInfo(
        current_tier=tier.value,
        unlocked_features=features
    )

class EscalateRequest(BaseModel):
    requested_tier: AccessTier
    consent_reason: str

@router.post("/escalate")
async def escalate_access(req: EscalateRequest):
    # Simulated capability check & consent flow
    if req.requested_tier != AccessTier.GUEST:
        consent_manager.request_consent(req.consent_reason)
        
    AccessState.set_tier(req.requested_tier)
    return {"status": "success", "new_tier": req.requested_tier.value}
