import torch
import torch.nn as nn
import numpy as np
from typing import Tuple

class LSTMSaturationForecaster(nn.Module):
    """
    Predicts future memory saturation (mem_percent) based on a sliding window of features.
    """
    def __init__(self, input_dim=7, hidden_dim=32, num_layers=2):
        super().__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_dim, 1) # Predict scalar saturation
        
    def forward(self, x):
        # x shape: (batch, seq_len, input_dim)
        lstm_out, _ = self.lstm(x)
        # Take the output of the last time step
        last_out = lstm_out[:, -1, :]
        return self.fc(last_out)

def moving_average_baseline(x_history: np.ndarray) -> np.ndarray:
    """
    Statistical baseline: Simple moving average of the target feature.
    x_history shape: (batch, seq_len, input_dim)
    Assume mem_percent is at index 2 (from resource_features.py).
    """
    mem_history = x_history[:, :, 2]
    # Simple average of the window
    return np.mean(mem_history, axis=1, keepdims=True)
