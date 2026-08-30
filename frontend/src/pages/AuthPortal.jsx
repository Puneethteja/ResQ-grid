import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ShieldAlert,
  Lock,
  Mail,
  Building,
  User,
  Phone,
  MapPin,
  Upload,
  ArrowLeft,
  Camera,
  RotateCcw,
  CheckCircle2,
  BadgeCheck,
  Sparkles,
  KeyRound,
  X,
} from 'lucide-react'
import { login, register } from '../lib/api.js'
import { setSession } from '../lib/authoritySession.js'

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read the selected image'))
    reader.readAsDataURL(file)
  })
}

function LiveCaptureModal({ title, onCapture, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => {
        setError('Camera permission denied or camera device unavailable.')
      })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  function takeSnapshot() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)

    ctx.fillStyle = 'rgba(0,0,0,0.65)'
    ctx.fillRect(0, canvas.height - 28, canvas.width, 28)
    ctx.fillStyle = '#38BDF8'
    ctx.font = '11px monospace'
    ctx.fillText(`OFFICER AUTH VERIFICATION #${new Date().toISOString()}`, 10, canvas.height - 10)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    onCapture(dataUrl)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-5 space-y-4" style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera size={16} style={{ color: 'var(--signal)' }} />
            <h3 className="font-display text-sm font-semibold text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white" style={{ background: 'var(--ink)' }}>
            <X size={15} />
          </button>
        </div>

        {error ? (
          <div className="p-4 rounded-lg text-xs text-rose-300 bg-rose-950/40 border border-rose-800 text-center">
            {error}
          </div>
        ) : (
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-700">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-2 border border-white/20 rounded-lg pointer-events-none flex items-center justify-center">
              <span className="text-[10px] font-mono text-white/50 uppercase">[ Align ID Card / Face ]</span>
            </div>
          </div>
        )}

        {!error && (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={takeSnapshot}
              className="w-full py-2.5 rounded-lg text-xs font-semibold text-white shadow transition-all hover:opacity-90"
              style={{ background: 'var(--signal)' }}
            >
              Capture & Seal Evidence
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthPortal({ initialRole = 'shelter' }) {
  const navigate = useNavigate()
  const role = initialRole
  const isAuthority = role === 'authority'
  const title = isAuthority ? 'Authority Command Sign In' : 'Shelter Manager Sign In'
  const [isSignUp, setIsSignUp] = useState(false)
  const [captureModal, setCaptureModal] = useState(null) 

  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    location: '',
    designation: isAuthority ? 'Disaster Incident Commander' : '',
    department: isAuthority ? 'Odisha State Disaster Management Authority (OSDMA)' : '',
    authorityId: '',
    verificationCode: '',
    officialId: null, 
    proofPhoto: null, 
  })

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const cleanEmail = form.email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!cleanEmail || (cleanEmail.includes('@') && !emailRegex.test(cleanEmail))) {
      setError('Please enter a valid email address or username.')
      return
    }

    if (!form.password || form.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (isSignUp) {
      if (!form.name.trim()) {
        setError('Please enter your full name or facility name.')
        return
      }
      if (!form.phone.trim()) {
        setError('Please enter an official contact phone number.')
        return
      }
      if (!form.location.trim()) {
        setError('Please enter your district jurisdiction or location.')
        return
      }
      if (isAuthority) {
        if (!form.authorityId || !form.authorityId.trim()) {
          setError('Please enter your official Government Badge / ID Number.')
          return
        }
        if (!form.verificationCode || !form.verificationCode.trim()) {
          setError('Please enter the Agency Security Verification Code.')
          return
        }
      }
    }

    setSaving(true)
    try {
      let response
      if (isSignUp) {
        const officialId = isAuthority
          ? typeof form.officialId === 'string'
            ? form.officialId
            : form.officialId
            ? await readImage(form.officialId)
            : undefined
          : undefined

        const proofPhoto = isAuthority
          ? typeof form.proofPhoto === 'string'
            ? form.proofPhoto
            : form.proofPhoto
            ? await readImage(form.proofPhoto)
            : undefined
          : undefined

        response = await register({
          email: cleanEmail,
          password: form.password,
          role,
          name: form.name.trim(),
          phone: form.phone.trim(),
          location: form.location.trim(),
          designation: isAuthority ? form.designation.trim() : undefined,
          department: isAuthority ? form.department.trim() : undefined,
          authority_id: form.authorityId ? form.authorityId.trim() : undefined,
          verification_code: form.verificationCode ? form.verificationCode.trim() : undefined,
          official_id_document: officialId,
          proof_photo: proofPhoto,
        })
      } else {
        response = await login(cleanEmail, form.password, role)
      }
      setSession(response)
      navigate(isAuthority ? '/authority' : '/shelter', { replace: true })
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-5 sm:p-8" style={{ background: 'var(--ink)' }}>
      {captureModal && (
        <LiveCaptureModal
          title={captureModal === 'officialId' ? 'Live Government ID Badge Capture' : 'Live Officer Biometric Selfie Capture'}
          onCapture={(dataUrl) => update(captureModal, dataUrl)}
          onClose={() => setCaptureModal(null)}
        />
      )}

      <section
        className="max-w-md w-full rounded-2xl p-7 sm:p-8 space-y-5 shadow-2xl transition-all"
        style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}
      >
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-300 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back to role select
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--mist)' }}>
            {isAuthority ? 'RESTRICTED PORTAL' : 'SHELTER NODE'}
          </span>
        </div>

        <header className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow" style={{ background: isAuthority ? 'var(--signal)' : 'var(--safe)' }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h1 className="text-lg font-display font-semibold text-white">
                {isSignUp ? `Register ${isAuthority ? 'Official Authority Officer' : 'Shelter Node'}` : title}
              </h1>
              <p className="text-xs" style={{ color: 'var(--mist)' }}>
                {isAuthority
                  ? 'Government command personnel & disaster relief controllers'
                  : 'Manage shelter capacity and infrastructure heartbeat'}
              </p>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && (
            <>
              <Field
                label={isAuthority ? 'Officer Full Name & Title' : 'Facility / Organization Name'}
                icon={User}
                placeholder={isAuthority ? 'e.g. Commander Rajesh Patnaik' : 'e.g. City High School Refuge'}
                value={form.name}
                onChange={(v) => update('name', v)}
              />

              {isAuthority && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs" style={{ color: 'var(--mist)' }}>
                      Official Designation
                      <select
                        value={form.designation}
                        onChange={(e) => update('designation', e.target.value)}
                        className="w-full mt-1.5 rounded-lg px-2.5 py-2 text-xs text-white outline-none"
                        style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}
                      >
                        <option value="Disaster Incident Commander">Disaster Incident Commander</option>
                        <option value="NDRF Search & Rescue Officer">NDRF Search & Rescue Officer</option>
                        <option value="Emergency Medical Director">Emergency Medical Director</option>
                        <option value="Police / Law Enforcement Lead">Police / Law Enforcement Lead</option>
                        <option value="Fire & Rescue Chief">Fire & Rescue Chief</option>
                      </select>
                    </label>

                    <Field
                      label="Department / Agency"
                      icon={Building}
                      placeholder="e.g. OSDMA / NDRF"
                      value={form.department}
                      onChange={(v) => update('department', v)}
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Official Contact Phone"
                  icon={Phone}
                  placeholder="+91 943..."
                  value={form.phone}
                  onChange={(v) => update('phone', v)}
                />
                <Field
                  label="Jurisdiction / District"
                  icon={MapPin}
                  placeholder="e.g. Bhubaneswar Central"
                  value={form.location}
                  onChange={(v) => update('location', v)}
                />
              </div>
            </>
          )}

          <Field
            label={isAuthority ? 'Official Email Address or Username' : 'Registered Email Address'}
            icon={Mail}
            type="email"
            placeholder={isAuthority ? 'officer@agency.gov' : 'manager@facility.org'}
            value={form.email}
            onChange={(v) => update('email', v)}
          />

          <Field
            label="Password"
            icon={Lock}
            type="password"
            placeholder="••••••••"
            minLength={8}
            value={form.password}
            onChange={(v) => update('password', v)}
          />

          {isSignUp && isAuthority && (
            <div className="p-3.5 rounded-xl space-y-3" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--ink-line)' }}>
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-white">
                <BadgeCheck size={14} style={{ color: 'var(--signal)' }} /> Official Credential Verification
              </div>

              <Field
                label="Government Badge / ID Number"
                icon={Building}
                placeholder="e.g. DISASTER-CMD-01"
                value={form.authorityId}
                onChange={(v) => update('authorityId', v)}
              />

              <div>
                <Field
                  label="Agency Verification Security Code (Default: AUTH-SECURE-99)"
                  icon={ShieldAlert}
                  placeholder="Enter official agency verification code"
                  value={form.verificationCode}
                  onChange={(v) => update('verificationCode', v)}
                />
              </div>

              {/* Photo ID Capture / Upload */}
              <div className="space-y-2 pt-1 border-t border-slate-700">
                <label className="font-mono text-[11px] text-slate-300 block">
                  1. Official Government ID Document / Badge
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCaptureModal('officialId')}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 text-white transition-colors"
                    style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}
                  >
                    <Camera size={14} style={{ color: 'var(--signal)' }} /> Capture Live ID
                  </button>
                  <label
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer text-slate-300 hover:text-white transition-colors"
                    style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}
                  >
                    <Upload size={14} /> Upload File
                    <input type="file" accept="image/*" onChange={(e) => update('officialId', e.target.files?.[0])} className="hidden" />
                  </label>
                </div>
                {form.officialId && (
                  <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800 flex items-center justify-between text-xs text-emerald-300">
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={13} /> Official ID Attached</span>
                    <button type="button" onClick={() => update('officialId', null)} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                )}
              </div>

              {/* Officer Live Selfie Capture / Upload */}
              <div className="space-y-2 pt-1 border-t border-slate-700">
                <label className="font-mono text-[11px] text-slate-300 block">
                  2. Officer Live Biometric Verification Photo
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCaptureModal('proofPhoto')}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 text-white transition-colors"
                    style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}
                  >
                    <Camera size={14} style={{ color: 'var(--signal)' }} /> Take Live Selfie
                  </button>
                  <label
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer text-slate-300 hover:text-white transition-colors"
                    style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}
                  >
                    <Upload size={14} /> Upload Selfie
                    <input type="file" accept="image/*" onChange={(e) => update('proofPhoto', e.target.files?.[0])} className="hidden" />
                  </label>
                </div>
                {form.proofPhoto && (
                  <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800 flex items-center justify-between text-xs text-emerald-300">
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={13} /> Verification Photo Attached</span>
                    <button type="button" onClick={() => update('proofPhoto', null)} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div
              className="p-3 rounded-lg text-xs leading-relaxed"
              style={{ background: 'rgba(185, 71, 59, 0.2)', border: '1px solid var(--hazard)', color: '#FCA5A5' }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-lg font-medium text-sm text-white shadow-md transition-all hover:opacity-95 disabled:opacity-50"
            style={{ background: isAuthority ? 'var(--signal)' : 'var(--safe)' }}
          >
            {saving ? 'Validating credentials…' : isSignUp ? 'Create Verified Officer Account' : 'Sign In & Enter Command Room'}
          </button>
        </form>

        <div className="pt-2 text-center border-t" style={{ borderColor: 'var(--ink-line)' }}>
          <button
            type="button"
            onClick={() => {
              setIsSignUp((v) => !v)
              setError('')
            }}
            className="text-xs font-mono transition-colors hover:underline"
            style={{ color: 'var(--signal)' }}
          >
            {isSignUp
              ? 'Already registered? Sign in'
              : isAuthority
              ? 'New certified officer? Register verified authority account'
              : 'New shelter facility? Register shelter account'}
          </button>
        </div>
      </section>
    </main>
  )
}

function Field({ label, icon: Icon, value, onChange, type = 'text', minLength, placeholder }) {
  return (
    <label className="block text-xs" style={{ color: 'var(--mist)' }}>
      {label}
      <span className="relative block mt-1.5">
        <Icon className="absolute left-3 top-2.5 text-slate-400" size={15} />
        <input
          required
          type={type}
          minLength={minLength}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none transition-all focus:ring-1 focus:ring-amber-500"
          style={{ background: 'var(--ink)', border: '1px solid var(--ink-line)' }}
        />
      </span>
    </label>
  )
}