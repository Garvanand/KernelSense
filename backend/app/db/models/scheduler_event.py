from sqlalchemy import Column, String, Float, BigInteger
from backend.app.db.models.base import Base

class SchedulerEvent(Base):
    __tablename__ = "scheduler_events"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(Float, nullable=False, index=True)
    
    event_type = Column(String, nullable=False, index=True)
    value = Column(BigInteger, nullable=False)
