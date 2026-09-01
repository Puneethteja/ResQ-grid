import { createContext, useContext, useState, useEffect } from 'react'
import { translations, languages } from './translations.js'
const AppContext = createContext(null)
export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('resqgrid_theme') || 'dark'
    } catch {
      return 'dark'
    }
  })
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('resqgrid_language') || 'en'
    } catch {
      return 'en'
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem('resqgrid_theme', theme)
    } catch {
    }
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.remove('dark')
      root.classList.add('light')
      root.setAttribute('data-theme', 'light')
    } else {
      root.classList.remove('light')
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
    }
  }, [theme])
  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }
  function setLanguage(lang) {
    if (translations[lang]) {
      setLanguageState(lang)
      try {
        localStorage.setItem('resqgrid_language', lang)
      } catch {
      }
    }
  }
  function t(key, fallback = '') {
    const dict = translations[language] || translations.en
    return dict[key] || translations.en[key] || fallback || key
  }
  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        language,
        setLanguage,
        languages,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return ctx
}
