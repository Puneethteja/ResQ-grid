export default function CapacityMeter({ currentOccupancy, maxCapacity, onChange, closed, onToggleClosed }) {
  const pct = maxCapacity > 0 ? Math.min(100, Math.round((currentOccupancy / maxCapacity) * 100)) : 0
  const color = closed ? 'var(--hazard)' : pct >= 95 ? 'var(--hazard)' : pct >= 75 ? 'var(--caution)' : 'var(--safe)'

  return (
    <div className="rounded-lg p-5" style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[11px] tracking-widest uppercase" style={{ color: 'var(--mist)' }}>
          Occupancy Status
        </span>
        {closed && (
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
            CLOSED TO ROUTING
          </span>
        )}
      </div>

      <div className="flex items-end gap-2 font-mono">
        <span className="text-5xl font-semibold text-white leading-none">{currentOccupancy}</span>
        <span className="text-xl mb-0.5" style={{ color: 'var(--mist)' }}>/ {maxCapacity}</span>
      </div>

      <div className="mt-4 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--ink)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${closed ? 100 : pct}%`, background: color }} />
      </div>
      <div className="flex justify-between mt-1.5 font-mono text-[11px]" style={{ color: 'var(--mist)' }}>
        <span>{closed ? '100% (Forced Full / Closed)' : `${pct}% full`}</span>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={() => onChange(Math.max(0, currentOccupancy - 1))}
          disabled={closed}
          className="w-9 h-9 rounded-md font-mono text-white text-lg disabled:opacity-30"
          style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}
        >
          −
        </button>
        <input
          type="range"
          min={0}
          max={maxCapacity}
          disabled={closed}
          value={currentOccupancy}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-current disabled:opacity-30"
          style={{ accentColor: color }}
        />
        <button
          onClick={() => onChange(Math.min(maxCapacity, currentOccupancy + 1))}
          disabled={closed}
          className="w-9 h-9 rounded-md font-mono text-white text-lg disabled:opacity-30"
          style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}
        >
          +
        </button>
      </div>
    </div>
  )
}