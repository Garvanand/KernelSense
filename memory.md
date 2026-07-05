# KernelSense — Project Memory

> **"Your operating system, understood and foreseen."**
>
> Last updated: 2026-07-05 · Prompt 8 (FastAPI Backend Foundation)
>
> **Project selection finalized: 2026-07-05. Architecture locked: 2026-07-05.**

---

## 1. Project Identity

| Field              | Value                                                                 |
| :----------------- | :-------------------------------------------------------------------- |
| **Product Name**   | KernelSense                                                           |
| **Tagline**        | Your operating system, understood and foreseen.                       |
| **Category**       | AI-Augmented Living OS Observatory                                    |
| **Primary Goal**   | Real-time OS telemetry collection, predictive forecasting, and plain-language anomaly explanation |
| **Target Audience**| Developers, SREs, systems researchers, power users                    |
| **MVP Platform**   | Linux-first (Windows & macOS as reduced-fidelity fallback tiers)      |

---

## 2. Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  Next.js + TypeScript + TailwindCSS + Framer Motion + D3.js     │
│  + React Flow · Kernel-ring / glassmorphism visual language      │
│  · Animated context-switch / scheduling / memory visuals         │
│  · Access-level mode selector (Guest → Power → Research)         │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST + WebSocket
┌──────────────────────────▼──────────────────────────────────────┐
│                      BACKEND API (FastAPI)                       │
│  REST endpoints · WebSocket streaming · Background workers       │
│  Redis (hot-path cache) · Structured logging / observability     │
│  Access-Level Engine (server-enforced mode gating)               │
└─────┬──────────┬──────────┬──────────┬──────────────────────────┘
      │          │          │          │
      ▼          ▼          ▼          ▼
┌──────────┐ ┌────────┐ ┌────────┐ ┌───────────────────────┐
│ AI Engine│ │Storage │ │ Redis  │ │ LLM Explainer (bounded)│
│ TS-XFMR │ │Timescale│ │ Cache  │ │ 1 call / predicted    │
│ GNN      │ │+ Graph │ │        │ │ event; structured I/O │
│ Anomaly  │ │  Layer │ │        │ │ never open-ended chat │
└──────────┘ └────────┘ └────────┘ └───────────────────────┘
      ▲
      │ Normalized telemetry stream
┌─────┴──────────────────────────────────────────────────────────┐
│               INSTRUMENTATION LAYER                             │
│  psutil (cross-platform baseline, always available)             │
│  Linux:  eBPF (bcc/libbpf) + /proc + perf_events               │
│  Windows: ETW → fallback WMI/perf counters                     │
│  macOS:  py-spy + vm_stat + dtrace-adjacent APIs                │
│  All read-only · Configurable sampling interval                 │
│  Common normalized schema regardless of OS                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Telemetry Source Matrix

| OS      | Baseline (No Priv) | Enhanced (Elevated/Consent) | Deep (Root/Kernel) | Status     |
| :------ | :------------------ | :-------------------------- | :----------------- | :--------- |
| **Linux**   | psutil, /proc (user-owned) | perf_events (CAP_PERFMON) | eBPF (CAP_BPF + CAP_SYS_ADMIN) | ✅ Verified |
| **Windows** | psutil, WMI (own-process) | Perf counters (Perf Log Users group), private ETW sessions | System-wide ETW (Admin) | ✅ Verified |
| **macOS**   | psutil, vm_stat (summary-level) | py-spy (non-system Python) | dtrace (SIP-disabled — **not recommended**) | ⚠️ Limited |

---

## 4. Access-Level Model

| Level        | Telemetry Depth                    | AI Features                     | Privilege Required           |
| :----------- | :--------------------------------- | :------------------------------ | :--------------------------- |
| **Guest**    | psutil basics: CPU %, RAM, disk, net | Trend lines only (no prediction) | None                         |
| **Power**    | + per-process details, I/O counters | Forecasting + anomaly detection | Standard user (+ Perf Log Users on Windows) |
| **Research** | + eBPF/ETW deep traces, syscalls, ctx switches | + GNN contention, LLM explainer | Elevated (CAP_BPF on Linux / Admin on Windows) |

