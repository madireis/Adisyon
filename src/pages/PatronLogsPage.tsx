import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Printer,
  Calendar,
  Clock,
  User,
  Users,
  UtensilsCrossed,
  CreditCard,
  Trash2,
  Gift,
  ArrowRightLeft,
  Banknote,
  Activity,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Crown,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useApp } from '@/lib/store';
import { getPaymentMethodNameMap } from '@/lib/paymentMethods';
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

    // 2. Process Orders
    orders.forEach((order: Order) => {
      if (!isWithinDate(order.createdAt)) return;

      const waiterName = order.waiterName || 'Garson';

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

    // 3. Process Payments
    payments.forEach((p: Payment) => {
      const payTime = p.paidAt || (p as any).timestamp;
      if (!isWithinDate(payTime)) return;

      const methodNames = getPaymentMethodNameMap();

      const partsDesc = Array.isArray(p.parts) && p.parts.length > 0
        ? p.parts.map(part => `${methodNames[part.method] || part.method}: ₺${part.amount}`).join(' + ')
        : 'Tahsilat';

      items.push({
        id: `pay_${p.id}`,
        timestamp: payTime,
        type: 'PAYMENT',
        actionTitle: `Ödeme Alındı (${partsDesc})`,
        staffName: p.processedBy || 'Kasiyer',
        staffRole: 'Kasiyer',
        details: `${partsDesc} tahsilatı yapıldı ve adisyon kapatıldı.`,
        amount: p.total,
        rawObject: p
      });
    });

    // 4. Process Cash Transactions
    cashTransactions.forEach((t: CashTransaction) => {
      if (!isWithinDate(t.createdAt)) return;

      items.push({
        id: `cash_${t.id}`,
        timestamp: t.createdAt,
        type: 'CASH_DRAWER',
        actionTitle: t.type === 'in' ? `Kasa Para Girişi (+)` : `Kasa Masraf Çıkışı (-)`,
        staffName: t.processedBy || 'Kasiyer',
        staffRole: 'Kasa Yetkilisi',
        details: `${t.category} ${t.description ? `(${t.description})` : ''}`,
        amount: t.amount,
        isNegative: t.type === 'out',
        rawObject: t
      });
    });

    // 5. Process Kitchen Tickets
    kitchenTickets.forEach((k: KitchenTicket) => {
      if (!isWithinDate(k.createdAt)) return;

      const itemsSummary = k.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
      const waiter = k.items.find(i => i.waiterName)?.waiterName || 'Garson';

      items.push({
        id: `kitchen_${k.id}`,
        timestamp: k.createdAt,
        type: 'KITCHEN',
        actionTitle: `Mutfağa Sipariş İletildi (${k.station})`,
        staffName: waiter,
        staffRole: 'Garson',
        tableLabel: k.tableLabel,
        details: `${k.tableLabel} masası için [${itemsSummary}] mutfak ekranına iletildi.`,
        itemsList: k.items.map(i => ({
          name: i.name,
          quantity: i.quantity,
          notes: i.notes
        })),
        rawObject: k
      });
    });

    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [auditLogs, orders, payments, cashTransactions, kitchenTickets, startDate, endDate]);

  // Aggregate KPIs
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

  // Staff Breakdown
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
      if (selectedType !== 'ALL' && act.type !== selectedType) {
        return false;
      }
      if (selectedStaff !== 'ALL' && act.staffName !== selectedStaff) {
        return false;
      }
      if (selectedTable !== 'ALL' && act.tableLabel !== selectedTable) {
        return false;
      }
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

  // Unique lists for filter dropdowns
  const uniqueTables = useMemo(() => {
    const set = new Set<string>();
    unifiedActivities.forEach(a => {
      if (a.tableLabel) set.add(a.tableLabel);
    });
    return Array.from(set).sort();
  }, [unifiedActivities]);

  const uniqueStaff = useMemo(() => {
    const set = new Set<string>();
    unifiedActivities.forEach(a => {
      if (a.staffName) set.add(a.staffName);
    });
    return Array.from(set).sort();
  }, [unifiedActivities]);

  // Export CSV
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
    link.setAttribute('download', `patron_loglari_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-full flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans select-none pb-6 sm:pb-8">
      
      {/* ── HEADER ── */}
      <header className="p-3 sm:p-5 lg:p-6 bg-white dark:bg-stone-900 border-b border-stone-200/80 dark:border-stone-800/80 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center font-black shrink-0 shadow-xs">
              <Crown size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-black tracking-tight text-stone-900 dark:text-white truncate">
                  Patron Logları
                </h1>
                <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                  Patron
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Date Filter */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="grid grid-cols-4 sm:flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200/80 dark:border-stone-700 text-xs font-bold w-full sm:w-auto">
              {(['TODAY', 'YESTERDAY', 'WEEK', 'ALL'] as const).map(range => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setDateRange(range)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-center text-xs font-bold",
                    dateRange === range
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
                  )}
                >
                  {range === 'TODAY' && 'Bugün'}
                  {range === 'YESTERDAY' && 'Dün'}
                  {range === 'WEEK' && 'Hafta'}
                  {range === 'ALL' && 'Tümü'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex-1 sm:flex-none px-3 py-2 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-stone-200 dark:border-stone-700 cursor-pointer shadow-xs min-h-[36px]"
              >
                <FileSpreadsheet size={14} className="text-emerald-500" />
                <span>Excel İndir</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 sm:flex-none px-3 py-2 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-stone-200 dark:border-stone-700 cursor-pointer shadow-xs min-h-[36px]"
              >
                <Printer size={14} />
                <span>Yazdır</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN BODY CONTAINER ── */}
      <div className="max-w-7xl mx-auto w-full p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 flex-1 flex flex-col">
        
        {/* ── 1. PATRON KPI CARDS (RESPONSIVE GRID) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
          {/* Card 1: Alınan Sipariş */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-stone-500 text-[11px] font-bold">
              <span>Alınan Sipariş</span>
              <UtensilsCrossed size={14} className="text-emerald-500" />
            </div>
            <div className="mt-1.5">
              <div className="text-base sm:text-xl font-black font-mono text-stone-900 dark:text-white truncate">
                {kpis.totalOrdersCount} <span className="text-[10px] font-sans text-stone-400 font-normal">Adet</span>
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold font-mono mt-0.5 truncate">
                +{formatCurrency(kpis.totalOrdersRevenue)}
              </div>
            </div>
          </div>

          {/* Card 2: İptaller (CRITICAL) */}
          <div className={cn(
            "rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-xs transition-all border",
            kpis.totalCancellationsCount > 0
              ? "bg-red-50/60 dark:bg-red-950/20 border-red-300 dark:border-red-900/60"
              : "bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800/80"
          )}>
            <div className="flex items-center justify-between text-red-600 dark:text-red-400 text-[11px] font-bold">
              <span>İptaller</span>
              <AlertOctagon size={14} className="text-red-500" />
            </div>
            <div className="mt-1.5">
              <div className="text-base sm:text-xl font-black font-mono text-red-600 dark:text-red-400 truncate">
                {kpis.totalCancellationsCount} <span className="text-[10px] font-sans text-stone-400 font-normal">İptal</span>
              </div>
              <div className="text-[11px] text-red-500 font-bold font-mono mt-0.5 truncate">
                -{formatCurrency(kpis.totalCancellationsValue)}
              </div>
            </div>
          </div>

          {/* Card 3: Toplam Tahsilat */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-stone-500 text-[11px] font-bold">
              <span>Tahsilat</span>
              <CreditCard size={14} className="text-sky-500" />
            </div>
            <div className="mt-1.5">
              <div className="text-base sm:text-xl font-black font-mono text-sky-600 dark:text-sky-400 truncate">
                {formatCurrency(kpis.totalPaymentsValue)}
              </div>
              <div className="text-[10px] text-stone-400 font-medium mt-0.5 truncate">
                Kapanan Adisyon
              </div>
            </div>
          </div>

          {/* Card 4: İkram & İskonto */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-stone-500 text-[11px] font-bold">
              <span>İskonto</span>
              <Gift size={14} className="text-purple-500" />
            </div>
            <div className="mt-1.5">
              <div className="text-base sm:text-xl font-black font-mono text-purple-600 dark:text-purple-400 truncate">
                {formatCurrency(kpis.totalDiscountsValue)}
              </div>
              <div className="text-[10px] text-stone-400 font-medium mt-0.5 truncate">
                İndirimler
              </div>
            </div>
          </div>

          {/* Card 5: Masa Taşıma */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-stone-500 text-[11px] font-bold">
              <span>Masa Taşıma</span>
              <ArrowRightLeft size={14} className="text-orange-500" />
            </div>
            <div className="mt-1.5">
              <div className="text-base sm:text-xl font-black font-mono text-orange-600 dark:text-orange-400 truncate">
                {kpis.totalTransfersCount} <span className="text-[10px] font-sans text-stone-400 font-normal">İşlem</span>
              </div>
              <div className="text-[10px] text-stone-400 font-medium mt-0.5 truncate">
                Transfer & Birleştirme
              </div>
            </div>
          </div>

          {/* Card 6: Kayıt Güvenliği */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-stone-500 text-[11px] font-bold">
              <span>Güvenlik</span>
              <ShieldCheck size={14} className="text-emerald-500" />
            </div>
            <div className="mt-1.5">
              <div className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={14} />
                <span>%100 Yedekli</span>
              </div>
              <div className="text-[10px] text-stone-400 font-medium mt-0.5 truncate">
                Yerel Disk + Dexie
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. PERSONEL AKTİVİTE PERFORMANS KARTLARI ── */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-3.5 sm:p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="text-amber-500 shrink-0" size={16} />
              <h3 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white">
                Personel Aktivite Özeti
              </h3>
            </div>
            <span className="text-[11px] text-stone-400 font-medium">
              {staffActivitySummary.length} Personel
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {staffActivitySummary.map(person => {
              const hasCancels = person.cancelsCount > 0;
              const isSelected = selectedStaff === person.name;

              return (
                <div
                  key={person.name}
                  onClick={() => setSelectedStaff(isSelected ? 'ALL' : person.name)}
                  className={cn(
                    "p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5",
                    isSelected
                      ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/20"
                      : "bg-stone-50/70 dark:bg-stone-950/60 border-stone-200/80 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-black text-xs sm:text-sm text-stone-900 dark:text-white flex items-center gap-1.5 truncate">
                        <User size={13} className="text-stone-400 shrink-0" />
                        <span className="truncate">{person.name}</span>
                      </div>
                      <span className="text-[9px] uppercase font-bold text-stone-500">
                        {person.role}
                      </span>
                    </div>

                    {hasCancels && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border border-red-200 dark:border-red-900 shrink-0">
                        {person.cancelsCount} İptal
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-stone-600 dark:text-stone-300 text-[11px]">
                      <span className="text-stone-400">Sipariş:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {person.ordersTaken} Adet (+{formatCurrency(person.ordersTotal)})
                      </span>
                    </div>

                    {hasCancels && (
                      <div className="flex justify-between items-center text-red-600 dark:text-red-400 text-[11px]">
                        <span className="text-stone-400">İptal:</span>
                        <span className="font-bold font-mono">
                          {person.cancelsCount} Adet (-{formatCurrency(person.cancelsTotal)})
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-stone-400 text-[10px] pt-1 border-t border-stone-200/60 dark:border-stone-800/80">
                      <span>Son İşlem:</span>
                      <span className="font-mono">{new Date(person.lastActive).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 3. FILTER & SEARCH TOOLBAR (FULLY RESPONSIVE) ── */}
        <div className="space-y-2.5">
          {/* Quick Filter Horizontal Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedType('ALL')}
              className={cn(
                "px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0",
                selectedType === 'ALL'
                  ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                  : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200/80 dark:border-stone-800 hover:bg-stone-100"
              )}
            >
              <Activity size={13} />
              <span>Tümü ({unifiedActivities.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType('CANCEL')}
              className={cn(
                "px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0",
                selectedType === 'CANCEL'
                  ? "bg-red-600 text-white border-red-600 shadow-xs"
                  : "bg-white dark:bg-stone-900 text-red-600 dark:text-red-400 border-stone-200/80 dark:border-stone-800 hover:bg-red-50"
              )}
            >
              <Trash2 size={13} />
              <span>İptaller ({kpis.totalCancellationsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType('ORDER_TAKEN')}
              className={cn(
                "px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0",
                selectedType === 'ORDER_TAKEN'
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-white dark:bg-stone-900 text-emerald-600 dark:text-emerald-400 border-stone-200/80 dark:border-stone-800 hover:bg-emerald-50"
              )}
            >
              <UtensilsCrossed size={13} />
              <span>Siparişler ({kpis.totalOrdersCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType('PAYMENT')}
              className={cn(
                "px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0",
                selectedType === 'PAYMENT'
                  ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                  : "bg-white dark:bg-stone-900 text-sky-600 dark:text-sky-400 border-stone-200/80 dark:border-stone-800 hover:bg-sky-50"
              )}
            >
              <CreditCard size={13} />
              <span>Tahsilatlar</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType('TRANSFER')}
              className={cn(
                "px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0",
                selectedType === 'TRANSFER'
                  ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                  : "bg-white dark:bg-stone-900 text-orange-600 dark:text-orange-400 border-stone-200/80 dark:border-stone-800 hover:bg-orange-50"
              )}
            >
              <ArrowRightLeft size={13} />
              <span>Masa Taşımaları ({kpis.totalTransfersCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType('DISCOUNT')}
              className={cn(
                "px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0",
                selectedType === 'DISCOUNT'
                  ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                  : "bg-white dark:bg-stone-900 text-purple-600 dark:text-purple-400 border-stone-200/80 dark:border-stone-800 hover:bg-purple-50"
              )}
            >
              <Gift size={13} />
              <span>İskonto</span>
            </button>
          </div>

          {/* Search Bar and Dropdowns */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white dark:bg-stone-900 p-2.5 sm:p-3 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Loglarda ara (ürün, garson, masa, sebep)..."
                className="w-full pl-9 pr-8 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800 rounded-xl text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Dropdown Filters */}
            <div className="grid grid-cols-2 sm:flex items-center gap-2">
              <select
                value={selectedStaff}
                onChange={e => setSelectedStaff(e.target.value)}
                className="bg-stone-50 dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800 rounded-xl px-2.5 py-2 text-xs font-bold text-stone-700 dark:text-stone-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tüm Personel</option>
                {uniqueStaff.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={selectedTable}
                onChange={e => setSelectedTable(e.target.value)}
                className="bg-stone-50 dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800 rounded-xl px-2.5 py-2 text-xs font-bold text-stone-700 dark:text-stone-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tüm Masalar</option>
                {uniqueTables.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── 4. CHRONOLOGICAL ACTIVITY FEED (ADAPTIVE MOBILE-FIRST CARDS) ── */}
        <div className="space-y-2.5 flex-1">
          <div className="flex items-center justify-between text-xs font-bold text-stone-500 dark:text-stone-400 px-1">
            <span>Zaman Akışı ({filteredActivities.length} Kayıt)</span>
            <span>{dateRangeLabel}</span>
          </div>

          {filteredActivities.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-8 sm:p-12 text-center text-stone-400 flex flex-col items-center justify-center gap-2">
              <CheckCircle2 size={32} className="text-emerald-500" />
              <p className="font-bold text-sm sm:text-base text-stone-700 dark:text-stone-300">Kayıt bulunamadı.</p>
              <p className="text-xs">Filtreleri veya tarih aralığını değiştirebilirsiniz.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredActivities.map(item => {
                const isExpanded = expandedItemId === item.id;
                const isCancel = item.type === 'CANCEL';
                const isOrder = item.type === 'ORDER_TAKEN';
                const isPayment = item.type === 'PAYMENT';
                const isDiscount = item.type === 'DISCOUNT';
                const isTransfer = item.type === 'TRANSFER';

                let badgeColor = 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700';
                let typeIcon = <Activity size={13} />;
                let cardBorder = 'border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-stone-900';

                if (isCancel) {
                  badgeColor = 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border-red-200 dark:border-red-800';
                  typeIcon = <Trash2 size={13} />;
                  cardBorder = 'border-red-300 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/10';
                } else if (isOrder) {
                  badgeColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
                  typeIcon = <UtensilsCrossed size={13} />;
                } else if (isPayment) {
                  badgeColor = 'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800';
                  typeIcon = <CreditCard size={13} />;
                } else if (isDiscount) {
                  badgeColor = 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800';
                  typeIcon = <Gift size={13} />;
                } else if (isTransfer) {
                  badgeColor = 'bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300 border-orange-200 dark:border-orange-800';
                  typeIcon = <ArrowRightLeft size={13} />;
                }

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "border rounded-2xl p-3 sm:p-4 transition-all shadow-xs",
                      cardBorder
                    )}
                  >
                    {/* Top Row: Type Badge, Title, Table & Amount */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 border mt-0.5", badgeColor)}>
                          {typeIcon}
                          <span className="hidden sm:inline">{item.type}</span>
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={cn(
                              "font-black text-xs sm:text-sm",
                              isCancel ? "text-red-600 dark:text-red-400" : "text-stone-900 dark:text-white"
                            )}>
                              {item.actionTitle}
                            </span>
                            {item.tableLabel && (
                              <span className="px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[10px] font-bold border border-stone-200 dark:border-stone-700">
                                {item.tableLabel}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 font-medium leading-relaxed">
                            {item.details}
                          </p>
                        </div>
                      </div>

                      {/* Right Amount on Top */}
                      {item.amount !== undefined && item.amount > 0 && (
                        <div className={cn(
                          "font-black font-mono text-xs sm:text-sm shrink-0 whitespace-nowrap",
                          isCancel ? "text-red-600 dark:text-red-400" : isOrder ? "text-emerald-600 dark:text-emerald-400" : "text-stone-900 dark:text-white"
                        )}>
                          {item.isNegative ? '-' : '+'}{formatCurrency(item.amount)}
                        </div>
                      )}
                    </div>

                    {/* Footer Row: Staff name, timestamp and item toggle */}
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-stone-100 dark:border-stone-800/80 text-[11px] text-stone-500 dark:text-stone-400">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                          <User size={12} />
                          <span>{item.staffName}</span>
                        </span>
                        <span>•</span>
                        <span className="font-mono">{new Date(item.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {Boolean(item.itemsList && item.itemsList.length > 0) && (
                        <button
                          type="button"
                          onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                          className="text-[11px] font-bold text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isExpanded ? 'Gizle' : `${item.itemsList?.length} Ürün`}</span>
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      )}
                    </div>

                    {/* Expanded Items Breakdown */}
                    {isExpanded && item.itemsList && (
                      <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          İşlem Kalemleri:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                          {item.itemsList.map((prod, pIdx) => (
                            <div
                              key={pIdx}
                              className="p-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800 flex items-center justify-between text-xs"
                            >
                              <div className="min-w-0">
                                <span className="font-bold text-stone-900 dark:text-stone-100 truncate block">
                                  {prod.quantity}x {prod.name}
                                </span>
                                {prod.notes && (
                                  <div className="text-[10px] text-amber-500 italic truncate">
                                    Not: {prod.notes}
                                  </div>
                                )}
                              </div>
                              {prod.price !== undefined && (
                                <span className="font-mono font-bold text-stone-600 dark:text-stone-400 ml-2 shrink-0">
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
