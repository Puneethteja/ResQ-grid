import { useState } from 'react'
import {
  ShieldCheck,
  Ban,
  Clock,
  Radio,
  Sparkles,
  Camera,
  Search,
  ChevronRight,
  ShieldAlert,
  Users,
  CheckCircle2,
  XCircle,
  Filter,
  Eye,
} from 'lucide-react'
import { batchVerifyReports } from '../../lib/api.js'

function urgencyScore(r) {
  const ageMinutes = (Date.now() - new Date(r.metadata?.timestamp || r.createdAt || Date.now()).getTime()) / 60000
  const recency = Math.max(0, 100 - ageMinutes)
  const victims = (r.victimCount || 1) * 6
  return (r.trustScore ?? 50) * 0.5 + recency * 0.3 + victims * 0.2
}

function TrustBadge({ score, status, isSpoofed }) {
  if (isSpoofed) {
    return (
      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 font-bold border border-red-800 animate-pulse">
        SPOOFED GPS
      </span>
    )
  }
  if (status === 'BLACKLISTED') {
    return (
      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold border border-slate-700">
        BANNED 24H
      </span>
    )
  }
  if (status === 'REJECTED') {
    return (
      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold border border-rose-800">
        REJECTED
      </span>
    )
  }
  const color = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444'
  return (
    <span
      className="font-mono text-[10px] px-2 py-0.5 rounded-full text-white font-bold shadow-sm"
      style={{ background: color }}
    >
      {score ?? '—'}% Trust
    </span>
  )
}

