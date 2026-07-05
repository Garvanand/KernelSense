# KernelSense — Project Memory

> **"Your operating system, understood and foreseen."**
>
> Last updated: 2026-07-05 · Prompt 3 (System Design)
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
| `docs/DATASETS.md`           | (Future) Full dataset provenance & license details     | Prompt 4+ |
