import { useState, useEffect } from 'react'
import { AlertTriangle, ShieldCheck, MapPin, Radio, Flame, Droplets, Zap } from 'lucide-react'
import { fetchReports } from '../../lib/api.js'
export default function ThreatRadar({ shelterCoords }) {
  const [hazards, setHazards] = useState([])
  async function loadData() {
    try {
      const allReports = await fetchReports()
      const verified = (allReports || []).filter(
        (r) => r.trustStatus === 'VERIFIED' && r.coordinates,
      )
      setHazards(verified.slice(0, 4))
    } catch {
    }
  }
  useEffect(() => {
    loadData()
    const timer = setInterval(loadData, 3000)
    return () => clearInterval(timer)
  }, [])
  return (
    <div
      className="rounded-xl p-5 space-y-3 shadow-sm"
      style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio size={16} className="heartbeat-dot text-amber-500" />
          <h3 className="font-display text-sm font-semibold text-white">
            Threat Radar (Nearby Verified Hazards)
          </h3>
        </div>
        <span className="font-mono text-[10px] uppercase text-emerald-400 font-bold flex items-center gap-1">
          <ShieldCheck size={12} /> Sync Active
        </span>
      </div>
      <p className="text-xs" style={{ color: 'var(--mist)' }}>
        Live emergency conditions broadcast by district command within evacuation radius:
      </p>
      {hazards.length === 0 ? (
        <div className="p-3 rounded-lg text-center text-xs font-mono" style={{ background: 'var(--ink)', color: 'var(--safe)' }}>
          ✓ No active threat zones within shelter safety perimeter.
        </div>
      ) : (
        <div className="space-y-2">
          {hazards.map((h) => (
            <div
              key={h.id}
              className="p-3 rounded-lg flex items-start justify-between gap-3 text-xs"
              style={{ background: 'var(--ink)', border: '1px solid var(--hazard-dim)' }}
            >
              <div>
                <div className="font-display font-semibold text-white flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-red-400" />
                  {h.hazardType}
                </div>
                {h.description && (
                  <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                    {h.description}
                  </p>
                )}
                {h.coordinates && (
                  <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin size={10} />
                    {h.coordinates.lat.toFixed(4)}, {h.coordinates.lng.toFixed(4)}
                  </div>
                )}
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-800 shrink-0">
                ACTIVE HAZARD
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
