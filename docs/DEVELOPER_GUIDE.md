# Developer Guide

Welcome to the KernelSense codebase. This document outlines how the stack is organized so you can start contributing quickly.

## Backend Architecture (FastAPI)
The backend is located in `backend/app`. It follows a strict dependency injection model.

- **`api/`**: The FastAPI routers. Do NOT put business logic here. Routers should strictly parse requests, check `AccessState`, and call Repositories.
- **`db/`**: SQLAlchemy 2.0 Async engine.
  - **`models/`**: Define your schema here. Ensure new tables inherit from `Base`.
  - **`repositories/`**: Complex SQL queries (e.g. fetching the latest window of telemetry) live here.
- **`ml/`**: The Artificial Intelligence engine.
  - **`train_and_infer.py`**: The raw PyTorch models (LSTM/GNN).
  - **`incident_engine.py`**: The background worker that promotes predictions to incidents.
- **`workers/`**: The `TelemetryIngestWorker` which loops at 1Hz writing to the DB.

### Adding a new OS Metric
1. Write the collector logic in `backend/app/instrumentation`.
2. Update the `ProcessSnapshot` or `ResourceMetric` SQLAlchemy model.
3. Update the `TelemetryIngestWorker` to save the new field.

## Frontend Architecture (Next.js)
The frontend is in `frontend/app`. We use the App Router.

- **`components/ui/`**: Reusable Design System tokens (Buttons, Cards, Badges).
- **`components/[feature]/`**: Complex visualization logic (e.g. `process-tree`, `core-heatmap`).
- **`lib/store/`**: `Zustand` global state management.
- **`lib/api-client.ts`**: Axios wrapper that automatically injects the `X-Access-Level` header.

### Performance Rule
Never render high-frequency event streams directly to the React DOM. If you are building a new visualizer, use a canvas-based approach (like D3) or aggregate the events mathematically (see `ContextSwitchStream`) to avoid freezing the browser.
