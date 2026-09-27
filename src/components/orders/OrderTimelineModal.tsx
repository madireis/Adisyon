import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Users, 
  ChefHat, 
  CreditCard, 
  CheckCircle2, 
  Timer, 
  Printer, 
  ArrowRight,
  Banknote,
  UtensilsCrossed,
  Calendar
} from 'lucide-react';
import type { Order } from '@/types/pos';
import { formatCurrency } from '@/lib/utils';
import ThermalSlipModal from '@/components/pos/ThermalSlipModal';

interface OrderTimelineModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderTimelineModal({ order, isOpen, onClose }: OrderTimelineModalProps) {
  const [isSlipOpen, setIsSlipOpen] = useState(false);

  if (!isOpen || !order) return null;

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + 
             d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const formatTimeOnly = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  // Calculate live elapsed minutes if not yet paid
  const getElapsedMinutes = () => {
    if (order.durationMinutes) return order.durationMinutes;
    if (!order.createdAt) return 0;
    try {
      const diff = Date.now() - new Date(order.createdAt).getTime();
      return Math.max(1, Math.round(diff / 60000));
    } catch {
      return 0;
    }
  };

  const elapsedMins = getElapsedMinutes();

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-sm animate-in fade-in select-none">
        <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-950">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-600/10 text-orange-600 flex items-center justify-center">
                <UtensilsCrossed size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">
                    Masa {order.tableLabel} Detaylı Adisyon
                  </h2>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                    order.status === 'paid'
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : order.status === 'ready'
                      ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                      : 'bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800'
                  }`}>
                    {order.status === 'paid' ? 'Ödendi' : order.status === 'ready' ? 'Mutfakta Hazır' : order.status === 'sent' ? 'Mutfakta Hazırlanıyor' : 'Açık'}
                  </span>
                </div>
                <span className="text-xs text-stone-400 font-mono">
                  Sipariş No: #{order.id.slice(-8).toUpperCase()}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Staff & Timing Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Garson */}
              <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800">
                <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block mb-1">
                  Siparişi Alan Garson
                </span>
                <div className="flex items-center gap-1.5">
                  <Users size={14} className="text-orange-600 shrink-0" />
                  <span className="font-black text-xs text-stone-900 dark:text-stone-100 truncate">
                    {order.waiterName || 'Garson'}
                  </span>
                </div>
              </div>

              {/* Sipariş Başlangıcı */}
              <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800">
                <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block mb-1">
                  Sipariş Başlangıcı
                </span>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-blue-600 shrink-0" />
                  <span className="font-black text-xs font-mono text-stone-900 dark:text-stone-100">
                    {formatTimeOnly(order.createdAt)}
                  </span>
                </div>
              </div>

              {/* Ödeme Zamanı & Alan */}
              <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800">
                <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block mb-1">
                  Ödeme Zamanı
                </span>
                <div className="flex items-center gap-1.5">
                  <CreditCard size={14} className="text-emerald-600 shrink-0" />
                  <span className="font-black text-xs font-mono text-stone-900 dark:text-stone-100 truncate">
                    {order.paidAt ? formatTimeOnly(order.paidAt) : 'Bekleniyor'}
                  </span>
                </div>
              </div>

              {/* Toplam Süre */}
              <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800">
                <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block mb-1">
                  Toplam Masa Süresi
                </span>
                <div className="flex items-center gap-1.5">
                  <Timer size={14} className="text-purple-600 shrink-0" />
                  <span className="font-black text-xs text-stone-900 dark:text-stone-100 font-mono">
                    {elapsedMins} dk
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Step-by-Step Chronological Timeline */}
            <div className="bg-stone-50 dark:bg-stone-950 p-4 rounded-2xl border border-stone-200 dark:border-stone-800">
              <h3 className="text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-wider mb-3">
                Sipariş Yaşam Döngüsü & Süreç Çizelgesi
              </h3>
              
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200 dark:before:bg-stone-800">
                {/* 1. Sipariş Başladı */}
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                    1
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        Garson Masaya Sipariş Girmeye Başladı
                      </span>
                      <p className="text-[11px] text-stone-500">
                        Siparişi oluşturan garson: <strong>{order.waiterName || 'Garson'}</strong>
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-900 px-2 py-0.5 rounded-lg border border-stone-200 dark:border-stone-800 self-start sm:self-auto">
                      {formatDateTime(order.createdAt)}
                    </span>
                  </div>
                </div>

                {/* 2. Mutfağa İletildi */}
                <div className="relative">
                  <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                    order.sentToKitchenAt ? 'bg-orange-500 text-white' : 'bg-stone-300 text-stone-600 dark:bg-stone-800'
                  }`}>
                    2
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        Mutfak & Bar İstasyonlarına Fiş İletildi
                      </span>
                      <p className="text-[11px] text-stone-500">
                        {order.sentToKitchenAt ? 'Mutfak KDS ekranına ve yazıcılara düştü' : 'Henüz mutfağa gönderilmedi (Taslak)'}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-900 px-2 py-0.5 rounded-lg border border-stone-200 dark:border-stone-800 self-start sm:self-auto">
                      {order.sentToKitchenAt ? formatDateTime(order.sentToKitchenAt) : 'Bekleniyor'}
                    </span>
                  </div>
                </div>

                {/* 3. Mutfakta Hazırlandı */}
                <div className="relative">
                  <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                    order.kitchenReadyAt ? 'bg-blue-600 text-white' : 'bg-stone-300 text-stone-600 dark:bg-stone-800'
                  }`}>
                    3
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        Mutfak Hazırlığı Tamamlandı
                      </span>
                      <p className="text-[11px] text-stone-500">
                        {order.kitchenReadyAt ? (
                          <>Mutfak şefi siparişi 'Hazır' yaptı. <strong>Hazırlık süresi: {order.kitchenDurationMinutes || 1} dk</strong></>
                        ) : order.sentToKitchenAt ? (
                          'Mutfakta hazırlanıyor...'
                        ) : (
                          'Sipariş bekleniyor'
                        )}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-900 px-2 py-0.5 rounded-lg border border-stone-200 dark:border-stone-800 self-start sm:self-auto">
                      {order.kitchenReadyAt ? formatDateTime(order.kitchenReadyAt) : '-'}
                    </span>
                  </div>
                </div>

                {/* 4. Ödeme Alındı */}
                <div className="relative">
                  <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                    order.paidAt ? 'bg-emerald-600 text-white' : 'bg-stone-300 text-stone-600 dark:bg-stone-800'
                  }`}>
                    4
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        Ödeme Tahsil Edildi & Masa Kapatıldı
                      </span>
                      <p className="text-[11px] text-stone-500">
                        {order.paidAt ? (
                          <>Tahsil Eden: <strong>{order.paidBy || 'Kasiyer'}</strong> ({order.paymentMethod || 'Nakit'}) • <strong>Masa Toplam Süresi: {order.durationMinutes || elapsedMins} dk</strong></>
                        ) : (
                          'Hesap henüz alınmadı (Masa aktif kullanımda)'
                        )}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-900 px-2 py-0.5 rounded-lg border border-stone-200 dark:border-stone-800 self-start sm:self-auto">
                      {order.paidAt ? formatDateTime(order.paidAt) : 'Açık Masa'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <h3 className="text-xs font-black text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                  Siparişteki Ürünler ({order.items?.length || 0} Kalem)
                </h3>
                <span className="text-xs text-stone-500 font-bold">
                  Kişi Sayısı: {order.guestCount || 2}
                </span>
              </div>

              <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 text-stone-500 font-bold">
                      <th className="py-2.5 px-3">Ürün</th>
                      <th className="py-2.5 px-3 text-center">Adet</th>
                      <th className="py-2.5 px-3 text-right">Birim Fiyat</th>
                      <th className="py-2.5 px-3 text-right">Toplam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-medium">
                    {order.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-stone-900 dark:text-stone-100 block">
                            {item.name}
                          </span>
                          {item.modifiers && item.modifiers.length > 0 && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 block">
                              {item.modifiers.map(m => m.name).join(', ')}
                            </span>
                          )}
                          {item.notes && (
                            <span className="text-[10px] text-stone-400 italic block">
                              Not: {item.notes}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold font-mono">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-stone-500">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900 dark:text-stone-100">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Note */}
            {order.notes && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs">
                <span className="font-bold text-amber-900 dark:text-amber-300 block mb-0.5">Sipariş Notu:</span>
                <p className="text-amber-800 dark:text-amber-200 font-medium">{order.notes}</p>
              </div>
            )}

            {/* Total Row */}
            <div className="p-4 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 flex justify-between items-center">
              <div>
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                  Genel Toplam (KDV Dahil)
                </span>
                {order.paymentMethod && (
                  <span className="text-xs text-stone-500 font-medium">
                    Ödeme Şekli: <strong className="text-stone-900 dark:text-stone-100">{order.paymentMethod}</strong>
                  </span>
                )}
              </div>
              <div className="text-2xl font-black font-mono text-orange-600 dark:text-orange-400">
                {formatCurrency(order.total)}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex justify-between items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSlipOpen(true)}
              className="py-2.5 px-4 bg-white text-stone-950 font-black text-xs rounded-xl border border-stone-300 shadow-xs hover:bg-stone-100 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={15} />
              <span>Fiş / Adisyon Yazdır</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 bg-white text-stone-950 font-black text-xs rounded-xl border border-stone-300 shadow-xs hover:bg-stone-100 active:scale-95 transition-all cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>

      {/* Slip Modal */}
      {isSlipOpen && (
        <ThermalSlipModal
          isOpen={isSlipOpen}
          onClose={() => setIsSlipOpen(false)}
          order={order}
          type="receipt"
        />
      )}
    </>
  );
}
