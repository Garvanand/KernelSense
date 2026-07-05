from sqlalchemy import Column, Integer, Float, BigInteger, String
from backend.app.db.models.base import Base

class ResourceMetric(Base):
    __tablename__ = "resource_metrics"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    timestamp = Column(Float, nullable=False, index=True)
    
    cpu_user_percent = Column(Float, nullable=False)
    cpu_system_percent = Column(Float, nullable=False)
    cpu_idle_percent = Column(Float, nullable=False)
    
    mem_total_bytes = Column(BigInteger, nullable=False)
    mem_used_bytes = Column(BigInteger, nullable=False)
    mem_percent = Column(Float, nullable=False)
    
    disk_read_bytes = Column(BigInteger, nullable=False)
    disk_write_bytes = Column(BigInteger, nullable=False)
    net_bytes_sent = Column(BigInteger, nullable=False)
    net_bytes_recv = Column(BigInteger, nullable=False)
    
    # Platform-specific nullable fields
    linux_iowait_percent = Column(Float, nullable=True)
    macos_wired_bytes = Column(BigInteger, nullable=True)
    windows_commit_bytes = Column(BigInteger, nullable=True)