export default function TriageSidebar({
  reports = [],
  clusters = [],
  onAction,
  selectedId,
  onSelect,
  onOpenDetail,
}) {
  const [tab, setTab] = useState('PENDING') // PENDING | VERIFIED | ALL
  const [channelFilter, setChannelFilter] = useState('ALL') // ALL | APP | SMS | WHATSAPP
  const [search, setSearch] = useState('')
  const [batchLoading, setBatchLoading] = useState(false)

  const filtered = reports.filter((r) => {
    if (tab === 'PENDING' && (r.trustStatus === 'VERIFIED' || r.trustStatus === 'BLACKLISTED' || r.trustStatus === 'REJECTED')) {
      return false
    }
    if (tab === 'VERIFIED' && r.trustStatus !== 'VERIFIED') return false
    if (channelFilter !== 'ALL' && (r.verification?.channel || 'APP') !== channelFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchesHazard = r.hazardType?.toLowerCase().includes(q)
      const matchesDesc = r.description?.toLowerCase().includes(q)
      const matchesUser = r.userId?.toLowerCase().includes(q)
      if (!matchesHazard && !matchesDesc && !matchesUser) return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => urgencyScore(b) - urgencyScore(a))
  const pendingReports = reports.filter((r) => r.trustStatus === 'PENDING')
  const pendingTotal = pendingReports.length

  async function handleBatchVerifyAll() {
    if (pendingReports.length === 0) return
    setBatchLoading(true)
    try {
      const ids = pendingReports.map((r) => r.id)
      await batchVerifyReports(ids)
      for (const r of pendingReports) {
        onAction?.(r.id, 'VERIFY', 'Batch-verified by command officer')
      }
    } catch {
      for (const r of pendingReports) {
        await onAction?.(r.id, 'VERIFY', 'Batch-verified by command officer')
      }
    } finally {
      setBatchLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--ink-raised)', borderLeft: '1px solid var(--ink-line)' }}>
      {/* Header & Search */}
      <div className="p-3.5 space-y-3 shrink-0" style={{ borderBottom: '1px solid var(--ink-line)' }}>
        <div className="flex items-center justify-between">
          <span className="font-display text-sm font-semibold text-white flex items-center gap-2">
            <Radio size={14} className="heartbeat-dot text-amber-500" /> Live Incident Triage
          </span>
          <span
            className="font-mono text-[11px] px-2 py-0.5 rounded-full text-white font-bold shadow"
            style={{ background: pendingTotal > 0 ? 'var(--signal)' : 'var(--safe)' }}
          >
            {pendingTotal} Pending
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search hazards, locations, SMS texts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 rounded-lg text-xs text-white outline-none placeholder:text-slate-500 transition-all focus:ring-1 focus:ring-amber-500"
            style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}
          />
        </div>

        {}
        <div className="flex rounded-lg overflow-hidden text-[11px] font-mono p-0.5" style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}>
          {[
            ['PENDING', `Pending (${pendingTotal})`],
            ['VERIFIED', `Verified (${reports.filter((r) => r.trustStatus === 'VERIFIED').length})`],
            ['ALL', `All (${reports.length})`],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-1 py-1 text-center font-medium rounded-md transition-colors"
              style={{
                background: tab === key ? 'var(--signal)' : 'transparent',
                color: tab === key ? 'white' : 'var(--mist)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {}
        <div className="flex items-center justify-between gap-1 text-[10px] font-mono pt-0.5">
          <div className="flex items-center gap-1">
            {['ALL', 'APP', 'SMS', 'WHATSAPP'].map((ch) => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                className="px-2 py-0.5 rounded transition-colors"
                style={{
                  background: channelFilter === ch ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: channelFilter === ch ? 'white' : 'var(--mist)',
                  border: channelFilter === ch ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                }}
              >
                {ch === 'ALL' ? 'All' : ch}
              </button>
            ))}
          </div>

          {tab === 'PENDING' && pendingTotal > 1 && (
            <button
              onClick={handleBatchVerifyAll}
              disabled={batchLoading}
              className="px-2 py-0.5 rounded text-[10px] font-bold text-white bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow flex items-center gap-1"
              title="Verify all pending incidents in queue"
            >
              <CheckCircle2 size={11} /> {batchLoading ? 'Verifying…' : 'Verify All'}
            </button>
          )}
        </div>
      </div>

      {}
      <div className="flex-1 overflow-y-auto divide-y select-text" style={{ borderColor: 'var(--ink-line)' }}>
        {sorted.length === 0 && (
          <div className="px-5 py-14 text-center text-xs space-y-2" style={{ color: 'var(--mist)' }}>
            <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center bg-slate-800 text-slate-400">
              <CheckCircle2 size={20} />
            </div>
            <p className="font-medium text-slate-200">No reports matching this filter</p>
            <p className="text-[11px] text-slate-400 max-w-[240px] mx-auto">
              Incoming citizen pins, SMS/WhatsApp gateways, and micro-havens appear in real-time.
            </p>
          </div>
        )}

        {sorted.map((r) => {
          const isSpoofed = r.verification?.isSpoofed
          const consensus = r.clusterConsensus
          const isSelected = selectedId === r.id

          return (
            <div
              key={r.id}
              onClick={() => {
                onSelect?.(r.id)
                onOpenDetail?.(r)
              }}
              className="w-full text-left p-3.5 block transition-all hover:bg-white/5 cursor-pointer"
              style={{
                background: isSelected ? 'rgba(198, 91, 60, 0.12)' : 'transparent',
                borderLeft: isSelected ? '3px solid var(--signal)' : '3px solid transparent',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-display text-sm font-semibold text-white flex items-center gap-1.5 flex-wrap">
                  <span>{r.hazardType}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                    #{r.id}
                  </span>
                  {r.photo && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-sky-400 bg-sky-950/60 px-1.5 py-0.2 rounded border border-sky-800">
                      <Camera size={10} /> Live Photo
                    </span>
                  )}
                </div>
                <TrustBadge score={r.trustScore} status={r.trustStatus} isSpoofed={isSpoofed} />
              </div>

              {r.description && (
                <p className="text-xs mt-1.5 line-clamp-2 leading-relaxed text-slate-300">
                  {r.description}
                </p>
              )}

              {}
              {consensus && (
                <div className="mt-1.5">
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold inline-flex items-center gap-1"
                    style={{
                      background: consensus.isElevated ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.15)',
                      color: consensus.isElevated ? '#34D399' : '#FBBF24',
                      border: consensus.isElevated ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(251,191,36,0.3)',
                    }}
                  >
                    <Radio size={10} />
                    {consensus.isElevated
                      ? `L1 Consensus Elevated (${consensus.uniqueDevices} Devices)`
                      : `L3 Emerging Pin (${consensus.uniqueDevices} Dev)`}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between mt-2 font-mono text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock size={11} className="text-slate-500" />
                  {r.metadata?.timestamp ? new Date(r.metadata.timestamp).toLocaleTimeString() : 'Just now'}
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-200">
                  <Users size={11} className="text-red-400" />
                  {r.victimCount || 1} {(r.victimCount || 1) === 1 ? 'person' : 'people'}
                </span>
                <span className="uppercase text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                  {r.verification?.channel || 'APP'}
                </span>
              </div>

              {/* Quick Action Button Strip */}
              <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-800" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onOpenDetail?.(r)}
                  className="py-1 px-2.5 rounded text-[11px] font-bold text-amber-200 bg-amber-500/20 hover:bg-amber-500 hover:text-white border border-amber-500/40 hover:border-amber-400 flex items-center justify-center gap-1 shadow transition-all active:scale-95"
                  title="Inspect detailed evidence & calculate trust score"
                >
                  <Eye size={12} className="text-amber-400" /> Inspect
                </button>

                <button
                  onClick={() => onAction?.(r.id, 'VERIFY', 'Verified and confirmed high-confidence by Authority')}
                  disabled={r.trustStatus === 'VERIFIED'}
                  className="flex-1 py-1 rounded text-[11px] font-semibold text-white flex items-center justify-center gap-1 disabled:opacity-30 transition-transform active:scale-95 shadow"
                  style={{ background: '#10B981' }}
                  title="Verify incident and mark high-confidence"
                >
                  <ShieldCheck size={12} /> Verify
                </button>

                <button
                  onClick={() => onAction?.(r.id, 'REJECT', 'Dismissed by officer')}
                  disabled={r.trustStatus === 'REJECTED'}
                  className="px-2 py-1 rounded text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-30 transition-colors"
                  title="Dismiss / Reject invalid report"
                >
                  <XCircle size={12} />
                </button>

                <button
                  onClick={() => {
                    const note = prompt('Enter blacklisting reason (e.g. Malicious prank spam):', 'Adversarial prank alert')
                    if (note !== null) onAction?.(r.id, 'BLACKLIST', note)
                  }}
                  disabled={r.trustStatus === 'BLACKLISTED'}
                  className="px-2 py-1 rounded text-[11px] font-medium text-rose-400 hover:text-rose-200 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 disabled:opacity-30 transition-colors"
                  title="24-Hour Instant Blacklist device & phone"
                >
                  <Ban size={12} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}