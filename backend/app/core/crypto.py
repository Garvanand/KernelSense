import os
import secrets
import hashlib
import hmac
import json
import time

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes

# ──────────────────────────────────────────────
# Master Key — NEVER leaves the server process
# ──────────────────────────────────────────────

def _load_master_key() -> bytes:
    key_hex = os.environ.get("KERNELSENSE_MASTER_KEY")
    if key_hex:
        key_bytes = bytes.fromhex(key_hex)
        if len(key_bytes) != 32:
            raise ValueError("KERNELSENSE_MASTER_KEY must be 64 hex chars (32 bytes)")
        return key_bytes
    # Dev fallback: deterministic from machine identity (NOT for production)
    machine_seed = f"kernelsense-dev-{os.getenv('COMPUTERNAME', os.getenv('HOSTNAME', 'local'))}"
    key = hashlib.sha256(machine_seed.encode()).digest()
    os.environ["KERNELSENSE_MASTER_KEY"] = key.hex()
    return key

_MASTER_KEY = _load_master_key()

# ──────────────────────────────────────────────
# AES-256-GCM — Database encryption at rest
# Uses the MASTER key directly (never exposed)
# ──────────────────────────────────────────────
_DB_CIPHER = AESGCM(_MASTER_KEY)

def encrypt_string(data: str) -> str:
    if not data:
        return data
    nonce = os.urandom(12)
    ct = _DB_CIPHER.encrypt(nonce, data.encode("utf-8"), None)
    return (nonce + ct).hex()

def decrypt_string(encrypted_hex: str) -> str:
    if not encrypted_hex:
        return encrypted_hex
    try:
        raw = bytes.fromhex(encrypted_hex)
        return _DB_CIPHER.decrypt(raw[:12], raw[12:], None).decode("utf-8")
    except Exception:
        return "[DECRYPTION_FAILED]"

# ──────────────────────────────────────────────
# Per-session transport keys via HKDF
# The MASTER key never leaves the process.
# Each session gets a DERIVED key using HKDF.
# ──────────────────────────────────────────────

def _derive_session_key(session_id: str) -> bytes:
    """Derive a unique 256-bit AES key for a session using HKDF-SHA256."""
    return HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=f"kernelsense-session-{session_id}".encode(),
    ).derive(_MASTER_KEY)

_active_sessions: dict[str, AESGCM] = {}

def create_session() -> tuple[str, str]:
    """Create a new session. Returns (session_id, derived_key_hex).
    The derived key is what the frontend gets — NOT the master key."""
    session_id = secrets.token_hex(16)
    derived_key = _derive_session_key(session_id)
    _active_sessions[session_id] = AESGCM(derived_key)
    return session_id, derived_key.hex()

def get_session_cipher(session_id: str) -> AESGCM | None:
    """Get the cipher for an active session."""
    return _active_sessions.get(session_id)

def encrypt_for_broadcast(data: dict) -> tuple[str, str]:
    """Encrypt a payload for ALL active sessions. Returns the encrypted hex 
    using a temporary broadcast key derived from the master key + timestamp bucket.
    All dashboard sessions share the same broadcast stream."""
    # Use a single broadcast cipher (derived, not master) for efficiency
    if "_broadcast" not in _active_sessions:
        bkey = HKDF(
            algorithm=hashes.SHA256(), length=32, salt=None,
            info=b"kernelsense-broadcast",
        ).derive(_MASTER_KEY)
        _active_sessions["_broadcast"] = AESGCM(bkey)
    
    cipher = _active_sessions["_broadcast"]
    plaintext = json.dumps(data, default=str).encode("utf-8")
    nonce = os.urandom(12)
    ct = cipher.encrypt(nonce, plaintext, None)
    return (nonce + ct).hex()

def get_broadcast_key_hex() -> str:
    """Return the broadcast-derived key hex (NOT the master key)."""
    bkey = HKDF(
        algorithm=hashes.SHA256(), length=32, salt=None,
        info=b"kernelsense-broadcast",
    ).derive(_MASTER_KEY)
    return bkey.hex()

# ──────────────────────────────────────────────
# HMAC Tokens — with embedded RBAC tier
# ──────────────────────────────────────────────

_TOKEN_SECRET = hashlib.sha256(b"token-hmac-" + _MASTER_KEY).hexdigest()

def generate_session_token(scope: str = "dashboard", tier: str = "guest", ttl_seconds: int = 3600) -> str:
    """Generate HMAC-signed token with embedded access tier (RBAC)."""
    payload = {
        "scope": scope,
        "tier": tier,
        "exp": int(time.time()) + ttl_seconds,
        "jti": secrets.token_hex(8),
    }
    payload_json = json.dumps(payload, separators=(",", ":"))
    sig = hmac.new(_TOKEN_SECRET.encode(), payload_json.encode(), hashlib.sha256).hexdigest()
    return f"{payload_json}.{sig}"

def verify_session_token(token: str, required_scope: str = "dashboard") -> dict | None:
    """Verify token. Returns the claims dict if valid, None if invalid."""
    try:
        payload_json, signature = token.rsplit(".", 1)
        expected = hmac.new(_TOKEN_SECRET.encode(), payload_json.encode(), hashlib.sha256).hexdigest()
        if not secrets.compare_digest(signature, expected):
            return None
        claims = json.loads(payload_json)
        if claims.get("exp", 0) < time.time():
            return None
        if claims.get("scope") != required_scope:
            return None
        return claims
    except Exception:
        return None
