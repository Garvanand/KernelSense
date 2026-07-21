import pytest
from backend.app.ml.anomaly_detector import InlineAnomalyDetector
from backend.app.api.system import SystemMetricsResponse

def test_anomaly_detector_initialization():
    detector = InlineAnomalyDetector(history_size=50)
    assert detector.history_size == 50
    assert len(detector.metrics_history) == 0

def test_anomaly_detector_no_anomaly_initial():
    detector = InlineAnomalyDetector(history_size=50)
    metrics = SystemMetricsResponse(
        timestamp=100.0,
        cpu_percent=[10.0, 15.0],
        cpu_user_percent=12.5,
        cpu_system_percent=12.5,
        cpu_idle_percent=75.0,
        cpu_freq_mhz=3000.0,
        mem_total_bytes=1000,
        mem_used_bytes=100,
        mem_percent=10.0,
        disk_read_bytes=0,
        disk_write_bytes=0,
        net_bytes_sent=0,
        net_bytes_recv=0,
        linux_ebpf_context_switches=100
    )
    
    anomalies = detector.detect_anomalies(metrics, [])
    assert len(anomalies) == 0

def test_anomaly_detector_trigger_cpu():
    detector = InlineAnomalyDetector(history_size=5)
    # Fill history with low CPU
    for i in range(5):
        m = SystemMetricsResponse(
            timestamp=float(i), cpu_percent=[10.0], cpu_user_percent=10.0, cpu_system_percent=0.0,
            cpu_idle_percent=90.0, cpu_freq_mhz=1000.0, mem_total_bytes=100, mem_used_bytes=10, mem_percent=10.0,
            disk_read_bytes=0, disk_write_bytes=0, net_bytes_sent=0, net_bytes_recv=0
        )
        detector.detect_anomalies(m, [])
        
    # High CPU spike
    spike = SystemMetricsResponse(
        timestamp=6.0, cpu_percent=[99.0], cpu_user_percent=99.0, cpu_system_percent=0.0,
        cpu_idle_percent=1.0, cpu_freq_mhz=1000.0, mem_total_bytes=100, mem_used_bytes=10, mem_percent=10.0,
        disk_read_bytes=0, disk_write_bytes=0, net_bytes_sent=0, net_bytes_recv=0
    )
    
    anomalies = detector.detect_anomalies(spike, [])
    assert len(anomalies) > 0
    assert any(a["incident_type"] == "cpu_spike" for a in anomalies)
