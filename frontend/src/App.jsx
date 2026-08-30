import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { ArrowRight, Radio, ShieldCheck, MapPinned } from 'lucide-react'
import CitizenPortal from './pages/CitizenPortal.jsx'
import AuthorityDashboard from './pages/AuthorityDashboard.jsx'
import ShelterPortal from './pages/ShelterPortal.jsx'
import AuthPortal from './pages/AuthPortal.jsx' 
import { isAuthorityAuthenticated, isShelterAuthenticated } from './lib/authoritySession.js'

function RequireAuthority({ children }) {
  return isAuthorityAuthenticated() ? children : <Navigate to="/authority/login" replace />
}

function RequireShelter({ children }) {
  return isShelterAuthenticated() ? children : <Navigate to="/shelter/auth" replace />
}

function RoleSelect() {
  const roles = [
    { to: '/citizen', label: 'Citizen Portal', desc: 'Report a hazard, check your safety status', mono: 'ROUTE 01' },
    { to: '/authority/login', label: 'Authority Command Room', desc: 'Officer sign in & security clearance, live map, triage feed', mono: 'ROUTE 02' },
    { to: '/shelter/auth', label: 'Shelter Management', desc: 'Capacity, infrastructure heartbeat, micro-havens', mono: 'ROUTE 03' },
  ]
  return (
    <div className="min-h-screen resq-landing px-5 py-6 sm:p-10" style={{ background: 'var(--ink)' }}>
      <div className="w-full max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2.5 text-white">
            <img src="/logo.png" alt="ResQ-Grid Logo" className="w-8 h-8 rounded-lg object-contain bg-slate-900 border border-slate-700 shadow" />
            <span className="font-display text-lg font-bold">ResQ<span style={{ color: 'var(--signal)' }}>-</span>Grid</span>
          </div>
          <span className="text-xs sm:text-sm" style={{ color: 'var(--mist)' }}>Community emergency response</span>
        </header>

        <section className="grid lg:grid-cols-[1.2fr_.8fr] gap-10 items-end mb-12">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-tight">Help people find safety faster.</h1>
            <p className="max-w-xl text-base sm:text-lg mt-5 leading-relaxed" style={{ color: 'var(--mist)' }}>ResQ-Grid helps residents report emergencies, gives shelters a simple way to share availability, and lets response teams see verified information in one place.</p>
          </div>
          <div className="rounded-xl p-5 grid grid-cols-2 gap-4" style={{ background: 'rgba(19,27,44,.82)', border: '1px solid var(--ink-line)' }}>
            {[['Report an emergency', Radio], ['Check trusted updates', ShieldCheck], ['Find a safe place', MapPinned]].map(([label, Icon]) => <div key={label} className="flex items-center gap-2 text-sm text-white"><Icon size={15} style={{ color: 'var(--signal)' }} />{label}</div>)}
            <p className="col-span-2 pt-3 text-xs leading-relaxed" style={{ borderTop: '1px solid var(--ink-line)', color: 'var(--mist)' }}>Works alongside SMS and WhatsApp when data coverage is unreliable.</p>
          </div>
        </section>

        <div className="mb-4"><h2 className="font-display text-xl text-white">Choose how you are using ResQ-Grid</h2></div>
        <div className="grid md:grid-cols-3 gap-4">
          {roles.map((r) => (
            <Link
              key={r.to}
              to={r.to}
              className="group min-h-40 flex flex-col items-start justify-between rounded-xl p-5 transition-all hover:-translate-y-1"
              style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}
            >
              <div>
                <div className="font-display text-lg text-white mt-1">{r.label}</div>
                <div className="text-sm mt-0.5" style={{ color: 'var(--mist)' }}>{r.desc}</div>
              </div>
              <span className="self-end text-sm transition-transform group-hover:translate-x-1" style={{ color: 'var(--signal)' }}>Continue <ArrowRight className="inline" size={15} /></span>
            </Link>
          ))}
        </div>
        <p className="mt-10 text-xs" style={{ color: 'var(--mist)' }}>ResQ-Grid is designed to support—not replace—official emergency services.</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelect />} />
      <Route path="/citizen" element={<CitizenPortal />} />

      {}
      <Route path="/authority/auth" element={<AuthPortal initialRole="authority" />} />
      <Route path="/authority/login" element={<AuthPortal initialRole="authority" />} />
      <Route
        path="/authority"
        element={
          <RequireAuthority>
            <AuthorityDashboard />
          </RequireAuthority>
        }
      />

      {/* Shelter Auth & Dashboard */}
      <Route path="/shelter/auth" element={<AuthPortal initialRole="shelter" />} />
      <Route path="/shelter/login" element={<AuthPortal initialRole="shelter" />} />
      <Route
        path="/shelter"
        element={
          <RequireShelter>
            <ShelterPortal />
          </RequireShelter>
        }
      />
    </Routes>
  )
}