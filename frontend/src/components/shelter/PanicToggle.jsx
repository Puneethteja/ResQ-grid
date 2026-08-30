import { useState } from 'react'
import { AlertOctagon, X, RotateCcw } from 'lucide-react'

export default function PanicToggle({ closed, onSetClosed }) {
  const [confirming, setConfirming] = useState(false)

  if (closed) return (
    <div className="rounded-lg p-4" style={{ background: 'var(--hazard-dim)', border: '1px solid var(--hazard)' }}>
      <p className="font-display font-semibold text-white">Shelter closed to routing</p>
      <p className="text-xs mt-1" style={{ color: 'var(--mist)' }}>Reopen only after confirming the facility is safe and ready to receive people.</p>
      <button onClick={() => onSetClosed(false)} className="mt-3 w-full rounded-md py-2.5 font-medium text-white flex items-center justify-center gap-2" style={{ background: 'var(--safe)' }}><RotateCcw size={16} /> Reopen shelter</button>
    </div>
  )

  if (confirming) {
    return (
      <div className="rounded-lg p-4 space-y-3" style={{ background: 'var(--hazard-dim)', border: '1px solid var(--hazard)' }}>
        <p className="text-sm text-white">
          This immediately removes the shelter from routing so no more evacuees are directed here. Confirm?
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              onSetClosed(true)
              setConfirming(false)
            }}
            className="flex-1 rounded-md py-2.5 font-semibold text-white"
            style={{ background: 'var(--hazard)' }}
          >
            Yes, close shelter
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="rounded-md px-4 py-2.5 text-white flex items-center gap-1"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <X size={16} /> Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="w-full rounded-lg py-4 font-display font-semibold text-white flex items-center justify-center gap-2"
      style={{ background: 'var(--hazard)' }}
    >
      <AlertOctagon size={18} />
      Mark Shelter 100% Full / Closed
    </button>
  )
}