import { useState, useEffect, useCallback } from 'react'
import {
  Compass,
  Sparkles,
  Truck,
  Building2,
  Send,
  CheckCircle2,
  RefreshCw,
  Clock,
  MapPin,
  AlertTriangle,
  Users,
} from 'lucide-react'
import { fetchOptimizerPlan, batchDispatchOptimizer } from '../../lib/api.js'
export default function SpatialOptimizerConsole({ onDataChanged }) {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [successToast, setSuccessToast] = useState(null)
  const loadPlan = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchOptimizerPlan()
      setPlan(data)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    loadPlan()
    const timer = setInterval(loadPlan, 6000)
    return () => clearInterval(timer)
  }, [loadPlan])
  async function handleBatchDispatch() {
    if (!plan?.recommendations?.length) return
    setExecuting(true)
    try {
      const allocations = plan.recommendations.map((rec) => ({
        reportId: rec.reportId,
        resourceId: rec.allocatedResource.id,
      }))
      const res = await batchDispatchOptimizer(allocations)
      setSuccessToast(res.message || 'Optimizer plan dispatched successfully!')
      loadPlan()
      onDataChanged?.()
      setTimeout(() => setSuccessToast(null), 4000)
    } catch (err) {
      alert(err.message || 'Batch dispatch failed')
    } finally {
      setExecuting(false)
    }
  }
  const recs = plan?.recommendations || []
  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--ink)' }}>
      {}
      {successToast && (
        <div
          className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium text-white flex items-center gap-2 animate-bounce"
          style={{ background: 'var(--safe)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          <CheckCircle2 size={16} /> {successToast}
        </div>
      )}
      {}
      <div
        className="p-5 flex flex-wrap items-center justify-between gap-4 shrink-0"
        style={{ borderBottom: '1px solid var(--ink-line)', background: 'var(--ink-raised)' }}
      >
        <div>
          <h2 className="text-base font-display font-semibold text-white flex items-center gap-2">
            <Compass size={18} style={{ color: 'var(--signal)' }} /> Spatial Resource & Shelter Allocation Optimizer
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--mist)' }}>
            Spatial distance matrix solver pairing crisis density zones with specialized extraction assets & open shelters.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {recs.length > 0 && (
            <button
              onClick={handleBatchDispatch}
              disabled={executing}
              className="px-4 py-2 rounded-lg text-xs font-medium text-white flex items-center gap-1.5 shadow transition-transform hover:scale-105 disabled:opacity-50"
              style={{ background: 'var(--signal)' }}
            >
              <Send size={13} /> {executing ? 'Executing Dispatch…' : `1-Click Batch Dispatch (${recs.length} Units)`}
            </button>
          )}
          <button
            onClick={loadPlan}
            className="p-2 rounded-lg text-slate-300 hover:text-white"
            style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}
            title="Re-compute optimization matrix"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
      {}
      <div
        className="px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono shrink-0"
        style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--ink-line)' }}
      >
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Unassigned Incidents</span>
          <span className="text-sm font-bold text-amber-400">{plan?.unassignedIncidents || 0} Zones</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Available Rescue Units</span>
          <span className="text-sm font-bold text-emerald-400">{plan?.availableRescueUnits || 0} Ready</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Total Victims in Queue</span>
          <span className="text-sm font-bold text-white">{plan?.totalVictimsInQueue || 0} Citizens</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase">Optimal Pairings Ready</span>
          <span className="text-sm font-bold text-sky-400">{recs.length} Solutions</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {recs.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center space-y-2">
            <CheckCircle2 size={36} style={{ color: 'var(--safe)' }} />
            <p className="text-sm font-medium text-white">All verified incidents currently have allocated units</p>
            <p className="text-xs" style={{ color: 'var(--mist)' }}>
              New verified reports will automatically populate the optimization solver.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-display text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles size={15} className="text-amber-400" /> Automated Optimization Pairings (Distance & Capability Matched)
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {recs.map((rec) => (
                <div
                  key={rec.reportId}
                  className="rounded-xl p-4 flex flex-col justify-between space-y-3"
                  style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-white">
                          Incident #{rec.reportId}: {rec.hazardType}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Risk {rec.riskScore}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono mt-1" style={{ color: 'var(--mist)' }}>
                        <span className="flex items-center gap-1">
                          <Users size={11} /> {rec.victimCount} victims
                        </span>
                        {rec.coordinates && (
                          <span className="flex items-center gap-1">
                            <MapPin size={11} /> {rec.coordinates.lat.toFixed(4)}, {rec.coordinates.lng.toFixed(4)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t" style={{ borderColor: 'var(--ink-line)' }}>
                    <div className="p-2.5 rounded-lg bg-black/40 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-emerald-400 flex items-center gap-1">
                        <Truck size={12} /> Paired Rescue Unit
                      </span>
                      <p className="text-xs font-bold text-white">{rec.allocatedResource.name}</p>
                      <div className="text-[11px] font-mono text-slate-300 flex items-center justify-between">
                        <span>{rec.distanceKm} km away</span>
                        <span className="text-emerald-400 font-bold">ETA ~{rec.etaMinutes} min</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/40 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-sky-400 flex items-center gap-1">
                        <Building2 size={12} /> Evacuation Destination
                      </span>
                      <p className="text-xs font-bold text-white">{rec.targetShelter ? rec.targetShelter.name : 'Mobile Extraction'}</p>
                      <div className="text-[11px] font-mono text-slate-300">
                        {rec.targetShelter ? `${rec.targetShelter.distanceKm} km from scene` : 'Direct On-Site Care'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
