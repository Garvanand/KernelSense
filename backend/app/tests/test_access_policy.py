import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.access.level_policy import AccessTier, filter_process_dict
from backend.app.access.state import AccessState

client = TestClient(app)

def test_access_escalation_and_policy():
    # 1. Start as GUEST
    AccessState.set_tier(AccessTier.GUEST)
    resp = client.get("/api/v1/access/current")
    assert resp.status_code == 200
    assert resp.json()["current_tier"] == "guest"
    assert "open_files" not in resp.json()["unlocked_features"]
    
    # Check processes endpoint for scrubbing
    proc_resp = client.get("/api/v1/processes/")
    if proc_resp.status_code == 200 and len(proc_resp.json()) > 0:
        proc = proc_resp.json()[0]
        # Guest cannot see ppid or deep os fields
        assert proc.get("ppid") is None
        assert proc.get("open_files") is None

    # 2. Escalate to POWER
    esc_resp = client.post("/api/v1/access/escalate", json={"requested_tier": "power", "consent_reason": "test"})
    assert esc_resp.status_code == 200
    assert AccessState.get_tier() == AccessTier.POWER

    # Check features unlocked
    resp = client.get("/api/v1/access/current")
    assert "open_files" in resp.json()["unlocked_features"]

def test_filter_process_dict():
    # Construct a dummy full privileged process
    full_proc = {
        "pid": 123,
        "name": "test",
        "cpu_percent": 5.0,
        "mem_rss_bytes": 1024,
        "ppid": 1,
        "create_time": 1000.0,
        "mem_vms_bytes": 2048,
        "num_threads": 2,
        "io_read_bytes": 10,
        "io_write_bytes": 20,
        "num_fds": 5,
        "cpu_affinity": [0, 1],
        "open_files": [{"path": "/tmp/a", "fd": 3}],
        "sockets": [{"fd": 4, "family": 2, "type": 1, "laddr": "127.0.0.1:80", "raddr": None, "status": "LISTEN"}],
        "permissions": {"username": "root"}
    }
    
    # 1. Filter as GUEST
    guest_proc = filter_process_dict(full_proc.copy(), AccessTier.GUEST)
    assert guest_proc["pid"] == 123  # Unchanged
    assert guest_proc["ppid"] is None
    assert guest_proc["open_files"] is None
    assert guest_proc["sockets"] is None
    
    # 2. Filter as POWER
    power_proc = filter_process_dict(full_proc.copy(), AccessTier.POWER)
    assert power_proc["pid"] == 123
    assert power_proc["ppid"] == 1
    assert power_proc["open_files"] is not None
    assert len(power_proc["open_files"]) == 1
