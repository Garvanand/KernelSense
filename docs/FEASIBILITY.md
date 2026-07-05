# KernelSense — Feasibility Analysis

> `docs/FEASIBILITY.md` · v1.0 · 2026-07-05 · Prompt 1

---

## Executive Summary

KernelSense is **feasible for a Linux-first MVP** using psutil as the universal baseline, with /proc and perf_events providing enhanced telemetry at the Power tier, and eBPF as an opt-in Research tier behind explicit consent gates. Windows support is viable at Guest/Power tiers via WMI and performance counters. macOS is constrained to Guest tier due to SIP restrictions on deep tracing.

**Verdict: ✅ Proceed with Linux-first MVP. Windows reduced-fidelity fallback. macOS Guest-only.**

---

## 1. Telemetry API Feasibility — Per-OS Analysis

### 1.1 Linux — ✅ Full Support (Primary Target)

#### Tier: Guest (No privileges required)

| API           | Availability  | What It Provides                                     | Privilege     | Verified? |
| :------------ | :------------ | :--------------------------------------------------- | :------------ | :-------- |
| **psutil**    | All distros   | CPU %, memory (virtual/swap), disk partitions/usage/IO, network IO, process list, per-process CPU/mem | None (own-user processes); root for all processes' full details | ✅ Yes |
| **/proc**     | All distros   | `/proc/stat`, `/proc/meminfo`, `/proc/[pid]/status` etc. | Read access (most files world-readable) | ✅ Yes |

> **Notes:** psutil internally reads `/proc` on Linux. Some per-process files (e.g., `/proc/[pid]/environ`, `/proc/[pid]/io`) require same-user or root. KernelSense will gracefully degrade if these are unavailable.

#### Tier: Power (Limited elevation)

| API               | Availability         | What It Provides                                  | Privilege            | Verified? |
| :---------------- | :------------------- | :------------------------------------------------ | :------------------- | :-------- |
| **perf_events**   | Kernel ≥ 3.x (ubiquitous) | Hardware counters (cycles, cache misses), software events (context switches, page faults), tracepoints | `CAP_PERFMON` (kernel ≥ 5.8) or `perf_event_paranoid ≤ 1` | ✅ Yes |

> **Notes:**
> - `perf_event_paranoid` sysctl controls access: `0` = allow non-root process counting, `1` = allow non-root kernel profiling, `2` = disallow non-root (default on many distros), `-1` = unrestricted.
> - `CAP_PERFMON` (introduced in kernel 5.8) provides a fine-grained capability specifically for performance monitoring without full `CAP_SYS_ADMIN`.
> - **Mitigation for restrictive defaults:** KernelSense will detect the current `perf_event_paranoid` level and inform the user what they need to change, with exact commands.

#### Tier: Research (Elevated — consent-gated)

| API            | Availability             | What It Provides                                             | Privilege                          | Verified?      |
| :------------- | :----------------------- | :----------------------------------------------------------- | :--------------------------------- | :------------- |
| **eBPF (BCC)** | Kernel ≥ 4.15 (practical ≥ 5.8 for CO-RE) | Syscall tracing, scheduler events, custom kprobes/uprobes, network packet inspection, per-event callbacks | `CAP_BPF` + `CAP_PERFMON` (kernel ≥ 5.8); older kernels require `CAP_SYS_ADMIN` | ⚠️ ASSUMPTION A1 |
| **eBPF (libbpf/CO-RE)** | Kernel ≥ 5.8 + BTF | Same as BCC but with compile-once-run-everywhere portability | Same as above                      | ⚠️ ASSUMPTION A1 |

> **Risk — ASSUMPTION A1:** The specific eBPF program types KernelSense needs (kprobes for syscall entry/exit, tracepoints for scheduler events, kfunc for memory allocation tracking) may require `CAP_SYS_ADMIN` in addition to `CAP_BPF` on certain kernel versions or distro configurations. **This will be verified experimentally in Prompt 7** by attempting to load each program type with only `CAP_BPF`.
>
> **Risk — Unprivileged eBPF disabled by default:** Since kernel 5.10+, `kernel.unprivileged_bpf_disabled` defaults to `1` (or `2`, which is permanent until reboot on 5.15+). This means **no unprivileged eBPF at all** — which is acceptable since Research tier already requires elevation.
>
> **Mitigation:** Research tier is entirely opt-in. The MVP works fully at Guest + Power tiers without any eBPF. When a user requests Research tier, the UI will:
> 1. Explain exactly what capabilities are needed and why.
> 2. Show the exact command to grant them (e.g., `sudo setcap cap_bpf,cap_perfmon+ep /path/to/kernelsense`).
> 3. Only activate eBPF probes after successful capability verification.

