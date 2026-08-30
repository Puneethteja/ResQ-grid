# 🛡️ ResQ-Grid: Comprehensive Platform, Button & Frontend Requirements Documentation

**ResQ-Grid** is a Next-Generation Disaster Response, Citizen Evacuation, and Incident Verification Command Platform engineered for rapid relief coordination during severe emergencies (cyclones, urban floods, landslides, and critical infrastructure collapse).

---

## 💻 Frontend Requirements & Technical Specifications

### 1. ⚙️ System & Runtime Prerequisites
* **Node.js Environment:** `v18.18.0+` or `v20.x+ LTS` recommended.
* **Package Manager:** `npm` (v9+), `yarn` (v1.22+), or `pnpm` (v8+).
* **Target Browsers:** Modern evergreen browsers with WebRTC & Geolocation support:
  - Chrome / Chromium 90+ (Desktop & Mobile)
  - Mozilla Firefox 88+
  - Apple Safari 14.1+ (iOS & macOS)
  - Microsoft Edge 90+
* **Security Protocol Requirement:** **HTTPS** (or `localhost` in development) is strictly required by web standards to grant permissions for the **Camera API** (`getUserMedia`) and **Geolocation API** (`watchPosition`).

---

### 2. 📦 Core Frontend Dependencies (`package.json`)

#### Production Dependencies (`dependencies`):
| Package | Version | Purpose & Usage in ResQ-Grid |
| :--- | :--- | :--- |
| **`react`** | `^19.2.8` | Core component architecture, declarative UI state, lifecycle hooks (`useEffect`, `useState`, `useCallback`). |
| **`react-dom`** | `^19.2.8` | Virtual DOM rendering and browser mount bridge. |
| **`react-router-dom`** | `^7.18.3` | Client-side dynamic routing across `/`, `/citizen`, `/authority`, `/shelter`, `/authority/login`, `/shelter/auth`. |
| **`leaflet`** | `^1.9.4` | High-performance open-source Master GIS mapping engine. |
| **`react-leaflet`** | `^5.0.0` | React wrapper components (`MapContainer`, `TileLayer`, `Marker`, `Popup`, `Polygon`, `Circle`) for tactical maps. |
| **`leaflet.heat`** | `^0.2.0` | Dynamic Gaussian kernel density crisis heatmap rendering over Leaflet map canvas. |
| **`lucide-react`** | `^1.37.0` | High-clarity vector UI icons for incident types, triage badges, radar rings, and telemetry indicators. |
| **`tailwindcss`** | `^4.3.3` | High-speed atomic styling engine for tactical responsive dashboards and dark/light modes. |
| **`@tailwindcss/vite`** | `^4.3.3` | First-party Vite integration plugin for instant CSS JIT compilation. |

#### Development & Tooling Dependencies (`devDependencies`):
| Package | Version | Purpose |
| :--- | :--- | :--- |
| **`vite`** | `^8.2.2` | High-speed ESM-based frontend dev server and production bundler. |
| **`@vitejs/plugin-react`** | `^6.1.0` | Fast Refresh and JSX transformation support. |
| **`babel-plugin-react-compiler`** | `^1.0.0` | Advanced React compiler optimizations and memoization. |
| **`typescript`** | `~6.0.2` | Type-checking and modern JavaScript syntax support. |
| **`eslint` & plugins** | `^10.9.0` | Code quality enforcement and React Hooks linting rules. |

---

### 3. 🌐 Browser Hardware & Web APIs Required

ResQ-Grid utilizes advanced client-side web APIs to execute disaster triage and anti-spoof verification right in the browser:

1. **HTML5 Geolocation API (`navigator.geolocation`):**
   - Uses `watchPosition()` and `getCurrentPosition()` with `{ enableHighAccuracy: true, timeout: 8000 }`.
   - Continuously computes proximity to verified hazard zones and checks 150m geofence arrival at micro-havens.
2. **MediaDevices & WebRTC Camera API (`navigator.mediaDevices.getUserMedia`):**
   - Streams live video from device cameras (`facingMode: 'environment'` for incidents, `'user'` for officer selfies).
   - Prevents uploading outdated stock photos by sealing live frames on-site.
3. **HTML5 Canvas 2D API (`HTMLCanvasElement` & `CanvasRenderingContext2D`):**
   - Captures frame buffers from the live video stream.
   - Watermarks cryptographic SHA-256 signatures, GPS coordinates, compass headings, and timestamps onto the image before serialization.
4. **Device Sensors & Telemetry (`DeviceOrientationEvent` & `DeviceMotionEvent`):**
   - Collects hardware orientation (compass bearing, alpha/beta/gamma tilt) for sensor-lock verification.
