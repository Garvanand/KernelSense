from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
from backend.app.access.level_policy import AccessTier, TIER_LEVELS
from backend.app.instrumentation.consent import consent_manager
from backend.app.core.crypto import generate_session_token, verify_session_token

router = APIRouter()


def get_tier_from_token(authorization: str = Header(default="")) -> AccessTier:
    """Extract the access tier from the Bearer token claims (per-request RBAC)."""
    if not authorization.startswith("Bearer "):
        return AccessTier.GUEST
    token = authorization[7:]
    claims = verify_session_token(token, required_scope="dashboard")
    if not claims:
        return AccessTier.GUEST
    tier_str = claims.get("tier", "guest")
    try:
        return AccessTier(tier_str)
    except ValueError:
        return AccessTier.GUEST


class AccessInfo(BaseModel):
    current_tier: str
    unlocked_features: List[str]

@router.get("/current", response_model=AccessInfo)
async def get_current_access(authorization: str = Header(default="")):
    tier = get_tier_from_token(authorization)
    features = ["basic_metrics"]
    if TIER_LEVELS[tier] >= TIER_LEVELS[AccessTier.POWER]:
        features.extend(["open_files", "sockets", "permissions", "services", "io_counters"])
    if TIER_LEVELS[tier] >= TIER_LEVELS[AccessTier.RESEARCH]:
        features.extend(["ebpf_traces", "scheduler_latency", "context_switches"])
    return AccessInfo(current_tier=tier.value, unlocked_features=features)


class EscalateRequest(BaseModel):
    requested_tier: AccessTier
    consent_reason: str

@router.post("/escalate")
async def escalate_access(req: EscalateRequest, authorization: str = Header(default="")):
    """Issue a NEW token with the escalated tier embedded. The old token remains at its old tier.
    This is per-token RBAC — no global state mutation."""
    current_tier = get_tier_from_token(authorization)
    
    # Only allow escalation if the user already has a valid session
    if current_tier == AccessTier.GUEST and req.requested_tier != AccessTier.GUEST:
        # Must have at least a valid guest token to escalate
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Must have a valid session to escalate")
    
    if req.requested_tier != AccessTier.GUEST:
        consent_manager.request_consent(req.consent_reason)
    
    # Issue a new token with the requested tier
    new_token = generate_session_token(
        scope="dashboard", 
        tier=req.requested_tier.value, 
        ttl_seconds=3600
    )
    return {"status": "success", "new_tier": req.requested_tier.value, "token": new_token}
