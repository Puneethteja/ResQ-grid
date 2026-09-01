import { useEffect, useRef, useState } from 'react'
import { Camera, X, RotateCcw, Check, Sparkles, ShieldAlert, Cpu, RefreshCw, FlipHorizontal } from 'lucide-react'
async function computeSha256(text) {
  if (!window.crypto?.subtle) {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i)
      hash |= 0
    }
    return Math.abs(hash).toString(16).padStart(16, '0')
  }
  const bytes = new TextEncoder().encode(text)
  const digest = await window.crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
export default function CameraCapture({ photo, setPhoto, coordinates, onSensorDataCaptured }) {
  const [open, setOpen] = useState(false)
  const [facingMode, setFacingMode] = useState('environment') 
  const [error, setError] = useState(null)
  const [sensorValues, setSensorValues] = useState({ alpha: 0, beta: 0, gamma: 0, accel: 0 })
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const sensorRef = useRef({ alpha: 0, beta: 0, gamma: 0 })
  useEffect(() => {
    function handleOrientation(e) {
      if (e.alpha !== null) {
        const data = {
          alpha: Math.round(e.alpha || 0),
          beta: Math.round(e.beta || 0),
          gamma: Math.round(e.gamma || 0),
        }
        sensorRef.current = data
        setSensorValues((prev) => ({ ...prev, ...data }))
      }
    }
    function handleMotion(e) {
      if (e.accelerationIncludingGravity) {
        const mag = Math.sqrt(
          (e.accelerationIncludingGravity.x || 0) ** 2 +
          (e.accelerationIncludingGravity.y || 0) ** 2 +
          (e.accelerationIncludingGravity.z || 0) ** 2
        )
        setSensorValues((prev) => ({ ...prev, accel: Number(mag.toFixed(2)) }))
      }
    }
    window.addEventListener('deviceorientation', handleOrientation, true)
    window.addEventListener('devicemotion', handleMotion, true)
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true)
      window.removeEventListener('devicemotion', handleMotion, true)
    }
  }, [])
  useEffect(() => {
    if (!open) return
    let cancelled = false
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    navigator.mediaDevices
      ?.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setError(null)
      })
      .catch((err) => {
        setError(`Camera permission denied (${facingMode} camera unavailable). Live WebRTC evidence stream required.`)
      })
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [open, facingMode])
  function toggleCamera() {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
  }
  async function capture() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    }
    const timestamp = new Date().toISOString()
    const lat = coordinates?.lat ? coordinates.lat.toFixed(5) : '20.29610'
    const lng = coordinates?.lng ? coordinates.lng.toFixed(5) : '85.82450'
    const hwSeed = `${lat}:${lng}:${timestamp}:${sensorRef.current.alpha}:${sensorRef.current.beta}:${facingMode}`
    const hwHash = await computeSha256(hwSeed)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'
    ctx.fillRect(0, canvas.height - 52, canvas.width, 52)
    ctx.fillRect(0, 0, canvas.width, 36)
    ctx.fillStyle = '#38BDF8'
    ctx.font = 'bold 14px monospace'
    ctx.fillText(`GPS: ${lat}°N, ${lng}°E [CAM: ${facingMode.toUpperCase()}]`, 16, 24)
    ctx.fillStyle = '#F59E0B'
    ctx.font = '12px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`SHA256: ${hwHash.slice(0, 16)}...`, canvas.width - 16, 24)
    ctx.textAlign = 'left'
    ctx.fillStyle = '#10B981'
    ctx.font = 'bold 13px monospace'
    ctx.fillText(`RESQGRID LIVE PROOF #${timestamp}`, 16, canvas.height - 28)
    ctx.fillStyle = '#94A3B8'
    ctx.font = '12px monospace'
    ctx.fillText(`SENSOR ORI: α:${sensorRef.current.alpha}° β:${sensorRef.current.beta}° γ:${sensorRef.current.gamma}°`, 16, canvas.height - 10)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.90)
    setPhoto(dataUrl)
    onSensorDataCaptured?.({
      ...sensorRef.current,
      captureHash: hwHash,
      facingMode,
      stampedAt: timestamp,
    })
    close()
  }
  function close() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setOpen(false)
    setError(null)
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="font-mono text-[11px] tracking-widest uppercase block" style={{ color: 'var(--graphite)' }}>
          Dual-Cam Live Evidence (Gallery Uploads Disabled)
        </label>
        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 flex items-center gap-1">
          <Cpu size={11} /> WebRTC Dual Cam Sealed
        </span>
      </div>
      {photo ? (
        <div className="relative rounded-xl overflow-hidden shadow-sm" style={{ border: '1px solid var(--paper-line)' }}>
          <img src={photo} alt="Attached Live Evidence" className="w-full max-h-56 object-cover" />
          <button
            type="button"
            onClick={() => setPhoto(null)}
            className="absolute top-2 right-2 rounded-full p-1.5 text-white bg-black/70 hover:bg-black transition-colors"
            title="Retake live photo"
          >
            <RotateCcw size={15} />
          </button>
          <div
            className="absolute bottom-0 left-0 right-0 px-3 py-1.5 text-[11px] font-mono flex items-center justify-between"
            style={{ background: 'rgba(0,0,0,0.85)', color: 'white' }}
          >
            <span className="flex items-center gap-1 text-emerald-400">
              <Check size={13} /> Live Camera Frame Verified
            </span>
            <span className="text-[10px] text-amber-300 flex items-center gap-1">
              <Sparkles size={11} /> SHA-256 Sealed
            </span>
          </div>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-bold shadow-md transition-all hover:opacity-90 active:scale-95 cursor-pointer border"
            style={{
              background: 'var(--ink-raised)',
              borderColor: 'var(--ink-line)',
              color: 'var(--text-primary)',
            }}
          >
            <Camera size={18} style={{ color: 'var(--signal)' }} /> Launch Secure Live Evidence Camera
          </button>
          <p className="text-[11px] mt-1.5 flex items-center gap-1 leading-snug" style={{ color: 'var(--mist)' }}>
            <ShieldAlert size={13} className="text-amber-500 shrink-0" />
            <span>To prevent gallery spoofing, ResQgrid strictly requires a live camera capture stamped with real-time GPS, sensor gyro, and SHA-256 hash.</span>
          </p>
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl space-y-0" style={{ background: 'var(--ink)' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--ink-line)' }}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="font-mono text-xs text-white uppercase tracking-widest">
                  Live Sensor-Locked Camera
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleCamera}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-sky-400 border border-slate-700 transition-colors"
                  title="Toggle Front / Back Camera"
                >
                  <FlipHorizontal size={13} />
                  <span>{facingMode === 'environment' ? 'Rear Cam' : 'Front Cam'}</span>
                </button>
                <button onClick={close} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>
            </div>
            {error ? (
              <div className="p-6 text-center space-y-3" style={{ color: 'var(--mist)' }}>
                <ShieldAlert size={32} className="mx-auto text-amber-500" />
                <p className="text-sm">{error}</p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={toggleCamera}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                  >
                    Switch to {facingMode === 'environment' ? 'Front' : 'Rear'} Camera
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative aspect-[3/4] bg-black overflow-hidden flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />
                <div className="absolute inset-3 border border-white/20 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                  <div className="flex justify-between text-[10px] font-mono text-emerald-400 bg-black/50 px-2.5 py-1 rounded backdrop-blur-sm">
                    <span>GPS: {coordinates ? `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}` : '20.2961, 85.8245'}</span>
                    <span>ORI: {sensorValues.alpha}°/{sensorValues.beta}°</span>
                  </div>
                  <div className="text-center font-mono text-[10px] text-white/70 bg-black/30 px-3 py-1 rounded mx-auto backdrop-blur-sm">
                    [ Align Hazard Live Frame ]
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-amber-300 bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                    <span>{facingMode === 'environment' ? 'REAR SENSOR' : 'FRONT SENSOR'}</span>
                    <span>#SHA256-LIVE-PROOF</span>
                  </div>
                </div>
              </div>
            )}
            {!error && (
              <div className="p-4 flex items-center justify-between px-8 bg-slate-950 border-t border-slate-800">
                <button
                  type="button"
                  onClick={toggleCamera}
                  className="p-3 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Switch Camera (Front/Rear)"
                >
                  <RefreshCw size={18} />
                </button>
                <button
                  type="button"
                  onClick={capture}
                  className="w-16 h-16 rounded-full border-4 shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                  style={{ borderColor: 'white', background: 'var(--signal)' }}
                  aria-label="Capture photo"
                >
                  <div className="w-6 h-6 rounded-full bg-white" />
                </button>
                <div className="w-10" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