5. **Navigator Online State (`navigator.onLine` & `window.ononline` / `window.onoffline`):**
   - Detects cellular/Wi-Fi connection dropouts and immediately expands the **Offline SMS / WhatsApp Gateway**.
6. **Web Storage API (`localStorage`):**
   - Persists officer authentication tokens, authority clearance states, and active shelter node identifiers.
7. **URI Communication Protocols:**
   - `sms:...`: Dispatches emergency SOS packets across 2G/GSM cellular networks without data connectivity.
   - `https://wa.me/...`: Pre-formats and transmits standardized incident syntax to emergency dispatcher WhatsApp desks.

---

### 4. 🛠️ Frontend Setup & Build Commands

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install all required dependencies
npm install

# 3. Start local development server (with Hot Module Replacement)
npm run dev

# 4. Compile optimized production build
npm run build

# 5. Preview production build locally
npm run preview

# 6. Run code quality and lint checks
npm run lint
```

---

## 🐍 Backend Requirements, Build & Start Commands

### 1. ⚙️ Backend System Prerequisites
* **Python Runtime:** `Python 3.10+` or `3.11+` / `3.12+`.
* **FastAPI Framework:** High-performance asynchronous REST API server.
* **Uvicorn Server:** ASGI production and development server.
* **Default Port:** `8000` (API endpoint: `http://localhost:8000`).

---

### 2. 📦 Backend Dependencies (`backend/requirements.txt`)
* `fastapi>=0.111.0` (Core REST API routing, request validation, dependencies)
* `uvicorn>=0.29.0` (High-speed ASGI web server)
* `pydantic>=2.7.0` & `pydantic-settings>=2.2.0` (Data models & schemas)
* `requests>=2.31.0` (Outbound webhook dispatching & test suite calls)
* `numpy>=1.26.0` (Spatial cluster math & matrix calculations)

---

### 3. 🚀 Backend Build & Installation Commands

```bash
# 1. Navigate to backend directory
cd backend

# 2. (Optional but recommended) Create and activate Python virtual environment
# On Windows (PowerShell / CMD):
python -m venv venv
.\venv\Scripts\activate

# On Linux / macOS:
python3 -m venv venv
source venv/bin/activate

# 3. Build / Install backend dependencies
pip install -r requirements.txt
```

---

### 4. ▶️ Backend Start Commands

#### 🔹 Development Mode (with Auto-Reload on Code Change):
```bash
# Run from within the backend directory:
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Or run using python module:
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 🔹 Production Mode (Multi-Worker High Concurrency):
```bash
# Production execution with 4 parallel worker processes:
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

### 5. 🧪 Backend Automated Test Suite Commands

```bash
# Run the complete 11-feature automated regression test suite:
python run_tests.py
```

---

## 🧭 Platform Overview & Architecture

ResQ-Grid bridges the critical gap between stranded citizens, localized community shelters, and emergency response command centers (OSDMA, NDRF, Fire & Rescue, Medical Corps).

```
                      ┌────────────────────────────────────────┐
                      │          ResQ-Grid Ecosystem           │
                      └──────────────────┬─────────────────────┘
                                         │
       ┌─────────────────────────────────┼─────────────────────────────────┐
       ▼                                 ▼                                 ▼
┌──────────────┐                 ┌──────────────┐                  ┌──────────────┐
│   CITIZEN    │                 │  AUTHORITY   │                  │   SHELTER    │
│    PORTAL    │                 │ COMMAND ROOM │                  │    PORTAL    │
└──────┬───────┘                 └──────┬───────┘                  └──────┬───────┘
       │                                │                                 │
       │ • Live Geo Hazard Status       │ • Master GIS Map & Triage       │ • Occupancy Capacity Meter
       │ • Cryptographic Report Transmit│ • Spatial Optimizer Solver      │ • Infrastructure Heartbeat
       │ • Anti-Spoof Live Sensor Locks │ • Anti-Spoof Verification Hub   │ • Threat Distance Radar
       │ • Multi-Tier Safe Routing      │ • Shelter Network Operations    │ • Emergency Panic Closure
       │ • Micro-Haven Geofence Ping    │ • Audit Log & Team Telemetry    │ • Crowdsourced Micro-Havens
       │ • Offline SMS / WhatsApp Mod   │ • 1-Click Dispatch Automation   │ • GPS Location Presets
       └────────────────────────────────┴─────────────────────────────────┘
```

---

## 👥 System Roles & Core Uses

