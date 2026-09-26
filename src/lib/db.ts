import Dexie, { type Table } from 'dexie'
import type {
  Table as PosTable, Floor, Category, MenuItem, Order, Payment,
  KitchenTicket, Staff, InventoryItem, Recipe, Customer,
  Reservation, AuditLog, OnlineOrder, SyncQueueItem
} from '@/types/pos'

export class PosDatabase extends Dexie {
  floors!: Table<Floor>
  get posTables(): Table<PosTable> {
    return this.table('tables')
  }
  categories!: Table<Category>
  menuItems!: Table<MenuItem>
  orders!: Table<Order>
  payments!: Table<Payment>
  kitchenTickets!: Table<KitchenTicket>
  staff!: Table<Staff>
  inventoryItems!: Table<InventoryItem>
  recipes!: Table<Recipe>
  customers!: Table<Customer>
  reservations!: Table<Reservation>
  auditLogs!: Table<AuditLog>
  onlineOrders!: Table<OnlineOrder>
  syncQueue!: Table<SyncQueueItem, number>

  constructor() {
    super('WotsCafePOS')

    this.version(1).stores({
      floors: 'id, order',
      tables: 'id, floorId, number, status',
      categories: 'id, order',
      menuItems: 'id, categoryId, station, available',
      orders: 'id, tableId, waiterId, status, createdAt',
      payments: 'id, orderId, paidAt',
      kitchenTickets: 'id, orderId, station, status, createdAt',
      staff: 'id, pin, role, active',
      inventoryItems: 'id, name',
      recipes: 'id, menuItemId',
      customers: 'id, phone, name',
      reservations: 'id, date, status',
      auditLogs: 'id, userId, timestamp, action',
      onlineOrders: 'id, platform, status, createdAt',
      syncQueue: '++id, table, synced, timestamp',
    })

    this.version(2).stores({
      staff: 'id, username, pin, role, active',
    })

    // Expose posTables helper on instance for easy and safe access to restaurant tables
    Object.defineProperty(this, 'posTables', {
      get: () => this.table('tables'),
      configurable: true,
      enumerable: false,
    })
  }
}

export const db = new PosDatabase()
