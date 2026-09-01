import { useState, useEffect } from 'react'
import { ShieldCheck, Clock, MapPin, Radio, AlertCircle, Camera, Check } from 'lucide-react'
import { fetchReports } from '../../lib/api.js'
export default function RecentReportsFeed() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  async function loadData() {
    try {
      const data = await fetchReports()
      setReports(data || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    loadData()
    const t = setInterval(loadData, 3000)
    return () => clearInterval(t)
  }, [])
  const recentList = [...reports].reverse().slice(0, 6)
  return (
    <div
      className="rounded-2xl p-5 space-y-3.5 shadow-sm border"
      style={{ background: 'var(--ink-raised)', borderColor: 'var(--ink-line)' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Radio size={16} className="heartbeat-dot text-amber-500" /> Community Incident Feed
          </h3>
          <p className="text-xs" style={{ color: 'var(--mist)' }}>Live on-ground updates & authority verification status</p>
        </div>
        <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full border" style={{ background: 'var(--ink)', borderColor: 'var(--ink-line)', color: 'var(--text-primary)' }}>
          {reports.length} Total
        </span>
      </div>
      {recentList.length === 0 ? (
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-300 border-l-4 border-l-emerald-500 text-xs text-emerald-900 flex items-center justify-center gap-2 font-medium">
          <Check size={15} className="text-emerald-600" />
          <span>Sector is clear: 0 active incident reports in community feed.</span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {recentList.map((r) => {
            const isVerified = r.trustStatus === 'VERIFIED'
            const isPending = r.trustStatus === 'PENDING'
            const isRejected = r.trustStatus === 'REJECTED' || r.trustStatus === 'BLACKLISTED'
            return (
              <div
                key={r.id}
                className={`p-3 rounded-2xl flex items-start gap-3 transition-all border shadow-xs ${
                  isVerified
                    ? 'border-emerald-300 bg-emerald-50/40 border-l-4 border-l-emerald-500'
                    : isRejected
                    ? 'border-red-300 bg-red-50/40 border-l-4 border-l-red-500'
                    : 'border-amber-300 bg-amber-50/40 border-l-4 border-l-amber-500'
                }`}
              >
                {r.photo ? (
                  <img
                    src={r.photo}
                    alt={r.hazardType}
                    className="w-14 h-14 rounded-lg object-cover shrink-0 border"
                    style={{ borderColor: 'var(--ink-line)' }}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg shrink-0 flex items-center justify-center border" style={{ background: 'var(--ink-raised)', borderColor: 'var(--ink-line)', color: 'var(--mist)' }}>
                    <Camera size={18} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-display text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      {r.hazardType}
                    </h4>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold shrink-0"
                      style={{
                        background: isVerified
                          ? 'rgba(16, 185, 129, 0.15)'
                          : isRejected
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                        color: isVerified
                          ? '#10B981'
                          : isRejected
                            ? '#EF4444'
                            : '#F59E0B',
                        border: `1px solid ${isVerified ? '#10B981' : isRejected ? '#EF4444' : '#F59E0B'}`,
                      }}
                    >
                      {isVerified ? '✓ Verified' : isRejected ? '✕ Rejected' : '⧗ Under Review'}
                    </span>
                  </div>
                  {r.description && (
                    <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'var(--mist)' }}>{r.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] font-mono mt-1.5" style={{ color: 'var(--mist)' }}>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {r.metadata?.timestamp ? new Date(r.metadata.timestamp).toLocaleTimeString() : 'Just now'}
                    </span>
                    {r.coordinates && (
                      <span className="flex items-center gap-0.5">
                        <MapPin size={11} /> {r.coordinates.lat?.toFixed(2)}, {r.coordinates.lng?.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
