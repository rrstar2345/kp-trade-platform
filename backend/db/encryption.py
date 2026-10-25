"""
AES-256-GCM encryption for sensitive fields stored in SQLite.
Uses the ENCRYPTION_KEY from settings (32-byte hex string).
"""
import base64
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from ..config import settings


def _get_key() -> bytes:
    key_hex = settings.ENCRYPTION_KEY
    if not key_hex:
        raise RuntimeError("ENCRYPTION_KEY is not set")
    key = bytes.fromhex(key_hex)
    if len(key) != 32:
        raise RuntimeError("ENCRYPTION_KEY must be exactly 32 bytes (64 hex chars)")
    return key


def encrypt(plaintext: str) -> str:
    """Encrypt a string. Returns a base64-encoded nonce+ciphertext string."""
    if not plaintext:
        return ""
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
    blob = nonce + ciphertext
    return base64.b64encode(blob).decode()


def decrypt(token: str) -> str:
    """Decrypt a base64-encoded nonce+ciphertext string. Returns plaintext."""
    if not token:
        return ""
    key = _get_key()
    aesgcm = AESGCM(key)
    blob = base64.b64decode(token.encode())
    nonce = blob[:12]
    ciphertext = blob[12:]
    return aesgcm.decrypt(nonce, ciphertext, None).decode()
