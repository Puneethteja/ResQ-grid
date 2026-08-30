import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.test_features import (
    test_health,
    test_part1_feature1_citizen_reporting,
    test_part1_feature3_and_part2_feature6_spatial_optimizer_and_multi_tier,
    test_part1_feature4_sms_whatsapp_fallback_pipeline,
    test_part2_feature5_crowdsourced_micro_haven_geofence_arrival,
    test_part2_feature7_active_resource_telemetry_hmac,
    test_part3_feature8_cell_tower_anti_spoofing,
    test_part3_feature10_proximity_clustering_peer_consensus,
    test_part3_feature11_authority_audit_and_24h_blacklisting,
)

tests = [
    ("Health Check", test_health),
    ("Feature 1: Citizen Reporting App", test_part1_feature1_citizen_reporting),
    ("Features 3 & 6: Spatial Optimizer & Multi-Tier Routing", test_part1_feature3_and_part2_feature6_spatial_optimizer_and_multi_tier),
    ("Feature 4: SMS & WhatsApp Fallback Pipeline", test_part1_feature4_sms_whatsapp_fallback_pipeline),
    ("Feature 5: Crowdsourced Micro-Haven Geofence Arrival & Auto-Promotion", test_part2_feature5_crowdsourced_micro_haven_geofence_arrival),
    ("Feature 7: Cryptographically Signed Team Telemetry (HMAC)", test_part2_feature7_active_resource_telemetry_hmac),
    ("Feature 8: Telecom Handshake & Cell-Tower Anti-Spoofing", test_part3_feature8_cell_tower_anti_spoofing),
    ("Feature 10: Proximity Clustering & Peer-Mesh Consensus", test_part3_feature10_proximity_clustering_peer_consensus),
    ("Feature 11: Authority Audit Trail & 24h Instant Blacklisting", test_part3_feature11_authority_audit_and_24h_blacklisting),
]

passed = 0
failed = 0

print("=" * 70)
print("RUNNING RESQGRID 11-FEATURE END-TO-END VERIFICATION SUITE")
print("=" * 70)

for name, fn in tests:
    try:
        fn()
        print(f"[PASS] {name}")
        passed += 1
    except Exception as e:
        print(f"[FAIL] {name}: {e}")
        import traceback
        traceback.print_exc()
        failed += 1

print("=" * 70)
print(f"RESULTS: {passed} PASSED, {failed} FAILED")
print("=" * 70)

if failed > 0:
    sys.exit(1)
else:
    sys.exit(0)
