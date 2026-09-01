import { useState, useEffect } from 'react'
import {
  X,
  ShieldCheck,
  Ban,
  XCircle,
  Sparkles,
  MapPin,
  Clock,
  Send,
  Camera,
  Check,
  Radio,
  Truck,
  Users,
  ShieldAlert,
  Cpu,
  Smartphone,
  PhoneCall,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from 'lucide-react'
import { fetchResources, dispatchResource } from '../../lib/api.js'
export default function IncidentDetailModal({ report, onClose, onAction, onDataChanged }) {
  const [resources, setResources] = useState([])
  const [selectedResource, setSelectedResource] = useState('')
  const [dispatching, setDispatching] = useState(false)
  const [dispatchSuccess, setDispatchSuccess] = useState(null)
  const [zoomed, setZoomed] = useState(false)
  useEffect(() => {
    fetchResources()
      .then((res) => {
        const list = res.resources || []
        setResources(list)
        const firstAvail = list.find((r) => r.available)
        if (firstAvail) setSelectedResource(firstAvail.id)
      })
      .catch(() => {})
  }, [])
  if (!report) return null
  const isVerified = report.trustStatus === 'VERIFIED'
  const isBlacklisted = report.trustStatus === 'BLACKLISTED'
  const isRejected = report.trustStatus === 'REJECTED'
  const isSpoofed = report.verification?.isSpoofed
  const trustScore = report.trustScore ?? 50
  const aiConf = report.aiAnalysis?.confidence ?? trustScore
  const aiColor = isSpoofed ? '#EF4444' : trustScore >= 80 ? '#10B981' : trustScore >= 50 ? '#F59E0B' : '#EF4444'
  async function handleDispatch(e) {
    e.preventDefault()
    if (!selectedResource) return
    setDispatching(true)
    try {
      const res = await dispatchResource(selectedResource, report.id)
      setDispatchSuccess(res.message || 'Rescue unit dispatched!')
      const updated = await fetchResources()
      setResources(updated.resources || [])
      onDataChanged?.()
      setTimeout(() => setDispatchSuccess(null), 3500)
    } catch (err) {
      alert(err.message || 'Dispatch failed')
    } finally {
      setDispatching(false)
    }
  }
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
      onClick={onClose}
    >
      {zoomed && report.photo && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg"
          onClick={(e) => {
            e.stopPropagation()
            setZoomed(false)
          }}
        >
          <div className="max-w-4xl w-full p-4 space-y-3 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between text-white pb-2 border-b border-slate-800">
              <span className="font-mono text-xs font-semibold flex items-center gap-2">
                <Camera size={14} className="text-sky-400" /> Incident #{report.id} Live Photographic Evidence
              </span>
              <button onClick={() => setZoomed(false)} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-white transition-colors">
                ✕ Close
              </button>
            </div>
            <div className="relative aspect-video max-h-[75vh] bg-black rounded-xl overflow-hidden flex items-center justify-center">
              <img src={report.photo} alt={report.hazardType} className="max-h-full max-w-full object-contain" />
              {isSpoofed && (
                <div className="absolute top-3 right-3 px-3 py-1 rounded-md bg-red-600 text-white font-mono text-xs font-bold animate-pulse shadow-lg flex items-center gap-1.5">
                  <ShieldAlert size={14} /> ADVERSARIAL GPS SPOOFER
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div
        className="max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between max-h-[92vh] select-text"
        style={{ background: 'var(--ink-raised, #0F172A)', border: '1px solid var(--ink-line, #334155)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--ink-line, #334155)', background: 'rgba(0,0,0,0.2)' }}>
          <div className="flex items-center gap-3">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0 shadow"
              style={{ background: isSpoofed ? '#EF4444' : isVerified ? '#10B981' : isBlacklisted || isRejected ? '#EF4444' : '#F59E0B' }}
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-base sm:text-lg font-bold text-white tracking-tight">
                  Incident #{report.id}: {report.hazardType}
                </h2>
                {isSpoofed ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white animate-pulse">
                    GPS SPOOFER DETECTED
                  </span>
                ) : (
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase text-white shadow-sm"
                    style={{ background: isVerified ? '#10B981' : isRejected ? '#EF4444' : isBlacklisted ? '#64748B' : '#F59E0B' }}
                  >
                    {report.trustStatus || 'PENDING'}
                  </span>
                )}
              </div>
              <p className="font-mono text-[11px] mt-0.5 text-slate-400">
                Channel: <strong className="text-slate-200">{report.verification?.channel || 'APP'}</strong> · Reported {new Date(report.createdAt || Date.now()).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700"
            title="Close inspection dialog"
          >
            <X size={17} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div
              className="aspect-video bg-black/70 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-700 cursor-pointer group shadow-inner"
              onClick={() => report.photo && setZoomed(true)}
              title={report.photo ? 'Click to inspect full image' : 'No photo uploaded'}
            >
              {report.photo ? (
                <>
                  <img src={report.photo} alt={report.hazardType} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-2.5 py-1 rounded bg-black/80 text-white font-mono text-[11px]">🔍 Click to Zoom</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-slate-400">
                  <Camera size={24} className="text-slate-500" />
                  <span className="text-xs font-mono">No Image Telemetry</span>
                </div>
              )}
              {report.verification?.liveCapture && (
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-700">
                  LIVE SENSOR HASH #SHA256
                </span>
              )}
            </div>
            <div className="space-y-2.5 flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                  On-Ground Citizen Description
                </span>
                <p className="text-xs text-slate-100 mt-1 leading-relaxed p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                  {report.description || 'No additional narrative provided.'}
                </p>
              </div>
              <div className="font-mono text-xs space-y-1.5 p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400"><Smartphone size={13} className="text-amber-400" /> Submitter ID:</span>
                  <span className="font-bold text-amber-300 font-mono">{report.userId || report.metadata?.deviceId || 'DEV-AUTO'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400"><PhoneCall size={13} className="text-sky-400" /> Contact Phone:</span>
                  <span className="font-bold text-slate-100">{report.metadata?.phoneNumber || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400"><MapPin size={13} className="text-red-400" /> Coordinates:</span>
                  <span className="text-slate-100">{report.coordinates ? `${report.coordinates.lat.toFixed(4)}°N, ${report.coordinates.lng.toFixed(4)}°E` : 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400"><Users size={13} className="text-rose-400" /> Affected Citizens:</span>
                  <span className="font-bold text-red-400">{report.victimCount || 1} {(report.victimCount || 1) === 1 ? 'person' : 'people'}</span>
                </div>
              </div>
            </div>
          </div>
          <div
            className="p-3.5 rounded-xl space-y-1 text-xs font-mono"
            style={{
              background: isSpoofed ? 'rgba(220,38,38,0.18)' : 'rgba(15,23,42,0.6)',
              border: `1px solid ${isSpoofed ? '#EF4444' : '#334155'}`,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5" style={{ color: isSpoofed ? '#FCA5A5' : '#34D399' }}>
                <ShieldAlert size={14} /> Telecom Network Handshake & Cell-Tower Validation
              </span>
              <span
                className="font-bold px-2 py-0.5 rounded text-[10px]"
                style={{
                  background: isSpoofed ? '#DC2626' : '#065F46',
                  color: 'white',
                }}
              >
                {isSpoofed ? 'SPOOFED GPS' : 'VALIDATED RF TOWER'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 pt-0.5">
              {report.verification?.towerDetails || 'Serving cell tower verified.'}
            </p>
          </div>
          <div className="p-4 rounded-xl space-y-3 bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-display text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                  <Sparkles size={15} style={{ color: aiColor }} /> Multi-Factor Trust Score Engine
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Adversarial-proof weighted algorithm (Telecom RF + Hardware SHA256 + CV + Consensus)
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono text-base sm:text-lg font-bold px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: aiColor }}>
                  {trustScore}% Trust
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono pt-1">
              <div className="p-2 rounded bg-black/40 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Cell Tower Handshake:</span>
                <span className={isSpoofed ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {isSpoofed ? '✕ Spoofer Alert' : '✓ Carrier Validated'}
                </span>
              </div>
              <div className="p-2 rounded bg-black/40 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Live Hardware Seal:</span>
                <span className={report.verification?.liveCapture ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                  {report.verification?.liveCapture ? '✓ SHA-256 Sealed' : 'Standard Web'}
                </span>
              </div>
              <div className="p-2 rounded bg-black/40 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">CV Anomaly Match:</span>
                <span className="text-amber-400 font-bold">{aiConf}% Confidence</span>
              </div>
              <div className="p-2 rounded bg-black/40 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Peer Consensus:</span>
                <span className={report.clusterConsensus?.isElevated ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  {report.clusterConsensus ? report.clusterConsensus.level : 'L3 Single Report'}
                </span>
              </div>
            </div>
            {report.aiAnalysis?.detectedFeatures && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {report.aiAnalysis.detectedFeatures.map((f, i) => (
                  <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-md text-slate-300 bg-white/5 border border-white/10">
                    ✓ {f}
                  </span>
                ))}
              </div>
            )}
          </div>
          <form onSubmit={handleDispatch} className="p-3.5 rounded-xl space-y-2.5 bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-display font-medium text-white flex items-center gap-1.5">
                <Truck size={14} style={{ color: 'var(--signal, #C65B3C)' }} /> Dispatch Rescue Asset to Incident #{report.id}
              </span>
              {dispatchSuccess && (
                <span className="text-xs font-mono flex items-center gap-1 text-emerald-400 font-bold animate-pulse">
                  <Check size={13} /> {dispatchSuccess}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <select
                value={selectedResource}
                onChange={(e) => setSelectedResource(e.target.value)}
                className="flex-1 rounded-lg px-3 py-2 text-xs outline-none text-white bg-slate-800 border border-slate-700 focus:border-amber-500"
              >
                {resources.map((r) => (
                  <option key={r.id} value={r.id} disabled={!r.available}>
                    {r.name} ({r.kind}) — {r.available ? 'AVAILABLE' : 'DEPLOYED'}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={dispatching || !selectedResource}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: 'var(--signal, #C65B3C)' }}
              >
                <Send size={13} /> {dispatching ? 'Dispatching…' : 'Deploy Team'}
              </button>
            </div>
          </form>
        </div>
        <div className="p-4 flex flex-wrap gap-2.5 shrink-0 bg-slate-900/95" style={{ borderTop: '1px solid var(--ink-line, #334155)' }}>
          {isVerified ? (
            <div className="flex-1 py-2.5 px-4 rounded-lg text-xs font-bold text-emerald-200 bg-emerald-950/80 border border-emerald-700 flex items-center justify-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" /> Confirmed Verified Incident (Permanent Status)
            </div>
          ) : isRejected ? (
            <div className="flex-1 py-2.5 px-4 rounded-lg text-xs font-bold text-rose-200 bg-rose-950/80 border border-rose-800 flex items-center justify-center gap-2">
              <XCircle size={16} className="text-rose-400" /> False Alarm / Rejected
            </div>
          ) : isBlacklisted ? (
            <div className="flex-1 py-2.5 px-4 rounded-lg text-xs font-bold text-slate-300 bg-slate-900 border border-slate-700 flex items-center justify-center gap-2">
              <Ban size={16} className="text-red-400" /> Blacklisted Submitter Device
            </div>
          ) : (
            <>
              <button
                onClick={() => {
                  onAction(report.id, 'VERIFY', 'Verified and confirmed high-confidence by Authority')
                  onClose()
                }}
                className="flex-1 min-w-[130px] py-2.5 px-4 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow transition-transform active:scale-95 bg-emerald-600 hover:bg-emerald-500"
                title="Mark as Verified Hazard and broadcast to all units"
              >
                <ShieldCheck size={15} /> Approve & Verify
              </button>
              <button
                onClick={() => {
                  onAction(report.id, 'REJECT', 'Dismissed as false alarm by Officer')
                  onClose()
                }}
                className="py-2.5 px-4 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors bg-rose-950/70 hover:bg-rose-900 border border-rose-800"
                title="Mark as False Alarm / Non-Hazard"
              >
                <XCircle size={15} /> False Alarm / Reject
              </button>
              <button
                onClick={() => {
                  const note = prompt('Enter blacklisting reason (e.g. Adversarial spoofer / spam):', 'Adversarial prank alert')
                  if (note !== null) {
                    onAction(report.id, 'BLACKLIST', note)
                    onClose()
                  }
                }}
                className="py-2.5 px-3.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-red-950 border border-slate-700 hover:border-red-800 flex items-center justify-center gap-1.5 transition-colors"
                title="Instant 24-Hour Blacklist submitter device & phone"
              >
                <Ban size={15} /> 24h Blacklist
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
