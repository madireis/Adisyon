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
  currentUser: Staff | null
  originalManager: Staff | null
  currentFloor: string
  isOnline: boolean
  isSyncing: boolean
  notifications: AppNotification[]
  sidebarOpen: boolean
}

type Action =
  | { type: 'LOGIN'; user: Staff; managerSession?: Staff | null }
  | { type: 'SWITCH_ACCOUNT'; user: Staff }
  | { type: 'RESTORE_MANAGER' }
  | { type: 'LOGOUT' }
  | { type: 'SET_FLOOR'; floorId: string }
  | { type: 'SET_ONLINE'; online: boolean }
  | { type: 'SET_SYNCING'; syncing: boolean }
  | { type: 'ADD_NOTIFICATION'; notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'> }
  | { type: 'MARK_NOTIFICATION_READ'; id: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'TOGGLE_SIDEBAR' }

const getInitialUser = (): Staff | null => {
  try {
    const raw = sessionStorage.getItem('pos_current_user');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

const getInitialManager = (): Staff | null => {
  try {
    const raw = sessionStorage.getItem('pos_original_manager');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

const initialState: AppState = {
  currentUser: getInitialUser(),
  originalManager: getInitialManager(),
  currentFloor: 'floor-1',
  isOnline: navigator.onLine,
  isSyncing: false,
  notifications: [],
  sidebarOpen: true,
}

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN': {
      const isManager = action.user.role === 'owner' || action.user.role === 'manager';
      const origManager = action.managerSession !== undefined 
        ? action.managerSession 
        : (isManager ? action.user : null);

      try {
        sessionStorage.setItem('pos_current_user', JSON.stringify(action.user));
        if (origManager) {
          sessionStorage.setItem('pos_original_manager', JSON.stringify(origManager));
        } else {
          sessionStorage.removeItem('pos_original_manager');
        }
      } catch {}

      return { 
        ...state, 
        currentUser: action.user,
        originalManager: origManager
      }
    }
    case 'SWITCH_ACCOUNT': {
      try {
        sessionStorage.setItem('pos_current_user', JSON.stringify(action.user));
      } catch {}
      return { ...state, currentUser: action.user }
    }
    case 'RESTORE_MANAGER': {
      const targetManager = state.originalManager;
      if (targetManager) {
        try {
          sessionStorage.setItem('pos_current_user', JSON.stringify(targetManager));
        } catch {}
        return { ...state, currentUser: targetManager }
      }
      return state;
    }
    case 'LOGOUT': {
      try {
        sessionStorage.removeItem('pos_current_user');
        sessionStorage.removeItem('pos_original_manager');
      } catch {}
      return { ...state, currentUser: null, originalManager: null }
    }
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
