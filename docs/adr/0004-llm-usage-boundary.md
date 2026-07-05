# ADR-0004: LLM Usage Boundary — Single Bounded Call

> **Status:** Accepted
> **Date:** 2026-07-05
> **Deciders:** Project architect
> **Context:** [PROJECT_SELECTION.md §5.1](file:///c:/Users/GARV%20ANAND/Downloads/KernelSense/docs/PROJECT_SELECTION.md), Hard Constraint #3 in [memory.md](file:///c:/Users/GARV%20ANAND/Downloads/KernelSense/memory.md)

---

## Context

KernelSense includes AI components for prediction and anomaly detection. The question is: what role, if any, should a Large Language Model (LLM) play?

The project has a hard constraint: **no general-purpose chatbot LLM usage**. The LLM must not become the product — it is a translation layer.

### Alternatives Considered

| Option | Description | Rejected Because |
| :----- | :---------- | :--------------- |
| **A: No LLM at all** | Only show raw predictions (probability, ETA, process name) | Predictions are numbers — non-expert users can't interpret "OOM probability 0.87 in 237s for PID 4521" without context |
| **B: Chat interface** | Free-form "ask about your system" LLM chat | Violates hard constraint; non-deterministic; unbounded cost; shifts product identity to "chatbot wrapper" |
| **C: LLM for all inference** | Use LLM for anomaly detection, forecasting, everything | Slow, expensive, non-deterministic, unverifiable (see ADR-0003) |
| **D: Single bounded call per event** (selected) | One structured-in/structured-out API call per confirmed predicted event | Minimal scope; bounded cost; deterministic input; fallback-capable |

---

## Decision

The LLM is invoked **exactly once per confirmed predicted event**, with **structured JSON input** and a **constrained output schema**. It is a translation layer, not a reasoning engine.

### Contract

**Input (structured JSON):**
```json
{
    "event_type": "memory_saturation",
    "severity": "high",
    "resource": "memory",
    "process": {
        "pid": 4521,
        "name": "node",
        "mem_rss_bytes": 3489660928,
        "mem_growth_rate_bytes_per_sec": 2097152
    },
    "prediction": {
        "probability": 0.87,
        "eta_seconds": 237,
        "confidence": 0.82
    },
    "system_context": {
        "mem_total_bytes": 8589934592,
        "mem_available_bytes": 536870912,
        "swap_percent": 78.5
    }
}
```

**Output (constrained):**
```json
{
    "explanation": "The Node.js process (PID 4521) is consuming 3.2 GB of memory and growing at ~2 MB/sec. At this rate, available system memory (512 MB remaining) will be exhausted in approximately 4 minutes, likely triggering the OOM killer.",
    "suggested_action": "Consider restarting the Node.js process or investigating for memory leaks. Check for unbounded caches, event listener accumulation, or large buffer allocations.",
    "confidence_note": "This prediction has 82% confidence based on 5 minutes of observed memory growth."
}
```

### Boundaries

| Boundary | Rule |
| :------- | :--- |
| **Invocation trigger** | Only on confirmed predicted events (probability > threshold AND confidence > threshold). Never speculative. |
| **Frequency** | At most 1 call per event. Deduplication by event type + process + 5-minute window. |
| **Input** | Structured JSON only. No raw telemetry dumps. No file contents. No memory dumps. |
| **Output** | Three fields: `explanation` (string, ≤200 words), `suggested_action` (string, ≤100 words), `confidence_note` (string, ≤50 words). |
| **Timeout** | 5 seconds. On timeout → fallback to template-generated explanation. |
| **Fallback** | Template: "Predicted {event_type} for process {name} (PID {pid}): {probability}% probability in ~{eta_seconds}s." |
| **Model** | Small, fast model (GPT-4o-mini, Claude Haiku). Not the flagship model. |
| **Cost cap** | At most ~10 calls/hour under normal operation (one per confirmed event; events are rare by design). |
| **Data sent** | Process name, PID, numeric metrics only. No file paths, no environment variables, no user data. |
| **Tier** | Research tier only. Guest and Power users never trigger LLM calls. |

---

## Consequences

### Positive
- The product works fully without the LLM — predictions are the primary value; explanations are supplementary.
- Bounded cost: ~10 calls/hour × $0.0001/call = negligible.
- Structured input/output makes the LLM call testable and mockable.
- Fallback ensures the system never blocks on LLM availability.

### Negative
- Explanations are limited to what can be derived from the structured event JSON — no deep contextual reasoning.
- Requires an API key (OpenAI or Anthropic) for Research tier — this is a user-provided configuration.
- Template fallback is less natural-sounding but fully functional.

### Why This Is Not a Chatbot Wrapper
1. No chat interface. No conversational loop. No prompt engineering by the user.
2. The LLM never sees raw telemetry — only pre-processed, structured event summaries.
3. The prediction (LSTM/anomaly detector) is the value; the LLM just translates it to English.
4. Removing the LLM entirely degrades the UX slightly but does not remove any functionality.
