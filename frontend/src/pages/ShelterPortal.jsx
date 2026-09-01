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
  Lock,
  Phone,
  XCircle,
  AlertTriangle,
  Trash2,
} from 'lucide-react'
import CapacityMeter from '../components/shelter/CapacityMeter.jsx'
import HeartbeatPanel from '../components/shelter/HeartbeatPanel.jsx'
import MicroHavenForm from '../components/shelter/MicroHavenForm.jsx'
import PanicToggle from '../components/shelter/PanicToggle.jsx'
import ThreatRadar from '../components/shelter/ThreatRadar.jsx'
import ThemeLanguageBar from '../components/common/ThemeLanguageBar.jsx'
import { useApp } from '../context/AppContext.jsx'
import { registerShelter, updateShelterStatus, fetchShelters, deleteShelter } from '../lib/api.js'
import { getAuthorityEmail } from '../lib/authoritySession.js'
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
      <div className="pt-2 border-t border-slate-700/60">
        <span className="font-mono text-[10px] text-slate-400 block mb-1">Quick Sector Presets (Bhubaneswar Metro):</span>
        <div className="flex flex-wrap gap-1.5">
          {SECTOR_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => handlePresetSelect(p)}
              className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
function RegisterShelterForm({ onRegistered }) {
  const [name, setName] = useState('')
  const [coords, setCoords] = useState({ lat: 20.2961, lng: 85.8245 })
  const [maxCapacity, setMaxCapacity] = useState('300')
  const [verificationPhoto, setVerificationPhoto] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  function selectPhoto(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => setVerificationPhoto(e.target?.result)
    reader.readAsDataURL(file)
  }
  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setStatus('saving')
    setError(null)
    try {
      const shelterId = `SHL-${Date.now().toString(36).toUpperCase()}`
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
        <LocationPicker coords={coords} setCoords={setCoords} />
        <div>
          <label className="font-mono text-[11px] uppercase tracking-wider block mb-1 font-bold" style={{ color: 'var(--text-primary)' }}>
            Facility Verification Photo (Required for Authority Approval) *
          </label>
          <p className="text-[11px] mb-2" style={{ color: 'var(--mist)' }}>
            To protect disaster evacuees, Authority Command requires a clear photo of the building envelope, entrance, or structural roof before approving the facility.
          </p>
          <label
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-xs font-bold cursor-pointer border transition-all hover:opacity-90 shadow-xs"
            style={{ background: 'var(--ink)', borderColor: 'var(--ink-line)', color: 'var(--text-primary)' }}
          >
            <Camera size={16} style={{ color: 'var(--signal)' }} />
            <span>{verificationPhoto ? '✓ Verification Photo Attached (Click to Change)' : '📷 Attach / Capture Facility Verification Photo'}</span>
            <input type="file" accept="image/*" capture="environment" onChange={(e) => selectPhoto(e.target.files?.[0])} className="hidden" />
          </label>
          {verificationPhoto && (
            <div className="relative mt-2 rounded-xl overflow-hidden border border-emerald-500/40 shadow-sm">
              <img src={verificationPhoto} alt="Shelter preview" className="w-full h-36 object-cover" />
              <div className="absolute bottom-0 inset-x-0 p-1.5 bg-black/70 text-[10px] font-mono text-emerald-400 flex items-center justify-between">
                <span>✓ Facility Proof Ready for Authority Review</span>
                <button type="button" onClick={() => setVerificationPhoto(null)} className="text-rose-400 hover:text-white">✕ Remove</button>
              </div>
            </div>
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
  const { t, setTheme } = useApp()
  useEffect(() => {
    setTheme('dark')
  }, [setTheme])
  const [shelter, setShelter] = useState(null)
  const [availableShelters, setAvailableShelters] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
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
    } finally {
      setLoading(false)
    }
  }, [editCoords])
  useEffect(() => {
    syncShelter()
    const timer = setInterval(syncShelter, 3500)
    return () => clearInterval(timer)
  }, [syncShelter])
  async function handleManualSync() {
    setSyncing(true)
    await syncShelter()
    setTimeout(() => setSyncing(false), 500)
  }
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

  const managerEmail = getAuthorityEmail()
  const isMasterUser = managerEmail === 'shelter@resqgrid.gov' || managerEmail === 'commander@resqgrid.gov'
  const myShelters = availableShelters.filter((s) => isMasterUser || s.ownerEmail === managerEmail || !s.ownerEmail)
  const otherShelters = availableShelters.filter((s) => !isMasterUser && s.ownerEmail && s.ownerEmail !== managerEmail)

  async function handleDeleteShelter(shelterId, e) {
    if (e) e.stopPropagation()
    if (!window.confirm('Are you sure you want to permanently delete this shelter facility? This action cannot be undone.')) return
    try {
      await deleteShelter(shelterId)
      if (shelter && (shelter.shelterId === shelterId || shelter.id === shelterId)) {
        localStorage.removeItem(STORAGE_KEY)
        setShelter(null)
      }
      await syncShelter()
    } catch (err) {
      alert(err.message || 'Failed to delete shelter')
    }
  }

  const isVerified = shelter?.verificationStatus === 'VERIFIED' || shelter?.verificationStatus === 'ACTIVE'
  const isRejected = shelter?.verificationStatus === 'REJECTED'
  return (
    <div className="min-h-screen p-5 sm:p-8" style={{ background: 'var(--ink)' }}>
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-lg border shadow-xs transition-colors" style={{ background: 'var(--ink-raised)', borderColor: 'var(--ink-line)', color: 'var(--text-primary)' }}>
            <ArrowLeft size={14} /> {t('back_to_roles')}
          </Link>
          <div className="flex items-center gap-3">
            {savedFlash && (
              <span className="flex items-center gap-1 text-xs font-mono text-emerald-400">
                <Check size={13} /> Synced
              </span>
            )}
            <ThemeLanguageBar compact={true} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('shelter_portal_title')}</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>
              Logged in as <span className="font-mono text-amber-400">{managerEmail}</span>
            </p>
          </div>
          {shelter && (
            <span
              className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold flex items-center gap-1.5 shadow"
              style={{
                background: isVerified ? 'rgba(16,185,129,0.2)' : isRejected ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                color: isVerified ? '#34D399' : isRejected ? '#F87171' : '#FBBF24',
                border: `1px solid ${isVerified ? 'var(--safe)' : isRejected ? '#DC2626' : 'var(--caution)'}`,
              }}
            >
              {isVerified ? (
                <>
                  <ShieldCheck size={14} /> Verified Official Safe Refuge
                </>
              ) : isRejected ? (
                <>
                  <XCircle size={14} /> Registration Rejected
                </>
              ) : (
                <>
                  <Clock size={14} className="animate-spin" /> ⧗ Awaiting Authority Command Approval
                </>
              )}
            </span>
          )}
        </div>
        {loading ? (
          <div className="py-12 text-center text-xs" style={{ color: 'var(--mist)' }}>
            <RefreshCw size={18} className="animate-spin mx-auto mb-2" /> Syncing shelter node…
          </div>
        ) : !shelter ? (
          <div className="space-y-4">
            {!registerMode && availableShelters.length > 0 && (
              <div className="rounded-2xl p-6 shadow-xl space-y-5" style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 size={20} style={{ color: 'var(--signal)' }} />
                    <h2 className="font-display text-base font-semibold text-white">Select Facility to Manage</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRegisterMode(true)}
                    className="text-xs font-mono font-semibold px-3 py-1.5 rounded-lg text-white cursor-pointer transition-transform hover:scale-105"
                    style={{ background: 'var(--signal)' }}
                  >
                    + Register New Facility
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="text-[11px] font-mono uppercase tracking-wider font-bold text-amber-400 flex items-center justify-between">
                    <span>🏢 My Registered Facilities ({myShelters.length})</span>
                    <span className="text-slate-500 font-normal">{managerEmail}</span>
                  </div>
                  {myShelters.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">No facilities registered under this account yet. Click "+ Register New Facility" above to add one.</p>
                  ) : (
                    <div className="space-y-2">
                      {myShelters.map((s) => {
                        const verified = s.verificationStatus === 'VERIFIED' || s.verificationStatus === 'ACTIVE'
                        const shelterId = s.shelterId || s.id
                        return (
                          <div
                            key={shelterId}
                            onClick={() => handleSelectExisting(s)}
                            className="w-full text-left p-3.5 rounded-xl border border-slate-700/60 bg-slate-900/60 hover:bg-slate-800 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-display text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                                {s.name}
                              </div>
                              <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                                Status: {s.verificationStatus || 'PENDING_APPROVAL'} · Capacity: {s.maxCapacity} evacuees
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className="font-mono text-xs px-2.5 py-1 rounded font-bold"
                                style={{
                                  background: verified ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                                  color: verified ? '#34D399' : '#FBBF24',
                                  border: `1px solid ${verified ? '#059669' : '#D97706'}`,
                                }}
                              >
                                {verified ? 'Manage →' : 'Status →'}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteShelter(shelterId, e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Delete Shelter Facility"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {otherShelters.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <div className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-400">
                      🌐 Other District Network Facilities ({otherShelters.length})
                    </div>
                    <div className="space-y-2">
                      {otherShelters.map((s) => {
                        const verified = s.verificationStatus === 'VERIFIED' || s.verificationStatus === 'ACTIVE'
                        return (
                          <div
                            key={s.id || s.shelterId}
                            onClick={() => handleSelectExisting(s)}
                            className="w-full text-left p-3 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-900/60 transition-all flex items-center justify-between gap-3 group cursor-pointer opacity-80 hover:opacity-100"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-display text-xs font-bold text-slate-300 truncate">
                                {s.name}
                              </div>
                              <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                                Manager: {s.ownerEmail || 'District Authority'} · Capacity: {s.maxCapacity}
                              </div>
                            </div>
                            <span className="font-mono text-[11px] text-slate-400">
                              View →
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
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
        ) : !isVerified ? (
          <div className="rounded-2xl p-7 shadow-2xl space-y-6 border" style={{ background: 'var(--ink-raised)', borderColor: 'var(--ink-line)' }}>
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: isRejected ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                  border: `1px solid ${isRejected ? '#DC2626' : '#D97706'}`,
                }}
              >
                {isRejected ? (
                  <XCircle size={26} className="text-red-500" />
                ) : (
                  <Lock size={26} className="text-amber-400 animate-pulse" />
                )}
              </div>
              <div className="space-y-1">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase"
                  style={{
                    background: isRejected ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                    color: isRejected ? '#F87171' : '#FBBF24',
                  }}
                >
                  {isRejected ? 'REGISTRATION REJECTED BY COMMAND' : 'AUTHORITY APPROVAL REQUIRED'}
                </span>
                <h2 className="font-display text-lg font-bold text-white">{shelter.name}</h2>
                <p className="text-xs text-slate-400">
                  Node Identifier: <span className="font-mono text-slate-300">{shelter.shelterId || shelter.id}</span>
                </p>
              </div>
            </div>
            <div
              className="p-4 rounded-xl text-xs space-y-2 leading-relaxed"
              style={{
                background: isRejected ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                border: `1px solid ${isRejected ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
                color: isRejected ? '#FECACA' : '#FDE68A',
              }}
            >
              {isRejected ? (
                <p>
                  <strong>Facility Status: REJECTED.</strong> This shelter submission was reviewed and rejected by the District Incident Commander. Please verify structural and capacity requirements or register an alternate facility.
                </p>
              ) : (
                <p>
                  <strong>Facility Status: PENDING APPROVAL.</strong> Operational dashboard controls (live occupancy counters, resource dispatch routing, evacuee logs, and district heartbeat broadcast) are <strong>locked</strong> until verified and approved by the District Disaster Command.
                </p>
              )}
            </div>
            <div className="p-4 rounded-xl space-y-2.5 bg-slate-950/70 border border-slate-800 text-xs font-mono">
              <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Submitted Facility Profile:</div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px]">COORDINATES</span>
                  <span>{shelter.coordinates ? `${shelter.coordinates.lat.toFixed(4)}° N, ${shelter.coordinates.lng.toFixed(4)}° E` : 'Bhubaneswar Metro'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">SAFE CAPACITY</span>
                  <span>{shelter.maxCapacity} Evacuees</span>
                </div>
              </div>
              {shelter.verificationPhoto && (
                <div className="pt-2">
                  <span className="text-slate-500 block text-[10px] mb-1">ATTACHED VERIFICATION PHOTO:</span>
                  <img src={shelter.verificationPhoto} alt="Facility preview" className="w-full h-28 rounded-lg object-cover border border-slate-700" />
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={syncing}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Checking Approval Status…' : 'Refresh Approval Status'}
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEY)
                  setShelter(null)
                }}
                className="py-3 px-4 rounded-xl text-xs font-mono text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
              >
                Switch Facility
              </button>
              <button
                type="button"
                onClick={() => handleDeleteShelter(shelter.shelterId || shelter.id)}
                className="py-3 px-4 rounded-xl text-xs font-mono text-rose-400 bg-rose-950/40 hover:bg-rose-900/60 transition-colors border border-rose-800 flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Delete Facility
              </button>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px]">Need urgent triage?</span>
              <a
                href="tel:1077"
                className="text-amber-400 hover:text-amber-300 font-mono font-bold flex items-center gap-1"
              >
                <Phone size={12} /> Contact SEOC Command (1077)
              </a>
            </div>
          </div>
        ) : (
          <>
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
                <button
                  onClick={() => handleDeleteShelter(shelter.shelterId || shelter.id)}
                  className="font-mono text-xs px-3 py-1.5 rounded-lg text-rose-400 bg-rose-950/40 border border-rose-800 hover:bg-rose-900/60 transition-colors flex items-center gap-1"
                  title="Delete Shelter Facility"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
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
            <ThreatRadar shelterCoords={shelter.coordinates} />
            <CapacityMeter
              currentOccupancy={shelter.currentOccupancy}
              maxCapacity={shelter.maxCapacity}
              closed={shelter.closed}
              onChange={(v) => persist({ current_occupancy: v })}
            />
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
            <PanicToggle closed={shelter.closed} onSetClosed={(v) => persist({ closed: v })} />
            <MicroHavenForm />
          </>
        )}
      </div>
    </div>
  )
}
