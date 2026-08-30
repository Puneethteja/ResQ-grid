import { useEffect, useState } from 'react'
import { Droplets, Zap, Cross, Radio } from 'lucide-react'

const PING_INTERVAL_MS = 15 * 60 * 1000
const STATUSES = ['ACTIVE', 'LIMITED', 'DOWN']

function StatusToggle({ icon: Icon, label, value, onChange }) {
  const color = value === 'ACTIVE' ? 'var(--safe)' : value === 'LIMITED' ? 'var(--caution)' : 'var(--hazard)'
  return <div className="rounded-md p-3 flex items-center justify-between" style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}><span className="flex items-center gap-2 text-sm text-white"><Icon size={16} style={{ color }} />{label}</span><div className="flex rounded-md overflow-hidden" style={{ border: '1px solid var(--ink-line)' }}>{STATUSES.map((status) => <button key={status} onClick={() => onChange(status)} className="px-2 py-1 font-mono text-[10px]" style={{ background: value === status ? color : 'transparent', color: value === status ? 'white' : 'var(--mist)' }}>{status}</button>)}</div></div>
}

function secondsUntil(timestamp) {
  const sentAt = Date.parse(timestamp || '')
  return Math.max(0, Math.ceil(((Number.isNaN(sentAt) ? Date.now() : sentAt + PING_INTERVAL_MS) - Date.now()) / 1000))
}
function formatCountdown(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}` }

export default function HeartbeatPanel({ water, power, medical, setWater, setPower, setMedical, lastHeartbeat, onHeartbeat }) {
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntil(lastHeartbeat))
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { setSecondsLeft(secondsUntil(lastHeartbeat)) }, [lastHeartbeat])
  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft(secondsUntil(lastHeartbeat)), 1000)
    return () => clearInterval(timer)
  }, [lastHeartbeat])
  useEffect(() => {
    if (secondsLeft !== 0 || sending) return
    setSending(true); setError('')
    Promise.resolve(onHeartbeat?.()).catch((err) => setError(err.message || 'Ping failed')).finally(() => setSending(false))
  }, [secondsLeft, sending, onHeartbeat])
  const progress = 1 - secondsLeft / (PING_INTERVAL_MS / 1000)
  async function sendNow() {
    setSending(true); setError('')
    try { await onHeartbeat?.() } catch (err) { setError(err.message || 'Ping failed') } finally { setSending(false) }
  }
  return <div className="rounded-lg p-5 space-y-4" style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}><div className="flex items-center justify-between"><span className="font-mono text-[11px] tracking-widest uppercase" style={{ color: 'var(--mist)' }}>Infrastructure Heartbeat</span><span className="flex items-center gap-1.5 font-mono text-xs" style={{ color: 'var(--signal)' }}><Radio size={12} className="heartbeat-dot" />{sending ? 'Sending ping…' : `Next ping in ${formatCountdown(secondsLeft)}`}</span></div><div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--ink)' }}><div className="h-full" style={{ width: `${Math.min(100, progress * 100)}%`, background: 'var(--signal)' }} /></div><div className="space-y-2"><StatusToggle icon={Droplets} label="Water Supply" value={water} onChange={setWater} /><StatusToggle icon={Zap} label="Power" value={power} onChange={setPower} /><StatusToggle icon={Cross} label="Medical Supplies" value={medical} onChange={setMedical} /></div>{error && <p className="text-xs" style={{ color: 'var(--hazard)' }}>{error}</p>}<button onClick={sendNow} disabled={sending} className="w-full rounded-md py-2 text-xs font-mono uppercase tracking-widest disabled:opacity-60" style={{ background: 'var(--ink)', color: 'var(--mist)', border: '1px solid var(--ink-line)' }}>Send Ping Now</button></div>
}