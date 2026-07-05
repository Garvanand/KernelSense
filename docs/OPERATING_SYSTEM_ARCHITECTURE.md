# KernelSense — Operating System Interaction Architecture

> **[Post-Implementation Note (v1.0)]**: KernelSense implements a fallback telemetry collector structure. If the OS strictly prohibits deep tracing (e.g., eBPF `bpf()` syscall blocks on Linux without `CAP_SYS_ADMIN`), the telemetry engine silently and safely falls back to standard `psutil` sampling for cross-platform stability. We strictly adhered to the Read-Only constraint (ADR-0001) in all collector logic.

> `docs/OPERATING_SYSTEM_ARCHITECTURE.md` · v1.0 · 2026-07-05 · Prompt 3
>
> Maps every core OS concept to the specific telemetry fields KernelSense collects,
> the AI models that consume them, and the UI views that surface them.
> **No concept is theoretical-only — every entry has a concrete data source and visual.**

---

## Quick Reference Matrix

| # | OS Concept | Telemetry Source | Access Tier | AI Consumer | UI Surface |
| :- | :--------- | :--------------- | :---------- | :---------- | :--------- |
| 1 | Process Management | psutil, /proc | Guest+ | Anomaly Detector | Process table, process detail |
| 2 | CPU Scheduling | perf_events, eBPF | Power/Research | LSTM Forecaster | CPU gauge, scheduler timeline |
| 3 | Context Switching | perf_events, eBPF | Power/Research | LSTM Forecaster | Context-switch rate chart |
| 4 | Memory Management | psutil, /proc | Guest+ | LSTM, Anomaly | Memory gauge, allocation chart |
| 5 | Virtual Memory / Paging | psutil, /proc, eBPF | Guest/Research | LSTM Forecaster | Page fault rate, swap chart |
| 6 | Inter-Process Communication | /proc, eBPF | Power/Research | GNN Contention | Process graph (React Flow) |
| 7 | System Calls | eBPF | Research | GNN, Anomaly | Syscall frequency heatmap |
| 8 | Disk Scheduling / I/O | psutil, eBPF | Guest/Research | LSTM Forecaster | I/O throughput chart |
| 9 | File Systems | psutil, /proc | Guest+ | LSTM Forecaster | Disk usage gauge |
| 10 | Network Stack | psutil, /proc | Guest+ | LSTM Forecaster | Network throughput chart |
| 11 | Interrupts & Signals | /proc, eBPF | Power/Research | Anomaly Detector | Interrupt rate chart |
| 12 | CPU Caches & TLB | perf_events | Power+ | LSTM Forecaster | Cache miss rate chart |
| 13 | Process Synchronization | eBPF | Research | GNN Contention | Lock contention heatmap |
| 14 | Thread Management | psutil, /proc | Power+ | Anomaly Detector | Thread count chart |

---

## 1. Process Management

> **OS Concept:** The kernel maintains a process table (task_struct on Linux, EPROCESS on Windows) tracking every running, sleeping, and zombie process. Each process has a PID, state, priority, resource usage, and parent-child relationships.

### Telemetry Fields

| Field | Source | Tier | Type | Description |
| :---- | :----- | :--- | :--- | :---------- |
| `proc.pid` | psutil `Process.pid` | Power | int | Process identifier |
| `proc.ppid` | psutil `Process.ppid()` | Power | int | Parent process ID |
| `proc.name` | psutil `Process.name()` | Power | str | Process executable name |
| `proc.status` | psutil `Process.status()` | Power | str | running, sleeping, zombie, stopped |
| `proc.create_time` | psutil `Process.create_time()` | Power | float | Process creation timestamp (epoch) |
| `proc.cpu_percent` | psutil `Process.cpu_percent()` | Power | float | CPU usage percentage |
| `proc.mem_rss_bytes` | psutil `Process.memory_info().rss` | Power | int | Resident set size (physical memory) |
| `proc.mem_vms_bytes` | psutil `Process.memory_info().vms` | Power | int | Virtual memory size |
| `proc.num_threads` | psutil `Process.num_threads()` | Power | int | Active thread count |
| `proc.num_fds` | psutil `Process.num_fds()` | Power | int | Open file descriptor count (Linux/macOS) |
| `proc.io_read_bytes` | psutil `Process.io_counters()` | Power | int | Cumulative bytes read |
| `proc.io_write_bytes` | psutil `Process.io_counters()` | Power | int | Cumulative bytes written |
| `proc.children` | psutil `Process.children()` | Power | list | List of child PIDs |

