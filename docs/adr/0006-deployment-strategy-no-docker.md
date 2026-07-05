# ADR-0006: Deployment Strategy — No Docker/Kubernetes

> **Status:** Accepted
> **Date:** 2026-07-05
> **Deciders:** Project architect
> **Context:** Hard Constraint #1 in [memory.md](file:///c:/Users/GARV%20ANAND/Downloads/KernelSense/memory.md)

---

## Context

KernelSense is an OS observatory that reads live kernel telemetry. Its deployment model must support:

1. **Direct OS access** — psutil, `/proc`, perf_events, eBPF all require unmediated access to the host kernel.
2. **Single-user local operation** — runs on the developer's own machine.
3. **Minimal infrastructure** — no ops team, no cloud account required.

### Alternatives Considered

| Option | Description | Rejected Because |
| :----- | :---------- | :--------------- |
| **A: Docker Compose** | Backend + TimescaleDB + Redis in containers | Containers abstract away the host kernel — psutil inside a container sees the container's cgroup, not the host. eBPF requires `--privileged` + host PID namespace. Defeats the purpose. |
| **B: Kubernetes** | Full K8s deployment | Massive overkill for a single-process local tool. Requires cluster setup. Same host-kernel access problem as Docker, amplified. |
| **C: Docker for DB only** | Backend runs on host; TimescaleDB + Redis in Docker | Acceptable compromise but adds Docker as a dependency. Users who don't have Docker installed now need to install it just for DB. |
| **D: No containers** (selected) | Backend + TimescaleDB + Redis all run directly on host | Maximum simplicity. Direct kernel access. No abstraction layers. |

---

## Decision

**No Docker. No Kubernetes.** Deploy as:

```
Single backend process (Python/FastAPI via Uvicorn)
+ TimescaleDB (locally installed or managed cloud)
+ Redis (locally installed)
+ Frontend (Next.js dev server or static build served by backend)
```

### Installation Target

```bash
# Linux (Ubuntu/Debian)
sudo apt install timescaledb-2-postgresql-16 redis-server
pip install kernelsense
kernelsense start

# macOS
brew install timescaledb redis
pip install kernelsense
kernelsense start

# Windows
# Install PostgreSQL + TimescaleDB extension + Redis (via chocolatey or MSI)
# pip install kernelsense
# kernelsense start
```

### Why Docker Is Specifically Harmful for This Project

1. **Container kernel isolation:** A container has its own PID namespace, cgroup, and (optionally) network namespace. `psutil.process_iter()` inside a container lists container processes, not host processes. This fundamentally breaks KernelSense's purpose.

2. **eBPF in containers:** Loading eBPF programs from inside a container requires `--privileged` mode, access to the host's `/sys/kernel/debug`, and the host's kernel headers. This is fragile, non-portable, and voids most of Docker's isolation benefits.

3. **perf_events in containers:** Requires `--cap-add SYS_ADMIN` or `--cap-add PERFMON` and `--pid=host` — again breaking container isolation.

4. **Target audience:** KernelSense users are developers and SREs who already have Python and PostgreSQL accessible. Docker adds friction, not simplicity, for this audience.

---

## Consequences

### Positive
- Direct, unmediated access to the host kernel — psutil, /proc, perf_events, eBPF all work as intended.
- No container abstraction layer to debug when metrics look wrong.
- Simpler installation for the target audience (pip install + system packages).
- No Docker Desktop license concerns on commercial machines.

### Negative
- Users must install TimescaleDB and Redis themselves (mitigated: install script + setup guide).
- No reproducible environment guarantee (mitigated: `requirements.txt` + version pinning + CI testing on bare metal).
- No one-command startup (mitigated: `kernelsense start` CLI that verifies dependencies and starts all components).

### Future Consideration
- Docker could be supported for CI/CD (running tests, not monitoring) where host kernel access is not needed.
- A managed TimescaleDB cloud instance (Timescale Cloud) could replace local installation for users who prefer not to install Postgres.
