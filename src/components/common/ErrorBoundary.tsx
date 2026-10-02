import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertOctagon, RefreshCw, Terminal, Home } from 'lucide-react'
import { devLogger } from '@/lib/devLogger'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    // If dynamic chunk failed to load (e.g. after a rebuild or new deployment), reload page once
    const msg = error?.message || ''
    if (msg.includes('Failed to fetch dynamically imported module') || msg.includes('dynamically imported module')) {
      const lastChunkReload = sessionStorage.getItem('last_chunk_reload')
      const now = Date.now()
      if (!lastChunkReload || now - parseInt(lastChunkReload, 10) > 10000) {
        sessionStorage.setItem('last_chunk_reload', String(now))
        console.warn('[ErrorBoundary] Dynamic import error detected, auto-refreshing to fetch latest bundle...')
        window.location.reload()
        return
      }
    }

    // Record to Developer Error Logger
    devLogger.error('ReactErrorBoundary', error.message || 'React Render Crash', error, {
      componentStack: errorInfo.componentStack,
    })
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.href = '#/tables'
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-lg bg-stone-900 border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0">
                <AlertOctagon size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">Beklenmedik Bir Hata Oluştu</h1>
                <p className="text-xs text-stone-400 mt-0.5">Hata ayrıntıları otomatik olarak Geliştirici Günlüğüne kaydedildi.</p>
              </div>
            </div>

            <div className="bg-stone-950 rounded-2xl p-4 border border-stone-800 font-mono text-xs text-red-300 max-h-48 overflow-y-auto space-y-2 select-text">
              <div className="font-bold text-red-400">{this.state.error?.name}: {this.state.error?.message}</div>
              {this.state.error?.stack && (
                <pre className="text-[10px] text-stone-400 whitespace-pre-wrap leading-relaxed opacity-80">
                  {this.state.error.stack.slice(0, 600)}...
                </pre>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
              >
                <RefreshCw size={16} />
                <span>Sayfayı Yenile</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto flex-1 py-3 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-stone-700 active:scale-95"
              >
                <Home size={16} />
                <span>Ana Ekrana Dön</span>
              </button>
            </div>

            <div className="text-center pt-2 border-t border-stone-800/80">
              <a
                href="#/developer"
                className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-orange-400 transition-colors font-medium"
              >
                <Terminal size={14} />
                <span>Geliştirici & Hata Konsolunu Aç</span>
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