### AI Consumer
- **Anomaly Detector:** Monitors `proc.mem_rss_bytes` growth curves per-process to detect memory leaks (steadily increasing RSS without release).
- **GNN Contention:** Uses parent-child and IPC relationships to build the process subgraph.

### UI Surface
- **Process Table:** Sortable table of all processes with CPU%, memory, threads, I/O. Power+ tier.
- **Process Detail View:** Per-process historical charts (CPU, memory, I/O over time). Power+ tier.
- **Process Tree:** Parent-child hierarchy visualization. Power+ tier.

### Platform Notes
| OS | Notes |
| :- | :---- |
| Linux | Full data via psutil + `/proc/[pid]/status`, `/proc/[pid]/io` |
| Windows | psutil uses `NtQuerySystemInformation`; some fields need elevated access for other users' processes |
| macOS | psutil provides basics; `num_fds` available; some process details limited by sandbox |

---

## 2. CPU Scheduling

> **OS Concept:** The kernel scheduler (CFS on Linux, Dispatcher on Windows) assigns processes/threads to CPU cores, managing time slices, priorities, and run-queue latency. Scheduling decisions happen at microsecond granularity.

### Telemetry Fields

| Field | Source | Tier | Type | Description |
| :---- | :----- | :--- | :--- | :---------- |
| `cpu.percent` | psutil `cpu_percent(percpu=True)` | Guest | float[] | Per-core CPU utilization |
| `cpu.user_percent` | psutil `cpu_times_percent()` | Guest | float | Time in user mode |
| `cpu.system_percent` | psutil `cpu_times_percent()` | Guest | float | Time in kernel mode |
| `cpu.idle_percent` | psutil `cpu_times_percent()` | Guest | float | Idle time |
| `cpu.iowait_percent` | psutil `cpu_times_percent()` | Guest | float | Time waiting on I/O (Linux only) |
| `cpu.freq_mhz` | psutil `cpu_freq()` | Guest | float | Current CPU frequency |
| `cpu.load_avg` | psutil `getloadavg()` | Guest | float[3] | 1/5/15 minute load averages (Linux/macOS) |
| `sw.context_switches` | perf_events `PERF_COUNT_SW_CONTEXT_SWITCHES` | Power | int | System-wide context switch count |
| `sw.cpu_migrations` | perf_events `PERF_COUNT_SW_CPU_MIGRATIONS` | Power | int | Process migrations between CPUs |
| `ebpf.sched_switch.prev_pid` | eBPF tracepoint `sched:sched_switch` | Research | int | PID being switched out |
| `ebpf.sched_switch.next_pid` | eBPF tracepoint `sched:sched_switch` | Research | int | PID being switched in |
| `ebpf.sched_switch.prev_state` | eBPF tracepoint `sched:sched_switch` | Research | int | State of outgoing process |
| `ebpf.sched_wakeup.pid` | eBPF tracepoint `sched:sched_wakeup` | Research | int | PID being woken up |
| `ebpf.runqueue_latency_ns` | eBPF (computed from wakeup → switch) | Research | int | Time spent waiting in run queue |
| `proc.cpu_affinity` | psutil `Process.cpu_affinity()` | Power | list | CPU cores this process is allowed to run on |

### AI Consumer
- **LSTM Forecaster:** Predicts CPU saturation from `cpu.percent` time-series. Input: sliding window of `cpu.percent` values. Output: saturation probability + ETA.
- **GNN Contention:** Uses scheduler events to weight edges in the process graph (processes contending for the same core).

### UI Surface
- **CPU Gauge (Kernel Ring):** Animated ring showing per-core utilization with color gradient (green → amber → red). Guest+ tier.
- **Scheduler Timeline:** Gantt-chart-style view showing which process ran on which core over time, colored by process. Research tier. Built with D3.js.
- **Run-Queue Latency Chart:** Time-series of `ebpf.runqueue_latency_ns` P50/P95/P99. Research tier.
- **CPU Saturation Alert:** Prediction card showing "CPU saturation predicted in ~X minutes" with confidence. Power+ tier.

