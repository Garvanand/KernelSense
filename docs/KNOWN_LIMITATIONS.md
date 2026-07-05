# KernelSense: Known Limitations & Quirks

As an experimental AI-augmented telemetry platform, KernelSense has intentional boundaries and documented gaps.

## Telemetry Collection Flakiness
- **eBPF Compatibility**: The Linux `bc` based eBPF collectors require specific kernel headers. If run on heavily locked-down kernels (e.g., certain shared VPS providers or strict AppArmor profiles), the advanced scheduler metrics will silently fail back to `psutil` baselines.
- **Mac/Windows Extensibility**: Currently, deep tracing on Windows (ETW) and macOS (DTrace/EndpointSecurity) is stubbed. Only baseline metrics are fully cross-platform.

## Testing Coverage Gaps
While the logic pipelines (Access Control, Incident Thresholding) are heavily unit-tested, there are explicit gaps by design:
1. **No Live Kernel Tests in CI**: We do not attach real eBPF probes in automated CI environments due to privilege requirements. The Collector classes are tested via mocked static outputs.
2. **AI Model Drift Verification**: The PyTorch model training pipeline (`train_and_infer.py`) relies on heuristic pseudo-labels for the GNN. We do not currently have an automated CI pipeline that re-trains and statically verifies inference accuracy against a held-out production dataset.

## Artificial Intelligence Constraints
- **Hallucination Vectors**: While the Bounded LLM architecture strictly types the inputs and limits the output to 2-3 sentences, it is still an LLM. It may occasionally misattribute a memory leak to a specific thread when the actual cause is a shared memory segment.
- **Inference Latency**: Generating an LLM explanation introduces a 1-3 second delay. This is why the `_llm_cache` exists, but the very first time an incident fires, the dashboard UI must wait for the AI to synthesize the diagnostic.
