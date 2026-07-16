import os
import secrets
import hashlib
import hmac
import json
import time
from typing import Optional

# --- AES-256-GCM Envelope Encryption ---
# Industry standard: same primitive used by AWS KMS, GCP CMEK, TLS 1.3
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def _load_master_key() -> bytes:
    """Load the 256-bit master key from environment. Required in production."""
    key_hex = os.environ.get("KERNELSENSE_MASTER_KEY")
    if key_hex:
        key_bytes = bytes.fromhex(key_hex)
        if len(key_bytes) != 32:
            raise ValueError("KERNELSENSE_MASTER_KEY must be exactly 64 hex chars (32 bytes / 256 bits)")
        return key_bytes
    
    # Dev fallback: deterministic key derived from machine identity so it survives restarts
    # This is NOT secure for production — it's a convenience for local development only.
    machine_seed = f"kernelsense-dev-{os.getenv('COMPUTERNAME', os.getenv('HOSTNAME', 'local'))}"
    key = hashlib.sha256(machine_seed.encode()).digest()
    os.environ["KERNELSENSE_MASTER_KEY"] = key.hex()
    return key

_MASTER_KEY = _load_master_key()
_AESGCM = AESGCM(_MASTER_KEY)

def encrypt_bytes(plaintext: bytes) -> bytes:
    """
    Encrypt with AES-256-GCM. Returns: nonce (12 bytes) || ciphertext+tag.
    Each call generates a unique random nonce, making identical plaintexts
    produce different ciphertexts (semantic security).
    """
    nonce = os.urandom(12)  # 96-bit nonce, NIST recommended for GCM
    ciphertext = _AESGCM.encrypt(nonce, plaintext, None)
    return nonce + ciphertext

def decrypt_bytes(payload: bytes) -> bytes:
    """Decrypt AES-256-GCM payload. Expects: nonce (12 bytes) || ciphertext+tag."""
    if len(payload) < 12:
        raise ValueError("Payload too short to contain nonce")
    nonce = payload[:12]
    ciphertext = payload[12:]
    return _AESGCM.decrypt(nonce, ciphertext, None)

def encrypt_string(data: str) -> str:
    """Encrypt a string, return hex-encoded ciphertext."""
    if not data:
        return data
    raw = encrypt_bytes(data.encode("utf-8"))
    return raw.hex()

def decrypt_string(encrypted_hex: str) -> str:
    """Decrypt a hex-encoded ciphertext back to string."""
    if not encrypted_hex:
        return encrypted_hex
    try:
        raw = bytes.fromhex(encrypted_hex)
        return decrypt_bytes(raw).decode("utf-8")
    except Exception:
        return "[DECRYPTION_FAILED]"

def encrypt_json(data: dict) -> str:
    """Encrypt an entire JSON object. Returns hex-encoded ciphertext."""
    plaintext = json.dumps(data, default=str).encode("utf-8")
    return encrypt_bytes(plaintext).hex()

def decrypt_json(encrypted_hex: str) -> dict:
    """Decrypt a hex-encoded ciphertext back to a JSON dict."""
    raw = bytes.fromhex(encrypted_hex)
    plaintext = decrypt_bytes(raw)
    return json.loads(plaintext.decode("utf-8"))

# --- HMAC Session Tokens ---
# Used for WebSocket auth and access escalation. Time-expiring, no hardcoded secrets.

_TOKEN_SECRET = os.environ.get("KERNELSENSE_TOKEN_SECRET", "")
if not _TOKEN_SECRET:
    # Derive from master key so we don't need a second env var in dev
    _TOKEN_SECRET = hashlib.sha256(b"token-" + _MASTER_KEY).hexdigest()

def generate_session_token(scope: str = "dashboard", ttl_seconds: int = 3600) -> str:
    """Generate an HMAC-signed, time-expiring session token."""
    payload = {
        "scope": scope,
        "exp": int(time.time()) + ttl_seconds,
        "jti": secrets.token_hex(8),  # unique token ID
    }
    payload_json = json.dumps(payload, separators=(",", ":"))
    signature = hmac.new(_TOKEN_SECRET.encode(), payload_json.encode(), hashlib.sha256).hexdigest()
    return f"{payload_json}.{signature}"

def verify_session_token(token: str, required_scope: str = "dashboard") -> bool:
    """Verify an HMAC-signed session token. Returns True if valid and not expired."""
    try:
        parts = token.rsplit(".", 1)
        if len(parts) != 2:
            return False
        payload_json, signature = parts
        expected_sig = hmac.new(_TOKEN_SECRET.encode(), payload_json.encode(), hashlib.sha256).hexdigest()
        if not secrets.compare_digest(signature, expected_sig):
            return False
        payload = json.loads(payload_json)
        if payload.get("exp", 0) < time.time():
            return False
        if payload.get("scope") != required_scope:
            return False
        return True
    except Exception:
        return False

def get_master_key_hex() -> str:
    """Return the hex-encoded master key for session key negotiation."""
    return _MASTER_KEY.hex()