### 1. 🟢 Citizen (Public & Victims)
* **Target Users:** Residents in crisis zones, evacuated persons, volunteer community spotters.
* **Core Purpose:** Real-time situational awareness, 1-tap emergency reporting with cryptographic anti-spoof evidence, finding safe refuge routes away from hazard zones, and checking into micro-havens.
* **Key Capabilities:**
  - Automatic geolocation detection & hazard zone proximity alert.
  - Multi-Tier safe refuge solver (Tier 1 Government Shelters, Tier 2 Micro-Havens, Tier 3 High Ground Points).
  - Offline reporting via fallback SMS & WhatsApp gateways when data networks fail.

### 2. 🔴 Authority (Disaster Commanders, NDRF, OSDMA, First Responders)
* **Target Users:** District Incident Commanders, Search & Rescue teams, Fire & Medical chiefs, Triage officers.
* **Core Purpose:** Central tactical command room for verifying reports, deploying rescue units, analyzing crisis heatmaps, resolving spatial routing matrices, and managing audit logs.
* **Key Capabilities:**
  - Unified GIS Tactical Map with dynamic crisis heatmaps and cluster elevation.
  - Media & Sensor Verification Hub for inspecting hardware sensor locks and telecommunication handshakes.
  - Spatial Optimizer solver pairing closest rescue units and available shelters with victims.
  - 24-hour blacklisting of malicious/adversarial spoofers.

### 3. 🟡 Shelter Manager (Relief Camps & Micro-Haven Leads)
* **Target Users:** Municipal camp managers, school principals, community hall heads, volunteer roof hosts.
* **Core Purpose:** Live telemetry reporting on bed capacity, infrastructure status (potable water, electrical grid, medical kits), and local danger perimeter radar.
* **Key Capabilities:**
  - Real-time Capacity Meter with increment/decrement steppers.
  - Heartbeat pulse transmitting vitality state to central command.
  - Emergency Panic Closure toggle to immediately divert evacuees if the refuge is compromised.
  - Micro-Haven registration for unlisted localized rooftops and safe community halls.

---

## 🔘 Comprehensive Button & Interaction Guide

### 📍 1. Role Selection & Landing Page (`/`)

| Button / Control | Location | What Happens When Clicked |
| :--- | :--- | :--- |
| **ResQ-Grid Brand Logo / Link** | Top Navigation | Resets to Home / Role Selection overview. |
| **Citizen Portal Card (`Continue →`)** | Center Grid (Route 01) | Routes user directly to the `/citizen` safety console. No login required for immediate public access. |
| **Authority Command Room Card (`Continue →`)** | Center Grid (Route 02) | Routes user to `/authority/login`. Enforces officer credentials or registration before granting access to `/authority`. |
| **Shelter Management Card (`Continue →`)** | Center Grid (Route 03) | Routes user to `/shelter/auth`. Prompts shelter manager login or registration before entering `/shelter`. |

---

### 📍 2. Citizen Safety Portal (`/citizen`)

| Button / Control | Section | Action & Underlying Logic |
| :--- | :--- | :--- |
| **`← Back to role select`** | Top Bar | Returns user to the main landing page. |
| **`Calculate Route`** | Safe Refuge & Routing | Executes `computeAllocation()` against active GPS coordinates and victim count. Calculates distance, avoids verified hazard polygons, determines whether Tier 1, 2, or 3 path is optimal, and displays nearest shelter/resource ETA. |
| **Hazard Type Selector Buttons** (`🌊 Flood`, `🔥 Fire`, `⚡ Power Outage`, `🏥 Medical`, `🏚️ Trapped / Structural Collapse`, `🌀 Cyclone / High Wind`) | Transmit Emergency Report | Sets active hazard classification for the report. Highlights selected type in orange. |
| **Victim Counter (`-` and `+`)** | Transmit Emergency Report | Adjusts victim count between 1 and 99 so rescue units can size extraction vehicles appropriately. |
| **`Take Live Incident Photo`** | Hardware Sensor Capture | Launches device camera feed with hardware sensor telemetry overlay (accelerometer, compass bearing, cellular handshake). |
| **`Upload Photo from Gallery`** | Hardware Sensor Capture | Allows selecting an image file from the device storage. |
| **`Capture Sealed Evidence`** | Camera Modal | Freezes camera frame, stamps cryptographic timestamp & sensor banner onto canvas, generates high-res data URL, and passes to form state. |
| **`Remove / Retake Photo` (`✕`)** | Photo Preview | Discards current photo and resets camera capture state. |
| **`Transmit Emergency Report`** | Form Submit | Validates form data, generates device telemetry payload, and calls `submitReport()`. Shows animated progress, displays green consensus confirmation toast, and resets fields after 5s. |
| **`I'm Here (Check In)`** | Community Micro-Havens | Calls `pingMicroHavenArrival(havenId, activeCoords)`. Verifies if user is within 150m geofence. Increments arrival counter; upon reaching threshold, automatically promotes haven to `ACTIVE` status! |
| **`Send via WhatsApp`** | Offline Gateway Drawer | Encodes victim report data into a standardized syntax and opens `https://wa.me/?text=...` to send directly to emergency dispatchers without requiring app backend connectivity. |
| **`Send via SMS`** | Offline Gateway Drawer | Encodes report into emergency SMS format and invokes native `sms:...` application for transmission over 2G/GSM cellular networks. |
| **`Toggle Offline Gateway`** | Bottom Drawer | Manually expands or collapses the offline SMS/WhatsApp transmission instructions. |

