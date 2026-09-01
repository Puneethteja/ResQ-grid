import { useState, useEffect } from 'react'
import {
  ChevronDown,
  Copy,
  Check,
  MessageSquareText,
  Send,
  PhoneCall,
  Radio,
  CheckCheck,
  ShieldCheck,
  Phone,
  SignalZero,
  Compass,
  AlertTriangle,
} from 'lucide-react'
import { simulateFallbackGateway, fetchEmergencyContacts, fetchNearestAuthorityCommand } from '../../lib/api.js'
const DEFAULT_CONTACTS = [
  { agency_name: 'National Disaster Response Force (NDRF)', phone_number: '1078', district: 'Statewide Command', is_sms_gateway_active: true },
  { agency_name: 'Odisha Disaster Rapid Action Force (ODRAF)', phone_number: '1070', district: 'Khordha / Cuttack', is_sms_gateway_active: true },
  { agency_name: 'Fire & Emergency Rescue Control', phone_number: '101', district: 'Bhubaneswar Central', is_sms_gateway_active: true },
  { agency_name: 'State Emergency Operations Center (SEOC)', phone_number: '1077', district: 'Odisha Disaster Command', is_sms_gateway_active: true },
  { agency_name: 'Police Emergency Distress Line', phone_number: '112', district: 'Commissioner of Police', is_sms_gateway_active: true },
]
function buildTemplate({ hazardType, description, coordinates, victimCount }) {
  const loc = coordinates ? `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}` : '[lat, lng]'
  const hazard = hazardType || 'EMERGENCY'
  const victims = victimCount ? ` Victims: ${victimCount}.` : ''
  const desc = description ? ` Details: ${description}.` : ''
  return `SOS EMERGENCY REPORT | Hazard: ${hazard} | GPS: ${loc}.${victims}${desc}`
}
export default function OfflineDrawer({ hazardType, description, coordinates, victimCount = 1, forceOpen }) {
  const [open, setOpen] = useState(!!forceOpen)
  const [simulating, setSimulating] = useState(false)
  const [simResult, setSimResult] = useState(null)
  const [contacts, setContacts] = useState(DEFAULT_CONTACTS)
  const [nearestCommand, setNearestCommand] = useState(null)
  const [copied, setCopied] = useState(false)
  const template = buildTemplate({ hazardType, description, coordinates, victimCount })
  const encodedTemplate = encodeURIComponent(template)
  useEffect(() => {
    fetchEmergencyContacts()
      .then((data) => {
        if (data && data.length > 0) setContacts(data)
      })
      .catch(() => {})
  }, [])
  useEffect(() => {
    const lat = coordinates?.lat || 20.2961
    const lng = coordinates?.lng || 85.8245
    fetchNearestAuthorityCommand(lat, lng)
      .then((data) => {
        if (data?.nearestAuthority) setNearestCommand(data.nearestAuthority)
      })
      .catch(() => {})
  }, [coordinates?.lat, coordinates?.lng])
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(template)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }
  async function handleSimulateGateway(channel) {
    setSimulating(true)
    setSimResult(null)
    try {
      const res = await simulateFallbackGateway({
        channel,
        fromNumber: channel === 'WHATSAPP' ? (nearestCommand?.whatsapp_number || '+919437011223') : '+919861099887',
        rawMessage: template,
        coordinates,
      })
      setSimResult(`Transmitted via ${channel} Gateway! Incident #${res.createdReport?.id} ingested into district command.`)
    } catch (err) {
      setSimResult(`Gateway transmission error: ${err.message}`)
    } finally {
      setSimulating(false)
    }
  }
  const nearestWaNumber = (nearestCommand?.whatsapp_number || '+919437011223').replace(/\D/g, '')
  const nearestWaUrl = `https://wa.me/${nearestWaNumber}?text=${encodedTemplate}`
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border" style={{ borderColor: 'var(--paper-line)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 transition-colors"
        style={{ background: forceOpen ? 'var(--caution)' : 'var(--paper-raised)' }}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <MessageSquareText size={17} style={{ color: 'var(--signal)' }} />
          Nearest Authority WhatsApp & Emergency Dispatch Directory
        </span>
        <ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
      </button>
      {open && (
        <div className="p-4 space-y-5" style={{ background: 'var(--paper)' }}>
          {nearestCommand && (
            <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-600/60 text-white space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <Compass size={13} className="animate-spin text-emerald-400" /> Nearest Proximity Authority Command
                </span>
                <span className="text-xs font-mono font-bold text-amber-300 bg-black/40 px-2 py-0.5 rounded">
                  {nearestCommand.distanceKm} km away
                </span>
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-white">{nearestCommand.name}</h4>
                <div className="flex items-center gap-2 text-xs text-emerald-200/90 font-mono mt-0.5 flex-wrap">
                  <span>{nearestCommand.district}</span>
                  <span>•</span>
                  <span className="font-bold text-amber-300">Registered Line: {nearestCommand.whatsapp_number || nearestCommand.phone_number}</span>
                </div>
              </div>
              <div className="pt-1">
                <a
                  href={nearestWaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <MessageSquareText size={16} /> Transmit SOS via WhatsApp ({nearestCommand.whatsapp_number || nearestCommand.phone_number})
                </a>
              </div>
              <p className="text-[10px] font-mono text-emerald-300/70 text-center">
                Automated SMS gateways are prioritized through the nearest district command WhatsApp endpoint.
              </p>
            </div>
          )}
          <div className="rounded-xl p-3.5 space-y-2" style={{ background: 'var(--paper-raised)', border: '1px solid var(--paper-line)' }}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-widest uppercase font-semibold text-slate-700">
                Compressed GSM SOS Payload
              </span>
              <button
                onClick={handleCopy}
                type="button"
                className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs font-mono p-2.5 rounded bg-white border border-slate-200 leading-relaxed text-slate-800 break-words">
              {template}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-widest uppercase font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck size={14} style={{ color: 'var(--signal)' }} /> Official Disaster Dispatch Helplines
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                Live Gateways Active
              </span>
            </div>
            <div className="space-y-2">
              {contacts.map((c, idx) => {
                const cleanPhone = c.phone_number.replace(/\s+/g, '')
                const smsHref = `sms:${cleanPhone}?body=${encodedTemplate}`
                const telHref = `tel:${cleanPhone}`
                return (
                  <div
                    key={c.contact_id || idx}
                    className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors shadow-xs"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{c.agency_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                        <span>{c.district || 'Statewide'}</span>
                        <span>•</span>
                        <span className="font-bold text-slate-700">{c.phone_number}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={telHref}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1 transition-colors shadow-xs"
                        title={`Call ${c.phone_number}`}
                      >
                        <Phone size={12} /> Call
                      </a>
                      {c.is_sms_gateway_active && (
                        <a
                          href={smsHref}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1 transition-colors shadow-xs"
                          title="Send SMS"
                        >
                          <Send size={12} /> SMS SOS
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="p-3.5 rounded-xl space-y-2 bg-slate-900 text-white">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Radio size={12} className="animate-pulse" /> Test Ingest Fallback Webhook
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Simulated Carrier Mesh</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSimulateGateway('SMS')}
                disabled={simulating}
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Send size={12} /> Test SMS Gateway
              </button>
              <button
                type="button"
                onClick={() => handleSimulateGateway('WHATSAPP')}
                disabled={simulating}
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <MessageSquareText size={12} /> Test WhatsApp Gateway
              </button>
            </div>
            {simResult && (
              <div className="p-2 rounded bg-slate-800 text-[11px] font-mono text-emerald-300 flex items-center gap-1.5 mt-2">
                <CheckCheck size={13} className="shrink-0" /> {simResult}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
