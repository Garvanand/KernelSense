from abc import ABC, abstractmethod
from typing import Optional
from backend.app.instrumentation.common.schema import TelemetryPayload

class BaseCollector(ABC):
    """
    Base class for all telemetry collectors.
    """
    
    @abstractmethod
    def collect(self) -> Optional[TelemetryPayload]:
        """
        Collect a single sample of telemetry.
        Returns None if collection fails non-fatally.
        """
        pass
    
    @abstractmethod
    def cleanup(self) -> None:
        """
        Clean up resources (e.g., detach eBPF probes, close ETW sessions).
        """
        pass
