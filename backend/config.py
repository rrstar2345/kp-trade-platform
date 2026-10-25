import secrets
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./kp_trade.db"
    ENCRYPTION_KEY: str = ""          # 32-byte hex; auto-generated on first run if missing
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

# Auto-generate and persist an encryption key if none is set
_key_file = Path(".secret_key")

if not settings.ENCRYPTION_KEY:
    if _key_file.exists():
        settings.ENCRYPTION_KEY = _key_file.read_text().strip()
    else:
        key = secrets.token_hex(32)
        _key_file.write_text(key)
        _key_file.chmod(0o600)
        settings.ENCRYPTION_KEY = key
        print("[startup] Generated new encryption key → .secret_key (keep this file safe)")
