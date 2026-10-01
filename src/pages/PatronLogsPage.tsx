import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Download,
  Printer,
  Calendar,
  Clock,
  User,
  Users,
  UtensilsCrossed,
  CreditCard,
  ChefHat,
  Trash2,
  Gift,
  ArrowRightLeft,
  Banknote,
  Activity,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  Filter,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  Crown,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useApp } from '@/lib/store';
import type { AuditLog, Order, Payment, CashTransaction, KitchenTicket, Staff } from '@/types/pos';

export type ActivityType = 
  | 'ALL'
  | 'CANCEL'
  | 'ORDER_TAKEN'
  | 'PAYMENT'
  | 'DISCOUNT'
  | 'TRANSFER'
  | 'KITCHEN'
  | 'CASH_DRAWER';

export interface UnifiedActivityItem {
  id: string;
  timestamp: string;
  type: 'CANCEL' | 'ORDER_TAKEN' | 'PAYMENT' | 'DISCOUNT' | 'TRANSFER' | 'KITCHEN' | 'CASH_DRAWER' | 'OTHER';
  actionTitle: string;
  staffName: string;
  staffRole: string;
  tableLabel?: string;
  details: string;
  amount?: number;
  isNegative?: boolean;
  itemsList?: Array<{ name: string; quantity: number; price?: number; notes?: string }>;
  cancelReason?: string;
  rawObject?: any;
}

