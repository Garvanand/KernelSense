# ADR-0002: Telemetry Strategy — Cross-Platform Normalization

> **Status:** Accepted
> **Date:** 2026-07-05
> **Deciders:** Project architect
> **Context:** [OPERATING_SYSTEM_ARCHITECTURE.md](file:///c:/Users/GARV%20ANAND/Downloads/KernelSense/docs/OPERATING_SYSTEM_ARCHITECTURE.md)

---

## Context

KernelSense must collect telemetry from Linux, Windows, and macOS. These operating systems expose fundamentally different kernel APIs, metric names, and data models:

- Linux memory: `buffers`, `cached`, `shared`, `active`, `inactive` (from `/proc/meminfo`).
- macOS memory: `wired`, `active`, `inactive`, `free` (from `vm_stat`).
- Windows memory: `commit`, `standby`, `available` (from `GlobalMemoryStatusEx`).
- Linux has `iowait` CPU time; Windows and macOS do not.
- Only Linux supports eBPF; only Windows supports ETW; macOS dtrace is blocked by SIP.

The question: how do we normalize this into a single schema that the AI models and frontend can consume without per-platform branching?

Considered alternatives:
- **Platform-specific schemas** — separate schema per OS. Simplest to implement but forces per-platform branching in every consumer (AI models, API, frontend).
- **Lowest-common-denominator** — only include fields available on all platforms. Loses Linux eBPF and Windows ETW entirely.
- **Union schema with nullable fields** — superset of all fields; NULL where unavailable on a platform.

---

## Decision

Use a **union schema with nullable fields and platform enrichment layers**.

### Design

```
┌─────────────────────────────────────────┐
│         Common Schema (core fields)      │
│  cpu.percent, mem.total, disk.io, etc.   │
│  Available on ALL platforms              │
├─────────────────────────────────────────┤
│      Platform Extensions (nullable)      │
│  linux.iowait, linux.ebpf.*             │
│  windows.disk_queue_length              │
│  macos.wired_bytes                      │
│  NULL if not on this platform           │
└─────────────────────────────────────────┘
```

### Rules

1. **Core fields** are guaranteed non-NULL on all platforms: `cpu.percent`, `mem.total_bytes`, `mem.used_bytes`, `mem.percent`, `disk.read_bytes`, `disk.write_bytes`, `net.bytes_sent`, `net.bytes_recv`.
2. **Extended fields** are nullable: `cpu.iowait_percent` (NULL on Windows/macOS), `mem.wired_bytes` (NULL on Linux/Windows), etc.
3. **Platform prefix** for OS-specific fields beyond the common set: `linux.*`, `windows.*`, `macos.*`.
4. **AI models** are trained on the union schema with masked arrays — NULL fields are masked during feature engineering, not imputed.
5. **Frontend** checks field availability before rendering — unavailable metrics are hidden (not shown as blank or zero).
6. **API responses** include a `platform_info` field indicating which extensions are populated.

---

## Consequences

### Positive
- Single schema for all consumers — no per-platform branching in AI models or frontend.
- Linux users get full depth without being constrained by Windows/macOS limitations.
- Models trained on Linux data can still infer on Windows/macOS using the core field subset.
- Adding a new platform-specific field is additive (new nullable column), not a breaking change.

### Negative
- Schema has many nullable fields — requires discipline in frontend and model code.
- Database rows are wider than needed on any single platform (mitigated: TimescaleDB compression handles sparse columns efficiently).
- Documentation must clearly specify which fields are available on which platform (mitigated: [OPERATING_SYSTEM_ARCHITECTURE.md](file:///c:/Users/GARV%20ANAND/Downloads/KernelSense/docs/OPERATING_SYSTEM_ARCHITECTURE.md) serves as the canonical reference).
