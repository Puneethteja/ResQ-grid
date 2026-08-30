import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

resp = client.get('/api/admin/media-queue')
print(f"Status: {resp.status_code}, Body: {resp.text}")
