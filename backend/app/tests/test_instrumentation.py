import pytest
import platform
from unittest.mock import patch
from backend.app.instrumentation.common.schema import ProcessContext, SystemMetrics, TelemetryPayload
from backend.app.instrumentation.linux.psutil_collector import LinuxPsutilCollector
from backend.app.instrumentation.consent import consent_manager

def test_psutil_collector():
    collector = LinuxPsutilCollector()
    payload = collector.collect()
    
    assert payload is not None
    assert isinstance(payload, TelemetryPayload)
    assert len(payload.processes) > 0
    assert payload.system_metrics.mem_total_bytes > 0
    assert isinstance(payload.system_metrics.cpu_percent, list)

def test_consent_manager():
    assert consent_manager.is_granted() is False
    consent_manager.request_consent("test")
    assert consent_manager.is_granted() is True
    consent_manager.revoke_consent()
    assert consent_manager.is_granted() is False

def test_windows_collector_overrides():
    from backend.app.instrumentation.windows.etw_collector import WindowsETWCollector
    collector = WindowsETWCollector()
    payload = collector.collect()
    assert payload.platform_info.os == "windows"
    assert payload.platform_info.reduced_fidelity is True
    assert payload.system_metrics.windows_commit_bytes is not None

def test_macos_collector_overrides():
    from backend.app.instrumentation.macos.collector import MacOSCollector
    collector = MacOSCollector()
    payload = collector.collect()
    assert payload.platform_info.os == "macos"
    assert payload.platform_info.reduced_fidelity is True
