# ResQ-Grid 🚨

> **Multi-Tier Disaster Response, Spatial Resource Optimization & Adversarial Ingestion Verification Platform**

ResQ-Grid is a full-spectrum disaster coordination and crisis response platform engineered to operate reliably during severe emergency scenarios, network degradation, and high-concurrency events.

The platform provides a **Citizen Emergency Reporting App**, a **Live Authority Command Room with Heatmaps**, a **Multi-Tier Spatial Allocation Solver Matrix**, an **SMS & WhatsApp Fallback Webhook Pipeline**, a **Crowdsourced Micro-Haven Network**, and an **Adversarial-Proof Anti-Spoofing Verification Engine**.

---

## 🌟 Full 11-Feature Platform Architecture

### **Part 1: The Core Foundation**
1. **Citizen Reporting App (`/citizen`)**:
   - Droppable geo-tagged pins with exact GPS coordinates and district sector presets.
   - Emergency descriptions, victim quantifier, and live camera evidence capture sealed with hardware sensor hashes.
2. **Live Authority Dashboard with Heatmaps (`/authority`)**:
   - Control room interface with a tactical Leaflet MasterMap, dynamic crisis density heatmaps, and live incident triage feeds.
3. **Resource & Shelter Allocation Optimizer (`/authority` -> Spatial Optimizer)**:
   - Spatial solver matrix pairing specialized rescue units (Rescue Boats, Trauma Units, Recon Drones, Amphibious Trucks) with high-priority crisis zones.
4. **SMS & WhatsApp Multi-Channel Fallback Pipeline (`/citizen` & `/api/gateway/simulate`)**:
   - Webhook gateways ingesting WhatsApp Business Cloud API and Twilio SMS/IVR text messages into structured database records.

---

### **Part 2: Dynamic Resource & Haven Safety-Net**
5. **Crowdsourced Micro-Haven Mapper**:
   - Community-registered dry roofs, reinforced halls, and temples with an automated **$150\,\text{m}$ Geofence Arrival Engine** that auto-promotes havens to `ACTIVE` once $\ge 3$ devices check in.
6. **Multi-Tier Routing Optimizer**:
   - Dynamically routes evacuees across **Tier 1** (Official Municipal Shelters), **Tier 2** (Verified Micro-Havens), and **Tier 3** (Shelter-in-Place on high ground with automated Mobile Extraction Unit dispatch).
7. **Active Resource Verification Loop**:
   - Automated 15-minute shelter capacity/power heartbeats and HMAC-SHA256 cryptographically signed field rescue team telemetry.

---

### **Part 3: Adversarial-Proof Verification Engine**
8. **Network Handshake & Cell-Tower Validation**:
   - Cross-references reported GPS coordinates against carrier cell tower registries (`CELL-OD-BBS-01`, etc.) to detect and flag fake GPS spoofer apps.
9. **Live-Only Metadata Hashing & Sensor Locking**:
   - Enforces live camera capture while extracting SHA-256 hashes of timestamp, device ID, gyroscope, and orientation sensors to block static or stock photo uploads.
10. **Proximity Clustering & Peer-Mesh Consensus**:
    - Groups incoming pins within a $350\,\text{m}$ radius. Multi-source clusters ($\ge 3$ unique devices) auto-elevate to **L1 Verified Consensus** ($\ge 90\%$ trust) with dashed boundary polygons on the MasterMap.
11. **Authority Audit Trail & Instant Blacklisting**:
    - Displays an automated **Trust Score Badge** on every alert and empowers officials to instantly blacklist malicious device identifiers and phone numbers for **24 hours**.

---

## 💾 Data Persistence (JSON Storage)

All backend database collections are persisted to `.json` files inside `backend/data/`:
- `reports.json` — Citizen hazard reports & complaints
- `shelters.json` — Tier 1 registered municipal shelters
- `micro_havens.json` — Tier 2 crowdsourced community safe zones
- `resources.json` — Rescue assets (Boats, Ambulances, Drones, Trucks)
- `accounts.json` — Authorized command personnel & shelter managers
- `audit_log.json` — Cryptographic operational audit trails
- `blacklist.json` — 24-hour banned devices & phone numbers
- `team_telemetry.json` — HMAC-signed rescue team positions
- `gateway_inbox.json` — Raw SMS / WhatsApp inbound messages

All mutations are automatically committed to disk, ensuring complete state persistence across server restarts.

---

## 📁 Repository Structure & File Guide

