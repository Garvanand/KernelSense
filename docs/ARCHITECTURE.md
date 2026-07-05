# KernelSense — Architecture Overview

> `docs/ARCHITECTURE.md` · v1.0 · 2026-07-05 · Prompt 3
>
> High-level architecture, component interaction model, and technology rationale.
> For detailed schemas and API contracts, see [SYSTEM_DESIGN.md](file:///c:/Users/GARV%20ANAND/Downloads/KernelSense/docs/SYSTEM_DESIGN.md).
> For ADRs, see [docs/adr/](file:///c:/Users/GARV%20ANAND/Downloads/KernelSense/docs/adr/).

---

## 1. Architecture Philosophy

KernelSense follows three architectural principles:

1. **Layered Isolation** — Each layer (instrumentation → storage → AI → API → frontend) communicates through well-defined interfaces. A failure in one layer degrades but does not crash the system.
2. **Progressive Disclosure** — Telemetry depth, AI features, and UI complexity increase only as the user explicitly opts in through the access-level model.
3. **Read-Only Safety** — The system observes but never modifies. Every component is designed with the assumption that KernelSense has zero write access to the OS it monitors.

---

## 2. Component Architecture

```mermaid
graph TB
    subgraph USER["User's Machine"]
        subgraph FE["Frontend Layer"]
            NEXT["Next.js App<br/>TypeScript + TailwindCSS"]
            D3["D3.js Charts"]
            RF["React Flow Graph"]
            FM["Framer Motion<br/>Animations"]
        end

        subgraph BE["Backend Layer (Single Process)"]
            FAST["FastAPI<br/>ASGI Server (Uvicorn)"]
            ALE["Access-Level<br/>Engine"]
            
            subgraph WORKERS["Background Workers"]
                COLL["Collector<br/>Worker"]
                INFER["Inference<br/>Workers"]
                MAINT["Maintenance<br/>Worker"]
            end
        end

        subgraph INST["Instrumentation Layer"]
            PSUTIL["psutil<br/>(cross-platform)"]
            PROC["/proc + perf_events<br/>(Linux)"]
            EBPF["eBPF<br/>(Linux, elevated)"]
            WMI["WMI + Perf Counters<br/>(Windows)"]
            ETW["ETW<br/>(Windows, admin)"]
            VMSTAT["vm_stat<br/>(macOS)"]
        end

        subgraph DATA["Data Layer"]
            TSDB[("TimescaleDB")]
            PG[("Postgres<br/>Graph Tables")]
            REDIS[("Redis")]
        end

        subgraph AI["AI Engine"]
            LSTM["LSTM<br/>Forecaster"]
            ANOM["Anomaly<br/>Detector"]
            GNN["GNN<br/>Contention"]
            LLM["LLM Explainer<br/>(External API)"]
        end
    end

    NEXT <-->|"REST + WS"| FAST
    D3 & RF & FM --> NEXT
    FAST --> ALE
    ALE --> COLL & INFER & MAINT

    COLL --> PSUTIL & PROC & EBPF & WMI & ETW & VMSTAT
    COLL -->|"normalized snapshots"| TSDB & REDIS & PG

    INFER --> LSTM & ANOM & GNN
    LSTM & ANOM -->|"predictions"| REDIS & TSDB
    GNN -->|"contention scores"| REDIS
    LSTM & ANOM & GNN -->|"confirmed events"| LLM

    TSDB --> FAST
    REDIS --> FAST
    PG --> GNN
    MAINT --> TSDB
```

---

## 3. Layer Responsibilities

### Layer 1: Instrumentation

| Responsibility | Detail |
| :------------- | :----- |
| **Collect** | Poll or subscribe to OS telemetry APIs at the configured sampling rate |
| **Normalize** | Transform platform-specific data into the common `TelemetrySnapshot` schema |
| **Enrich** | Attach platform-specific extension fields (e.g., `linux.iowait`, `windows.disk_queue_length`) |
| **Detect** | Probe OS capabilities at startup; report maximum achievable tier |
| **Degrade** | On `AccessDenied` or unavailable API, skip and continue — never crash |

### Layer 2: Storage

| Responsibility | Detail |
| :------------- | :----- |
| **Ingest** | Write `TelemetrySnapshot` rows to TimescaleDB hypertable |
| **Retain** | Enforce rolling retention: raw (1–4h), downsampled (24h), compressed |
| **Graph** | Maintain process/resource adjacency lists in Postgres |
| **Cache** | Redis: latest snapshot, session tier state, pub/sub for WebSocket |

### Layer 3: AI Engine

| Responsibility | Detail |
| :------------- | :----- |
| **Forecast** | LSTM over sliding windows → saturation probability + ETA |
| **Detect** | Statistical + learned residual over memory growth curves → leak probability |
| **Correlate** | GNN over process/resource graph → contention/deadlock risk scores |
| **Explain** | Bounded LLM call: structured JSON in → plain-language out (1 call per event) |

### Layer 4: Backend API

| Responsibility | Detail |
| :------------- | :----- |
| **Serve** | REST endpoints for snapshots, history, predictions, access-level |
| **Stream** | WebSocket hub for real-time telemetry and prediction updates |
| **Gate** | Access-level middleware: enforce tier requirements on every request |
| **Orchestrate** | Manage background workers for collection, inference, maintenance |

### Layer 5: Frontend

| Responsibility | Detail |
| :------------- | :----- |
| **Visualize** | Kernel-ring dashboard, D3.js time-series charts, React Flow graph |
| **Interact** | Mode selector with consent dialogs for tier elevation |
| **Stream** | WebSocket consumer for real-time updates |
| **Degrade** | Hide unavailable metrics/visualizations based on current tier |

---

## 4. Communication Patterns

```mermaid
sequenceDiagram
    participant OS as Operating System
    participant COLL as Collector Worker
    participant REDIS as Redis
    participant TSDB as TimescaleDB
    participant INFER as Inference Worker
    participant API as FastAPI
    participant WS as WebSocket Hub
    participant UI as Frontend

    loop Every sampling interval
        COLL->>OS: Read telemetry (psutil/proc/perf/ebpf)
        OS-->>COLL: Raw metrics
        COLL->>COLL: Normalize → TelemetrySnapshot
        par Write to storage
            COLL->>TSDB: INSERT telemetry row
            COLL->>REDIS: SET telemetry:latest
            COLL->>REDIS: PUBLISH pubsub:telemetry
        end
    end

    REDIS-->>WS: Subscription message
    WS-->>UI: WebSocket frame (tier-filtered)

    loop Every inference interval
        INFER->>TSDB: Query sliding window
        TSDB-->>INFER: Metric windows
        INFER->>INFER: LSTM forward pass
        alt Prediction above threshold
            INFER->>REDIS: SET prediction:latest
            INFER->>REDIS: PUBLISH pubsub:predictions
            INFER->>TSDB: INSERT prediction row
            opt Research tier active
                INFER->>LLM: Bounded API call (structured JSON)
                LLM-->>INFER: Explanation + suggested action
                INFER->>TSDB: UPDATE prediction with explanation
            end
        end
    end

    UI->>API: GET /predictions/latest
    API->>REDIS: GET prediction:latest:*
    REDIS-->>API: Cached predictions
    API-->>UI: JSON response (tier-filtered)
```

---

## 5. Technology Map

```mermaid
graph LR
    subgraph "Data Collection"
        A1[psutil 5.9+]
        A2[bcc / libbpf]
        A3[perf_events]
        A4[WMI / pywin32]
    end

    subgraph "Data Storage"
        B1[TimescaleDB 2.14+]
        B2[PostgreSQL 16+]
        B3[Redis 7+]
    end

    subgraph "AI / ML"
        C1[PyTorch 2.2+]
        C2[ONNX Runtime]
        C3[PyG 2.5+]
        C4["OpenAI / Anthropic SDK"]
    end

    subgraph "Backend"
        D1[FastAPI 0.110+]
        D2[Uvicorn 0.30+]
        D3[SQLAlchemy 2.0+]
        D4[Pydantic 2.0+]
        D5[structlog]
    end

    subgraph "Frontend"
        E1[Next.js 14+]
        E2[TypeScript 5.4+]
        E3[TailwindCSS 3.4+]
        E4[D3.js 7+]
        E5[React Flow 12+]
        E6[Framer Motion 11+]
    end

    A1 & A2 & A3 & A4 --> B1 & B3
    B1 --> C1 & C2
    B2 --> C3
    C1 & C2 & C3 --> D1
    C4 --> D1
    D1 --> E1
```

---

## 6. Failure Modes & Resilience

| Failure | Impact | Automatic Recovery |
| :------ | :----- | :----------------- |
| **psutil call fails** | Missing one snapshot | Skip, retry on next interval. Log warning. |
| **eBPF program load fails** | Research tier unavailable | Fall back to Power tier. Notify user via API. |
| **TimescaleDB connection lost** | No writes; reads fail | Retry with exponential backoff. Buffer to Redis (limited). |
| **Redis connection lost** | WebSocket stalls; cache miss | Fall back to direct DB reads. Reconnect. |
| **LSTM inference timeout** | No prediction for this cycle | Skip, retry on next cycle. Use last-known prediction. |
| **LLM API timeout (>5s)** | No explanation for this event | Use template-generated fallback explanation. |
| **GNN inference timeout** | No contention score | Skip. GNN is best-effort, non-critical. |
| **Frontend WebSocket drop** | UI freezes | Auto-reconnect with exponential backoff + jitter. |

---

## 7. Security Boundaries

```mermaid
graph TB
    subgraph UNTRUSTED["Untrusted Boundary"]
        UI["Frontend (browser)"]
    end

    subgraph TRUSTED["Trusted Boundary (local process)"]
        API["FastAPI + Access Gate"]
        AI["AI Engine"]
        COLL["Collectors"]
    end

    subgraph KERNEL["Kernel Boundary (elevated)"]
        EBPF["eBPF Programs"]
        PERF["perf_events"]
        ETW_K["ETW Kernel Logger"]
    end

    subgraph EXTERNAL["External Boundary"]
        LLM["LLM API<br/>(OpenAI / Anthropic)"]
    end

    UI -->|"localhost only"| API
    API --> AI & COLL
    COLL -->|"consent-gated"| EBPF & PERF & ETW_K
    AI -->|"1 call per event<br/>structured JSON only"| LLM
```

| Boundary | Trust Level | Controls |
| :------- | :---------- | :------- |
| **Frontend → API** | Untrusted | Server-enforced tier gating; all validation server-side; localhost binding |
| **API → Collectors** | Trusted | Same process; capability-verified before activation |
| **Collectors → Kernel** | Consent-gated | Explicit user consent; capability check; read-only programs only |
| **AI → LLM** | External | Structured JSON only; no raw telemetry; timeout + fallback; no PII in payload |

---

## 8. Deployment Topology

```
┌──────────────────────────────────────────────────────┐
│  User's Machine                                       │
│                                                       │
│  ┌────────────────────────────────────────────────┐   │
│  │  kernelsense (single process)                  │   │
│  │  ├── Uvicorn ASGI server (:8000)               │   │
│  │  ├── Collector workers (asyncio tasks)         │   │
│  │  ├── Inference workers (asyncio tasks)         │   │
│  │  └── Maintenance worker (asyncio task)         │   │
│  └────────────┬───────────────┬───────────────────┘   │
│               │               │                       │
│  ┌────────────▼────────┐ ┌────▼─────────┐            │
│  │  TimescaleDB (:5432)│ │ Redis (:6379)│            │
│  │  (local or managed) │ │   (local)    │            │
│  └─────────────────────┘ └──────────────┘            │
│                                                       │
│  ┌────────────────────────────────────────────────┐   │
│  │  Next.js dev server (:3000)                    │   │
│  │  OR static build served by Uvicorn              │   │
│  └────────────────────────────────────────────────┘   │
│                                                       │
│  No Docker. No Kubernetes. No reverse proxy.          │
│  See ADR-0006 for rationale.                          │
└──────────────────────────────────────────────────────┘
```

---

## 9. ADR Index

| ADR | Title | Status |
| :-- | :---- | :----- |
| [0001](file:///c:/Users/GARV%20ANAND/Downloads/KernelSense/docs/adr/0001-storage-choice.md) | Storage Choice: TimescaleDB + Postgres + Redis | Accepted |
| [0002](file:///c:/Users/GARV%20ANAND/Downloads/KernelSense/docs/adr/0002-telemetry-strategy-cross-platform.md) | Telemetry Strategy: Cross-Platform Normalization | Accepted |
| [0003](file:///c:/Users/GARV%20ANAND/Downloads/KernelSense/docs/adr/0003-ai-model-choices.md) | AI Model Choices: LSTM + GNN + Statistical | Accepted |
| [0004](file:///c:/Users/GARV%20ANAND/Downloads/KernelSense/docs/adr/0004-llm-usage-boundary.md) | LLM Usage Boundary: Single Bounded Call | Accepted |
| [0005](file:///c:/Users/GARV%20ANAND/Downloads/KernelSense/docs/adr/0005-access-level-model-no-auth.md) | Access-Level Model: No Auth, Consent-Gated Tiers | Accepted |
| [0006](file:///c:/Users/GARV%20ANAND/Downloads/KernelSense/docs/adr/0006-deployment-strategy-no-docker.md) | Deployment Strategy: No Docker/Kubernetes | Accepted |