### Platform Notes
| OS | Notes |
| :- | :---- |
| Linux | Full sched tracepoints via eBPF; `iowait` available; `load_avg` from `/proc/loadavg` |
| Windows | No `iowait` equivalent; `load_avg` not available; ETW provides context switch events at Research tier |
| macOS | `load_avg` available; no scheduler tracepoints (SIP) |

---

## 3. Context Switching

> **OS Concept:** A context switch saves the state (registers, program counter, stack pointer) of the current process/thread and loads the state of the next one. Excessive involuntary context switches indicate contention.

### Telemetry Fields

| Field | Source | Tier | Type | Description |
| :---- | :----- | :--- | :--- | :---------- |
| `sw.context_switches` | perf_events | Power | int/s | System-wide voluntary + involuntary switches per second |
| `proc.ctx_switches_voluntary` | psutil `Process.num_ctx_switches()` | Power | int | Per-process voluntary context switches (e.g., I/O wait) |
| `proc.ctx_switches_involuntary` | psutil `Process.num_ctx_switches()` | Power | int | Per-process involuntary (preempted by scheduler) |
| `ebpf.sched_switch` | eBPF tracepoint | Research | event | Per-event context switch with prev/next PID, prev_state |

### AI Consumer
- **LSTM Forecaster:** High involuntary context-switch rate correlates with CPU contention — used as a secondary feature for CPU saturation prediction.
- **GNN Contention:** Context switch pairs (prev_pid → next_pid) become edges in the contention graph.

### UI Surface
- **Context Switch Rate Chart:** Time-series of system-wide context switches/sec. Power+ tier. D3.js line chart with voluntary/involuntary breakdown.
- **Per-Process Context Switch Sparklines:** Inline sparklines in the process table. Power+ tier.
- **Context Switch Animation:** Animated visualization showing processes being swapped on/off CPU cores. Research tier. Framer Motion + D3.js.

---

## 4. Memory Management

> **OS Concept:** The kernel manages physical RAM allocation using page frames. Each process gets a virtual address space mapped to physical pages. The kernel tracks free, used, cached, and buffered memory.

### Telemetry Fields

| Field | Source | Tier | Type | Description |
| :---- | :----- | :--- | :--- | :---------- |
| `mem.total_bytes` | psutil `virtual_memory().total` | Guest | int | Total physical RAM |
| `mem.available_bytes` | psutil `virtual_memory().available` | Guest | int | Available without swapping |
| `mem.used_bytes` | psutil `virtual_memory().used` | Guest | int | Currently used |
| `mem.percent` | psutil `virtual_memory().percent` | Guest | float | Usage percentage |
| `mem.buffers_bytes` | psutil `virtual_memory().buffers` | Guest | int | Linux kernel buffers |
| `mem.cached_bytes` | psutil `virtual_memory().cached` | Guest | int | Linux page cache |
| `mem.shared_bytes` | psutil `virtual_memory().shared` | Guest | int | Shared memory (tmpfs etc.) |
| `mem.wired_bytes` | psutil `virtual_memory().wired` | Guest | int | macOS wired (non-pageable) memory |
| `mem.active_bytes` | psutil `virtual_memory().active` | Guest | int | macOS/Linux active pages |
| `mem.inactive_bytes` | psutil `virtual_memory().inactive` | Guest | int | macOS/Linux inactive pages |
| `proc.mem_rss_bytes` | psutil per-process | Power | int | Per-process resident set |
| `proc.mem_vms_bytes` | psutil per-process | Power | int | Per-process virtual memory |
| `proc.mem_percent` | psutil per-process | Power | float | Per-process memory usage % |
| `ebpf.kmalloc_bytes` | eBPF kprobe `kmalloc` | Research | int | Kernel allocation size |
| `ebpf.page_alloc_order` | eBPF tracepoint `mm:page_alloc` | Research | int | Page allocation order (2^order pages) |

