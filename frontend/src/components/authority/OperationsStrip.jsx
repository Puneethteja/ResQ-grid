import { Activity, ShieldCheck, Home, Radio, Ban, Sparkles } from 'lucide-react'

const cards = [
  ['activeReports', 'Live Incidents', Activity, 'var(--signal)'],
  ['pendingReviewCount', 'Pending Photo Review', Sparkles, '#F59E0B'],
  ['verifiedClusters', 'Verified Threats', ShieldCheck, 'var(--safe)'],
  ['activeMicroHavens', 'Active Havens', Home, '#38BDF8'],
  ['activeTeams', 'Ready Response Units', Radio, '#60A5FA'],
]

export default function OperationsStrip({ overview }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-px shrink-0" style={{ background: 'var(--ink-line)' }}>
      {cards.map(([key, label, Icon, color]) => (
        <div key={key} className="px-4 py-2.5 flex items-center justify-between" style={{ background: 'var(--ink-raised)' }}>
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--mist)' }}>
              <Icon size={12} style={{ color }} />
              {label}
            </div>
            <div className="font-display text-lg font-bold text-white mt-0.5">
              {overview?.[key] ?? '—'}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
