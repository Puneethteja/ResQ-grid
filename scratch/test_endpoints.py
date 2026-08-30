import sys
sys.path.insert(0, '.')
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)
resp = client.post('/api/auth/login', json={'email': 'commander@resqgrid.gov', 'password': 'response2026', 'role': 'authority'})
assert resp.status_code == 200, f'Login failed: {resp.text}'
data = resp.json()
assert 'token' in data
print('Login test passed: token received')
resp = client.get('/api/admin/media-queue')
assert resp.status_code == 200
queue = resp.json()
print(f'Media queue returned {len(queue)} items')
sample_photo = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iYmx1ZSIvPjwvc3ZnPg=='
resp = client.post('/api/reports', json={
    'userId': 'test-citizen-01',
    'hazardType': 'Severe Road Inundation',
    'description': 'Water level rising quickly on main road',
    'coordinates': {'lat': 20.2980, 'lng': 85.8260},
    'photo': sample_photo
})
assert resp.status_code == 200, resp.text
rep = resp.json()
assert 'aiAnalysis' in rep
conf = rep['aiAnalysis']['confidence']
feats = rep['aiAnalysis']['detectedFeatures']
print(f'Report submitted with AI Analysis: {conf}% confidence, features: {feats}')
resp = client.patch(f'/api/reports/{rep["id"]}/verify', json={'action': 'VERIFY', 'note': 'Verified by field team'})
assert resp.status_code == 200
v_rep = resp.json()
assert v_rep['trustStatus'] == 'VERIFIED'
print('Report manual verification passed')
resp = client.post('/api/allocation', json={'lat': 20.2980, 'lng': 85.8260})
assert resp.status_code == 200
alloc = resp.json()
print(f'Allocation result: Tier {alloc.get("tier")} refuge found - {alloc.get("message")}')
resp = client.get('/api/operations/overview')
assert resp.status_code == 200
ov = resp.json()
print(f'Operations overview KPIs: activeReports={ov["activeReports"]}, pendingReviewCount={ov["pendingReviewCount"]}, verifiedClusters={ov["verifiedClusters"]}')

print('\nALL BACKEND & AI VERIFICATION TESTS PASSED PERFECTLY!')
