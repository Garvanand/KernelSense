# Installation & Setup Guide

KernelSense uses standard Python and Node.js environments, but deep tracing requires specific OS configurations.

## Standard Installation

### 1. Database
By default, KernelSense runs on an embedded asynchronous SQLite database (`telemetry.db`). No configuration is required.
For production setups, we recommend TimescaleDB (PostgreSQL). Simply set the environment variable:
`DATABASE_URL=postgresql+asyncpg://user:pass@localhost/kernelsense`

### 2. Python Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 3. Node.js Frontend
```bash
cd frontend
npm install
npm run dev
```

## Enhanced Telemetry (OS-Specific)

### Linux (eBPF)
To collect exact scheduler context switches and system call traces, KernelSense falls back from `psutil` to `eBPF` via the `bcc` toolchain.
1. Install Linux Headers: `sudo apt-get install linux-headers-$(uname -r)`
2. Install BCC: `sudo apt-get install bpfcc-tools libbpfcc libbpfcc-dev`
3. Run the backend as root (required for `CAP_SYS_ADMIN`): `sudo venv/bin/uvicorn app.main:app`

### Windows (ETW)
*Currently, Windows ETW tracing is mocked in development. True ETW integration is pending Phase 2 of the Roadmap.*

### macOS (EndpointSecurity)
*Currently, macOS EndpointSecurity is mocked. Baseline metrics use `psutil`.*
