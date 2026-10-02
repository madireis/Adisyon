// ─── Core Enums ───────────────────────────────────────────────
export type UserRole = 'owner' | 'manager' | 'cashier' | 'waiter' | 'kitchen' | 'bar' | 'developer'

export type TableStatus = 'available' | 'occupied' | 'payment_waiting' | 'reserved' | 'cleaning' | 'offline'

export type OrderStatus = 'open' | 'sent' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled'

export type KitchenStation = 'kitchen' | 'bar' | 'dessert' | 'coffee'

export type PaymentMethodCategory = 'cash' | 'card' | 'meal_card' | 'gift' | 'custom'

export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'sodexo' | 'multinet' | 'ticket' | 'metropol' | 'ikram' | (string & {})

export interface PaymentMethodConfig {
  id: string
  name: string
  description?: string
  category: PaymentMethodCategory
  icon?: string
  color?: string
  enabled: boolean
  isDefault?: boolean // built-in methods like cash/credit_card cannot be permanently deleted, only disabled
  order?: number
}

export type ReservationStatus = 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show'

export type OnlineOrderStatus = 'new' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled'

export type OnlinePlatform = 'yemeksepeti' | 'getir' | 'trendyol' | 'migros' | 'direct'

// ─── Permissions ──────────────────────────────────────────────
export interface PosPermissions {
  // Masalar & Salon
  canViewTablesPage: boolean;         // Masalar sayfasını görüntüleme
  canOpenTable: boolean;              // Masa açma & misafir kabul etme
  canTransferTable: boolean;          // Masa ve ürün taşıma / birleştirme
  canDeleteTable: boolean;            // Masayı boşaltma ve kapatma
  canEditTables: boolean;             // Masa ve salon kroki düzenleme

  // Sipariş & Adisyon
  canTakeOrder: boolean;              // Sipariş alma & yeni ürün ekleme
  canDeleteOrderItem: boolean;        // Masadan ürün çekme / sipariş kalemi iptali
  canCancelOrder: boolean;            // Açık adisyonu komple iptal etme
  canApplyDiscount: boolean;          // İndirim ve ikram uygulama
  canPrintReceipt: boolean;           // Fiş ve ara hesap yazdırma

  // Kasa & Ödeme
  canViewReports: boolean;            // Kasa, ciro ve gün sonu raporları sayfası
  canTakePayment: boolean;            // Ödeme alma ve hesap kapatma
  canViewDailyZReport: boolean;       // Günlük ciro & Z-Raporu detaylarını görme
  canCashInOut: boolean;              // Kasadan para girişi / para çıkışı yapma

  // Mutfak & Bar
  canViewKitchen: boolean;            // Mutfak & Bar ekranı erişimi
  canUpdateKitchenStatus: boolean;    // Sipariş hazırlık durumu güncelleme

  // Menü & Stok
  canViewMenu: boolean;               // Menü sayfasını görüntüleme
  canManageMenu: boolean;             // Menü, fiyat ve ürün yönetimi
  canToggleItemAvailability: boolean; // Ürün stokta var / tükendi durumu değiştirme
  canViewInventory: boolean;          // Stok takip sayfasını görüntüleme
  canManageInventory: boolean;        // Stok ekleme, düzenleme ve hammadde/ürün stok girişi

  // Yönetim & Personel
  canViewStaff: boolean;              // Personel sayfasını görüntüleme
  canManageStaff: boolean;            // Personel hesapları ve şifre yönetimi
  canManagePermissions: boolean;      // Rol yetkileri ve izin matrisini değiştirme
  canViewAuditLogs: boolean;          // İşlem geçmişi ve denetim kayıtlarını görme
  canManageSettings: boolean;         // Sistem ayarları ve ağ yapılandırması
}

export interface RolePermissionsRecord {
  role: UserRole;
  permissions: PosPermissions;
  updatedAt: string;
}

