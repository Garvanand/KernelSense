# Security & Access Control

KernelSense operates deeply within the host operating system. Reading raw eBPF scheduler traces or enumerating open file descriptors presents a vast security footprint. To mitigate this without relying on heavy authentication infrastructure, KernelSense implements a strict **Zero-Trust Access Model**.

## Stateless Clearance Levels
KernelSense replaces traditional auth (OAuth, User Tables, JWTs) with a localized **Clearance Level Model**.
State is held entirely client-side via `Zustand` and transmitted on every API request via the `X-Access-Level` HTTP header. The backend never trusts the client, using dependency injection to evaluate the header on protected routes.

### The Clearance Tiers
1. **Guest**: (Default) Can view high-level aggregates (Total CPU %, Total RAM). Cannot see specific process names or dependencies.
2. **Power User**: Unlocks the Process Tree and Memory Heatmap. Can view specific processes and their CPU/RAM footprints.
3. **Kernel**: Unlocks OS Introspection. Can view open file descriptors, active network sockets, and the raw Context Switch stream via eBPF.
4. **Research**: Unlocks the ML inference graphs (LSTM predictions, GNN IPC dependencies) and the raw LLM diagnostic stream.

## Read-Only Constraint (ADR-0001)
KernelSense is architected under an absolute read-only constraint. 
- It **never** intercepts or inspects the content of network packets, only the metadata (IP/Port).
- It **never** issues `SIGKILL` or modifies process priorities (`renice`).
- It **cannot** modify files on the filesystem.

## Bounded LLM Safety (ADR-0004)
Exposing OS telemetry to an LLM presents prompt-injection and hallucination vectors. We secure this by:
- Pre-processing the telemetry into rigid Pydantic JSON schemas before sending to the LLM.
- Forcing the LLM to reply via structured output (JSON schema validation) consisting of exactly two strings: `diagnostic` and `remediation`.
- Dropping any response that attempts to execute commands or deviates from the schema.
