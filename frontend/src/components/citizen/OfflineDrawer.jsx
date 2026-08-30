import { useState } from 'react'
import { ChevronDown, Copy, Check, MessageSquareText, Send, PhoneCall, Radio, CheckCheck } from 'lucide-react'
import { simulateFallbackGateway } from '../../lib/api.js'

const EMERGENCY_SMS_NUMBER = '112'
const EMERGENCY_WHATSAPP_NUMBER = '+919437011223'

function buildTemplate({ hazardType, description, coordinates, victimCount }) {
  const loc = coordinates ? `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}` : '[lat, lng]'
  const hazard = hazardType || 'EMERGENCY'
  const victims = victimCount ? ` Victims: ${victimCount}.` : ''
  const desc = description ? ` Details: ${description}.` : ''
  return `SOS REPORT | Hazard: ${hazard} | Location: ${loc}.${victims}${desc}`
}

function CopyRow({ label, value, actionLink }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
    }
  }

  return (
    <div className="rounded-xl p-3.5 space-y-2" style={{ background: 'var(--paper-raised)', border: '1px solid var(--paper-line)' }}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-widest uppercase font-semibold" style={{ color: 'var(--graphite)' }}>
          {label}
        </span>
        <div className="flex items-center gap-2">
          {actionLink && (
            <a
              href={actionLink}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              Open Direct
            </a>
          )}
          <button
            onClick={copy}
            type="button"
            className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <p className="text-xs font-mono p-2 rounded bg-white border border-slate-200 leading-relaxed text-slate-800 break-words">
        {value}
      </p>
    </div>
  )
}

export default function OfflineDrawer({ hazardType, description, coordinates, victimCount = 1, forceOpen }) {
  const [open, setOpen] = useState(!!forceOpen)
  const [simulating, setSimulating] = useState(false)
  const [simResult, setSimResult] = useState(null)
  const template = buildTemplate({ hazardType, description, coordinates, victimCount })

  async function handleSimulateGateway(channel) {
    setSimulating(true)
    setSimResult(null)
    try {
      const res = await simulateFallbackGateway({
        channel,
        fromNumber: channel === 'WHATSAPP' ? '+919437011223' : '+919861099887',
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

  const encodedTemplate = encodeURIComponent(template)
  const smsHref = `sms:${EMERGENCY_SMS_NUMBER}?body=${encodedTemplate}`
  const waHref = `https://wa.me/${EMERGENCY_WHATSAPP_NUMBER.replace('+', '')}?text=${encodedTemplate}`

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border" style={{ borderColor: 'var(--paper-line)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 transition-colors"
        style={{ background: forceOpen ? 'var(--caution)' : 'var(--paper-raised)' }}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <MessageSquareText size={17} style={{ color: 'var(--signal)' }} /> SMS & WhatsApp Multi-Channel Fallback Pipeline
        </span>
        <ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
      </button>

      {open && (
        <div className="p-4 space-y-4" style={{ background: 'var(--paper)' }}>
          <p className="text-xs text-slate-600 leading-relaxed">
            In dead zones or 2G/voice-only coverage, standard SMS and WhatsApp payloads are ingested by ResQgrid's automated NLP gateway and parsed directly into verified command records.
          </p>

          <CopyRow label={`SMS to ${EMERGENCY_SMS_NUMBER} (National Emergency Helpline)`} value={template} actionLink={smsHref} />
          <CopyRow label={`WhatsApp to Official Gateway (${EMERGENCY_WHATSAPP_NUMBER})`} value={template} actionLink={waHref} />

          {/* Interactive Gateway Ingestion Tester */}
          <div className="p-3.5 rounded-xl space-y-2 bg-slate-900 text-white">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Radio size={12} className="heartbeat-dot" /> Test Ingest Fallback Payload
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Live API Webhook</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSimulateGateway('SMS')}
                disabled={simulating}
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center justify-center gap-1"
              >
                <Send size={12} /> Test SMS Gateway
              </button>
              <button
                type="button"
                onClick={() => handleSimulateGateway('WHATSAPP')}
                disabled={simulating}
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 transition-colors flex items-center justify-center gap-1"
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