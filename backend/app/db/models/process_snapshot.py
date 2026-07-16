from sqlalchemy import Column, Integer, String, Float, BigInteger, JSON
from sqlalchemy.types import TypeDecorator, String as SQLAlchemyString, JSON as SQLAlchemyJSON
from backend.app.db.models.base import Base
from backend.app.core.crypto import encrypt_string, decrypt_string

class EncryptedString(TypeDecorator):
    impl = SQLAlchemyString
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return encrypt_string(value) if value else value

    def process_result_value(self, value, dialect):
        return decrypt_string(value) if value else value



class ProcessSnapshot(Base):
    __tablename__ = "process_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(Float, nullable=False, index=True)
    
    pid = Column(Integer, nullable=False, index=True)
    ppid = Column(Integer, nullable=True)
    
    # Meaningful security encryption on sensitive data at rest
    name = Column(EncryptedString, nullable=False)
    
    status = Column(String, nullable=False)
    create_time = Column(Float, nullable=False)
    
    cpu_percent = Column(Float, nullable=False)
    mem_rss_bytes = Column(BigInteger, nullable=False)
    mem_vms_bytes = Column(BigInteger, nullable=False)
    num_threads = Column(Integer, nullable=False)
    
    io_read_bytes = Column(BigInteger, nullable=True)
    io_write_bytes = Column(BigInteger, nullable=True)
    
    # Deep OS fields stored as JSON
    open_files = Column(JSON, nullable=True)
    sockets = Column(JSON, nullable=True)
    permissions = Column(JSON, nullable=True)
