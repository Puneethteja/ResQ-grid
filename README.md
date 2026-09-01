# ResQ-Grid 🚨

> **Multi-Tier Disaster Response, Spatial Resource Optimization & Adversarial Ingestion Verification Platform**

ResQ-Grid is a mission-critical disaster management and tactical coordination platform designed for emergency response authorities (OSDMA, SEOC, NDRF, ODRAF), municipal shelter networks, and impacted citizens during extreme flood, cyclone, and crisis events.

---

## 🌟 Core System Architecture & Features

```
+-----------------------------------------------------------------------------------+
|                                 RESCUE GRID TECH STACK                            |
+-----------------------------------------------------------------------------------+
| Layer                | Core Technologies                                          |
+----------------------+------------------------------------------------------------+
| Frontend / Client    | React 19, Tailwind CSS v4, Leaflet Tactical Maps, Lucide   |
| Ingress / Edge       | Dual IP Threat Intelligence, VPN/Tor Mitigation Gateway     |
| Backend Engine       | Python FastAPI (v0.111+), Python phonenumbers carrier lock |
| Persistence Store    | Structured JSON Database Engine (`backend/data/*.json`)    |
| Security & Hardware  | WebRTC Live Cam, Gyro/Orientation SHA-256 Stamped Proof     |
| Multi-Lingual & i18n | English, Odia (ଓଡ଼ିଆ), Hindi (हिन्दी), Bengali (বাংলা),      |
|                      | Telugu (తెలుగు) with Dynamic Dark / Light Tactical Theme   |
+----------------------+------------------------------------------------------------+
```

---

## 🛡️ Anti-Spoofing & Security Verification

### 1. Dual IP Intelligence & VPN / Proxy Detection
- Every inbound request is evaluated by `dual_ip_intelligence_middleware` in `backend/main.py`.
- Evaluates `CF-Connecting-IP`, `X-Forwarded-For`, and client network interface against IP Threat Intelligence gateways (`IPinfo`, `AbstractAPI`, and internal threat memory caches).
- Detects and blocks commercial VPNs, Tor exit nodes, hosting provider proxies, and spoofed headers with **HTTP 403 Forbidden**.
- **How to test / verify**:
  - Send request with `X-Test-VPN: true` or `X-Test-Proxy: true` header to any API endpoint — the gateway immediately rejects with `"Access denied: VPN, proxy, or anonymous exit node detected"`.
  - Validated by test `Spec 2.3: Dual IP Intelligence & Threat Mitigation` in `backend/run_tests.py`.

### 2. Live WebRTC Camera Capture with Hardware Gyroscope & SHA-256 Stamp
- Eliminates gallery image uploads, deepfakes, and static spoofing.
- Live WebRTC dual-camera viewfinder captures hardware gyroscope angles ($\alpha, \beta, \gamma$), acceleration g-force, timestamp, and GPS coordinates.
- Overlays a cryptographically signed hardware proof seal with SHA-256 hash stamped directly into the evidence image.

### 3. Carrier RF Cell-Tower Handshake
- Compares reported GPS coordinates against Odisha telecom base transceiver stations (BTS).
- Distances exceeding cell tower coverage ($> 5\,\text{km}$) are flagged with an Adversarial Warning in the Authority Command Room.

---

## 📱 Portals & Workflows

### 1. Citizen Emergency Portal (`/citizen`)
- **Telecom Authentication**: Citizens authenticate using their full name and mobile number. Validated in real-time using Python's `phonenumbers` carrier registry and geographic geocoder.
- **Proximity-Only Safety Radar**: Calculates real-time distance to nearest verified hazards and displays IMD (India Meteorological Department) warning bulletins.
- **Multi-Channel Fallback & Proximity WhatsApp**:
  - Automatically identifies the **nearest registered Authority Command Node** based on Euclidean/Haversine proximity.
  - Generates pre-formatted emergency dispatch messages directing citizens directly to the WhatsApp helpline of the nearest incident commander.

### 2. Authority Command Room (`/authority`)
- **Live MasterMap & Thermal Crisis Heatmap**: Multi-tier thermal dispersion layers with real-time radial bloom, glowing incident cores, and live cluster boundary polygons.
- **Incident Triage & Status Locking**: Real-time queue for `Active`, `Verified`, `Rejected`, and `Clusters`. Once confirmed verified, reports are locked into permanent verified state.
- **Adversarial Verification Hub**: Media review console with 1-click batch verification, anti-spoofing telemetry inspection, and 24-hour instant submitter blacklisting.
- **Spatial Resource Optimizer**: Solves high-priority crisis allocation matrices, pairing specialized rescue units (Amphibious Trucks, Trauma Units, Inflatable Boats, Recon Drones) with crisis zones.

### 3. Shelter & Micro-Haven Operations (`/shelter`)
- **Approval Gate**: Community shelter registrations require official Authority Command approval before appearing as safe municipal refuges.
- **Telemetry Heartbeat**: Tracks live safe capacity, power status, medical reserves, and automated micro-haven promotion.

---

## 💾 Database Engine & Persistence (`backend/data/`)

All platform data is persisted in real time as structured JSON records in `backend/data/`:

| File | Purpose |
|---|---|
| `citizens.json` | Verified citizen profiles, carrier metadata & session records |
| `reports.json` | Citizen incident alerts, hardware sensor hashes & triage state |
| `shelters.json` | Tier 1 official municipal shelters & verification state |
| `micro_havens.json` | Tier 2 crowdsourced safe haven points & geofence counters |
| `resources.json` | Rescue fleet assets (Boats, Ambulances, Recon Drones) |
| `accounts.json` | Registered authority commanders & shelter manager accounts |
| `authority_contacts.json`| Registered authority helpline numbers for WhatsApp proximity routing |
| `audit_log.json` | Immutable operational event trail & verification timestamps |
| `blacklist.json` | 24-hour banned devices, IPs, and adversarial phone numbers |
| `team_telemetry.json` | HMAC-SHA256 authenticated rescue team positions |
| `imd_alerts.json` | Official IMD severe weather warning broadcasts |
| `gateway_inbox.json` | Ingested SMS and WhatsApp fallback messages |

---

## 🎨 Theme & Multi-Language Support

- **Dark & Light Tactical Modes**: One-tap toggle with contrast enforcement for bright sunlight and dark command centers. Inputs enforce high-contrast pure black text in Light Mode.
- **5 Supported Languages**:
  1. **English (EN)**
  2. **Odia / ଓଡ଼ିଆ (OR)**
  3. **Hindi / हिन्दी (HI)**
  4. **Bengali / বাংলা (BN)**
  5. **Telugu / తెలుగు (TE)**

---

## ⚡ Setup & Verification

### 1. Backend Server (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Run Automated Verification Suite (15 Tests)
```bash
python backend/run_tests.py
```

### 3. Frontend Web Application (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## 🔐 Default Officer Credentials

| Portal | Route | Default Username | Password |
|---|---|---|---|
| **Citizen Portal** | `/citizen` | *Name + Mobile Number* | Carrier Verified |
| **Authority Command** | `/authority/auth` | `commander@resqgrid.gov` | `response2026` |
| **Shelter Node** | `/shelter/auth` | `shelter@resqgrid.gov` | `shelter2026` |
