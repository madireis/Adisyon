import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Calendar, Download, PieChart as PieChartIcon, TrendingUp, Users, CreditCard, Award, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn, formatCurrency } from '@/lib/utils';
import type { Staff, MenuItem, Order, Payment } from '@/types/pos';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'SALES' | 'PRODUCTS' | 'STAFF' | 'PAYMENTS'>('SALES');
  const [dateRange, setDateRange] = useState<'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH'>('TODAY');

  const orders = useLiveQuery(() => db.orders.toArray()) || [];
  const payments = useLiveQuery(() => db.payments.toArray()) || [];
  const staff = useLiveQuery(() => db.staff.toArray()) || [];
  const menuItems = useLiveQuery(() => db.menuItems.toArray()) || [];
  const categories = useLiveQuery(() => db.categories.toArray()) || [];

  const tabs = [
    { id: 'SALES' as const, label: 'Satışlar & Ciro', icon: <TrendingUp size={18} /> },
    { id: 'PRODUCTS' as const, label: 'En Çok Satan Ürünler', icon: <PieChartIcon size={18} /> },
    { id: 'STAFF' as const, label: 'Garson Performansı', icon: <Users size={18} /> },
    { id: 'PAYMENTS' as const, label: 'Ödeme Dağılımı', icon: <CreditCard size={18} /> },
  ];

  // Date Filtering logic
  const { filteredOrders, filteredPayments, dateRangeLabel } = useMemo(() => {
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

    const label = dateRange === 'TODAY' ? 'Bugün' : dateRange === 'YESTERDAY' ? 'Dün' : dateRange === 'WEEK' ? 'Son 7 Gün' : 'Son 30 Gün';

    return { filteredOrders: fOrders, filteredPayments: fPayments, dateRangeLabel: label };
  }, [orders, payments, dateRange]);

  // Total Metrics
  const totalRevenue = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + (p.total || 0), 0);
  }, [filteredPayments]);

  const closedOrdersCount = useMemo(() => {
    return filteredOrders.filter(o => o.status === 'paid').length;
  }, [filteredOrders]);

  const avgCheck = closedOrdersCount > 0 ? totalRevenue / closedOrdersCount : 0;

  // Dynamic Sales Trend Chart
  const salesTrend = useMemo(() => {
    if (dateRange === 'TODAY' || dateRange === 'YESTERDAY') {
      const hours = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00', '23:00'];
      const buckets: Record<string, number> = {};
      hours.forEach(h => { buckets[h] = 0; });

      filteredPayments.forEach(p => {
        const d = new Date(p.paidAt);
        const hour = d.getHours();
        const bucketHour = Math.floor(hour / 2) * 2 + 1;
        const key = `${bucketHour < 10 ? '0' + bucketHour : bucketHour}:00`;
        if (buckets[key] !== undefined) buckets[key] += p.total;
        else buckets['13:00'] += p.total;
      });

      return hours.map(name => ({ name, total: Math.round(buckets[name] || 0) }));
    }

    // Weekly / Monthly Trend
    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const days: { name: string; total: number; dateStr: string }[] = [];
    const numDays = dateRange === 'WEEK' ? 7 : 14;

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const name = `${dayNames[d.getDay()]} ${d.getDate()}`;
      days.push({ name, total: 0, dateStr });
    }

    filteredPayments.forEach(p => {
      const pDate = p.paidAt ? p.paidAt.split('T')[0] : '';
      const match = days.find(d => d.dateStr === pDate);
      if (match) match.total += p.total;
    });

    return days;
  }, [filteredPayments, dateRange]);

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

  // Dynamic Staff Performance
  const staffPerformance = useMemo(() => {
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
      agg[waiterName].totalRevenue += o.total || 0;
    });

    return Object.values(agg).map(item => ({
      ...item,
      avgCheck: item.orderCount > 0 ? Math.round(item.totalRevenue / item.orderCount) : 0
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredOrders, staff]);

  // Dynamic Payment Breakdown
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

  // Export to CSV
  const handleExportCSV = () => {
    let rows: string[][] = [];
    let filename = `wots_rapor_${activeTab.toLowerCase()}_${dateRange.toLowerCase()}.csv`;

    if (activeTab === 'SALES') {
      rows.push(['Zaman', 'Ciro']);
      salesTrend.forEach(s => rows.push([s.name, s.total.toString()]));
    } else if (activeTab === 'PRODUCTS') {
      rows.push(['Urun Adi', 'Kategori', 'Satis Adedi', 'Toplam Ciro']);
      topProducts.forEach(p => rows.push([p.name, p.category, p.count.toString(), p.revenue.toString()]));
    } else if (activeTab === 'STAFF') {
      rows.push(['Personel', 'Gorevi', 'Siparis Sayisi', 'Ortalama Hesap', 'Toplam Ciro']);
      staffPerformance.forEach(s => rows.push([s.name, s.role, s.orderCount.toString(), s.avgCheck.toString(), s.totalRevenue.toString()]));
    } else if (activeTab === 'PAYMENTS') {
      rows.push(['Odeme Metodu', 'Islem Sayisi', 'Yuzde', 'Toplam Tutar']);
      paymentBreakdown.forEach(p => rows.push([p.method, p.count.toString(), `%${p.percent}`, p.total.toString()]));
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6 dark:bg-stone-950 dark:text-stone-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-800 tracking-tight">Finans & Operasyon Raporları</h1>
          <p className="text-stone-500 text-sm mt-1">Canlı ciro, ürün satış adetleri, garson performansı ve tahsilat dökümü</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-1 flex items-center shadow-xs overflow-x-auto">
            {(['TODAY', 'YESTERDAY', 'WEEK', 'MONTH'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                  dateRange === range ? "bg-stone-900 text-white shadow-xs" : "text-stone-500 hover:text-stone-800"
                )}
              >
                {range === 'TODAY' ? 'Bugün' : range === 'YESTERDAY' ? 'Dün' : range === 'WEEK' ? 'Bu Hafta' : 'Bu Ay'}
              </button>
            ))}
          </div>
          <button 
            onClick={handleExportCSV}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Download size={15} />
            CSV / Excel İndir
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 flex-1 flex flex-col overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-stone-200 px-4 sm:px-6 pt-3 gap-4 sm:gap-6 bg-stone-50 whitespace-nowrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-3 font-bold text-xs flex items-center gap-2 border-b-2 transition-colors cursor-pointer",
                activeTab === tab.id 
                  ? "border-orange-600 text-orange-600" 
                  : "border-transparent text-stone-500 hover:text-stone-800"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Tabs */}
        <div className="p-6 flex-1 overflow-auto">
          {activeTab === 'SALES' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Dönem Cirosu ({dateRangeLabel})</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-900">{formatCurrency(totalRevenue)}</p>
                  <span className="text-xs text-stone-500 font-medium mt-1 inline-block">Toplam tahsilat</span>
                </div>
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Kapanan Adisyon</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-900">{closedOrdersCount}</p>
                  <span className="text-xs text-stone-500 font-medium mt-1 inline-block">Ödenen masa sayısı</span>
                </div>
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Ortalama Masa Hesabı</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-900">{formatCurrency(Math.round(avgCheck))}</p>
                  <span className="text-xs text-stone-500 font-medium mt-1 inline-block">Adisyon başına ortalama</span>
                </div>
              </div>

              <div className="bg-stone-50 p-4 sm:p-6 rounded-2xl border border-stone-200">
                <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wider mb-4">Ciro Dağılım Grafiği ({dateRangeLabel})</h3>
                <div className="h-48 sm:h-64 lg:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                      <XAxis dataKey="name" stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} tickFormatter={val => `₺${val}`} />
                      <Tooltip cursor={{fill: '#e7e5e4/40'}} formatter={(value: any) => [`₺${value}`, 'Ciro']} />
                      <Bar dataKey="total" fill="#ea580c" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'PRODUCTS' && (
            <div className="space-y-4 overflow-x-auto">
              {topProducts.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-stone-50 text-xs uppercase tracking-wider font-bold text-stone-500 border-b border-stone-200">
                    <tr>
                      <th className="py-3 px-4">Sıra</th>
                      <th className="py-3 px-4">Ürün Adı</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4 text-center">Satış Adedi</th>
                      <th className="py-3 px-4 text-right">Toplam Ciro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-sm">
                    {topProducts.map((prod, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-stone-400">
                          {idx === 0 ? <Award className="w-5 h-5 text-amber-500 inline" /> : `#${idx + 1}`}
                        </td>
                        <td className="py-3 px-4 font-bold text-stone-800">{prod.name}</td>
                        <td className="py-3 px-4 text-stone-500">{prod.category}</td>
                        <td className="py-3 px-4 text-center font-bold font-mono text-orange-600">{prod.count} adet</td>
                        <td className="py-3 px-4 text-right font-black text-stone-900">{formatCurrency(prod.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-16 text-center text-stone-400">
                  <AlertCircle className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                  <p className="font-semibold text-sm">Seçili dönemde ürün satışı bulunamadı.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'STAFF' && (
            <div className="space-y-4 overflow-x-auto">
              {staffPerformance.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-stone-50 text-xs uppercase tracking-wider font-bold text-stone-500 border-b border-stone-200">
                    <tr>
                      <th className="py-3 px-4">Personel</th>
                      <th className="py-3 px-4">Görevi</th>
                      <th className="py-3 px-4 text-center">Açılan Masa Sayısı</th>
                      <th className="py-3 px-4 text-center">Ortalama Hesap</th>
                      <th className="py-3 px-4 text-right">Toplam Ciro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-sm">
                    {staffPerformance.map((st, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-stone-800">{st.name}</td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-stone-500">{st.role}</td>
                        <td className="py-3.5 px-4 text-center font-bold font-mono">{st.orderCount} masa</td>
                        <td className="py-3.5 px-4 text-center font-semibold text-stone-700">{formatCurrency(st.avgCheck)}</td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-600">{formatCurrency(st.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-16 text-center text-stone-400">
                  <AlertCircle className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                  <p className="font-semibold text-sm">Seçili dönemde personel sipariş aktivitesi bulunamadı.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'PAYMENTS' && (
            <div className="space-y-4 overflow-x-auto">
              {paymentBreakdown.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-stone-50 text-xs uppercase tracking-wider font-bold text-stone-500 border-b border-stone-200">
                    <tr>
                      <th className="py-3 px-4">Ödeme Metodu</th>
                      <th className="py-3 px-4 text-center">İşlem Sayısı</th>
                      <th className="py-3 px-4 text-center">Payı (%)</th>
                      <th className="py-3 px-4 text-right">Tahsil Edilen Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-sm">
                    {paymentBreakdown.map((pay, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-stone-800">{pay.method}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-stone-600">{pay.count} işlem</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-xs bg-stone-100 px-2 py-0.5 rounded-md">%{pay.percent}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-stone-900">{formatCurrency(pay.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-16 text-center text-stone-400">
                  <AlertCircle className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                  <p className="font-semibold text-sm">Seçili dönemde tahsilat işlemi bulunamadı.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