---

### 📍 3. Authority Command Room (`/authority`)

#### Top Navigation Bar:
| Button / Control | Action & Underlying Logic |
| :--- | :--- |
| **`Live Map & Triage` Tab** | Switches active workspace to the interactive Leaflet Master GIS map and live incident triage feed. |
| **`Spatial Optimizer` Tab** | Opens the automated resource allocation solver and dispatch recommendation matrix. |
| **`Verification Queue` Tab** (with dynamic badge) | Opens the Adversarial-Proof Media & Report Verification hub showing pending review count. |
| **`Shelter Network` Tab** | Opens the district shelter capacity grid, infrastructure monitor, and registration controls. |
| **`Audit & Telemetry` Tab** | Displays real-time cryptographic audit trail, field team telemetry, and carrier handshake logs. |
| **`Heatmap ACTIVE / OFF`** | Toggles dynamic Gaussian kernel density heatmap layer displaying crisis intensity across the district. |
| **Sync Icon (`RefreshCw`)** | Triggers an immediate force-fetch of reports, shelters, clusters, and operational telemetry. |
| **`Log out`** | Terminates officer session, clears token from `localStorage`, and navigates to the login screen. |

#### Live Map & Triage Workspace:
| Button / Control | Location | Action & Underlying Logic |
| :--- | :--- | :--- |
| **Map Markers (Red/Orange/Green/Blue Pins)** | Master Map | Centers map view on selected incident, shelter, or rescue unit. Opens popup with quick metrics. |
| **Filter Buttons (`All`, `Pending`, `Verified`, `High Risk`)** | Triage Sidebar | Filters the triage feed by status or risk severity score (calculated via AI + consensus + victim count). |
| **Incident Card Click** | Triage Sidebar | Selects incident and opens the deep `IncidentDetailModal` with full evidence inspection. |
| **`Quick Verify` (`✓`)** | Triage Card | Immediately marks incident as `VERIFIED`, assigns trust score 95+, and includes it in safe routing hazard avoidance calculations. |
| **`Quick Reject` (`✕`)** | Triage Card | Marks incident as `REJECTED`, reducing trust score and suppressing public warnings. |
| **`Dispatch Rescue Unit`** | Incident Detail Modal | Allocates selected rescue unit (Boat, NDRF, Ambulance) to the incident coordinates and updates ETA. |

#### Spatial Optimizer Workspace:
| Button / Control | Action & Underlying Logic |
| :--- | :--- |
| **`1-Click Batch Dispatch (N Units)`** | Dispatches all suggested rescue vehicle pairings simultaneously to their optimal crisis zones and routes victims to open shelters with matching capacity. |
| **`Re-compute Optimization Matrix`** | Re-runs the spatial distance algorithm against current verified reports, shelter occupancy, and vehicle coordinates. |

#### Verification Queue Workspace:
| Button / Control | Action & Underlying Logic |
| :--- | :--- |
| **Category Filter (`All`, `Incidents`, `Shelters`, `Officer IDs`)** | Filters verification cards by entity type. |
| **Channel Filter (`All`, `App`, `SMS`, `WhatsApp`)** | Filters queue by incoming communication pipeline. |
| **`Batch Approve Verified`** | Automatically approves all pending items that possess an automated AI/Sensor trust score $\ge 85\%$ without spoof flags. |
| **Image Thumbnail Click** | Opens high-resolution modal with zoom, cellular tower handshake details, and cryptographic SHA-256 fingerprint. |
| **`Approve` (`ShieldCheck`)** | Verifies entity (Report, Shelter, or Officer ID). |
| **`Reject` (`XCircle`)** | Rejects submission and marks status as unverified/false alarm. |
| **`24h Blacklist` (`Ban`)** | Prompts confirmation and places reporter's device ID and phone number on a 24-hour temporary blacklist to prevent spam attacks. |

