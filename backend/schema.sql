CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS citizens (
    citizen_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    last_known_location GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS authority_contacts (
    contact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_name VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    is_sms_gateway_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS imd_alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    severity VARCHAR(20) NOT NULL, -- 'RED', 'ORANGE', 'YELLOW'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    affected_area GEOMETRY(Polygon, 4326),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS incidents (
    incident_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,
    victim_count INT DEFAULT 1,
    description TEXT,
    location GEOMETRY(Point, 4326) NOT NULL,
    cell_lac_id VARCHAR(50),
    client_ip INET NOT NULL,
    verification_status VARCHAR(30) DEFAULT 'PENDING',
    trust_score INT DEFAULT 50,
    media_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_incidents_spatial ON incidents USING GIST (location);

CREATE TABLE IF NOT EXISTS shelters (
    shelter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    tier_level INT DEFAULT 1,
    location GEOMETRY(Point, 4326) NOT NULL,
    capacity INT NOT NULL,
    occupancy INT DEFAULT 0,
    water_status VARCHAR(20) DEFAULT 'NORMAL',
    power_status VARCHAR(20) DEFAULT 'GRID',
    approval_status VARCHAR(30) DEFAULT 'PENDING_APPROVAL',
    is_open BOOLEAN DEFAULT FALSE,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_shelters_spatial ON shelters USING GIST (location);

INSERT INTO authority_contacts (agency_name, district, phone_number, is_sms_gateway_active)
VALUES
    ('National Disaster Response Force (NDRF)', 'Statewide / Bhubaneswar', '1078', TRUE),
    ('Odisha Disaster Rapid Action Force (ODRAF)', 'Khordha / Cuttack', '1070', TRUE),
    ('Fire & Emergency Rescue Control', 'Bhubaneswar Central', '101', TRUE),
    ('State Emergency Operations Center (SEOC)', 'Odisha Disaster Command', '1077', TRUE),
    ('District Emergency Operations Center (DEOC)', 'Khordha District', '+916742540112', TRUE),
    ('Emergency Ambulance Medical Response', 'District Health Command', '108', FALSE),
    ('Police Emergency Distress Line', 'Commissioner of Police', '112', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO imd_alerts (severity, title, description, affected_area, expires_at)
VALUES
    (
        'RED',
        'IMD Flash Flood & Inundation Warning',
        'Extremely heavy rainfall (200mm+) expected in low-lying coastal and drainage sectors. High risk of localized urban flash flooding and power outage.',
        ST_GeomFromText('POLYGON((85.8000 20.2700, 85.8500 20.2700, 85.8500 20.3200, 85.8000 20.3200, 85.8000 20.2700))', 4326),
        CURRENT_TIMESTAMP + INTERVAL '24 hours'
    ),
    (
        'ORANGE',
        'IMD Severe Thunderstorm & Gale Wind Advisory',
        'Squally winds reaching 65-75 kmph accompanied by lightning strikes across Bhubaneswar-Cuttack urban corridor. Avoid sheltering under trees or dilapidated roofs.',
        ST_GeomFromText('POLYGON((85.7500 20.2500, 85.9000 20.2500, 85.9000 20.3500, 85.7500 20.3500, 85.7500 20.2500))', 4326),
        CURRENT_TIMESTAMP + INTERVAL '12 hours'
    )
ON CONFLICT DO NOTHING;
