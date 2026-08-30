import { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck,
  Ban,
  XCircle,
  Sparkles,
  CheckCheck,
  Filter,
  RefreshCw,
  Clock,
  MapPin,
  Camera,
  Maximize2,
  Building2,
  FileCheck,
  Radio,
  MessageSquareText,
  Smartphone,
  PhoneCall,
  ShieldAlert,
  Cpu,
} from 'lucide-react'
import { fetchMediaQueue, verifyReport, verifyShelter, verifyOfficer, batchVerifyReports } from '../../lib/api.js'

function ChannelBadge({ channel }) {
  const ch = (channel || 'APP').toUpperCase()
  if (ch === 'WHATSAPP') {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-950 text-sky-300 border border-sky-800 flex items-center gap-1">
        <MessageSquareText size={10} /> WhatsApp
      </span>
    )
  }
  if (ch === 'SMS') {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
        <Smartphone size={10} /> SMS
      </span>
    )
  }
  if (ch === 'IVR') {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1">
        <PhoneCall size={10} /> IVR Voice
      </span>
    )
  }
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
      <Smartphone size={10} /> Mobile App
    </span>
  )
}

export default function AdminVerificationHub({ onDataChanged }) {
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('ALL')
  const [filterChannel, setFilterChannel] = useState('ALL') 
  const [filterStatus, setFilterStatus] = useState('PENDING_REVIEW') 
  const [zoomedImage, setZoomedImage] = useState(null)
  const [actionLoading, setActionLoading] = useState({})
  const [successToast, setSuccessToast] = useState(null)

  const loadQueue = useCallback(async () => {
    try {
      const data = await fetchMediaQueue()
      setQueue(data || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadQueue()
    const timer = setInterval(loadQueue, 3500)
    return () => clearInterval(timer)
  }, [loadQueue])

  function showToast(msg) {
    setSuccessToast(msg)
    setTimeout(() => setSuccessToast(null), 3000)
  }

  async function handleVerify(item) {
    setActionLoading((p) => ({ ...p, [item.id]: true }))
    try {
      if (item.entityType === 'REPORT') {
        await verifyReport(item.entityId, 'VERIFY')
      } else if (item.entityType === 'SHELTER') {
        await verifyShelter(item.entityId, 'VERIFY')
      } else if (item.entityType === 'OFFICER_ID') {
        await verifyOfficer(item.entityId, 'VERIFY')
      }
      showToast(`Verified ${item.title}`)
      loadQueue()
      onDataChanged?.()
    } catch (err) {
      alert(err.message || 'Action failed')
    } finally {
      setActionLoading((p) => ({ ...p, [item.id]: false }))
    }
  }

  async function handleReject(item) {
    setActionLoading((p) => ({ ...p, [item.id]: true }))
    try {
      if (item.entityType === 'REPORT') {
        await verifyReport(item.entityId, 'REJECT')
      } else if (item.entityType === 'SHELTER') {
        await verifyShelter(item.entityId, 'REJECT')
      } else if (item.entityType === 'OFFICER_ID') {
        await verifyOfficer(item.entityId, 'REJECT')
      }
      showToast(`Rejected ${item.title}`)
      loadQueue()
      onDataChanged?.()
    } catch (err) {
      alert(err.message || 'Action failed')
    } finally {
      setActionLoading((p) => ({ ...p, [item.id]: false }))
    }
  }

  async function handleBlacklist(item) {
    if (!confirm('This will block the reporter device and phone number for 24 hours. Proceed?')) return
    setActionLoading((p) => ({ ...p, [item.id]: true }))
    try {
      if (item.entityType === 'REPORT') {
        await verifyReport(item.entityId, 'BLACKLIST', 'Prank / Adversarial alert confirmed by Authority')
      }
      showToast(`Blacklisted submitter of ${item.title} for 24 hours`)
      loadQueue()
      onDataChanged?.()
    } catch (err) {
      alert(err.message || 'Action failed')
    } finally {
      setActionLoading((p) => ({ ...p, [item.id]: false }))
    }
  }

  async function handleBatchApproveHighConfidence() {
    const highConfReportIds = queue
      .filter((i) => i.entityType === 'REPORT' && (i.status === 'PENDING' || i.imageStatus === 'PENDING_REVIEW') && !i.isSpoofed && (i.aiAnalysis?.confidence >= 90 || i.trustScore >= 90))
      .map((i) => i.entityId)

    if (highConfReportIds.length === 0) {
      alert('No high-confidence AI items currently pending approval.')
      return
    }

    try {
      await batchVerifyReports(highConfReportIds)
      showToast(`Batch-verified ${highConfReportIds.length} high-confidence incidents!`)
      loadQueue()
      onDataChanged?.()
    } catch (err) {
      alert(err.message || 'Batch verification failed')
    }
  }

  const isPendingStatus = (item) => {
    const s = (item.status || '').toUpperCase()
    const imgS = (item.imageStatus || '').toUpperCase()
    return (
      s === 'PENDING' ||
      s === 'PENDING_REVIEW' ||
      s === 'PENDING_APPROVAL' ||
      s === 'REGISTERED' ||
      s === 'UNVERIFIED' ||
      imgS === 'PENDING_REVIEW' ||
      imgS === 'PENDING_APPROVAL' ||
      imgS === 'REGISTERED'
    )
  }

  const isVerifiedStatus = (item) => {
    const s = (item.status || '').toUpperCase()
    const imgS = (item.imageStatus || '').toUpperCase()
    return s === 'VERIFIED' || s === 'ACTIVE' || imgS === 'VERIFIED'
  }

  const isRejectedStatus = (item) => {
    const s = (item.status || '').toUpperCase()
    const imgS = (item.imageStatus || '').toUpperCase()
    return s === 'REJECTED' || s === 'BLACKLISTED' || imgS === 'REJECTED'
  }

  const filtered = queue.filter((item) => {
    if (filterType !== 'ALL' && item.entityType !== filterType) return false
    if (filterChannel !== 'ALL' && (item.channel || 'APP') !== filterChannel) return false
    if (filterStatus === 'PENDING_REVIEW') return isPendingStatus(item)
    if (filterStatus === 'VERIFIED') return isVerifiedStatus(item)
    if (filterStatus === 'REJECTED') return isRejectedStatus(item)
    return true
  })

  const pendingCount = queue.filter(isPendingStatus).length

  const highConfCount = queue.filter(
    (i) => isPendingStatus(i) && !i.isSpoofed && (i.aiAnalysis?.confidence >= 85 || i.trustScore >= 80),
  ).length

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--ink)' }}>
      {}
      {successToast && (
        <div
          className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium text-white flex items-center gap-2 animate-bounce"
          style={{ background: 'var(--safe)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          <CheckCheck size={16} /> {successToast}
        </div>
      )}

      {}
      <div
        className="p-5 flex flex-wrap items-center justify-between gap-4 shrink-0"
        style={{ borderBottom: '1px solid var(--ink-line)', background: 'var(--ink-raised)' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: 'var(--signal)' }} />
            <h2 className="text-base font-display font-semibold text-white">
              Adversarial-Proof Verification & Media Queue
            </h2>
            {pendingCount > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold text-white"
                style={{ background: 'var(--signal)' }}
              >
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>
            Inspect cell tower handshakes, anti-spoofing flags, hardware sensor locks, and multi-channel emergency feeds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {highConfCount > 0 && (
            <button
              onClick={handleBatchApproveHighConfidence}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-1.5 shadow transition-transform hover:scale-105"
              style={{ background: 'var(--safe)' }}
            >
              <CheckCheck size={14} /> Batch Approve Verified ({highConfCount})
            </button>
          )}

          <button
            onClick={loadQueue}
            className="p-2 rounded-lg text-slate-300 hover:text-white transition-colors"
            style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}
            title="Refresh verification queue"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {}
      <div
        className="px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0"
        style={{ background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid var(--ink-line)' }}
      >
        <div className="flex items-center gap-2">
          <Filter size={13} style={{ color: 'var(--mist)' }} />
          <span className="font-mono text-[11px] uppercase" style={{ color: 'var(--mist)' }}>
            Category:
          </span>
          {[
            ['ALL', 'All Submissions'],
            ['REPORT', 'Incidents'],
            ['SHELTER', 'Shelters'],
            ['OFFICER_ID', 'Officer IDs'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              className="px-2.5 py-1 rounded-md transition-all font-mono text-[11px]"
              style={{
                background: filterType === key ? 'var(--signal)' : 'transparent',
                color: filterType === key ? 'white' : 'var(--mist)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase" style={{ color: 'var(--mist)' }}>
            Channel:
          </span>
          {[
            ['ALL', 'All'],
            ['APP', '📱 App'],
            ['SMS', '✉️ SMS'],
            ['WHATSAPP', '💬 WhatsApp'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterChannel(key)}
              className="px-2 py-0.5 rounded font-mono text-[10px] transition-all"
              style={{
                background: filterChannel === key ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: filterChannel === key ? 'white' : 'var(--mist)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {}
      <div className="flex-1 overflow-y-auto p-5">
        {filtered.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center space-y-2">
            <FileCheck size={36} style={{ color: 'var(--safe)' }} />
            <p className="text-sm font-medium text-white">Queue is clear</p>
            <p className="text-xs" style={{ color: 'var(--mist)' }}>
              No submissions match the selected filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((item) => {
              const isPending =
                item.status === 'PENDING' || item.imageStatus === 'PENDING_REVIEW' || item.status === 'REGISTERED'
              const aiConf = item.aiAnalysis?.confidence ?? item.trustScore ?? 50
              const aiColor = item.isSpoofed ? 'var(--hazard)' : aiConf >= 85 ? 'var(--safe)' : aiConf >= 60 ? 'var(--caution)' : 'var(--hazard)'

              return (
                <div
                  key={item.id}
                  className="rounded-xl overflow-hidden flex flex-col justify-between transition-all hover:shadow-xl"
                  style={{
                    background: 'var(--ink-raised)',
                    border: item.isSpoofed ? '2px solid var(--hazard)' : isPending ? '1px solid var(--signal-dim)' : '1px solid var(--ink-line)',
                  }}
                >
                  {}
                  <div className="relative aspect-video bg-black/60 overflow-hidden group">
                    {item.photo ? (
                      <img
                        src={item.photo}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                        onClick={() => setZoomedImage(item)}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4">
                        <Camera size={24} style={{ color: 'var(--mist)' }} />
                        <span className="text-xs font-mono">No Image Telemetry</span>
                      </div>
                    )}

                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <ChannelBadge channel={item.channel} />
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      {item.isSpoofed ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white shadow animate-pulse flex items-center gap-1">
                          <ShieldAlert size={11} /> SPOOF DETECTED
                        </span>
                      ) : (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold text-white shadow"
                          style={{
                            background:
                              item.status === 'VERIFIED'
                                ? 'var(--safe)'
                                : item.status === 'REJECTED' || item.status === 'BLACKLISTED'
                                  ? 'var(--hazard)'
                                  : 'var(--caution)',
                          }}
                        >
                          {item.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display text-sm font-semibold text-white leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={{ color: 'var(--mist)' }}>
                        {item.description}
                      </p>

                      {/* Submitter & Location Meta */}
                      <div className="mt-2.5 space-y-1 font-mono text-[11px]" style={{ color: 'var(--mist)' }}>
                        <div className="flex items-center gap-1.5 text-amber-300">
                          <Cpu size={11} style={{ color: 'var(--signal)' }} />
                          DEV ID: {item.deviceId || item.submitter || 'DEV-AUTO'}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={11} />
                          {new Date(item.submittedAt).toLocaleString()}
                        </div>
                        {item.coordinates && (
                          <div className="flex items-center gap-1.5">
                            <MapPin size={11} />
                            {item.coordinates.lat.toFixed(4)}, {item.coordinates.lng.toFixed(4)}
                          </div>
                        )}
                      </div>

                      {}
                      {item.towerDetails && (
                        <div
                          className="mt-2 p-2 rounded text-[10px] font-mono"
                          style={{
                            background: item.isSpoofed ? 'rgba(220,38,38,0.2)' : 'rgba(0,0,0,0.3)',
                            border: `1px solid ${item.isSpoofed ? 'var(--hazard)' : 'var(--ink-line)'}`,
                            color: item.isSpoofed ? '#FCA5A5' : 'var(--mist)',
                          }}
                        >
                          {item.isSpoofed ? '⚠️ ' : '📡 '}{item.towerDetails}
                        </div>
                      )}

                      {/* Trust Score Breakdown */}
                      <div
                        className="mt-2.5 p-2.5 rounded-lg space-y-1.5"
                        style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--ink-line)' }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-white">
                            <Sparkles size={12} style={{ color: aiColor }} /> Automated Trust Score:
                          </span>
                          <span className="font-mono text-xs font-bold" style={{ color: aiColor }}>
                            {item.trustScore ?? 50}%
                          </span>
                        </div>

                        {item.aiAnalysis?.detectedFeatures && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.aiAnalysis.detectedFeatures.map((feat, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-1.5 py-0.5 rounded text-slate-300"
                                style={{ background: 'rgba(255,255,255,0.06)' }}
                              >
                                ✓ {feat}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 flex gap-2" style={{ borderTop: '1px solid var(--ink-line)' }}>
                      <button
                        onClick={() => handleVerify(item)}
                        disabled={actionLoading[item.id] || item.status === 'VERIFIED'}
                        className="flex-1 py-1.5 rounded-md text-xs font-medium text-white flex items-center justify-center gap-1 disabled:opacity-40 transition-all hover:opacity-90"
                        style={{ background: 'var(--safe)' }}
                      >
                        <ShieldCheck size={13} /> {item.status === 'VERIFIED' ? 'Verified' : 'Approve'}
                      </button>

                      <button
                        onClick={() => handleReject(item)}
                        disabled={actionLoading[item.id] || item.status === 'REJECTED'}
                        className="py-1.5 px-3 rounded-md text-xs font-medium text-white flex items-center justify-center gap-1 disabled:opacity-40 transition-all hover:opacity-90"
                        style={{ background: 'rgba(185,71,59,0.3)', border: '1px solid var(--hazard)' }}
                      >
                        <XCircle size={13} /> Reject
                      </button>

                      {item.entityType === 'REPORT' && (
                        <button
                          onClick={() => handleBlacklist(item)}
                          disabled={actionLoading[item.id] || item.status === 'BLACKLISTED'}
                          className="py-1.5 px-2.5 rounded-md text-xs font-medium text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                          style={{ background: 'var(--ink)' }}
                          title="Instant 24-Hour Blacklist"
                        >
                          <Ban size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl space-y-4 p-5"
            style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--ink-line)' }}>
              <div>
                <h3 className="font-display text-base font-semibold text-white">{zoomedImage.title}</h3>
                <p className="text-xs font-mono" style={{ color: 'var(--mist)' }}>
                  Submitted by {zoomedImage.submitter} · {new Date(zoomedImage.submittedAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setZoomedImage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                style={{ background: 'var(--ink)' }}
              >
                ✕
              </button>
            </div>

            <div className="relative aspect-video max-h-[460px] bg-black rounded-lg overflow-hidden flex items-center justify-center">
              {zoomedImage.photo ? (
                <img src={zoomedImage.photo} alt={zoomedImage.title} className="max-h-full object-contain" />
              ) : (
                <p className="text-xs text-slate-400">No image data</p>
              )}
              {zoomedImage.isSpoofed && (
                <div className="absolute top-3 right-3 px-3 py-1 rounded bg-red-600 text-white font-mono text-xs font-bold animate-pulse shadow-lg flex items-center gap-1.5">
                  <ShieldAlert size={14} /> ADVERSARIAL GPS SPOOFER DETECTED
                </div>
              )}
            </div>

            {}
            <div className="grid sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-black/40 border border-slate-700 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase">Telecom RF Handshake</span>
                <span className={zoomedImage.isSpoofed ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                  {zoomedImage.towerDetails || 'Verified Carrier Gateway'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-black/40 border border-slate-700 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase">AI Confidence & Live Sensor Lock</span>
                <span className="text-amber-300 font-semibold flex items-center gap-1">
                  <Sparkles size={13} /> {zoomedImage.aiAnalysis?.confidence ?? zoomedImage.trustScore ?? 40}% Trust Score (SHA-256 Verified)
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-700">
              <button
                onClick={() => {
                  handleVerify(zoomedImage)
                  setZoomedImage(null)
                }}
                className="px-4 py-2 rounded-lg text-xs font-medium text-white flex items-center gap-1.5 shadow"
                style={{ background: 'var(--safe)' }}
              >
                <ShieldCheck size={14} /> Approve & Verify
              </button>
              <button
                onClick={() => {
                  handleReject(zoomedImage)
                  setZoomedImage(null)
                }}
                className="px-4 py-2 rounded-lg text-xs font-medium text-white flex items-center gap-1.5"
                style={{ background: 'var(--hazard)' }}
              >
                <XCircle size={14} /> Reject
              </button>
              {zoomedImage.entityType === 'REPORT' && (
                <button
                  onClick={() => {
                    handleBlacklist(zoomedImage)
                    setZoomedImage(null)
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-red-950/80 hover:text-red-300 border border-slate-600 flex items-center gap-1.5 transition-colors"
                >
                  <Ban size={14} /> 24h Blacklist
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}