import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Check,
  Camera,
  RefreshCw,
  ShieldCheck,
  Upload,
  MapPin,
  Compass,
  Navigation,
  Clock,
  ShieldAlert,
  Edit3,
} from 'lucide-react'
import CapacityMeter from '../components/shelter/CapacityMeter.jsx'
import HeartbeatPanel from '../components/shelter/HeartbeatPanel.jsx'
import MicroHavenForm from '../components/shelter/MicroHavenForm.jsx'
import PanicToggle from '../components/shelter/PanicToggle.jsx'
import ThreatRadar from '../components/shelter/ThreatRadar.jsx'
import { registerShelter, updateShelterStatus, fetchShelters } from '../lib/api.js'

const STORAGE_KEY = 'shelter.activeId'

const SECTOR_PRESETS = [
  { name: 'Master Canteen Hub', lat: 20.2961, lng: 85.8245 },
  { name: 'Rajmahal Relief Sector', lat: 20.2885, lng: 85.833 },
  { name: 'Kalinga Stadium Complex', lat: 20.315, lng: 85.831 },
  { name: 'AIIMS Medical Sector', lat: 20.291, lng: 85.812 },
  { name: 'Janpath Commercial Sector', lat: 20.298, lng: 85.84 },
  { name: 'Old Town Cultural Zone', lat: 20.245, lng: 85.835 },
  { name: 'Patia / North Campus Zone', lat: 20.355, lng: 85.815 },
]

