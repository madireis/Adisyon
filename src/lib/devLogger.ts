import { db } from '@/lib/db'
import type { DevLogEntry, DevLogLevel, SystemDiagnosticInfo } from '@/types/pos'
import { generateId } from '@/lib/utils'

// In-memory ring buffer (up to 1,000 logs for instant access)
const MAX_MEMORY_LOGS = 1000
const memoryLogs: DevLogEntry[] = []
const listeners = new Set<(logs: DevLogEntry[]) => void>()

let isInitialized = false
let originalConsoleError: typeof console.error
let originalConsoleWarn: typeof console.warn
let originalConsoleInfo: typeof console.info
let originalFetch: typeof window.fetch

// Helper to determine route if available
function getCurrentRoute(): string {
  try {
    return window.location.hash || window.location.pathname || '/'
  } catch {
    return '/'
  }
}

// Local server base URL resolver
function getLocalServerUrl(): string {
  try {
    if (typeof localStorage !== 'undefined') {
      const custom = localStorage.getItem('wots_custom_local_ip')
      if (custom && custom.trim()) {
        return `http://${custom.trim()}:3001`
      }
    }
    const hostname = (typeof window !== 'undefined' && window.location.hostname) || 'localhost'
    if (hostname.includes('github.io')) return ''
    return `http://${hostname}:3001`
  } catch {
    return 'http://localhost:3001'
  }
}

// Helper to get active user role from session, local storage or current route context
export function getCurrentRole(): string {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem('pos_current_user')
      if (raw) {
        const u = JSON.parse(raw)
        const roleStr = u.role ? ` (${u.role})` : ''
        return `${u.name || u.username || 'Personel'}${roleStr}`
      }
      const rawRole = sessionStorage.getItem('wots_role')
      if (rawRole) return `Rol: ${rawRole}`
    }
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('pos_current_user') || localStorage.getItem('pos_user')
      if (raw) {
        const u = JSON.parse(raw)
        const roleStr = u.role ? ` (${u.role})` : ''
        return `${u.name || u.username || 'Personel'}${roleStr}`
      }
    }
    if (typeof window !== 'undefined') {
      const path = (window.location.hash || window.location.pathname || '').toLowerCase()
      if (path.includes('/qr/') || path.includes('/menu')) return 'Müşteri (QR Menü)'
      if (path.includes('/kitchen')) return 'Mutfak Ekranı'
      if (path.includes('/tables')) return 'Garson / Masalar'
      if (path.includes('/pos') || path.includes('/cashier')) return 'Kasa / Kasiyer'
      if (path.includes('/reports') || path.includes('/admin')) return 'Yönetici / Patron'
      if (path.includes('/developer')) return 'Geliştirici (Dev)'
    }
  } catch {}
  return 'Sistem / Anonim'
}

// Emit update to all subscribed listeners
function notifyListeners() {
  const snapshot = [...memoryLogs]
  listeners.forEach(fn => {
    try {
      fn(snapshot)
    } catch (e) {
      // Avoid recursive logger crash
    }
  })
}

