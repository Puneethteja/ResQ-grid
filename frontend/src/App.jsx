import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { ArrowRight, Radio, ShieldCheck, MapPinned } from 'lucide-react'
import CitizenPortal from './pages/CitizenPortal.jsx'
import AuthorityDashboard from './pages/AuthorityDashboard.jsx'
import ShelterPortal from './pages/ShelterPortal.jsx'
import AuthPortal from './pages/AuthPortal.jsx'
import ThemeLanguageBar from './components/common/ThemeLanguageBar.jsx'
import { isAuthorityAuthenticated, isShelterAuthenticated } from './lib/authoritySession.js'
import { useApp } from './context/AppContext.jsx'
function RequireAuthority({ children }) {
  return isAuthorityAuthenticated() ? children : <Navigate to="/authority/login" replace />
}
function RequireShelter({ children }) {
  return isShelterAuthenticated() ? children : <Navigate to="/shelter/auth" replace />
}
function RoleSelect() {
  const { t } = useApp()
  const roles = [
    {
      to: '/citizen',
      label: t('role_citizen_title'),
      desc: t('role_citizen_desc'),
      mono: 'ROUTE 01',
    },
    {
      to: '/authority/login',
      label: t('role_authority_title'),
      desc: t('role_authority_desc'),
      mono: 'ROUTE 02',
    },
    {
      to: '/shelter/auth',
      label: t('role_shelter_title'),
      desc: t('role_shelter_desc'),
      mono: 'ROUTE 03',
    },
  ]
  return (
    <div className="min-h-screen resq-landing px-5 py-6 sm:p-10" style={{ background: 'var(--ink)' }}>
      <div className="w-full max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
            <img src="/logo.png" alt="ResQ-Grid Logo" className="w-8 h-8 rounded-lg object-contain bg-slate-900 border border-slate-700 shadow" />
            <span className="font-display text-lg font-bold">
              ResQ<span style={{ color: 'var(--signal)' }}>-</span>Grid
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm hidden sm:inline" style={{ color: 'var(--mist)' }}>
              {t('tagline')}
            </span>
            <ThemeLanguageBar />
          </div>
        </header>
        <section className="grid lg:grid-cols-[1.2fr_.8fr] gap-10 items-end mb-12">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
              {t('hero_title')}
            </h1>
            <p className="max-w-xl text-base sm:text-lg mt-5 leading-relaxed" style={{ color: 'var(--mist)' }}>
              {t('hero_sub')}
            </p>
          </div>
          <div className="rounded-xl p-5 grid grid-cols-2 gap-4" style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}>
            {[
              ['Report an emergency', Radio],
              ['Check trusted updates', ShieldCheck],
              ['Find a safe place', MapPinned],
            ].map(([label, Icon]) => (
              <div key={label} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                <Icon size={15} style={{ color: 'var(--signal)' }} />
                {label}
              </div>
            ))}
            <p className="col-span-2 pt-3 text-xs leading-relaxed" style={{ borderTop: '1px solid var(--ink-line)', color: 'var(--mist)' }}>
              Works alongside SMS and WhatsApp when data coverage is unreliable.
            </p>
          </div>
        </section>
        <div className="mb-4">
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('choose_role')}
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {roles.map((r) => (
            <Link
              key={r.to}
              to={r.to}
              className="group min-h-40 flex flex-col items-start justify-between rounded-xl p-5 transition-all hover:-translate-y-1 shadow-md"
              style={{ background: 'var(--ink-raised)', border: '1px solid var(--ink-line)' }}
            >
              <div>
                <div className="font-display text-lg font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                  {r.label}
                </div>
                <div className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--mist)' }}>
                  {r.desc}
                </div>
              </div>
              <span className="self-end text-sm font-semibold transition-transform group-hover:translate-x-1 flex items-center gap-1" style={{ color: 'var(--signal)' }}>
                {t('continue_btn')} <ArrowRight size={15} />
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-10 text-xs text-center" style={{ color: 'var(--mist)' }}>
          ResQ-Grid is designed to support—not replace—official emergency services.
        </p>
      </div>
    </div>
  )
}
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelect />} />
      <Route path="/citizen" element={<CitizenPortal />} />
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
