import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { TrendingUp, Users, ShoppingBag, Receipt, LayoutGrid, XCircle, Utensils, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { formatCurrency, getTimeString } from '@/lib/utils';
import type { Order, Table, AuditLog, Payment } from '@/types/pos';
import wotsLogo from '@/assets/logo.jpg';

export default function DashboardPage() {
  const orders = useLiveQuery(() => db.orders.toArray()) || [];
  const tables = useLiveQuery(() => db.table<Table>('tables').toArray()) || [];
  const payments = useLiveQuery(() => db.payments.toArray()) || [];
  const categories = useLiveQuery(() => db.categories.toArray()) || [];
  const menuItems = useLiveQuery(() => db.menuItems.toArray()) || [];
  const auditLogs = useLiveQuery(() => db.auditLogs.orderBy('timestamp').reverse().limit(10).toArray()) || [];
  
  // Date boundaries for "Today"
  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayPayments = useMemo(() => {
    return payments.filter(p => new Date(p.paidAt) >= startOfToday);
  }, [payments, startOfToday]);

  const todayOrders = useMemo(() => {
    return orders.filter(o => new Date(o.createdAt) >= startOfToday);
  }, [orders, startOfToday]);

  // Live Stats calculations
  const todayRevenue = useMemo(() => {
    return todayPayments.reduce((sum: number, p: Payment) => sum + (p.total || 0), 0);
  }, [todayPayments]);
  
  const totalOrdersCount = todayOrders.length;
  const avgOrderValue = totalOrdersCount > 0 ? todayRevenue / totalOrdersCount : 0;
  const guestCount = tables.reduce((sum: number, t: Table) => sum + (t.guestCount || 0), 0);
  const openTables = tables.filter((t: Table) => t.status === 'occupied' || t.status === 'payment_waiting').length;
  const cancelledOrders = todayOrders.filter((o: Order) => o.status === 'cancelled').length;

  // Dynamic Hourly Sales Curve
  const hourlyData = useMemo(() => {
    const hours = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00', '23:00'];
    const buckets: Record<string, number> = {};
    hours.forEach(h => { buckets[h] = 0; });

    todayPayments.forEach(p => {
      const d = new Date(p.paidAt);
      const hour = d.getHours();
      // Match to nearest 2-hour bucket
      const bucketHour = Math.floor(hour / 2) * 2 + 1;
      const key = `${bucketHour < 10 ? '0' + bucketHour : bucketHour}:00`;
      if (buckets[key] !== undefined) {
        buckets[key] += p.total || 0;
      } else {
        // Default bucket
        buckets['13:00'] += p.total || 0;
      }
    });

    return hours.map(time => ({
      time,
      total: Math.round(buckets[time] || 0)
    }));
  }, [todayPayments]);

  // Dynamic Category Sales Breakdown
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach(c => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const itemToCategoryMap = useMemo(() => {
    const map = new Map<string, string>();
    menuItems.forEach(m => {
      const catName = categoryMap.get(m.categoryId) || 'Diğer';
      map.set(m.id, catName);
    });
    return map;
  }, [menuItems, categoryMap]);

  const pieData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};

    todayOrders.forEach(order => {
      order.items?.forEach(item => {
        const catName = itemToCategoryMap.get(item.menuItemId) || 'Diğer';
        categoryTotals[catName] = (categoryTotals[catName] || 0) + (item.unitPrice * item.quantity);
      });
    });

    const result = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value: Math.round(value)
    }));

    return result.sort((a, b) => b.value - a.value);
  }, [todayOrders, itemToCategoryMap]);

  const COLORS = ['#ea580c', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

  // Dynamic Payment Method Breakdown
  const paymentData = useMemo(() => {
    let cash = 0;
    let card = 0;
    let mealCard = 0;

    todayPayments.forEach(p => {
      p.parts?.forEach(part => {
        if (part.method === 'cash') cash += part.amount;
        else if (part.method === 'credit_card' || part.method === 'debit_card') card += part.amount;
        else if (['sodexo', 'multinet', 'ticket', 'metropol'].includes(part.method)) mealCard += part.amount;
        else card += part.amount;
      });
    });

    return [
      { name: 'Nakit', value: Math.round(cash) },
      { name: 'POS Kredi Kartı', value: Math.round(card) },
      { name: 'Yemek Kartı', value: Math.round(mealCard) },
    ];
  }, [todayPayments]);

  const StatCard = ({ title, value, icon, trend }: { title: string; value: string; icon: React.ReactNode; trend?: string }) => (
    <div className="bg-white dark:bg-stone-900 p-3.5 sm:p-5 rounded-2xl shadow-xs border border-stone-200 dark:border-stone-800">
      <div className="flex justify-between items-start mb-3">
        <div className="p-2.5 bg-stone-50 dark:bg-stone-800 rounded-xl text-orange-600 dark:text-orange-400 border border-stone-100 dark:border-stone-700/60 shadow-2xs">
          {icon}
        </div>
        {trend && (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-transparent dark:border-emerald-800/60 px-2 py-0.5 rounded-md">
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-stone-400 dark:text-stone-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
      <p className="text-lg sm:text-2xl font-black text-stone-900 dark:text-stone-100">{value}</p>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 dark:bg-stone-950 dark:text-stone-100">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-black p-1 shadow-md border border-orange-500/30 flex items-center justify-center shrink-0">
            <img src={wotsLogo} alt="WOT'S CAFE" className="w-full h-full object-contain rounded-xl" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-800 dark:text-stone-100 tracking-tight">WOT'S CAFE — Yönetim Özeti</h1>
            <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm mt-0.5">Canlı Finans & Operasyon Tablosu</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-transparent dark:border-emerald-800/60 rounded-full text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Canlı Restoran Verisi
          </span>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Bugünün Cirosu" value={formatCurrency(todayRevenue)} icon={<Receipt size={20} />} />
        <StatCard title="Açık Masalar" value={`${openTables} / ${tables.length}`} icon={<LayoutGrid size={20} />} />
        <StatCard title="Ortalama Adisyon" value={formatCurrency(Math.round(avgOrderValue))} icon={<TrendingUp size={20} />} />
        <StatCard title="Toplam Sipariş" value={`${totalOrdersCount}`} icon={<ShoppingBag size={20} />} />
        <StatCard title="Misafir Sayısı" value={`${guestCount}`} icon={<Users size={20} />} />
        <StatCard title="İptal / Zayi" value={`${cancelledOrders}`} icon={<XCircle size={20} />} />
      </div>

      {/* Hourly Sales Chart */}
      <div className="bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">Saatlik Ciro Eğrisi</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">Bugünkü saatlik satış ve tahsilat performansı</p>
          </div>
          <span className="text-xs font-bold text-stone-500 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 border border-transparent dark:border-stone-700 px-3 py-1 rounded-lg">Bugün</span>
        </div>
        <div className="h-48 sm:h-64 lg:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#71717a" strokeOpacity={0.2} />
              <XAxis dataKey="time" stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} tickFormatter={val => `₺${val}`} />
              <RechartsTooltip formatter={(val: any) => [`₺${val}`, 'Ciro']} />
              <Area type="monotone" dataKey="total" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3 Bottom Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories Pie */}
        <div className="bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800">
          <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-4">Kategori Bazlı Satışlar</h3>
          <div className="h-64 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(val: any) => [`₺${val}`, 'Tutar']} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-stone-400">
                <AlertCircle className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-600 mb-1" />
                <p className="text-xs">Bugün henüz sipariş satışı oluşmadı.</p>
              </div>
            )}
          </div>
        </div>

        {/* Payments Bar */}
        <div className="bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800">
          <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-4">Ödeme Yöntemi Dağılımı</h3>
          <div className="h-64 w-full flex items-center justify-center">
            {todayRevenue > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#71717a" strokeOpacity={0.2} />
                  <XAxis dataKey="name" stroke="#a8a29e" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a8a29e" fontSize={11} tickLine={false} axisLine={false} tickFormatter={val => `₺${val}`} />
                  <RechartsTooltip formatter={(val: any) => [`₺${val}`, 'Tahsilat']} />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-stone-400">
                <AlertCircle className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-600 mb-1" />
                <p className="text-xs">Bugün henüz tahsilat gerçekleşmedi.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 flex flex-col">
          <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-4">Canlı İşlem Günlüğü (Audit)</h3>
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-64">
            {auditLogs.length > 0 ? (
              auditLogs.map((log: AuditLog) => (
                <div key={log.id} className="flex gap-3 items-start pb-3 border-b border-stone-100 dark:border-stone-800/60 last:border-0">
                  <div className="bg-orange-50 dark:bg-stone-800 p-2 rounded-xl text-orange-600 dark:text-orange-400 border border-stone-100 dark:border-stone-700/60 mt-0.5 shrink-0 shadow-2xs">
                    <Utensils size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-800 dark:text-stone-100 truncate">{log.action}</p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      {log.userName} • {getTimeString(new Date(log.timestamp))}
                    </p>
                    <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-0.5 line-clamp-1">{log.details}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-stone-500 dark:text-stone-400 text-xs italic py-8 text-center">Henüz aktivite kaydı yok.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
