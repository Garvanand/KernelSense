# KernelSense Testing Strategy

Achieving production-grade test coverage on an OS-level telemetry and machine learning engine requires a strategic split between pure logic validation and safe infrastructure mocking. 

## End-to-End Testing Environments

### 1. The CI / Non-Destructive Environment
KernelSense is strictly designed so that the core processing pipeline—ML inference, incident escalation, and UI rendering—is totally decoupled from the actual hardware telemetry probes.

**In Continuous Integration (CI):**
- We **do not** run the real eBPF hooks or ETW tracers. Requiring `CAP_SYS_ADMIN` in GitHub Actions is a massive security antipattern and inherently flaky.
- We **do not** write "destructive" tests that intentionally consume 100% of memory to test the OOM detector.
- Instead, the `TelemetrySampler` is injected with a **MockCollector** interface that streams synthetic telemetry. We can inject an array of malicious vectors (e.g., a simulated memory leak) directly into the SQLite database and assert that the ML Engine correctly categorizes it.

### 2. The Live / Manual Staging Environment
To ensure the real C-level probes function correctly across kernel patches:
- We maintain a suite of localized bash scripts (`scripts/stress_tests/`) that can be executed on a disposable staging VM.
- These scripts use standard tools (`stress-ng`, `sysbench`) to peg CPU, exhaust memory, and spam context-switches, allowing manual validation that the real sensors reflect the ground truth.

## Test Types

- **Backend Unit**: Pure Python tests (`pytest`). Heavily mocks SQLAlchemy async sessions.
- **Backend Integration**: Boots a temporary in-memory SQLite instance, runs the `FastAPI TestClient`, and verifies the Zero-Trust Access-Level headers are correctly respected.
- **Frontend Component**: React Testing Library/Jest specs for complex state hooks like Zustand `useAccessLevel`.
- **Frontend E2E**: Playwright scripts that mimic an actual user traversing the dashboard, setting clearance levels, and viewing the Bounded LLM explanations.
