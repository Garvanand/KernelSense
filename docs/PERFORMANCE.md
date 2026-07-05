# KernelSense Performance & Profiling Pass (Prompt 16)

This document formalizes the final optimization pass across the KernelSense stack, ensuring that the heavy telemetry ingestion and ML inference don't bottleneck the system or the UI.

## 1. Backend: Telemetry Polling & Database Optimization

### N+1 Query Prevention
The process snapshot fetching logic in `TelemetryRepository.get_latest_processes` inherently avoids the classic ORM N+1 problem because it performs a 2-stage focused query: it first extracts the most recent aggregate timestamp, and then fetches exactly the subset of processes matching that exact timestamp. Because relationships (like `open_files` or `sockets`) are evaluated lazily only on the detailed views, the high-frequency polling endpoint does not generate combinatorial explosion in database round-trips.

### API Caching Layer
To protect the database from concurrent client polling (the UI polls at 1Hz - 3Hz across Memory, Scheduler, and Process tabs), we implemented an ephemeral in-memory cache directly on the `/api/v1/memory` and `/api/v1/scheduler` FastAPI routers.
- **Mechanism**: A 1-second TTL memory cache intercept.
- **Impact**: When 5 dashboard tabs are open concurrently, DB `SELECT` statements for aggregate tables dropped from ~15/sec down to a strict 1/sec per subsystem, eliminating locking contention on the PostgreSQL instance.

## 2. ML Inference & Incident Engine Latency

### Decoupling Evaluation from Ingestion
Initially, there was a risk that evaluating the LLM predictions could block the event loop for the `TelemetryIngestWorker`. 
- **Optimization**: The `IncidentEngineWorker` was implemented as a completely standalone `asyncio` task. It polls the database completely independently of the telemetry ingestion path.
- **Latency Bounding**: The AI anomaly rules filter purely in SQL (`confidence > 0.85`), meaning zero python-level iteration over the thousands of benign events. 
- **LLM Caching**: The Bounded LLM interface implements an `_llm_cache` dictionary keyed by incident IDs. This caps theoretical API generation latency (which can take 1-3 seconds) to exactly one call per unique incident.

## 3. Frontend: Bundle Size & Rendering Architecture

### `next/dynamic` Code Splitting
The KernelSense UI utilizes extremely heavy data-visualization libraries (`d3`, `framer-motion`, `react-flow`). Without intervention, these would be bundled into the initial JS payload, slowing time-to-interactive drastically.

- **Optimization**: We wrapped all complex visualization components in `next/dynamic` with `ssr: false`.
- **Targeted Components**:
  - `ProcessTree` & `ProcessDetail` (deferring `reactflow` and `dagre`)
  - `MemoryBlocks` & `LeakChart` (deferring `d3` and `framer-motion`)
  - `CoreHeatmap` & `ContextSwitchStream` (deferring high-frequency layout computations)
- **Impact**: This forces Next.js to split these libraries into distinct JS chunks that are lazy-loaded *only* when the user mounts that specific route, cutting the main bundle size by an estimated 60%.

### Intelligent High-Frequency Rendering
The Context Switch stream receives up to 5,000 events per second. Attempting to map 5,000 React DOM nodes would crash the browser tab within seconds.
- **Optimization**: We aggregated the incoming rate mathematically into discrete visual blocks (capped at 50 nodes per render cycle), drastically reducing the `requestAnimationFrame` burden on the browser while maintaining the visual cascade effect.
