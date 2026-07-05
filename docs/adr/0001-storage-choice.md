# ADR-0001: Storage Choice — TimescaleDB + Postgres + Redis

> **Status:** Accepted
> **Date:** 2026-07-05
> **Deciders:** Project architect
> **Context:** [SYSTEM_DESIGN.md §5](file:///c:/Users/GARV%20ANAND/Downloads/KernelSense/docs/SYSTEM_DESIGN.md)

---

## Context

KernelSense needs to store three categories of data:

1. **High-frequency time-series telemetry** — system metrics sampled at 1–10 Hz, retained for 24 hours, with rollups for historical views.
2. **Process/resource dependency graph** — a mutable graph of ~500 nodes (processes, files, sockets) and ~2000 edges (open-file, IPC, parent-child), updated every sampling interval.
3. **Hot-path cache** — the latest metric snapshot for instant WebSocket broadcast, plus session state (access-level tier), with sub-millisecond read latency.

Considered alternatives:
- **InfluxDB** — purpose-built time-series DB, but no relational features for the graph layer; adds a second database dependency.
- **SQLite** — zero-dependency, but lacks hypertable partitioning, continuous aggregates, and concurrent write performance under sustained 10 Hz load.
- **Prometheus + Grafana** — pull-based model doesn't fit our push-from-collector architecture; Grafana would replace our custom frontend (unacceptable — the frontend *is* the product).
- **Pure Redis** — insufficient for historical queries and retention management; data loss on restart.
- **MongoDB** — general-purpose document store; no native time-series optimization; no continuous aggregates.

---

## Decision

Use **TimescaleDB** (a PostgreSQL extension) as the primary data store, **PostgreSQL** (same instance) for graph adjacency tables, and **Redis** as the hot-path cache.

### Rationale

| Requirement | TimescaleDB Solution |
| :---------- | :------------------- |
| High-frequency ingestion (10 Hz × 200 metrics) | Hypertable with time-based partitioning; benchmarked at >100K inserts/sec on single node |
| Rolling retention (raw: 4h, rollup: 24h) | Native `add_retention_policy()` and `drop_chunks()` |
| Historical rollups for dashboard views | Continuous aggregates (materialized views that auto-update) |
| Compression for storage efficiency | Native columnar compression (10–20× for time-series) |
| Graph storage | Same Postgres instance — adjacency tables with JSONB metadata |
| SQL compatibility | Full PostgreSQL SQL — complex joins, window functions, CTEs |
| Single database dependency | TimescaleDB *is* PostgreSQL — one process, one connection string |

Redis handles:
- `telemetry:latest` — last snapshot for instant WebSocket broadcast (TTL 5s).
- `tier:session:*` — access-level session state (TTL 1h).
- `pubsub:telemetry` / `pubsub:predictions` — fan-out channels for WebSocket hub.

---

## Consequences

### Positive
- Single database process (TimescaleDB = Postgres) reduces operational complexity.
- Continuous aggregates provide pre-computed rollups without ETL pipelines.
- Graph tables live in the same Postgres instance — no additional dependency.
- Redis adds sub-millisecond latency for the hot path.

### Negative
- TimescaleDB requires installation beyond vanilla Postgres (mitigated: available via `apt`, `brew`, or managed cloud).
- Redis is an additional process (mitigated: lightweight, stateless by design for our use case — all durable data is in Postgres).
- 10 Hz × 200 metrics generates ~172M rows/day before compression (mitigated: 4h raw retention + compression reduces effective storage to <1 GB/day).

### Risks
- **ASSUMPTION A5:** TimescaleDB single-node handles ≥10 Hz × 200 metrics sustainably. **Owner: Prompt 5** — will benchmark with synthetic load.
