import os
import structlog
from fastapi import APIRouter, HTTPException, Header, Query
from backend.app.core.crypto import (
    generate_session_token, get_broadcast_key_hex, create_session,
)

logger = structlog.get_logger()
router = APIRouter()

# In production, this comes from env / secrets manager.
# For dev, auto-generate a stable key.
_API_KEY = os.environ.get("KERNELSENSE_API_KEY", "")
if not _API_KEY:
    import hashlib
    _API_KEY = hashlib.sha256(b"dev-api-key-kernelsense").hexdigest()[:32]
    os.environ["KERNELSENSE_API_KEY"] = _API_KEY
    logger.warning("security_warning", msg="KERNELSENSE_API_KEY not set. Falling back to dev-only deterministic key. Do not use in production!")


def _require_api_key(x_api_key: str = Header(default="")):
    """Validate the API key from request header."""
    if not x_api_key or x_api_key != _API_KEY:
        raise HTTPException(status_code=401, detail="Missing or invalid X-Api-Key header")


@router.post("/session")
async def create_dashboard_session(
    x_api_key: str = Header(default=""),
    tier: str = Query("guest", description="RBAC tier to provision (e.g. guest, admin)")
):
    """
    Authenticated session endpoint.
    Returns:
      - A time-limited HMAC auth token (for WebSocket first-message auth)
      - A DERIVED broadcast key (HKDF from master) — NOT the master key
    
    Requires X-Api-Key header.
    """
    _require_api_key(x_api_key)
    
    token = generate_session_token(scope="dashboard", tier=tier, ttl_seconds=3600)
    broadcast_key = get_broadcast_key_hex()
    
    return {
        "token": token,
        "encryption": {
            "algorithm": "AES-256-GCM",
            "key_hex": broadcast_key,  # DERIVED key, not master
            "nonce_bytes": 12,
            "key_derivation": "HKDF-SHA256",
        },
        "expires_in": 3600,
        "note": "This is a session-scoped derived key. The master key never leaves the server."
    }