- Access levels are **enforced server-side** (API returns 403 for gated endpoints), not just hidden in the UI.
- Promotion from Guest → Power → Research requires an **explicit, visible consent step** in the UI.

---

## 5. Hard Constraints

| # | Constraint                                                                 |
| - | :------------------------------------------------------------------------- |
| 1 | **No Docker/Kubernetes** — single backend process + managed DB + edge frontend |
| 2 | **No destructive OS operations** — read-only instrumentation, consent gates for anything privileged |
| 3 | **Single bounded LLM call** — one call per confirmed predicted event, structured JSON in/out, never open-ended chat |
| 4 | **All access read-only by default** — eBPF/ETW requiring elevation needs explicit UI consent |
| 5 | **Public dataset provenance** — every pretraining dataset documented in DATASETS.md with license |

---

## 6. Pretraining Datasets (Confirmed)

| # | Dataset                                                    | License            | Content                                             | Relevance                                   |
| - | :--------------------------------------------------------- | :----------------- | :-------------------------------------------------- | :------------------------------------------ |
| 1 | **Google Cluster Traces (2019)**                           | CC BY 4.0          | Job scheduling, CPU/memory utilization across production clusters | Resource saturation forecasting pretraining  |
| 2 | **Alibaba Cluster Trace (2018, clusterdata-v2)**           | Apache 2.0         | Container resource usage, DAG task scheduling, co-located workloads | Multi-resource contention & anomaly patterns |
| 3 | **Zenodo — Kernel Function Time Measurement Dataset**      | CC BY 4.0          | eBPF/BCC-captured kernel function timing for rootkit detection | Kernel-level anomaly detection baselines     |
| 4 | **LTTng Reference Traces (lttng-ref-traces)**              | MIT                | Kernel + userspace CTF traces (scheduling, syscalls) | Trace format familiarity, scheduler modeling |

> Additional candidate: **LinuxData** (kernel config → performance evolution, v4.13–v5.8) — suitable for config-aware performance regression modeling.

---

## 7. Open Assumptions & Owner Prompts

| # | Assumption                                                                                  | Risk    | Owner Prompt |
| - | :------------------------------------------------------------------------------------------ | :------ | :----------- |
| A1 | eBPF programs can be loaded with `CAP_BPF` alone (without `CAP_SYS_ADMIN`) on kernel ≥ 5.8 for the specific program types we need (kprobes, tracepoints) | Medium  | **Prompt 7** |
| A2 | `perf_events` can be accessed with `CAP_PERFMON` (kernel ≥ 5.8) without full root            | Low     | **Prompt 7** |
| A3 | Windows ETW private logger sessions (Win10 1703+) provide sufficient process-level telemetry for Power-tier without Admin | Medium  | **Prompt 7** |
| A4 | macOS `vm_stat` + psutil provides meaningful (if reduced-fidelity) memory/CPU data without disabling SIP | Low     | **Prompt 7** |
| A5 | TimescaleDB single-node can handle ≥10 Hz sampling across ~200 metrics without excessive disk growth for a 24h rolling window | Medium  | **Prompt 5** |
| A6 | Time-series transformer inference latency is ≤500ms per prediction window on consumer hardware (no GPU required for MVP) | High    | **Prompt 6** |
| A7 | GNN inference over a process/resource graph of ~500 nodes is feasible at 1 Hz on CPU         | Medium  | **Prompt 6** |
| A8 | A single bounded LLM API call (e.g., GPT-4o-mini / Claude Haiku) completes in <3s with structured JSON prompt | Low     | **Prompt 8** |

---

## 8. Decision Log

