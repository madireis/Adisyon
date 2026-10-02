import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { 
  Banknote, 
  ArrowDownRight, 
  ArrowUpRight, 
  Receipt, 
  TrendingUp, 
  CreditCard, 
  Users, 
  Download, 
  Trash2, 
  Plus, 
  PieChart as PieChartIcon,
  Search,
  BarChart3,
  ShieldCheck,
  Utensils,
  Activity,
  Timer
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from 'recharts';
import { cn, formatCurrency } from '@/lib/utils';
import { useApp } from '@/lib/store';
import CashTransactionModal from '@/components/pos/CashTransactionModal';
import ThermalSlipModal, { type ZReportData } from '@/components/pos/ThermalSlipModal';
import OrderTimelineModal from '@/components/orders/OrderTimelineModal';
import { getPaymentMethodNameMap } from '@/lib/paymentMethods';
import type { Staff, MenuItem, Order, Payment, CashTransaction, KitchenTicket } from '@/types/pos';

export default function ReportsPage() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'CASH_REGISTER' | 'ORDERS' | 'STAFF' | 'PAYMENTS' | 'PRODUCTS'>('SUMMARY');
  const [dateRange, setDateRange] = useState<'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH'>('TODAY');

  // Modal States
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashModalType, setCashModalType] = useState<'in' | 'out'>('out');
  const [isZReportOpen, setIsZReportOpen] = useState(false);
  const [selectedTimelineOrder, setSelectedTimelineOrder] = useState<Order | null>(null);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedWaiterFilter, setSelectedWaiterFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'OPEN' | 'PAID' | 'CANCELLED'>('ALL');

  // Live queries
  const orders = useLiveQuery(() => db.orders.toArray()) || [];
  const payments = useLiveQuery(() => db.payments.toArray()) || [];
  const cashTransactions = useLiveQuery(() => db.cashTransactions.toArray()) || [];
  const kitchenTickets = useLiveQuery(() => db.kitchenTickets.toArray()) || [];
  const staff = useLiveQuery(() => db.staff.toArray()) || [];
  const menuItems = useLiveQuery(() => db.menuItems.toArray()) || [];
  const categories = useLiveQuery(() => db.categories.toArray()) || [];

  // Fast lookups for order payments & kitchen tickets
  const paymentsByOrderId = useMemo(() => {
    const map = new Map<string, Payment>();
    payments.forEach(p => {
      if (p.orderId) map.set(p.orderId, p);
    });
    return map;
  }, [payments]);

  const ticketsByOrderId = useMemo(() => {
    const map = new Map<string, KitchenTicket[]>();
    kitchenTickets.forEach(t => {
      if (t.orderId) {
        const arr = map.get(t.orderId) || [];
        arr.push(t);
        map.set(t.orderId, arr);
      }
    });
    return map;
  }, [kitchenTickets]);

  // Date Filtering logic
  const { filteredOrders, filteredPayments, filteredCash, dateRangeLabel } = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (dateRange === 'TODAY') {
      startDate.setHours(0, 0, 0, 0);
    } else if (dateRange === 'YESTERDAY') {
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(now.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
    } else if (dateRange === 'WEEK') {
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (dateRange === 'MONTH') {
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }

    const fOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= startDate && (dateRange === 'YESTERDAY' ? d <= endDate : true);
    });

    const fPayments = payments.filter(p => {
      const d = new Date(p.paidAt);
      return d >= startDate && (dateRange === 'YESTERDAY' ? d <= endDate : true);
    });

    const fCash = cashTransactions.filter(t => {
      const d = new Date(t.createdAt);
      return d >= startDate && (dateRange === 'YESTERDAY' ? d <= endDate : true);
    });

    const label = dateRange === 'TODAY' ? 'Bugün' : dateRange === 'YESTERDAY' ? 'Dün' : dateRange === 'WEEK' ? 'Son 7 Gün' : 'Son 30 Gün';

    return { 
      filteredOrders: fOrders, 
      filteredPayments: fPayments, 
      filteredCash: fCash,
      dateRangeLabel: label 
    };
  }, [orders, payments, cashTransactions, dateRange]);

  // Order List Filtered by Search, Waiter & Status
  const displayedOrders = useMemo(() => {
    return filteredOrders.filter(o => {
      if (selectedWaiterFilter !== 'ALL' && o.waiterId !== selectedWaiterFilter && o.waiterName !== selectedWaiterFilter) {
        return false;
      }
      const payment = paymentsByOrderId.get(o.id);
      const isPaid = o.status === 'paid' || !!o.paidAt || !!payment;
      const isCancelled = o.status === 'cancelled';

      if (selectedStatusFilter === 'PAID' && !isPaid) return false;
      if (selectedStatusFilter === 'OPEN' && (isPaid || isCancelled)) return false;
      if (selectedStatusFilter === 'CANCELLED' && !isCancelled) return false;

      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase();
        const matchTable = (o.tableLabel || '').toLowerCase().includes(q);
        const matchWaiter = (o.waiterName || '').toLowerCase().includes(q);
        const matchId = (o.id || '').toLowerCase().includes(q);
        return matchTable || matchWaiter || matchId;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredOrders, selectedWaiterFilter, selectedStatusFilter, orderSearchQuery, paymentsByOrderId]);

  // Financial Metric Calculations
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let cashRevenue = 0;
    let posRevenue = 0;
    let mealCardRevenue = 0;
    let otherRevenue = 0;

    filteredPayments.forEach(p => {
      totalRevenue += (p.total || 0);
      p.parts?.forEach(part => {
        if (part.method === 'cash') {
          cashRevenue += part.amount;
        } else if (part.method === 'credit_card' || part.method === 'debit_card') {
          posRevenue += part.amount;
        } else if (['sodexo', 'multinet', 'ticket', 'metropol'].includes(part.method)) {
          mealCardRevenue += part.amount;
        } else {
          otherRevenue += part.amount;
        }
      });
    });

    const cashInTotal = filteredCash
      .filter(t => t.type === 'in')
      .reduce((sum, t) => sum + t.amount, 0);

    const cashOutTotal = filteredCash
      .filter(t => t.type === 'out')
      .reduce((sum, t) => sum + t.amount, 0);

    const expectedDrawerCash = cashRevenue + cashInTotal - cashOutTotal;
    const closedOrdersCount = filteredOrders.filter(o => o.status === 'paid' || !!o.paidAt || paymentsByOrderId.has(o.id)).length;
    const avgCheck = closedOrdersCount > 0 ? totalRevenue / closedOrdersCount : 0;

    return {
      totalRevenue,
      cashRevenue,
      posRevenue,
      mealCardRevenue,
      otherRevenue,
      cashInTotal,
      cashOutTotal,
      expectedDrawerCash,
      closedOrdersCount,
      avgCheck,
    };
  }, [filteredPayments, filteredCash, filteredOrders, paymentsByOrderId]);

  // Dynamic Staff Breakdown
  const staffBreakdown = useMemo(() => {
    const staffMap = new Map<string, Staff>();
    staff.forEach(s => staffMap.set(s.id, s));

    const agg: Record<string, { name: string; role: string; orderCount: number; totalRevenue: number }> = {};

    filteredOrders.forEach(o => {
      const waiterId = o.waiterId;
      const waiter = staffMap.get(waiterId);
      const waiterName = o.waiterName || waiter?.name || 'Garson';
      const role = waiter?.role === 'manager' ? 'Müdür' : waiter?.role === 'cashier' ? 'Kasiyer' : 'Garson';

      if (!agg[waiterName]) {
        agg[waiterName] = {
          name: waiterName,
          role,
          orderCount: 0,
          totalRevenue: 0
        };
      }
      agg[waiterName].orderCount += 1;
      agg[waiterName].totalRevenue += (o.total || 0);
    });

    return Object.values(agg).map(item => ({
      ...item,
      avgCheck: item.orderCount > 0 ? Math.round(item.totalRevenue / item.orderCount) : 0
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredOrders, staff]);

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const methodNames = getPaymentMethodNameMap();

    const agg: Record<string, { count: number; total: number }> = {};
    let totalAll = 0;

    filteredPayments.forEach(p => {
      p.parts?.forEach(part => {
        const m = methodNames[part.method] || part.method;
        if (!agg[m]) agg[m] = { count: 0, total: 0 };
        agg[m].count += 1;
        agg[m].total += part.amount;
        totalAll += part.amount;
      });
    });

    return Object.entries(agg).map(([method, data]) => ({
      method,
      count: data.count,
      total: data.total,
      percent: totalAll > 0 ? Math.round((data.total / totalAll) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  }, [filteredPayments]);

  // Dynamic Top Products
  const topProducts = useMemo(() => {
    const catMap = new Map<string, string>();
    categories.forEach(c => catMap.set(c.id, c.name));
    const itemCatMap = new Map<string, string>();
    menuItems.forEach(m => itemCatMap.set(m.id, catMap.get(m.categoryId) || 'Genel'));

    const agg: Record<string, { name: string; count: number; revenue: number; category: string }> = {};

    filteredOrders.forEach(o => {
      if (o.status === 'cancelled') return;
      o.items?.forEach(it => {
        if (!agg[it.name]) {
          agg[it.name] = {
            name: it.name,
            count: 0,
            revenue: 0,
            category: itemCatMap.get(it.menuItemId) || 'Menü'
          };
        }
        agg[it.name].count += it.quantity;
        agg[it.name].revenue += (it.unitPrice * it.quantity);
      });
    });

    return Object.values(agg).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders, categories, menuItems]);

  // Prepare Z-Report Payload
  const zReportPayload: ZReportData = useMemo(() => {
    const expenses = filteredCash
      .filter(t => t.type === 'out')
      .map(t => ({
        description: t.description,
        amount: t.amount,
        category: t.category,
      }));

    const staffList = staffBreakdown.map(s => ({
      name: s.name,
      orderCount: s.orderCount,
      total: s.totalRevenue,
    }));

    return {
      reportDate: `${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}`,
      totalRevenue: metrics.totalRevenue,
      orderCount: metrics.closedOrdersCount,
      cashRevenue: metrics.cashRevenue,
      posRevenue: metrics.posRevenue,
      mealCardRevenue: metrics.mealCardRevenue,
      otherRevenue: metrics.otherRevenue,
      cashInTotal: metrics.cashInTotal,
      cashOutTotal: metrics.cashOutTotal,
      expectedDrawerCash: metrics.expectedDrawerCash,
      expenses,
      staffBreakdown: staffList,
      authorizedPerson: state.currentUser?.name || 'Yönetici',
    };
  }, [metrics, filteredCash, staffBreakdown, state.currentUser]);

  const cashPercent = metrics.totalRevenue > 0 ? Math.round((metrics.cashRevenue / metrics.totalRevenue) * 100) : 0;
  const posPercent = metrics.totalRevenue > 0 ? Math.round((metrics.posRevenue / metrics.totalRevenue) * 100) : 0;
  const expenseRatio = metrics.totalRevenue > 0 ? Math.round((metrics.cashOutTotal / metrics.totalRevenue) * 100) : 0;

  // Timeline Chart Data
  const timelineChartData = useMemo(() => {
    if (dateRange === 'TODAY' || dateRange === 'YESTERDAY') {
      const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
      const map: Record<string, { time: string; ciro: number }> = {};
      hours.forEach(h => {
        map[h] = { time: h, ciro: 0 };
      });

      filteredPayments.forEach(p => {
        const d = new Date(p.paidAt);
        const h = d.getHours();
        const bucketH = Math.min(22, Math.max(8, Math.floor(h / 2) * 2));
        const key = `${bucketH < 10 ? '0' + bucketH : bucketH}:00`;
        if (map[key]) {
          map[key].ciro += (p.total || 0);
        }
      });

      return Object.values(map);
    } else {
      const daysCount = dateRange === 'WEEK' ? 7 : 14;
      const dayMap: Record<string, { time: string; ciro: number }> = {};
      const now = new Date();

      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const key = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        dayMap[key] = { time: key, ciro: 0 };
      }

      filteredPayments.forEach(p => {
        const d = new Date(p.paidAt);
        const key = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        if (dayMap[key]) {
          dayMap[key].ciro += (p.total || 0);
        }
      });

      return Object.values(dayMap);
    }
  }, [filteredPayments, dateRange]);

  // Cash Flow Bar Chart Data
  const cashFlowBarData = useMemo(() => {
    return [
      { name: 'Nakit Satış', tutar: metrics.cashRevenue, fill: '#10b981' },
      { name: 'Kasa Giriş (+)', tutar: metrics.cashInTotal, fill: '#06b6d4' },
      { name: 'Masraflar (-)', tutar: metrics.cashOutTotal, fill: '#ef4444' },
      { name: 'Kasadaki Nakit', tutar: Math.max(0, metrics.expectedDrawerCash), fill: '#f59e0b' },
      { name: 'Banka POS', tutar: metrics.posRevenue, fill: '#3b82f6' }
    ];
  }, [metrics]);

  // Payment Breakdown for Donut Chart
  const paymentPieData = useMemo(() => {
    const list = [
      { name: 'Nakit TL', value: metrics.cashRevenue, color: '#10b981' },
      { name: 'POS / Kart', value: metrics.posRevenue, color: '#3b82f6' },
      { name: 'Yemek Kartı', value: metrics.mealCardRevenue, color: '#8b5cf6' },
      { name: 'Diğer', value: metrics.otherRevenue, color: '#f59e0b' }
    ].filter(item => item.value > 0);

    if (list.length === 0) {
      return [{ name: 'Kayıt Yok', value: 1, color: '#78716c' }];
    }
    return list;
  }, [metrics]);

  // Structured Reconciliation Rows
  const reconciliationRows = useMemo(() => {
    const totalRev = metrics.totalRevenue || 1;
    const cashShare = Math.round((metrics.cashRevenue / totalRev) * 100);
    const posShare = Math.round((metrics.posRevenue / totalRev) * 100);
    const mealCardShare = Math.round((metrics.mealCardRevenue / totalRev) * 100);

    return [
      {
        id: 'cash_in',
        title: 'Kasa Açılış & Giriş',
        channel: 'Kasa Çekmecesi',
        percent: metrics.cashInTotal > 0 ? 100 : 0,
        amount: metrics.cashInTotal,
        prefix: '+',
        color: 'text-teal-600 dark:text-teal-400',
        barColor: 'bg-teal-500',
        icon: Banknote
      },
      {
        id: 'cash_sales',
        title: 'Nakit Satışlar',
        channel: 'Masa Tahsilatı',
        percent: cashShare,
        amount: metrics.cashRevenue,
        prefix: '+',
        color: 'text-emerald-600 dark:text-emerald-400',
        barColor: 'bg-emerald-500',
        icon: Banknote
      },
      {
        id: 'expenses',
        title: 'Kasa Masraf / Giderler',
        channel: 'Nakit Harcamalar',
        percent: expenseRatio,
        amount: metrics.cashOutTotal,
        prefix: '-',
        color: 'text-red-600 dark:text-red-400',
        barColor: 'bg-red-500',
        icon: ArrowUpRight
      },
      {
        id: 'net_cash',
        title: 'Kasadaki Net Nakit',
        channel: 'Fiziksel Kasa',
        percent: 100,
        amount: metrics.expectedDrawerCash,
        prefix: '=',
        color: 'text-amber-600 dark:text-amber-400 font-black',
        barColor: 'bg-amber-500',
        icon: ShieldCheck
      },
      {
        id: 'pos_sales',
        title: 'POS & Kredi Kartı',
        channel: 'Banka Hesabı',
        percent: posShare,
        amount: metrics.posRevenue,
        prefix: '+',
        color: 'text-blue-600 dark:text-blue-400',
        barColor: 'bg-blue-500',
        icon: CreditCard
      },
      {
        id: 'meal_cards',
        title: 'Yemek Kartları',
        channel: 'Sodexo / Multinet',
        percent: mealCardShare,
        amount: metrics.mealCardRevenue,
        prefix: '+',
        color: 'text-purple-600 dark:text-purple-400',
        barColor: 'bg-purple-500',
        icon: Utensils
      },
      {
        id: 'total_ciro',
        title: 'BRÜT TOPLAM CİRO',
        channel: 'Tüm Kanallar',
        percent: 100,
        amount: metrics.totalRevenue,
        prefix: '★',
        color: 'text-orange-600 dark:text-orange-400 font-black',
        barColor: 'bg-orange-600',
        icon: TrendingUp
      }
    ];
  }, [metrics, expenseRatio]);

  // Handle Cash Transaction Delete
  const handleDeleteCashTransaction = async (id: string) => {
    if (confirm('Bu kasa hareketini silmek istediğinize emin misiniz?')) {
      await db.cashTransactions.delete(id);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const rows: string[][] = [
      ['Rapor', 'Kasa & Gün Sonu Ciro Raporu'],
      ['Tarih', dateRangeLabel],
      ['Toplam Ciro', metrics.totalRevenue.toString()],
      ['Nakit', metrics.cashRevenue.toString()],
      ['POS', metrics.posRevenue.toString()],
      ['Kasa Giriş', metrics.cashInTotal.toString()],
      ['Masraf', metrics.cashOutTotal.toString()],
      ['Net Nakit', metrics.expectedDrawerCash.toString()],
      [],
      ['Kasa Hareketleri'],
      ['Tür', 'Kategori', 'Açıklama', 'Personel', 'Tarih', 'Tutar'],
    ];

    filteredCash.forEach(t => {
      rows.push([
        t.type === 'in' ? 'Giriş' : 'Çıkış',
        t.category,
        t.description,
        t.processedBy,
        new Date(t.createdAt).toLocaleString('tr-TR'),
        (t.type === 'in' ? '+' : '-') + t.amount.toString()
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map(e => e.join(";")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kasa_raporu_${dateRange.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col space-y-4 sm:space-y-6 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 select-none">
      
      {/* Top Header & Date Filter */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2.5">
            <Banknote className="text-orange-600 shrink-0" size={26} />
            <span>Kasa & Gün Sonu</span>
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Nakit hesabı, ciro dengesi ve Z-Raporu
          </p>
        </div>

        {/* Date Filter & Quick Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
          {/* Date Selector */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-1 grid grid-cols-4 sm:flex items-center shadow-xs">
            {(['TODAY', 'YESTERDAY', 'WEEK', 'MONTH'] as const).map(range => (
              <button
                key={range}
                type="button"
                onClick={() => setDateRange(range)}
                className={cn(
                  "px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center",
                  dateRange === range
                    ? "bg-orange-600 text-white shadow-xs"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                )}
              >
                {range === 'TODAY' ? 'Bugün' : range === 'YESTERDAY' ? 'Dün' : range === 'WEEK' ? 'Hafta' : 'Ay'}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCashModalType('in');
                setIsCashModalOpen(true);
              }}
              className="py-2 px-3 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold text-xs rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 min-h-[38px] shadow-xs"
            >
              <ArrowDownRight size={15} className="text-emerald-600" />
              <span>+ Giriş</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCashModalType('out');
                setIsCashModalOpen(true);
              }}
              className="py-2 px-3 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold text-xs rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 min-h-[38px] shadow-xs"
            >
              <ArrowUpRight size={15} className="text-red-600" />
              <span>- Masraf</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsZReportOpen(true)}
              className="flex-1 sm:flex-none py-2 px-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 min-h-[38px]"
            >
              <Receipt size={16} />
              <span>Z-Raporu Al</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="p-2 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shadow-xs"
              title="CSV Dışa Aktar"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 4 CORE KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* 1. TOPLAM CİRO */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                {dateRangeLabel} Ciro
              </span>
              <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-600 flex items-center justify-center">
                <TrendingUp size={15} />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-2xl font-mono font-black text-stone-950 dark:text-white truncate">
                {formatCurrency(metrics.totalRevenue)}
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">
                {metrics.closedOrdersCount} Adisyon • Ort. {formatCurrency(metrics.avgCheck)}
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800">
            <div className="flex justify-between text-[10px] font-bold text-stone-500 mb-1">
              <span className="text-emerald-600">Nakit: %{cashPercent}</span>
              <span className="text-blue-600">POS: %{posPercent}</span>
            </div>
            <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden flex">
              <div style={{ width: `${cashPercent}%` }} className="bg-emerald-500 h-full" />
              <div style={{ width: `${posPercent}%` }} className="bg-blue-500 h-full" />
            </div>
          </div>
        </div>

        {/* 2. KASADAKİ NAKİT */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Kasadaki Nakit
              </span>
              <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
                <Banknote size={15} />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-2xl font-mono font-black text-stone-950 dark:text-white truncate">
                {formatCurrency(metrics.expectedDrawerCash)}
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">
                Nakit Satış: {formatCurrency(metrics.cashRevenue)}
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800">
            <div className="flex justify-between text-[10px] font-bold text-stone-500 mb-1">
              <span>Kasa Durumu</span>
              <span className={metrics.expectedDrawerCash >= 0 ? "text-emerald-600" : "text-red-500"}>
                {metrics.expectedDrawerCash >= 0 ? 'Dengeli' : 'Açık'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              <div 
                style={{ 
                  width: `${metrics.cashRevenue + metrics.cashInTotal > 0 
                    ? Math.min(100, Math.round((Math.max(0, metrics.expectedDrawerCash) / (metrics.cashRevenue + metrics.cashInTotal)) * 100)) 
                    : 100}%` 
                }} 
                className="bg-orange-600 h-full" 
              />
            </div>
          </div>
        </div>

        {/* 3. POS / BANKA */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Banka / POS
              </span>
              <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
                <CreditCard size={15} />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-2xl font-mono font-black text-stone-950 dark:text-white truncate">
                {formatCurrency(metrics.posRevenue)}
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">
                Kartlı masa ödemeleri
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800">
            <div className="flex justify-between text-[10px] font-bold text-stone-500 mb-1">
              <span>Banka Payı</span>
              <span className="text-blue-600">%{posPercent}</span>
            </div>
            <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              <div style={{ width: `${posPercent}%` }} className="bg-blue-500 h-full" />
            </div>
          </div>
        </div>

        {/* 4. MASRAFLAR */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Masraflar
              </span>
              <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
                <ArrowUpRight size={15} />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-2xl font-mono font-black text-stone-950 dark:text-white truncate">
                {formatCurrency(metrics.cashOutTotal)}
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">
                {filteredCash.filter(t => t.type === 'out').length} gider kalemi
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800">
            <div className="flex justify-between text-[10px] font-bold text-stone-500 mb-1">
              <span>Gider Oranı</span>
              <span className="text-red-500">%{expenseRatio}</span>
            </div>
            <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              <div style={{ width: `${Math.min(100, expenseRatio)}%` }} className="bg-red-500 h-full" />
            </div>
          </div>
        </div>

      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 overflow-x-auto gap-1 no-scrollbar">
        {[
          { key: 'SUMMARY', label: 'Özet & Rapor', icon: BarChart3 },
          { key: 'CASH_REGISTER', label: `Kasa Defteri (${filteredCash.length})`, icon: Banknote },
          { key: 'ORDERS', label: `Adisyonlar (${filteredOrders.length})`, icon: Receipt },
          { key: 'STAFF', label: 'Personel', icon: Users },
          { key: 'PAYMENTS', label: 'Ödemeler', icon: CreditCard },
          { key: 'PRODUCTS', label: 'Ürünler', icon: PieChartIcon },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                "pb-2.5 px-3 text-xs sm:text-sm font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer",
                isActive
                  ? "border-orange-600 text-orange-600 dark:text-orange-400"
                  : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
              )}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SUMMARY */}
      {activeTab === 'SUMMARY' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Ciro Trend Area Chart */}
            <div className="lg:col-span-8 bg-white dark:bg-stone-900 rounded-2xl p-4 sm:p-5 border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Activity size={16} className="text-orange-600" />
                  <span>Satış Eğrisi ({dateRangeLabel})</span>
                </h2>
                <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-lg border border-orange-200 dark:border-orange-800">
                  {formatCurrency(metrics.totalRevenue)}
                </span>
              </div>

              <div className="h-56 sm:h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="reportsColorCiro" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                    <XAxis dataKey="time" tick={{ fill: '#78716c', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#78716c', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₺${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#1c1917', borderRadius: '12px', border: '1px solid #44403c', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any) => [`₺${Number(val).toLocaleString('tr-TR')}`, 'Ciro']}
                    />
                    <Area type="monotone" dataKey="ciro" stroke="#ea580c" strokeWidth={2.5} fillOpacity={1} fill="url(#reportsColorCiro)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Breakdown Donut */}
            <div className="lg:col-span-4 bg-white dark:bg-stone-900 rounded-2xl p-4 sm:p-5 border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex flex-col justify-between">
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-2">
                <CreditCard size={16} className="text-blue-500" />
                <span>Tahsilat Kanalları</span>
              </h2>

              <div className="h-44 sm:h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentPieData} cx="50%" cy="50%" innerRadius={42} outerRadius={64} paddingAngle={4} dataKey="value">
                      {paymentPieData.map((entry, index) => (
                        <Cell key={`pie-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(val: any) => [`₺${Number(val).toLocaleString('tr-TR')}`, 'Tutar']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px] font-medium">
                {paymentPieData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-stone-600 dark:text-stone-400 truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Clean Financial Reconciliation Table */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden shadow-xs">
            <div className="p-3.5 sm:p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-orange-600" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Kasa & Gün Sonu Mutabakatı</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsZReportOpen(true)}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <Receipt size={14} />
                <span>Z-Raporu</span>
              </button>
            </div>

            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {reconciliationRows.map(row => {
                const Icon = row.icon;
                return (
                  <div key={row.id} className="p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300 shrink-0">
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{row.title}</div>
                        <div className="text-[10px] text-stone-400">{row.channel}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right shrink-0">
                      <div className="hidden sm:block w-24">
                        <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", row.barColor)} style={{ width: `${Math.min(100, Math.max(5, row.percent))}%` }} />
                        </div>
                      </div>
                      <div className={cn("text-xs sm:text-sm font-mono font-bold", row.color)}>
                        {row.prefix} {formatCurrency(row.amount)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CASH REGISTER */}
      {activeTab === 'CASH_REGISTER' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200/80 dark:border-stone-800/80">
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Kasa Hareketleri</h2>
              <p className="text-xs text-stone-500">Girişler ve masraf çıkışları</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setCashModalType('in'); setIsCashModalOpen(true); }}
                className="py-1.5 px-3 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold text-xs rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Plus size={14} className="text-emerald-600" />
                <span>Giriş</span>
              </button>
              <button
                type="button"
                onClick={() => { setCashModalType('out'); setIsCashModalOpen(true); }}
                className="py-1.5 px-3 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-bold text-xs rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Plus size={14} className="text-red-600" />
                <span>Masraf</span>
              </button>
            </div>
          </div>

          {filteredCash.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-8 border border-stone-200 dark:border-stone-800 text-center text-xs text-stone-400">
              Bu dönemde kayıtlı kasa hareketi yok.
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden shadow-xs divide-y divide-stone-100 dark:divide-stone-800">
              {filteredCash.slice().reverse().map(t => (
                <div key={t.id} className="p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
                      t.type === 'in' ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600" : "bg-red-50 dark:bg-red-950/60 text-red-600"
                    )}>
                      {t.type === 'in' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{t.category}</div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                        {t.description || t.processedBy} • {new Date(t.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={cn("font-mono font-bold text-xs sm:text-sm", t.type === 'in' ? "text-emerald-600" : "text-red-600")}>
                      {t.type === 'in' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCashTransaction(t.id)}
                      className="p-1 text-stone-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ORDERS */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200/80 dark:border-stone-800/80">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-stone-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Masa veya garson ara..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-medium text-stone-900 dark:text-white focus:outline-none"
              />
            </div>
            <select
              value={selectedWaiterFilter}
              onChange={(e) => setSelectedWaiterFilter(e.target.value)}
              className="py-1.5 px-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer focus:outline-none"
            >
              <option value="ALL">Tüm Personel</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'ALL', label: 'Tüm Adisyonlar' },
              { id: 'OPEN', label: 'Açık Masalar' },
              { id: 'PAID', label: 'Ödenenler' },
              { id: 'CANCELLED', label: 'Kapatılan / İptal' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatusFilter(tab.id as any)}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-colors cursor-pointer active:scale-95 shrink-0",
                  selectedStatusFilter === tab.id
                    ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-xs"
                    : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-800/80"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {displayedOrders.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-8 border border-stone-200 dark:border-stone-800 text-center text-xs text-stone-400">
              Adisyon bulunamadı.
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden shadow-xs divide-y divide-stone-100 dark:divide-stone-800">
              {displayedOrders.map(o => {
                const payment = paymentsByOrderId.get(o.id);
                const isPaid = o.status === 'paid' || !!o.paidAt || !!payment;
                const isCancelled = o.status === 'cancelled';
                const startStr = o.createdAt ? new Date(o.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-';

                return (
                  <div 
                    key={o.id}
                    onClick={() => setSelectedTimelineOrder({ ...o, status: isPaid ? 'paid' : isCancelled ? 'cancelled' : o.status })}
                    className="p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-lg border border-orange-200 dark:border-orange-800 font-bold text-xs shrink-0">
                        {o.tableLabel}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                          {o.waiterName || 'Garson'}
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          {startStr} • {o.items?.length || 0} kalem {isCancelled && '(Kapatıldı)'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-md",
                        isPaid 
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" 
                          : isCancelled
                          ? "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-300 dark:border-stone-700"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      )}>
                        {isPaid ? 'Ödendi' : isCancelled ? 'Kapatıldı / İptal' : 'Açık'}
                      </span>
                      <span className="font-mono font-bold text-xs sm:text-sm text-stone-950 dark:text-white">
                        {formatCurrency(o.total)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: STAFF */}
      {activeTab === 'STAFF' && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden shadow-xs divide-y divide-stone-100 dark:divide-stone-800">
          <div className="p-3.5 bg-stone-50/50 dark:bg-stone-950/50 border-b border-stone-200 dark:border-stone-800 font-bold text-xs text-stone-500">
            Personel Satış Dağılımı ({dateRangeLabel})
          </div>
          {staffBreakdown.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400">Satış kaydı bulunmuyor.</div>
          ) : (
            staffBreakdown.map((s, idx) => (
              <div key={idx} className="p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                <div>
                  <div className="text-xs font-bold text-stone-900 dark:text-stone-100">{s.name}</div>
                  <div className="text-[11px] text-stone-500">{s.role} • {s.orderCount} Masa</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-xs sm:text-sm text-stone-950 dark:text-white">
                    {formatCurrency(s.totalRevenue)}
                  </div>
                  <div className="text-[10px] text-stone-400">Ort. {formatCurrency(s.avgCheck)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: PAYMENTS */}
      {activeTab === 'PAYMENTS' && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden shadow-xs divide-y divide-stone-100 dark:divide-stone-800">
          <div className="p-3.5 bg-stone-50/50 dark:bg-stone-950/50 border-b border-stone-200 dark:border-stone-800 font-bold text-xs text-stone-500">
            Ödeme Yöntemleri Dağılımı
          </div>
          {paymentBreakdown.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400">Tahsilat bulunmuyor.</div>
          ) : (
            paymentBreakdown.map((item, idx) => (
              <div key={idx} className="p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                <div>
                  <div className="text-xs font-bold text-stone-900 dark:text-stone-100">{item.method}</div>
                  <div className="text-[11px] text-stone-500">{item.count} İşlem • %{item.percent} Pay</div>
                </div>
                <div className="font-mono font-bold text-xs sm:text-sm text-stone-950 dark:text-white">
                  {formatCurrency(item.total)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 6: PRODUCTS */}
      {activeTab === 'PRODUCTS' && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden shadow-xs divide-y divide-stone-100 dark:divide-stone-800">
          <div className="p-3.5 bg-stone-50/50 dark:bg-stone-950/50 border-b border-stone-200 dark:border-stone-800 font-bold text-xs text-stone-500">
            Çok Satan Ürünler ({dateRangeLabel})
          </div>
          {topProducts.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400">Ürün satışı bulunmuyor.</div>
          ) : (
            topProducts.slice(0, 30).map((p, idx) => (
              <div key={idx} className="p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 text-center text-xs font-mono font-bold text-stone-400">{idx + 1}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{p.name}</div>
                    <div className="text-[11px] text-stone-500">{p.category} • {p.count} Adet</div>
                  </div>
                </div>
                <div className="font-mono font-bold text-xs sm:text-sm text-stone-950 dark:text-white shrink-0">
                  {formatCurrency(p.revenue)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      <CashTransactionModal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        defaultType={cashModalType}
      />

      <ThermalSlipModal
        isOpen={isZReportOpen}
        onClose={() => setIsZReportOpen(false)}
        type="z-report"
        zReportData={zReportPayload}
      />

      <OrderTimelineModal
        isOpen={!!selectedTimelineOrder}
        onClose={() => setSelectedTimelineOrder(null)}
        order={selectedTimelineOrder}
      />

    </div>
  );
}
