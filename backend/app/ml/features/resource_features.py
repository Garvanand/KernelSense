import numpy as np
from typing import List, Dict, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.db.models.resource_metric import ResourceMetric

async def extract_sliding_window(session: AsyncSession, window_size: int = 60) -> Tuple[np.ndarray, np.ndarray]:
    """
    Extracts a sliding window of recent system resource metrics.
    Returns:
        X: (window_size, num_features) tensor of normalized features
        y: (window_size, 1) tensor of targets (e.g., cpu_percent or mem_percent to forecast)
    """
    stmt = select(ResourceMetric).order_by(ResourceMetric.timestamp.desc()).limit(window_size)
    result = await session.execute(stmt)
    metrics = result.scalars().all()
    
    if len(metrics) < window_size:
        # Pad with zeros if insufficient data
        padding = window_size - len(metrics)
        metrics = metrics + [metrics[-1]] * padding if metrics else [None] * padding
        
    # Features: [cpu_user, cpu_system, mem_percent, disk_read, disk_write, net_sent, net_recv]
    X = []
    y = [] # Target: overall memory percent
    
    for m in reversed(metrics):
        if m is None:
            X.append([0.0]*7)
            y.append(0.0)
            continue
            
        feat = [
            m.cpu_user_percent / 100.0,
            m.cpu_system_percent / 100.0,
            m.mem_percent / 100.0,
            float(m.disk_read_bytes) / 1e9, # Normalize to GB
            float(m.disk_write_bytes) / 1e9,
            float(m.net_bytes_sent) / 1e6, # Normalize to MB
            float(m.net_bytes_recv) / 1e6
        ]
        X.append(feat)
        y.append([m.mem_percent / 100.0])
        
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.float32)
