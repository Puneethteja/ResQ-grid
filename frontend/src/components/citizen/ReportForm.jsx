import { useState } from 'react'
import { HAZARD_TYPES } from '../../lib/constants.js'
import { MapPin, Users, Navigation } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'

export default function ReportForm({
  hazardType,
  setHazardType,
  description,
  setDescription,
  coordinates,
  setCoordinates,
  victimCount,
  setVictimCount,
}) {
  const { t } = useApp()
  const [locating, setLocating] = useState(false)

  function handleResetGPS() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude })
            setLocating(false)
          },
          () => setLocating(false),
          { enableHighAccuracy: false, timeout: 2000, maximumAge: 30000 }
        )
      },
      { enableHighAccuracy: true, timeout: 2000, maximumAge: 5000 }
    )
  }

  return (
    <div className="space-y-4">
      <div
        className="p-3.5 rounded-2xl space-y-2 border shadow-xs"
        style={{ background: 'var(--ink-raised)', borderColor: 'var(--ink-line)' }}
      >
        <div className="flex items-center justify-between">
          <label className="font-mono text-[11px] tracking-widest uppercase flex items-center gap-1.5 font-bold" style={{ color: 'var(--text-primary)' }}>
            <MapPin size={14} style={{ color: 'var(--signal)' }} /> Auto-Detected Incident Location
          </label>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
            GPS Locked
          </span>
        </div>

        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {coordinates ? `${coordinates.lat.toFixed(5)}°N, ${coordinates.lng.toFixed(5)}°E` : 'Detecting GPS…'}
          </span>
          <button
            type="button"
            onClick={handleResetGPS}
            disabled={locating}
            className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-xl border font-bold transition-all shadow-xs cursor-pointer hover:opacity-90 active:scale-95"
            style={{
              background: 'var(--ink)',
              borderColor: 'var(--ink-line)',
              color: 'var(--text-primary)',
            }}
          >
            <Navigation size={12} className={`text-amber-500 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'Fixing…' : 'Quick GPS'}</span>
          </button>
        </div>
      </div>

      <div>
        <label className="font-mono text-[11px] tracking-widest uppercase block mb-1.5 font-bold" style={{ color: 'var(--text-primary)' }}>
          {t('hazard_type', 'Emergency / Hazard Type')} *
        </label>
        <select
          value={hazardType}
          onChange={(e) => setHazardType(e.target.value)}
          required
          className="w-full rounded-xl px-3.5 py-3 text-sm outline-none font-medium shadow-xs transition-all border focus:ring-2 focus:ring-amber-500 cursor-pointer"
          style={{
            background: 'var(--ink-raised)',
            borderColor: 'var(--ink-line)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="" disabled>Select emergency hazard category&hellip;</option>
          {HAZARD_TYPES.map((h) => (
            <option key={h} value={h} style={{ background: 'var(--ink-raised)', color: 'var(--text-primary)' }}>{h}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="font-mono text-[11px] tracking-widest uppercase block mb-1.5 flex items-center justify-between font-bold" style={{ color: 'var(--text-primary)' }}>
          <span className="flex items-center gap-1.5"><Users size={13} className="text-amber-500" /> {t('victim_count', 'People Trapped / In Danger')}</span>
          <span className="font-bold text-sm" style={{ color: 'var(--signal)' }}>{victimCount || 1} {victimCount === 1 ? 'person' : 'people'}</span>
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 5, 10, 20].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setVictimCount(num)}
              className="flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow-xs cursor-pointer"
              style={{
                background: victimCount === num ? 'var(--signal)' : 'var(--ink-raised)',
                color: victimCount === num ? 'white' : 'var(--text-primary)',
                border: victimCount === num ? '1px solid transparent' : '1px solid var(--ink-line)',
              }}
            >
              {num === 20 ? '20+' : num}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="font-mono text-[11px] tracking-widest uppercase block mb-1.5 font-bold" style={{ color: 'var(--text-primary)' }}>
          {t('description', 'On-Ground Description & Landmarks')}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Describe water depth, structural collapse, injuries, or prominent landmarks (e.g. Near Big Bazaar, Master Canteen)..."
          className="w-full rounded-xl px-3.5 py-3 text-sm outline-none border focus:ring-2 focus:ring-amber-500 resize-none shadow-xs"
          style={{
            background: 'var(--ink-raised)',
            borderColor: 'var(--ink-line)',
            color: 'var(--text-primary)',
          }}
        />
      </div>
    </div>
  )
}
