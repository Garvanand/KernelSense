from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "KernelSense"
    API_V1_STR: str = "/api/v1"
    
    # Defaults to a local sqlite file for dev/soak testing without Docker
    DATABASE_URL: str = "sqlite+aiosqlite:///./kernelsense.db"
    
    # Telemetry configuration
    SAMPLING_INTERVAL_SEC: float = 1.0
    INGEST_BATCH_SIZE: int = 50
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()
