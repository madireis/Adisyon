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

// Helper to get active user role from session
function getCurrentRole(): string {
  try {
    const raw = sessionStorage.getItem('pos_current_user')
    if (raw) {
      const u = JSON.parse(raw)
      return `${u.name || u.username} (${u.role})`
    }
  } catch {}
  return 'Guest / Anon'
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

// Persist a log entry to memory and asynchronously to IndexedDB
export async function addDevLog(
  level: DevLogLevel,
  category: string,
  message: string,
  extra?: { stack?: string; data?: unknown; route?: string }
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
    userRole: getCurrentRole(),
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
  // Error Simulator for Testing & QA
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
  }
}
