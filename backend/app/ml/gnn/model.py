import torch
import torch.nn as nn
import numpy as np

class SimpleGCN(nn.Module):
    """
    A basic Graph Convolutional Network predicting deadlock/contention risk per process.
    Built in standard PyTorch using matrix multiplication to avoid heavy dependencies 
    like torch-geometric for MVP.
    """
    def __init__(self, node_features=4, hidden_dim=16):
        super().__init__()
        # W1 and W2 weight matrices for 2 layers of message passing
        self.W1 = nn.Linear(node_features, hidden_dim)
        self.W2 = nn.Linear(hidden_dim, 1)
        self.relu = nn.ReLU()
        self.sigmoid = nn.Sigmoid()
        
    def forward(self, X, A):
        """
        X: (N, node_features) node feature matrix
        A: (N, N) adjacency matrix
        """
        # Add self-loops to Adjacency matrix
        I = torch.eye(A.size(0)).to(A.device)
        A_hat = A + I
        
        # Degree matrix for normalization
        D = torch.sum(A_hat, dim=1)
        D_inv_sqrt = torch.pow(D, -0.5)
        D_inv_sqrt[torch.isinf(D_inv_sqrt)] = 0.0
        D_mat = torch.diag(D_inv_sqrt)
        
        # Normalized adjacency matrix: D^-1/2 * A_hat * D^-1/2
        norm_A = torch.matmul(torch.matmul(D_mat, A_hat), D_mat)
        
        # Layer 1
        H1 = self.relu(self.W1(torch.matmul(norm_A, X)))
        # Layer 2
        logits = self.W2(torch.matmul(norm_A, H1))
        
        return self.sigmoid(logits)

def heuristic_centrality_baseline(X: np.ndarray, A: np.ndarray) -> np.ndarray:
    """
    Baseline: A process is at risk of contention if it holds many resources (high degree)
    AND consumes high CPU/Mem natively.
    """
    degrees = np.sum(A, axis=1, keepdims=True)
    # CPU is X[:, 0], Mem is X[:, 1]
    cpu = X[:, 0:1]
    # Simple heuristic score
    risk = (degrees / (np.max(degrees) + 1e-6)) * cpu
    return np.clip(risk, 0.0, 1.0)