#### Shelter Network & Audit Workspace:
| Button / Control | Action & Underlying Logic |
| :--- | :--- |
| **`Approve Facility`** | Approves newly registered shelter node and integrates it into district evacuation routing. |
| **`Emergency Evacuate`** | Marks shelter as compromised, triggers panic state, and reroutes arriving citizens elsewhere. |
| **`Export Audit Log (JSON)`** | Downloads immutable disaster event logs for post-incident audit and government reviews. |

---

### 📍 4. Shelter Management Portal (`/shelter`)

| Button / Control | Section | Action & Underlying Logic |
| :--- | :--- | :--- |
| **`← Back to role select`** | Top Bar | Returns manager to the main landing page. |
| **`Use Current Device GPS`** | Location Picker | Uses browser geolocation API to lock exact facility coordinates with high accuracy. |
| **`Enter Exact Lat / Lng`** | Location Picker | Toggles manual coordinate inputs for precise manual pinning. |
| **District Sector Preset Buttons** | Location Picker | Instantly pins coordinates to known municipal zones (e.g. Master Canteen Hub, Kalinga Stadium Complex, AIIMS Medical Sector). |
| **`Attach Facility Verification Photo`** | Registration Form | Captures or uploads photo proof of the refuge building. |
| **`Submit Facility for Authority Approval`** | Registration Form | Registers shelter in the database and queues it for Incident Commander sign-off. |
| **`Switch Facility`** | Active Facility Header | Clears current active shelter selection and returns to facility selector grid. |
| **`Set Location`** | Active Facility Header | Expands GPS coordinates editor to update shelter location. |
| **Occupancy Slider & Steppers (`-10`, `-1`, `+1`, `+10`)** | Capacity Meter | Adjusts real-time count of sheltered persons. Broadcasts live occupancy percentage and color state (Green $\to$ Amber $\to$ Red Full). |
| **Water Status (`NORMAL`, `LOW`, `CRITICAL`)** | Heartbeat Panel | Updates drinking water supply status in command center database. |
| **Power Status (`GRID`, `GENERATOR`, `OFFLINE`)** | Heartbeat Panel | Updates electrical infrastructure status. |
| **Medical Status (`ADEQUATE`, `LOW_SUPPLIES`, `DOCTOR_NEEDED`)** | Heartbeat Panel | Alerts command if medical staff or emergency drugs are urgently required. |
| **`Send Heartbeat Pulse`** | Heartbeat Panel | Transmits vitality timestamp to command room to verify that shelter comms are alive. |
| **`ACTIVATE EMERGENCY CLOSURE`** | Panic Toggle | Locks facility, flags shelter as CLOSED on public routing maps, and triggers warning alerts in authority command room. |
| **`REOPEN SHELTER`** | Panic Toggle | Reverses emergency closure and restores shelter availability for evacuees. |
| **`Register Micro-Haven`** | Micro-Haven Form | Adds a localized temporary haven (rooftop, community room) with capacity and notes. |

---

### 📍 5. Authentication & Officer Clearance (`/authority/auth` & `/shelter/auth`)

| Button / Control | Action & Underlying Logic |
| :--- | :--- |
| **`Sign In / Register Toggle`** | Toggles between existing account login and new certified officer/shelter registration. |
| **`Capture Live ID`** | Launches camera modal to capture official badge/credential with cryptographic timestamp overlay. |
| **`Take Live Selfie`** | Launches camera modal to capture biometric facial proof of the registering officer. |
| **`Upload File / Selfie`** | Fallback file selection from local device. |
| **`Create Verified Officer Account` / `Sign In`** | Submits credentials, performs password hashing & authority verification code validation, sets secure session, and routes to respective dashboard. |

---

## 🔒 Security, Trust & Anti-Spoofing Architecture

1. **Cell Tower & RF Gateway Verification:** Cross-references device GPS coordinates with carrier tower ID handshakes. Inconsistencies $>5\text{ km}$ trigger an automated `SPOOF DETECTED` flag.
2. **Hardware Sensor Locks:** Gathers compass bearing, accelerometer tilt, and device uptime to ensure images are captured live rather than spoofed from old web files.
3. **Consensus Mesh Engine:** Clustered reports in spatial-temporal proximity ($\le 500\text{m}$, within 15 minutes) automatically elevate priority scores.
4. **Temporary 24h Blacklist:** Rogue devices submitting fabricated distress calls can be blacklisted with 1 click to keep rescue channels clear.

---

*ResQ-Grid Platform — Engineering Resilience for Critical Situations.*
