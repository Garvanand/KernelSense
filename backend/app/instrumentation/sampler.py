import time
import structlog
from typing import Optional
from backend.app.instrumentation.common.base import BaseCollector

logger = structlog.get_logger()

class TelemetrySampler:
    """
    Orchestrates telemetry collection at a configurable interval.
    Enforces the CPU overhead budget by measuring collection latency.
    """
    def __init__(self, collector: BaseCollector, interval_sec: float = 1.0):
        self.collector = collector
        self.interval_sec = interval_sec
        self.running = False
        self.cpu_budget_warn_threshold_sec = 0.02 # e.g. 20ms for < 2% of 1.0s interval
        
    def _sample_once(self):
        start = time.perf_counter()
        
        try:
            payload = self.collector.collect()
        except Exception as e:
            logger.error("collection_failed", error=str(e))
            return None
            
        duration = time.perf_counter() - start
        
        if duration > self.cpu_budget_warn_threshold_sec:
            logger.warning("collection_overhead_high", duration_sec=duration, limit=self.cpu_budget_warn_threshold_sec)
            
        # In a full app, this would emit to a queue or websocket
        return payload

    def start(self):
        self.running = True
        logger.info("sampler_started", interval=self.interval_sec)
        
        base_interval = self.interval_sec
        
        while self.running:
            start_time = time.perf_counter()
            self._sample_once()
            duration = time.perf_counter() - start_time
            
            # Adaptive Backoff: If duration exceeds the budget, dynamically throttle the interval
            if duration > self.cpu_budget_warn_threshold_sec:
                self.interval_sec = min(base_interval * 5, self.interval_sec * 1.5)
                logger.warning("adaptive_backoff_engaged", duration=duration, new_interval=self.interval_sec)
            else:
                # Slowly recover back to base interval if we are under budget
                self.interval_sec = max(base_interval, self.interval_sec * 0.9)
                
            time.sleep(self.interval_sec)
            
    def stop(self):
        self.running = False
        self.collector.cleanup()
        logger.info("sampler_stopped")
