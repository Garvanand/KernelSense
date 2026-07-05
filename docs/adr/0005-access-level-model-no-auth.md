# ADR-0005: Access-Level Model — No Auth, Consent-Gated Tiers

> **Status:** Accepted
> **Date:** 2026-07-05
> **Deciders:** Project architect
> **Context:** [SYSTEM_DESIGN.md §4](file:///c:/Users/GARV%20ANAND/Downloads/KernelSense/docs/SYSTEM_DESIGN.md)

---

## Context

KernelSense is a **single-user, local tool** — it runs on the user's own machine, monitoring their own OS. There is no multi-user scenario, no remote access, and no shared tenancy.

However, telemetry depth varies dramatically by access level:
- Guest: basic system metrics (no privilege).
- Power: per-process details, hardware counters (requires `CAP_PERFMON` or Performance Monitor Users group).
- Research: eBPF traces, syscalls, scheduler events (requires `CAP_BPF` or Admin).

The question: how do we manage these levels?

### Alternatives Considered

| Option | Description | Rejected Because |
| :----- | :---------- | :--------------- |
| **A: Full auth (JWT/OAuth)** | User logs in, gets a role | Overkill for single-user local tool. Adds password management, session expiry, token refresh — all for one user. |
| **B: No access control** | Everything visible always | Dangerous — a user might not realize they're running eBPF programs requiring root. No consent gate. |
| **C: Frontend-only gating** | UI hides tabs, but API returns everything | Security through obscurity. A `curl` call exposes Research-tier data without consent. |
| **D: Consent-gated tiers, server-enforced** (selected) | Client selects tier; server verifies capabilities and enforces | Progressive disclosure with real enforcement. |

---

## Decision

Use a **three-tier access model (Guest → Power → Research)** with **server-side enforcement**, **capability verification**, and **explicit consent steps** — but **no authentication**.

### How It Works

1. **Startup:** Backend detects OS capabilities and reports the maximum achievable tier.
2. **Default:** Session starts at Guest tier. All data visible at Guest level. API returns Guest-level fields only.
3. **Elevation:** User clicks "Upgrade to Power" in the mode selector.
4. **Consent Dialog:** UI shows exactly what additional data will be collected and what OS permissions are needed. User must explicitly confirm.
5. **Capability Check:** Backend calls `capability_detector.detect_max_tier()`. If the process has the required capabilities → tier is elevated. If not → 403 with remediation instructions.
6. **Enforcement:** `access_gate.py` middleware checks `request.state.tier` before every handler. Field-level filtering strips tier-inappropriate data from responses.
7. **No persistence:** Tier resets to Guest on backend restart. No cookies, no stored state.

### Why No Auth Is Correct

| Concern | Resolution |
| :------ | :--------- |
| "What if someone accesses the API remotely?" | API binds to `127.0.0.1` (localhost only). Not exposed on network interfaces. |
| "What if a script elevates the tier?" | Elevation requires capability verification — the script would need the same OS privileges regardless. The tier gate adds informed consent, not security. |
| "What about multi-user machines?" | KernelSense monitors the OS, not user-specific data. Any user with access to `localhost:8000` is already on the machine. |

### Why Server-Side Enforcement Matters (Not Just Frontend)

Even without auth, server-side enforcement is critical because:
1. **Frontend can be bypassed** — any HTTP client (curl, Postman, scripts) can hit the API.
2. **Consent must be verified** — a user who hasn't consented to eBPF tracing should not accidentally receive eBPF data because their frontend is stale.
3. **Capability verification must be server-side** — only the backend process knows if it has `CAP_BPF`.

---

## Consequences

### Positive
- Zero setup friction — no passwords, no accounts, no configuration.
- Progressive disclosure — users see increasing complexity only as they opt in.
- Consent is meaningful — the user knows exactly what they're enabling and why.
- Server-side enforcement prevents accidental exposure via API.

### Negative
- No audit trail beyond structured logs (acceptable for single-user local tool).
- Tier resets on restart (acceptable — re-elevation is one click + consent dialog).
- Anyone with localhost access can escalate to the max tier available to the process (acceptable — they're already on the machine).
