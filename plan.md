# KernelSense — Implementation Plan

> Master plan governing the full build sequence.
> Last updated: 2026-07-06 · Prompt 12

---

## 1. Prompt Sequence & Deliverables

| Prompt | Phase                          | Key Deliverables                                                                | Status  |
| :----- | :----------------------------- | :------------------------------------------------------------------------------ | :------ |
| **1**  | Feasibility & Planning         | `memory.md`, `plan.md`, `docs/FEASIBILITY.md`                                  | ✅ Done |
| **2**  | Selection Lock & Justification | `docs/PROJECT_SELECTION.md` — interview-ready justification document            | ✅ Done |
| **3**  | System Design & Architecture   | `SYSTEM_DESIGN.md`, `ARCHITECTURE.md`, `OS_ARCH.md`, ADRs 0001–0006            | ✅ Done |
| **4**  | Repository Setup & Tooling     | Repo scaffold, CI skeleton, env config, dependency lockfiles                    | ✅ Done |
| **5**  | Architecture Scaffolding       | Folder structure for backend, frontend, scripts, and docs                       | ✅ Done |
| **6**  | AI Engine — Models             | Dataset discovery, Forecasting model (TS-transformer/LSTM)                     | ✅ Done |
| **7**  | Platform Telemetry Validation  | Verify eBPF/ETW/dtrace assumptions, build platform-specific collectors          | ✅ Done |
| **8**  | LLM Explainer & API            | Bounded LLM explainer, FastAPI endpoints, access-level enforcement              | ✅ Done |
| **9**  | Frontend — Core                | Next.js scaffold, layout, kernel-ring visual language, mode selector            | ✅ Done |
| **10** | Frontend — Visualizations      | D3.js/React Flow telemetry visualizations, animated context-switch visuals      | ✅ Done |
| **11** | Integration & Polish           | End-to-end integration, error handling, edge cases, performance tuning          | ✅ Done |
| **12** | Documentation & Launch         | README, setup guide, architecture docs, demo recording                         | ✅ Done |
| **13** | Process Details/Graphs         | Memory graph implementations                                                   | ✅ Done |
| **14** | Scheduler Engine               | CPU cores, context switches, run-queue visualizations                          | ✅ Done |
| **15** | Prediction Engine UI           | LLM bounded root-cause explanation engine integrated in UI                     | ✅ Done |
| **16** | Performance & Polish           | End-to-end performance optimization pass                                       | ✅ Done |
| **17** | End-to-End Testing Pass        | Comprehensive final stack verification                                         | ✅ Done |
| **18** | Full Documentation Pass        | Rewrite documentation to reflect final architecture and talking points         | ✅ Done |
| **19** | Final Polishing Pass           | Final code cleanup and pre-flight checks                                       | ✅ Done |
| **20** | Production Readiness           | Deployment config and final wrap up                                            | ⬜ Next |

---

## 2. Architecture Decisions

### 2.1 Instrumentation Layer

```
                    ┌──────────────────────────┐
                    │     Common Schema         │
                    │  (normalized telemetry)   │
                    └────────────▲─────────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            │                    │                    │
    ┌───────┴───────┐   ┌───────┴───────┐   ┌───────┴───────┐
    │  Linux Tier   │   │ Windows Tier  │   │  macOS Tier   │
    │               │   │               │   │               │
    │ Guest:        │   │ Guest:        │   │ Guest:        │
    │  psutil+/proc │   │  psutil+WMI   │   │  psutil+vmstat│
    │               │   │               │   │               │
    │ Power:        │   │ Power:        │   │ (no Power)    │
    │  +perf_events │   │  +perf ctrs   │   │               │
    │               │   │  +private ETW │   │               │
    │ Research:     │   │ Research:     │   │ (no Research) │
    │  +eBPF        │   │  +system ETW  │   │               │
    └───────────────┘   └───────────────┘   └───────────────┘
```

### 2.2 Storage Layer

| Component       | Technology            | Purpose                                    |
| :-------------- | :-------------------- | :----------------------------------------- |
| Time-series     | TimescaleDB           | Telemetry metrics with 24h rolling window  |
| Graph           | Postgres adjacency lists (or embedded graph lib) | Process/resource dependency graph |
| Hot cache       | Redis                 | Latest metric values, WebSocket fan-out    |

### 2.3 AI Engine

| Model                | Architecture               | Input                                | Output                                 | Frequency   |
| :------------------- | :------------------------- | :----------------------------------- | :------------------------------------- | :---------- |
| **Forecaster**       | Time-series Transformer / LSTM | Per-resource metric windows (CPU, mem, I/O) | Near-term saturation probability + ETA | Every 5–10s |
| **GNN Contention**   | Graph Neural Network       | Live process/resource dependency graph | Deadlock-risk / contention scores      | Every 1–5s  |
| **Anomaly Detector** | Statistical + learned residual | Per-process memory growth curves     | Leak probability + anomalous process ID | Every 10s   |
| **LLM Explainer**    | External API (bounded call)| Structured JSON: event type, metrics, process info | Plain-language explanation + suggested action | Per confirmed event |

### 2.4 Frontend

