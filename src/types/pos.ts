// ─── Core Enums ───────────────────────────────────────────────
export type UserRole = 'owner' | 'manager' | 'cashier' | 'waiter' | 'kitchen' | 'bar'

export type TableStatus = 'available' | 'occupied' | 'payment_waiting' | 'reserved' | 'cleaning' | 'offline'

export type OrderStatus = 'open' | 'sent' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled'

export type KitchenStation = 'kitchen' | 'bar' | 'dessert' | 'coffee'

export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'sodexo' | 'multinet' | 'ticket' | 'metropol' | 'ikram'

export type ReservationStatus = 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show'

export type OnlineOrderStatus = 'new' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled'

export type OnlinePlatform = 'yemeksepeti' | 'getir' | 'trendyol' | 'migros' | 'direct'

// ─── Staff ────────────────────────────────────────────────────
export interface Staff {
  id: string
  name: string
  username: string
  role: UserRole
  pin: string
  avatar?: string
  active: boolean
}

// ─── Floor & Tables ───────────────────────────────────────────
export interface Floor {
  id: string
  name: string
  icon: string
  order: number
}

export interface Table {
  id: string
  floorId: string
  number: number
  label: string
  seats: number
  status: TableStatus
  guestCount: number
  currentOrderId?: string
  waiterId?: string
  occupiedAt?: string
  posX: number
  posY: number
  shape: 'square' | 'round' | 'rectangle'
}

// ─── Menu ─────────────────────────────────────────────────────
export interface Category {
  id: string
  name: string
  icon: string
  order: number
  color: string
}

export interface Modifier {
  id: string
  name: string
  price: number
  group: string // e.g. 'Pişirme', 'Ekstra', 'Çıkar'
}

export interface ModifierGroup {
  id: string
  name: string
  type: 'single' | 'multiple' | 'remove'
  modifiers: Modifier[]
}

export interface MenuItem {
  id: string
  categoryId: string
  name: string
  description: string
  price: number
  image?: string
  station: KitchenStation
  available: boolean
  modifierGroups: ModifierGroup[]
  preparationTime: number // minutes
  vat: number // percentage
}

// ─── Orders ───────────────────────────────────────────────────
export interface OrderItemModifier {
  modifierId: string
  name: string
  price: number
}

export interface OrderItem {
  id: string
  orderId: string
  menuItemId: string
  name: string
  quantity: number
  unitPrice: number
  modifiers: OrderItemModifier[]
  notes: string
  status: OrderStatus
  station: KitchenStation
  addedAt: string
  addedBy: string
}

export interface Order {
  id: string
  tableId: string
  tableLabel: string
  waiterId: string
  waiterName: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  discount: number
  discountType?: 'percentage' | 'amount'
  discountReason?: string
  tax: number
  total: number
  guestCount: number
  createdAt: string
  updatedAt: string
  sentToKitchenAt?: string
  paidAt?: string
  notes: string
}

// ─── Payments ─────────────────────────────────────────────────
export interface PaymentPart {
  method: PaymentMethod
  amount: number
}

export interface Payment {
  id: string
  orderId: string
  tableLabel: string
  parts: PaymentPart[]
  total: number
  change: number
  paidAt: string
  processedBy: string
}

// ─── Cash Register (Kasa Giriş / Çıkış) ────────────────────────
export interface CashTransaction {
  id: string
  type: 'in' | 'out' // 'in' = Kasa Girişi, 'out' = Kasa Çıkışı / Masraf
  amount: number
  description: string
  category: string // 'Masraf', 'Tedarikçi', 'Avans', 'Kasa Açılış', 'Diğer'
  processedBy: string
  createdAt: string
}

// ─── Kitchen ──────────────────────────────────────────────────
export interface KitchenTicket {
  id: string
  orderId: string
  tableLabel: string
  station: KitchenStation
  items: {
    name: string
    quantity: number
    modifiers: string[]
    notes: string
  }[]
  status: 'new' | 'preparing' | 'ready' | 'completed'
  createdAt: string
  startedAt?: string
  completedAt?: string
  priority: boolean
}

// ─── Inventory ────────────────────────────────────────────────
export interface InventoryItem {
  id: string
  name: string
  unit: string
  currentStock: number
  minimumStock: number
  purchaseCost: number
  supplier: string
  lastUpdated: string
}

export interface RecipeItem {
  inventoryItemId: string
  inventoryItemName: string
  quantity: number
  unit: string
}

export interface Recipe {
  id: string
  menuItemId: string
  menuItemName: string
  items: RecipeItem[]
  totalCost: number
}

// ─── Customers ────────────────────────────────────────────────
export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  totalVisits: number
  totalSpend: number
  averageOrder: number
  favoriteProducts: string[]
  lastVisit: string
  notes: string
  loyaltyPoints: number
}

// ─── Reservations ─────────────────────────────────────────────
export interface Reservation {
  id: string
  customerName: string
  phone: string
  guestCount: number
  date: string
  time: string
  tableId?: string
  notes: string
  status: ReservationStatus
  createdAt: string
}

// ─── Audit Log ────────────────────────────────────────────────
export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  details: string
  entityType: string
  entityId: string
  timestamp: string
}

// ─── Online Orders ────────────────────────────────────────────
export interface OnlineOrder {
  id: string
  platform: OnlinePlatform
  platformOrderId: string
  customerName: string
  customerPhone: string
  address: string
  items: { name: string; quantity: number; price: number }[]
  total: number
  status: OnlineOrderStatus
  notes: string
  deliveryNotes: string
  estimatedDelivery: string
  driverId?: string
  createdAt: string
  updatedAt: string
}

// ─── Sync Queue ───────────────────────────────────────────────
export interface SyncQueueItem {
  id?: number
  table: string
  operation: 'create' | 'update' | 'delete'
  data: Record<string, unknown>
  timestamp: string
  synced: boolean
}

// ─── App State ────────────────────────────────────────────────
export interface AppState {
  currentUser: Staff | null
  currentFloor: string
  isOnline: boolean
  isSyncing: boolean
  notifications: AppNotification[]
}

export interface AppNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
}
