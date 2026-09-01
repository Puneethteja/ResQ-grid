import { useState } from 'react'
import { Home, Check, MapPin, Navigation, Edit3 } from 'lucide-react'
import { registerMicroHaven } from '../../lib/api.js'
const emptyForm = { name: '', roofCapacity: '', contactName: '', contactPhone: '', notes: '' }
const SECTOR_PRESETS = [
  { name: 'Master Canteen Hub', lat: 20.2961, lng: 85.8245 },
  { name: 'Rajmahal Relief Sector', lat: 20.2885, lng: 85.833 },
  { name: 'Kalinga Stadium Complex', lat: 20.315, lng: 85.831 },
  { name: 'AIIMS Medical Sector', lat: 20.291, lng: 85.812 },
  { name: 'Janpath Commercial Sector', lat: 20.298, lng: 85.84 },
  { name: 'Old Town Cultural Zone', lat: 20.245, lng: 85.835 },
  { name: 'Patia / North Campus Zone', lat: 20.355, lng: 85.815 },
]
export default function MicroHavenForm() {
  const [form, setForm] = useState(emptyForm)
  const [coords, setCoords] = useState({ lat: 20.2961, lng: 85.8245 })
  const [gpsLoading, setGpsLoading] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [latInput, setLatInput] = useState('20.2961')
  const [lngInput, setLngInput] = useState('85.8245')
  const [status, setStatus] = useState(null) 
  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }
  function handleDetectGps() {
    setGpsLoading(true)
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      setGpsLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        }
        setCoords(c)
        setLatInput(String(c.lat))
        setLngInput(String(c.lng))
        setGpsLoading(false)
      },
      (err) => {
        alert(`Could not acquire GPS fix: ${err.message}`)
        setGpsLoading(false)
      },
      { timeout: 9000, enableHighAccuracy: true },
    )
  }
  function handlePreset(preset) {
    setCoords({ lat: preset.lat, lng: preset.lng })
    setLatInput(String(preset.lat))
    setLngInput(String(preset.lng))
  }
  function handleManualApply() {
    const lat = parseFloat(latInput)
    const lng = parseFloat(lngInput)
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return
    setCoords({ lat, lng })
  }
  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('saving')
    try {
      await registerMicroHaven({
        ...form,
        roofCapacity: Number(form.roofCapacity),
        coordinates: coords,
        tier: 2,
        registeredAt: new Date().toISOString(),
      })
      setStatus('done')
      setForm(emptyForm)
    } catch {
      setStatus('error')
    }
  }
  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}>
      <div className="flex items-center gap-2 mb-4">
        <Home size={18} style={{ color: 'var(--signal)' }} />
        <span className="font-display text-base font-semibold text-white">Register a Crowdsourced Micro-Haven (Tier 2)</span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <input
          required
          placeholder="Location name (e.g. High Plinth Temple Hall / Building Roof)"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          className="w-full rounded-lg px-3.5 py-2 text-sm outline-none text-white"
          style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}
        />
        <div className="p-3 rounded-lg space-y-2.5" style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[11px] text-slate-300 flex items-center gap-1.5 font-semibold">
              <MapPin size={13} style={{ color: 'var(--signal)' }} /> Micro-Haven Coordinates
            </span>
            <span className="font-mono text-[10px] text-emerald-400">
              {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDetectGps}
              disabled={gpsLoading}
              className="py-1 px-2.5 rounded text-xs text-white font-medium flex items-center gap-1 shadow"
              style={{ background: 'var(--signal)' }}
            >
              <Navigation size={11} className={gpsLoading ? 'animate-spin' : ''} />
              {gpsLoading ? 'GPS Locating…' : 'Use Current GPS'}
            </button>
            <button
              type="button"
              onClick={() => setManualMode((v) => !v)}
              className="py-1 px-2.5 rounded text-xs font-mono text-slate-300 hover:text-white"
              style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}
            >
              <Edit3 size={11} className="inline mr-1" />
              {manualMode ? 'Hide Coordinates' : 'Set Exact Lat/Lng'}
            </button>
          </div>
          {manualMode && (
            <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-700">
              <input
                type="text"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                onBlur={handleManualApply}
                placeholder="Latitude"
                className="w-full rounded px-2 py-1 text-xs text-white outline-none"
                style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}
              />
              <input
                type="text"
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
                onBlur={handleManualApply}
                placeholder="Longitude"
                className="w-full rounded px-2 py-1 text-xs text-white outline-none"
                style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}
              />
            </div>
          )}
          <div className="flex flex-wrap gap-1 pt-1">
            {SECTOR_PRESETS.slice(0, 5).map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handlePreset(p)}
                className="px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-300 hover:text-white"
                style={{
                  background: coords.lat === p.lat ? 'rgba(56, 189, 248, 0.25)' : 'var(--ink-raised)',
                  border: `1px solid ${coords.lat === p.lat ? 'var(--signal)' : 'var(--ink-line)'}`,
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
        <input
          required
          type="number"
          min={1}
          placeholder="Safe roof / hall capacity (persons)"
          value={form.roofCapacity}
          onChange={(e) => update('roofCapacity', e.target.value)}
          className="w-full rounded-lg px-3.5 py-2 text-sm outline-none text-white"
          style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            required
            placeholder="Caregiver / Contact name"
            value={form.contactName}
            onChange={(e) => update('contactName', e.target.value)}
            className="rounded-lg px-3.5 py-2 text-sm outline-none text-white"
            style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}
          />
          <input
            required
            placeholder="Contact phone"
            value={form.contactPhone}
            onChange={(e) => update('contactPhone', e.target.value)}
            className="rounded-lg px-3.5 py-2 text-sm outline-none text-white"
            style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}
          />
        </div>
        <textarea
          placeholder="Access route, staircase details, roof structural safety, water tank status…"
          rows={2}
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          className="w-full rounded-lg px-3.5 py-2 text-sm outline-none resize-none text-white"
          style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}
        />
        <button
          type="submit"
          disabled={status === 'saving'}
          className="w-full rounded-lg py-2.5 font-semibold text-white shadow transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--signal)' }}
        >
          {status === 'saving' ? 'Registering Micro-Haven…' : 'Register Micro-Haven Safe Refuge'}
        </button>
        {status === 'done' && (
          <p className="text-xs flex items-center gap-1.5 text-emerald-400 font-medium pt-1">
            <Check size={14} /> Registered successfully. 3 community arrival pings within 150m will promote it to ACTIVE on the public map.
          </p>
        )}
        {status === 'error' && (
          <p className="text-xs text-rose-400">
            Registration failed. Please check network connection and retry.
          </p>
        )}
      </form>
    </div>
  )
}