export default function PatronLogsPage() {
  const { state } = useApp();

  // Filters & State
  const [selectedType, setSelectedType] = useState<ActivityType>('ALL');
  const [dateRange, setDateRange] = useState<'TODAY' | 'YESTERDAY' | 'WEEK' | 'ALL'>('TODAY');
  const [selectedStaff, setSelectedStaff] = useState<string>('ALL');
  const [selectedTable, setSelectedTable] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Live Queries from Dexie
  const auditLogs = useLiveQuery(() => db.auditLogs.toArray()) || [];
  const orders = useLiveQuery(() => db.orders.toArray()) || [];
  const payments = useLiveQuery(() => db.payments.toArray()) || [];
  const cashTransactions = useLiveQuery(() => db.cashTransactions.toArray()) || [];
  const kitchenTickets = useLiveQuery(() => db.kitchenTickets.toArray()) || [];
  const staffMembers = useLiveQuery(() => db.staff.toArray()) || [];

  // Date Range Bounds
  const { startDate, endDate, dateRangeLabel } = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (dateRange === 'TODAY') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end, dateRangeLabel: 'Bugün' };
    } else if (dateRange === 'YESTERDAY') {
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end, dateRangeLabel: 'Dün' };
    } else if (dateRange === 'WEEK') {
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end, dateRangeLabel: 'Son 7 Gün' };
    } else {
      start = new Date('2020-01-01');
      end = new Date('2030-12-31');
      return { startDate: start, endDate: end, dateRangeLabel: 'Tüm Zamanlar' };
    }
  }, [dateRange]);

  // Unified Activity Feed Builder
  const unifiedActivities = useMemo(() => {
    const items: UnifiedActivityItem[] = [];

    // Helper to check if in date range
    const isWithinDate = (isoString?: string) => {
      if (!isoString) return true;
      const t = new Date(isoString).getTime();
      return t >= startDate.getTime() && t <= endDate.getTime();
    };

    // 1. Process explicit AuditLogs
    auditLogs.forEach((log: AuditLog) => {
      if (!isWithinDate(log.timestamp)) return;

      const actLower = (log.action || '').toLowerCase();
      const detLower = (log.details || '').toLowerCase();

      let type: UnifiedActivityItem['type'] = 'OTHER';
      let isNegative = false;

      if (actLower.includes('iptal') || actLower.includes('silin') || detLower.includes('iptal') || detLower.includes('silindi')) {
        type = 'CANCEL';
        isNegative = true;
      } else if (actLower.includes('ikram') || actLower.includes('indirim') || detLower.includes('ikram') || detLower.includes('indirim')) {
        type = 'DISCOUNT';
      } else if (actLower.includes('taşı') || actLower.includes('birleştir') || detLower.includes('aktar')) {
        type = 'TRANSFER';
      } else if (actLower.includes('mutfak') || detLower.includes('mutfak')) {
        type = 'KITCHEN';
      } else if (actLower.includes('ödeme') || actLower.includes('tahsil')) {
        type = 'PAYMENT';
      } else if (actLower.includes('sipariş')) {
        type = 'ORDER_TAKEN';
      }

      // Extract table label if present in details
      let tableMatch = log.details?.match(/Masa\s+([a-zA-Z0-9_-]+)/i);
      const tableLabel = tableMatch ? `Masa ${tableMatch[1]}` : undefined;

      items.push({
        id: `audit_${log.id}`,
        timestamp: log.timestamp,
        type,
        actionTitle: log.action || 'Denetim Hareketi',
        staffName: log.userName || 'Personel',
        staffRole: 'Sistem',
        tableLabel,
        details: log.details || '',
        isNegative,
        rawObject: log
      });
    });

    // 2. Process Orders (New items taken, Waiter submissions, Cancellations)
    orders.forEach((order: Order) => {
      if (!isWithinDate(order.createdAt)) return;

      const waiterName = order.waiterName || 'Garson';

      // Order created / sent to kitchen
      if (order.items && order.items.length > 0) {
        items.push({
          id: `order_create_${order.id}`,
          timestamp: order.startedTakingAt || order.createdAt,
          type: 'ORDER_TAKEN',
          actionTitle: `Sipariş Alındı (${order.items.length} Kalem)`,
          staffName: waiterName,
          staffRole: 'Garson',
          tableLabel: order.tableLabel,
          details: `Garson ${waiterName} tarafından ${order.items.length} ürün masaya işlendi.`,
          amount: order.total,
          itemsList: order.items.map(i => ({
            name: i.name,
            quantity: i.quantity,
            price: (i.unitPrice || 0) * (i.quantity || 1),
            notes: i.notes
          })),
          rawObject: order
        });
      }

      // If order was cancelled
      if (order.status === 'cancelled') {
        items.push({
          id: `order_cancel_${order.id}`,
          timestamp: order.updatedAt || order.createdAt,
          type: 'CANCEL',
          actionTitle: `Adisyon / Masa İptali`,
          staffName: order.waiterName || 'Yetkili',
          staffRole: 'Garson / Kasiyer',
          tableLabel: order.tableLabel,
          details: `Masa ${order.tableLabel} adisyonu tamamen iptal edildi.`,
          amount: order.total,
          isNegative: true,
          itemsList: order.items?.map(i => ({
            name: i.name,
            quantity: i.quantity,
            price: i.unitPrice * i.quantity
          })),
          rawObject: order
        });
      }

      // If discount applied
      if (order.discount && order.discount > 0) {
        items.push({
          id: `order_discount_${order.id}`,
          timestamp: order.updatedAt || order.createdAt,
          type: 'DISCOUNT',
          actionTitle: `İndirim / İskonto Uygulandı`,
          staffName: order.paidBy || order.waiterName || 'Yetkili',
          staffRole: 'Yetkili',
          tableLabel: order.tableLabel,
          details: `${order.tableLabel} masasına ₺${order.discount} ${order.discountReason ? `(${order.discountReason})` : ''} indirim uygulandı.`,
          amount: order.discount,
          isNegative: true,
          rawObject: order
        });
      }
    });

    // 3. Process Payments (Cashier payments taken)
    payments.forEach((p: Payment) => {
      const payTime = p.paidAt || (p as any).timestamp;
      if (!isWithinDate(payTime)) return;

      const methodNames: Record<string, string> = {
        cash: 'Nakit TL',
        credit_card: 'POS / Kredi Kartı',
        debit_card: 'Banka Kartı',
        sodexo: 'Sodexo',
        multinet: 'Multinet',
        ticket: 'Ticket',
        metropol: 'Metropol',
        ikram: 'Yetkili İkram'
      };

      const partsDesc = Array.isArray(p.parts) && p.parts.length > 0
        ? p.parts.map(part => `${methodNames[part.method] || part.method}: ₺${part.amount}`).join(' + ')
        : 'Tahsilat';

      items.push({
        id: `payment_${p.id}`,
        timestamp: payTime,
        type: 'PAYMENT',
        actionTitle: `Hesap Kapatıldı & Tahsilat`,
        staffName: p.processedBy || (p as any).processedByName || 'Kasiyer',
        staffRole: 'Kasiyer',
        tableLabel: p.tableLabel || 'Kasa',
        details: `${partsDesc} (Toplam: ₺${p.total || 0})${p.change ? ` • Para Üstü: ₺${p.change}` : ''}`,
        amount: p.total,
        rawObject: p
      });
    });

    // 4. Process Cash Transactions (Drawer In/Out)
    cashTransactions.forEach((c: CashTransaction) => {
      const cashTime = c.createdAt || (c as any).timestamp;
      if (!isWithinDate(cashTime)) return;

      const isOut = c.type === 'out';
      items.push({
        id: `cash_${c.id}`,
        timestamp: cashTime,
        type: 'CASH_DRAWER',
        actionTitle: isOut ? `Kasa Para Çıkışı / Masraf` : `Kasa Para Girişi / Avans`,
        staffName: c.processedBy || (c as any).userName || 'Kasiyer',
        staffRole: 'Kasiyer',
        details: `${c.category ? `[${c.category}] ` : ''}${c.description || ''} (₺${c.amount})`,
        amount: c.amount,
        isNegative: isOut,
        rawObject: c
      });
    });

    // Deduplicate and Sort chronologically (newest first)
    const seen = new Set<string>();
    const deduplicated = items.filter(item => {
      const key = `${item.timestamp}_${item.actionTitle}_${item.tableLabel || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return deduplicated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [auditLogs, orders, payments, cashTransactions, startDate, endDate]);

  // Calculate High-level Patron KPI Summary
  const kpis = useMemo(() => {
    let totalOrdersCount = 0;
    let totalOrdersRevenue = 0;
    let totalCancellationsCount = 0;
    let totalCancellationsValue = 0;
    let totalDiscountsValue = 0;
    let totalPaymentsValue = 0;
    let totalTransfersCount = 0;

    unifiedActivities.forEach(act => {
      if (act.type === 'ORDER_TAKEN') {
        totalOrdersCount++;
        totalOrdersRevenue += (act.amount || 0);
      } else if (act.type === 'CANCEL') {
        totalCancellationsCount++;
        totalCancellationsValue += (act.amount || 0);
      } else if (act.type === 'DISCOUNT') {
        totalDiscountsValue += (act.amount || 0);
      } else if (act.type === 'PAYMENT') {
        totalPaymentsValue += (act.amount || 0);
      } else if (act.type === 'TRANSFER') {
        totalTransfersCount++;
      }
    });

    return {
      totalOrdersCount,
      totalOrdersRevenue,
      totalCancellationsCount,
      totalCancellationsValue,
      totalDiscountsValue,
      totalPaymentsValue,
      totalTransfersCount,
    };
  }, [unifiedActivities]);

  // Staff Breakdown (Which waiter did what, who cancelled what)
  const staffActivitySummary = useMemo(() => {
    const map: Record<string, {
      name: string;
      role: string;
      ordersTaken: number;
      ordersTotal: number;
      cancelsCount: number;
      cancelsTotal: number;
      transfersCount: number;
      lastActive: string;
    }> = {};

    unifiedActivities.forEach(act => {
      const name = act.staffName || 'Bilinmeyen';
      if (!map[name]) {
        map[name] = {
          name,
          role: act.staffRole || 'Personel',
          ordersTaken: 0,
          ordersTotal: 0,
          cancelsCount: 0,
          cancelsTotal: 0,
          transfersCount: 0,
          lastActive: act.timestamp,
        };
      }

      if (act.type === 'ORDER_TAKEN') {
        map[name].ordersTaken++;
        map[name].ordersTotal += (act.amount || 0);
      } else if (act.type === 'CANCEL') {
        map[name].cancelsCount++;
        map[name].cancelsTotal += (act.amount || 0);
      } else if (act.type === 'TRANSFER') {
        map[name].transfersCount++;
      }

      if (new Date(act.timestamp).getTime() > new Date(map[name].lastActive).getTime()) {
        map[name].lastActive = act.timestamp;
      }
    });

    return Object.values(map).sort((a, b) => (b.ordersTotal + b.cancelsTotal) - (a.ordersTotal + a.cancelsTotal));
  }, [unifiedActivities]);

  // Filtered Activity Feed based on UI selections
  const filteredActivities = useMemo(() => {
    return unifiedActivities.filter(act => {
      // Type filter
      if (selectedType !== 'ALL' && act.type !== selectedType) {
        return false;
      }

      // Staff filter
      if (selectedStaff !== 'ALL' && act.staffName !== selectedStaff) {
        return false;
      }

      // Table filter
      if (selectedTable !== 'ALL' && act.tableLabel !== selectedTable) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = act.actionTitle.toLowerCase().includes(q);
        const matchDetails = act.details.toLowerCase().includes(q);
        const matchStaff = act.staffName.toLowerCase().includes(q);
        const matchTable = (act.tableLabel || '').toLowerCase().includes(q);
        const matchItems = act.itemsList?.some(i => i.name.toLowerCase().includes(q));

        if (!matchTitle && !matchDetails && !matchStaff && !matchTable && !matchItems) {
          return false;
        }
      }

      return true;
    });
  }, [unifiedActivities, selectedType, selectedStaff, selectedTable, searchQuery]);

  // List of unique tables for filter
  const uniqueTables = useMemo(() => {
    const set = new Set<string>();
    unifiedActivities.forEach(a => {
      if (a.tableLabel) set.add(a.tableLabel);
    });
    return Array.from(set).sort();
  }, [unifiedActivities]);

  // List of unique staff members for filter
  const uniqueStaff = useMemo(() => {
    const set = new Set<string>();
    unifiedActivities.forEach(a => {
      if (a.staffName) set.add(a.staffName);
    });
    return Array.from(set).sort();
  }, [unifiedActivities]);

  // Export to Excel / CSV
  const handleExportCSV = () => {
    const headers = ['Zaman', 'İşlem Türü', 'Başlık', 'Personel', 'Masa', 'Tutar (TL)', 'Detaylar'];
    const rows = filteredActivities.map(a => [
      `"${new Date(a.timestamp).toLocaleString('tr-TR')}"`,
      `"${a.type}"`,
      `"${a.actionTitle.replace(/"/g, '""')}"`,
      `"${a.staffName}"`,
      `"${a.tableLabel || '-'}"`,
      `"${a.amount ? (a.isNegative ? '-' : '') + a.amount : 0}"`,
      `"${a.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `wots_patron_loglari_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Browser Print Trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-full flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans select-none pb-12">
      {/* Top Patron Header */}
      <header className="p-4 sm:p-6 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-500 flex items-center justify-center font-black shadow-xs">
              <Crown size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-stone-900 dark:text-white">
                  Patron Denetim & Operasyon Logları
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-amber-950 text-amber-400 border border-amber-800">
                  PATRON PANELİ
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Garsonların aldığı siparişler, yapılan ürün iptalleri, masa transferleri ve tüm hareketler
              </p>
            </div>
          </div>

          {/* Quick Actions & Date Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Range Selector */}
            <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold">
              {(['TODAY', 'YESTERDAY', 'WEEK', 'ALL'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                    dateRange === range
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
                  )}
                >
                  {range === 'TODAY' && 'Bugün'}
                  {range === 'YESTERDAY' && 'Dün'}
                  {range === 'WEEK' && 'Son 7 Gün'}
                  {range === 'ALL' && 'Tümü'}
                </button>
              ))}
            </div>

            {/* CSV Export */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-stone-200 dark:border-stone-700 cursor-pointer"
              title="Excel / CSV Formatında İndir"
            >
              <FileSpreadsheet size={15} className="text-emerald-500" />
              <span className="hidden sm:inline">Excel İndir</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-stone-200 dark:border-stone-700 cursor-pointer"
              title="Yazdır / PDF Raporu"
            >
              <Printer size={15} />
              <span className="hidden sm:inline">Yazdır</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1 flex flex-col">
        {/* ── 1. HIGH-LEVEL PATRON KPI CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: Alınan Siparişler */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-bold">
              <span>Alınan Sipariş</span>
              <UtensilsCrossed size={16} className="text-emerald-500" />
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black font-mono text-stone-900 dark:text-white">
                {kpis.totalOrdersCount} <span className="text-xs font-sans text-stone-400">Adet</span>
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold font-mono mt-0.5">
                +{formatCurrency(kpis.totalOrdersRevenue)}
              </div>
            </div>
          </div>

          {/* Card 2: İptal Edilenler (CRITICAL) */}
          <div className={cn(
            "border rounded-2xl p-4 flex flex-col justify-between shadow-2xs transition-all",
            kpis.totalCancellationsCount > 0
              ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50"
              : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800"
          )}>
            <div className="flex items-center justify-between text-red-600 dark:text-red-400 text-xs font-bold">
              <span>İptaller & Silinenler</span>
              <AlertOctagon size={16} className="text-red-500 animate-pulse" />
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black font-mono text-red-600 dark:text-red-400">
                {kpis.totalCancellationsCount} <span className="text-xs font-sans text-stone-400">İptal</span>
              </div>
              <div className="text-xs text-red-500 font-bold font-mono mt-0.5">
                -{formatCurrency(kpis.totalCancellationsValue)}
              </div>
            </div>
          </div>

          {/* Card 3: Tahsilatlar & Kasa */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-bold">
              <span>Toplam Tahsilat</span>
              <CreditCard size={16} className="text-sky-500" />
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black font-mono text-sky-600 dark:text-sky-400">
                {formatCurrency(kpis.totalPaymentsValue)}
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">
                Kapanan Adisyonlar
              </div>
            </div>
          </div>

          {/* Card 4: İkram & İskontolar */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-bold">
              <span>İkram & İskonto</span>
              <Gift size={16} className="text-purple-500" />
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
                {formatCurrency(kpis.totalDiscountsValue)}
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">
                Uygulanan İndirim
              </div>
            </div>
          </div>

          {/* Card 5: Masa Taşıma & Birleştirme */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-bold">
              <span>Masa Taşıma</span>
              <ArrowRightLeft size={16} className="text-orange-500" />
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black font-mono text-orange-600 dark:text-orange-400">
                {kpis.totalTransfersCount} <span className="text-xs font-sans text-stone-400">Hareket</span>
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">
                Transfer & Birleştirme
              </div>
            </div>
          </div>

          {/* Card 6: Denetim Güvenliği */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-bold">
              <span>Kayıt Güvenliği</span>
              <ShieldCheck size={16} className="text-emerald-500" />
            </div>
            <div className="mt-2">
              <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={16} />
                <span>%100 Yedekli</span>
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 font-medium mt-1">
                Yerel Disk + Dexie DB
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. GARSON & PERSONEL HAREKET TABLOSU (KİM NE ALMIŞ NE İPTAL ETMİŞ) ── */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="text-amber-500" size={18} />
              <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-white">
                Personel & Garson Aktivite Performans Özeti
              </h3>
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-bold">
              {staffActivitySummary.length} Personel Listeleniyor
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {staffActivitySummary.map(person => {
              const hasCancels = person.cancelsCount > 0;
              return (
                <div
                  key={person.name}
                  onClick={() => setSelectedStaff(selectedStaff === person.name ? 'ALL' : person.name)}
                  className={cn(
                    "p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3",
                    selectedStaff === person.name
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/20"
                      : "bg-stone-50 dark:bg-stone-950/60 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-black text-sm text-stone-900 dark:text-white flex items-center gap-1.5">
                        <User size={14} className="text-stone-400" />
                        <span>{person.name}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400">
                        {person.role}
                      </span>
                    </div>

                    {hasCancels && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border border-red-300 dark:border-red-800">
                        {person.cancelsCount} İptal
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-stone-600 dark:text-stone-300">
                      <span className="text-stone-400">Alınan Sipariş:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {person.ordersTaken} Adet (+{formatCurrency(person.ordersTotal)})
                      </span>
                    </div>

                    {hasCancels && (
                      <div className="flex justify-between text-red-600 dark:text-red-400">
                        <span className="text-stone-400">İptal Ettiği:</span>
                        <span className="font-bold font-mono">
                          {person.cancelsCount} Adet (-{formatCurrency(person.cancelsTotal)})
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-stone-400 text-[11px] pt-1 border-t border-stone-200 dark:border-stone-800">
                      <span>Son Hareket:</span>
                      <span>{new Date(person.lastActive).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 3. FILTER & SEARCH TOOLBAR ── */}
        <div className="space-y-3">
          {/* Quick Category Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
            <button
              onClick={() => setSelectedType('ALL')}
              className={cn(
                "px-3 py-2 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                selectedType === 'ALL'
                  ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                  : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800"
              )}
            >
              <Activity size={14} />
              <span>Tüm Hareketler ({unifiedActivities.length})</span>
            </button>

            <button
              onClick={() => setSelectedType('CANCEL')}
              className={cn(
                "px-3 py-2 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                selectedType === 'CANCEL'
                  ? "bg-red-600 text-white border-red-600 shadow-xs"
                  : "bg-white dark:bg-stone-900 text-red-600 dark:text-red-400 border-stone-200 dark:border-stone-800 hover:bg-red-50 dark:hover:bg-red-950/40"
              )}
            >
              <Trash2 size={14} />
              <span>Sadece İptaller & Silinenler ({kpis.totalCancellationsCount})</span>
            </button>

            <button
              onClick={() => setSelectedType('ORDER_TAKEN')}
              className={cn(
                "px-3 py-2 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                selectedType === 'ORDER_TAKEN'
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-white dark:bg-stone-900 text-emerald-600 dark:text-emerald-400 border-stone-200 dark:border-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              )}
            >
              <UtensilsCrossed size={14} />
              <span>Sipariş Girişleri ({kpis.totalOrdersCount})</span>
            </button>

            <button
              onClick={() => setSelectedType('PAYMENT')}
              className={cn(
                "px-3 py-2 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                selectedType === 'PAYMENT'
                  ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                  : "bg-white dark:bg-stone-900 text-sky-600 dark:text-sky-400 border-stone-200 dark:border-stone-800 hover:bg-sky-50 dark:hover:bg-sky-950/40"
              )}
            >
              <CreditCard size={14} />
              <span>Tahsilatlar & Kasa</span>
            </button>

            <button
              onClick={() => setSelectedType('TRANSFER')}
              className={cn(
                "px-3 py-2 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                selectedType === 'TRANSFER'
                  ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                  : "bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 border-stone-200 dark:border-stone-800 hover:bg-orange-50 dark:hover:bg-orange-950/40"
              )}
            >
              <ArrowRightLeft size={14} />
              <span>Masa Taşımaları ({kpis.totalTransfersCount})</span>
            </button>

            <button
              onClick={() => setSelectedType('DISCOUNT')}
              className={cn(
                "px-3 py-2 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                selectedType === 'DISCOUNT'
                  ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                  : "bg-white dark:bg-stone-900 text-purple-600 dark:text-purple-400 border-stone-200 dark:border-stone-800 hover:bg-purple-50 dark:hover:bg-purple-950/40"
              )}
            >
              <Gift size={14} />
              <span>İkram & İskonto</span>
            </button>
          </div>

          {/* Search and Dropdowns Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-3 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Loglarda ara (ürün adı, garson ismi, masa, iptal sebebi)..."
                className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Staff Dropdown */}
              <select
                value={selectedStaff}
                onChange={e => setSelectedStaff(e.target.value)}
                className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs font-bold text-stone-700 dark:text-stone-300 focus:outline-none"
              >
                <option value="ALL">Tüm Personel</option>
                {uniqueStaff.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* Table Dropdown */}
              <select
                value={selectedTable}
                onChange={e => setSelectedTable(e.target.value)}
                className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-2 text-xs font-bold text-stone-700 dark:text-stone-300 focus:outline-none"
              >
                <option value="ALL">Tüm Masalar</option>
                {uniqueTables.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              {/* Clear filters */}
              {(selectedType !== 'ALL' || selectedStaff !== 'ALL' || selectedTable !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedType('ALL');
                    setSelectedStaff('ALL');
                    setSelectedTable('ALL');
                    setSearchQuery('');
                  }}
                  className="px-2.5 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                >
                  Filtreleri Sıfırla
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── 4. CHRONOLOGICAL ACTIVITY FEED (DETAILED LOGS) ── */}
        <div className="space-y-3 flex-1">
          <div className="flex items-center justify-between text-xs font-bold text-stone-500 dark:text-stone-400 px-1">
            <span>Zaman Akışı ({filteredActivities.length} İşlem Kaydı)</span>
            <span>Tarih: {dateRangeLabel}</span>
          </div>

          {filteredActivities.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-12 text-center text-stone-400 flex flex-col items-center justify-center gap-2">
              <CheckCircle2 size={36} className="text-emerald-500" />
              <p className="font-bold text-base text-stone-700 dark:text-stone-300">Bu filtrelere uygun log kaydı bulunamadı.</p>
              <p className="text-xs">Farklı bir tarih aralığı veya personel seçmeyi deneyebilirsiniz.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredActivities.map(item => {
                const isExpanded = expandedItemId === item.id;
                const isCancel = item.type === 'CANCEL';
                const isOrder = item.type === 'ORDER_TAKEN';
                const isPayment = item.type === 'PAYMENT';
                const isDiscount = item.type === 'DISCOUNT';
                const isTransfer = item.type === 'TRANSFER';

                let badgeColor = 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700';
                let typeIcon = <Activity size={14} />;
                let cardBorder = 'border-stone-200 dark:border-stone-800';

                if (isCancel) {
                  badgeColor = 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border-red-200 dark:border-red-800';
                  typeIcon = <Trash2 size={14} />;
                  cardBorder = 'border-red-300/80 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/10';
                } else if (isOrder) {
                  badgeColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
                  typeIcon = <UtensilsCrossed size={14} />;
                } else if (isPayment) {
                  badgeColor = 'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800';
                  typeIcon = <CreditCard size={14} />;
                } else if (isDiscount) {
                  badgeColor = 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800';
                  typeIcon = <Gift size={14} />;
                } else if (isTransfer) {
                  badgeColor = 'bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300 border-orange-200 dark:border-orange-800';
                  typeIcon = <ArrowRightLeft size={14} />;
                }

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "bg-white dark:bg-stone-900 border rounded-2xl p-4 transition-all hover:shadow-xs",
                      cardBorder
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Type Badge */}
                        <span className={cn("px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 border", badgeColor)}>
                          {typeIcon}
                          <span>{item.type}</span>
                        </span>

                        {/* Title and details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className={cn(
                              "font-black text-sm",
                              isCancel ? "text-red-600 dark:text-red-400" : "text-stone-900 dark:text-white"
                            )}>
                              {item.actionTitle}
                            </h4>

                            {item.tableLabel && (
                              <span className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-bold border border-stone-200 dark:border-stone-700">
                                {item.tableLabel}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 font-medium leading-relaxed">
                            {item.details}
                          </p>
                        </div>
                      </div>

                      {/* Right Meta: Staff, Time & Amount */}
                      <div className="text-right shrink-0 flex flex-col items-end">
                        {item.amount !== undefined && item.amount > 0 && (
                          <div className={cn(
                            "font-black font-mono text-sm sm:text-base",
                            isCancel ? "text-red-600 dark:text-red-400" : isOrder ? "text-emerald-600 dark:text-emerald-400" : "text-stone-900 dark:text-white"
                          )}>
                            {item.isNegative ? '-' : '+'}{formatCurrency(item.amount)}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                          <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                            <User size={12} />
                            {item.staffName}
                          </span>
                          <span>•</span>
                          <span className="font-mono">{new Date(item.timestamp).toLocaleTimeString('tr-TR')}</span>
                        </div>

                        {Boolean(item.itemsList && item.itemsList.length > 0) && (
                          <button
                            onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                            className="mt-1.5 text-[11px] font-bold text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Detayları Gizle' : `${item.itemsList?.length} Ürün Detayı`}</span>
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Items Breakdown */}
                    {isExpanded && item.itemsList && (
                      <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                          İşlem Gören Ürün Kalemleri:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {item.itemsList.map((prod, pIdx) => (
                            <div
                              key={pIdx}
                              className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-stone-900 dark:text-stone-100">
                                  {prod.quantity}x {prod.name}
                                </span>
                                {prod.notes && (
                                  <div className="text-[10px] text-amber-500 italic mt-0.5">
                                    Not: {prod.notes}
                                  </div>
                                )}
                              </div>
                              {prod.price !== undefined && (
                                <span className="font-mono font-bold text-stone-600 dark:text-stone-400 ml-2">
                                  {formatCurrency(prod.price)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
