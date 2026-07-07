<div align="center">
  <h1>KernelSense: OS Universe</h1>
  <p><strong>The Operating System is no longer a black box. It is a living, breathing universe.</strong></p>
  <p>
    An interactive, WebGL-accelerated Operating System Digital Twin. We abandoned traditional dashboards to build an infinite canvas where every core OS concept is visualized, animated, and observable in real-time.
  </p>
</div>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green)](https://fastapi.tiangolo.com/)

KernelSense is a cross-platform telemetry engine connected to an **immersive React Flow infinite canvas**. It translates raw OS metrics (eBPF/ETW) into a stunning, animated representation of your machine's internals. 

**Why not just use `htop` or Task Manager?**
Because metrics don't teach you *how* an OS works. KernelSense is built for visual learners, engineers, and computer science students. It answers the question: *How can a user see, understand, interact with, and learn what the Operating System is actually doing internally, in real time?*

## 🌌 The OS Universe

The UI is a perfectly symmetric, 3-tier architectural diagram of your machine, featuring **15 Animated Custom Nodes**:

### 1. User Space (Top Tier)
* **Process Genealogy:** A living tree of parent/child process relationships.
* **Network Stack:** Visualizes live socket throughput and packet streams.
* **Inter-Process Comm:** Visualizes anonymous pipes and shared memory segments.

### 2. Kernel Core (Middle Tier)
* **CPU Scheduler:** Watch processes flow through Ready and Blocked queues, executing on cores.
* **Deadlock Detector:** A Resource Allocation Graph dynamically drawing "Holds" and "Waits" vectors.
* **Context Switch Engine:** Visualizes the micro-state transitions of flushing TLBs and saving registers.
* **Virtual File System:** Visualizes the Global File Descriptor Table and Inode Cache.
* **System Calls:** Live tracking of kernel traps.

### 3. Hardware & Memory (Bottom Tier)
* **Memory Management Unit (MMU):** Maps Virtual Space to Physical RAM, highlighting page faults.
* **Swap Space:** Disk paging area with real-time thrashing anomaly detection.
* **Block I/O Storage:** Visualizes disk read/write throughput and buffer caches.
* **Hardware IRQs:** Live Interrupt Vector Table.
* **GPU & Energy:** Compute utilization, VRAM allocation, package thermals, and power draw.

## ⏪ Historical DVR Time-Travel
Noticed a spike in CPU? Don't miss it. Use the **Timeline DVR Scrubber** at the bottom of the screen to seamlessly pause the live feed, drag the slider back in time, and watch the entire OS Universe rewind to the exact state of the machine 5 minutes ago. 

## 🤖 AI Professor
Integrated directly into the canvas, the AI Professor panel continuously analyzes the live telemetry and historical state. Ask it why a specific process is blocked, and it will explain the exact OS mechanics (e.g., waiting on I/O, waiting on a mutex) using the live context of your machine.

---

## 🚀 Quick Start

### 1. Backend Service (Telemetry Ingestion & DVR)
```bash
git clone https://github.com/Garvanand/KernelSense.git
cd KernelSense/backend

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start the ingestion worker and FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend Universe (Next.js + React Flow)
```bash
cd ../frontend
npm install

# Launch the infinite canvas
npm run dev
```
Open `http://localhost:3000` to enter the OS Universe.

---

## Architecture
1. **Instrumentation (Python):** Collects metrics via `psutil`, eBPF (Linux), or ETW (Windows) at 1-5Hz.
2. **Local Database (SQLite):** Buffers telemetry for the Historical DVR timeline.
3. **WebSocket Stream:** Pushes JSON payloads of the active system state to the frontend.
4. **Zustand + React Flow:** The UI intercepts the data, mapping it to the 15 animated nodes on the WebGL canvas, intercepting updates when the DVR is active.

## License
KernelSense is distributed under the MIT License. See `LICENSE` for more information.n.
