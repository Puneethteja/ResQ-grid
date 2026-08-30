import { ShieldCheck, TriangleAlert, Wifi, WifiOff } from 'lucide-react'


export default function SOSHeader({ status, nearestHazardKm, online }) {
  const isHazard = status === 'hazard'

  return (
    <header
      className="relative overflow-hidden px-5 pt-6 pb-8 sm:px-8"
      style={{
        background: isHazard
          ? 'linear-gradient(180deg, var(--hazard-dim), var(--ink))'
          : 'linear-gradient(180deg, var(--safe-dim), var(--ink))',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="font-mono text-[11px] tracking-widest uppercase" style={{ color: 'var(--mist)' }}>
          Citizen Safety Console
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px]" style={{ color: 'var(--mist)' }}>
          {online ? <Wifi size={13} /> : <WifiOff size={13} />}
          {online ? 'Connected' : 'Offline'}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-6">
        <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
          <div
            className="radar-ring absolute inset-0"
            style={{ color: isHazard ? 'var(--hazard)' : 'var(--safe)' }}
          />
          <div
            className="relative w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: isHazard ? 'var(--hazard)' : 'var(--safe)' }}
          >
            {isHazard ? <TriangleAlert color="white" size={26} /> : <ShieldCheck color="white" size={26} />}
          </div>
        </div>
        <div>
          <div className="font-display text-2xl sm:text-3xl font-semibold text-white">
            Status: {isHazard ? 'Hazard Nearby' : 'Safe'}
          </div>
          <div className="text-sm mt-1" style={{ color: 'var(--mist)' }}>
            {isHazard
              ? `A verified hazard is reported ${nearestHazardKm ? `~${nearestHazardKm} km away` : 'in your area'}. Stay alert.`
              : 'No verified hazards near your current location.'}
          </div>
        </div>
      </div>
    </header>
  )
}