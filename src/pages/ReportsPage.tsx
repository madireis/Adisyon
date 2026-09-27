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
  FileText, 
  Download, 
  Trash2, 
  Plus, 
  Calendar,
  PieChart as PieChartIcon,
  CheckCircle2,
  AlertCircle,
  ChefHat,
  Clock,
  Timer,
  Search,
  Eye,
  BarChart3,
  ShieldCheck,
  Utensils,
  Activity,
  Sparkles
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

  // Order List Filtered by Search & Waiter
  const displayedOrders = useMemo(() => {
    return filteredOrders.filter(o => {
      if (selectedWaiterFilter !== 'ALL' && o.waiterId !== selectedWaiterFilter && o.waiterName !== selectedWaiterFilter) {
        return false;
      }
      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase();
        const matchTable = (o.tableLabel || '').toLowerCase().includes(q);
        const matchWaiter = (o.waiterName || '').toLowerCase().includes(q);
        const matchId = (o.id || '').toLowerCase().includes(q);
        return matchTable || matchWaiter || matchId;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredOrders, selectedWaiterFilter, orderSearchQuery]);

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

    // Physical Drawer Balance
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
    const methodNames: Record<string, string> = {
      cash: 'Nakit TL',
      credit_card: 'POS / Kredi Kartı',
      debit_card: 'Banka Kartı',
      sodexo: 'Sodexo Restaurant Pass',
      multinet: 'Multinet Yemek Kartı',
      ticket: 'Ticket Edenred',
      metropol: 'Metropol Card',
      ikram: 'Yetkili İkram'
    };

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

  // Derived percentages for visual cards & progress bars
  const cashPercent = metrics.totalRevenue > 0 ? Math.round((metrics.cashRevenue / metrics.totalRevenue) * 100) : 0;
  const posPercent = metrics.totalRevenue > 0 ? Math.round((metrics.posRevenue / metrics.totalRevenue) * 100) : 0;
  const expenseRatio = metrics.totalRevenue > 0 ? Math.round((metrics.cashOutTotal / metrics.totalRevenue) * 100) : 0;

  // Timeline Chart Data (Hourly or Daily curve)
  const timelineChartData = useMemo(() => {
    if (dateRange === 'TODAY' || dateRange === 'YESTERDAY') {
      const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '00:00'];
      const map: Record<string, { time: string; ciro: number; siparis: number }> = {};
      hours.forEach(h => {
        map[h] = { time: h, ciro: 0, siparis: 0 };
      });

      filteredPayments.forEach(p => {
        const d = new Date(p.paidAt);
        const h = d.getHours();
        const bucketH = Math.min(22, Math.max(8, Math.floor(h / 2) * 2));
        const key = `${bucketH < 10 ? '0' + bucketH : bucketH}:00`;
        if (map[key]) {
          map[key].ciro += (p.total || 0);
          map[key].siparis += 1;
        }
      });

      return Object.values(map);
    } else {
      const daysCount = dateRange === 'WEEK' ? 7 : 14;
      const dayMap: Record<string, { time: string; ciro: number; siparis: number }> = {};
      const now = new Date();

      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const key = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        dayMap[key] = { time: key, ciro: 0, siparis: 0 };
      }

      filteredPayments.forEach(p => {
        const d = new Date(p.paidAt);
        const key = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        if (dayMap[key]) {
          dayMap[key].ciro += (p.total || 0);
          dayMap[key].siparis += 1;
        }
      });

      return Object.values(dayMap);
    }
  }, [filteredPayments, dateRange]);

  // Cash Flow & Register Comparison Bar Chart Data
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
      { name: 'POS / Kredi Kartı', value: metrics.posRevenue, color: '#3b82f6' },
      { name: 'Yemek Kartları', value: metrics.mealCardRevenue, color: '#8b5cf6' },
      { name: 'Diğer / İkram', value: metrics.otherRevenue, color: '#f59e0b' }
    ].filter(item => item.value > 0);

    if (list.length === 0) {
      return [{ name: 'Kayıt Yok', value: 1, color: '#78716c' }];
    }
    return list;
  }, [metrics]);

  // Expense Categories Breakdown
  const expenseCategoriesBreakdown = useMemo(() => {
    const agg: Record<string, number> = {};
    filteredCash.filter(t => t.type === 'out').forEach(t => {
      const cat = t.category || 'Diğer Gider';
      agg[cat] = (agg[cat] || 0) + t.amount;
    });
    return Object.entries(agg).map(([category, amount]) => ({
      category,
      amount,
      percent: metrics.cashOutTotal > 0 ? Math.round((amount / metrics.cashOutTotal) * 100) : 0
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredCash, metrics.cashOutTotal]);

  // Structured data for Visual Cash & Day-End Reconciliation Table
  const visualReconciliationRows = useMemo(() => {
    const totalRev = metrics.totalRevenue || 1;
    const cashShare = Math.round((metrics.cashRevenue / totalRev) * 100);
    const posShare = Math.round((metrics.posRevenue / totalRev) * 100);
    const mealCardShare = Math.round((metrics.mealCardRevenue / totalRev) * 100);

    const expenseCount = filteredCash.filter(t => t.type === 'out').length;
    const cashInCount = filteredCash.filter(t => t.type === 'in').length;
    const closedOrders = metrics.closedOrdersCount;

    return [
      {
        id: 'cash_in',
        type: 'in',
        title: 'Sabah Kasa Açılışı & Ek Girişler',
        description: 'Kasaya konulan bozuk para ve açılış sermayesi',
        channel: 'Kasa Çekmecesi (Fiziksel)',
        channelBadge: 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300',
        count: `${cashInCount} İşlem`,
        percent: metrics.cashInTotal > 0 ? 100 : 0,
        barColor: 'bg-teal-500',
        amount: metrics.cashInTotal,
        prefix: '+',
        amountColor: 'text-teal-600 dark:text-teal-400',
        status: 'Kasaya Eklendi',
        statusBadge: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
        icon: ArrowDownRight
      },
      {
        id: 'cash_sales',
        type: 'in',
        title: 'Nakit Tahsil Edilen Satışlar',
        description: 'Masalardan nakit alınan hesaplar ve açık adisyon tahsilatı',
        channel: 'Kasa Çekmecesi (Fiziksel)',
        channelBadge: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300',
        count: `${closedOrders} Adisyon`,
        percent: cashShare,
        barColor: 'bg-emerald-500',
        amount: metrics.cashRevenue,
        prefix: '+',
        amountColor: 'text-emerald-600 dark:text-emerald-400',
        status: 'Tahsil Edildi',
        statusBadge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        icon: Banknote
      },
      {
        id: 'expenses',
        type: 'out',
        title: 'Kasadan Yapılan Masraflar & Giderler',
        description: 'Gün içi market, manav, kasap, mutfak ve personel gider çıkışları',
        channel: 'Kasa Çekmecesi (Çıkış)',
        channelBadge: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300',
        count: `${expenseCount} Kalem`,
        percent: metrics.totalRevenue > 0 ? Math.min(100, Math.round((metrics.cashOutTotal / totalRev) * 100)) : 0,
        barColor: 'bg-red-500',
        amount: metrics.cashOutTotal,
        prefix: '-',
        amountColor: 'text-red-600 dark:text-red-400',
        status: 'Kasadan Ödendi',
        statusBadge: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
        icon: ArrowUpRight
      },
      {
        id: 'net_cash',
        type: 'total',
        title: 'KASADAKİ FİZİKSEL NET NAKİT',
        description: 'Kasa sayımında çekmecede bulunması gereken fiziki para (Açılış + Satış - Masraf)',
        channel: 'Fiziksel Kasa Sayımı',
        channelBadge: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black',
        count: 'Nakit Mutabakat',
        percent: 100,
        barColor: 'bg-amber-500',
        amount: metrics.expectedDrawerCash,
        prefix: '=',
        amountColor: 'text-emerald-700 dark:text-emerald-300 font-black text-base',
        status: 'Sayım Mutabakatı',
        statusBadge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-extrabold',
        icon: ShieldCheck
      },
      {
        id: 'pos_sales',
        type: 'pos',
        title: 'POS / Kredi & Banka Kartı Tahsilatı',
        description: 'Banka POS slipleri ile yapılan kartlı masa ödemeleri',
        channel: 'Banka Hesabı (Dijital)',
        channelBadge: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300',
        count: 'POS Slipleri',
        percent: posShare,
        barColor: 'bg-blue-500',
        amount: metrics.posRevenue,
        prefix: '+',
        amountColor: 'text-blue-600 dark:text-blue-400',
        status: 'Bankaya Aktarıldı',
        statusBadge: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        icon: CreditCard
      },
      {
        id: 'meal_cards',
        type: 'meal',
        title: 'Yemek Kartları & Çekler (Sodexo, Multinet vb.)',
        description: 'Ticket Restaurant, Sodexo, Multinet, Metropol dijital kuponları',
        channel: 'Yemek Kartı Kurumları',
        channelBadge: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300',
        count: 'Dijital Kupon',
        percent: mealCardShare,
        barColor: 'bg-purple-500',
        amount: metrics.mealCardRevenue,
        prefix: '+',
        amountColor: 'text-purple-600 dark:text-purple-400',
        status: 'Fatura / Hakediş',
        statusBadge: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        icon: Utensils
      },
      {
        id: 'total_ciro',
        type: 'grand_total',
        title: 'GÜN SONU BRÜT TOPLAM CİRO',
        description: 'Tüm ödeme yöntemlerinden (Nakit + POS + Yemek Kartı) oluşan konsolide hasılat',
        channel: 'Toplam İşletme Cirosu',
        channelBadge: 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 font-black',
        count: `${closedOrders} Sipariş`,
        percent: 100,
        barColor: 'bg-orange-600',
        amount: metrics.totalRevenue,
        prefix: '★',
        amountColor: 'text-orange-600 dark:text-orange-400 font-black text-lg',
        status: 'Konsolide Z-Ciro',
        statusBadge: 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800 font-black',
        icon: TrendingUp
      }
    ];
  }, [metrics, filteredCash]);

  // Handle Cash Transaction Delete
  const handleDeleteCashTransaction = async (id: string) => {
    if (confirm('Bu kasa hareket kaydını silmek istediğinize emin misiniz?')) {
      await db.cashTransactions.delete(id);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const rows: string[][] = [
      ['Rapor Türü', 'Kasa & Gün Sonu Ciro Raporu'],
      ['Tarih Aralığı', dateRangeLabel],
      ['Toplam Ciro', metrics.totalRevenue.toString()],
      ['Nakit Satışlar', metrics.cashRevenue.toString()],
      ['POS / Kredi Kartı', metrics.posRevenue.toString()],
      ['Kasaya Giren Ek Para', metrics.cashInTotal.toString()],
      ['Kasadan Çıkan Masraflar', metrics.cashOutTotal.toString()],
      ['Kasadaki Net Nakit', metrics.expectedDrawerCash.toString()],
      [],
      ['Kasa Hareketleri'],
      ['İşlem Türü', 'Kategori', 'Açıklama', 'İşlemi Yapan', 'Tarih', 'Tutar'],
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
    link.setAttribute("download", `kasa_ciro_raporu_${dateRange.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col space-y-6 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 select-none">
      
      {/* Top Header & Date Filter */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-600/20 text-orange-600 flex items-center justify-center">
              <Banknote size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                Kasa & Gün Sonu Ciro
              </h1>
              <p className="text-stone-500 text-xs sm:text-sm font-medium mt-0.5">
                Kasa giriş/çıkış hareketleri, net nakit hesabı, ciro ve Z-Raporu
              </p>
            </div>
          </div>
        </div>

        {/* Date Filter & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Date Selector */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-1 flex items-center shadow-xs">
            {(['TODAY', 'YESTERDAY', 'WEEK', 'MONTH'] as const).map(range => (
              <button
                key={range}
                type="button"
                onClick={() => setDateRange(range)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
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
          <button
            type="button"
            onClick={() => {
              setCashModalType('in');
              setIsCashModalOpen(true);
            }}
            className="py-2.5 px-3.5 bg-white text-stone-950 font-black text-xs rounded-2xl border border-stone-300 dark:border-stone-700 shadow-xs hover:bg-stone-100 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            title="Kasaya para girişi / bozukluk ekle"
          >
            <ArrowDownRight size={16} className="text-emerald-600" />
            <span>+ Para Girişi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCashModalType('out');
              setIsCashModalOpen(true);
            }}
            className="py-2.5 px-3.5 bg-white text-stone-950 font-black text-xs rounded-2xl border border-stone-300 dark:border-stone-700 shadow-xs hover:bg-stone-100 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            title="Kasadan masraf veya gider çıkışı yap"
          >
            <ArrowUpRight size={16} className="text-red-600" />
            <span>- Masraf / Çıkış</span>
          </button>

          <button
            type="button"
            onClick={() => setIsZReportOpen(true)}
            className="py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            title="Günü kapat ve termal Z-Raporu al"
          >
            <Receipt size={16} />
            <span>Z-Raporu Al & Kapat</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="p-2.5 bg-white text-stone-800 dark:bg-stone-900 dark:text-stone-200 border border-stone-200 dark:border-stone-800 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title="CSV Dışa Aktar"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* TOP 4 CORE FINANCIAL CARDS (ENHANCED WITH VISUAL BARS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* 1. TOPLAM CİRO */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                {dateRangeLabel} Toplam Ciro
              </span>
              <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 flex items-center justify-center">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-mono font-black text-stone-950 dark:text-white">
                {formatCurrency(metrics.totalRevenue)}
              </div>
              <div className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                <span>{metrics.closedOrdersCount} Kapalı Masa / Adisyon</span>
                <span>• Ort. {formatCurrency(metrics.avgCheck)}</span>
              </div>
            </div>
          </div>

          {/* Visual distribution mini-bar */}
          <div className="mt-3.5 pt-2.5 border-t border-stone-100 dark:border-stone-800/80">
            <div className="flex justify-between text-[10px] font-bold text-stone-500 dark:text-stone-400 mb-1">
              <span className="text-emerald-600 dark:text-emerald-400">Nakit: %{cashPercent}</span>
              <span className="text-blue-600 dark:text-blue-400">POS / Kart: %{posPercent}</span>
            </div>
            <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden flex">
              <div style={{ width: `${cashPercent}%` }} className="bg-emerald-500 h-full transition-all duration-500" title={`Nakit: %${cashPercent}`} />
              <div style={{ width: `${posPercent}%` }} className="bg-blue-500 h-full transition-all duration-500" title={`POS: %${posPercent}`} />
            </div>
          </div>
        </div>

        {/* 2. KASADAKİ NET NAKİT (DRAWER BALANCE) */}
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-3xl p-5 border border-emerald-200 dark:border-emerald-900/50 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                Kasadaki Net Nakit
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Banknote size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-900 dark:text-emerald-300">
                {formatCurrency(metrics.expectedDrawerCash)}
              </div>
              <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 truncate">
                Nakit: {formatCurrency(metrics.cashRevenue)} | Masraf: -{formatCurrency(metrics.cashOutTotal)}
              </div>
            </div>
          </div>

          {/* Visual Liquidity Ratio */}
          <div className="mt-3.5 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-900/60">
            <div className="flex justify-between text-[10px] font-bold text-emerald-800 dark:text-emerald-400 mb-1">
              <span>Nakit Kasa Dengesi</span>
              <span>{metrics.expectedDrawerCash >= 0 ? '✓ Pozitif Mutabakat' : '⚠️ Açık'}</span>
            </div>
            <div className="w-full h-1.5 bg-emerald-200/50 dark:bg-emerald-900/50 rounded-full overflow-hidden">
              <div 
                style={{ 
                  width: `${metrics.cashRevenue + metrics.cashInTotal > 0 
                    ? Math.min(100, Math.round((Math.max(0, metrics.expectedDrawerCash) / (metrics.cashRevenue + metrics.cashInTotal)) * 100)) 
                    : 100}%` 
                }} 
                className="bg-emerald-600 h-full transition-all duration-500" 
              />
            </div>
          </div>
        </div>

        {/* 3. POS / KREDİ KARTI */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                POS / Kredi Kartı
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                <CreditCard size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-mono font-black text-stone-950 dark:text-white">
                {formatCurrency(metrics.posRevenue)}
              </div>
              <div className="text-xs text-stone-500 mt-1">
                Banka hesabına geçen toplam tahsilat
              </div>
            </div>
          </div>

          {/* Visual POS share */}
          <div className="mt-3.5 pt-2.5 border-t border-stone-100 dark:border-stone-800/80">
            <div className="flex justify-between text-[10px] font-bold text-stone-500 dark:text-stone-400 mb-1">
              <span>Banka Payı</span>
              <span className="text-blue-600 dark:text-blue-400">%{posPercent} Ciro</span>
            </div>
            <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              <div style={{ width: `${posPercent}%` }} className="bg-blue-500 h-full transition-all duration-500" />
            </div>
          </div>
        </div>

        {/* 4. KASADAN ÇIKAN MASRAFLAR */}
        <div className="bg-red-50/50 dark:bg-red-950/20 rounded-3xl p-5 border border-red-200 dark:border-red-900/50 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-red-800 dark:text-red-400 uppercase tracking-wider">
                Masraflar & Çıkışlar
              </span>
              <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-600 flex items-center justify-center">
                <ArrowUpRight size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-mono font-black text-red-900 dark:text-red-300">
                {formatCurrency(metrics.cashOutTotal)}
              </div>
              <div className="text-xs text-red-700/80 dark:text-red-400/80 mt-1">
                {filteredCash.filter(t => t.type === 'out').length} kalem gider / masraf kaydı
              </div>
            </div>
          </div>

          {/* Visual Expense share */}
          <div className="mt-3.5 pt-2.5 border-t border-red-200/60 dark:border-red-900/60">
            <div className="flex justify-between text-[10px] font-bold text-red-800 dark:text-red-400 mb-1">
              <span>Gider Yükü</span>
              <span>%{expenseRatio} Gelir</span>
            </div>
            <div className="w-full h-1.5 bg-red-200/50 dark:bg-red-900/50 rounded-full overflow-hidden">
              <div style={{ width: `${Math.min(100, expenseRatio)}%` }} className="bg-red-500 h-full transition-all duration-500" />
            </div>
          </div>
        </div>

      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 overflow-x-auto gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('SUMMARY')}
          className={cn(
            "pb-3 px-3.5 text-xs sm:text-sm font-black transition-all border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer",
            activeTab === 'SUMMARY'
              ? "border-orange-600 text-orange-600 dark:text-orange-400"
              : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
          )}
        >
          <BarChart3 size={17} />
          <span>Grafikler & Görsel Kasa Tablosu</span>
          <span className="text-[10px] bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full font-bold">
            Canlı
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CASH_REGISTER')}
          className={cn(
            "pb-3 px-3 text-xs sm:text-sm font-black transition-all border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer",
            activeTab === 'CASH_REGISTER'
              ? "border-orange-600 text-orange-600 dark:text-orange-400"
              : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
          )}
        >
          <Banknote size={17} />
          <span>Kasa Defteri (Giren / Çıkan Para)</span>
          <span className="text-[10px] bg-stone-200 dark:bg-stone-800 px-2 py-0.5 rounded-full font-mono">
            {filteredCash.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ORDERS')}
          className={cn(
            "pb-3 px-3 text-xs sm:text-sm font-black transition-all border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer",
            activeTab === 'ORDERS'
              ? "border-orange-600 text-orange-600 dark:text-orange-400"
              : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
          )}
        >
          <Receipt size={17} />
          <span>Adisyon & Garson Sipariş Geçmişi</span>
          <span className="text-[10px] bg-stone-200 dark:bg-stone-800 px-2 py-0.5 rounded-full font-mono">
            {filteredOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('STAFF')}
          className={cn(
            "pb-3 px-3 text-xs sm:text-sm font-black transition-all border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer",
            activeTab === 'STAFF'
              ? "border-orange-600 text-orange-600 dark:text-orange-400"
              : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
          )}
        >
          <Users size={17} />
          <span>Garson Satış Dağılımı</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PAYMENTS')}
          className={cn(
            "pb-3 px-3 text-xs sm:text-sm font-black transition-all border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer",
            activeTab === 'PAYMENTS'
              ? "border-orange-600 text-orange-600 dark:text-orange-400"
              : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
          )}
        >
          <CreditCard size={17} />
          <span>Tahsilat & Ödeme Türleri</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PRODUCTS')}
          className={cn(
            "pb-3 px-3 text-xs sm:text-sm font-black transition-all border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer",
            activeTab === 'PRODUCTS'
              ? "border-orange-600 text-orange-600 dark:text-orange-400"
              : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
          )}
        >
          <PieChartIcon size={17} />
          <span>En Çok Satan Ürünler</span>
        </button>
      </div>

      {/* TAB CONTENT 0: GRAFİKLER & GÖRSEL KASA TABLOSU (INTERACTIVE VISUAL CHARTS) */}
      {activeTab === 'SUMMARY' && (
        <div className="space-y-6">
          
          {/* CHARTS ROW 1: CİRO TREND EĞRİSİ & TAHSİLAT DONUT GRAFİĞİ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Ciro Satış Eğrisi (AreaChart) - 8 Cols */}
            <div className="lg:col-span-8 bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Activity size={18} className="text-orange-600" />
                    <span>Ciro & Satış Eğrisi ({dateRangeLabel})</span>
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    {dateRange === 'TODAY' || dateRange === 'YESTERDAY' ? 'Saatlik ciro ve sipariş yoğunluğu eğrisi' : 'Günlük ciro ve tahsilat hacmi grafiği'}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                    <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                    Toplam Ciro: {formatCurrency(metrics.totalRevenue)}
                  </span>
                </div>
              </div>

              {/* Area Chart Container */}
              <div className="h-64 sm:h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="reportsColorCiro" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fill: '#78716c', fontSize: 11, fontWeight: 600 }} 
                      axisLine={{ stroke: '#88888830' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#78716c', fontSize: 11, fontWeight: 600 }} 
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₺${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: '#1c1917', 
                        borderRadius: '16px', 
                        border: '1px solid #44403c',
                        color: '#fff',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
                      }}
                      formatter={(val: any) => [`₺${Number(val).toLocaleString('tr-TR')}`, 'Ciro']}
                      labelFormatter={(label) => `Zaman: ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="ciro" 
                      name="Ciro"
                      stroke="#ea580c" 
                      strokeWidth={3} 
                      fill="url(#reportsColorCiro)" 
                      dot={{ r: 3, fill: '#ea580c', strokeWidth: 1 }}
                      activeDot={{ r: 6, fill: '#ea580c', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tahsilat Donut Pasta Grafiği - 4 Cols */}
            <div className="lg:col-span-4 bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
              <div>
                <h2 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-1">
                  <PieChartIcon size={18} className="text-orange-600" />
                  <span>Tahsilat Kanalları</span>
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Nakit, POS ve diğer yöntemlerin oranı
                </p>
              </div>

              {/* Donut Chart with Centered Total */}
              <div className="relative h-52 my-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentPieData}
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {paymentPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: '#1c1917', 
                        borderRadius: '12px', 
                        border: '1px solid #44403c',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                      formatter={(val: any) => [`₺${Number(val).toLocaleString('tr-TR')}`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text in donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Toplam</span>
                  <span className="text-sm font-mono font-black text-stone-900 dark:text-stone-100">
                    {formatCurrency(metrics.totalRevenue)}
                  </span>
                </div>
              </div>

              {/* Legend List with Badges */}
              <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-stone-800/80">
                {paymentPieData.map((item, idx) => {
                  const pct = metrics.totalRevenue > 0 ? Math.round((item.value / metrics.totalRevenue) * 100) : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-bold text-stone-700 dark:text-stone-300">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="font-bold text-stone-900 dark:text-stone-100">{formatCurrency(item.value)}</span>
                        <span className="text-[10px] text-stone-400">(%{pct})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* CHARTS ROW 2: KASA NAKİT AKIŞI ÇUBUK GRAFİĞİ (BAR CHART) */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Banknote size={18} className="text-emerald-600" />
                  <span>Kasa Nakit Akışı & Denge Analizi</span>
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Nakit satış, kasa girişi, masraflar ve çekmecede sayılacak net para karşılaştırması
                </p>
              </div>
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                Net Kasa: {formatCurrency(metrics.expectedDrawerCash)}
              </div>
            </div>

            <div className="h-56 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowBarData} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#78716c', fontSize: 11, fontWeight: 700 }}
                    axisLine={{ stroke: '#88888830' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#78716c', fontSize: 11, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₺${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: '#1c1917', 
                      borderRadius: '16px', 
                      border: '1px solid #44403c',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    formatter={(val: any) => [`₺${Number(val).toLocaleString('tr-TR')}`, 'Tutar']}
                  />
                  <Bar dataKey="tutar" name="Tutar" radius={[10, 10, 0, 0]}>
                    {cashFlowBarData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* VISUAL TABLE ROW 3: GÖRSEL KASA & GÜN SONU MUTABAKAT TABLOSU */}
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
            <div className="p-4 sm:p-6 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-stone-900 dark:text-stone-100">
                      Görsel Kasa & Gün Sonu Mutabakat Tablosu
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Z-Raporu öncesi açılış, satışlar, masraflar ve tüm kanalların görsel oransal dağılımı
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsZReportOpen(true)}
                  className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Receipt size={15} />
                  <span>Z-Raporu Çıkart</span>
                </button>
              </div>
            </div>

            {/* Visual Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-950 text-stone-600 dark:text-stone-400 font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Finansal Kalem & İşlem</th>
                    <th className="py-3.5 px-4">Hesap / Kanal</th>
                    <th className="py-3.5 px-4 text-center">İşlem Adedi</th>
                    <th className="py-3.5 px-4 min-w-[160px]">Ciro / Hacim Dağılımı</th>
                    <th className="py-3.5 px-4 text-right">Tutar</th>
                    <th className="py-3.5 px-4 text-center">Mutabakat Durumu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80 font-medium">
                  {visualReconciliationRows.map((row) => {
                    const Icon = row.icon;
                    return (
                      <tr 
                        key={row.id}
                        className={cn(
                          "transition-colors hover:bg-stone-50/80 dark:hover:bg-stone-800/40",
                          row.id === 'net_cash' && "bg-amber-50/30 dark:bg-amber-950/10 font-bold",
                          row.id === 'total_ciro' && "bg-orange-50/30 dark:bg-orange-950/10 font-bold"
                        )}
                      >
                        {/* Kalem & Icon */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border",
                              row.type === 'in' ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border-emerald-200 dark:border-emerald-800" :
                              row.type === 'out' ? "bg-red-50 dark:bg-red-950/50 text-red-600 border-red-200 dark:border-red-800" :
                              row.type === 'total' ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700" :
                              row.type === 'grand_total' ? "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700" :
                              "bg-blue-50 dark:bg-blue-950/50 text-blue-600 border-blue-200 dark:border-blue-800"
                            )}>
                              <Icon size={16} />
                            </div>
                            <div>
                              <span className="font-extrabold text-stone-900 dark:text-stone-100 block text-xs sm:text-sm">
                                {row.title}
                              </span>
                              <span className="text-[11px] text-stone-500 dark:text-stone-400 block line-clamp-1">
                                {row.description}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Kanal Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold inline-block", row.channelBadge)}>
                            {row.channel}
                          </span>
                        </td>

                        {/* İşlem Sayısı */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono font-bold text-stone-700 dark:text-stone-300">
                          {row.count}
                        </td>

                        {/* Görsel Oran Çubuğu (Visual Progress Bar) */}
                        <td className="py-3.5 px-4 min-w-[160px]">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono font-bold text-stone-500">
                              <span>Hacim Payı</span>
                              <span>%{row.percent}</span>
                            </div>
                            <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full rounded-full transition-all duration-500", row.barColor)}
                                style={{ width: `${Math.min(100, Math.max(3, row.percent))}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Tutar */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                          <span className={cn("font-black tracking-tight", row.amountColor)}>
                            {row.prefix} {formatCurrency(row.amount)}
                          </span>
                        </td>

                        {/* Mutabakat Durumu */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className={cn("px-2.5 py-1 rounded-xl text-[10px] font-extrabold border inline-block", row.statusBadge)}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Reconciliation Math Summary Footer */}
            <div className="p-4 sm:p-5 bg-stone-100/70 dark:bg-stone-950/80 border-t border-stone-200 dark:border-stone-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-extrabold text-stone-700 dark:text-stone-300">
                <span className="px-2.5 py-1 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 text-teal-700 dark:text-teal-400">
                  Açılış: +{formatCurrency(metrics.cashInTotal)}
                </span>
                <span>+</span>
                <span className="px-2.5 py-1 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 text-emerald-700 dark:text-emerald-400">
                  Nakit Satış: +{formatCurrency(metrics.cashRevenue)}
                </span>
                <span>-</span>
                <span className="px-2.5 py-1 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 text-red-700 dark:text-red-400">
                  Masraflar: -{formatCurrency(metrics.cashOutTotal)}
                </span>
                <span>=</span>
                <span className="px-3 py-1 bg-emerald-600 text-white rounded-xl shadow-xs font-black">
                  Kasadaki Net Nakit: {formatCurrency(metrics.expectedDrawerCash)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCashModalType('in');
                    setIsCashModalOpen(true);
                  }}
                  className="py-1.5 px-3 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold rounded-xl hover:bg-stone-100 cursor-pointer"
                >
                  + Kasa Girişi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCashModalType('out');
                    setIsCashModalOpen(true);
                  }}
                  className="py-1.5 px-3 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold rounded-xl hover:bg-stone-100 cursor-pointer"
                >
                  - Masraf Ekle
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB CONTENT: ADİSYON GEÇMİŞİ & GARSON SÜRELERİ */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800">
            <div>
              <h2 className="text-base font-black text-stone-900 dark:text-stone-100">
                {dateRangeLabel} Garson Sipariş & Adisyon Geçmişi
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Garsonun sipariş almaya başladığı saat, mutfağa iletim, hazırlık ve ödeme alma süreleri
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Search input */}
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-3 top-2.5 text-stone-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Masa veya garson ara..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Waiter Filter */}
              <select
                value={selectedWaiterFilter}
                onChange={(e) => setSelectedWaiterFilter(e.target.value)}
                className="py-2 px-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer focus:outline-none"
              >
                <option value="ALL">Tüm Garsonlar</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>
          </div>

          {displayedOrders.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-10 border border-stone-200 dark:border-stone-800 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center">
                <Receipt size={28} />
              </div>
              <h3 className="text-sm font-black text-stone-900 dark:text-stone-100">
                Seçilen aralıkta adisyon kaydı bulunamadı
              </h3>
              <p className="text-xs text-stone-500 max-w-sm">
                Masalardan sipariş alındıkça ve mutfağa iletildikçe tüm garson detayları burada listelenir.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-500 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Masa</th>
                      <th className="py-3.5 px-4">Siparişi Alan Garson</th>
                      <th className="py-3.5 px-4">Sipariş Başlangıcı</th>
                      <th className="py-3.5 px-4">Mutfağa İletilme</th>
                      <th className="py-3.5 px-4">Mutfak Hazırlık Süresi</th>
                      <th className="py-3.5 px-4">Ödeme Saati & Alan</th>
                      <th className="py-3.5 px-4">Masa Toplam Süresi</th>
                      <th className="py-3.5 px-4">Ödeme Türü</th>
                      <th className="py-3.5 px-4 text-right">Tutar</th>
                      <th className="py-3.5 px-4 text-center">Durum</th>
                      <th className="py-3.5 px-4 text-center">İncele</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-medium">
                    {displayedOrders.map(o => {
                      const payment = paymentsByOrderId.get(o.id);
                      const tickets = ticketsByOrderId.get(o.id) || [];
                      const isPaid = o.status === 'paid' || !!o.paidAt || !!payment;

                      const startStr = o.createdAt ? new Date(o.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-';
                      const sentStr = o.sentToKitchenAt ? new Date(o.sentToKitchenAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-';
                      
                      const paidTimeStr = o.paidAt || payment?.paidAt;
                      const paidByStr = o.paidBy || payment?.processedBy || 'Kasiyer';
                      const paidStr = paidTimeStr ? new Date(paidTimeStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : null;

                      // Masa toplam süresi (eğer ödendiyse ödeme anında dondurulur, uzamaya devam etmez!)
                      let totalMins = o.durationMinutes || payment?.durationMinutes;
                      if (!totalMins) {
                        if (paidTimeStr && o.createdAt) {
                          totalMins = Math.max(1, Math.round((new Date(paidTimeStr).getTime() - new Date(o.createdAt).getTime()) / 60000));
                        } else if (o.createdAt) {
                          totalMins = Math.max(1, Math.round((Date.now() - new Date(o.createdAt).getTime()) / 60000));
                        } else {
                          totalMins = 1;
                        }
                      }

                      // Mutfak hazırlık süresi (ödenen veya fişi tamamlanan siparişte asla "Hazırlanıyor..." kalmaz)
                      let kitchenMins = o.kitchenDurationMinutes;
                      const isTicketCompleted = tickets.length > 0 && tickets.every(t => t.status === 'completed' || t.status === 'ready');
                      if (!kitchenMins) {
                        if (o.kitchenReadyAt && o.sentToKitchenAt) {
                          kitchenMins = Math.max(1, Math.round((new Date(o.kitchenReadyAt).getTime() - new Date(o.sentToKitchenAt).getTime()) / 60000));
                        } else if (tickets.length > 0) {
                          const latestTicket = tickets[0];
                          if (latestTicket.completedAt && latestTicket.createdAt) {
                            kitchenMins = Math.max(1, Math.round((new Date(latestTicket.completedAt).getTime() - new Date(latestTicket.createdAt).getTime()) / 60000));
                          }
                        }
                      }
                      if (!kitchenMins && (isTicketCompleted || isPaid)) {
                        kitchenMins = 1;
                      }

                      // Ödeme türü
                      const methodNames: Record<string, string> = {
                        cash: 'Nakit TL',
                        credit_card: 'Kredi Kartı',
                        debit_card: 'Banka Kartı',
                        sodexo: 'Sodexo',
                        multinet: 'Multinet',
                        ticket: 'Ticket Edenred',
                        metropol: 'Metropol Card',
                        ikram: 'Yetkili İkram'
                      };
                      let paymentMethodDisplay = o.paymentMethod;
                      if (!paymentMethodDisplay && payment) {
                        paymentMethodDisplay = payment.parts?.map(p => methodNames[p.method] || p.method).join(' + ') || 'Nakit TL';
                      }
                      if (!paymentMethodDisplay && isPaid) {
                        paymentMethodDisplay = 'Nakit TL';
                      }

                      // Modal için zenginleştirilmiş sipariş verisi
                      const enrichedOrder: Order = {
                        ...o,
                        status: isPaid ? 'paid' : o.status,
                        paidAt: paidTimeStr,
                        paidBy: paidByStr,
                        paymentMethod: paymentMethodDisplay,
                        durationMinutes: totalMins,
                        kitchenDurationMinutes: kitchenMins || undefined,
                      };

                      return (
                        <tr 
                          key={o.id} 
                          onClick={() => setSelectedTimelineOrder(enrichedOrder)}
                          className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 font-black text-stone-900 dark:text-stone-100 whitespace-nowrap">
                            <span className="bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-lg border border-orange-200 dark:border-orange-800">
                              Masa {o.tableLabel}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-stone-900 dark:text-stone-100 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Users size={13} className="text-orange-600" />
                              <span>{o.waiterName || 'Garson'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            {startStr}
                          </td>
                          <td className="py-3 px-4 font-mono text-stone-600 dark:text-stone-400 whitespace-nowrap">
                            {sentStr !== '-' ? (
                              <span className="flex items-center gap-1">
                                <ChefHat size={12} className="text-amber-500" />
                                {sentStr}
                              </span>
                            ) : (
                              <span className="text-stone-400 italic">İletilmedi</span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {kitchenMins ? (
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                ✓ {kitchenMins} dk
                              </span>
                            ) : isTicketCompleted || isPaid ? (
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                ✓ Tamamlandı
                              </span>
                            ) : o.sentToKitchenAt ? (
                              <span className="text-amber-600 font-bold animate-pulse">
                                Hazırlanıyor...
                              </span>
                            ) : (
                              <span className="text-stone-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {isPaid && paidStr ? (
                              <div>
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                                  {paidStr}
                                </span>
                                <span className="text-[10px] text-stone-400">
                                  {paidByStr}
                                </span>
                              </div>
                            ) : (
                              <span className="text-red-500 font-bold">Ödeme Bekliyor</span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-stone-700 dark:text-stone-300">
                            <span className="flex items-center gap-1">
                              <Timer size={13} className="text-purple-500" />
                              {totalMins} dk
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-stone-600 dark:text-stone-400 font-medium">
                            {paymentMethodDisplay || '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-sm text-stone-950 dark:text-white whitespace-nowrap">
                            {formatCurrency(o.total)}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : o.status === 'ready'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                                : o.status === 'sent'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300 dark:border-orange-800'
                            }`}>
                              {isPaid ? 'Ödendi' : o.status === 'ready' ? 'Hazır' : o.status === 'sent' ? 'Mutfakta' : 'Açık'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTimelineOrder(enrichedOrder);
                              }}
                              className="py-1 px-2.5 bg-white text-stone-950 font-bold text-[11px] rounded-lg border border-stone-300 hover:bg-stone-100 active:scale-95 transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye size={12} />
                              <span>Zaman Çizelgesi</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 1: KASA DEFTERİ (GİREN & ÇIKAN PARA) */}
      {activeTab === 'CASH_REGISTER' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800">
            <div>
              <h2 className="text-base font-black text-stone-900 dark:text-stone-100">
                {dateRangeLabel} Kasa Giriş & Çıkış Hareketleri
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Kasaya eklenen açılış parası, bozukluklar, tedarikçi ve market masrafları
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setCashModalType('in');
                  setIsCashModalOpen(true);
                }}
                className="flex-1 sm:flex-none py-2 px-3 bg-white text-stone-950 font-black text-xs rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
              >
                <Plus size={15} className="text-emerald-600" />
                <span>Para Girişi</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCashModalType('out');
                  setIsCashModalOpen(true);
                }}
                className="flex-1 sm:flex-none py-2 px-3 bg-white text-stone-950 font-black text-xs rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
              >
                <Plus size={15} className="text-red-600" />
                <span>Masraf / Gider Ekle</span>
              </button>
            </div>
          </div>

          {filteredCash.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 rounded-3xl p-10 border border-stone-200 dark:border-stone-800 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center">
                <Banknote size={28} />
              </div>
              <div>
                <h3 className="text-sm font-black text-stone-900 dark:text-stone-100">
                  Henüz kasa hareketi bulunmuyor
                </h3>
                <p className="text-xs text-stone-500 mt-1 max-w-sm">
                  Kasaya sabah açılış parası eklemek veya market/tedarikçi masrafı kaydetmek için yukarıdaki butonları kullanabilirsiniz.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCashModalType('in');
                    setIsCashModalOpen(true);
                  }}
                  className="py-2.5 px-4 bg-white text-stone-950 font-black text-xs rounded-xl border border-stone-300 shadow-xs hover:bg-stone-100 transition-all cursor-pointer"
                >
                  + Kasa Açılış Parası Ekle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCashModalType('out');
                    setIsCashModalOpen(true);
                  }}
                  className="py-2.5 px-4 bg-white text-stone-950 font-black text-xs rounded-xl border border-stone-300 shadow-xs hover:bg-stone-100 transition-all cursor-pointer"
                >
                  - Masraf / Gider Kaydet
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-500 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Tür</th>
                      <th className="py-3.5 px-4">Kategori</th>
                      <th className="py-3.5 px-4">Açıklama</th>
                      <th className="py-3.5 px-4">İşlemi Yapan</th>
                      <th className="py-3.5 px-4">Tarih & Saat</th>
                      <th className="py-3.5 px-4 text-right">Tutar</th>
                      <th className="py-3.5 px-4 text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-medium">
                    {filteredCash.slice().reverse().map(t => (
                      <tr key={t.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                            t.type === 'in' 
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' 
                              : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800'
                          }`}>
                            {t.type === 'in' ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                            <span>{t.type === 'in' ? 'KASAYA GİRİŞ' : 'MASRAF / ÇIKIŞ'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-stone-900 dark:text-stone-100">
                          {t.category}
                        </td>
                        <td className="py-3 px-4 text-stone-600 dark:text-stone-300">
                          {t.description}
                        </td>
                        <td className="py-3 px-4 text-stone-500">
                          {t.processedBy}
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-500">
                          {new Date(t.createdAt).toLocaleTimeString('tr-TR')} - {new Date(t.createdAt).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-sm">
                          <span className={t.type === 'in' ? 'text-emerald-600' : 'text-red-600'}>
                            {t.type === 'in' ? '+' : '-'}{formatCurrency(t.amount)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteCashTransaction(t.id)}
                            className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                            title="Kaydı Sil"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: GARSON SATIŞ DAĞILIMI */}
      {activeTab === 'STAFF' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800">
            <h2 className="text-base font-black text-stone-900 dark:text-stone-100">
              Garson Satış Dağılımı ({dateRangeLabel})
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Hangi garson ne kadar ciro yaptı, kaç adisyon açtı ve ortalama masa tutarı
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Personel / Garson</th>
                  <th className="py-3.5 px-4">Görevi</th>
                  <th className="py-3.5 px-4 text-center">Masa / Sipariş Sayısı</th>
                  <th className="py-3.5 px-4 text-right">Ortalama Masa Tutarı</th>
                  <th className="py-3.5 px-4 text-right">Toplam Ciro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-medium">
                {staffBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400">
                      Bu tarih aralığında henüz satış bulunmuyor
                    </td>
                  </tr>
                ) : (
                  staffBreakdown.map((s, idx) => (
                    <tr key={idx} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-stone-950 dark:text-stone-100">
                        {s.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-[10px]">
                          {s.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-stone-800 dark:text-stone-200">
                        {s.orderCount} Adet
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-600 dark:text-stone-300">
                        {formatCurrency(s.avgCheck)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-stone-950 dark:text-white">
                        {formatCurrency(s.totalRevenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: ÖDEME & TAHSİLAT DAĞILIMI */}
      {activeTab === 'PAYMENTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs">
            <h2 className="text-base font-black text-stone-900 dark:text-stone-100 mb-1">
              Ödeme Kanalları Dökümü
            </h2>
            <p className="text-xs text-stone-500 mb-4">
              Tahsilatların ödeme tiplerine göre oransal ve tutarsal dağılımı
            </p>

            <div className="space-y-3">
              {paymentBreakdown.length === 0 ? (
                <div className="py-8 text-center text-stone-400 text-xs">
                  Bu dönemde henüz tahsilat kaydı yok
                </div>
              ) : (
                paymentBreakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1.5 p-3 rounded-2xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200/60 dark:border-stone-800">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-stone-900 dark:text-stone-100">{item.method}</span>
                      <div className="text-right">
                        <span className="font-mono font-black text-stone-950 dark:text-white">
                          {formatCurrency(item.total)}
                        </span>
                        <span className="text-[11px] text-stone-400 ml-1.5">({item.percent}%)</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-2 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-600 rounded-full transition-all duration-300"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-base font-black text-stone-900 dark:text-stone-100 mb-1">
                Kasa & Banka Özeti
              </h2>
              <p className="text-xs text-stone-500 mb-4">
                Nakit ve dijital tahsilatların karşılaştırması
              </p>

              <div className="space-y-2.5">
                <div className="flex justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200/60 dark:border-stone-800 text-xs">
                  <span className="text-stone-600 dark:text-stone-400">Nakit Satışlar Toplamı:</span>
                  <span className="font-mono font-bold text-stone-950 dark:text-white">{formatCurrency(metrics.cashRevenue)}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200/60 dark:border-stone-800 text-xs">
                  <span className="text-stone-600 dark:text-stone-400">POS / Kredi Kartı Satışları:</span>
                  <span className="font-mono font-bold text-stone-950 dark:text-white">{formatCurrency(metrics.posRevenue)}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200/60 dark:border-stone-800 text-xs">
                  <span className="text-stone-600 dark:text-stone-400">Yemek Kartları (Sodexo, Multinet vb.):</span>
                  <span className="font-mono font-bold text-stone-950 dark:text-white">{formatCurrency(metrics.mealCardRevenue)}</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-black">
                  <span className="text-emerald-800 dark:text-emerald-300">KASADAKİ FİZİKSEL NET NAKİT:</span>
                  <span className="font-mono text-emerald-900 dark:text-emerald-200 text-sm">{formatCurrency(metrics.expectedDrawerCash)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsZReportOpen(true)}
              className="w-full mt-4 py-3 bg-white text-stone-950 font-black text-xs rounded-2xl border border-stone-300 shadow-md hover:bg-stone-100 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <FileText size={16} />
              <span>GÜN SONU Z-RAPORU ÇIKART</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: EN ÇOK SATAN ÜRÜNLER */}
      {activeTab === 'PRODUCTS' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800">
            <h2 className="text-base font-black text-stone-900 dark:text-stone-100">
              En Çok Satan Ürünler ({dateRangeLabel})
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Satış adedi ve sağladığı ciroya göre ürün sıralaması
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Ürün Adı</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4 text-center">Satış Adedi</th>
                  <th className="py-3.5 px-4 text-right">Toplam Ciro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-medium">
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400">
                      Bu dönemde henüz ürün satışı kaydedilmedi
                    </td>
                  </tr>
                ) : (
                  topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-stone-950 dark:text-stone-100">
                        {p.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium text-[11px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-stone-800 dark:text-stone-200">
                        {p.count} Adet
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-stone-950 dark:text-white">
                        {formatCurrency(p.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cash Transaction Modal */}
      <CashTransactionModal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        defaultType={cashModalType}
      />

      {/* Thermal Z-Report Modal */}
      <ThermalSlipModal
        isOpen={isZReportOpen}
        onClose={() => setIsZReportOpen(false)}
        type="z-report"
        zReportData={zReportPayload}
      />

      {/* Order Detailed Timeline Modal */}
      <OrderTimelineModal
        order={selectedTimelineOrder}
        isOpen={!!selectedTimelineOrder}
        onClose={() => setSelectedTimelineOrder(null)}
      />

    </div>
  );
}
