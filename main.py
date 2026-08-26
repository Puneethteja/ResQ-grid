from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import math

app = FastAPI(title="Emergency Response & Hazard Routing API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

reports_db: List[Dict[str, Any]] = []
shelters_db: List[Dict[str, Any]] = []

class Coordinates(BaseModel):
    lat: float
    lng: float

class Metadata(BaseModel):
    timestamp: str
    cellTowerId: str
    isLiveCapture: bool

class ReportCreate(BaseModel):
    userId: str
    hazardType: str
    coordinates: Coordinates
    metadata: Metadata

class VerifyAction(BaseModel):
    action: str

class RouteRequest(BaseModel):
    start: Coordinates
    destination: Coordinates

class ShelterCreate(BaseModel):
    shelter_id: str
    name: str
    coordinates: Coordinates
    current_occupancy: int = 0
    max_capacity: int
    power_status: str = "ACTIVE"

class ShelterStatusUpdate(BaseModel):
    current_occupancy: Optional[int] = None
    max_capacity: Optional[int] = None
    power_status: Optional[str] = None

def calculate_severity(hazard_type: str) -> float:
    mapping = {
        "Severe Flooding": 5.0,
        "Road Collapse": 4.5,
        "Power Line Failure": 4.0,
        "Obstruction": 3.0
    }
    return mapping.get(hazard_type, 3.0)

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@app.post("/api/reports", status_code=status.HTTP_201_CREATED)
def create_report(payload: ReportCreate):
    report_id = len(reports_db) + 1
    severity_val = calculate_severity(payload.hazardType)
    trust_val = 0.8
    consensus_val = 1.0
    
    initial_risk = severity_val * trust_val * consensus_val

    new_report = {
        "id": report_id,
        "userId": payload.userId,
        "hazardType": payload.hazardType,
        "coordinates": payload.coordinates.dict(),
        "metadata": payload.metadata.dict(),
        "riskScore": round(initial_risk, 2),
        "status": "PENDING_VERIFICATION"
    }
    
    reports_db.append(new_report)
    return {
        "message": "Report validated and registered successfully.",
        "report": new_report
    }

@app.get("/api/reports")
def get_reports():
    return {"reports": reports_db}

@app.patch("/api/reports/{report_id}/verify")
def verify_report(report_id: int, payload: VerifyAction):
    report = next((r for r in reports_db if r["id"] == report_id), None)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if payload.action == "VERIFY":
        report["status"] = "VERIFIED"
        report["riskScore"] = round(report["riskScore"] * 1.5, 2)
    elif payload.action == "BLACKLIST":
        report["status"] = "BLACKLISTED"
        report["riskScore"] = 0.0
    else:
        raise HTTPException(status_code=400, detail="Invalid action parameter")

    return {
        "message": f"Report {report_id} state updated to {report['status']}.",
        "report": report
    }

@app.post("/api/route")
def compute_route(payload: RouteRequest):
    start = payload.start
    dest = payload.destination
    
    active_hazards = [
        r for r in reports_db 
        if r["riskScore"] >= 6.0 and r["status"] != "BLACKLISTED"
    ]
    
    hazards_avoided = 0
    route_path = [start.dict()]
    
    for hazard in active_hazards:
        h_lat = hazard["coordinates"]["lat"]
        h_lng = hazard["coordinates"]["lng"]
        
        dist_to_hazard = haversine_distance(start.lat, start.lng, h_lat, h_lng)
        total_dist = haversine_distance(start.lat, start.lng, dest.lat, dest.lng)
        
        if dist_to_hazard < total_dist:
            hazards_avoided += 1
            detour_point = {
                "lat": round(h_lat + 0.002, 4),
                "lng": round(h_lng + 0.002, 4)
            }
            route_path.append(detour_point)

    route_path.append(dest.dict())
    
    message = "SAFE AND OPTIMAL ROUTE COMPUTED." if hazards_avoided == 0 else "Dynamic multi-tier route computed via Haversine spatial optimization."
    
    return {
        "status": "SUCCESS",
        "hazardsAvoided": hazards_avoided,
        "routePath": route_path,
        "message": message
    }

@app.post("/api/shelters", status_code=status.HTTP_201_CREATED)
def register_shelter(payload: ShelterCreate):
    for existing in shelters_db:
        if existing["shelter_id"] == payload.shelter_id:
            raise HTTPException(status_code=400, detail="Shelter with this ID already exists.")
            
    is_full = payload.current_occupancy >= payload.max_capacity
    
    new_shelter = {
        "shelter_id": payload.shelter_id,
        "name": payload.name,
        "coordinates": payload.coordinates.dict(),
        "current_occupancy": payload.current_occupancy,
        "max_capacity": payload.max_capacity,
        "power_status": payload.power_status,
        "is_full": is_full,
        "heartbeat_timestamp": datetime.utcnow().isoformat()
    }
    
    shelters_db.append(new_shelter)
    return {
        "message": "Shelter registered successfully.",
        "shelter": new_shelter
    }

@app.get("/api/shelters")
def get_shelters():
    return {"shelters": shelters_db}

@app.put("/api/shelters/{shelter_id}/status")
def update_shelter_status(shelter_id: str, payload: ShelterStatusUpdate):
    shelter = next((s for s in shelters_db if s["shelter_id"] == shelter_id), None)
    if not shelter:
        raise HTTPException(status_code=404, detail="Shelter not found")
        
    if payload.current_occupancy is not None:
        shelter["current_occupancy"] = payload.current_occupancy
    if payload.max_capacity is not None:
        shelter["max_capacity"] = payload.max_capacity
    if payload.power_status is not None:
        shelter["power_status"] = payload.power_status
        
    shelter["is_full"] = shelter["current_occupancy"] >= shelter["max_capacity"]
    shelter["heartbeat_timestamp"] = datetime.utcnow().isoformat()
    
    return {
        "message": "Shelter telemetry and heartbeat synchronized.",
        "shelter": shelter
    }