// ─── Staff ────────────────────────────────────────────────────
export interface Staff {
  id: string
  name: string
  username: string
  role: UserRole
  pin: string
  avatar?: string
  active: boolean
  customPermissions?: Partial<PosPermissions>
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
  addedByWaiterName?: string
}

export interface Order {
  id: string
  tableId: string
  tableLabel: string
  waiterId: string
  waiterName: string
  waiters?: string[] // All staff members who took orders / added items to this table
  deliveredBy?: string // Siparişi / Ürünü Teslim Eden (Garson / Kurye)
  receivedBy?: string // Siparişi Teslim Alan (Müşteri / Masa)
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  discount: number
  discountType?: 'percentage' | 'amount'
  discountReason?: string
  tax: number
  total: number
  guestCount: number
  createdAt: string // Sipariş Başlangıç Saati (Table opened / order created)
  updatedAt: string
  startedTakingAt?: string // Garsonun masaya ilk sipariş girmeye başladığı saat
  sentToKitchenAt?: string // Mutfağa iletilme saati
  kitchenReadyAt?: string // Mutfakta hazırlandı işaretlenme saati
  kitchenDurationMinutes?: number // Mutfakta hazırlanma süresi (dakika)
  paidAt?: string // Ödemenin tamamlandığı saat
  paidBy?: string // Ödemeyi alan kasiyer/personel adı
  paidById?: string // Ödemeyi alan personel id
  paymentMethod?: string // Nakit, Kredi Kartı, Parçalı vs.
  durationMinutes?: number // Masanın açılışından ödemeye kadar geçen toplam süre (dakika)
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
  processedById?: string
  waiterName?: string
  durationMinutes?: number
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
    waiterName?: string
  }[]
  status: 'new' | 'preparing' | 'ready' | 'completed'
  createdAt: string
  startedAt?: string
  completedAt?: string
  deliveredBy?: string // Siparişi / Yemeği Teslim Eden Personel
  priority: boolean
}

// ─── Inventory ────────────────────────────────────────────────
export type InventoryItemType = 'raw_material' | 'product' | 'consumable';

export interface InventoryItem {
  id: string
  name: string
  barcode?: string
  code?: string
  category?: string
  type?: InventoryItemType
  menuItemId?: string
  unit: string
  currentStock: number
  minimumStock: number
  maximumStock?: number
  packQuantity?: number
  purchaseCost: number
  salePrice?: number
  taxRate?: number
  supplier: string
  supplierPhone?: string
  invoiceNumber?: string
  storageLocation?: string
  shelfNumber?: string
  expiryDate?: string
  lotNumber?: string
  notes?: string
  deliveredBy?: string // Siparişi / Malı Teslim Eden (Firma, Tedarikçi, Kurye, Şoför)
  receivedBy?: string // Siparişi / Malı Teslim Alan (Depo Yetkilisi, Personel)
  lastUpdated: string
  createdAt?: string
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

// ─── Developer Diagnostics & Error Logging ────────────────────
export type DevLogLevel = 'error' | 'warn' | 'info' | 'network' | 'sync' | 'db'

export interface DevLogEntry {
  id: string
  timestamp: string
  level: DevLogLevel
  category: string
  message: string
  stack?: string
  data?: unknown
  route?: string
  userRole?: string
  userAgent?: string
}

export interface SystemDiagnosticInfo {
  os: string
  osVersion: string
  browser: string
  browserVersion: string
  deviceType: 'mobile' | 'tablet' | 'desktop'
  touchSupported: boolean
  screenWidth: number
  screenHeight: number
  viewportWidth: number
  viewportHeight: number
  pixelRatio: number
  isPwaStandalone: boolean
  isOnline: boolean
  networkType?: string
  storageEstimate?: { usage: number; quota: number; percent: number }
  memoryUsage?: { usedJSHeapSize: number; totalJSHeapSize: number }
  dexieStatus: { isReady: boolean; tableCounts: Record<string, number> }
}

