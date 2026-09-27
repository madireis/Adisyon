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
  AlertCircle
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useApp } from '@/lib/store';
import CashTransactionModal from '@/components/pos/CashTransactionModal';
import ThermalSlipModal, { type ZReportData } from '@/components/pos/ThermalSlipModal';
import type { Staff, MenuItem, Order, Payment, CashTransaction } from '@/types/pos';

export default function ReportsPage() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<'CASH_REGISTER' | 'STAFF' | 'PAYMENTS' | 'PRODUCTS'>('CASH_REGISTER');
  const [dateRange, setDateRange] = useState<'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH'>('TODAY');

  // Modal States
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashModalType, setCashModalType] = useState<'in' | 'out'>('out');
  const [isZReportOpen, setIsZReportOpen] = useState(false);

  // Live queries
  const orders = useLiveQuery(() => db.orders.toArray()) || [];
  const payments = useLiveQuery(() => db.payments.toArray()) || [];
  const cashTransactions = useLiveQuery(() => db.cashTransactions.toArray()) || [];
  const staff = useLiveQuery(() => db.staff.toArray()) || [];
  const menuItems = useLiveQuery(() => db.menuItems.toArray()) || [];
  const categories = useLiveQuery(() => db.categories.toArray()) || [];

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

    const closedOrdersCount = filteredOrders.filter(o => o.status === 'paid').length;
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
  }, [filteredPayments, filteredCash, filteredOrders]);

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

      {/* TOP 4 CORE FINANCIAL CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* 1. TOPLAM CİRO */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
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

        {/* 2. KASADAKİ NET NAKİT (DRAWER BALANCE) */}
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-3xl p-5 border border-emerald-200 dark:border-emerald-900/50 shadow-xs flex flex-col justify-between">
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

        {/* 3. POS / KREDİ KARTI */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
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

        {/* 4. KASADAN ÇIKAN MASRAFLAR */}
        <div className="bg-red-50/50 dark:bg-red-950/20 rounded-3xl p-5 border border-red-200 dark:border-red-900/50 shadow-xs flex flex-col justify-between">
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

      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 overflow-x-auto gap-2">
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

    </div>
  );
}
