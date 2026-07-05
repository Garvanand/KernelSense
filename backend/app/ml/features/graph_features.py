import numpy as np
from typing import List, Tuple, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.db.models.process_snapshot import ProcessSnapshot

async def build_adjacency_matrix(session: AsyncSession) -> Tuple[np.ndarray, np.ndarray, Dict[int, int]]:
    """
    Builds a graph representation of the current process state.
    Returns:
        nodes: (num_nodes, num_node_features) Process features (cpu, mem, threads, etc)
        adj_matrix: (num_nodes, num_nodes) Adjacency matrix of dependencies
        pid_to_idx: Mapping from PID to matrix index
    """
    stmt = select(ProcessSnapshot).order_by(ProcessSnapshot.timestamp.desc()).limit(200) # Limit to top 200 for perf
    result = await session.execute(stmt)
    processes = result.scalars().all()
    
    # We only want the latest snapshot. Since the query returns a flat list ordered by time,
    # we group by PID to get the latest per PID.
    latest_procs = {}
    for p in processes:
        if p.pid not in latest_procs:
            latest_procs[p.pid] = p
            
    procs = list(latest_procs.values())
    num_nodes = len(procs)
    
    pid_to_idx = {p.pid: i for i, p in enumerate(procs)}
    
    nodes = np.zeros((num_nodes, 4), dtype=np.float32)
    adj_matrix = np.zeros((num_nodes, num_nodes), dtype=np.float32)
    
    for i, p in enumerate(procs):
        # Node features
        nodes[i, 0] = p.cpu_percent / 100.0
        nodes[i, 1] = float(p.mem_rss_bytes) / 1e9 # GB
        nodes[i, 2] = float(p.num_threads or 1) / 100.0
        nodes[i, 3] = float(len(p.open_files or [])) / 100.0
        
        # Edges
        # 1. Parent-child relationship (weight 1.0)
        if p.ppid in pid_to_idx:
            parent_idx = pid_to_idx[p.ppid]
            adj_matrix[i, parent_idx] = 1.0
            adj_matrix[parent_idx, i] = 1.0 # Undirected for message passing
            
        # 2. Shared open files heuristic (weight 0.5)
        if p.open_files:
            my_paths = {f.get('path') for f in p.open_files if f.get('path')}
            for j, other in enumerate(procs):
                if i == j: continue
                if other.open_files:
                    other_paths = {f.get('path') for f in other.open_files if f.get('path')}
                    if my_paths.intersection(other_paths):
                        adj_matrix[i, j] += 0.5
                        adj_matrix[j, i] += 0.5
                        
    return nodes, adj_matrix, pid_to_idx
