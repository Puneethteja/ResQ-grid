import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polygon, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Crosshair, Maximize2, Layers, AlertTriangle, ShieldCheck, Home } from 'lucide-react'
import HeatmapLayer from './HeatmapLayer.jsx'
const trustColor = (score) => (score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444')
function reportIcon(report) {
  const isSpoofed = report.verification?.isSpoofed
  const color = isSpoofed ? '#DC2626' : report.trustStatus === 'BLACKLISTED' ? '#64748B' : trustColor(report.trustScore ?? 50)
  return L.divIcon({
    className: 'custom-leaflet-pin',
    html: `
      <div style="
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: ${color};
        border: 2.5px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        ${isSpoofed ? 'animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;' : ''}
      ">
        <div style="width: 5px; height: 5px; border-radius: 50%; background: white;"></div>
      </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}
const tier1ShelterIcon = L.divIcon({
  className: 'custom-leaflet-shelter',
  html: `
    <div style="
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: #064E3B;
      border: 2px solid #34D399;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #34D399;
      font-family: ui-monospace, monospace;
      font-size: 11px;
      font-weight: 800;
      box-shadow: 0 3px 8px rgba(0,0,0,0.5);
    ">
      S1
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})
const tier2HavenIcon = L.divIcon({
  className: 'custom-leaflet-haven',
  html: `
    <div style="
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: #1E3A8A;
      border: 2px solid #60A5FA;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #60A5FA;
      font-family: ui-monospace, monospace;
      font-size: 11px;
      font-weight: 800;
      box-shadow: 0 3px 8px rgba(0,0,0,0.5);
    ">
      H2
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})
function teamIcon(resource) {
  const isAvail = resource.available
  const color = isAvail ? '#38BDF8' : '#F59E0B'
  const symbol = resource.kind === 'BOAT' ? '🚤' : resource.kind === 'MEDICAL' ? '🚑' : resource.kind === 'DRONE' ? '🛸' : '🚛'
  return L.divIcon({
    className: 'custom-leaflet-team',
    html: `
      <div style="
        width: 30px;
        height: 30px;
        border-radius: 10px;
        background: #0F172A;
        border: 2px solid ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.6);
      ">
        ${symbol}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}
function MapController({ selectedCoords, recenterTrigger, onMapReady }) {
  const map = useMap()
  useEffect(() => {
    if (onMapReady) onMapReady(map)
    const t = setTimeout(() => {
      map.invalidateSize()
    }, 150)
    let observer = null
    const container = map.getContainer()
    if (container && window.ResizeObserver) {
      observer = new ResizeObserver(() => {
        map.invalidateSize()
      })
      observer.observe(container)
    }
    return () => {
      clearTimeout(t)
      if (observer) observer.disconnect()
    }
  }, [map, onMapReady])
  useEffect(() => {
    if (selectedCoords?.lat && selectedCoords?.lng) {
      map.flyTo([selectedCoords.lat, selectedCoords.lng], 15, { duration: 1.2 })
    }
  }, [selectedCoords, map])
  useEffect(() => {
    if (recenterTrigger) {
      map.flyTo(recenterTrigger.center, recenterTrigger.zoom || 13, { duration: 1.0 })
    }
  }, [recenterTrigger, map])
  return null
}
export default function MasterMap({
  reports = [],
  shelters = [],
  resources = [],
  hazardZones = [],
  clusters = [],
  center = [20.2961, 85.8245],
  showHeatmap = true,
  selectedId = null,
  onSelectReport,
}) {
  const mapRef = useRef(null)
  const [recenterTrigger, setRecenterTrigger] = useState(null)
  const [activeFilter, setActiveFilter] = useState('ALL') 
  const [mapHeatmapActive, setMapHeatmapActive] = useState(showHeatmap)
  useEffect(() => {
    setMapHeatmapActive(showHeatmap)
  }, [showHeatmap])
  const selectedReport = reports.find((r) => r.id === selectedId)
  const selectedCoords = selectedReport?.coordinates
  const dynamicHeatPoints = (reports || [])
    .filter((r) => r.coordinates && r.trustStatus !== 'BLACKLISTED' && r.trustStatus !== 'REJECTED')
    .map((r) => ({
      lat: Number(r.coordinates.lat),
      lng: Number(r.coordinates.lng),
      weight: Math.max(0.4, (r.trustScore ?? 60) / 100),
      hazardType: r.hazardType,
      victimCount: r.victimCount || 1,
    }))
  const clusterHeatPoints = (clusters || [])
    .filter((c) => c.coordinates)
    .map((c) => ({
      lat: Number(c.coordinates.lat),
      lng: Number(c.coordinates.lng),
      weight: Math.min(1.0, 0.6 + (c.reportCount || 1) * 0.1),
      hazardType: `${c.hazardType || 'Crisis Cluster'} (${c.reportCount || 2} reports)`,
      victimCount: c.totalVictims || 3,
    }))
  const baselineHotspots = [
    { lat: 20.2961, lng: 85.8245, weight: 0.85, hazardType: 'Master Canteen Inundation Hub', victimCount: 4 },
    { lat: 20.3010, lng: 85.8380, weight: 0.70, hazardType: 'Rasulgarh Flash Flood Zone', victimCount: 2 },
    { lat: 20.3550, lng: 85.8150, weight: 0.65, hazardType: 'Patia Drainage Overflow', victimCount: 1 },
    { lat: 20.2720, lng: 85.8450, weight: 0.75, hazardType: 'Old Town Waterlogging', victimCount: 3 },
  ]
  const heatPoints =
    dynamicHeatPoints.length + clusterHeatPoints.length > 0
      ? [...dynamicHeatPoints, ...clusterHeatPoints]
      : baselineHotspots
  function handleResetView() {
    setRecenterTrigger({ center, zoom: 13, timestamp: Date.now() })
  }
  function handleFitAll() {
    if (!mapRef.current) return
    const allCoords = []
    reports.forEach((r) => r.coordinates && allCoords.push([r.coordinates.lat, r.coordinates.lng]))
    shelters.forEach((s) => s.coordinates && allCoords.push([s.coordinates.lat, s.coordinates.lng]))
    resources.forEach((res) => res.coordinates && allCoords.push([res.coordinates.lat, res.coordinates.lng]))
    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords)
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    } else {
      handleResetView()
    }
  }
  return (
    <div className="relative h-full w-full map-shell overflow-hidden select-none">
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap items-center gap-2">
        <button
          onClick={handleResetView}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-white shadow-lg backdrop-blur-md transition-all hover:bg-slate-700/90 active:scale-95 cursor-pointer"
          style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.15)' }}
          title="Recenter to Command Headquarters"
        >
          <Crosshair size={13} className="text-amber-400" />
          <span>Recenter HQ</span>
        </button>
        <button
          onClick={handleFitAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-white shadow-lg backdrop-blur-md transition-all hover:bg-slate-700/90 active:scale-95 cursor-pointer"
          style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.15)' }}
          title="Fit bounds to all active units & hazards"
        >
          <Maximize2 size={13} className="text-emerald-400" />
          <span>Fit Bounds</span>
        </button>
        <button
          onClick={() => setMapHeatmapActive((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-white shadow-lg backdrop-blur-md transition-all hover:opacity-90 active:scale-95 cursor-pointer"
          style={{
            background: mapHeatmapActive ? 'rgba(220, 38, 38, 0.85)' : 'rgba(15, 23, 42, 0.85)',
            border: mapHeatmapActive ? '1px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.15)',
          }}
          title="Toggle Thermal Crisis Heatmap Layer"
        >
          <Layers size={13} className={mapHeatmapActive ? 'text-white' : 'text-slate-400'} />
          <span>Heatmap: {mapHeatmapActive ? 'ON' : 'OFF'}</span>
        </button>
        <div
          className="flex items-center rounded-lg p-0.5 backdrop-blur-md"
          style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.15)' }}
        >
          {[
            ['ALL', 'All'],
            ['INCIDENTS', `Hazards (${reports.length})`],
            ['SHELTERS', `Shelters (${shelters.length})`],
            ['TEAMS', `Units (${resources.length})`],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className="px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors"
              style={{
                background: activeFilter === key ? 'var(--signal, #C65B3C)' : 'transparent',
                color: activeFilter === key ? 'white' : '#94A3B8',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div
        className="absolute bottom-4 left-4 z-[1000] p-2.5 rounded-xl text-[11px] font-mono shadow-2xl backdrop-blur-md space-y-1.5 pointer-events-none sm:pointer-events-auto"
        style={{ background: 'rgba(15, 23, 42, 0.88)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#E2E8F0' }}
      >
        <div className="font-bold text-[10px] text-slate-400 tracking-wider uppercase flex items-center justify-between gap-4">
          <span>Live Tactical Grid</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> ONLINE
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></span>
            <span>High Trust (&ge;80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white"></span>
            <span>Review (50-79%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-950 border border-emerald-400 text-emerald-400 font-bold text-[9px] flex items-center justify-center">S1</span>
            <span>Tier 1 Shelter</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-blue-950 border border-blue-400 text-blue-400 font-bold text-[9px] flex items-center justify-center">H2</span>
            <span>Tier 2 Haven</span>
          </div>
        </div>
      </div>
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        dragging={true}
        doubleClickZoom={true}
        touchZoom={true}
        zoomControl={false}
        attributionControl={false}
        className="h-full w-full cursor-grab active:cursor-grabbing"
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution=""
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController
          selectedCoords={selectedCoords}
          recenterTrigger={recenterTrigger}
          onMapReady={(map) => { mapRef.current = map }}
        />
        {mapHeatmapActive && <HeatmapLayer points={heatPoints} visible={mapHeatmapActive} />}
        {(hazardZones || []).map((zone) => (
          <Polygon
            key={zone.id}
            positions={zone.polygon}
            pathOptions={{
              color: zone.isCluster ? '#F59E0B' : '#DC2626',
              fillColor: zone.isCluster ? '#F59E0B' : '#DC2626',
              fillOpacity: zone.isCluster ? 0.28 : 0.20,
              weight: zone.isCluster ? 2.5 : 1.8,
              dashArray: zone.isCluster ? '6, 6' : undefined,
            }}
          >
            <Popup>
              <div className="font-mono text-xs space-y-1 p-1">
                <div className="font-bold text-slate-900">{zone.label || 'Active hazard zone'}</div>
                {zone.isCluster && (
                  <div className="text-amber-700 font-semibold text-[11px]">
                    ⭐ Multi-Source Peer-Mesh Consensus Verified
                  </div>
                )}
              </div>
            </Popup>
          </Polygon>
        ))}
        {(activeFilter === 'ALL' || activeFilter === 'SHELTERS') &&
          (shelters || [])
            .filter((s) => s.coordinates?.lat != null && s.coordinates?.lng != null)
            .map((s) => {
              const isTier1 = (s.tier ?? 1) === 1
              return (
                <Marker
                  key={s.id ?? s.shelterId}
                  position={[s.coordinates.lat, s.coordinates.lng]}
                  icon={isTier1 ? tier1ShelterIcon : tier2HavenIcon}
                >
                  <Popup>
                    <div className="font-mono text-xs space-y-1.5 p-1 min-w-[200px]">
                      <div className="font-bold text-slate-950 text-sm border-b pb-1">
                        {s.name || s.shelterId}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-700">
                        {isTier1 ? 'Tier 1 Municipal Shelter' : 'Tier 2 Crowdsourced Micro-Haven'} · {s.verificationStatus || 'REGISTERED'}
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Capacity:</span>
                        <span className="font-bold text-slate-900">{s.currentOccupancy} / {s.maxCapacity} Evacuees</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Infrastructure:</span>
                        <span className="text-emerald-700 font-bold">{s.powerStatus} Power / {s.waterStatus} Water</span>
                      </div>
                      {s.arrivalCount > 0 && (
                        <div className="text-blue-700 font-bold text-[11px] bg-blue-50 p-1 rounded">
                          👥 {s.arrivalCount} Verified Citizen Arrivals
                        </div>
                      )}
                      {s.verificationPhoto && (
                        <img
                          src={s.verificationPhoto}
                          alt={`${s.name || 'Shelter'} verification`}
                          style={{ width: '100%', maxHeight: 110, objectFit: 'cover', marginTop: 4, borderRadius: 6 }}
                        />
                      )}
                    </div>
                  </Popup>
                </Marker>
              )
            })}
        {(activeFilter === 'ALL' || activeFilter === 'TEAMS') &&
          (resources || [])
            .filter((r) => r.coordinates?.lat != null && r.coordinates?.lng != null)
            .map((res) => (
              <Marker
                key={res.id}
                position={[res.coordinates.lat, res.coordinates.lng]}
                icon={teamIcon(res)}
              >
                <Popup>
                  <div className="font-mono text-xs space-y-1.5 p-1 min-w-[210px]">
                    <div className="flex items-center justify-between border-b pb-1">
                      <span className="font-bold text-slate-950 text-sm">{res.name}</span>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white"
                        style={{ background: res.available ? '#10B981' : '#F59E0B' }}
                      >
                        {res.available ? 'STANDBY' : 'DEPLOYED'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-700">
                      <span>Type:</span>
                      <span className="font-bold text-slate-900">{res.kind}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-700">
                      <span>Capacity / Speed:</span>
                      <span className="font-bold text-slate-900">{res.capacity} evacuees · {res.speedKmh} km/h</span>
                    </div>
                    {res.assignedReportId && (
                      <div className="text-[10px] bg-amber-50 text-amber-800 p-1 rounded font-bold">
                        🚨 Deployed to Incident #{res.assignedReportId}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
        {(activeFilter === 'ALL' || activeFilter === 'INCIDENTS') &&
          (reports || []).map((r) =>
            r.coordinates ? (
              <Marker
                key={r.id}
                position={[r.coordinates.lat, r.coordinates.lng]}
                icon={reportIcon(r)}
              >
                <Popup>
                  <div className="font-mono text-xs space-y-1.5 p-1 min-w-[230px]">
                    <div className="flex items-center justify-between border-b pb-1">
                      <span className="font-bold text-slate-950 text-sm">{r.hazardType}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                        #{r.id}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Trust Score:</span>
                      <span
                        className="font-bold px-1.5 py-0.2 rounded text-white text-[10px]"
                        style={{ background: trustColor(r.trustScore ?? 50) }}
                      >
                        {r.trustScore ?? '—'}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Victims:</span>
                      <span className="font-bold text-red-600">{r.victimCount || 1} citizens affected</span>
                    </div>
                    <div className="text-[11px] text-slate-600 line-clamp-2">
                      {r.description || 'No description provided.'}
                    </div>
                    {r.clusterConsensus && (
                      <div className="text-[10px] text-amber-800 bg-amber-50 p-1 rounded font-semibold">
                        Consensus: {r.clusterConsensus.level} ({r.clusterConsensus.uniqueDevices} devices)
                      </div>
                    )}
                    {r.verification?.isSpoofed && (
                      <div className="text-red-700 bg-red-100 p-1 rounded font-bold text-[10px]">
                        ⚠️ GPS Spoofer Detected
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectReport?.(r.id)
                      }}
                      className="w-full mt-2 py-1.5 px-3 rounded-lg text-center text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      🔍 Deep Inspect & Action #{r.id}
                    </button>
                  </div>
                </Popup>
              </Marker>
            ) : null,
          )}
      </MapContainer>
    </div>
  )
}
