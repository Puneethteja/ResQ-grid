import { useState, useRef, useEffect } from 'react'
import { Sun, Moon, Globe, Check, ChevronDown } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
export default function ThemeLanguageBar({ compact = false }) {
  const { theme, toggleTheme, language, setLanguage, languages, t } = useApp()
  const [langOpen, setLangOpen] = useState(false)
  const menuRef = useRef(null)
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  const currentLang = languages.find((l) => l.code === language) || languages[0]
  return (
    <div className="flex items-center gap-2">
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setLangOpen((o) => !o)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium shadow-xs transition-all hover:opacity-90 active:scale-95 cursor-pointer"
          style={{
            background: 'var(--ink-raised)',
            border: '1px solid var(--ink-line)',
            color: 'var(--text-primary, #F8FAFC)',
          }}
          title={t('language')}
        >
          <Globe size={13} className="text-amber-500 shrink-0" />
          <span className="font-bold">{currentLang.native}</span>
          <ChevronDown size={12} className={`text-slate-400 transition-transform duration-150 ${langOpen ? 'rotate-180' : ''}`} />
        </button>
        {langOpen && (
          <div
            className="absolute right-0 mt-1.5 w-44 rounded-xl shadow-2xl p-1 z-[1100] border backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
            style={{
              background: 'var(--ink-raised)',
              borderColor: 'var(--ink-line)',
            }}
          >
            <div className="px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/50 mb-1">
              Select Language / ଭାଷା
            </div>
            {languages.map((l) => {
              const isSelected = l.code === language
              return (
                <button
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code)
                    setLangOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors font-medium cursor-pointer"
                  style={{
                    background: isSelected ? 'rgba(198, 91, 60, 0.2)' : 'transparent',
                    color: isSelected ? 'var(--signal, #C65B3C)' : 'var(--text-primary, #F8FAFC)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{l.native}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({l.label})</span>
                  </div>
                  {isSelected && <Check size={13} className="text-amber-500" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
      <button
        onClick={toggleTheme}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium shadow-xs transition-all hover:opacity-90 active:scale-95 cursor-pointer"
        style={{
          background: 'var(--ink-raised)',
          border: '1px solid var(--ink-line)',
          color: 'var(--text-primary, #F8FAFC)',
        }}
        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? (
          <>
            <Sun size={14} className="text-amber-400 animate-spin-slow" />
            {!compact && <span className="text-[11px] font-semibold">Light</span>}
          </>
        ) : (
          <>
            <Moon size={14} className="text-indigo-400" />
            {!compact && <span className="text-[11px] font-semibold">Dark</span>}
          </>
        )}
      </button>
    </div>
  )
}