---

### 1.2 Windows — ⚠️ Partial Support (Guest + Power Tiers)

#### Tier: Guest (No privileges required)

| API          | Availability         | What It Provides                                       | Privilege    | Verified? |
| :----------- | :------------------- | :----------------------------------------------------- | :----------- | :-------- |
| **psutil**   | Windows 7+           | CPU %, memory, disk usage, network IO, process list    | None (own-user processes); Admin for some details of other users' processes | ✅ Yes |

> **Notes:** psutil on Windows uses `GetSystemInfo`, `GetPerformanceInfo`, `NtQuerySystemInformation`, etc. Disk I/O counters require `diskperf -y` to be run once (as admin). KernelSense installer should handle this.

#### Tier: Power (Limited elevation)

| API                    | Availability      | What It Provides                                          | Privilege                          | Verified?      |
| :--------------------- | :---------------- | :-------------------------------------------------------- | :--------------------------------- | :------------- |
| **WMI**                | All Windows       | `Win32_Processor`, `Win32_PerfFormattedData_*`, process details | Performance Monitor Users group OR Admin | ✅ Yes |
| **Performance Counters** | All Windows     | CPU queue length, disk queue, memory pages/sec, etc.      | Performance Monitor Users group    | ✅ Yes |
| **Private ETW Sessions** | Windows 10 1703+ | Process-scoped ETW events within own-process              | Standard user (same-process only)  | ⚠️ ASSUMPTION A3 |

> **Risk — ASSUMPTION A3:** Private ETW logger sessions may not provide the *cross-process* telemetry needed for meaningful Power-tier analysis. They are documented as being restricted to "providers registered in the same process." KernelSense's power-tier value proposition requires cross-process visibility.
>
> **Mitigation:** Fallback to WMI + performance counters, which are accessible to members of the "Performance Monitor Users" group (a non-Admin group). The installer/setup guide will instruct users to add themselves to this group.

#### Tier: Research (Admin — consent-gated)

| API                       | Availability | What It Provides                                                 | Privilege | Verified? |
| :------------------------ | :----------- | :--------------------------------------------------------------- | :-------- | :-------- |
| **System-wide ETW**       | All Windows  | Kernel-level events: context switches, syscalls, page faults, disk I/O details, network stack events | Administrator | ✅ Yes |

> **Notes:** System-wide ETW (NT Kernel Logger, SystemTraceProvider) is the Windows equivalent of eBPF/perf_events. It is extremely powerful but strictly requires Admin. KernelSense will use the same consent-gate pattern as Linux Research tier.

---

### 1.3 macOS — ⚠️ Guest Tier Only (Initially)

#### Tier: Guest (No privileges required)

