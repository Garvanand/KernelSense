# KernelSense
=======
<div align="center">
  <h1>KernelSense</h1>
  <p><strong>Your operating system, understood and foreseen.</strong></p>
  <p>
    An AI-augmented, real-time operating system observatory. Combining high-fidelity OS telemetry with predictive machine learning and an immersive glassmorphism UI.
  </p>
</div>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green)](https://fastapi.tiangolo.com/)

KernelSense is a cross-platform operating system telemetry engine that combines low-overhead instrumentation with local machine learning inference. It provides real-time observability into kernel scheduling, memory allocation, and process genealogy, while automatically detecting anomalies like memory leaks and scheduler contention without requiring off-site data exfiltration.

## Architecture

KernelSense operates entirely locally, utilizing a decoupled architecture:

1. **Instrumentation Layer**: Collects system metrics (via `psutil`, eBPF on Linux, ETW on Windows) at high frequency (1-5Hz).
2. **AI Inference Pipeline**: A background worker evaluates sliding temporal windows using PyTorch-based models (LSTM forecasting, GNN contention mapping, MLP anomaly detection).
3. **Incident Engine**: High-confidence predictions are promoted to incidents and enriched with root-cause diagnostics using a bounded LLM interface.
4. **Presentation Layer**: A Next.js dashboard that visualizes the telemetry and incidents.

## Features

- **Cross-Platform Telemetry**: Supports Linux, macOS, and Windows.
- **Local ML Inference**: Built-in PyTorch models for forecasting CPU/memory saturation and detecting monotonic heap growth.
- **Zero-Trust Access Model**: Granular clearance levels (Guest, Power User, Kernel, Research) dictate the depth of telemetry exposed via the API.
- **High-Frequency Rendering**: Frontend optimizations (Dagre layouts, D3 canvas, Canvas/Block aggregations) capable of rendering thousands of context switches per second without DOM blocking.

## Prerequisites

- **Backend**: Python 3.10+, SQLite or PostgreSQL
- **Frontend**: Node.js 18+, npm or yarn
- **OS**: Linux (eBPF headers required for deep tracing), macOS, or Windows 10/11.

## Installation

### 1. Backend Service

The backend handles ingestion, ML inference, and serves the API.

```bash
git clone https://github.com/Garvanand/KernelSense.git
cd KernelSense/backend

# Initialize virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server (includes background ingestion workers)
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Dashboard

The frontend is a Next.js App Router application.

```bash
cd ../frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The dashboard will be available at `http://localhost:3000`.

## Configuration

Backend behavior is controlled via environment variables (can be placed in a `.env` file in the `backend/` directory):

- `SAMPLING_INTERVAL_SEC` (default: `1.0`): Frequency of telemetry collection.
- `INGEST_BATCH_SIZE` (default: `50`): Number of metrics to batch before database commit.
- `DATABASE_URL` (default: `sqlite+aiosqlite:///./telemetry.db`): SQLAlchemy connection string.

## Documentation

For deep-dives into internal architecture and design constraints, refer to the project ADRs:

- [ADR-0001: Read-Only Constraint](./docs/adr/0001-read-only-constraint.md)
- [ADR-0002: Cross-Platform Strategy](./docs/adr/0002-telemetry-strategy-cross-platform.md)
- [ADR-0003: AI Model Pipeline](./docs/adr/0003-ai-model-choices.md)
- [ADR-0004: Bounded LLM Integration](./docs/adr/0004-llm-usage-boundary.md)
- [ADR-0005: Access Level RBAC](./docs/adr/0005-access-level-model-no-auth.md)

## License

KernelSense is distributed under the MIT License. See `LICENSE` for more information.
