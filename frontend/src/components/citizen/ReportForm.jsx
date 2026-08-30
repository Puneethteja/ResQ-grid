import { useState } from 'react'
import { HAZARD_TYPES } from '../../lib/constants.js'
import { MapPin, Users, Navigation } from 'lucide-react'

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
  const [adjustingLocation, setAdjustingLocation] = useState(false)
  const [customLat, setCustomLat] = useState(coordinates?.lat?.toFixed(4) || '20.2961')
  const [customLng, setCustomLng] = useState(coordinates?.lng?.toFixed(4) || '85.8245')

  function handleSaveCoords() {
    const lat = parseFloat(customLat)
    const lng = parseFloat(customLng)
    if (!isNaN(lat) && !isNaN(lng)) {
      setCoordinates({ lat, lng })
      setAdjustingLocation(false)
    }
  }

  function handleResetGPS() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCoordinates(coords)
        setCustomLat(coords.lat.toFixed(4))
        setCustomLng(coords.lng.toFixed(4))
        setAdjustingLocation(false)
      })
    }
  }

  return (
    <div className="space-y-4">
      {}
      <div
        className="p-3 rounded-xl space-y-2"
        style={{ background: 'var(--paper-raised)', border: '1px solid var(--paper-line)' }}
      >
        <div className="flex items-center justify-between">
          <label className="font-mono text-[11px] tracking-widest uppercase flex items-center gap-1.5" style={{ color: 'var(--graphite)' }}>
            <MapPin size={13} style={{ color: 'var(--signal)' }} /> Geo-Tagged Incident Pin
          </label>
          <button
            type="button"
            onClick={() => setAdjustingLocation((v) => !v)}
            className="text-[11px] font-mono underline text-slate-600 hover:text-slate-900"
          >
            {adjustingLocation ? 'Close' : 'Adjust Pin Coordinates'}
          </button>
        </div>

        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-800 font-semibold">
            {coordinates ? `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}` : 'Detecting GPS…'}
          </span>
          <button
            type="button"
            onClick={handleResetGPS}
            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            <Navigation size={11} /> Auto GPS
          </button>
        </div>

        {adjustingLocation && (
          <div className="pt-2 grid grid-cols-3 gap-2 border-t" style={{ borderColor: 'var(--paper-line)' }}>
            <input
              type="number"
              step="0.0001"
              value={customLat}
              onChange={(e) => setCustomLat(e.target.value)}
              placeholder="Latitude"
              className="rounded px-2 py-1 text-xs outline-none bg-white border border-slate-300"
            />
            <input
              type="number"
              step="0.0001"
              value={customLng}
              onChange={(e) => setCustomLng(e.target.value)}
              placeholder="Longitude"
              className="rounded px-2 py-1 text-xs outline-none bg-white border border-slate-300"
            />
            <button
              type="button"
              onClick={handleSaveCoords}
              className="rounded px-2 py-1 text-xs font-medium text-white shadow-sm"
              style={{ background: 'var(--signal)' }}
            >
              Set Pin
            </button>
          </div>
        )}
      </div>

      {/* Hazard Type Select */}
      <div>
        <label className="font-mono text-[11px] tracking-widest uppercase block mb-2" style={{ color: 'var(--graphite)' }}>
          Emergency / Hazard Type *
        </label>
        <select
          value={hazardType}
          onChange={(e) => setHazardType(e.target.value)}
          required
          className="w-full rounded-xl px-3.5 py-3 text-sm outline-none font-medium shadow-sm transition-all focus:ring-2"
          style={{ background: 'var(--paper-raised)', border: '1px solid var(--paper-line)', color: '#1a1a1a' }}
        >
          <option value="" disabled>Select emergency hazard category&hellip;</option>
          {HAZARD_TYPES.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
      </div>

      {/* Trapped Victims Count */}
      <div>
        <label className="font-mono text-[11px] tracking-widest uppercase block mb-2 flex items-center justify-between" style={{ color: 'var(--graphite)' }}>
          <span className="flex items-center gap-1.5"><Users size={12} /> People Trapped / Affected</span>
          <span className="font-bold text-slate-800">{victimCount || 1} {victimCount === 1 ? 'person' : 'people'}</span>
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 5, 10, 20].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setVictimCount(num)}
              className="flex-1 py-2 rounded-lg text-xs font-mono font-medium transition-all"
              style={{
                background: victimCount === num ? 'var(--signal)' : 'var(--paper-raised)',
                color: victimCount === num ? 'white' : '#1a1a1a',
                border: victimCount === num ? '1px solid transparent' : '1px solid var(--paper-line)',
              }}
            >
              {num === 20 ? '20+' : num}
            </button>
          ))}
        </div>
      </div>

      {/* Emergency Description */}
      <div>
        <label className="font-mono text-[11px] tracking-widest uppercase block mb-2" style={{ color: 'var(--graphite)' }}>
          On-Ground Description & Landmarks
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Describe water depth, structural collapse, injuries, or prominent landmarks (e.g. Near Big Bazaar, Master Canteen)..."
          className="w-full rounded-xl px-3.5 py-3 text-sm outline-none focus:ring-2 resize-none shadow-sm"
          style={{ background: 'var(--paper-raised)', border: '1px solid var(--paper-line)', color: '#1a1a1a' }}
        />
      </div>
    </div>
  )
}