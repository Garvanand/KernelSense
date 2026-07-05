# API Documentation

KernelSense exposes a FastAPI REST interface running by default on `http://localhost:8000`.

## Zero-Trust Authentication
All API endpoints require the `X-Access-Level` header. Valid values:
- `guest`
- `power`
- `kernel`
- `research`

If a route requires a clearance level higher than what is provided, a `403 Forbidden` response is returned.

## Endpoints

### `GET /api/v1/health`
Returns system ingestion status. Requires `guest`.

### `GET /api/v1/processes`
Returns a snapshot of currently running processes, ordered by CPU usage.
- **Headers**: `X-Access-Level: guest`

### `GET /api/v1/processes/{pid}`
Returns deep inspection (open files, sockets) for a specific process.
- **Headers**: `X-Access-Level: kernel`

### `GET /api/v1/memory`
Returns aggregated system memory composition blocks and active AI anomaly predictions.
- **Headers**: `X-Access-Level: power`

### `GET /api/v1/scheduler`
Returns 16-core CPU utilization array and binned context-switch rates.
- **Headers**: `X-Access-Level: power`

### `GET /api/v1/scheduler/events`
Returns raw eBPF scheduler context-switch streams.
- **Headers**: `X-Access-Level: kernel`

### `GET /api/v1/incidents`
Returns escalated incident reports along with LLM-generated root-cause diagnostics.
- **Headers**: `X-Access-Level: research`
