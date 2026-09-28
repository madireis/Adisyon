import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Terminal,
  AlertTriangle,
  AlertOctagon,
  Info,
  Wifi,
  Database,
  RefreshCw,
  Trash2,
  Download,
  Copy,
  Check,
  Search,
  Cpu,
  Monitor,
  Smartphone,
  ShieldCheck,
  Sliders,
  Layers,
  ArrowRight,
  UserCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Activity,
  HardDrive
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { devLogger } from '@/lib/devLogger'
import { useApp } from '@/lib/store'
import { db } from '@/lib/db'
import { staffMembers } from '@/lib/mockData'
import type { DevLogEntry, DevLogLevel, SystemDiagnosticInfo, Staff } from '@/types/pos'

export default function DeveloperPage() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()

  const [logs, setLogs] = useState<DevLogEntry[]>([])
  const [diagnostics, setDiagnostics] = useState<SystemDiagnosticInfo | null>(null)
  const [activeTab, setActiveTab] = useState<'logs' | 'diagnostics' | 'database' | 'roles'>('logs')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // DB Explorer state
  const [selectedDbTable, setSelectedDbTable] = useState<string>('tables')
  const [tableData, setTableData] = useState<any[]>([])
  const [isRefreshingTable, setIsRefreshingTable] = useState(false)

  // Subscribe to real-time logs
  useEffect(() => {
    const unsubscribe = devLogger.subscribe(newLogs => {
      setLogs(newLogs)
    })
    return () => {
      unsubscribe()
    }
  }, [])

  // Refresh system diagnostics
  const refreshDiagnostics = async () => {
    try {
      const data = await devLogger.getDiagnostics()
      setDiagnostics(data)
    } catch {}
  }

  useEffect(() => {
    refreshDiagnostics()
    const timer = setInterval(refreshDiagnostics, 5000)
    return () => clearInterval(timer)
  }, [])

  // Load DB Table records for DB Explorer
  const loadDbTable = async (tableName: string) => {
    setIsRefreshingTable(true)
    try {
      if ((db as any)[tableName]) {
        const records = await (db as any)[tableName].toArray()
        setTableData(records.slice(0, 100))
      }
    } catch (err) {
      console.error('Failed to load table:', err)
    } finally {
      setIsRefreshingTable(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'database') {
      loadDbTable(selectedDbTable)
    }
  }, [activeTab, selectedDbTable])

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel
      const query = searchQuery.trim().toLowerCase()
      const matchesQuery =
        !query ||
        log.message.toLowerCase().includes(query) ||
        log.category.toLowerCase().includes(query) ||
        (log.stack && log.stack.toLowerCase().includes(query)) ||
        (log.route && log.route.toLowerCase().includes(query)) ||
        (log.userRole && log.userRole.toLowerCase().includes(query))

      return matchesLevel && matchesQuery
    })
  }, [logs, selectedLevel, searchQuery])

  // Count errors and warnings
  const stats = useMemo(() => {
    let errors = 0
    let warns = 0
    let networks = 0
    let syncs = 0
    logs.forEach(l => {
      if (l.level === 'error') errors++
      else if (l.level === 'warn') warns++
      else if (l.level === 'network') networks++
      else if (l.level === 'sync') syncs++
    })
    return { errors, warns, networks, syncs, total: logs.length }
  }, [logs])

  const copyLog = (log: DevLogEntry) => {
    const text = `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.category}]\nRoute: ${log.route}\nUser: ${log.userRole}\nMessage: ${log.message}${log.stack ? `\nStack:\n${log.stack}` : ''}${log.data ? `\nData:\n${JSON.stringify(log.data, null, 2)}` : ''}`
    navigator.clipboard.writeText(text)
    setCopiedId(log.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleRoleSwitch = (targetStaff: Staff) => {
    dispatch({ type: 'SWITCH_ACCOUNT', user: targetStaff })
    if (targetStaff.role === 'kitchen' || targetStaff.role === 'bar') {
      navigate('/kitchen')
    } else {
      navigate('/tables')
    }
  }

  return (
    <div className="h-full flex flex-col bg-stone-900 text-stone-100 overflow-hidden font-sans select-none">
      {/* Top Dev Header */}
      <header className="p-3 sm:p-4 bg-stone-950 border-b border-stone-800 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/40 text-orange-400 flex items-center justify-center font-black">
            <Terminal size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">Geliştirici & Tanılama Konsolu</h1>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-orange-950 text-orange-400 border border-orange-800">
                DEV MODE
              </span>
            </div>
            <p className="text-xs text-stone-400">Tüm sistem hataları, cihaz ortamı, ağ senkronizasyonu ve Dexie logları</p>
          </div>
        </div>

        {/* Global Stats & Diagnostic Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className={cn(
            "px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5",
            stats.errors > 0 ? "bg-red-950/80 text-red-400 border-red-800 animate-pulse" : "bg-stone-900 text-emerald-400 border-stone-800"
          )}>
            <AlertOctagon size={14} />
            <span>{stats.errors} Hata</span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-stone-900 text-amber-400 border border-stone-800 font-bold flex items-center gap-1.5">
            <AlertTriangle size={14} />
            <span>{stats.warns} Uyarı</span>
          </div>

          {diagnostics && (
            <div className="px-2.5 py-1 rounded-lg bg-stone-900 text-stone-300 border border-stone-800 font-mono text-[11px] hidden md:flex items-center gap-1.5">
              <Monitor size={13} className="text-stone-400" />
              <span>{diagnostics.os} • {diagnostics.browser}</span>
            </div>
          )}
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="px-3 sm:px-4 bg-stone-950/60 border-b border-stone-800 flex items-center gap-2 overflow-x-auto shrink-0">
        <button
          onClick={() => setActiveTab('logs')}
          className={cn(
            "py-2.5 px-3 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'logs' ? "border-orange-500 text-orange-400" : "border-transparent text-stone-400 hover:text-stone-200"
          )}
        >
          <Activity size={16} />
          <span>Canlı Loglar ({stats.total})</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={cn(
            "py-2.5 px-3 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'diagnostics' ? "border-orange-500 text-orange-400" : "border-transparent text-stone-400 hover:text-stone-200"
          )}
        >
          <Cpu size={16} />
          <span>Cihaz & İşletim Sistemi</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={cn(
            "py-2.5 px-3 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'database' ? "border-orange-500 text-orange-400" : "border-transparent text-stone-400 hover:text-stone-200"
          )}
        >
          <Database size={16} />
          <span>Veritabanı Gezgini</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={cn(
            "py-2.5 px-3 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'roles' ? "border-orange-500 text-orange-400" : "border-transparent text-stone-400 hover:text-stone-200"
          )}
        >
          <UserCheck size={16} />
          <span>Rol Simülatörü</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden p-3 sm:p-5 flex flex-col">
        {/* ── TAB 1: LIVE LOGS ── */}
        {activeTab === 'logs' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            {/* Filter and Action Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Loglarda ara (mesaj, stack, kategori, url)..."
                    className="w-full pl-9 pr-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <select
                  value={selectedLevel}
                  onChange={e => setSelectedLevel(e.target.value)}
                  className="bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-200 font-bold focus:outline-none"
                >
                  <option value="all">Tüm Seviyeler</option>
                  <option value="error">Sadece Hatalar (Error)</option>
                  <option value="warn">Uyarılar (Warn)</option>
                  <option value="network">Ağ / İstekler (Network)</option>
                  <option value="sync">Senkronizasyon (Sync)</option>
                  <option value="db">Veritabanı (DB)</option>
                  <option value="info">Bilgi (Info)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto">
                {/* Error Simulator buttons */}
                <button
                  onClick={() => devLogger.simulateError('uncaught')}
                  className="px-2 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                  title="Test Hata Fırlat"
                >
                  + JS Hata Testi
                </button>
                <button
                  onClick={() => devLogger.simulateError('rejection')}
                  className="px-2 py-1.5 bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                  title="Test Promise Reddi Fırlat"
                >
                  + Promise Hata
                </button>
                <button
                  onClick={() => devLogger.simulateError('network')}
                  className="px-2 py-1.5 bg-sky-950/60 hover:bg-sky-900 text-sky-300 border border-sky-800 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                  title="Ağ Hatası Simüle Et"
                >
                  + Ağ Testi
                </button>

                <div className="h-4 w-px bg-stone-800 mx-1"></div>

                <button
                  onClick={() => devLogger.exportJson()}
                  className="p-1.5 text-stone-400 hover:text-white bg-stone-950 border border-stone-800 rounded-lg transition-colors cursor-pointer"
                  title="JSON Olarak İndir"
                >
                  <Download size={15} />
                </button>
                <button
                  onClick={() => devLogger.clear()}
                  className="p-1.5 text-stone-400 hover:text-red-400 bg-stone-950 border border-stone-800 rounded-lg transition-colors cursor-pointer"
                  title="Logları Temizle"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Logs List Container */}
            <div className="flex-1 bg-stone-950 border border-stone-800 rounded-2xl p-2 sm:p-3 overflow-y-auto font-mono text-xs space-y-2 select-text">
              {filteredLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-600 space-y-2 py-12">
                  <Check size={32} className="text-emerald-500/50" />
                  <p className="font-sans text-sm font-bold text-stone-400">Kayıtlı hata veya log bulunmuyor</p>
                  <p className="font-sans text-xs text-stone-600">Sistem sorunsuz ve stabil çalışıyor.</p>
                </div>
              ) : (
                filteredLogs.map(log => {
                  const isExpanded = expandedLogId === log.id
                  const isCopied = copiedId === log.id

                  let badgeColor = 'bg-stone-800 text-stone-300 border-stone-700'
                  let levelIcon = <Info size={13} />
                  if (log.level === 'error') {
                    badgeColor = 'bg-red-950/80 text-red-400 border-red-800'
                    levelIcon = <AlertOctagon size={13} />
                  } else if (log.level === 'warn') {
                    badgeColor = 'bg-amber-950/80 text-amber-400 border-amber-800'
                    levelIcon = <AlertTriangle size={13} />
                  } else if (log.level === 'network') {
                    badgeColor = 'bg-sky-950/80 text-sky-400 border-sky-800'
                    levelIcon = <Wifi size={13} />
                  } else if (log.level === 'sync') {
                    badgeColor = 'bg-purple-950/80 text-purple-400 border-purple-800'
                    levelIcon = <RefreshCw size={13} />
                  } else if (log.level === 'db') {
                    badgeColor = 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                    levelIcon = <Database size={13} />
                  }

                  return (
                    <div
                      key={log.id}
                      className={cn(
                        "p-2.5 rounded-xl border transition-all",
                        log.level === 'error' ? "bg-red-950/10 border-red-900/50" : "bg-stone-900/40 border-stone-800/80"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          {/* Level badge */}
                          <span className={cn("px-2 py-0.5 rounded border text-[10px] font-black uppercase flex items-center gap-1 shrink-0", badgeColor)}>
                            {levelIcon}
                            <span>{log.level}</span>
                          </span>

                          {/* Category badge */}
                          <span className="text-[10px] px-1.5 py-0.5 bg-stone-900 text-stone-400 border border-stone-800 rounded font-bold shrink-0">
                            {log.category}
                          </span>

                          {/* Message */}
                          <div className="flex-1 min-w-0">
                            <span className={cn(
                              "font-semibold break-words",
                              log.level === 'error' ? "text-red-300" : log.level === 'warn' ? "text-amber-200" : "text-stone-200"
                            )}>
                              {log.message}
                            </span>
                          </div>
                        </div>

                        {/* Metadata & Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-stone-500 hidden sm:inline">
                            {new Date(log.timestamp).toLocaleTimeString('tr-TR')}
                          </span>

                          <button
                            onClick={() => copyLog(log)}
                            className="p-1 text-stone-500 hover:text-stone-200 transition-colors cursor-pointer"
                            title="Kopyala"
                          >
                            {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                          </button>

                          {Boolean(log.stack || log.data) && (
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="p-1 text-stone-500 hover:text-stone-200 transition-colors cursor-pointer"
                              title="Detay Göster"
                            >
                              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Route & User info line */}
                      <div className="mt-1 flex items-center gap-3 text-[10px] text-stone-500 font-sans">
                        <span>Sayfa: <code className="text-stone-400 font-mono">{log.route || '/'}</code></span>
                        <span>Kullanıcı: <span className="text-stone-400 font-medium">{log.userRole || 'Anonim'}</span></span>
                      </div>

                      {/* Expanded Stack & Data */}
                      {isExpanded && (
                        <div className="mt-2.5 pt-2 border-t border-stone-800/80 space-y-2 text-[11px]">
                          {Boolean(log.stack) && (
                            <div>
                              <div className="text-[10px] uppercase font-bold text-stone-400 mb-1">Hata Yığını (Stack Trace):</div>
                              <pre className="p-2.5 rounded-lg bg-stone-950 border border-stone-800 text-red-300/90 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                                {log.stack}
                              </pre>
                            </div>
                          )}

                          {Boolean(log.data) && (
                            <div>
                              <div className="text-[10px] uppercase font-bold text-stone-400 mb-1">Ekstra Veri / Parametreler:</div>
                              <pre className="p-2.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-300 whitespace-pre-wrap overflow-x-auto">
                                {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : String(log.data)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: SYSTEM & DEVICE DIAGNOSTICS ── */}
        {activeTab === 'diagnostics' && (
          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card 1: OS & Browser */}
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2.5 text-orange-400 font-bold text-sm">
                  <Monitor size={18} />
                  <span>İşletim Sistemi & Tarayıcı</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-stone-800/80">
                    <span className="text-stone-400">İşletim Sistemi:</span>
                    <span className="font-bold text-white">{diagnostics?.os} {diagnostics?.osVersion}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-800/80">
                    <span className="text-stone-400">Tarayıcı Motoru:</span>
                    <span className="font-bold text-white">{diagnostics?.browser} {diagnostics?.browserVersion}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-800/80">
                    <span className="text-stone-400">Cihaz Türü:</span>
                    <span className="font-bold uppercase text-orange-400">{diagnostics?.deviceType}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-800/80">
                    <span className="text-stone-400">Dokunmatik Ekran (Touch):</span>
                    <span className="font-bold">{diagnostics?.touchSupported ? 'Evet (Touch Destekli)' : 'Hayır (Fare/Mouse)'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-400">PWA Tam Ekran (Standalone):</span>
                    <span className="font-bold text-emerald-400">{diagnostics?.isPwaStandalone ? 'Evet (PWA Yüklü)' : 'Tarayıcı Sekmesinde'}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Screen & Display */}
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2.5 text-sky-400 font-bold text-sm">
                  <Smartphone size={18} />
                  <span>Ekran & Çözünürlük</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-stone-800/80">
                    <span className="text-stone-400">Fiziksel Ekran:</span>
                    <span className="font-mono text-white">{diagnostics?.screenWidth} x {diagnostics?.screenHeight} px</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-800/80">
                    <span className="text-stone-400">Görünüm Alanı (Viewport):</span>
                    <span className="font-mono text-white">{diagnostics?.viewportWidth} x {diagnostics?.viewportHeight} px</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-800/80">
                    <span className="text-stone-400">Piksel Yoğunluğu (DPR):</span>
                    <span className="font-mono text-white">{diagnostics?.pixelRatio}x (Retina/HiDPI)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-800/80">
                    <span className="text-stone-400">Ağ Durumu:</span>
                    <span className={cn("font-bold", diagnostics?.isOnline ? "text-emerald-400" : "text-red-400")}>
                      {diagnostics?.isOnline ? 'Çevrimiçi (Online)' : 'Çevrimdışı (Offline)'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-400">Bağlantı Türü:</span>
                    <span className="font-mono text-stone-300 text-[11px] truncate max-w-[160px]">{diagnostics?.networkType || 'Standart'}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Storage & Memory */}
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2.5 text-purple-400 font-bold text-sm">
                  <HardDrive size={18} />
                  <span>Bellek & Depolama Alanı</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-stone-800/80">
                    <span className="text-stone-400">IndexedDB Durumu:</span>
                    <span className={cn("font-bold", diagnostics?.dexieStatus.isReady ? "text-emerald-400" : "text-red-400")}>
                      {diagnostics?.dexieStatus.isReady ? 'Hazır & Aktif' : 'Bağlantı Bekleniyor'}
                    </span>
                  </div>
                  {diagnostics?.storageEstimate && (
                    <div className="flex justify-between py-1 border-b border-stone-800/80">
                      <span className="text-stone-400">Depolama Kotası:</span>
                      <span className="font-mono text-white">{diagnostics.storageEstimate.usage} MB / {diagnostics.storageEstimate.quota} GB</span>
                    </div>
                  )}
                  {diagnostics?.memoryUsage && (
                    <div className="flex justify-between py-1 border-b border-stone-800/80">
                      <span className="text-stone-400">JS Bellek (Heap):</span>
                      <span className="font-mono text-white">{diagnostics.memoryUsage.usedJSHeapSize} MB / {diagnostics.memoryUsage.totalJSHeapSize} MB</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <span className="text-stone-400">Toplam Tablo Kayıtları:</span>
                    <span className="font-bold text-orange-400">
                      {Object.values(diagnostics?.dexieStatus.tableCounts || {}).reduce((a, b) => a + b, 0)} Kayıt
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* IndexedDB Table Breakdown */}
            <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-sm text-stone-200 flex items-center gap-2">
                <Database size={16} className="text-orange-500" />
                <span>IndexedDB Tablo Kayıt Sayıları (Canlı)</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 text-xs font-mono">
                {Object.entries(diagnostics?.dexieStatus.tableCounts || {}).map(([table, count]) => (
                  <div key={table} className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex justify-between items-center">
                    <span className="text-stone-400 font-sans">{table}:</span>
                    <span className="font-bold text-white bg-stone-800 px-2 py-0.5 rounded">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: DATABASE EXPLORER ── */}
        {activeTab === 'database' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            <div className="flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400 font-bold">Tablo Seçin:</span>
                <select
                  value={selectedDbTable}
                  onChange={e => setSelectedDbTable(e.target.value)}
                  className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-orange-400 font-bold focus:outline-none"
                >
                  <option value="tables">Masalar (tables)</option>
                  <option value="orders">Aktif/Geçmiş Siparişler (orders)</option>
                  <option value="kitchenTickets">Mutfak Fişleri (kitchenTickets)</option>
                  <option value="payments">Tahsilatlar (payments)</option>
                  <option value="menuItems">Menü Ürünleri (menuItems)</option>
                  <option value="staff">Personel Hesapları (staff)</option>
                  <option value="auditLogs">Denetim Günlüğü (auditLogs)</option>
                  <option value="cashTransactions">Kasa Hareketleri (cashTransactions)</option>
                  <option value="devLogs">Geliştirici Hata Logları (devLogs)</option>
                </select>
              </div>

              <button
                onClick={() => loadDbTable(selectedDbTable)}
                disabled={isRefreshingTable}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={14} className={cn(isRefreshingTable && "animate-spin")} />
                <span>Yenile</span>
              </button>
            </div>

            {/* Records Table */}
            <div className="flex-1 bg-stone-950 border border-stone-800 rounded-2xl overflow-auto text-xs font-mono p-3 select-text">
              {tableData.length === 0 ? (
                <div className="py-12 text-center text-stone-500 font-sans">
                  Bu tabloda kayıt bulunmuyor.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-[11px] text-stone-500 font-sans pb-1 border-b border-stone-800 flex justify-between">
                    <span>Toplam {tableData.length} kayıt gösteriliyor (Maks 100)</span>
                  </div>
                  {tableData.map((row, idx) => (
                    <div key={row.id || idx} className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800/80 hover:border-orange-500/30 transition-colors">
                      <div className="flex items-center justify-between text-[11px] text-orange-400 font-bold mb-1">
                        <span>ID: {row.id || `Row #${idx + 1}`}</span>
                        {row.status && <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 text-[10px]">{row.status}</span>}
                      </div>
                      <pre className="text-[11px] text-stone-300 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(row, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 4: ROLE SIMULATOR ── */}
        {activeTab === 'roles' && (
          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Anında Rol Simülasyonu</h3>
                  <p className="text-xs text-stone-400">Şifre girmeden tek tıkla herhangi bir role geçip o kullanıcının ekranını ve yetkilerini test edin.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {staffMembers.map(staff => {
                  const isCurrent = state.currentUser?.id === staff.id

                  let roleBadgeColor = 'bg-stone-800 text-stone-300 border-stone-700'
                  if (staff.role === 'owner') roleBadgeColor = 'bg-amber-950 text-amber-400 border-amber-800'
                  else if (staff.role === 'manager') roleBadgeColor = 'bg-blue-950 text-blue-400 border-blue-800'
                  else if (staff.role === 'cashier') roleBadgeColor = 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  else if (staff.role === 'waiter') roleBadgeColor = 'bg-orange-950 text-orange-400 border-orange-800'
                  else if (staff.role === 'kitchen' || staff.role === 'bar') roleBadgeColor = 'bg-purple-950 text-purple-400 border-purple-800'

                  return (
                    <div
                      key={staff.id}
                      className={cn(
                        "p-4 rounded-xl border transition-all flex flex-col justify-between gap-3",
                        isCurrent ? "bg-orange-950/20 border-orange-500/50" : "bg-stone-900 border-stone-800 hover:border-stone-700"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm text-white">{staff.name}</div>
                          <div className="text-[11px] font-mono text-stone-400 mt-0.5">No: {staff.username} • PIN: {staff.pin}</div>
                        </div>
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border", roleBadgeColor)}>
                          {staff.role}
                        </span>
                      </div>

                      <button
                        onClick={() => handleRoleSwitch(staff)}
                        disabled={isCurrent}
                        className={cn(
                          "w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95",
                          isCurrent
                            ? "bg-stone-800 text-stone-500 cursor-not-allowed"
                            : "bg-orange-600 hover:bg-orange-500 text-white shadow-xs"
                        )}
                      >
                        <span>{isCurrent ? 'Aktif Hesap' : 'Bu Role Geç'}</span>
                        {!isCurrent && <ArrowRight size={14} />}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
