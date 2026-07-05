import torch
import torch.nn as nn
import numpy as np

class ResidualLeakDetector(nn.Module):
    """
    A lightweight MLP to learn the residual between the EWMA statistical 
    prediction and the actual memory usage. Detects slow leaks below Z-score threshold.
    """
    def __init__(self, input_dim=4, hidden_dim=16):
        # Input: [current_mem, ewma_mem, diff, process_uptime]
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1),
            nn.Sigmoid() # Probability of leak
        )
        
    def forward(self, x):
        return self.net(x)

def z_score_baseline(mem_history: np.ndarray, threshold=3.0) -> np.ndarray:
    """
    Statistical anomaly baseline: Flag if current memory is > 3 std devs 
    above the rolling mean.
    mem_history: (batch, seq_len)
    Returns: (batch, 1) boolean mask cast to float
    """
    mean = np.mean(mem_history[:, :-1], axis=1, keepdims=True)
    std = np.std(mem_history[:, :-1], axis=1, keepdims=True) + 1e-6
    current = mem_history[:, -1:]
    
    z_scores = (current - mean) / std
    return (z_scores > threshold).astype(np.float32)