### AI Consumer
- **LSTM Forecaster:** Predicts OOM events from `mem.percent` and `mem.available_bytes` trends. Primary use case — "OOM in ~4 minutes."
- **Anomaly Detector:** Monitors per-process `proc.mem_rss_bytes` growth curves. Detects steady, unbounded growth (leak signature) vs. normal allocation patterns.
- **LLM Explainer:** Generates explanations like "Process X's memory usage has grown 340MB in the last 20 minutes at a constant rate, indicating a probable memory leak."

### UI Surface
- **Memory Gauge (Kernel Ring):** Ring showing used/available/cached/buffers breakdown. Guest+ tier.
- **Memory Allocation Chart:** Stacked area chart of memory categories over time. Guest+ tier.
- **Per-Process Memory Growth:** Line chart per process showing RSS over time, with anomaly detector overlay (highlighted when leak probability > threshold). Power+ tier.
- **OOM Prediction Card:** "Process X may trigger OOM in ~4 minutes" with probability and suggested action (explanation from LLM at Research tier). Power+ tier (prediction), Research (explanation).
- **Kernel Allocation Heatmap:** eBPF `kmalloc` visualized as a heatmap by allocation size and caller. Research tier.

### Platform Notes
| OS | Notes |
| :- | :---- |
| Linux | Full breakdown: buffers, cached, shared, active, inactive via `/proc/meminfo` |
| Windows | No buffers/cached distinction; `standby` is closest to cached; psutil maps to Windows memory counters |
| macOS | wired/active/inactive/free model via `vm_stat`; no buffers/cached |

---

## 5. Virtual Memory / Paging

> **OS Concept:** Virtual memory gives each process its own address space, backed by physical RAM and swap. When physical RAM is exhausted, the kernel pages out inactive pages to swap. Page faults occur when accessed memory is not in physical RAM.

### Telemetry Fields

| Field | Source | Tier | Type | Description |
| :---- | :----- | :--- | :--- | :---------- |
| `mem.swap_total` | psutil `swap_memory().total` | Guest | int | Total swap space |
| `mem.swap_used` | psutil `swap_memory().used` | Guest | int | Used swap space |
| `mem.swap_percent` | psutil `swap_memory().percent` | Guest | float | Swap usage percentage |
| `mem.swap_in` | psutil `swap_memory().sin` | Guest | int | Cumulative bytes paged in from swap |
| `mem.swap_out` | psutil `swap_memory().sout` | Guest | int | Cumulative bytes paged out to swap |
| `sw.page_faults` | perf_events `PERF_COUNT_SW_PAGE_FAULTS` | Power | int/s | System-wide page faults per second |
| `sw.page_faults_major` | perf_events `PERF_COUNT_SW_PAGE_FAULTS_MAJ` | Power | int/s | Major faults (disk I/O required) |
| `sw.page_faults_minor` | perf_events `PERF_COUNT_SW_PAGE_FAULTS_MIN` | Power | int/s | Minor faults (no disk I/O) |
| `ebpf.page_alloc_order` | eBPF tracepoint `mm:page_alloc` | Research | int | Kernel page allocation order |
| `ebpf.page_free` | eBPF tracepoint `mm:page_free` | Research | event | Page deallocation events |

### AI Consumer
- **LSTM Forecaster:** Swap usage trends predict memory pressure. Rising `mem.swap_percent` + increasing `sw.page_faults_major` = strong OOM predictor.

### UI Surface
- **Swap Usage Chart:** Time-series of swap used/free with page-in/page-out rates. Guest+ tier.
- **Page Fault Rate Chart:** Time-series of major vs. minor page faults. Power+ tier.
- **Memory Pressure Indicator:** Combined metric showing memory + swap pressure. Guest+ tier. Color-coded ring segment.

---

## 6. Inter-Process Communication (IPC)

> **OS Concept:** Processes communicate via pipes, named pipes (FIFOs), Unix domain sockets, shared memory segments, message queues, and signals. IPC relationships form a dependency graph that can reveal contention bottlenecks.

### Telemetry Fields

