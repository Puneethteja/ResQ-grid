import { useState } from 'react'
import {
  Building2,
  ShieldCheck,
  Droplets,
  Zap,
  Cross,
  Radio,
  Clock,
  MapPin,
  Users,
  Check,
  XCircle,
  AlertTriangle,
  Camera,
} from 'lucide-react'
import { verifyShelter } from '../../lib/api.js'

export default function SheltersManagementGrid({ shelters = [], onDataChanged }) {
  const [filter, setFilter] = useState('ALL') 
  const [verifyingId, setVerifyingId] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const pendingCount = shelters.filter(
    (s) => s.verificationStatus === 'PENDING_APPROVAL' || s.verificationStatus === 'REGISTERED' || s.verificationStatus === 'PENDING',
  ).length

  const list = shelters.filter((s) => {
    if (filter === 'PENDING') {
      return s.verificationStatus === 'PENDING_APPROVAL' || s.verificationStatus === 'REGISTERED' || s.verificationStatus === 'PENDING'
    }
    if (filter === 'TIER1') return (s.tier ?? 1) === 1
    if (filter === 'TIER2') return s.tier === 2
    return true
  })

  async function handleVerify(shelterId, action) {
    setVerifyingId(shelterId)
    try {
      await verifyShelter(shelterId, action)
      setSuccessMsg(`Shelter ${action === 'VERIFY' ? 'Approved & Activated' : 'Rejected'}`)
      setTimeout(() => setSuccessMsg(null), 3000)
      onDataChanged?.()
    } catch (err) {
      alert(err.message || 'Verification update failed')
    } finally {
      setVerifyingId(null)
    }
  }

  const totalCap = shelters.reduce((acc, s) => acc + (s.maxCapacity || 0), 0)
  const currentOcc = shelters.reduce((acc, s) => acc + (s.currentOccupancy || 0), 0)
  const availCap = Math.max(0, totalCap - currentOcc)

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--ink)' }}>
      {}
      {successMsg && (
        <div
          className="fixed top-5 right-5 z-50 px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-xl flex items-center gap-2 animate-bounce"
          style={{ background: 'var(--safe)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          <Check size={14} /> {successMsg}
        </div>
      )}

      {}
      <div
        className="p-5 flex flex-wrap items-center justify-between gap-4 shrink-0"
        style={{ borderBottom: '1px solid var(--ink-line)', background: 'var(--ink-raised)' }}
      >
        <div>
          <h2 className="text-base font-display font-semibold text-white flex items-center gap-2">
            <Building2 size={18} style={{ color: 'var(--signal)' }} /> Safe Haven & Shelter Network
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>
            Authority approval hub, capacity monitoring, and infrastructure heartbeat supervisor.
          </p>
        </div>

        {}
        <div className="flex items-center gap-6 text-xs font-mono">
          {pendingCount > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-700/80 text-amber-300 flex items-center gap-1.5">
              <AlertTriangle size={13} />
              <span><strong>{pendingCount}</strong> Pending Authority Approval</span>
            </div>
          )}
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Active Havens</span>
            <span className="text-sm font-bold text-white">{shelters.length} Nodes</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Total District Capacity</span>
            <span className="text-sm font-bold text-white">{totalCap} Evacuees</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Available Capacity</span>
            <span className="text-sm font-bold text-emerald-400">{availCap} Open Beds</span>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="px-5 py-2.5 flex items-center gap-2 text-xs shrink-0" style={{ background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid var(--ink-line)' }}>
        {[
          ['ALL', `All Havens (${shelters.length})`],
          ['PENDING', `Pending Approval (${pendingCount})`],
          ['TIER1', `Official Shelters (${shelters.filter((s) => (s.tier ?? 1) === 1).length})`],
          ['TIER2', `Tier 2 Micro-Havens (${shelters.filter((s) => s.tier === 2).length})`],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="px-3 py-1 rounded-md font-mono text-[11px] transition-all flex items-center gap-1.5"
            style={{
              background: filter === key ? 'var(--signal)' : 'transparent',
              color: filter === key ? 'white' : 'var(--mist)',
            }}
          >
            {key === 'PENDING' && pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
            {label}
          </button>
        ))}
      </div>

      {}
      <div className="flex-1 overflow-y-auto p-5">
        {list.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
            <ShieldCheck size={36} style={{ color: 'var(--safe)' }} />
            <p className="text-sm font-medium text-white">No shelters match this filter</p>
            <p className="text-xs">All pending submissions have been processed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {list.map((s) => {
              const shelterId = s.shelterId || s.id
              const isTier1 = (s.tier ?? 1) === 1
              const isVerified = s.verificationStatus === 'VERIFIED' || s.verificationStatus === 'ACTIVE'
              const isPending = s.verificationStatus === 'PENDING_APPROVAL' || s.verificationStatus === 'REGISTERED'
              const isRejected = s.verificationStatus === 'REJECTED'
              const isFull = s.isFull || s.currentOccupancy >= s.maxCapacity || s.closed
              const pct = s.maxCapacity > 0 ? Math.min(100, Math.round((s.currentOccupancy / s.maxCapacity) * 100)) : 0
              const capColor = isFull ? 'var(--hazard)' : pct >= 75 ? 'var(--caution)' : 'var(--safe)'

              return (
                <div
                  key={shelterId}
                  className="rounded-xl overflow-hidden p-5 flex flex-col justify-between space-y-4 shadow-lg transition-all"
                  style={{
                    background: 'var(--ink-raised)',
                    border: isPending ? '1.5px solid var(--signal)' : '1px solid var(--ink-line)',
                  }}
                >
                  <div>
                    {/* Top line with Tier & Verification */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase text-white"
                        style={{ background: isTier1 ? 'var(--signal)' : '#3B82F6' }}
                      >
                        {isTier1 ? 'Tier 1 Official Shelter' : 'Tier 2 Micro-Haven'}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold"
                        style={{
                          background: isVerified
                            ? 'rgba(16,185,129,0.2)'
                            : isRejected
                            ? 'rgba(239,68,68,0.2)'
                            : 'rgba(245,158,11,0.25)',
                          color: isVerified ? '#34D399' : isRejected ? '#F87171' : '#FBBF24',
                          border: `1px solid ${isVerified ? '#059669' : isRejected ? '#DC2626' : '#D97706'}`,
                        }}
                      >
                        {isVerified ? '✓ VERIFIED' : isRejected ? '✕ REJECTED' : '⧗ PENDING APPROVAL'}
                      </span>
                    </div>

                    <h3 className="font-display text-base font-semibold text-white mt-2.5 leading-snug">
                      {s.name}
                    </h3>

                    {s.coordinates && (
                      <div className="flex items-center gap-1.5 text-xs font-mono mt-1" style={{ color: 'var(--mist)' }}>
                        <MapPin size={12} style={{ color: 'var(--signal)' }} />
                        {s.coordinates.lat.toFixed(4)}° N, {s.coordinates.lng.toFixed(4)}° E
                      </div>
                    )}

                    {/* Photo Preview if attached */}
                    {s.verificationPhoto ? (
                      <div className="mt-3 aspect-video rounded-lg overflow-hidden border border-slate-700">
                        <img src={s.verificationPhoto} alt={s.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="mt-2 text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <Camera size={11} /> No verification image attached
                      </div>
                    )}

                    {/* Occupancy progress bar */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-300 flex items-center gap-1">
                          <Users size={13} /> Occupancy
                        </span>
                        <span className="font-bold text-white">
                          {s.currentOccupancy} / {s.maxCapacity} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--ink)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${s.closed ? 100 : pct}%`, background: capColor }} />
                      </div>
                    </div>

                    {/* Infrastructure Vitals */}
                    <div className="mt-4 pt-3 grid grid-cols-3 gap-2 border-t" style={{ borderColor: 'var(--ink-line)' }}>
                      <div className="p-2 rounded-lg text-center" style={{ background: 'var(--ink)' }}>
                        <Zap size={13} className="mx-auto mb-0.5" style={{ color: s.powerStatus === 'ACTIVE' ? 'var(--safe)' : 'var(--hazard)' }} />
                        <span className="text-[10px] font-mono text-slate-300 block">Power</span>
                        <span className="text-[9px] font-mono text-slate-400">{s.powerStatus || 'ACTIVE'}</span>
                      </div>
                      <div className="p-2 rounded-lg text-center" style={{ background: 'var(--ink)' }}>
                        <Droplets size={13} className="mx-auto mb-0.5" style={{ color: s.waterStatus === 'ACTIVE' ? 'var(--safe)' : 'var(--hazard)' }} />
                        <span className="text-[10px] font-mono text-slate-300 block">Water</span>
                        <span className="text-[9px] font-mono text-slate-400">{s.waterStatus || 'ACTIVE'}</span>
                      </div>
                      <div className="p-2 rounded-lg text-center" style={{ background: 'var(--ink)' }}>
                        <Cross size={13} className="mx-auto mb-0.5" style={{ color: s.medicalStatus === 'ACTIVE' ? 'var(--safe)' : 'var(--caution)' }} />
                        <span className="text-[10px] font-mono text-slate-300 block">Medical</span>
                        <span className="text-[9px] font-mono text-slate-400">{s.medicalStatus || 'ACTIVE'}</span>
                      </div>
                    </div>

                    {s.notes && (
                      <p className="mt-2.5 text-xs text-slate-400 italic">
                        "{s.notes}"
                      </p>
                    )}
                  </div>

                  {}
                  <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--ink-line)' }}>
                    <div className="flex items-center justify-between text-[11px] font-mono" style={{ color: 'var(--mist)' }}>
                      <span className="flex items-center gap-1">
                        <Radio size={11} className="heartbeat-dot text-emerald-400" />
                        {s.heartbeatTimestamp ? `Ping ${new Date(s.heartbeatTimestamp).toLocaleTimeString()}` : 'Live Node'}
                      </span>
                    </div>

                    {!isVerified && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleVerify(shelterId, 'VERIFY')}
                          disabled={verifyingId === shelterId}
                          className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 shadow transition-all hover:opacity-90 disabled:opacity-50"
                          style={{ background: 'var(--safe)' }}
                        >
                          <ShieldCheck size={14} /> Approve Shelter
                        </button>
                        <button
                          onClick={() => handleVerify(shelterId, 'REJECT')}
                          disabled={verifyingId === shelterId || isRejected}
                          className="py-2 px-3 rounded-lg text-xs font-medium text-rose-300 bg-rose-950/40 border border-rose-800 flex items-center justify-center gap-1 hover:bg-rose-900/60 disabled:opacity-50 transition-colors"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}