import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Send,
  Check,
  TriangleAlert,
  Route,
  Sparkles,
  Home,
  CheckCircle2,
  MapPin,
  Users,
  ShieldCheck,
  Radio,
  Truck,
} from 'lucide-react'
import SOSHeader from '../components/citizen/SOSHeader.jsx'
import ReportForm from '../components/citizen/ReportForm.jsx'
import CameraCapture from '../components/citizen/CameraCapture.jsx'
import OfflineDrawer from '../components/citizen/OfflineDrawer.jsx'
import RecentReportsFeed from '../components/citizen/RecentReportsFeed.jsx'
import {
  submitReport,
  fetchHazardStatus,
  computeAllocation,
  fetchMicroHavens,
  pingMicroHavenArrival,
  ApiError,
} from '../lib/api.js'

function useGeolocation() {
  const [coordinates, setCoordinates] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this device.')
      return
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError('Location access denied — using regional center coordinates (Bhubaneswar).'),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 },
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return { coordinates, error }
}

function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

export default function CitizenPortal() {
  const { coordinates: autoCoords, error: geoError } = useGeolocation()
  const online = useOnlineStatus()

  const [activeCoords, setActiveCoords] = useState({ lat: 20.2961, lng: 85.8245 })
  const [hazardType, setHazardType] = useState('')
  const [description, setDescription] = useState('')
  const [victimCount, setVictimCount] = useState(1)
  const [photo, setPhoto] = useState(null)
  const [sensorData, setSensorData] = useState(null)

  const [safety, setSafety] = useState({ status: 'safe', nearestHazardKm: null, hazardType: null })
  const [submitState, setSubmitState] = useState('idle') 
  const [submitError, setSubmitError] = useState(null)
  const [forceOfflineDrawer, setForceOfflineDrawer] = useState(false)
  const [allocation, setAllocation] = useState(null)
  const [findingRoute, setFindingRoute] = useState(false)

  const [microHavens, setMicroHavens] = useState([])
  const [pingStatus, setPingStatus] = useState({})

  useEffect(() => {
    if (autoCoords) {
      setActiveCoords(autoCoords)
    }
  }, [autoCoords])

  async function loadMicroHavens() {
    try {
      const list = await fetchMicroHavens()
      setMicroHavens(list || [])
    } catch {
    }
  }

  useEffect(() => {
    loadMicroHavens()
    const t = setInterval(loadMicroHavens, 5000)
    return () => clearInterval(t)
  }, [])

  async function handlePingArrival(havenId) {
    setPingStatus((prev) => ({ ...prev, [havenId]: 'pinging' }))
    try {
      const res = await pingMicroHavenArrival(havenId, activeCoords)
      setPingStatus((prev) => ({
        ...prev,
        [havenId]: res.promoted
          ? 'PROMOTED: Haven elevated to ACTIVE status!'
          : `Checked In! Total arrivals: ${res.arrivalCount}`,
      }))
      loadMicroHavens()
      setTimeout(() => {
        setPingStatus((prev) => ({ ...prev, [havenId]: null }))
      }, 5000)
    } catch (err) {
      setPingStatus((prev) => ({
        ...prev,
        [havenId]: `Check-in failed: ${err.message}`,
      }))
      setTimeout(() => {
        setPingStatus((prev) => ({ ...prev, [havenId]: null }))
      }, 4000)
    }
  }

  async function findSafeDestination() {
    setFindingRoute(true)
    try {
      const res = await computeAllocation(activeCoords, victimCount)
      setAllocation(res)
    } catch {
      setAllocation({
        message: 'Safe refuge calculation fallback active: Proceed to nearest high ground or follow local authority advisories.',
        tier: 1,
      })
    } finally {
      setFindingRoute(false)
    }
  }

  useEffect(() => {
    if (!online) return
    let cancelled = false

    async function poll() {
      try {
        const result = await fetchHazardStatus(activeCoords.lat, activeCoords.lng)
        if (!cancelled) setSafety(result)
      } catch {
      }
    }

    poll()
    const id = setInterval(poll, 3000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [activeCoords.lat, activeCoords.lng, online])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!hazardType) return

    if (!online) {
      setForceOfflineDrawer(true)
      return
    }

    setSubmitState('sending')
    setSubmitError(null)
    try {
      await submitReport({
        userId: `citizen-${activeCoords.lat.toFixed(2)}-live`,
        hazardType,
        description,
        coordinates: activeCoords,
        victimCount,
        photo,
        sensorTelemetry: sensorData,
      })
      setSubmitState('done')
      setHazardType('')
      setDescription('')
      setPhoto(null)
      setSensorData(null)
      setTimeout(() => setSubmitState('idle'), 5000)
    } catch (err) {
      setSubmitState('error')
      setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong sending your report.')
      if (err instanceof ApiError && err.statusCode === 0) setForceOfflineDrawer(true)
    }
  }

  return (
    <div className="min-h-screen pb-12" style={{ background: 'var(--paper)' }}>
      <SOSHeader status={safety.status} nearestHazardKm={safety.nearestHazardKm} online={online} />

      <div className="max-w-xl mx-auto px-5 py-6 space-y-5">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft size={14} /> Back to role select
        </Link>

        {geoError && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <TriangleAlert size={14} className="shrink-0 text-amber-600" />
            <span>{geoError}</span>
          </div>
        )}

        {/* Dynamic Multi-Tier Safe Routing & Allocation (Features 3 & 6) */}
        <div
          className="rounded-2xl p-5 space-y-3 shadow-sm"
          style={{ background: 'var(--paper-raised)', border: '1px solid var(--paper-line)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <Route size={15} style={{ color: 'var(--signal)' }} /> Safe Refuge & Routing (Multi-Tier)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dynamic spatial optimizer avoiding verified flood/hazard zones across Tier 1, 2, & 3.
              </p>
            </div>
            <button
              type="button"
              onClick={findSafeDestination}
              disabled={findingRoute}
              className="shrink-0 rounded-xl px-4 py-2.5 text-xs font-medium text-white shadow transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--ink)' }}
            >
              {findingRoute ? 'Routing…' : 'Calculate Route'}
            </button>
          </div>

          {allocation && (
            <div
              className="p-4 rounded-xl text-xs space-y-2 mt-2"
              style={{
                background: allocation.tier === 3 ? 'rgba(220, 38, 38, 0.08)' : allocation.tier === 2 ? 'rgba(59, 130, 246, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                border: `1px solid ${allocation.tier === 3 ? 'var(--hazard)' : allocation.tier === 2 ? '#3B82F6' : 'var(--safe)'}`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[11px] uppercase tracking-wider text-slate-800">
                  {allocation.tierLabel || `Tier ${allocation.tier} Safe Path`}
                </span>
                <span className="font-mono text-xs font-bold text-slate-900">
                  {allocation.distanceKm} km away
                </span>
              </div>

              <p className="text-slate-800 font-medium leading-relaxed">
                {allocation.message}
              </p>

              {allocation.safetyAdvisory && (
                <p className="text-[11px] text-slate-600 bg-white/70 p-2 rounded-lg border border-slate-200">
                  ⚠️ <strong>Advisory:</strong> {allocation.safetyAdvisory}
                </p>
              )}

              {allocation.resource && (
                <div className="flex items-center gap-2 font-mono text-[11px] text-orange-800 pt-1">
                  <Truck size={13} /> Dispatched: <strong>{allocation.resource.name}</strong> (ETA ~{allocation.estimatedEtaMinutes} min)
                </div>
              )}
            </div>
          )}
        </div>

        {}
        <div
          className="rounded-2xl p-6 space-y-5 shadow-sm"
          style={{ background: 'var(--paper-raised)', border: '1px solid var(--paper-line)' }}
        >
          <div className="space-y-1">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Transmit Emergency Report
            </h2>
            <p className="text-xs text-slate-500">
              Live evidence photo is cryptographically sealed with hardware sensors and cell tower handshakes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <ReportForm
              hazardType={hazardType}
              setHazardType={setHazardType}
              description={description}
              setDescription={setDescription}
              coordinates={activeCoords}
              setCoordinates={setActiveCoords}
              victimCount={victimCount}
              setVictimCount={setVictimCount}
            />

            <CameraCapture
              photo={photo}
              setPhoto={setPhoto}
              onSensorDataCaptured={(s) => setSensorData(s)}
            />

            {submitState === 'error' && (
              <div className="p-3 rounded-xl text-xs bg-red-50 border border-red-200 text-red-700">
                {submitError}
              </div>
            )}

            {submitState === 'done' && (
              <div className="p-3.5 rounded-xl text-xs bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center gap-2">
                <Check size={16} className="text-emerald-600 shrink-0" />
                <span>Report authenticated & transmitted! Peer-mesh consensus engine is grouping with nearby telemetry.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!hazardType || submitState === 'sending'}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-md disabled:opacity-40 transition-all hover:opacity-95"
              style={{ background: 'var(--signal)' }}
            >
              <Send size={15} />
              {submitState === 'sending' ? 'Transmitting & running anti-spoof checks…' : 'Transmit Emergency Report'}
            </button>
          </form>
        </div>

        {/* Crowdsourced Micro-Haven Discovery & Geofence Check-in (Feature 5) */}
        <div
          className="rounded-2xl p-5 space-y-3 shadow-sm"
          style={{ background: 'var(--paper-raised)', border: '1px solid var(--paper-line)' }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Home size={15} style={{ color: '#3B82F6' }} /> Community Micro-Havens (Tier 2)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
              Geofence Consensus Active
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Unlisted safe zones (high roofs, temples, reinforced halls). Pinging your arrival within 150m automatically elevates haven status.
          </p>

          <div className="space-y-2.5 pt-1">
            {microHavens.map((h) => (
              <div
                key={h.id || h.shelterId}
                className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col justify-between gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-display text-sm font-semibold text-slate-900">{h.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{h.notes || 'Elevated rooftop/safe hall.'}</p>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-600 mt-1">
                      <span>Cap: {h.currentOccupancy}/{h.maxCapacity}</span>
                      <span>•</span>
                      <span>{h.arrivalCount || 0} Arrivals Verified</span>
                    </div>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0"
                    style={{
                      background: h.verificationStatus === 'ACTIVE' || h.verificationStatus === 'VERIFIED' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                      color: h.verificationStatus === 'ACTIVE' || h.verificationStatus === 'VERIFIED' ? '#059669' : '#D97706',
                    }}
                  >
                    {h.verificationStatus || 'REGISTERED'}
                  </span>
                </div>

                <div className="pt-1.5 flex items-center justify-between border-t border-slate-100">
                  <span className="text-[10px] font-mono text-slate-400">
                    Contact: {h.contactPhone || 'Local Community Lead'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePingArrival(h.id || h.shelterId)}
                    disabled={pingStatus[h.id || h.shelterId] === 'pinging'}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {pingStatus[h.id || h.shelterId] === 'pinging' ? 'Checking in…' : "I'm Here (Check In)"}
                  </button>
                </div>

                {pingStatus[h.id || h.shelterId] && pingStatus[h.id || h.shelterId] !== 'pinging' && (
                  <div className="text-[11px] font-mono p-1.5 rounded bg-blue-50 text-blue-800">
                    {pingStatus[h.id || h.shelterId]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {}
        <RecentReportsFeed />

        {/* SMS / WhatsApp Offline Gateway */}
        <OfflineDrawer
          hazardType={hazardType}
          description={description}
          coordinates={activeCoords}
          victimCount={victimCount}
          forceOpen={forceOfflineDrawer || !online}
        />
      </div>
    </div>
  )
}