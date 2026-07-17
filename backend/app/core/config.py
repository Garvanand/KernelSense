from pydantic_settings import BaseSettings, SettingsConfigDict
import uuid
import os

def _get_or_create_agent_id() -> str:
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
    
    AGENT_ID: str = _get_or_create_agent_id()
    DATABASE_URL: str = "sqlite+aiosqlite:///./kernelsense.db"
    
    # Telemetry
    SAMPLING_INTERVAL_SEC: float = 1.0
    INGEST_BATCH_SIZE: int = 50
    DATA_RETENTION_SEC: int = 3600
    
    # Architecture: separate agent from server
    COLLECTOR_ENABLED: bool = True  # Set False to run server-only (no local collector)
    
    # Alerting thresholds
    ALERT_CPU_THRESHOLD: float = 90.0  # percent
    ALERT_MEM_THRESHOLD: float = 85.0  # percent
    ALERT_WEBHOOK_URL: str = ""  # Slack/PagerDuty webhook
    
    # Anomaly detection
    ANOMALY_ZSCORE_THRESHOLD: float = 2.5
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()