| Field | Source | Tier | Type | Description |
| :---- | :----- | :--- | :--- | :---------- |
| `proc.connections` | psutil `Process.connections()` | Power | list | Open network connections (TCP/UDP + Unix sockets) |
| `proc.open_files` | psutil `Process.open_files()` | Power | list | Open file descriptors (includes pipes, FIFOs) |
| `proc.num_fds` | psutil `Process.num_fds()` | Power | int | Total open file descriptors |
| `graph.edge.ipc_pipe` | /proc analysis | Power | edge | Pipe connections between processes |
| `graph.edge.ipc_socket` | psutil connections | Power | edge | Socket connections between processes |
| `graph.edge.shared_memory` | /proc / ipcs | Power | edge | Shared memory segments between processes |
| `ebpf.ipc_send_bytes` | eBPF kprobe on `pipe_write`, `unix_stream_sendmsg` | Research | int | Bytes sent via IPC per call |
| `ebpf.ipc_recv_bytes` | eBPF kprobe on `pipe_read`, `unix_stream_recvmsg` | Research | int | Bytes received via IPC per call |

### AI Consumer
- **GNN Contention:** IPC relationships are edges in the process/resource graph. Processes communicating via pipes or shared memory have weighted edges. The GNN detects patterns where mutual dependencies create deadlock risk.

### UI Surface
- **Process Dependency Graph:** React Flow visualization showing processes as nodes and IPC relationships as edges. Edge thickness proportional to data volume. Power+ tier (basic), Research (with eBPF-enriched byte counts).
- **IPC Throughput Chart:** Per-pipe/socket throughput over time. Research tier.

---

## 7. System Calls

> **OS Concept:** System calls (syscalls) are the interface between user-space processes and the kernel. Every file open, memory allocation, network send, and process creation goes through a syscall. Syscall latency reveals kernel-side bottlenecks.

### Telemetry Fields

| Field | Source | Tier | Type | Description |
| :---- | :----- | :--- | :--- | :---------- |
| `ebpf.syscall_name` | eBPF tracepoint `raw_syscalls:sys_enter` / `sys_exit` | Research | str | Syscall name (read, write, open, mmap, etc.) |
| `ebpf.syscall_latency_ns` | eBPF (computed: exit.ts - enter.ts) | Research | int | Per-call latency in nanoseconds |
| `ebpf.syscall_pid` | eBPF context | Research | int | Calling process PID |
| `ebpf.syscall_tid` | eBPF context | Research | int | Calling thread TID |
| `ebpf.syscall_ret` | eBPF tracepoint `sys_exit` | Research | int | Return value (0 = success, -errno = error) |
| `ebpf.syscall_count_per_sec` | Aggregated from eBPF stream | Research | int | Syscall rate by type |

### AI Consumer
- **Anomaly Detector:** Sudden spikes in syscall error rates (e.g., `ENOMEM`, `EMFILE`) signal resource exhaustion.
- **GNN Contention:** Processes making blocking syscalls (e.g., `futex`, `flock`) on shared resources create contention edges.

### UI Surface
- **Syscall Frequency Heatmap:** D3.js heatmap showing syscall types (y-axis) over time (x-axis), color = frequency. Research tier.
- **Syscall Latency Distribution:** Histogram of latencies per syscall type (P50/P95/P99). Research tier.
- **Top Syscalls by Process:** Table showing which processes are making the most syscalls, broken down by type. Research tier.

---

## 8. Disk Scheduling / I/O

> **OS Concept:** The kernel's block I/O layer manages disk read/write requests. The I/O scheduler (mq-deadline, BFQ, kyber on Linux; built-in on Windows) reorders and merges requests for efficiency. I/O saturation causes application stalls.

### Telemetry Fields

