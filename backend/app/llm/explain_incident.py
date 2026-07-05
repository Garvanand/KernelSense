import asyncio
from pydantic import BaseModel, Field
import json

class IncidentExplanationRequest(BaseModel):
    prediction_type: str
    entity_id: str
    score: float
    confidence: float
    telemetry_signals: dict

class IncidentExplanationResponse(BaseModel):
    diagnostic: str = Field(description="2-3 sentence root-cause diagnostic.")
    recommended_action: str = Field(description="Suggested remediation step.")

# In-memory cache for LLM responses to bound costs
_llm_cache = {}

async def generate_incident_explanation(incident_id: int, request: IncidentExplanationRequest) -> IncidentExplanationResponse:
    """
    Mocked Bounded LLM Explainer.
    In a production system, this would call OpenAI/Anthropic API with a strict JSON schema prompt.
    We enforce the boundary by ensuring the input is strongly typed and output is cached.
    """
    if incident_id in _llm_cache:
        return _llm_cache[incident_id]
        
    # Simulate LLM latency
    await asyncio.sleep(1.5)
    
    # Generate bounded explanation based on type
    if request.prediction_type == "leak_anomaly":
        response = IncidentExplanationResponse(
            diagnostic=f"Process {request.entity_id} exhibits a monotonic heap growth pattern that violates standard deviation bounds. An unclosed file descriptor or dangling pointer in the event loop is the highly probable root cause.",
            recommended_action="Execute a heap dump via `jmap` or `gcore` and restart the daemon."
        )
    elif request.prediction_type == "deadlock_risk":
        response = IncidentExplanationResponse(
            diagnostic=f"Process {request.entity_id} has been blocked in `D` (Uninterruptible Sleep) state for an anomalous duration. Heavy I/O contention on the block device is creating a potential deadlock.",
            recommended_action="Investigate block device I/O latency or SIGKILL the process if unresponsive."
        )
    elif request.prediction_type == "forecasting":
        response = IncidentExplanationResponse(
            diagnostic=f"System resource '{request.entity_id}' is projected to saturate within the current forecasting window based on historical momentum. This indicates impending OOM or CPU starvation.",
            recommended_action="Scale out horizontally or preemptively terminate non-critical batch jobs."
        )
    else:
        response = IncidentExplanationResponse(
            diagnostic="Anomalous behavior detected outside standard known signatures. Telemetry vectors suggest localized contention.",
            recommended_action="Monitor system dmesg logs for deeper context."
        )
        
    # Cache and return
    _llm_cache[incident_id] = response
    return response
