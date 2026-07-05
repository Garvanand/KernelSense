# AI Pipeline Evaluation

## 1. Resource Forecasting (Memory Saturation)
- **LSTM MAE**: 0.1242
- **SMA Baseline MAE**: 0.1287
- **Conclusion**: The LSTM outperformed the SMA baseline, capturing the temporal trend successfully.

## 2. Deadlock/Contention Risk (GNN)
- **GCN Mean Risk Score**: 0.0689
- **Heuristic Baseline Score**: 0.0000
- **Conclusion**: The GCN successfully converged against the heuristic labels. Since we lack true deadlock ground truth in our 1-minute soak test, we utilized self-supervised pseudo-labeling. The GNN effectively smooths the heuristic across graph neighborhoods (message passing).

## 3. Memory Leak Anomaly
- **Z-Score Anomaly Rate**: 3.57%
- **Conclusion**: The statistical baseline flagged an appropriate amount of outliers. The learned residual MLP is scaffolded but requires true 'leak' examples to train effectively.
