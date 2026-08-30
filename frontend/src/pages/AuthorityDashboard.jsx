import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LogOut,
  Flame,
  RefreshCw,
  Map as MapIcon,
  Sparkles,
  Building2,
  Radio,
  Layers,
  Compass,
} from 'lucide-react'
import MasterMap from '../components/map/MasterMap.jsx'
import TriageSidebar from '../components/authority/TriageSidebar.jsx'
import OperationsStrip from '../components/authority/OperationsStrip.jsx'
import AdminVerificationHub from '../components/authority/AdminVerificationHub.jsx'
import SheltersManagementGrid from '../components/authority/SheltersManagementGrid.jsx'
import AuditTelemetryView from '../components/authority/AuditTelemetryView.jsx'
import SpatialOptimizerConsole from '../components/authority/SpatialOptimizerConsole.jsx'
import IncidentDetailModal from '../components/authority/IncidentDetailModal.jsx'
import {
  fetchReports,
  fetchShelters,
  fetchMicroHavens,
  fetchOperationsOverview,
  fetchClusters,
  fetchResources,
  verifyReport,
} from '../lib/api.js'
import { clearAuthoritySession, getAuthorityUsername } from '../lib/authoritySession.js'
import { logout as apiLogout } from '../lib/api.js'

const DEFAULT_CENTER = [20.2961, 85.8245] 