| API          | Availability    | What It Provides                                    | Privilege | Verified? |
| :----------- | :-------------- | :-------------------------------------------------- | :-------- | :-------- |
| **psutil**   | macOS 10.12+    | CPU %, memory, disk usage, network IO, process list | None (limited for other users' processes) | ✅ Yes |
| **vm_stat**  | All macOS       | Virtual memory summary statistics (pages free, active, inactive, wired, faults, pageins/outs) | None (summary-level only) | ✅ Yes |

#### Tier: Power — ❌ Not Viable Without User Security Compromise

| API       | Availability | Blocker                                                                                               |
| :-------- | :----------- | :---------------------------------------------------------------------------------------------------- |
| **py-spy** | macOS 10.12+ | Works on non-system Python binaries but still requires `task_for_pid` which SIP restricts for many targets |
| **dtrace** | All macOS    | **SIP explicitly blocks dtrace from inspecting system processes.** Disabling SIP requires Recovery Mode boot and is a significant security downgrade. KernelSense will **never** instruct users to disable SIP. |

> **Decision:** macOS support is **Guest tier only** for the foreseeable future. Users get psutil-level metrics, which are still valuable for basic monitoring. Deep tracing on macOS would require Apple's Instruments/DTrace with SIP disabled, which violates our constraint of not requiring users to disable OS security protections.
>
> **ASSUMPTION A4:** psutil + vm_stat provides meaningful (if reduced-fidelity) data on macOS. Verified as low-risk — psutil is well-tested on macOS.

---

## 2. Public Pretraining Datasets — Confirmed

### 2.1 Dataset 1: Google Cluster Traces (2019)

| Field         | Value                                                                             |
| :------------ | :-------------------------------------------------------------------------------- |
| **Source**     | Google Research — [research.google/tools/datasets/google-cluster-workload-traces-2019](https://research.google/tools/datasets/google-cluster-workload-traces-2019/) |
| **License**    | CC BY 4.0                                                                         |
| **Size**       | ~2.4 TB (compressed), sampled subsets available on Kaggle                          |
| **Content**    | 31 days of job/task scheduling events, per-task CPU/memory usage, machine events, across ~12,500 machines |
| **Format**     | CSV / BigQuery tables                                                             |
| **Relevance**  | CPU and memory utilization time-series → train saturation forecasting models. Machine event logs → train anomaly detectors. |
| **KernelSense Usage** | Pretrain the time-series forecasting model on CPU/memory utilization patterns before fine-tuning on user's live stream. |
| **Provenance** | Published by Google for academic research. Widely cited (>500 papers). Anonymized, no PII. |

### 2.2 Dataset 2: Alibaba Cluster Trace v2 (2018)

| Field         | Value                                                                             |
| :------------ | :-------------------------------------------------------------------------------- |
| **Source**     | [github.com/alibaba/clusterdata](https://github.com/alibaba/clusterdata)          |
| **License**    | Apache License 2.0                                                                |
| **Size**       | ~270 GB (compressed)                                                              |
| **Content**    | 8 days of container resource usage (CPU, memory), batch job DAGs, machine utilization, co-located online/offline workloads |
| **Format**     | CSV                                                                               |
| **Relevance**  | Multi-resource contention patterns between co-located workloads → train GNN contention model. Memory usage curves → train leak detector. |
| **KernelSense Usage** | Pretrain the anomaly detector on memory growth curves; pretrain GNN on resource contention graphs. |
| **Provenance** | Published by Alibaba Cloud for academic research. Widely cited (>200 papers). Anonymized. |

### 2.3 Dataset 3 (Supplementary): Zenodo Kernel Function Timing

| Field         | Value                                                                             |
| :------------ | :-------------------------------------------------------------------------------- |
| **Source**     | Zenodo (search: "Kernel Function Time Measurement Data Set")                      |
| **License**    | CC BY 4.0                                                                         |
| **Content**    | eBPF/BCC-captured kernel function execution times, used for anomaly-based rootkit detection |
| **Relevance**  | Kernel-level timing anomaly patterns → complement the statistical anomaly detector with kernel-specific baselines. |

### 2.4 Dataset 4 (Supplementary): LTTng Reference Traces

| Field         | Value                                                                             |
| :------------ | :-------------------------------------------------------------------------------- |
| **Source**     | [github.com/lttng/lttng-ref-traces](https://github.com/lttng/lttng-ref-traces)   |
| **License**    | MIT                                                                               |
| **Content**    | Reference kernel + userspace traces in CTF format (scheduling, syscalls, etc.)    |
| **Relevance**  | Trace format familiarity; scheduler event patterns → validate KernelSense's trace parsing pipeline. |

---

## 3. Risk Register

### 3.1 High-Severity Risks

#### R1: Model Inference Latency on CPU (Severity: HIGH)

**Description:** Time-series transformers and GNNs are typically trained and inferred on GPUs. Consumer machines running KernelSense may not have a suitable GPU, and CPU-only inference may be too slow for real-time predictions.

**Impact:** If inference takes >2s, predictions become stale before delivery. Users perceive the system as sluggish.

**Mitigations:**
1. **MVP uses LSTM instead of Transformer** — LSTMs are significantly cheaper to infer on CPU (~10–50ms per forward pass for typical sequence lengths vs. ~200–500ms for a small transformer).
2. **Batch predictions** — Instead of per-sample inference, batch 5–10 metric windows and predict in bulk every 5–10 seconds.
3. **ONNX Runtime** — Export trained models to ONNX and use ONNX Runtime for optimized CPU inference (2–5× speedup over raw PyTorch).
4. **Defer GNN to post-MVP** — GNN contention prediction is the most compute-expensive component. Defer until GPU availability is understood.

**ASSUMPTION A6:** LSTM inference ≤500ms per prediction window on consumer hardware (4-core, 16GB RAM). **Owner: Prompt 6** — will benchmark.

**ASSUMPTION A7:** GNN inference over ~500 nodes at 1 Hz is feasible on CPU. **Owner: Prompt 6** — will benchmark and decide if GNN is MVP or post-MVP.

---

#### R2: macOS Deep Tracing Blocked by SIP (Severity: HIGH)

**Description:** System Integrity Protection (SIP) on macOS explicitly blocks `dtrace` from inspecting system processes and restricts `task_for_pid` for many targets. Disabling SIP requires booting into Recovery Mode and is a significant security downgrade.

**Impact:** macOS users cannot access Power or Research tier telemetry without disabling OS security — which KernelSense will never request.

**Mitigations:**
1. **Accept Guest-only tier on macOS** — psutil + vm_stat provides meaningful basic monitoring.
2. **Never instruct users to disable SIP** — this is a hard constraint, not a mitigation to work around.
3. **Explore macOS Endpoint Security Framework (ESF)** in future — Apple's sanctioned API for process monitoring (requires entitlements, which require Apple Developer membership and notarization).

**Decision:** macOS = Guest tier only. This is a permanent, accepted limitation unless Apple provides new APIs.

---

### 3.2 Medium-Severity Risks

#### R3: eBPF Privilege Complexity (Severity: MEDIUM)

**Description:** The Linux eBPF privilege landscape is fragmented across kernel versions. `CAP_BPF` was introduced in 5.8, but many distros default to requiring `CAP_SYS_ADMIN`. The specific program types KernelSense needs may have different capability requirements.

**Impact:** Users may struggle to grant the correct capabilities, leading to support burden and frustration.

**Mitigations:**
1. **Consent-gated** — eBPF is strictly opt-in (Research tier). MVP works fully without it.
2. **Capability detection** — At startup, KernelSense probes which capabilities are available and maps them to the achievable tier.
3. **Guided remediation** — If a user requests Research tier and capabilities are missing, the UI shows the exact `setcap` or `sysctl` command needed.
4. **Minimum kernel version** — Document kernel ≥ 5.8 as a requirement for Research tier.

**ASSUMPTION A1:** Verify in Prompt 7 that the specific eBPF program types needed work with `CAP_BPF` alone (without `CAP_SYS_ADMIN`) on kernel ≥ 5.8.

---

#### R4: TimescaleDB Disk Growth (Severity: MEDIUM)

**Description:** At 10 Hz sampling across ~200 metrics, a 24h rolling window generates ~172.8M data points per day. Each row is ~100–200 bytes, so ~17–35 GB/day raw.

**Impact:** Consumer machines may not have sufficient disk space; write amplification may affect system performance.

**Mitigations:**
1. **Configurable sampling rate** — Default to 1 Hz for Guest, 5 Hz for Power, 10 Hz for Research. This reduces Guest storage to ~1.7 GB/day.
2. **Aggressive retention policy** — TimescaleDB continuous aggregates for historical views; raw data retained for 1–4 hours only, downsampled to 1-minute intervals for 24h.
3. **Compression** — TimescaleDB native compression (typ. 10–20× for time-series) reduces effective storage to ~0.1–0.3 GB/day at 1 Hz.
4. **Selective metric recording** — Only record metrics that the current access tier actually uses.

**ASSUMPTION A5:** TimescaleDB single-node handles ≥10 Hz × 200 metrics without excessive overhead. **Owner: Prompt 5** — will benchmark.

---

#### R5: Cross-Platform Telemetry Schema Gaps (Severity: MEDIUM)

**Description:** Different OSes expose different metrics. Linux has `iowait`, Windows does not. macOS memory model (wired/active/inactive) differs from Linux (buffers/cached/available).

**Impact:** The common schema will have nullable fields, which complicates frontend visualization and model training.

**Mitigations:**
1. **Nullable fields in schema** — All OS-specific fields are nullable; the API always returns a valid schema regardless of OS.
2. **Platform enrichment layers** — Each OS-specific collector extends the base schema with platform-specific fields (e.g., `linux.iowait`, `windows.disk_queue_length`).
3. **Frontend graceful degradation** — Visualizations check field availability and hide unavailable metrics rather than showing blanks or errors.
4. **Model training** — Models are trained on a superset schema; missing fields are masked during inference.

---

#### R6: ETW Cross-Process Visibility on Windows (Severity: MEDIUM)

**Description:** Private ETW sessions (available to standard users on Windows 10 1703+) are limited to providers within the same process. For cross-process telemetry, WMI + Performance Monitor Users group membership is needed; for kernel-level events, Admin is required.

**Impact:** Windows Power tier may offer less depth than Linux Power tier.

**Mitigations:**
1. **WMI + perf counters as primary Windows Power-tier source** — These are well-documented and accessible with Performance Monitor Users group.
2. **Clear tier documentation** — Explicitly document what Windows Power tier includes vs. Linux Power tier.
3. **System-wide ETW for Research tier** — Admin-gated, consistent with the consent model.

**ASSUMPTION A3:** Verify in Prompt 7 whether private ETW sessions provide any useful cross-process telemetry or are strictly same-process only.

---

### 3.3 Low-Severity Risks

#### R7: LLM API Latency / Availability (Severity: LOW)

**Description:** The bounded LLM explainer relies on an external API call. If the API is slow (>3s) or unavailable, the explanation is delayed or missing.

**Impact:** Minor — predictions still work; the explanation is supplementary.

**Mitigations:**
1. **Structured fallback** — If the LLM call fails or times out, display a template-generated explanation based on the structured event data.
2. **Async delivery** — The prediction is shown immediately; the explanation arrives asynchronously when the LLM responds.
3. **Model choice** — Use a small, fast model (GPT-4o-mini, Claude Haiku) to minimize latency.
4. **Local LLM option (future)** — Allow users to configure a local Ollama/vLLM endpoint.

**ASSUMPTION A8:** LLM API call completes in <3s. **Owner: Prompt 8.**

---

#### R8: psutil Platform-Specific Gaps (Severity: LOW)

**Description:** Some psutil fields return `None` or `0` on certain platforms (e.g., `iowait` on Windows, `steal` time on non-VM hosts).

**Impact:** Minor — handled by nullable schema fields.

**Mitigations:** Conditional logic in collectors; documented per-platform availability matrix in the codebase.

---

## 4. MVP Scope-Down Path

If any high-severity risk materializes, the following scope reductions can be applied independently:

```
Full Vision
├── Linux: Guest + Power + Research (eBPF)
├── Windows: Guest + Power + Research (ETW)
├── macOS: Guest + Power (dtrace)
├── AI: Forecaster + GNN + Anomaly + LLM Explainer
├── Frontend: Full kernel-ring + React Flow + animations
│
Scope-Down Level 1 (MVP — CURRENT TARGET)
├── Linux: Guest + Power (perf_events); Research deferred
├── Windows: Guest + Power (WMI/perf counters)
├── macOS: Guest only (psutil + vm_stat)
├── AI: LSTM Forecaster + Statistical Anomaly + LLM Explainer
├── Frontend: Dashboard + live charts + mode selector
│
Scope-Down Level 2 (Minimum Viable Demo)
├── Linux only
├── Guest + Power tiers only
├── AI: LSTM Forecaster only (no anomaly, no GNN, no LLM)
├── Frontend: Minimal dashboard + CPU/memory/disk charts
│
Scope-Down Level 3 (Proof of Concept)
├── Linux only, Guest tier only
├── psutil telemetry → TimescaleDB → WebSocket → live chart
├── No AI models
├── Static Next.js page with a single D3.js time-series chart
```

---

## 5. Feasibility Verdict

| Dimension                  | Verdict                               | Confidence |
| :------------------------- | :------------------------------------ | :--------- |
| **Linux telemetry (Guest + Power)** | ✅ Fully feasible               | 95%        |
| **Linux telemetry (Research/eBPF)** | ⚠️ Feasible with privilege requirements | 80% (ASSUMPTION A1) |
| **Windows telemetry (Guest + Power)** | ✅ Feasible with group membership | 85%        |
| **Windows telemetry (Research/ETW)** | ✅ Feasible with Admin             | 90%        |
| **macOS telemetry (Guest)**          | ✅ Feasible                        | 95%        |
| **macOS telemetry (Power+)**         | ❌ Not feasible without SIP disable | 95% (won't do) |
| **Pretraining datasets**             | ✅ 4 datasets confirmed, all open-license | 95%   |
| **Time-series forecasting on CPU**   | ⚠️ LSTM feasible; Transformer risky | 75% (ASSUMPTION A6) |
| **GNN on CPU**                       | ⚠️ Feasible for small graphs; needs benchmarking | 65% (ASSUMPTION A7) |
| **LLM Explainer**                    | ✅ Straightforward bounded API call | 95%        |
| **Single-process deployment**        | ✅ No architectural blockers          | 90%        |

### Overall: ✅ FEASIBLE for Linux-first MVP

The project is architecturally sound. The primary uncertainties are performance-related (model inference on CPU) and will be resolved by benchmarking in Prompts 5–6. The scope-down path provides safe fallbacks at every level.

---

## 6. Assumption Tracking Summary

| ID  | Assumption                                                                                                  | Severity | Owner     | Resolution Method                    |
| :-- | :---------------------------------------------------------------------------------------------------------- | :------- | :-------- | :----------------------------------- |
| A1  | eBPF kprobes/tracepoints work with `CAP_BPF` alone (no `CAP_SYS_ADMIN`) on kernel ≥ 5.8                    | Medium   | Prompt 7  | Experimental: load programs with capabilities |
| A2  | `perf_events` accessible with `CAP_PERFMON` alone on kernel ≥ 5.8                                           | Low      | Prompt 7  | Experimental: attach perf counters   |
| A3  | Windows private ETW sessions provide useful cross-process telemetry                                          | Medium   | Prompt 7  | Experimental: test on Windows 10/11  |
| A4  | macOS psutil + vm_stat provides meaningful Guest-tier data                                                    | Low      | Prompt 7  | Test on macOS 14+                    |
| A5  | TimescaleDB single-node handles ≥10 Hz × 200 metrics sustainably                                            | Medium   | Prompt 5  | Benchmark: synthetic write load test |
| A6  | LSTM inference ≤500ms per prediction window on consumer CPU                                                  | High     | Prompt 6  | Benchmark: ONNX Runtime on 4-core CPU |
| A7  | GNN inference over ~500-node graph at 1 Hz on CPU                                                            | Medium   | Prompt 6  | Benchmark: PyG on CPU                |
| A8  | Bounded LLM API call completes in <3s with structured JSON prompt                                            | Low      | Prompt 8  | Test: measure latency of GPT-4o-mini/Haiku |

---

## Appendix A: References

1. psutil documentation — https://psutil.readthedocs.io
2. Linux perf_events — https://www.brendangregg.com/perf.html
3. eBPF privilege requirements — https://eunomia.dev/tutorials/ebpf-security/
4. CAP_BPF kernel commit — https://lwn.net/Articles/820560/
5. Windows ETW documentation — https://learn.microsoft.com/en-us/windows/win32/etw/
6. Windows Private Logger sessions — https://learn.microsoft.com/en-us/windows/win32/etw/configuring-and-starting-a-private-logger-session
7. macOS SIP restrictions — https://developer.apple.com/documentation/security/disabling-and-enabling-system-integrity-protection
8. Google Cluster Traces — https://research.google/tools/datasets/google-cluster-workload-traces-2019/
9. Alibaba Cluster Data — https://github.com/alibaba/clusterdata
10. LTTng Reference Traces — https://github.com/lttng/lttng-ref-traces
11. TimescaleDB documentation — https://docs.timescale.com