// Send error log entry directly to Host PC local disk storage (data/logs/errors_YYYY-MM-DD.log)
function sendErrorToLocalServer(entry: DevLogEntry) {
  try {
    const baseUrl = getLocalServerUrl()
    if (!baseUrl) return

    if (typeof window !== 'undefined' && window.fetch) {
      const fetchFn = originalFetch || window.fetch.bind(window)
      fetchFn(`${baseUrl}/api/logs/error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: entry.category,
          message: entry.message,
          userRole: entry.userRole,
          route: entry.route,
          stack: entry.stack,
          data: entry.data,
          userAgent: entry.userAgent,
          timestamp: entry.timestamp,
        }),
      }).catch(() => {
        // Silently ignore when server is offline
      })
    }
  } catch {}
}

// Ingest remote log coming from another connected device or server broadcast
export function ingestRemoteLog(entry: DevLogEntry) {
  if (!entry || !entry.id) return
  if (memoryLogs.some(l => l.id === entry.id)) return // Deduplicate

  memoryLogs.unshift(entry)
  if (memoryLogs.length > MAX_MEMORY_LOGS) {
    memoryLogs.pop()
  }
  notifyListeners()

  try {
    if (db && db.devLogs) {
      db.devLogs.add(entry).catch(() => {})
    }
  } catch {}
}

// Persist a log entry to memory, Dexie IndexedDB, and Host PC local disk error log
export async function addDevLog(
  level: DevLogLevel,
  category: string,
  message: string,
  extra?: { stack?: string; data?: unknown; route?: string; userRole?: string }
): Promise<DevLogEntry> {
  const entry: DevLogEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    level,
    category,
    message: String(message || 'Unknown log message'),
    stack: extra?.stack,
    data: extra?.data,
    route: extra?.route || getCurrentRoute(),
    userRole: extra?.userRole || getCurrentRole(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  }

  // 1. In-memory buffer update
  memoryLogs.unshift(entry)
  if (memoryLogs.length > MAX_MEMORY_LOGS) {
    memoryLogs.pop()
  }

  // 2. Notify real-time UI listeners
  notifyListeners()

  // 3. Persist to Dexie asynchronously
  try {
    if (db && db.devLogs) {
      await db.devLogs.add(entry)
    }
  } catch (err) {
    // If IndexedDB quota exceeded, fallback to keep in memory without throwing
  }

  // 4. If this is an error or network issue, persist directly to Host PC local disk error logs
  if (level === 'error' || level === 'network') {
    sendErrorToLocalServer(entry)
  }

  return entry
}

// OS and Browser detection engine
export function detectEnvironment() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const platform = typeof navigator !== 'undefined' ? navigator.platform || '' : ''

  let os = 'Unknown OS'
  let osVersion = ''
  let browser = 'Unknown Browser'
  let browserVersion = ''
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop'

  // OS Detection
  if (/iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    os = 'iOS'
    deviceType = /iPad/.test(ua) ? 'tablet' : 'mobile'
    const match = ua.match(/OS (\d+[._]\d+)/)
    if (match) osVersion = match[1].replace('_', '.')
  } else if (/Android/.test(ua)) {
    os = 'Android'
    deviceType = /Tablet|Nexus 7|Nexus 10/i.test(ua) ? 'tablet' : 'mobile'
    const match = ua.match(/Android\s([0-9.]+)/)
    if (match) osVersion = match[1]
  } else if (/Windows NT/.test(ua)) {
    os = 'Windows'
    const match = ua.match(/Windows NT ([0-9.]+)/)
    if (match) {
      const v = match[1]
      if (v === '10.0') osVersion = '10 / 11'
      else if (v === '6.3') osVersion = '8.1'
      else if (v === '6.1') osVersion = '7'
      else osVersion = v
    }
  } else if (/Macintosh|Mac OS X/.test(ua)) {
    os = 'macOS'
    const match = ua.match(/Mac OS X ([0-9_]+)/)
    if (match) osVersion = match[1].replace(/_/g, '.')
  } else if (/Linux/.test(ua)) {
    os = 'Linux'
  }

  // Browser Detection
  if (/Edg\//.test(ua)) {
    browser = 'Microsoft Edge'
    browserVersion = ua.split('Edg/')[1]?.split(' ')[0] || ''
  } else if (/SamsungBrowser\//.test(ua)) {
    browser = 'Samsung Internet'
    browserVersion = ua.split('SamsungBrowser/')[1]?.split(' ')[0] || ''
  } else if (/Chrome\//.test(ua) && !/Chromium|OPR/.test(ua)) {
    browser = 'Google Chrome'
    browserVersion = ua.split('Chrome/')[1]?.split(' ')[0] || ''
  } else if (/Safari\//.test(ua) && !/Chrome|Chromium/.test(ua)) {
    browser = 'Apple Safari'
    browserVersion = ua.split('Version/')[1]?.split(' ')[0] || ''
  } else if (/Firefox\//.test(ua)) {
    browser = 'Mozilla Firefox'
    browserVersion = ua.split('Firefox/')[1]?.split(' ')[0] || ''
  } else if (/OPR\//.test(ua)) {
    browser = 'Opera'
    browserVersion = ua.split('OPR/')[1]?.split(' ')[0] || ''
  }

  const touchSupported = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  if (touchSupported && deviceType === 'desktop' && window.innerWidth <= 840) {
    deviceType = window.innerWidth <= 500 ? 'mobile' : 'tablet'
  }

  return {
    os,
    osVersion,
    browser,
    browserVersion,
    deviceType,
    touchSupported,
  }
}

// Fetch comprehensive system diagnostics
export async function getSystemDiagnostics(): Promise<SystemDiagnosticInfo> {
  const env = detectEnvironment()
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
  const isPwaStandalone = typeof window !== 'undefined'
    ? window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
    : false

  let networkType = 'Unknown'
  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  if (conn) {
    networkType = `${conn.effectiveType || ''} ${conn.type || ''} (downlink: ${conn.downlink || 'N/A'} Mbps, rtt: ${conn.rtt || 'N/A'}ms)`.trim()
  }

  // Storage estimation
  let storageEstimate: { usage: number; quota: number; percent: number } | undefined
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const est = await navigator.storage.estimate()
      if (est.quota && est.usage !== undefined) {
        storageEstimate = {
          usage: Math.round((est.usage / (1024 * 1024)) * 10) / 10,
          quota: Math.round((est.quota / (1024 * 1024 * 1024)) * 10) / 10,
          percent: Math.round((est.usage / est.quota) * 100),
        }
      }
    } catch {}
  }

  // Memory stats
  let memoryUsage: { usedJSHeapSize: number; totalJSHeapSize: number } | undefined
  const perf = performance as any
  if (perf && perf.memory) {
    memoryUsage = {
      usedJSHeapSize: Math.round(perf.memory.usedJSHeapSize / (1024 * 1024)),
      totalJSHeapSize: Math.round(perf.memory.totalJSHeapSize / (1024 * 1024)),
    }
  }

  // Dexie health check & table counts
  const tableCounts: Record<string, number> = {}
  let isReady = false
  try {
    if (db && db.isOpen()) {
      isReady = true
      const tableNames = ['tables', 'orders', 'kitchenTickets', 'payments', 'categories', 'menuItems', 'staff', 'auditLogs', 'cashTransactions', 'devLogs']
      for (const name of tableNames) {
        try {
          tableCounts[name] = await (db as any)[name]?.count() ?? 0
        } catch {
          tableCounts[name] = 0
        }
      }
    }
  } catch {
    isReady = false
  }

  return {
    ...env,
    screenWidth: typeof window !== 'undefined' ? window.screen.width : 0,
    screenHeight: typeof window !== 'undefined' ? window.screen.height : 0,
    viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    isPwaStandalone,
    isOnline,
    networkType,
    storageEstimate,
    memoryUsage,
    dexieStatus: {
      isReady,
      tableCounts,
    },
  }
}

// Global Logger Initialization
export function initDevLogger() {
  if (isInitialized || typeof window === 'undefined') return
  isInitialized = true

  // 1. Capture Global Uncaught Exceptions
  window.addEventListener('error', (event: ErrorEvent) => {
    addDevLog('error', 'WindowRuntime', event.message || 'Uncaught Error', {
      stack: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
      data: {
        filename: event.filename,
        line: event.lineno,
        col: event.colno,
      },
    })
  })

  // 2. Capture Unhandled Promise Rejections
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason
    const message = reason instanceof Error ? reason.message : String(reason || 'Unhandled Promise Rejection')
    const stack = reason instanceof Error ? reason.stack : undefined

    addDevLog('error', 'UnhandledPromise', message, {
      stack,
      data: reason,
    })
  })

  // 3. Hook Console Methods
  originalConsoleError = console.error.bind(console)
  originalConsoleWarn = console.warn.bind(console)
  originalConsoleInfo = console.info.bind(console)

  console.error = (...args: any[]) => {
    try {
      const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
      const err = args.find(a => a instanceof Error)
      addDevLog('error', 'ConsoleError', msg, {
        stack: err?.stack,
        data: args.length === 1 && typeof args[0] === 'object' ? args[0] : args,
      })
    } catch {}
    originalConsoleError(...args)
  }

  console.warn = (...args: any[]) => {
    try {
      const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
      addDevLog('warn', 'ConsoleWarn', msg, {
        data: args,
      })
    } catch {}
    originalConsoleWarn(...args)
  }

  // 4. Hook Network Fetch
  if (window.fetch) {
    originalFetch = window.fetch.bind(window)
    window.fetch = async (...args) => {
      const [input, init] = args
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url
      const method = (init?.method || 'GET').toUpperCase()

      const startTime = performance.now()
      try {
        const response = await originalFetch(...args)
        const duration = Math.round(performance.now() - startTime)

        if (!response.ok) {
          addDevLog('network', 'FetchError', `${method} ${url} -> HTTP ${response.status} (${response.statusText}) [${duration}ms]`, {
            data: { url, method, status: response.status, statusText: response.statusText, duration },
          })
        }
        return response
      } catch (err: any) {
        const duration = Math.round(performance.now() - startTime)
        addDevLog('network', 'FetchFailed', `${method} ${url} -> Network Error: ${err?.message || err} [${duration}ms]`, {
          stack: err?.stack,
          data: { url, method, error: String(err), duration },
        })
        throw err
      }
    }
  }

  // 5. Initial System Boot Log
  const env = detectEnvironment()
  addDevLog('info', 'SystemBoot', `Wot's POS Başlatıldı • OS: ${env.os} (${env.deviceType}) • Tarayıcı: ${env.browser}`, {
    data: {
      screen: `${window.innerWidth}x${window.innerHeight}`,
      dpr: window.devicePixelRatio,
      online: navigator.onLine,
      time: new Date().toLocaleString('tr-TR'),
    }
  })
}

// DevLogger public interface
export const devLogger = {
  error: (category: string, message: string, error?: unknown, data?: unknown) => {
    const stack = error instanceof Error ? error.stack : undefined
    return addDevLog('error', category, message, { stack, data })
  },
  warn: (category: string, message: string, data?: unknown) => {
    return addDevLog('warn', category, message, { data })
  },
  info: (category: string, message: string, data?: unknown) => {
    return addDevLog('info', category, message, { data })
  },
  network: (message: string, data?: unknown) => {
    return addDevLog('network', 'NetworkSync', message, { data })
  },
  sync: (message: string, data?: unknown) => {
    return addDevLog('sync', 'SyncEngine', message, { data })
  },
  db: (message: string, data?: unknown) => {
    return addDevLog('db', 'DatabaseDexie', message, { data })
  },
  getLogs: () => [...memoryLogs],
  clear: async () => {
    memoryLogs.length = 0
    notifyListeners()
    try {
      if (db && db.devLogs) {
        await db.devLogs.clear()
      }
    } catch {}
  },
  subscribe: (callback: (logs: DevLogEntry[]) => void) => {
    listeners.add(callback)
    callback([...memoryLogs])
    return () => listeners.delete(callback)
  },
  exportJson: () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(memoryLogs, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `wots-dev-logs-${Date.now()}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  },
  exportTxt: () => {
    const textContent = memoryLogs
      .map(
        l => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.category}] (${l.route} - ${l.userRole}): ${l.message}${
          l.stack ? `\nSTACK: ${l.stack}` : ''
        }`
      )
      .join('\n\n')

    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent)
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `wots-dev-logs-${Date.now()}.txt`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  },
  getDiagnostics: getSystemDiagnostics,
  ingestRemoteLog,
  fetchTodayDiskErrors: async (): Promise<{ success: boolean; lines: string[]; error?: string }> => {
    try {
      const baseUrl = getLocalServerUrl()
      if (!baseUrl) return { success: false, lines: [], error: 'Yerel sunucu adresi belirlenemedi.' }
      const res = await (originalFetch || window.fetch)(`${baseUrl}/api/storage/errors/today`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      return { success: true, lines: json.lines || [] }
    } catch (err: any) {
      return { success: false, lines: [], error: err?.message || 'Disk hata kütüğü okunamadı.' }
    }
  },
  logAccountError: (accountRole: string, category: string, message: string, error?: unknown, data?: unknown) => {
    const stack = error instanceof Error ? error.stack : undefined
    return addDevLog('error', category, message, { stack, data, userRole: accountRole })
  },
  // Error Simulator for Testing & QA across various system and role layers
  simulateError: (type: 'uncaught' | 'rejection' | 'network' | 'db') => {
    switch (type) {
      case 'uncaught':
        setTimeout(() => {
          throw new Error('Test: Simüle Edilmiş Uncaught JS Hatası (Geliştirici Testi)')
        }, 10)
        break
      case 'rejection':
        Promise.reject(new Error('Test: Simüle Edilmiş Promise Reddi / Async Hata'))
        break
      case 'network':
        addDevLog('network', 'NetworkSimulator', 'Test: Sunucu bağlantısı zaman aşımına uğradı (Simüle Edildi)', {
          data: { ping: 'timeout', packetLoss: '100%' }
        })
        break
      case 'db':
        addDevLog('db', 'DatabaseSimulator', 'Test: Veritabanı kilitleme veya sorgu hatası (Simüle Edildi)', {
          data: { query: 'SELECT * FROM imaginary_table', error: 'NoSuchTableException' }
        })
        break
    }
  },
  simulateRoleError: (role: string, errorType: 'order' | 'payment' | 'network' | 'printer' | 'sync') => {
    const roleLabels: Record<string, string> = {
      waiter: 'Ahmet Yılmaz (waiter)',
      cashier: 'Ayşe Demir (cashier)',
      kitchen: 'Mehmet Usta (kitchen)',
      bar: 'Barış Kaya (bar)',
      manager: 'Kemal Can (manager)',
      owner: 'Madi Reis (owner)',
      customer: 'Masa 4 (QR Müşteri)',
      developer: 'Geliştirici (developer)',
    }
    const userRole = roleLabels[role] || `${role} (Test Hesabı)`

    switch (errorType) {
      case 'order':
        addDevLog('error', 'OrderPipeline', `[${role.toUpperCase()}] Sipariş masaya işlenirken stok/fiyat uyuşmazlığı oluştu`, {
          userRole,
          stack: `Error: ItemStockConflictException: Product ID #item_42 is out of stock\n    at createOrder (OrderService.ts:142)\n    at handleTableSubmit (TableDetailPage.tsx:88)`,
          data: { tableId: 'table_4', attemptedItems: ['item_42', 'item_19'], role }
        })
        break
      case 'payment':
        addDevLog('error', 'PaymentGateway', `[${role.toUpperCase()}] Kredi kartı POS terminali yanıt vermedi (Zaman aşımı)`, {
          userRole,
          stack: `Error: PosTerminalTimeoutError: POS Terminal #POS_01 did not respond within 30000ms\n    at processCardPayment (PaymentModal.tsx:210)`,
          data: { amount: 350.00, method: 'credit_card', terminalId: 'POS_01', role }
        })
        break
      case 'printer':
        addDevLog('error', 'ThermalPrinter', `[${role.toUpperCase()}] Mutfak Termal Yazıcısı kağıt bitti / bağlantı koptu`, {
          userRole,
          stack: `Error: PrinterCommunicationError: ESC/POS Network Printer 192.168.1.200:9100 unreachable\n    at printKitchenTicket (printEngine.ts:65)`,
          data: { printerIp: '192.168.1.200', ticketId: 'ticket_882', role }
        })
        break
      case 'sync':
        addDevLog('error', 'SyncConflict', `[${role.toUpperCase()}] Eşzamanlı masa güncellemesi çakışması (Revision conflict)`, {
          userRole,
          stack: `Error: RevisionMismatch: Local revision 42 behind remote revision 44\n    at resolveConflict (syncEngine.ts:240)`,
          data: { tableId: 'table_2', localRev: 42, remoteRev: 44, role }
        })
        break
      case 'network':
        addDevLog('network', 'DeviceOffline', `[${role.toUpperCase()}] Cihaz WiFi bağlantısı koptu (Bağlantı bekleniyor)`, {
          userRole,
          data: { ssid: 'Wots_Staff_WiFi', signalLevel: -88, role }
        })
        break
    }
  }
}

