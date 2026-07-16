from pydantic_settings import BaseSettings, SettingsConfigDict
import uuid
import os

def _get_or_create_agent_id() -> str:
    """Generate a persistent agent UUID stored in a dotfile."""
    id_file = os.path.join(os.path.expanduser("~"), ".kernelsense_agent_id")
    if os.path.exists(id_file):
        return open(id_file).read().strip()
    agent_id = str(uuid.uuid4())
    with open(id_file, "w") as f:
        f.write(agent_id)
    return agent_id

class Settings(BaseSettings):
    PROJECT_NAME: str = "KernelSense"
    PROJECT_TAGLINE: str = "Predictive OS Observatory"
    API_V1_STR: str = "/api/v1"
    
    # Agent identity (unique per installation)
    AGENT_ID: str = _get_or_create_agent_id()
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./kernelsense.db"
    
    # Telemetry configuration
    SAMPLING_INTERVAL_SEC: float = 1.0
    INGEST_BATCH_SIZE: int = 50
    
    # Data retention: auto-purge records older than this (seconds)
    DATA_RETENTION_SEC: int = 3600
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()

