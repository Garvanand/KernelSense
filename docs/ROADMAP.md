# KernelSense Roadmap

KernelSense is in active development. While the core AI ingestion and Zero-Trust APIs are stable, we are focusing on expanding the OS hook capabilities and lowering the inference overhead.

## Phase 1: Foundation (Completed)
- [x] Cross-platform telemetry ingestion baseline (`psutil`).
- [x] PyTorch LSTM integration for forecasting resource exhaustion.
- [x] Bounded LLM interface for incident diagnostics.
- [x] Zero-Trust Access Level UI (Next.js).

## Phase 2: Deep OS Tracing (In Progress)
- [ ] **Windows ETW Integration**: Replace the Windows stub collectors with full Event Tracing for Windows hooks to capture exact thread context switches.
- [ ] **macOS EndpointSecurity**: Integrate Apple's EndpointSecurity framework for precise file/socket mapping without `sudo` parsing.
- [ ] **eBPF Auto-Compile**: Remove the requirement for local Linux headers by pre-compiling the `bcc` probes into CO-RE (Compile Once, Run Everywhere) objects.

## Phase 3: AI Inference Optimization (Planned)
- [ ] **ONNX Runtime Export**: Port the PyTorch models to ONNX to reduce the Python runtime overhead from ~120MB memory to <30MB.
- [ ] **Local LLM Execution**: Integrate `llama.cpp` to run a quantized 2B parameter diagnostic model locally, removing the requirement for any external API keys in the Bounded LLM interface.

## Phase 4: Distributed Observability (Future)
- [ ] **Fleet Aggregation**: Allow multiple KernelSense instances (agents) to report into a central TimescaleDB hub.
- [ ] **Graph Database Backing**: Move the GNN process dependency graph out of memory and into Neo4j for persistent querying across container restarts.
