import asyncio
from pydantic import BaseModel, Field
import json
import structlog
from backend.app.core.config import settings

logger = structlog.get_logger()

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
    Generate incident explanation using Groq, fallback to templates if unavailable.
    """
    if incident_id in _llm_cache:
        return _llm_cache[incident_id]
        
    api_key = settings.GROQ_API_KEY
    
    if api_key and settings.LLM_PROVIDER == "groq":
        try:
            from groq import AsyncGroq
            client = AsyncGroq(api_key=api_key)
            
            prompt = f"""
You are an expert Linux/Windows OS Kernel Engineer diagnosing an incident.
Incident Type: {request.prediction_type}
Entity ID: {request.entity_id}
Severity Score: {request.score}
Confidence: {request.confidence}

Provide a JSON response with exactly two fields:
1. "diagnostic": A 2-3 sentence root-cause diagnostic explaining what is likely happening at the OS level.
2. "recommended_action": A clear, single suggested remediation step.

Return ONLY valid JSON matching this structure.
"""
            
            completion = await client.chat.completions.create(
                model="llama-3.3-70b-versatile", # Using a standard fast model, adjust as needed
                messages=[
                  {
                    "role": "user",
                    "content": prompt
                  }
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            content = completion.choices[0].message.content
            parsed = json.loads(content)
            response = IncidentExplanationResponse(
                diagnostic=parsed.get("diagnostic", "Unknown diagnostic."),
                recommended_action=parsed.get("recommended_action", "No action recommended.")
            )
            
            _llm_cache[incident_id] = response
            return response
            
        except Exception as e:
            logger.error("groq_api_error", error=str(e))
            # Fall through to templates
    
    # Simulate LLM latency for fallback
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
