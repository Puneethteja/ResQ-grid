import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, errorInfo) {
    console.error('ResQgrid React Error Caught:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-6 text-white"
          style={{ background: 'var(--ink, #0B1120)' }}
        >
          <div
            className="max-w-md w-full p-8 rounded-2xl shadow-2xl text-center space-y-5"
            style={{ background: 'var(--ink-raised, #131B2C)', border: '1px solid var(--ink-line, #1E293B)' }}
          >
            <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold font-display">Something went wrong</h2>
              <p className="text-xs text-slate-400">
                {this.state.error?.message || 'An unexpected rendering error occurred.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white shadow"
                style={{ background: 'var(--signal, #C65B3C)' }}
              >
                <RefreshCw size={13} /> Reload Page
              </button>
              <a
                href="/"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 border border-slate-700"
              >
                <Home size={13} /> Home
              </a>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