| Field | Source | Tier | Type | Description |
| :---- | :----- | :--- | :--- | :---------- |
| `disk.read_bytes` | psutil `disk_io_counters()` | Guest | int | System-wide bytes read |
| `disk.write_bytes` | psutil `disk_io_counters()` | Guest | int | System-wide bytes written |
| `disk.read_count` | psutil `disk_io_counters()` | Guest | int | Read operation count |
| `disk.write_count` | psutil `disk_io_counters()` | Guest | int | Write operation count |
| `disk.read_time_ms` | psutil `disk_io_counters()` | Guest | int | Cumulative read time |
| `disk.write_time_ms` | psutil `disk_io_counters()` | Guest | int | Cumulative write time |
| `disk.busy_time_ms` | psutil `disk_io_counters()` | Guest | int | Time disk was busy (Linux) |
| `proc.io_read_bytes` | psutil per-process | Power | int | Per-process disk reads |
| `proc.io_write_bytes` | psutil per-process | Power | int | Per-process disk writes |
| `ebpf.block_rq_issue` | eBPF tracepoint `block:block_rq_issue` | Research | event | Block I/O request issued to driver |
| `ebpf.block_rq_complete_ns` | eBPF (computed: complete.ts - issue.ts) | Research | int | I/O request latency |
| `ebpf.block_dev` | eBPF context | Research | str | Target block device |
| `ebpf.block_bytes` | eBPF context | Research | int | Request size in bytes |
| `ebpf.block_sector` | eBPF context | Research | int | Target disk sector |

### AI Consumer
- **LSTM Forecaster:** Predicts disk I/O saturation from throughput trends and `disk.busy_time_ms`. Output: "Disk X approaching I/O saturation in ~Y minutes."

### UI Surface
- **I/O Throughput Chart:** Time-series of read/write MB/s. Guest+ tier.
- **I/O Latency Histogram:** Block request latency distribution. Research tier.
- **Per-Process I/O:** Bar chart of top I/O consumers. Power+ tier.
- **Disk Saturation Alert:** Prediction card. Power+ tier.

---

## 9. File Systems

> **OS Concept:** File systems (ext4, btrfs, NTFS, APFS) organize data on storage devices. Disk space exhaustion and inode exhaustion are common failure modes.

### Telemetry Fields

| Field | Source | Tier | Type | Description |
| :---- | :----- | :--- | :--- | :---------- |
| `disk.partitions` | psutil `disk_partitions()` | Guest | list | Mounted partitions with device, mountpoint, fstype |
| `disk.usage.total` | psutil `disk_usage()` | Guest | int | Total bytes per partition |
| `disk.usage.used` | psutil `disk_usage()` | Guest | int | Used bytes per partition |
| `disk.usage.free` | psutil `disk_usage()` | Guest | int | Free bytes per partition |
| `disk.usage.percent` | psutil `disk_usage()` | Guest | float | Usage percentage per partition |
| `proc.open_files` | psutil `Process.open_files()` | Power | list | Files held open by each process |

### AI Consumer
- **LSTM Forecaster:** Predicts disk full events from `disk.usage.percent` trends. "Partition /home will be full in ~6 hours at current write rate."

### UI Surface
- **Disk Usage Gauge:** Per-partition ring showing used/free. Guest+ tier.
- **Disk Growth Trend:** Time-series of usage percentage with forecast overlay. Power+ tier.
- **Open Files Table:** Which processes have which files open. Power+ tier.

---

## 10. Network Stack

> **OS Concept:** The kernel's network stack handles TCP/UDP sockets, routing, and packet processing. Network saturation, connection exhaustion, and retransmit storms affect application performance.

### Telemetry Fields

| Field | Source | Tier | Type | Description |
| :---- | :----- | :--- | :--- | :---------- |
| `net.bytes_sent` | psutil `net_io_counters()` | Guest | int | Total bytes sent |
| `net.bytes_recv` | psutil `net_io_counters()` | Guest | int | Total bytes received |
| `net.packets_sent` | psutil `net_io_counters()` | Guest | int | Total packets sent |
| `net.packets_recv` | psutil `net_io_counters()` | Guest | int | Total packets received |
| `net.errin` | psutil `net_io_counters()` | Guest | int | Incoming errors |
| `net.errout` | psutil `net_io_counters()` | Guest | int | Outgoing errors |
| `net.dropin` | psutil `net_io_counters()` | Guest | int | Incoming drops |
| `net.dropout` | psutil `net_io_counters()` | Guest | int | Outgoing drops |
| `net.connections` | psutil `net_connections()` | Guest | int | Active connection count |
| `net.connections_by_status` | psutil `net_connections()` | Power | dict | Connections grouped by TCP state |
| `proc.connections` | psutil `Process.connections()` | Power | list | Per-process connections with remote addr/port |