export default function AuthorityDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('MAP') 
  const [reports, setReports] = useState([])
  const [shelters, setShelters] = useState([])
  const [resources, setResources] = useState([])
  const [clusters, setClusters] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [inspectedReport, setInspectedReport] = useState(null)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [lastSync, setLastSync] = useState(null)
  const [overview, setOverview] = useState(null)

  const loadData = useCallback(async () => {
    try {
      const [reportsList, sheltersList, microHavens, operationalData, clusterData, resourceData] = await Promise.all([
        fetchReports().catch((err) => { console.warn('fetchReports error:', err); return [] }),
        fetchShelters().catch((err) => { console.warn('fetchShelters error:', err); return [] }),
        fetchMicroHavens().catch((err) => { console.warn('fetchMicroHavens error:', err); return [] }),
        fetchOperationsOverview().catch((err) => { console.warn('fetchOperationsOverview error:', err); return null }),
        fetchClusters().catch(() => []),
        fetchResources().catch(() => ({ resources: [] })),
      ])

      const repList = Array.isArray(reportsList) ? reportsList : []
      const sList = Array.isArray(sheltersList) ? sheltersList : []
      const mList = Array.isArray(microHavens) ? microHavens : []
      const allShelters = [...sList, ...mList]
      const rList = resourceData?.resources || []

      setReports(repList)
      setShelters(allShelters)
      setOverview(operationalData)
      setClusters(Array.isArray(clusterData) ? clusterData : [])
      setResources(rList)
      setLastSync(new Date())

      // Keep inspectedReport in sync if open
      setInspectedReport((curr) => {
        if (!curr) return null
        return repList.find((r) => r.id === curr.id) || curr
      })
    } catch (e) {
      console.error('Fatal loadData error:', e)
    }
  }, [])

  useEffect(() => {
    loadData()
    const id = setInterval(loadData, 3500)
    return () => clearInterval(id)
  }, [loadData])

  async function handleAction(reportId, action, note) {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              trustStatus: action === 'VERIFY' ? 'VERIFIED' : action === 'REJECT' ? 'REJECTED' : 'BLACKLISTED',
              imageVerificationStatus: action === 'VERIFY' ? 'VERIFIED' : action === 'REJECT' ? 'REJECTED' : 'BLACKLISTED',
              trustScore: action === 'VERIFY' ? Math.max(95, r.trustScore || 50) : action === 'REJECT' ? 15 : 0,
            }
          : r,
      ),
    )
    try {
      const updated = await verifyReport(reportId, action, note)
      setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)))
      setInspectedReport((curr) => (curr && curr.id === reportId ? updated : curr))
      loadData()
    } catch {
      loadData()
    }
  }

  async function handleLogout() {
    await apiLogout()
    clearAuthoritySession()
    navigate('/authority/auth', { replace: true })
  }

  const pendingMediaCount = overview?.pendingReviewCount ?? 0

  const hazardZones = [
    ...clusters
      .filter((c) => c.isElevated)
      .map((c) => ({
        id: c.id,
        label: `${c.hazardType} (Consensus Cluster - ${c.uniqueDeviceCount} Devices)`,
        polygon: c.polygon,
        isCluster: true,
      })),
    ...reports
      .filter((r) => r.trustStatus === 'VERIFIED' && r.coordinates)
      .map((r) => {
        const { lat, lng } = r.coordinates
        const d = 0.003
        return {
          id: `rep-${r.id}`,
          label: `${r.hazardType} #${r.id} (Verified Zone)`,
          polygon: [
            [lat - d, lng - d],
            [lat - d, lng + d],
            [lat + d, lng + d],
            [lat + d, lng - d],
          ],
        }
      }),
  ]

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--ink)' }}>
      {}
      <header
        className="flex items-center justify-between px-5 py-2.5 shrink-0"
        style={{ borderBottom: '1px solid var(--ink-line)', background: 'var(--ink)' }}
      >
        {}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow" style={{ background: 'var(--signal)' }}>
            <Flame size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-bold text-white tracking-tight">
                ResQ<span style={{ color: 'var(--signal)' }}>-</span>Grid
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                COMMAND ROOM
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">Odisha Disaster Multi-Tier Response Hub</p>
          </div>
        </div>

        {/* Center Workspace Tabs */}
        <div className="hidden md:flex items-center gap-1 rounded-xl p-1" style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}>
          {[
            { id: 'MAP', label: 'Live Map & Triage', icon: MapIcon },
            { id: 'OPTIMIZER', label: 'Spatial Optimizer', icon: Compass },
            { id: 'VERIFICATION', label: 'Verification Queue', icon: Sparkles, badge: pendingMediaCount },
            { id: 'SHELTERS', label: 'Shelter Network', icon: Building2 },
            { id: 'AUDIT', label: 'Audit & Telemetry', icon: Radio },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: isActive ? 'var(--signal)' : 'transparent',
                  color: isActive ? 'white' : 'var(--mist)',
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-orange-700">
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {}
        <div className="flex items-center gap-3">
          {activeTab === 'MAP' && (
            <button
              onClick={() => setShowHeatmap((v) => !v)}
              className="flex items-center gap-1.5 font-mono text-[11px] px-3 py-1.5 rounded-lg text-white transition-all shadow-sm cursor-pointer"
              style={{
                background: showHeatmap ? 'rgba(239, 68, 68, 0.3)' : 'var(--ink-raised)',
                border: showHeatmap ? '1.5px solid #EF4444' : '1px solid var(--ink-line)',
              }}
              title="Toggle Crisis Heatmap Density Layer"
            >
              <Layers size={13} style={{ color: showHeatmap ? '#EF4444' : 'var(--mist)' }} />
              <span className="font-bold">Heatmap {showHeatmap ? 'ACTIVE' : 'OFF'}</span>
            </button>
          )}

          <button
            onClick={loadData}
            className="flex items-center gap-1 font-mono text-[11px] px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white"
            style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}
            title="Force immediate sync"
          >
            <RefreshCw size={12} className={lastSync ? '' : 'animate-spin'} />
            <span className="hidden lg:inline">{lastSync ? lastSync.toLocaleTimeString() : 'Syncing…'}</span>
          </button>

          <span className="font-mono text-xs hidden xl:inline" style={{ color: 'var(--mist)' }}>
            {getAuthorityUsername() || 'Officer in Charge'}
          </span>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 font-mono text-[11px] px-3 py-1.5 rounded-lg text-white transition-colors hover:bg-rose-950"
            style={{ background: 'rgba(185, 71, 59, 0.25)', border: '1px solid var(--hazard)' }}
          >
            <LogOut size={13} /> Log out
          </button>
        </div>
      </header>

      {}
      <OperationsStrip overview={overview} />

      {/* Main Workspace Body */}
      <div className="flex-1 min-h-0 relative">
        {activeTab === 'MAP' && (
          <div className="h-full w-full flex flex-col md:flex-row overflow-hidden relative">
            <div className="flex-1 min-w-0 h-full relative">
              <MasterMap
                reports={reports}
                shelters={shelters}
                resources={resources}
                hazardZones={hazardZones}
                clusters={clusters}
                center={DEFAULT_CENTER}
                showHeatmap={showHeatmap}
                onToggleHeatmap={() => setShowHeatmap((v) => !v)}
                selectedId={selectedId}
                onSelectReport={(id) => {
                  setSelectedId(id)
                  const found = reports.find((r) => r.id === id)
                  if (found) setInspectedReport(found)
                }}
              />
            </div>
            <div className="w-full md:w-[390px] xl:w-[420px] shrink-0 h-full border-t md:border-t-0 md:border-l border-slate-800 z-10">
              <TriageSidebar
                reports={reports}
                clusters={clusters}
                onAction={handleAction}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onOpenDetail={(r) => setInspectedReport(r)}
              />
            </div>
          </div>
        )}

        {activeTab === 'OPTIMIZER' && (
          <SpatialOptimizerConsole onDataChanged={loadData} />
        )}

        {activeTab === 'VERIFICATION' && (
          <AdminVerificationHub onDataChanged={loadData} />
        )}

        {activeTab === 'SHELTERS' && (
          <SheltersManagementGrid shelters={shelters} onDataChanged={loadData} />
        )}

        {activeTab === 'AUDIT' && (
          <AuditTelemetryView />
        )}
      </div>

      {/* Deep Incident Inspector Modal */}
      {inspectedReport && (
        <IncidentDetailModal
          report={inspectedReport}
          onClose={() => setInspectedReport(null)}
          onAction={handleAction}
          onDataChanged={loadData}
        />
      )}
    </div>
  )
}