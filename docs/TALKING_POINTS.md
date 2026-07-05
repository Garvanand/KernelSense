# Engineering Talking Points

KernelSense presented severe, multifaceted engineering challenges. Below are the five hardest problems solved during development and their respective architectures.

## 1. High-Frequency DOM Rendering vs React Lifecycle
**The Problem**: The OS context-switch stream can exceed 5,000 events per second under load. Simply iterating and rendering 5,000 React components (e.g., `<div key={id}>`) every second instantly freezes the browser thread, causing "Unresponsive Page" errors.
**The Solution**: We abandoned 1:1 event mapping. Instead, we implemented a mathematical aggregator in the frontend (`ContextSwitchStream`) that bins high-frequency events into visual "ticks" representing aggregate volume over a 300ms window. This capped DOM mutations to a maximum of 50 nodes per render cycle, completely eliminating browser freezing while maintaining the visual illusion of a cascading event stream.

## 2. Decoupling ML Inference from Telemetry Ingestion
**The Problem**: OS Telemetry must be collected faithfully at 1Hz (1 second) intervals to build an accurate time-series profile. However, evaluating a PyTorch LSTM model or an LLM on this data can take 1-3 seconds. If they shared an event loop, the ML inference would "block" the ingestion, causing massive gaps in the collected telemetry.
**The Solution**: Total isolation via asynchronous `asyncio` background workers. The `TelemetryIngestWorker` handles rapid DB inserts natively. Entirely separately, the `IncidentEngineWorker` wakes up, evaluates the past minute of data, and writes back to the `Prediction` table. The two never block each other.

## 3. The "N+1 Query" Trap on Dashboard Dashboards
**The Problem**: The unified dashboard queries the `/processes` API at 1Hz. If we used standard SQLAlchemy lazy-loading on relationships (e.g., `process.open_files`), pulling 100 processes would result in 101 database queries every single second—rapidly crashing SQLite.
**The Solution**: We explicitly partitioned the API. The high-frequency polling endpoint uses a highly optimized 2-stage query that isolates a specific timestamp and fetches only flat aggregates. Relationships are only `joinedload` fetched when a user clicks into the specific `ProcessDetailPanel`, dropping our ambient polling query count from 101/sec to 2/sec.

## 4. Bounding LLM "Hallucination" in Diagnostics
**The Problem**: Allowing an LLM to analyze raw OS telemetry often results in verbose, hallucinatory essays about unrelated system libraries. We needed actionable, precise diagnostics without the latency of an open-ended chatbot.
**The Solution**: We implemented the "Bounded LLM Interface" (ADR-0004). The LLM is invoked strictly via Pydantic schema constraints. It is fed an aggressively culled JSON payload of the anomaly and is programmatically forced to output exactly two fields: a 2-sentence `diagnostic` and a 1-sentence `remediation`. 

## 5. Client-Driven Zero-Trust Security without Auth Servers
**The Problem**: We wanted to showcase a granular permissions model (Guest vs Kernel clearance) without forcing users to deploy an OAuth server or PostgreSQL user table just to view local telemetry.
**The Solution**: We implemented a stateless, header-based "Clearance Level Model" (ADR-0005). The Next.js frontend uses `Zustand` to persist the selected level, injecting an `X-Access-Level` header into every `axios` request. The FastAPI backend employs a strict Dependency Injection `get_tier()` middleware that parses the header and enforces 403 Forbidden checks at the router level. Security is enforced server-side, but state is stateless.