### AI Consumer
- **LSTM Forecaster:** Network throughput trends for saturation prediction. Connection count trends for connection exhaustion prediction.
- **Anomaly Detector:** Sudden spikes in `net.errin` or `net.dropin` flagged as network anomalies.

### UI Surface
- **Network Throughput Chart:** Time-series of sent/received MB/s. Guest+ tier.
- **Connection State Distribution:** Pie/donut chart of TCP states (ESTABLISHED, TIME_WAIT, CLOSE_WAIT). Power+ tier.
- **Network Error Rate:** Time-series of errors and drops. Guest+ tier.
- **Per-Process Network:** Which processes have which connections. Power+ tier.

---

## 11. Interrupts & Signals

> **OS Concept:** Hardware interrupts (IRQs) notify the CPU of external events (disk I/O complete, network packet arrived, timer tick). Software signals (SIGTERM, SIGKILL, SIGSEGV) are the kernel's mechanism for process-level notifications.

### Telemetry Fields

| Field | Source | Tier | Type | Description |
| :---- | :----- | :--- | :--- | :---------- |
| `sys.interrupts` | `/proc/interrupts` (Linux) | Power | dict | Per-IRQ interrupt counts by CPU |
| `sys.soft_interrupts` | `/proc/softirqs` (Linux) | Power | dict | Software interrupt counts |
| `sys.interrupts_total` | psutil (Linux) | Power | int | Total interrupt count |
| `ebpf.signal_deliver` | eBPF tracepoint `signal:signal_deliver` | Research | event | Signal delivered to process |
| `ebpf.signal_generate` | eBPF tracepoint `signal:signal_generate` | Research | event | Signal generated by kernel |

### AI Consumer
- **Anomaly Detector:** Abnormal interrupt rate spikes (e.g., network IRQ storm) detected as statistical outliers.

### UI Surface
- **Interrupt Rate Chart:** Time-series of total interrupts/sec with soft interrupt breakdown. Power+ tier.
- **IRQ Distribution Table:** Per-IRQ counts by CPU (identifying IRQ affinity imbalance). Power+ tier.

### Platform Notes
| OS | Notes |
| :- | :---- |
| Linux | Full data via `/proc/interrupts` and `/proc/softirqs` |
| Windows | Limited; ETW can provide DPC/ISR data at Research tier |
| macOS | Not available (SIP restricts) |

---

## 12. CPU Caches & TLB

> **OS Concept:** CPU caches (L1/L2/L3) and the Translation Lookaside Buffer (TLB) dramatically affect performance. Cache misses and TLB misses cause memory stalls. Hardware performance counters expose these events.

### Telemetry Fields

| Field | Source | Tier | Type | Description |
| :---- | :----- | :--- | :--- | :---------- |
| `hw.cpu_cycles` | perf_events `PERF_COUNT_HW_CPU_CYCLES` | Power | int | Total CPU cycles |
| `hw.instructions` | perf_events `PERF_COUNT_HW_INSTRUCTIONS` | Power | int | Retired instructions |
| `hw.cache_references` | perf_events `PERF_COUNT_HW_CACHE_REFERENCES` | Power | int | Cache accesses |
| `hw.cache_misses` | perf_events `PERF_COUNT_HW_CACHE_MISSES` | Power | int | Cache misses |
| `hw.branch_instructions` | perf_events `PERF_COUNT_HW_BRANCH_INSTRUCTIONS` | Power | int | Branch instructions |
| `hw.branch_misses` | perf_events `PERF_COUNT_HW_BRANCH_MISSES` | Power | int | Branch mispredictions |
| `hw.ipc` | Computed: instructions / cycles | Power | float | Instructions per cycle (efficiency metric) |
| `hw.cache_miss_rate` | Computed: misses / references | Power | float | Cache miss rate |

### AI Consumer
- **LSTM Forecaster:** IPC and cache miss rate are secondary features for CPU performance prediction. Declining IPC often precedes visible CPU saturation.

### UI Surface
- **IPC Gauge:** Instructions-per-cycle with color gradient. Power+ tier.
- **Cache Miss Rate Chart:** Time-series of L1/L2/L3 cache miss rates. Power+ tier.
- **CPU Microarchitecture Panel:** Combined view of cycles, instructions, IPC, cache misses, branch misses. Power+ tier.

