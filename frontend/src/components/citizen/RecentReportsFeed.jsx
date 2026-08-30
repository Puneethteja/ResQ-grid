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
      className="rounded-2xl p-5 space-y-3.5 shadow-sm"
      style={{ background: 'var(--paper-raised)', border: '1px solid var(--paper-line)' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-900 flex items-center gap-2">
            <Radio size={16} className="heartbeat-dot text-amber-600" /> Community Incident Feed
          </h3>
          <p className="text-xs text-slate-500">Live on-ground updates & authority verification status</p>
        </div>
        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          {reports.length} Total
        </span>
      </div>

      {recentList.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-4">No recent incident reports in this sector.</p>
      ) : (
        <div className="space-y-2.5">
          {recentList.map((r) => {
            const isVerified = r.trustStatus === 'VERIFIED'
            const isPending = r.trustStatus === 'PENDING'
            const isRejected = r.trustStatus === 'REJECTED' || r.trustStatus === 'BLACKLISTED'

            return (
              <div
                key={r.id}
                className="p-3 rounded-xl flex items-start gap-3 transition-all hover:bg-slate-50"
                style={{ border: '1px solid var(--paper-line)' }}
              >
                {r.photo ? (
                  <img
                    src={r.photo}
                    alt={r.hazardType}
                    className="w-14 h-14 rounded-lg object-cover shrink-0 border border-slate-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center text-slate-400">
                    <Camera size={18} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-display text-sm font-semibold text-slate-900 truncate">
                      {r.hazardType}
                    </h4>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold shrink-0"
                      style={{
                        background: isVerified
                          ? 'rgba(78, 128, 101, 0.15)'
                          : isRejected
                            ? 'rgba(185, 71, 59, 0.15)'
                            : 'rgba(197, 149, 54, 0.15)',
                        color: isVerified
                          ? 'var(--safe-dim)'
                          : isRejected
                            ? 'var(--hazard)'
                            : 'var(--caution-dim)',
                      }}
                    >
                      {isVerified ? '✓ Verified Hazard' : isRejected ? '✕ Rejected' : '⧗ Under Review'}
                    </span>
                  </div>

                  {r.description && (
                    <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{r.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mt-1.5">
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {new Date(r.createdAt || Date.now()).toLocaleTimeString()}
                    </span>
                    {r.coordinates && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {r.coordinates.lat.toFixed(3)}, {r.coordinates.lng.toFixed(3)}
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