```
ResQgrid/
├── backend/
│   ├── data/                 # Persistent JSON database storage
│   ├── main.py               # FastAPI application server & verification engine
│   ├── run_tests.py          # 11-feature automated test suite runner
│   ├── test_features.py      # Test cases for all 11 core features
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/       # Modular UI components (authority, citizen, map, shelter)
│   │   ├── lib/              # API client & session helpers
│   │   ├── pages/            # CitizenPortal, AuthorityDashboard, ShelterPortal, AuthPortal
│   │   ├── App.jsx           # Routing & route guards
│   │   └── main.jsx          # React entry point
│   ├── package.json
│   └── vite.config.js
├── .gitignore                # Clean GitHub ignore configuration
└── README.md                 # Project documentation
```

### ❓ What are `scratch` and `run_tests` files?
- **`scratch/` Directory (Temporary / Cleaned)**: 
  `scratch/` folders contain temporary ad-hoc developer test scripts used during active feature development (e.g. `debug_queue.py`, `test_endpoints.py`). They are **not needed for production** and are safely removed and excluded by `.gitignore`.
- **`run_tests.py` & `test_features.py` (Mandatory Test Suite)**:
  `run_tests.py` is the automated end-to-end test runner that validates all 11 platform features (health checks, citizen reporting, spatial optimization, cell tower validation, HMAC signatures, etc.). **Keep these files** in the repo for CI/CD pipelines, automated testing, and regression verification.

---

## ⚡ Quickstart & Setup

### **Prerequisites**
- **Node.js** v18+ & **npm** v9+
- **Python** 3.10+

---

### **1. Backend Server**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

To run the automated verification test suite:
```bash
python backend/run_tests.py
```

---

### **2. Frontend Web Application**
```bash
cd frontend
npm install
npm run dev
```

To build for production:
```bash
npm run build
```

---

## 🔐 Default Access Portals & Credentials

| Role / Portal | Route | Default Identifier | Access Code / Password |
|---|---|---|---|
| **Citizen Reporting App** | `/citizen` | *No login required* | Open Access |
| **Authority Command Room** | `/authority/auth` | `commander@resqgrid.gov` | `response2026` |
| **Shelter Management Node** | `/shelter/auth` | `shelter@resqgrid.gov` | `shelter2026` |

---

## 🔑 Administrative Access & Authentication

| Role | Access Route | Auth Requirement | Scope |
| :--- | :--- | :--- | :--- |
| **Citizen** | `/citizen` | *No auth required* | Open public emergency reporting & hazard map portal |
| **Authority Command** | `/authority/auth` | Official Officer Account | Full command room access, triage queue & spatial optimizer |
| **Shelter Manager** | `/shelter/auth` | Verified Shelter Account | Manage shelter capacity, Heartbeat status & micro-havens |

> **Security Note**: Agency security verification codes and administrator access credentials are provisioned via environment variables (`AUTHORITY_PASSWORD`, `AUTHORITY_VERIFICATION_CODE`).

---

## 🔌 API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/login` | Authenticate officer or shelter user | No |
| `POST` | `/api/auth/register` | Register verified authority or shelter account | No |
| `POST` | `/api/reports` | Submit emergency hazard report (with sensor telemetry) | No |
| `GET` | `/api/reports` | Fetch active hazard reports | No |
| `GET` | `/api/clusters` | Fetch spatial peer-consensus clusters | No |
| `POST` | `/api/optimizer/plan` | Generate spatial resource & shelter allocation matrix | **Yes** (Authority) |
| `POST` | `/api/optimizer/batch-dispatch` | Execute 1-click batch dispatch plan | **Yes** (Authority) |
| `GET` | `/api/admin/media-queue` | Fetch media verification queue | **Yes** (Authority) |
| `PATCH` | `/api/reports/{id}/verify` | Verify, reject, or 24h blacklist a report | **Yes** (Authority) |
| `GET` | `/api/shelters` | Fetch Tier 1 municipal shelters | No |
| `POST` | `/api/micro-havens` | Register Tier 2 community micro-haven | No |
| `GET` | `/api/audit` | Fetch immutable operational audit trail | **Yes** (Authority) |

---

## 🔒 Security & Anti-Spoofing Architecture

1. **Hardware Device Sensor Lock**: Live camera frames are cryptographically bound to hardware accelerometer and orientation sensor states ($\alpha, \beta, \gamma, \text{g-force}$) using SHA-256 digests.
2. **Carrier RF Tower Handshake**: Reported GPS coordinates are verified against nearest cell tower RF coverage radii ($3.5\text{km} - 5.0\text{km}$). Coordinates exceeding tower coverage are flagged as **Adversarial GPS Spoofers**.
3. **HMAC-SHA256 Telemetry Verification**: Field team position streams use pre-shared HMAC keys to prevent rogue team injection.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.
