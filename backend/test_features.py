from fastapi.testclient import TestClient
from backend.main import app, reports_db, shelters_db, micro_havens_db, blacklist_db, accounts_db, init_seed_data

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_part1_feature1_citizen_reporting():
    """Part 1, Feature 1: Citizen Reporting App."""
    payload = {
        "userId": "citizen-unit-test-1",
        "hazardType": "Severe Flooding",
        "description": "Flash flooding on Janpath near Master Canteen",
        "coordinates": {"lat": 20.2961, "lng": 85.8245},
        "victimCount": 4,
        "metadata": {
            "timestamp": "2026-08-29T16:00:00Z",
            "cellTowerId": "CELL-OD-BBS-01",
            "isLiveCapture": True,
            "deviceId": "dev-test-1001",
            "sensorHash": "abc123sensorhash",
            "captureHash": "def456capturehash",
            "channel": "APP",
        },
    }
    res = client.post("/api/reports", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["report"]["hazardType"] == "Severe Flooding"
    assert data["report"]["trustScore"] >= 70
    assert data["towerValidation"]["validated"] is True


def test_part1_feature3_and_part2_feature6_spatial_optimizer_and_multi_tier():
    """Part 1 Feature 3 & Part 2 Feature 6: Spatial Allocation Optimizer & Multi-Tier Routing."""
    login_res = client.post("/api/auth/login", json={"email": "commander@resqgrid.gov", "password": "response2026", "role": "authority"})
    assert login_res.status_code == 200
    token = login_res.json()["token"]

    shelter_login = client.post("/api/auth/login", json={"email": "shelter@resqgrid.gov", "password": "shelter2026", "role": "shelter"})
    shelter_token = shelter_login.json()["token"]

    # Register test shelter
    client.post("/api/shelters", json={
        "shelter_id": "SH-test-auto-01",
        "name": "Auto Test Safe Shelter",
        "coordinates": {"lat": 20.3010, "lng": 85.8200},
        "current_occupancy": 10,
        "max_capacity": 200,
        "power_status": "ACTIVE",
        "water_status": "ACTIVE",
        "medical_status": "ACTIVE",
    }, headers={"Authorization": f"Bearer {shelter_token}"})

    res = client.post("/api/allocation", json={"coordinates": {"lat": 20.3010, "lng": 85.8200}, "people": 2})
    assert res.status_code == 200
    data = res.json()
    assert data["mode"] == "SHELTER"
    assert data["tier"] in [1, 2]
    assert data["distanceKm"] < 5.0

    plan_res = client.post("/api/optimizer/plan", headers={"Authorization": f"Bearer {token}"})
    assert plan_res.status_code == 200
    plan_data = plan_res.json()
    assert plan_data["status"] == "OPTIMIZATION_PLAN_COMPUTED"
    assert "recommendations" in plan_data


def test_part1_feature4_sms_whatsapp_fallback_pipeline():
    """Part 1, Feature 4: SMS & WhatsApp Multi-Channel Fallback Pipeline."""
    
    sms_payload = {
        "channel": "SMS",
        "fromNumber": "+919437099999",
        "rawMessage": "SOS FLOOD Master Canteen square 20.2961, 85.8245 6 people trapped",
    }
    res = client.post("/api/gateway/simulate", json=sms_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SIMULATED_INGESTION_SUCCESS"
    assert data["createdReport"]["hazardType"] == "Severe Flooding"
    assert data["createdReport"]["victimCount"] == 6

    wa_payload = {
        "channel": "WHATSAPP",
        "fromNumber": "+919861011111",
        "rawMessage": "EMERGENCY: Building Collapse near Rajmahal [20.2885, 85.8330] 3 people",
    }
    res_wa = client.post("/api/gateway/simulate", json=wa_payload)
    assert res_wa.status_code == 200
    assert res_wa.json()["createdReport"]["hazardType"] == "Building Collapse"


def test_part2_feature5_crowdsourced_micro_haven_geofence_arrival():
    """Part 2, Feature 5: Crowdsourced Micro-Haven Mapper & Geofence Arrival Promotion."""
   
    mh_payload = {
        "name": "Test High Roof Community Hall",
        "roofCapacity": 50,
        "contactName": "Mr. Das",
        "contactPhone": "+919437000000",
        "notes": "Sturdy concrete roof",
        "coordinates": {"lat": 20.2900, "lng": 85.8200},
    }
    res = client.post("/api/micro-havens", json=mh_payload)
    assert res.status_code == 201
    haven_id = res.json()["shelter"]["id"]

    res_far = client.post(f"/api/micro-havens/{haven_id}/ping-arrival", json={
        "deviceId": "dev-far-1",
        "coordinates": {"lat": 20.3500, "lng": 85.8500},
    })
    assert res_far.status_code == 400

    res_p1 = client.post(f"/api/micro-havens/{haven_id}/ping-arrival", json={"deviceId": "dev-p1", "coordinates": {"lat": 20.2901, "lng": 85.8201}})
    assert res_p1.status_code == 200
    assert res_p1.json()["arrivalCount"] == 1

    res_p2 = client.post(f"/api/micro-havens/{haven_id}/ping-arrival", json={"deviceId": "dev-p2", "coordinates": {"lat": 20.2902, "lng": 85.8200}})
    assert res_p2.json()["arrivalCount"] == 2

    res_p3 = client.post(f"/api/micro-havens/{haven_id}/ping-arrival", json={"deviceId": "dev-p3", "coordinates": {"lat": 20.2900, "lng": 85.8202}})
    assert res_p3.json()["arrivalCount"] == 3
    assert res_p3.json()["promoted"] is True
    assert res_p3.json()["status"] == "ACTIVE"


def test_part2_feature7_active_resource_telemetry_hmac():
    """Part 2, Feature 7: Cryptographically Signed Rescue Team Telemetry."""
    
    telem_payload = {
        "teamId": "RESCUE-BOAT-01",
        "coordinates": {"lat": 20.3005, "lng": 85.8249},
        "status": "EN_ROUTE",
        "speedKmh": 32.0,
        "headingDeg": 180.0,
        "batteryPercent": 95,
        "signature": "SIG-TEST-OK",
    }
    res = client.post("/api/teams/telemetry", json=telem_payload)
    assert res.status_code == 200
    assert res.json()["status"] == "SUCCESS"


def test_part3_feature8_cell_tower_anti_spoofing():
    """Part 3, Feature 8: Network Handshake & Anti-Spoofing Cell-Tower Validation."""
    spoofed_payload = {
        "userId": "citizen-spoofer-app",
        "hazardType": "Fire",
        "description": "Fake fire report from spoofed coordinates",
        "coordinates": {"lat": 20.4500, "lng": 85.9500},
        "metadata": {
            "timestamp": "2026-08-29T16:00:00Z",
            "cellTowerId": "CELL-OD-BBS-01",
            "isLiveCapture": False,
            "deviceId": "spoofer-dev-999",
            "channel": "APP",
        },
    }
    res = client.post("/api/reports", json=spoofed_payload)
    assert res.status_code == 201
    data = res.json()
    assert data["towerValidation"]["isSpoofed"] is True
    assert data["report"]["verification"]["isSpoofed"] is True
    assert data["report"]["trustScore"] <= 20
    assert data["report"]["trustStatus"] == "REJECTED"


def test_part3_feature10_proximity_clustering_peer_consensus():
    """Part 3, Feature 10: Proximity Clustering & Peer-Mesh Consensus."""
    # Post 2 proximity reports to form an emerging cluster
    client.post("/api/reports", json={
        "userId": "cluster-dev-1",
        "hazardType": "Severe Flooding",
        "description": "Flooding test pin 1",
        "coordinates": {"lat": 20.2960, "lng": 85.8240},
        "victimCount": 2,
        "metadata": {"timestamp": "2026-08-29T16:00:00Z", "deviceId": "dev-c1", "cellTowerId": "CELL-OD-BBS-01", "channel": "APP"},
    })
    client.post("/api/reports", json={
        "userId": "cluster-dev-2",
        "hazardType": "Severe Flooding",
        "description": "Flooding test pin 2",
        "coordinates": {"lat": 20.2962, "lng": 85.8242},
        "victimCount": 3,
        "metadata": {"timestamp": "2026-08-29T16:01:00Z", "deviceId": "dev-c2", "cellTowerId": "CELL-OD-BBS-01", "channel": "APP"},
    })

    res = client.get("/api/clusters")
    assert res.status_code == 200
    clusters = res.json()["clusters"]
    assert isinstance(clusters, list)
    assert len(clusters) > 0
    assert clusters[0]["reportCount"] >= 2


def test_part3_feature11_authority_audit_and_24h_blacklisting():
    """Part 3, Feature 11: Authority Audit Trail & 24-Hour Instant Blacklisting."""
    login_res = client.post("/api/auth/login", json={"email": "commander@resqgrid.gov", "password": "response2026", "role": "authority"})
    token = login_res.json()["token"]

    prank_payload = {
        "userId": "prankster-101",
        "hazardType": "Severe Flooding",
        "description": "Prank report to be blacklisted",
        "coordinates": {"lat": 20.2961, "lng": 85.8245},
        "metadata": {
            "timestamp": "2026-08-29T16:00:00Z",
            "deviceId": "prank-device-777",
            "phoneNumber": "+919999900000",
            "channel": "APP",
        },
    }
    r = client.post("/api/reports", json=prank_payload).json()["report"]
    report_id = r["id"]

    b_res = client.patch(f"/api/reports/{report_id}/verify", json={"action": "BLACKLIST", "note": "Prank spam"}, headers={"Authorization": f"Bearer {token}"})
    assert b_res.status_code == 200
    assert b_res.json()["report"]["trustStatus"] == "BLACKLISTED"

    blocked_res = client.post("/api/reports", json=prank_payload)
    assert blocked_res.status_code == 403

    bl_res = client.get("/api/admin/blacklist", headers={"Authorization": f"Bearer {token}"})
    assert bl_res.status_code == 200
    banned_ids = [b["identifier"] for b in bl_res.json()["blacklist"]]
    assert "prank-device-777" in banned_ids

    unban_res = client.delete("/api/admin/blacklist/prank-device-777", headers={"Authorization": f"Bearer {token}"})
    assert unban_res.status_code == 200