### Platform Notes
| OS | Notes |
| :- | :---- |
| Linux | Full hardware counters via perf_events (requires CAP_PERFMON) |
| Windows | Available via ETW/PDH at Research tier; limited at Power tier |
| macOS | Not available (SIP restricts access to performance counters) |

---

## 13. Process Synchronization (Locks & Mutexes)

> **OS Concept:** Processes and threads synchronize access to shared resources using mutexes, semaphores, read-write locks, and futexes. Lock contention (threads waiting on a held lock) causes performance degradation and potential deadlocks.

### Telemetry Fields

| Field | Source | Tier | Type | Description |
| :---- | :----- | :--- | :--- | :---------- |
| `ebpf.futex_wait` | eBPF kprobe on `do_futex` | Research | event | Futex wait event (thread blocking on lock) |
| `ebpf.futex_wake` | eBPF kprobe on `do_futex` | Research | event | Futex wake event (lock released) |
| `ebpf.futex_contention_ns` | eBPF (computed: wake.ts - wait.ts) | Research | int | Lock hold/wait duration |
| `ebpf.futex_addr` | eBPF context | Research | int | Futex address (identifies specific lock) |

### AI Consumer
- **GNN Contention:** Lock contention events create strong edges between processes/threads contending for the same lock. High contention scores from the GNN indicate deadlock risk.

### UI Surface
- **Lock Contention Heatmap:** D3.js heatmap showing lock addresses (y-axis) over time (x-axis), color = contention duration. Research tier.
- **Deadlock Risk Alert:** GNN-generated contention score displayed as a prediction card. Research tier.

---

## 14. Thread Management

> **OS Concept:** Threads are lightweight execution units within a process, sharing the same address space. The kernel schedules threads independently. Thread proliferation (too many threads) wastes resources and increases scheduling overhead.

### Telemetry Fields

| Field | Source | Tier | Type | Description |
| :---- | :----- | :--- | :--- | :---------- |
| `proc.num_threads` | psutil `Process.num_threads()` | Power | int | Thread count per process |
| `sys.total_threads` | Aggregated from psutil | Power | int | System-wide thread count |
| `proc.threads` | psutil `Process.threads()` | Power | list | Per-thread user/system time (Linux) |

### AI Consumer
- **Anomaly Detector:** Steadily increasing thread count without corresponding increase in work (CPU stays flat) suggests a thread leak.

### UI Surface
- **Thread Count Chart:** System-wide and per-process thread count over time. Power+ tier.
- **Thread Leak Alert:** Anomaly detector flags when thread count grows linearly without bound. Power+ tier.

---

## 15. OS Concept Coverage Verification

> **Every OS concept from the original brief is mapped to at least one telemetry field and one UI surface. None are theoretical-only.**

| OS Concept | Telemetry Fields (count) | UI Surfaces (count) | AI Models | Status |
| :--------- | :----------------------- | :------------------ | :-------- | :----- |
| Process Management | 13 | 3 | Anomaly, GNN | ✅ Mapped |
| CPU Scheduling | 15 | 4 | LSTM, GNN | ✅ Mapped |
| Context Switching | 4 | 3 | LSTM, GNN | ✅ Mapped |
| Memory Management | 15 | 5 | LSTM, Anomaly, LLM | ✅ Mapped |
| Virtual Memory / Paging | 10 | 3 | LSTM | ✅ Mapped |
| Inter-Process Communication | 8 | 2 | GNN | ✅ Mapped |
| System Calls | 6 | 3 | Anomaly, GNN | ✅ Mapped |
| Disk Scheduling / I/O | 14 | 4 | LSTM | ✅ Mapped |
| File Systems | 6 | 3 | LSTM | ✅ Mapped |
| Network Stack | 11 | 4 | LSTM, Anomaly | ✅ Mapped |
| Interrupts & Signals | 5 | 2 | Anomaly | ✅ Mapped |
| CPU Caches & TLB | 8 | 3 | LSTM | ✅ Mapped |
| Process Synchronization | 4 | 2 | GNN | ✅ Mapped |
| Thread Management | 3 | 2 | Anomaly | ✅ Mapped |
| **TOTAL** | **122 fields** | **43 views** | — | **✅ Complete** |
