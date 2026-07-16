from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List
from backend.app.access.level_policy import AccessTier, TIER_LEVELS
from backend.app.access.state import AccessState
from backend.app.instrumentation.consent import consent_manager
from backend.app.core.crypto import generate_session_token, verify_session_token

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
        
    return AccessInfo(current_tier=tier.value, unlocked_features=features)

@router.post("/token")
async def get_escalation_token():
    """Issue a time-limited HMAC token for access escalation. 
    In production, this would be gated behind an OAuth/SSO flow."""
    token = generate_session_token(scope="escalate", ttl_seconds=300)
    return {"token": token, "expires_in": 300}

class EscalateRequest(BaseModel):
    requested_tier: AccessTier
    consent_reason: str
    security_token: str

@router.post("/escalate")
async def escalate_access(req: EscalateRequest):
    # Verify HMAC-signed, time-expiring token (no hardcoded secrets)
    if req.requested_tier != AccessTier.GUEST:
        if not verify_session_token(req.security_token, required_scope="escalate"):
            raise HTTPException(status_code=403, detail="Invalid or expired security token")
        consent_manager.request_consent(req.consent_reason)
        
    AccessState.set_tier(req.requested_tier)
    return {"status": "success", "new_tier": req.requested_tier.value}

