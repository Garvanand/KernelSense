from sqlalchemy import Column, String, Float, Boolean, BigInteger
from backend.app.db.models.base import Base

class ConsentLog(Base):
    __tablename__ = "consent_logs"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    timestamp = Column(Float, nullable=False)
    reason = Column(String, nullable=False)
    granted = Column(Boolean, nullable=False)
