import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { Staff, AppNotification } from '@/types/pos'
import { generateId } from '@/lib/utils'

export const defaultUser: Staff = {
  id: 'staff-7',
  name: 'Patron (Yönetici)',
  username: '1007',
  role: 'owner',
  pin: '9999',
  active: true,
}

interface AppState {
  currentUser: Staff
  currentFloor: string
  isOnline: boolean
  isSyncing: boolean
  notifications: AppNotification[]
  sidebarOpen: boolean
}

type Action =
  | { type: 'LOGIN'; user: Staff }
  | { type: 'LOGOUT' }
  | { type: 'SET_FLOOR'; floorId: string }
  | { type: 'SET_ONLINE'; online: boolean }
  | { type: 'SET_SYNCING'; syncing: boolean }
  | { type: 'ADD_NOTIFICATION'; notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'> }
  | { type: 'MARK_NOTIFICATION_READ'; id: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'TOGGLE_SIDEBAR' }

const initialState: AppState = {
  currentUser: defaultUser,
  currentFloor: 'floor-1',
  isOnline: navigator.onLine,
  isSyncing: false,
  notifications: [],
  sidebarOpen: true,
}

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, currentUser: action.user }
    case 'LOGOUT':
      return { ...state, currentUser: defaultUser }
    case 'SET_FLOOR':
      return { ...state, currentFloor: action.floorId }
    case 'SET_ONLINE':
      return { ...state, isOnline: action.online }
    case 'SET_SYNCING':
      return { ...state, isSyncing: action.syncing }
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [
          {
            id: generateId(),
            ...action.notification,
            timestamp: new Date().toISOString(),
            read: false,
          },
          ...state.notifications,
        ].slice(0, 50),
      }
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, read: true } : n
        ),
      }
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<Action>
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE', online: true })
    const handleOffline = () => dispatch({ type: 'SET_ONLINE', online: false })

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
