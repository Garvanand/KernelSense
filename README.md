<div align="center">
  <h1>KernelSense</h1>
  <p><strong>Your operating system, understood and foreseen.</strong></p>
  <p>
    An AI-augmented, real-time operating system observatory. Combining high-fidelity OS telemetry with predictive machine learning and an immersive glassmorphism UI.
  </p>
</div>

---

## ⚡ Overview

KernelSense is a cross-platform (Linux, Windows, macOS) telemetry and observability engine designed to bridge the gap between raw kernel-level metrics and actionable intelligence. It reads actual process, memory, scheduler, and I/O states directly from the running machine, feeding them into a locally executed Artificial Intelligence pipeline.

Instead of just showing you what is happening *now*, KernelSense predicts what will happen *next*—forecasting resource exhaustion, mapping inter-process dependencies, and diagnosing root causes with a strict, bounded LLM architecture.

## 🌟 Key Features

### 🛡️ Access-Level Zero-Trust Architecture
KernelSense ditches traditional authentication for a localized **Clearance Level Model** (Guest → Power User → Kernel → Research). Telemetry is rigorously access-gated; high-clearance modes unlock deep OS introspection (open file descriptors, raw eBPF scheduler traces) while restricting standard views to basic telemetry.

### 🧠 Intelligent AI Engine
- **LSTM Forecasting**: Predicts future CPU and Memory saturation using rolling temporal windows, surfacing impending Out-Of-Memory (OOM) risks before they happen.
- **Graph Neural Networks (GNN)**: Maps processes and resources into an adjacency matrix, learning hidden bottlenecks and IPC contention points.
- **Residual Leak Detection**: Identifies subtle, monotonic memory leaks utilizing an MLP anomaly detector measured against standard statistical bounds.

### 🤖 Bounded LLM Incident Diagnostics
When the AI engine escalates a high-confidence prediction into an active "Incident", KernelSense invokes a strict, schema-validated LLM pipeline. It returns actionable 2-3 sentence root-cause diagnostics (e.g., *“Process X exhibits a monotonic heap growth pattern...”*). No open-ended chatbots—just direct, bounded intelligence.

### 🌌 Immersive "Kernel Ring" Design System
Built on **Next.js 14**, the frontend utilizes a custom glassmorphism design language mapped to the CPU execution rings (`Ring 3` User Space to `Ring 0` Kernel Space). It features:
- **Live Process Genealogy**: Animated `react-flow` directed graphs showing real-time parent-child process spawns.
- **Physical Memory Map**: A `framer-motion` powered grid visualizing real-time system memory block compression.
- **Aggregated Scheduler Stream**: High-performance, intelligently binned cascading event streams handling thousands of context switches per second without DOM blocking.

## 🏗️ Architecture Stack

- **Backend**: Python 3.10+, FastAPI, SQLAlchemy 2.0 (Async), PyTorch, Scikit-Learn
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Zustand, Framer Motion, D3.js, React Flow
- **Data Layer**: SQLite (Async) / PostgreSQL (Timescale DB compatible structures)
- **Telemetry**: `psutil` baseline with extensible stubs for eBPF (Linux) and ETW (Windows)

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Start the Backend API & AI Engine
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or `.\venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Start the FastAPI server (The Ingestion and Incident background workers start automatically)
uvicorn app.main:app --reload --port 8000
```

### 2. Start the Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to access the KernelSense observatory.

## 📚 Documentation
Detailed architectural choices and constraints are documented in our Architecture Decision Records (ADRs):
- [ADR-0001: Read-Only Constraint](./docs/adr/0001-read-only-constraint.md)
- [ADR-0002: Cross-Platform Telemetry](./docs/adr/0002-telemetry-strategy-cross-platform.md)
- [ADR-0003: AI Model Pipeline](./docs/adr/0003-ai-model-choices.md)
- [ADR-0004: Bounded LLM Usage](./docs/adr/0004-llm-usage-boundary.md)
- [ADR-0005: Access Level Model](./docs/adr/0005-access-level-model-no-auth.md)

## ⚖️ License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
