# ADR-0003: AI Model Choices — LSTM + GNN + Statistical Anomaly

> **Status:** Accepted
> **Date:** 2026-07-05
> **Deciders:** Project architect
> **Context:** [SYSTEM_DESIGN.md §3.3](file:///c:/Users/GARV%20ANAND/Downloads/KernelSense/docs/SYSTEM_DESIGN.md), [FEASIBILITY.md §3.1](file:///c:/Users/GARV%20ANAND/Downloads/KernelSense/docs/FEASIBILITY.md)

---

## Context

KernelSense's AI engine must solve three distinct prediction problems:

1. **Resource saturation forecasting** — Given a time-series of CPU/memory/I/O utilization, predict when (and if) saturation will occur.
2. **Anomaly / memory leak detection** — Given per-process memory growth curves, distinguish normal allocation patterns from leaks.
3. **Resource contention / deadlock risk** — Given a graph of process/resource dependencies, identify contention bottlenecks and deadlock-prone patterns.

These are structurally different problems that cannot be solved by a single model architecture:
- Problem 1 is a **univariate/multivariate time-series regression** task.
- Problem 2 is a **change-point / anomaly detection** task.
- Problem 3 is a **graph-level prediction** task.

### Alternatives Considered

| Option | For Problem 1 | For Problem 2 | For Problem 3 |
| :----- | :------------ | :------------ | :------------ |
| **A: All Transformer** | Time-series Transformer | Transformer anomaly | Transformer with graph attention | 
| **B: LSTM + Statistical + GNN** (selected) | LSTM | EWMA + z-score + learned residual | GNN (message-passing) |
| **C: Classical only** | ARIMA/ETS | z-score thresholds | PageRank/centrality |
| **D: Single LLM for all** | LLM prompt-based | LLM prompt-based | LLM prompt-based |

---

## Decision

Use **LSTM for time-series forecasting**, **statistical + learned residual for anomaly detection**, and **GNN for contention prediction**.

### Rationale — Why Not All Transformers (Option A)?

| Dimension | Transformer | LSTM |
| :-------- | :---------- | :--- |
| **CPU inference latency** | 200–500ms per forward pass (attention is O(n²) in sequence length) | 10–50ms per forward pass |
| **GPU requirement** | Practically requires GPU for real-time inference | CPU-feasible at our sequence lengths (60–300 samples) |
| **Training data** | Needs more data for effective attention learning | Performs well on moderate datasets |
| **Model size** | 10–50M parameters (typical small transformer) | 0.5–2M parameters |

KernelSense targets consumer hardware without GPU. LSTM is the pragmatic choice for MVP. A transformer upgrade path remains open for post-MVP if GPU is detected.

### Rationale — Why Statistical + Learned Residual for Anomaly Detection (Not Pure ML)?

1. **Cold-start problem:** A freshly installed KernelSense has no user-specific training data. Statistical methods (EWMA + z-score) work immediately.
2. **Interpretability:** A z-score is directly explainable ("this process's memory growth is 4.2σ above its rolling average"). Pure neural anomaly detectors are black boxes.
3. **Learned residual adds value:** After collecting a few hours of data, a small MLP learns the residual between the statistical baseline and actual behavior — catching slow leaks that fall below the z-score threshold but have a distinctive growth shape.

### Rationale — Why GNN for Contention (Not Classical Graph Metrics)?

1. **PageRank/centrality** tells you which node is most connected, not which pair of nodes is likely to deadlock. Deadlock depends on mutual dependency *patterns*, not degree centrality.
2. **GNN with message-passing** can learn these patterns from training data (e.g., Alibaba cluster traces with co-located workloads showing contention).
3. **Graph structure changes every sampling interval** — the GNN handles dynamic graphs natively, while classical metrics would need to be recomputed and wouldn't capture temporal patterns.

### Rationale — Why Not Option D (LLM for All)?

This violates the project's hard constraint: **no general-purpose chatbot LLM usage**. Using an LLM to classify time-series or detect anomalies would be:
- **Slow** (API latency per inference cycle).
- **Expensive** (cost per API call × inference frequency).
- **Unpredictable** (non-deterministic outputs for a deterministic problem).
- **Unverifiable** (no way to audit model weights or validate decision boundaries).

---

## Consequences

### Positive
- LSTM runs on CPU with sub-50ms latency — real-time forecasting without GPU.
- Statistical anomaly detector works from first launch (no cold start).
- GNN captures structural contention patterns that scalar metrics miss.
- Each model is independently testable and replaceable.

### Negative
- Three distinct model architectures to maintain (mitigated: shared inference worker framework).
- LSTM has limited long-range dependency modeling (mitigated: 300-sample windows at 5 Hz = 60s lookahead, sufficient for near-term prediction).
- GNN deferred to post-MVP due to CPU inference cost at 1 Hz (ASSUMPTION A7).

### Open Assumptions
- **A6:** LSTM inference ≤500ms on consumer CPU. Owner: Prompt 6.
- **A7:** GNN inference over ~500 nodes at 1 Hz on CPU. Owner: Prompt 6.
