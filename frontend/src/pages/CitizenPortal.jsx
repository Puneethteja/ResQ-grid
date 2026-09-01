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
  CloudLightning,
  AlertOctagon,
  Phone,
  UserCheck,
  User,
  ShieldAlert,
  Zap,
  Clock,
  Compass,
  Lock,
  LogOut,
  Smartphone,
} from 'lucide-react'
import SOSHeader from '../components/citizen/SOSHeader.jsx'
import ReportForm from '../components/citizen/ReportForm.jsx'
import CameraCapture from '../components/citizen/CameraCapture.jsx'
import OfflineDrawer from '../components/citizen/OfflineDrawer.jsx'
import RecentReportsFeed from '../components/citizen/RecentReportsFeed.jsx'
import ThemeLanguageBar from '../components/common/ThemeLanguageBar.jsx'
import { useApp } from '../context/AppContext.jsx'
import {
  submitReport,
  fetchHazardStatus,
  fetchProximityAlerts,
  fetchImdAlerts,
  computeAllocation,
  fetchMicroHavens,
  pingMicroHavenArrival,
  citizenSessionLogin,
  getStoredCitizenSession,
  clearCitizenSession,
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
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 2500, maximumAge: 5000 }
    )
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError('Location access denied — using regional center coordinates (Bhubaneswar).'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 5000 },
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
  const { t, setTheme } = useApp()
  useEffect(() => {
    setTheme('light')
  }, [setTheme])
  const { coordinates: autoCoords, error: geoError } = useGeolocation()
  const online = useOnlineStatus()
  const [activeCoords, setActiveCoords] = useState({ lat: 20.2961, lng: 85.8245 })
  const [hazardType, setHazardType] = useState('')
  const [description, setDescription] = useState('')
  const [victimCount, setVictimCount] = useState(1)
  const [photo, setPhoto] = useState(null)
  const [sensorData, setSensorData] = useState(null)
  const [citizenUser, setCitizenUser] = useState(() => getStoredCitizenSession())
  const [authName, setAuthName] = useState('')
  const [authPhone, setAuthPhone] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [proximityData, setProximityData] = useState(null)
  const [imdAlerts, setImdAlerts] = useState([])
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
  async function loadProximityAndImd() {
    try {
      const [prox, imd] = await Promise.all([
        fetchProximityAlerts(activeCoords.lat, activeCoords.lng, 5.0),
        fetchImdAlerts(),
      ])
      if (prox) {
        setProximityData(prox)
        setSafety({
          status: prox.safetyStatus === 'DANGER' ? 'hazard' : prox.safetyStatus === 'CAUTION' ? 'caution' : 'safe',
          nearestHazardKm: prox.nearbyHazards?.[0]?.distanceKm || null,
          hazardType: prox.nearbyHazards?.[0]?.hazardType || null,
        })
      }
      if (imd) setImdAlerts(imd)
    } catch {}
  }
  useEffect(() => {
    if (citizenUser) {
      loadProximityAndImd()
      const t = setInterval(loadProximityAndImd, 4000)
      return () => clearInterval(t)
    }
  }, [citizenUser, activeCoords.lat, activeCoords.lng])
  async function loadMicroHavens() {
    try {
      const list = await fetchMicroHavens()
      setMicroHavens(list || [])
    } catch {}
  }
  useEffect(() => {
    if (citizenUser) {
      loadMicroHavens()
      const t = setInterval(loadMicroHavens, 5000)
      return () => clearInterval(t)
    }
  }, [citizenUser])
  async function handleCitizenLogin(e) {
    e.preventDefault()
    if (!authName.trim() || !authPhone.trim()) return
    setAuthLoading(true)
    setAuthError(null)
    try {
      const res = await citizenSessionLogin({
        full_name: authName.trim(),
        phone_number: authPhone.trim(),
        coordinates: activeCoords,
      })
      setCitizenUser(res.citizen)
    } catch (err) {
      setAuthError(err.message || 'Phone number verification failed. Please check format.')
    } finally {
      setAuthLoading(false)
    }
  }
  function handleLogoutCitizen() {
    clearCitizenSession()
    setCitizenUser(null)
  }
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
      const citizenId = citizenUser ? citizenUser.citizen_id : `citizen-${activeCoords.lat.toFixed(2)}-live`
      await submitReport({
        userId: citizenId,
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
  if (!citizenUser) {
    return (
      <div className="min-h-screen flex flex-col justify-between p-5" style={{ background: 'var(--ink)' }}>
        <div className="max-w-md w-full mx-auto my-auto space-y-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-lg border shadow-xs transition-colors"
              style={{
                background: 'var(--ink-raised)',
                borderColor: 'var(--ink-line)',
                color: 'var(--text-primary)',
              }}
            >
              <ArrowLeft size={14} /> {t('back_to_roles')}
            </Link>
            <ThemeLanguageBar compact={true} />
          </div>
          <div
            className="rounded-3xl p-7 sm:p-8 space-y-6 shadow-2xl border"
            style={{
              background: 'var(--ink-raised)',
              borderColor: 'var(--ink-line)',
            }}
          >
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                <ShieldCheck size={26} className="text-orange-500" />
              </div>
              <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {t('citizen_auth_title')}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--mist)' }}>
                {t('citizen_auth_desc')}
              </p>
            </div>
            {authError && (
              <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-xs text-red-300 font-medium flex items-start gap-2">
                <AlertOctagon size={16} className="shrink-0 mt-0.5 text-red-400" />
                <span>{authError}</span>
              </div>
            )}
            <form onSubmit={handleCitizenLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1.5 tracking-wider" style={{ color: 'var(--text-primary)' }}>
                  {t('full_name')}
                </label>
                <input
                  type="text"
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar Patra"
                  className="w-full px-4 py-3 rounded-xl border text-base font-medium shadow-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  style={{
                    background: 'var(--ink)',
                    borderColor: 'var(--ink-line)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold uppercase mb-1.5 tracking-wider" style={{ color: 'var(--text-primary)' }}>
                  {t('mobile_number')}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    placeholder="+91 98610 12345 or 10-digit mobile"
                    className="w-full px-4 py-3 rounded-xl border text-base font-medium shadow-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    style={{
                      background: 'var(--ink)',
                      borderColor: 'var(--ink-line)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Smartphone size={18} className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthName('Ramesh Kumar Patra')
                    setAuthPhone('+91 98610 12345')
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all hover:opacity-90 active:scale-95 flex items-center gap-1.5 cursor-pointer border shadow-xs"
                  style={{
                    background: 'var(--ink)',
                    borderColor: 'var(--ink-line)',
                  }}
                >
                  <span>⚡</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">Autofill Demo Citizen</span>
                  <span className="text-[10px] text-slate-500 font-normal">(+91 98610 12345)</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-lg disabled:opacity-50 transition-all hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer"
                style={{ background: 'var(--signal, #C65B3C)' }}
              >
                <Lock size={16} />
                {authLoading ? t('verifying') : t('verify_unlock')}
              </button>
            </form>
          </div>
          <OfflineDrawer
            hazardType="EMERGENCY"
            description="Direct rescue dispatch"
            coordinates={activeCoords}
            victimCount={1}
            forceOpen={false}
          />
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen pb-12" style={{ background: 'var(--paper)' }}>
      <SOSHeader status={safety.status} nearestHazardKm={safety.nearestHazardKm} online={online} />
      <div className="max-w-xl mx-auto px-5 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft size={14} /> Back to Role Select
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono bg-emerald-50 border border-emerald-300 text-emerald-900 px-3 py-1.5 rounded-xl shadow-xs">
            <UserCheck size={14} className="text-emerald-700" />
            <div className="flex flex-col">
              <span className="font-bold text-slate-900">{citizenUser.full_name}</span>
              <span className="text-[10px] text-slate-500">{citizenUser.phone_number}</span>
            </div>
            <button
              type="button"
              onClick={handleLogoutCitizen}
              className="text-[10px] font-bold text-rose-600 hover:text-rose-800 underline ml-2 flex items-center gap-0.5"
              title="Sign Out or Switch Profile"
            >
              <LogOut size={11} /> Switch
            </button>
          </div>
        </div>
        {geoError && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <TriangleAlert size={14} className="shrink-0 text-amber-600" />
            <span>{geoError}</span>
          </div>
        )}
        {imdAlerts && imdAlerts.length > 0 && (
          <div className="space-y-2">
            {imdAlerts.map((alert) => (
              <div
                key={alert.alert_id}
                className="p-4 rounded-2xl border shadow-sm transition-all flex flex-col gap-2"
                style={{
                  background:
                    alert.severity === 'RED'
                      ? 'rgba(239, 68, 68, 0.08)'
                      : alert.severity === 'ORANGE'
                      ? 'rgba(245, 158, 11, 0.08)'
                      : 'rgba(234, 179, 8, 0.08)',
                  borderColor:
                    alert.severity === 'RED'
                      ? '#EF4444'
                      : alert.severity === 'ORANGE'
                      ? '#F59E0B'
                      : '#EAB308',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CloudLightning
                      size={17}
                      className={
                        alert.severity === 'RED'
                          ? 'text-red-600 animate-pulse'
                          : alert.severity === 'ORANGE'
                          ? 'text-amber-600'
                          : 'text-yellow-600'
                      }
                    />
                    <span
                      className="text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase"
                      style={{
                        background:
                          alert.severity === 'RED'
                            ? '#EF4444'
                            : alert.severity === 'ORANGE'
                            ? '#F59E0B'
                            : '#EAB308',
                        color: 'white',
                      }}
                    >
                      IMD {alert.severity} WARNING
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    India Meteorological Dept
                  </span>
                </div>
                <h4 className="font-display text-sm font-bold text-slate-900">{alert.title}</h4>
                <p className="text-xs text-slate-700 leading-relaxed">{alert.description}</p>
                <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span>📍 Sector: {alert.affected_area}</span>
                  <span>Active Warning Stream</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div
          className="rounded-2xl p-5 space-y-3.5 shadow-sm"
          style={{ background: 'var(--paper-raised)', border: '1px solid var(--paper-line)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass size={17} style={{ color: 'var(--signal)' }} />
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  5 km Proximity Alerting Stream
                </h3>
                <p className="text-[11px] text-slate-500">
                  Bandwidth-optimized spatial engine computing hazards within 5 km PostGIS radius.
                </p>
              </div>
            </div>
            <span
              className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full uppercase"
              style={{
                background:
                  proximityData?.safetyStatus === 'DANGER'
                    ? 'rgba(239,68,68,0.15)'
                    : proximityData?.safetyStatus === 'CAUTION'
                    ? 'rgba(245,158,11,0.15)'
                    : 'rgba(16,185,129,0.15)',
                color:
                  proximityData?.safetyStatus === 'DANGER'
                    ? '#DC2626'
                    : proximityData?.safetyStatus === 'CAUTION'
                    ? '#D97706'
                    : '#059669',
              }}
            >
              {proximityData?.safetyStatus || 'SAFE'} SECTOR
            </span>
          </div>
          {proximityData?.advisory && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-mono flex items-start gap-2.5 border shadow-xs leading-relaxed ${
                proximityData.safetyStatus === 'DANGER'
                  ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                  : proximityData.safetyStatus === 'CAUTION'
                  ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              }`}
            >
              <Radio
                size={16}
                className={`shrink-0 mt-0.5 animate-pulse ${
                  proximityData.safetyStatus === 'DANGER'
                    ? 'text-red-600'
                    : proximityData.safetyStatus === 'CAUTION'
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              />
              <span className="flex-1 min-w-0 font-medium break-words">{proximityData.advisory}</span>
            </div>
          )}
          {proximityData?.nearbyHazards && proximityData.nearbyHazards.length > 0 ? (
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Active Threats in 5 km Radius ({proximityData.nearbyHazards.length})
              </div>
              {proximityData.nearbyHazards.slice(0, 4).map((hz) => {
                const isHigh = hz.distanceKm < 1.5 || /FLOOD|COLLAPSE|FIRE|CYCLONE|EMERGENCY/i.test(hz.hazardType)
                return (
                  <div
                    key={hz.id}
                    className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs border ${
                      isHigh
                        ? 'border-red-300 bg-red-50/70 border-l-4 border-l-red-500'
                        : 'border-amber-300 bg-amber-50/70 border-l-4 border-l-amber-500'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className={`text-xs font-bold truncate flex items-center gap-1.5 ${isHigh ? 'text-red-700' : 'text-amber-800'}`}>
                        <AlertOctagon size={14} className={isHigh ? 'text-red-600 shrink-0' : 'text-amber-600 shrink-0'} />
                        <span>{hz.hazardType}</span>
                      </div>
                      {hz.description && (
                        <p className="text-[11px] text-slate-600 truncate mt-0.5">{hz.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-mono text-xs font-bold ${isHigh ? 'text-red-600' : 'text-amber-700'}`}>{hz.distanceKm} km</div>
                      <div className="text-[10px] font-mono text-slate-500">{hz.victimCount} affected</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 border-l-4 border-l-emerald-500 text-xs text-emerald-900 flex items-center gap-2.5 shadow-xs">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span className="font-medium">Sector Secure: 0 emergency hazard incidents within your immediate 5 km radius.</span>
            </div>
          )}
          {proximityData?.nearestSafeShelter && (
            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-300 border-l-4 border-l-sky-500 text-xs flex items-center justify-between shadow-xs">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-sky-700 block">
                  Nearest Verified Refuge Shelter
                </span>
                <span className="font-bold text-slate-900">{proximityData.nearestSafeShelter.name}</span>
                <div className="text-[11px] font-mono text-sky-800 mt-0.5">
                  {proximityData.nearestSafeShelter.availableCapacity} open capacity available
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold text-sky-900">
                  {proximityData.nearestSafeShelter.distanceKm} km
                </span>
              </div>
            </div>
          )}
        </div>
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
                Dynamic spatial optimizer avoiding flood/hazard zones across Tier 1, 2, & 3.
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
        <div
          className="rounded-2xl p-6 space-y-5 shadow-sm"
          style={{ background: 'var(--paper-raised)', border: '1px solid var(--paper-line)' }}
        >
          <div className="space-y-1">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Transmit Emergency Report
            </h2>
            <p className="text-xs text-slate-500">
              Live evidence photo is sealed with hardware WebRTC camera and cell tower RF handshakes.
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
              coordinates={activeCoords}
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
        <RecentReportsFeed />
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