| Date       | Decision                                                | Rationale                                              |
| :--------- | :------------------------------------------------------ | :----------------------------------------------------- |
| 2026-07-05 | Linux-first MVP, Windows Power-tier fallback, macOS Guest-only initially | eBPF gives deepest telemetry; macOS SIP blocks deep tracing without security compromise |
| 2026-07-05 | psutil as universal baseline layer                      | Cross-platform, no privilege requirements for basic metrics, well-maintained |
| 2026-07-05 | 4 public datasets identified for pretraining            | Cover cluster scheduling, kernel timing, and trace format familiarity |
| 2026-07-05 | Three-tier access model (Guest/Power/Research)          | Progressive disclosure, server-enforced, explicit consent for elevation |
| 2026-07-05 | **Project selection finalized — KernelSense locked**    | Scored 8.55/10 across 8 weighted criteria; feasibility confirmed; no risk warrants reconsideration |
| 2026-07-05 | **Architecture locked — system design complete**         | 14 OS concepts mapped to 122 telemetry fields + 43 UI surfaces; 6 ADRs accepted; schema defined |
| 2026-07-05 | **Dataset Sources Locked (Prompt 6)**                   | LTTng downloaded; Zenodo returned 403 and was logged in KNOWN_LIMITATIONS.md instead of faking data |
| 2026-07-05 | **Instrumentation Layer Implemented (Prompt 7)**        | Unified schema, psutil baseline (all), eBPF with fallback (Linux), ETW/SIP stubs (Win/Mac). Win benchmark fails CPU budget due to psutil API constraints. |
| 2026-07-05 | **FastAPI Backend Foundation (Prompt 8)**               | DB models, async telemetry ingest worker, and core REST API endpoints built. Soak test passed with 14MB startup allocation (no continuous leak). |
| 2026-07-05 | **OS Interaction Layer (Prompt 9)**                     | Implemented deeper OS collectors (sockets, files, services, permissions) and access-level gating (`Guest`, `Power`, `Research`). |
| 2026-07-05 | **AI Engine Pipeline (Prompt 10)**                      | Added PyTorch models for LSTM forecasting, GNN contention prediction, and MLP leak detection. Evaluated against stat baselines. |
| 2026-07-05 | **Frontend Core Foundation (Prompt 11)**                | Setup Next.js App Router, Tailwind glassmorphism design system, typed API client with `X-Access-Level` interception, and access-level selector. |
| 2026-07-06 | **Process Visualization Engine (Prompt 12)**            | Built React Flow dagre-layout process tree, SWR polling diff engine for animations, and access-level gated detail panel. |
| 2026-07-06 | **Memory Visualization Engine (Prompt 13)**             | Created system memory block pressure animation and D3.js leak charts overlaying AI predictions with LLM diagnostic cards. |
| 2026-07-06 | **Scheduler Visualization Engine (Prompt 14)**          | Constructed 16-core CPU heatmap, optimized context-switch stream, and access-gated eBPF raw event logger. |
| 2026-07-06 | **Prediction Engine UI (Prompt 15)**                    | Built asynchronous Incident Engine to escalate predictions, Bounded LLM explainer with caching, and unified System Health Dashboard. |
| 2026-07-06 | **Performance Optimization (Prompt 16)**                | Implemented FastAPI ephemeral polling caches, Next.js dynamic code splitting, and formalized PERFORMANCE.md. |
| 2026-07-06 | **End-to-End Testing (Prompt 17)**                      | Wrote Pytest suites for Access Policy and Incident Engine. Added Playwright specs for Dashboard traversal. Documented CI boundaries. |
| 2026-07-06 | **Full Documentation Pass (Prompt 18)**                 | Completely overhauled docs. Added TALKING_POINTS.md detailing hardest engineering problems. Reconciled architectural drift. |

---

## 9. File Index

