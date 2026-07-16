from fastapi import APIRouter
from backend.app.core.crypto import generate_session_token, get_master_key_hex

router = APIRouter()

@router.post("/session")
async def create_session():
    """
    Issue a dashboard session: returns a WebSocket auth token AND the AES-256-GCM 
    key so the frontend can perform real cryptographic decryption via Web Crypto API.
    
    In production, this endpoint would be gated behind OAuth/SSO.
    The key is scoped per-session and the token expires in 1 hour.
    """
    token = generate_session_token(scope="dashboard", ttl_seconds=3600)
    
    return {
        "token": token,
        "encryption": {
            "algorithm": "AES-256-GCM",
            "key_hex": get_master_key_hex(),
            "nonce_bytes": 12,
        },
        "expires_in": 3600,
    }