| Component           | Technology                        | Purpose                                     |
| :------------------ | :-------------------------------- | :------------------------------------------ |
| Framework           | Next.js + TypeScript              | SSR, routing, state management               |
| Styling             | TailwindCSS                       | Rapid utility-first styling                  |
| Animations          | Framer Motion                     | Kernel-ring, glassmorphism, micro-animations |
| Data Visualization  | D3.js                             | Time-series charts, resource gauges          |
| Graph Visualization | React Flow                        | Process/resource dependency graph            |
| Design Language     | Kernel-ring / glassmorphism       | Dark mode, translucent panels, ring motifs   |

### 2.5 Access-Level Engine

- **No authentication** — the system is single-user, local.
- Client-side mode selector (Guest → Power → Research) with **server-enforced gating**.
- Consent flow:
  1. User selects higher tier in UI.
  2. UI shows what additional privileges/data access this entails.
  3. User confirms.
  4. Backend verifies required OS capabilities are available.
  5. If capabilities present → tier unlocked; if not → error with remediation instructions.

---

## 3. Technology Stack

### Backend
| Layer           | Technology       | Version Target |
| :-------------- | :--------------- | :------------- |
| API Framework   | FastAPI          | ≥ 0.110        |
| ASGI Server     | Uvicorn          | ≥ 0.30         |
| Database        | TimescaleDB      | ≥ 2.14         |
| Cache           | Redis            | ≥ 7.0          |
| ORM             | SQLAlchemy       | ≥ 2.0          |
| Telemetry       | psutil           | ≥ 5.9          |
| eBPF (Linux)    | bcc / libbpf     | Latest         |
| ML              | PyTorch          | ≥ 2.2          |
| GNN             | PyG (PyTorch Geometric) | ≥ 2.5   |
| LLM Client      | OpenAI SDK / Anthropic SDK | Latest |

### Frontend
| Layer           | Technology         | Version Target |
| :-------------- | :----------------- | :------------- |
| Framework       | Next.js            | ≥ 14           |
| Language        | TypeScript         | ≥ 5.4          |
| Styling         | TailwindCSS        | ≥ 3.4          |
| Animation       | Framer Motion      | ≥ 11           |
| Charts          | D3.js              | ≥ 7            |
| Graph           | React Flow         | ≥ 12           |

---

## 4. Deployment Model

```
┌─────────────────────────────────────────────────┐
│  User's Machine                                  │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │  KernelSense Backend (single process)    │    │
│  │  FastAPI + Uvicorn                       │    │
│  │  Background workers (model inference)    │    │
│  │  Instrumentation collectors              │    │
│  └─────────┬────────────────────────────────┘    │
│            │                                      │
│  ┌─────────▼──────┐  ┌──────────┐                │
│  │  TimescaleDB   │  │  Redis   │                │
│  │  (managed/local)│  │ (local)  │                │
│  └────────────────┘  └──────────┘                │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │  Frontend (Next.js)                      │    │
│  │  localhost:3000 or static/edge build      │    │
│  └──────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

**No Docker. No Kubernetes.** Single process + managed DB + local/edge frontend.

---

## 5. MVP Scope (Linux-First)

### Included in MVP
- [x] psutil baseline collectors (CPU, memory, disk I/O, network)
- [x] /proc-based per-process detail
- [x] Common telemetry schema & normalized output
- [x] TimescaleDB time-series storage (24h rolling window)
- [x] Redis hot cache for latest values
- [x] WebSocket real-time streaming
- [x] FastAPI REST API with access-level enforcement
- [x] Time-series forecasting model (LSTM, CPU-only inference)
- [x] Statistical anomaly/leak detector
- [x] Frontend: kernel-ring dashboard, live charts, mode selector
- [x] Bounded LLM explainer (1 call per confirmed event)

### Deferred to Post-MVP
- [ ] eBPF deep tracing (Research tier)
- [ ] GNN contention/deadlock prediction
- [ ] Windows ETW collectors
- [ ] macOS-specific collectors beyond psutil
- [ ] React Flow process dependency graph visualization
- [ ] Animated context-switch / scheduling visuals

---

## 6. Risk Summary (see FEASIBILITY.md for details)

| Risk                           | Severity | Mitigation                                           |
| :----------------------------- | :------- | :--------------------------------------------------- |
| eBPF requires root/CAP_BPF     | Medium   | Consent-gated; MVP works without it (Guest/Power)    |
| macOS SIP blocks deep tracing  | High     | macOS = Guest-only tier; never ask user to disable SIP |
| Model inference too slow on CPU | High    | Use LSTM over Transformer for MVP; batch predictions  |
| TimescaleDB disk growth         | Medium   | 24h rolling retention policy; configurable sampling   |
| Cross-platform schema gaps      | Medium   | Nullable fields; platform-specific enrichment layers  |

---

## 7. Conventions

| Convention          | Rule                                                                    |
| :------------------ | :---------------------------------------------------------------------- |
| Branching           | `main` → `feat/<prompt-number>-<feature>` → PR back to `main`          |
| Commit messages     | `[Prompt N] <type>: <description>` (e.g., `[Prompt 4] feat: psutil collector`) |
| File structure      | `backend/`, `frontend/`, `docs/`, `models/`, `scripts/`                |
| Testing             | pytest (backend), Jest + RTL (frontend), type checking (mypy + tsc)     |
| Logging             | Structured JSON logging (structlog)                                     |
| Config              | Pydantic Settings, `.env` files, no secrets in code                     |