function LocationPicker({ coords, setCoords }) {
  const [gpsLoading, setGpsLoading] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [latInput, setLatInput] = useState(coords?.lat ? String(coords.lat) : '20.2961')
  const [lngInput, setLngInput] = useState(coords?.lng ? String(coords.lng) : '85.8245')

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
        alert(`Could not acquire GPS fix: ${err.message}. Using default coordinates.`)
        setGpsLoading(false)
      },
      { timeout: 9000, enableHighAccuracy: true },
    )
  }

  function handlePresetSelect(preset) {
    setCoords({ lat: preset.lat, lng: preset.lng })
    setLatInput(String(preset.lat))
    setLngInput(String(preset.lng))
  }

  function handleManualApply() {
    const lat = parseFloat(latInput)
    const lng = parseFloat(lngInput)
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Please enter valid latitude (-90 to 90) and longitude (-180 to 180).')
      return
    }
    setCoords({ lat, lng })
  }

  return (
    <div className="p-3.5 rounded-xl space-y-3" style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}>
      <div className="flex items-center justify-between">
        <label className="font-mono text-[11px] uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-semibold">
          <MapPin size={14} style={{ color: 'var(--signal)' }} /> Facility Geolocation Coordinates
        </label>
        <span className="font-mono text-[11px] px-2 py-0.5 rounded text-emerald-400 bg-emerald-950/60 border border-emerald-800">
          {coords?.lat ? `${coords.lat.toFixed(4)}° N, ${coords.lng.toFixed(4)}° E` : 'Not Set'}
        </span>
      </div>

      {}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleDetectGps}
          disabled={gpsLoading}
          className="py-1.5 px-3 rounded-lg text-xs font-medium text-white flex items-center gap-1.5 transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--signal)' }}
        >
          <Navigation size={13} className={gpsLoading ? 'animate-spin' : ''} />
          {gpsLoading ? 'Acquiring GPS Lock…' : 'Use Current Device GPS'}
        </button>

        <button
          type="button"
          onClick={() => setManualMode((v) => !v)}
          className="py-1.5 px-3 rounded-lg text-xs font-mono text-slate-300 hover:text-white transition-colors"
          style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}
        >
          <Edit3 size={13} className="inline mr-1" />
          {manualMode ? 'Hide Coordinates Input' : 'Enter Exact Lat / Lng'}
        </button>
      </div>

      {/* Manual Input Fields */}
      {manualMode && (
        <div className="pt-2 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-mono text-[10px] text-slate-400 block mb-1">Latitude</span>
            <input
              type="text"
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              onBlur={handleManualApply}
              placeholder="e.g. 20.2961"
              className="w-full rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
              style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}
            />
          </div>
          <div>
            <span className="font-mono text-[10px] text-slate-400 block mb-1">Longitude</span>
            <input
              type="text"
              value={lngInput}
              onChange={(e) => setLngInput(e.target.value)}
              onBlur={handleManualApply}
              placeholder="e.g. 85.8245"
              className="w-full rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
              style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}
            />
          </div>
        </div>
      )}

      {/* Quick Sector Presets */}
      <div className="pt-1">
        <span className="font-mono text-[10px] uppercase text-slate-400 block mb-1.5">
          Or Select District Sector Preset:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {SECTOR_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className="px-2 py-1 rounded text-[10px] font-mono transition-colors text-slate-300 hover:text-white"
              style={{
                background: coords?.lat === preset.lat ? 'rgba(56, 189, 248, 0.25)' : 'var(--ink-raised)',
                border: `1px solid ${coords?.lat === preset.lat ? 'var(--signal)' : 'var(--ink-line)'}`,
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function RegisterShelterForm({ onRegistered }) {
  const [name, setName] = useState('')
  const [maxCapacity, setMaxCapacity] = useState('')
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)
  const [verificationPhoto, setVerificationPhoto] = useState(null)
  const [coords, setCoords] = useState({ lat: 20.2961, lng: 85.8245 })

  function selectPhoto(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setVerificationPhoto(reader.result)
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('saving')
    setError(null)

    const shelterId = `SH-${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}-${Date.now().toString(36).slice(-4)}`

    try {
      const shelter = await registerShelter({
        shelter_id: shelterId,
        name: name.trim(),
        coordinates: coords,
        max_capacity: Number(maxCapacity),
        verification_photo: verificationPhoto,
      })
      onRegistered(shelter)
    } catch (err) {
      setStatus('error')
      setError(err.message || 'Registration failed')
    }
  }

  return (
    <div className="rounded-2xl p-6 shadow-xl space-y-4" style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}>
      <div className="flex items-center gap-2 mb-2">
        <Building2 size={20} style={{ color: 'var(--signal)' }} />
        <h2 className="font-display text-base font-semibold text-white">Register Facility as Disaster Safe Refuge</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-mono text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: 'var(--mist)' }}>
            Facility / Shelter Name
          </label>
          <input
            required
            placeholder="e.g. Unit-8 Municipal High School & Community Hall"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none text-white"
            style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}
          />
        </div>

        {/* Set Location Component */}
        <LocationPicker coords={coords} setCoords={setCoords} />

        <div>
          <label className="font-mono text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: 'var(--mist)' }}>
            Facility Photo Verification & Structural Proof
          </label>
          <label
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs cursor-pointer border text-slate-300 hover:text-white transition-colors"
            style={{ background: 'var(--ink)', borderColor: 'var(--ink-line)' }}
          >
            <Upload size={14} style={{ color: 'var(--signal)' }} />
            <span>{verificationPhoto ? 'Photo Attached (Click to change)' : 'Attach Facility Verification Photo'}</span>
            <input type="file" accept="image/*" onChange={(e) => selectPhoto(e.target.files?.[0])} className="hidden" />
          </label>
          {verificationPhoto && (
            <img src={verificationPhoto} alt="Shelter preview" className="w-full h-32 rounded-xl object-cover mt-2 border border-slate-700" />
          )}
        </div>

        <div>
          <label className="font-mono text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: 'var(--mist)' }}>
            Maximum Safe Capacity (Persons)
          </label>
          <input
            required
            type="number"
            min={1}
            placeholder="e.g. 500"
            value={maxCapacity}
            onChange={(e) => setMaxCapacity(e.target.value)}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none text-white"
            style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}
          />
        </div>

        <button
          type="submit"
          disabled={status === 'saving'}
          className="w-full rounded-xl py-3 font-semibold text-white shadow-md disabled:opacity-50 transition-transform hover:scale-[1.01]"
          style={{ background: 'var(--signal)' }}
        >
          {status === 'saving' ? 'Registering Facility…' : 'Submit Facility for Authority Approval'}
        </button>

        {error && <p className="text-xs" style={{ color: 'var(--hazard)' }}>{error}</p>}
      </form>
    </div>
  )
}

