import os
from cryptography.fernet import Fernet
from typing import Optional

# Generate a consistent key for development, or load from env
_SECRET_KEY = os.environ.get("KERNELSENSE_SECRET_KEY")
if not _SECRET_KEY:
    # Use a hardcoded key for local dev so it doesn't break across reloads
    # In production, this MUST come from the environment
    _SECRET_KEY = Fernet.generate_key().decode('utf-8')
    os.environ["KERNELSENSE_SECRET_KEY"] = _SECRET_KEY

fernet = Fernet(_SECRET_KEY.encode('utf-8'))

def encrypt_string(data: str) -> str:
    """Encrypts a string and returns the urlsafe base64-encoded encrypted string."""
    if not data:
        return data
    return fernet.encrypt(data.encode('utf-8')).decode('utf-8')

def decrypt_string(encrypted_data: str) -> str:
    """Decrypts a urlsafe base64-encoded encrypted string back to the original string."""
    if not encrypted_data:
        return encrypted_data
    try:
        return fernet.decrypt(encrypted_data.encode('utf-8')).decode('utf-8')
    except Exception:
        # If decryption fails (e.g. old data before encryption was added), return fallback or original
        return "[DECRYPTION_FAILED] " + str(encrypted_data)

def encrypt_dict(data: dict) -> dict:
    """Recursively encrypts string values in a dictionary."""
    encrypted = {}
    for k, v in data.items():
        if isinstance(v, str):
            encrypted[k] = encrypt_string(v)
        elif isinstance(v, dict):
            encrypted[k] = encrypt_dict(v)
        elif isinstance(v, list):
            encrypted[k] = [encrypt_string(i) if isinstance(i, str) else i for i in v]
        else:
            encrypted[k] = v
    return encrypted