| File                         | Purpose                                              | Created  |
| :--------------------------- | :--------------------------------------------------- | :------- |
| `memory.md`                  | Living project memory (this file)                    | Prompt 1 |
| `plan.md`                    | Implementation plan & prompt sequence                 | Prompt 1 |
| `docs/FEASIBILITY.md`        | Risk analysis, mitigations, MVP scope-down path       | Prompt 1 |
| `docs/PROJECT_SELECTION.md`  | Interview-ready project selection justification        | Prompt 2 |
| `docs/SYSTEM_DESIGN.md`      | Detailed data flow, schemas, API contracts             | Prompt 3 |
| `docs/ARCHITECTURE.md`       | High-level architecture, component diagrams            | Prompt 3 |
| `docs/OPERATING_SYSTEM_ARCHITECTURE.md` | OS concept → telemetry → UI mapping      | Prompt 3 |
| `docs/adr/0001–0006`         | Architecture Decision Records (6 total)                | Prompt 3 |
| `backend/pyproject.toml`     | Python backend configuration and linting rules          | Prompt 4 |
| `frontend/package.json`      | Node.js frontend configuration and dependencies         | Prompt 4 |
| `.github/workflows/ci.yml`   | CI pipeline skeleton (linting & testing)               | Prompt 4 |
| `docs/DATASETS.md`           | Full dataset provenance & license details              | Prompt 6 |
| `scripts/download_pretraining_datasets.py` | Python script to fetch public corpora         | Prompt 6 |
| `KNOWN_LIMITATIONS.md`       | Log of inaccessible datasets (e.g. Zenodo 403)         | Prompt 6 |
| `backend/app/instrumentation/` | Live telemetry collectors, schema, sampler, consent    | Prompt 7 |
| `backend/app/tests/test_instrumentation.py` | Unit tests for cross-platform schema logic   | Prompt 7 |
| `backend/app/tests/live_benchmark.py` | CPU overhead measurement script                   | Prompt 7 |
| `PERFORMANCE.md`             | Live benchmark results (CPU overhead budget)           | Prompt 7,8 |
| `backend/app/db/models/`     | SQLAlchemy time-series data models                     | Prompt 8,9 |
| `backend/app/workers/`       | Async batched DB telemetry ingest worker               | Prompt 8 |
| `backend/app/api/`           | FastAPI REST endpoints (processes, resources, health)  | Prompt 8,9 |
| `backend/app/access/`        | Access tier definitions, in-memory state, and payload filters | Prompt 9 |
| `backend/app/tests/test_access_policy.py` | Unit tests for access tier filtering and API logic | Prompt 9 |
| `backend/app/ml/features/`   | Resource sliding window and Graph Adjacency feature extractors | Prompt 10 |
| `backend/app/ml/forecasting/`| LSTM system saturation model and SMA baseline          | Prompt 10 |
| `backend/app/ml/gnn/`        | GCN model for process contention and Centrality baseline| Prompt 10 |
| `backend/app/ml/anomaly/`    | MLP residual leak detector and Z-Score baseline        | Prompt 10 |
| `docs/AI_PIPELINE.md`        | Evaluation metrics for AI pipeline on telemetry DB     | Prompt 10 |
| `frontend/DESIGN_SYSTEM.md`  | Documentation of Kernel Ring color hierarchy and glass tokens | Prompt 11 |
| `frontend/lib/api-client.ts` | Typed fetch client attaching `X-Access-Level` headers  | Prompt 11 |
| `frontend/app/(landing)/page.tsx` | The visual access-level selector (Auth replacement) | Prompt 11 |
| `frontend/components/ui/`    | Custom Tailwind glassmorphic UI primitives             | Prompt 11 |
| `frontend/app/processes/page.tsx`| Process tree main visualization wrapper page           | Prompt 12 |
| `frontend/components/process-tree/`| React Flow node logic and dagre layout orchestrator | Prompt 12 |
| `frontend/components/process-detail/`| Detailed process panel rendering deep OS properties | Prompt 12 |
| `backend/app/api/memory.py`  | Aggregates system memory telemetry and leak predictions| Prompt 13 |
| `frontend/components/memory-map/` | System memory block pressure framer-motion visuals     | Prompt 13 |
| `frontend/components/leak-timeline/` | D3.js historical memory charts with prediction overlays| Prompt 13 |
| `backend/app/api/scheduler.py` | Distributes per-core CPU load and OS telemetry stream  | Prompt 14 |
| `frontend/app/scheduler/page.tsx`| Master CPU scheduler UI container page                 | Prompt 14 |
| `frontend/components/core-heatmap/`| Framer-motion animated 16-core visualizer              | Prompt 14 |
| `frontend/components/scheduler/`| Access-gated raw event terminal (`kernel` clearance)   | Prompt 14 |
| `backend/app/ml/incident_engine.py`| Background worker escalating predictions to incidents  | Prompt 15 |
| `backend/app/llm/explain_incident.py`| Bounded, cached mock LLM interface for diagnostics   | Prompt 15 |
| `frontend/app/dashboard/page.tsx`| Master System Health dashboard aggregating incidents   | Prompt 15 |
| `docs/PERFORMANCE.md`          | End-to-end stack profiling findings and guidelines     | Prompt 16 |