export default function ShelterPortal() {
  const [shelter, setShelter] = useState(null)
  const [availableShelters, setAvailableShelters] = useState([])
  const [loading, setLoading] = useState(true)
  const [savedFlash, setSavedFlash] = useState(false)
  const [editingLocation, setEditingLocation] = useState(false)
  const [editCoords, setEditCoords] = useState(null)
  const [registerMode, setRegisterMode] = useState(false)

  const syncShelter = useCallback(async () => {
    try {
      const list = await fetchShelters()
      setAvailableShelters(list || [])
      const activeId = localStorage.getItem(STORAGE_KEY)
      if (activeId) {
        const found = list.find((s) => s.shelterId === activeId || s.id === activeId)
        if (found) {
          setShelter(found)
          if (!editCoords && found.coordinates) {
            setEditCoords(found.coordinates)
          }
        }
      }
    } catch {
      // offline
    } finally {
      setLoading(false)
    }
  }, [editCoords])

  useEffect(() => {
    syncShelter()
    const timer = setInterval(syncShelter, 3500)
    return () => clearInterval(timer)
  }, [syncShelter])

  function handleSelectExisting(s) {
    localStorage.setItem(STORAGE_KEY, s.shelterId || s.id)
    setShelter(s)
    setEditCoords(s.coordinates)
    setRegisterMode(false)
  }

  function handleRegistered(s) {
    localStorage.setItem(STORAGE_KEY, s.shelterId || s.id)
    setShelter(s)
    setEditCoords(s.coordinates)
    setRegisterMode(false)
  }

  async function persist(patch) {
    if (!shelter) return
    const updated = await updateShelterStatus(shelter.shelterId || shelter.id, patch)
    setShelter(updated)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1200)
    return updated
  }

  const isVerified = shelter?.verificationStatus === 'VERIFIED' || shelter?.verificationStatus === 'ACTIVE'

  return (
    <div className="min-h-screen p-5 sm:p-8" style={{ background: 'var(--ink)' }}>
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back to role select
          </Link>
          {savedFlash && (
            <span className="flex items-center gap-1 text-xs font-mono text-emerald-400">
              <Check size={13} /> Synced to District Network
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Shelter & Haven Operations</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>
              Live occupancy telemetry, infrastructure heartbeat, and district threat sync.
            </p>
          </div>
          {shelter && (
            <span
              className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold flex items-center gap-1.5 shadow"
              style={{
                background: isVerified ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                color: isVerified ? '#34D399' : '#FBBF24',
                border: `1px solid ${isVerified ? 'var(--safe)' : 'var(--caution)'}`,
              }}
            >
              {isVerified ? (
                <>
                  <ShieldCheck size={14} /> Verified Official Safe Refuge
                </>
              ) : (
                <>
                  <Clock size={14} /> ⧗ Awaiting Authority Command Approval
                </>
              )}
            </span>
          )}
        </div>

        {/* Verification Status Advisory Notice */}
        {shelter && !isVerified && (
          <div
            className="p-3.5 rounded-xl text-xs font-mono flex items-start gap-2.5"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#FDE68A' }}
          >
            <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-400" />
            <div>
              <strong>Authority Verification Pending:</strong> This facility has been registered and is undergoing review by the District Incident Commander. Once approved, it will be prioritized in the public evacuation matrix.
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-xs" style={{ color: 'var(--mist)' }}>
            <RefreshCw size={18} className="animate-spin mx-auto mb-2" /> Syncing shelter node…
          </div>
        ) : !shelter ? (
          <div className="space-y-4">
            {!registerMode && availableShelters.length > 0 && (
              <div className="rounded-2xl p-6 shadow-xl space-y-4" style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 size={20} style={{ color: 'var(--signal)' }} />
                    <h2 className="font-display text-base font-semibold text-white">Select Facility to Manage</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRegisterMode(true)}
                    className="text-xs font-mono font-semibold px-3 py-1.5 rounded-lg text-white"
                    style={{ background: 'var(--signal)' }}
                  >
                    + Register New Facility
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Select an active shelter or micro-haven node from the district network to manage live occupancy and heartbeat.
                </p>
                <div className="space-y-2 pt-1">
                  {availableShelters.map((s) => (
                    <button
                      key={s.id || s.shelterId}
                      onClick={() => handleSelectExisting(s)}
                      className="w-full text-left p-3.5 rounded-xl border border-slate-700/60 bg-slate-900/60 hover:bg-slate-800 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div>
                        <div className="font-display text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                          {s.name}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                          Capacity: {s.currentOccupancy || 0}/{s.maxCapacity} · Power: {s.powerStatus || 'GRID'} · Water: {s.waterStatus || 'OK'}
                        </div>
                      </div>
                      <span className="font-mono text-xs px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        Manage &rarr;
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(registerMode || availableShelters.length === 0) && (
              <div className="space-y-3">
                {availableShelters.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRegisterMode(false)}
                    className="text-xs font-mono text-slate-400 hover:text-white"
                  >
                    &larr; Back to registered facilities list
                  </button>
                )}
                <RegisterShelterForm onRegistered={handleRegistered} />
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Active Shelter Details Card */}
            <div
              className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl p-4 gap-3"
              style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}
            >
              <div>
                <div className="font-display text-base font-semibold text-white">{shelter.name}</div>
                <div className="font-mono text-[11px] flex items-center gap-2 mt-0.5" style={{ color: 'var(--mist)' }}>
                  <span>Node ID: {shelter.shelterId || shelter.id}</span>
                  {shelter.coordinates && (
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin size={11} style={{ color: 'var(--signal)' }} />
                      {shelter.coordinates.lat.toFixed(4)}, {shelter.coordinates.lng.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingLocation((v) => !v)}
                  className="font-mono text-xs px-3 py-1.5 rounded-lg text-slate-300 hover:text-white transition-colors"
                  style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}
                >
                  <MapPin size={12} className="inline mr-1" />
                  {editingLocation ? 'Done Setting Location' : 'Set Location'}
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem(STORAGE_KEY)
                    setShelter(null)
                  }}
                  className="font-mono text-xs px-3 py-1.5 rounded-lg text-slate-300 hover:text-white transition-colors"
                  style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}
                >
                  Switch Facility
                </button>
              </div>
            </div>

            {/* Set Location Drawer if expanded */}
            {editingLocation && (
              <div className="rounded-xl p-4" style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}>
                <LocationPicker
                  coords={editCoords || shelter.coordinates}
                  setCoords={(newC) => {
                    setEditCoords(newC)
                    persist({ coordinates: newC })
                  }}
                />
              </div>
            )}

            {}
            <ThreatRadar shelterCoords={shelter.coordinates} />

            {/* Live Capacity Meter */}
            <CapacityMeter
              currentOccupancy={shelter.currentOccupancy}
              maxCapacity={shelter.maxCapacity}
              closed={shelter.closed}
              onChange={(v) => persist({ current_occupancy: v })}
            />

            {}
            <HeartbeatPanel
              water={shelter.waterStatus}
              power={shelter.powerStatus}
              medical={shelter.medicalStatus}
              lastHeartbeat={shelter.heartbeatTimestamp}
              setWater={(v) => persist({ water_status: v })}
              setPower={(v) => persist({ power_status: v })}
              setMedical={(v) => persist({ medical_status: v })}
              onHeartbeat={() => persist({})}
            />

            {/* Emergency Panic Closure Toggle */}
            <PanicToggle closed={shelter.closed} onSetClosed={(v) => persist({ closed: v })} />

            {}
            <MicroHavenForm />
          </>
        )}
      </div>
    </div>
  )
}