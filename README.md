# ResQ-Grid 🚨

> **Multi-Tier Disaster Response, Spatial Resource Optimization & Adversarial Ingestion Verification Platform**

ResQ-Grid is an enterprise-grade emergency response and disaster coordination ecosystem designed to operate reliably during severe crisis events, network degradation, and high-concurrency situations.

The platform unifies **citizen hazard reporting**, **multi-tier refuge management**, **spatial allocation solvers**, **multi-channel offline gateways** (SMS, WhatsApp, IVR), and a **Restricted Authority Command Room** equipped with telecom anti-spoofing verification engines.

---

## 🌟 Key Features

### 1. 📲 Citizen Emergency Reporting Portal
- **Interactive Geo-Tagging**: Precise GPS coordinate detection with manual pin adjustments.
- **Live Hardware Evidence Camera**: Captures incident evidence sealed with device accelerometer/orientation sensors and SHA-256 cryptographic watermarks.
- **Trapped Citizen Quantifier**: Quantifies affected victims to prioritize rescue dispatch.
- **Offline Mesh Resilience**: Caches emergency reports locally during cellular outages and transmits via fallback gateways.

### 2. 🛡️ Adversarial-Proof Verification & Anti-Spoofing Engine
- **Telecom Cell-Tower RF Handshake**: Cross-references reported GPS coordinates against carrier cell tower registries to detect and auto-reject fake GPS spoofer apps.
- **Cryptographic & AI Photo Authenticity**: Computer-vision analysis checks for live sensor locks. Static, unverified, or fake photos are assigned low confidence (~40%) and flagged for mandatory manual authority review.
- **Peer-Mesh Proximity Clustering**: Automatically groups reports within a 350m spatial radius into consensus clusters. Clusters with $\ge 3$ unique devices are automatically elevated to **L1 Verified Consensus**.
- **24-Hour Instant Blacklisting**: Blocks adversarial devices and phone numbers from spamming emergency queues.

### 3. 🧩 Spatial Resource & Multi-Tier Shelter Allocation Optimizer
- **Automated Spatial Pairing**: Solver matrix pairs crisis zones with specialized extraction assets (Quick Rescue Boats, Medical Trauma Units, Recon Drones, Amphibious Evacuation Trucks).
- **ETA & Capacity Solver**: Computes real-time ETAs and directs evacuees to optimal Tier 1 municipal shelters or Tier 2 community micro-havens.
- **1-Click Batch Dispatch**: Allows incident commanders to execute multi-unit dispatch plans simultaneously.

### 4. 🏥 Multi-Tier Safe Refuge & Shelter Management
- **Tier 1 Municipal Shelters**: Real-time occupancy tracking, infrastructure heartbeat panels (power, water, medical supplies), and panic toggles.
- **Tier 2 Community Micro-Havens**: Crowdsourced refuge discovery, geofenced arrival pings, and auto-promotion workflows.

### 5. 📻 Multi-Channel Fallback Telecom Gateway
- **NLP Ingestion Pipeline**: Ingests unstructured emergency texts from **SMS**, **WhatsApp**, and **IVR Voice** calls, parsing hazard categories, landmark text, and coordinates into structured database records.

### 6. 🎛️ Authority Command Room Dashboard
- **Live Interactive Map**: Layered view displaying incident pins, shelter occupancy meters, consensus cluster polygons, and real-time hazard heatmaps.
- **Triage Sidebar & Verification Hub**: Real-time queue for reviewing high-resolution media, cell tower handshakes, and AI confidence scores.
- **HMAC-Signed Field Telemetry**: Audit log tracking field rescue unit locations secured via HMAC-SHA256 signatures.

---

## 🏗️ Tech Stack

### **Frontend**
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS, Custom CSS Variables
- **Icons**: Lucide React
- **Routing**: React Router DOM v6
- **Build Tool**: Vite (Rolldown engine)

### **Backend**
- **Framework**: Python 3.14 (FastAPI)
- **Validation**: Pydantic v2
- **Cryptography**: HMAC-SHA256, PBKDF2-HMAC-SHA256, SHA-256 Data Seals
- **Testing**: FastAPI TestClient, Pytest runner

---

## 📁 Repository Structure

```
ResQgrid/
├── backend/
│   ├── main.py              # FastAPI application server, database models, AI & verification engine
│   ├── run_tests.py         # End-to-end 11-feature automated test suite runner
│   ├── test_features.py     # Comprehensive test suites for all 11 core features
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # React modular components
│   │   │   ├── authority/   # AdminVerificationHub, AuditTelemetryView, IncidentDetailModal, etc.
│   │   │   ├── citizen/     # CameraCapture, ReportForm, SOSHeader, OfflineDrawer, etc.
│   │   │   ├── map/         # MasterMap, HeatmapLayer
│   │   │   └── shelter/     # CapacityMeter, HeartbeatPanel, MicroHavenForm, ThreatRadar, etc.
│   │   ├── lib/             # API client (api.js), session management (authoritySession.js)
│   │   ├── pages/           # CitizenPortal, AuthorityDashboard, ShelterPortal, AuthPortal
│   │   ├── App.jsx          # Route definitions
│   │   └── main.jsx         # Application entry point
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## ⚡ Getting Started

### **Prerequisites**
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **npm**: v9.0.0 or higher

---

### **1. Backend Setup & Launch**

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Launch the FastAPI server:
   ```bash
   python main.py
   ```
   The backend API will start at `http://localhost:8000`. Swagger documentation is available at `http://localhost:8000/docs`.

4. Run the automated 11-feature test suite:
   ```bash
   python run_tests.py
   ```

---

### **2. Frontend Setup & Launch**

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

4. Build for production:
   ```bash
   npm run build
   ```

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
