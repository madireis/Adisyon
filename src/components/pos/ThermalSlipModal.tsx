import React from 'react';
import { X, Printer, ChefHat, Receipt, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { KitchenTicket, Order } from '@/types/pos';
import wotsLogo from '@/assets/logo.jpg';

export type ThermalSlipType = 'kitchen' | 'receipt' | 'z-report';

export interface ZReportData {
  reportDate: string;
  totalRevenue: number;
  orderCount: number;
  cashRevenue: number;
  posRevenue: number;
  mealCardRevenue: number;
  otherRevenue: number;
  cashInTotal: number;
  cashOutTotal: number;
  expectedDrawerCash: number;
  expenses: { description: string; amount: number; category: string }[];
  staffBreakdown: { name: string; orderCount: number; total: number }[];
  authorizedPerson: string;
}

interface ThermalSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ThermalSlipType;
  kitchenTicket?: KitchenTicket | null;
  order?: Order | null;
  zReportData?: ZReportData | null;
}

export default function ThermalSlipModal({
  isOpen,
  onClose,
  type,
  kitchenTicket,
  order,
  zReportData
}: ThermalSlipModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getTitle = () => {
    switch (type) {
      case 'kitchen': return 'Mutfak Fişi';
      case 'receipt': return 'Müşteri Hesap / Adisyon Fişi';
      case 'z-report': return 'Gün Sonu Z-Raporu';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-xs select-none">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Top Header (Screen Only) */}
        <div className="p-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-600/20 text-orange-500 flex items-center justify-center">
              {type === 'kitchen' && <ChefHat size={18} />}
              {type === 'receipt' && <Receipt size={18} />}
              {type === 'z-report' && <FileText size={18} />}
            </div>
            <div>
              <h3 className="text-sm font-black text-white">{getTitle()}</h3>
              <p className="text-[11px] text-stone-400 font-medium">80mm Termal Yazıcı Çıktısı</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Thermal Paper Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-900 flex justify-center">
          <div 
            id="thermal-slip-print"
            className="w-full max-w-[340px] bg-white text-stone-950 p-5 rounded-2xl shadow-xl font-mono text-xs leading-relaxed border border-stone-200 select-text thermal-receipt"
          >
            {/* Header info */}
            <div className="text-center pb-3 border-b-2 border-dashed border-stone-400">
              <div className="flex justify-center mb-2">
                <img 
                  src={wotsLogo} 
                  alt="WOT'S CAFE" 
                  className="w-14 h-14 object-contain rounded-xl bg-black mx-auto shadow-xs border border-stone-800" 
                />
              </div>
              <h2 className="text-base font-black tracking-wider uppercase text-stone-950">WOT'S CAFE</h2>
              <p className="text-[10px] text-stone-600 mt-0.5">Tel: 0212 727 00 00</p>
              
              <div className="mt-2 inline-block px-3 py-1 bg-stone-100 rounded-md font-bold text-[11px] tracking-wide border border-stone-300">
                {type === 'kitchen' && '*** MUTFAK SİPARİŞ FİŞİ ***'}
                {type === 'receipt' && '*** ADİSYON / HESAP FİŞİ ***'}
                {type === 'z-report' && '*** GÜN SONU KASA Z-RAPORU ***'}
              </div>
            </div>

            {/* Content for KITCHEN TICKET */}
            {type === 'kitchen' && kitchenTicket && (
              <div className="py-3 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold border-b border-stone-300 pb-2">
                  <span className="text-base font-black text-stone-950 bg-stone-100 px-2 py-0.5 rounded">
                    MASA: {kitchenTicket.tableLabel}
                  </span>
                  <span>#{kitchenTicket.id.slice(-4).toUpperCase()}</span>
                </div>
                
                <div className="text-[11px] text-stone-600 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Tarih & Saat:</span>
                    <span className="font-bold text-stone-900">
                      {new Date(kitchenTicket.createdAt).toLocaleTimeString('tr-TR')} - {new Date(kitchenTicket.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>İstasyon:</span>
                    <span className="font-bold uppercase text-stone-900">{kitchenTicket.station}</span>
                  </div>
                </div>

                <div className="border-t-2 border-dashed border-stone-400 pt-2 space-y-2.5">
                  {kitchenTicket.items.map((it, idx) => (
                    <div key={idx} className="border-b border-stone-200 pb-1.5 last:border-0">
                      <div className="flex justify-between items-start">
                        <span className="font-black text-sm text-stone-950">
                          {it.quantity}x {it.name}
                        </span>
                      </div>
                      {it.waiterName && (
                        <div className="text-[10px] text-stone-600 font-semibold pl-4">
                          Garson: {it.waiterName}
                        </div>
                      )}
                      {it.modifiers && it.modifiers.length > 0 && (
                        <div className="text-[10px] text-stone-600 font-semibold pl-4">
                          + {it.modifiers.join(', ')}
                        </div>
                      )}
                      {it.notes && (
                        <div className="text-[11px] font-bold text-red-600 pl-4 mt-0.5">
                          Not: {it.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t border-stone-400 pt-2 text-[10px] text-center text-stone-500">
                  Toplam Kalem: {kitchenTicket.items.reduce((s, i) => s + i.quantity, 0)} Adet
                </div>
              </div>
            )}

            {/* Content for RECEIPT / PRE-BILL */}
            {type === 'receipt' && order && (
              <div className="py-3 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold border-b border-stone-300 pb-2">
                  <span className="text-base font-black text-stone-950 bg-stone-100 px-2 py-0.5 rounded">
                    MASA: {order.tableLabel}
                  </span>
                  <span>#{order.id.slice(-6).toUpperCase()}</span>
                </div>

                <div className="text-[11px] text-stone-600 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Tarih & Saat:</span>
                    <span className="font-bold text-stone-900">
                      {new Date().toLocaleTimeString('tr-TR')} - {new Date().toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Garson:</span>
                    <span className="font-bold text-stone-900">{order.waiterName || 'Garson'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kişi Sayısı:</span>
                    <span className="font-bold text-stone-900">{order.guestCount || 2}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t-2 border-dashed border-stone-400 pt-2 space-y-1.5">
                  <div className="flex justify-between font-bold text-[11px] text-stone-500 pb-1 border-b border-stone-300">
                    <span>ÜRÜN</span>
                    <span>TUTAR</span>
                  </div>
                  {order.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <div>
                        <span className="font-bold text-stone-900">{it.quantity}x</span> {it.name}
                        <div className="text-[10px] text-stone-500 pl-3">
                          Garson: {it.addedByWaiterName || order.waiterName || 'Garson'}
                        </div>
                        {it.modifiers && it.modifiers.length > 0 && (
                          <div className="text-[10px] text-stone-500 pl-3">
                            {it.modifiers.map(m => m.name).join(', ')}
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-stone-950">
                        {formatCurrency(it.unitPrice * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t-2 border-stone-800 pt-2 space-y-1 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Ara Toplam:</span>
                    <span className="font-bold">{formatCurrency(order.subtotal || order.total * 0.9)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>KDV (%10):</span>
                    <span className="font-bold">{formatCurrency(order.tax || order.total * 0.1)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-red-600 font-bold">
                      <span>İndirim:</span>
                      <span>-{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-stone-950 pt-1 border-t border-stone-300">
                    <span>GENEL TOPLAM:</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-stone-400 pt-3 text-[11px] text-center text-stone-600">
                  <p className="font-bold">Bizi tercih ettiğiniz için teşekkür ederiz!</p>
                  <p className="text-[9px] text-stone-400 mt-0.5">Mali değeri yoktur - Bilgi fişidir.</p>
                </div>
              </div>
            )}

            {/* Content for Z-REPORT (GÜN SONU KASA KAPATMA) */}
            {type === 'z-report' && zReportData && (
              <div className="py-3 space-y-3 text-[11px]">
                <div className="text-stone-700 space-y-0.5 pb-2 border-b border-stone-300">
                  <div className="flex justify-between">
                    <span>Rapor Tarihi:</span>
                    <span className="font-bold text-stone-900">{zReportData.reportDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kapatan Yetkili:</span>
                    <span className="font-bold text-stone-900">{zReportData.authorizedPerson}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Toplam Masa / Adisyon:</span>
                    <span className="font-bold text-stone-900">{zReportData.orderCount} adet</span>
                  </div>
                </div>

                {/* Grand Total Revenue */}
                <div className="bg-stone-100 p-2.5 rounded-lg border border-stone-300 text-center">
                  <span className="text-[10px] text-stone-500 font-bold uppercase block">GÜNLÜK TOPLAM CİRO</span>
                  <span className="text-xl font-black text-stone-950 block mt-0.5">
                    {formatCurrency(zReportData.totalRevenue)}
                  </span>
                </div>

                {/* Payment Breakdown */}
                <div className="border-t border-dashed border-stone-400 pt-2 space-y-1">
                  <div className="font-black text-stone-900 uppercase text-[10px] mb-1">TAHSİLAT DÖKÜMÜ</div>
                  <div className="flex justify-between">
                    <span>Nakit Tahsilat:</span>
                    <span className="font-bold text-stone-950">{formatCurrency(zReportData.cashRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kredi Kartı / POS:</span>
                    <span className="font-bold text-stone-950">{formatCurrency(zReportData.posRevenue)}</span>
                  </div>
                  {zReportData.mealCardRevenue > 0 && (
                    <div className="flex justify-between">
                      <span>Yemek Kartları:</span>
                      <span className="font-bold text-stone-950">{formatCurrency(zReportData.mealCardRevenue)}</span>
                    </div>
                  )}
                  {zReportData.otherRevenue > 0 && (
                    <div className="flex justify-between">
                      <span>Diğer / İkram:</span>
                      <span className="font-bold text-stone-950">{formatCurrency(zReportData.otherRevenue)}</span>
                    </div>
                  )}
                </div>

                {/* Cash Drawer Reconciliation */}
                <div className="border-t-2 border-stone-800 pt-2 space-y-1 bg-amber-50/70 p-2 rounded border border-amber-200">
                  <div className="font-black text-amber-900 uppercase text-[10px]">KASA NAKİT MUTABAKATI</div>
                  <div className="flex justify-between text-stone-700">
                    <span>(+) Kasa Giriş / Açılış:</span>
                    <span className="font-bold text-emerald-700">+{formatCurrency(zReportData.cashInTotal)}</span>
                  </div>
                  <div className="flex justify-between text-stone-700">
                    <span>(+) Nakit Satışlar:</span>
                    <span className="font-bold text-emerald-700">+{formatCurrency(zReportData.cashRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-stone-700">
                    <span>(-) Kasadan Masraflar:</span>
                    <span className="font-bold text-red-600">-{formatCurrency(zReportData.cashOutTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black text-stone-950 pt-1 border-t border-amber-300">
                    <span>KASADAKİ NET NAKİT:</span>
                    <span>{formatCurrency(zReportData.expectedDrawerCash)}</span>
                  </div>
                </div>

                {/* Expenses breakdown */}
                {zReportData.expenses && zReportData.expenses.length > 0 && (
                  <div className="border-t border-dashed border-stone-400 pt-2 space-y-1">
                    <div className="font-black text-stone-900 uppercase text-[10px] mb-1">
                      KASADAN ÇIKAN MASRAFLAR ({zReportData.expenses.length})
                    </div>
                    {zReportData.expenses.map((exp, idx) => (
                      <div key={idx} className="flex justify-between text-[10px]">
                        <span className="text-stone-700 truncate pr-2">
                          * {exp.description || exp.category}
                        </span>
                        <span className="font-bold text-red-600 whitespace-nowrap">
                          -{formatCurrency(exp.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Waiter Breakdown */}
                {zReportData.staffBreakdown && zReportData.staffBreakdown.length > 0 && (
                  <div className="border-t border-dashed border-stone-400 pt-2 space-y-1">
                    <div className="font-black text-stone-900 uppercase text-[10px] mb-1">GARSON CİRO DAĞILIMI</div>
                    {zReportData.staffBreakdown.map((s, idx) => (
                      <div key={idx} className="flex justify-between text-[10px]">
                        <span className="text-stone-700">{s.name} ({s.orderCount} masa):</span>
                        <span className="font-bold text-stone-950">{formatCurrency(s.total)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sign area */}
                <div className="border-t-2 border-stone-400 pt-4 mt-3 flex justify-between text-[10px] text-stone-600">
                  <div>
                    <span>Kasiyer / Yetkili</span>
                    <p className="mt-4 font-bold text-stone-900">İmza: .................</p>
                  </div>
                  <div className="text-right">
                    <span>İşletme Onayı</span>
                    <p className="mt-4 font-bold text-stone-900">İmza: .................</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Buttons (Screen Only) */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center gap-3 shrink-0 no-print">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-2xl transition-colors cursor-pointer text-center"
          >
            Kapat
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-3 px-4 bg-white hover:bg-stone-100 text-stone-950 font-black text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-95"
          >
            <Printer size={16} className="text-stone-950" />
            <span>YAZDIR / FİŞ ÇIKART</span>
          </button>
        </div>

      </div>
    </div>
  );
}
