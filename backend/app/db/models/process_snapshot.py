from sqlalchemy import Column, Integer, String, Float, BigInteger
from backend.app.db.models.base import Base

class ProcessSnapshot(Base):
    __tablename__ = "process_snapshots"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    timestamp = Column(Float, nullable=False, index=True)
    
    pid = Column(Integer, nullable=False, index=True)
    ppid = Column(Integer, nullable=True)
    name = Column(String, nullable=False)
    status = Column(String, nullable=False)
    create_time = Column(Float, nullable=False)
    
    cpu_percent = Column(Float, nullable=False)
    mem_rss_bytes = Column(BigInteger, nullable=False)
    mem_vms_bytes = Column(BigInteger, nullable=False)
    num_threads = Column(Integer, nullable=False)
    
    io_read_bytes = Column(BigInteger, nullable=True)
    io_write_bytes = Column(BigInteger, nullable=True)
