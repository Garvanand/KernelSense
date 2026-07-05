from sqlalchemy import Column, Integer, String, Float, JSON
from backend.app.db.models.base import Base

class Prediction(Base):
    __tablename__ = 'predictions'
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(Float, index=True, nullable=False)
    
    # "process" or "host"
    entity_type = Column(String, index=True, nullable=False)
    
    # PID or host identifier
    entity_id = Column(String, index=True, nullable=False)
    
    # "forecasting", "leak_anomaly", "deadlock_risk"
    prediction_type = Column(String, index=True, nullable=False)
    
    score = Column(Float, nullable=False)
    confidence = Column(Float, nullable=True)
    
    # Details like predicted time to saturation or top contributing features
    payload = Column(JSON, nullable=True)
