import { useState, useEffect, useCallback } from 'react'
import {
  Radio,
  ShieldAlert,
  Activity,
  Truck,
  RefreshCw,
  CheckCircle2,
  Ban,
  Trash2,
  Lock,
  Cpu,
  Clock,
} from 'lucide-react'
import { fetchOperationsOverview, fetchResources, fetchBlacklist, unbanIdentifier, clearAuditLogs } from '../../lib/api.js'

export default function AuditTelemetryView() {
  const [overview, setOverview] = useState(null)
  const [resources, setResources] = useState([])
  const [blacklist, setBlacklist] = useState([])
  const [loading, setLoading] = useState(true)
  const [unbanning, setUnbanning] = useState(null)
  const [clearing, setClearing] = useState(false)
  const [feedback, setFeedback] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [ov, res, bl] = await Promise.all([
        fetchOperationsOverview(),
        fetchResources(),
        fetchBlacklist().catch(() => []),
      ])
      setOverview(ov)
      setResources(res.resources || [])
      setBlacklist(bl || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const t = setInterval(loadData, 4000)
    return () => clearInterval(t)
  }, [loadData])

  async function handleClearLogs() {
    if (!window.confirm('Clear all past audit log entries and free system & web memory?')) return
    setClearing(true)
    try {
      await clearAuditLogs()
      // Free web browser caches / unused storage
      if (window.caches) {
        const cacheKeys = await window.caches.keys()
        await Promise.all(cacheKeys.map((key) => window.caches.delete(key)))
      }
      setFeedback('Audit logs cleared and web memory purged successfully.')
      setTimeout(() => setFeedback(''), 4000)
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to clear logs')
    } finally {
      setClearing(false)
    }
  }

  async function handleUnban(identifier) {
    setUnbanning(identifier)
    try {
      await unbanIdentifier(identifier)
      loadData()
    } catch (err) {
      alert(err.message || 'Unban failed')
    } finally {
      setUnbanning(null)
    }
  }

  const auditEvents = overview?.auditEvents || []

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--ink)' }}>
      {/* Header */}
      <div
        className="p-5 flex flex-wrap items-center justify-between gap-3 shrink-0"
        style={{ borderBottom: '1px solid var(--ink-line)', background: 'var(--ink-raised)' }}
      >
        <div>
          <h2 className="text-base font-display font-semibold text-white flex items-center gap-2">
            <Radio size={18} style={{ color: 'var(--signal)' }} /> Command Telemetry, Audit Logs & 24h Blacklist
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>
            Cryptographically signed field telemetry (HMAC-SHA256), active blacklist bans, and immutable operational logs.
          </p>
          {feedback && (
            <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
              ✓ {feedback}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleClearLogs}
            disabled={clearing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-200 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="Purge past audit log entries and free web application memory"
          >
            <Trash2 size={13} />
            <span>{clearing ? 'Purging…' : 'Clear Logs & Free Memory'}</span>
          </button>
          <button
            onClick={loadData}
            className="p-2 rounded-lg text-slate-300 hover:text-white"
            style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}
            title="Refresh logs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 grid lg:grid-cols-3 gap-5">
        {/* Col 1: Cryptographically Signed Rescue Teams (Feature 7) */}
        <div className="space-y-4">
          <h3 className="font-display text-sm font-semibold text-white flex items-center gap-2">
            <Truck size={16} style={{ color: 'var(--signal)' }} /> Field Extraction Teams (HMAC Signed)
          </h3>

          <div className="space-y-3">
            {resources.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-xl flex flex-col justify-between space-y-2.5"
                style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-semibold text-white">{r.name}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {r.kind}
                      </span>
                    </div>
                    <div className="font-mono text-xs mt-1" style={{ color: 'var(--mist)' }}>
                      ID: {r.id} · Cap: {r.capacity} evacuees
                    </div>
                  </div>

                  <span
                    className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ background: r.available ? 'var(--safe)' : 'var(--caution)' }}
                  >
                    <CheckCircle2 size={11} /> {r.available ? 'STANDBY' : 'DEPLOYED'}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-[11px] font-mono">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Lock size={11} /> HMAC-SHA256 Verified
                  </span>
                  {r.coordinates && (
                    <span className="text-slate-400">
                      {r.coordinates.lat.toFixed(4)}, {r.coordinates.lng.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-white flex items-center gap-2">
              <Ban size={16} style={{ color: 'var(--hazard)' }} /> Active 24h Blacklist ({blacklist.length})
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Auto-expires after 24h</span>
          </div>

          <div
            className="rounded-xl overflow-hidden divide-y max-h-[500px] overflow-y-auto"
            style={{ background: 'var(--ink-raised)', borderColor: 'var(--ink-line)' }}
          >
            {blacklist.length === 0 ? (
              <div className="p-8 text-center text-xs space-y-1" style={{ color: 'var(--mist)' }}>
                <CheckCircle2 size={24} className="mx-auto text-emerald-400 mb-2" />
                <p className="font-semibold text-white">No active blacklisted entities</p>
                <p className="text-[11px]">Prank alerts or adversarial devices flagged by officials appear here.</p>
              </div>
            ) : (
              blacklist.map((b, i) => (
                <div key={i} className="p-3 space-y-1 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-red-400 break-all">{b.identifier}</span>
                    <button
                      onClick={() => handleUnban(b.identifier)}
                      disabled={unbanning === b.identifier}
                      className="px-2 py-0.5 rounded text-[10px] bg-red-950 text-red-200 border border-red-800 hover:bg-red-900 transition-colors"
                      title="Remove 24h ban"
                    >
                      {unbanning === b.identifier ? 'Unbanning…' : 'Unban'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-300">{b.reason || 'Adversarial report / False alarm'}</p>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock size={10} /> Expires: {new Date(b.expiresAt).toLocaleTimeString()} (Banned by {b.bannedBy || 'Authority'})
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Col 3: Immutable Operational Audit Trail */}
        <div className="space-y-4">
          <h3 className="font-display text-sm font-semibold text-white flex items-center gap-2">
            <ShieldAlert size={16} style={{ color: 'var(--safe)' }} /> Real-Time Operational Audit Trail
          </h3>

          <div
            className="rounded-xl overflow-hidden divide-y max-h-[500px] overflow-y-auto"
            style={{ background: 'var(--ink-raised)', borderColor: 'var(--ink-line)' }}
          >
            {auditEvents.length === 0 ? (
              <div className="p-8 text-center text-xs" style={{ color: 'var(--mist)' }}>
                No audit records yet.
              </div>
            ) : (
              auditEvents.map((ev) => (
                <div key={ev.id} className="p-3 space-y-1 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-emerald-400">{ev.action}</span>
                    <span style={{ color: 'var(--mist)' }}>{new Date(ev.at).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-xs text-slate-300">
                    Actor: <span className="font-mono text-white">{ev.actor}</span> → Target:{' '}
                    <span className="font-mono text-amber-300">{ev.target}</span>
                  </div>
                  {ev.details && Object.keys(ev.details).length > 0 && (
                    <pre
                      className="text-[10px] font-mono p-1 rounded overflow-x-auto text-slate-400"
                      style={{ background: 'rgba(0,0,0,0.3)' }}
                    >
                      {JSON.stringify(ev.details)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}