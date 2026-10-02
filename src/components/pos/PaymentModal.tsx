import React, { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, Gift, CheckCircle2, Trash2, Delete } from 'lucide-react';
import { db } from '@/lib/db';
import { useApp } from '@/lib/store';
import { cn, formatCurrency, generateId } from '@/lib/utils';
import { hasPermission } from '@/lib/permissions';
import { getPaymentMethods, getPaymentMethodIcon, getPaymentMethodNameMap } from '@/lib/paymentMethods';
import type { Order, Table, Payment, PaymentMethod, PaymentPart, PaymentMethodConfig } from '@/types/pos';

interface PaymentModalProps {
  order: Order;
  table: Table;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ order, table, onClose, onSuccess }: PaymentModalProps) {
  const { state } = useApp();
  const [parts, setParts] = useState<PaymentPart[]>([]);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [availableMethods, setAvailableMethods] = useState<PaymentMethodConfig[]>(() => 
    getPaymentMethods().filter(m => m.enabled)
  );

  useEffect(() => {
    const refreshMethods = () => {
      setAvailableMethods(getPaymentMethods().filter(m => m.enabled));
    };
    window.addEventListener('wots_payment_methods_updated', refreshMethods);
    return () => window.removeEventListener('wots_payment_methods_updated', refreshMethods);
  }, []);

  const canPay = hasPermission(state.currentUser, 'canTakePayment');
  const canDiscount = hasPermission(state.currentUser, 'canApplyDiscount');
  
  const totalPaid = parts.reduce((acc, p) => acc + p.amount, 0);
  const remaining = Math.max(0, order.total - totalPaid);
  const change = Math.max(0, totalPaid - order.total);
  
  const activeMethodsList = availableMethods.filter(m => {
    if (m.id === 'ikram' || m.category === 'gift') {
      return canDiscount;
    }
    return true;
  });

  const handleKeypad = (val: string) => {
    if (val === 'C') {
      setCurrentInput('');
    } else if (val === 'DEL') {
      setCurrentInput(prev => prev.slice(0, -1));
    } else {
      if (currentInput.includes('.') && val === '.') return;
      setCurrentInput(prev => prev + val);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setCurrentInput(amount.toString());
  };

  const addPaymentPart = (method: PaymentMethod) => {
    if (!canPay) {
      alert('Ödeme alma yetkiniz bulunmamaktadır.');
      return;
    }
    if (method === 'ikram' && !canDiscount) {
      alert('İkram ve indirim tanımlama yetkiniz bulunmamaktadır.');
      return;
    }
    const amount = parseFloat(currentInput) || remaining;
    if (amount <= 0) return;

    setParts(prev => [...prev, { method, amount }]);
    setCurrentInput('');
  };

  const removePart = (index: number) => {
    setParts(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    if (!canPay) {
      alert('Ödeme alma yetkiniz bulunmamaktadır.');
      return;
    }
    if (totalPaid < order.total) {
      alert('Alınan ödeme tutarı adisyon toplamından az olamaz!');
      return;
    }

    const nowIso = new Date().toISOString();
    const durationMinutes = order.createdAt 
      ? Math.max(1, Math.round((new Date(nowIso).getTime() - new Date(order.createdAt).getTime()) / 60000))
      : 1;

    const methodNames = getPaymentMethodNameMap(availableMethods);

    const partsToRecord = parts.length > 0 ? parts : [{ method: 'cash' as PaymentMethod, amount: 0 }];
    const paymentMethodLabel = parts.length > 0
      ? (parts.length > 1
        ? `Parçalı (${parts.map(p => methodNames[p.method] || p.method).join(' + ')})`
        : (methodNames[parts[0]?.method] || parts[0]?.method || 'Nakit TL'))
      : '0 TL / Kapalı';

    try {
      await db.orders.put({
        ...order,
        status: 'paid',
        paidAt: nowIso,
        paidBy: state.currentUser?.name || 'Kasiyer',
        paidById: state.currentUser?.id || 'staff-2',
        paymentMethod: paymentMethodLabel,
        durationMinutes,
        updatedAt: nowIso,
      });

      const existingTable = await db.table<Table>('tables').get(table.id);
      if (existingTable) {
        const updatedTable: Table = {
          ...existingTable,
          status: 'available',
          guestCount: 0,
        };
        delete updatedTable.currentOrderId;
        delete updatedTable.occupiedAt;
        await db.table<Table>('tables').put(updatedTable);
      }

      const paymentRecord: Payment = {
        id: generateId(),
        orderId: order.id,
        tableLabel: table.label,
        parts: partsToRecord,
        total: totalPaid,
        change,
        paidAt: nowIso,
        processedBy: state.currentUser?.name || 'Kasiyer',
        processedById: state.currentUser?.id || 'staff-2',
        waiterName: order.waiterName || 'Garson',
        durationMinutes,
      };
      await db.payments.add(paymentRecord);

      // Audit log
      await db.auditLogs.add({
        id: generateId(),
        userId: state.currentUser?.id || 'staff-2',
        userName: state.currentUser?.name || 'Kasiyer',
        action: 'Ödeme Alındı',
        details: `${table.label} masası için ₺${totalPaid} tutarında ödeme tahsil edildi (${paymentMethodLabel}). Masa süresi: ${durationMinutes} dk. Garson: ${order.waiterName || 'Belirtilmedi'}.`,
        entityType: 'payment',
        entityId: paymentRecord.id,
        timestamp: nowIso,
      });

      onSuccess();
    } catch (error) {
      console.error('Payment failed', error);
      alert('Ödeme işlemi tamamlanırken hata oluştu.');
    }
  };

  const handleQuickFullPay = async (method: PaymentMethod) => {
    if (!canPay) {
      alert('Ödeme alma yetkiniz bulunmamaktadır.');
      return;
    }
    if (method === 'ikram' && !canDiscount) {
      alert('İkram ve indirim tanımlama yetkiniz bulunmamaktadır.');
      return;
    }
    const fullAmount = order.total;
    const nowIso = new Date().toISOString();
    const durationMinutes = order.createdAt 
      ? Math.max(1, Math.round((new Date(nowIso).getTime() - new Date(order.createdAt).getTime()) / 60000))
      : 1;

    const methodNames = getPaymentMethodNameMap(availableMethods);
    const paymentMethodLabel = methodNames[method] || (method === 'cash' ? 'Nakit TL' : 'Kredi Kartı');

    try {
      await db.orders.put({
        ...order,
        status: 'paid',
        paidAt: nowIso,
        paidBy: state.currentUser?.name || 'Kasiyer',
        paidById: state.currentUser?.id || 'staff-2',
        paymentMethod: paymentMethodLabel,
        durationMinutes,
        updatedAt: nowIso,
      });

      const existingTable = await db.table<Table>('tables').get(table.id);
      if (existingTable) {
        const updatedTable: Table = {
          ...existingTable,
          status: 'available',
          guestCount: 0,
        };
        delete updatedTable.currentOrderId;
        delete updatedTable.occupiedAt;
        await db.table<Table>('tables').put(updatedTable);
      }

      const paymentRecord: Payment = {
        id: generateId(),
        orderId: order.id,
        tableLabel: table.label,
        parts: [{ method, amount: fullAmount }],
        total: fullAmount,
        change: 0,
        paidAt: nowIso,
        processedBy: state.currentUser?.name || 'Kasiyer',
        processedById: state.currentUser?.id || 'staff-2',
        waiterName: order.waiterName || 'Garson',
        durationMinutes,
      };
      await db.payments.add(paymentRecord);

      await db.auditLogs.add({
        id: generateId(),
        userId: state.currentUser?.id || 'staff-2',
        userName: state.currentUser?.name || 'Kasiyer',
        action: 'Hızlı Ödeme Alındı',
        details: `${table.label} masası için ₺${fullAmount} tutarında hızlı tam ödeme alındı (${paymentMethodLabel}). Masa süresi: ${durationMinutes} dk. Garson: ${order.waiterName || 'Belirtilmedi'}.`,
        entityType: 'payment',
        entityId: paymentRecord.id,
        timestamp: nowIso,
      });

      onSuccess();
    } catch (error) {
      console.error('Payment failed', error);
      alert('Hızlı ödeme işleminde hata oluştu.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-end sm:items-center p-0 sm:p-4 z-50 select-none overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 dark:border-stone-800 dark:text-stone-100 w-full max-h-[96vh] sm:max-h-[92vh] max-w-4xl rounded-t-[32px] sm:rounded-[32px] flex flex-col md:flex-row overflow-y-auto sm:overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.25)] border border-stone-200/80 animate-in slide-in-from-bottom duration-250 pb-safe">
        
        {/* Mobile Centered Grab Handle Pill */}
        <div className="sm:hidden w-full pt-3 pb-1 flex justify-center bg-white dark:bg-stone-900 shrink-0">
          <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full" />
        </div>

        {/* Left Side: Summary & Payments */}
        <div className="w-full md:w-1/2 bg-stone-50/70 dark:bg-stone-950/60 border-r border-stone-200/80 dark:border-stone-800 flex flex-col">
          <div className="p-4 sm:p-5 bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100 tracking-tight">Hesap Kapatma & Ödeme</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-semibold mt-0.5">Masa {table.label} — {table.guestCount || 2} Misafir</p>
            </div>
            <button onClick={onClose} className="p-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 active:scale-95 rounded-full text-stone-500 dark:text-stone-400 cursor-pointer transition-all ios-spring">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
            {/* Quick 1-Tap Checkout Buttons */}
            <div className="bg-white dark:bg-stone-900 p-3.5 sm:p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs space-y-2.5">
              <span className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                ⚡ Hızlı Tek Tıkla Ödeme (Tam Tutar)
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleQuickFullPay('cash')}
                  className="py-3 px-3 rounded-2xl font-black text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 active:scale-[0.96] text-white flex flex-col items-center justify-center gap-1 shadow-sm transition-all cursor-pointer ios-spring"
                >
                  <div className="flex items-center gap-1.5">
                    <Banknote className="w-4 h-4" />
                    <span>Nakit Tam Öde</span>
                  </div>
                  <span className="text-[11px] opacity-90 font-mono">{formatCurrency(order.total)}</span>
                </button>
                <button
                  onClick={() => handleQuickFullPay('credit_card')}
                  className="py-3 px-3 rounded-2xl font-black text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 active:scale-[0.96] text-white flex flex-col items-center justify-center gap-1 shadow-sm transition-all cursor-pointer ios-spring"
                >
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    <span>Kart Tam Öde</span>
                  </div>
                  <span className="text-[11px] opacity-90 font-mono">{formatCurrency(order.total)}</span>
                </button>
              </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs space-y-2.5">
              <div className="flex justify-between items-center text-sm text-stone-600 dark:text-stone-300">
                <span>Adisyon Tutarı</span>
                <span className="font-bold text-stone-900 dark:text-stone-100 font-mono">{formatCurrency(order.total)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-stone-600 dark:text-stone-300">
                <span>Tahsil Edilen</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="border-t border-stone-100 dark:border-stone-800 pt-2.5 flex justify-between items-center">
                <span className="font-bold text-base text-stone-800 dark:text-stone-200">Kalan Tutar</span>
                <span className="text-2xl font-black text-orange-600 dark:text-orange-500 font-mono">{formatCurrency(remaining)}</span>
              </div>
              {change > 0 && (
                <div className="flex justify-between items-center text-sm bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 p-3 rounded-xl font-bold border border-emerald-200/50 dark:border-emerald-800">
                  <span>Para Üstü</span>
                  <span className="font-mono">{formatCurrency(change)}</span>
                </div>
              )}
            </div>

            {parts.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Tahsil Edilen Kalemler</h3>
                 {parts.map((p, idx) => {
                  const mLabel = activeMethodsList.find(m => m.id === p.method)?.name || p.method;
                  return (
                    <div key={idx} className="flex justify-between items-center p-3 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-stone-800 dark:text-stone-200 uppercase">
                          {mLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100 font-mono">{formatCurrency(p.amount)}</span>
                        <button onClick={() => removePart(idx)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 active:scale-95 rounded-lg cursor-pointer transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 shrink-0 pb-safe sm:pb-4">
            <button
              onClick={handleConfirm}
              disabled={totalPaid < order.total}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ios-spring"
            >
              <CheckCircle2 className="w-5 h-5" />
              PARÇALI ÖDEMEYİ BİTİR & MASAYI KAPAT
            </button>
          </div>
        </div>

        {/* Right Side: Keypad & Methods */}
        <div className="w-full md:w-1/2 p-4 sm:p-5 bg-white dark:bg-stone-900 flex flex-col justify-between">
          <div>
            <div className="mb-3">
              <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block mb-1.5">
                Girilecek Tutar (Boş ise kalan tutar ₺{remaining})
              </label>
              <div className="w-full h-13 bg-stone-100/90 dark:bg-stone-800 rounded-2xl px-4 flex items-center justify-end text-2xl sm:text-3xl font-mono font-black text-stone-900 dark:text-stone-100 border border-stone-200/70 dark:border-stone-700">
                {currentInput ? `₺${currentInput}` : `₺${remaining}`}
              </div>
            </div>

            {/* Quick cash amounts */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-3">
              {[100, 200, 500, 1000].map(amt => (
                <button
                  key={amt}
                  onClick={() => handleQuickAmount(amt)}
                  className="py-2.5 bg-stone-100/90 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 active:scale-95 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-100 cursor-pointer transition-all ios-spring border border-stone-200/40 dark:border-stone-700"
                >
                  +{amt}
                </button>
              ))}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'DEL'].map(val => (
                <button
                  key={val}
                  onClick={() => handleKeypad(val)}
                  className="h-13 bg-stone-100/80 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 active:bg-stone-300 active:scale-[0.93] border border-stone-200/60 dark:border-stone-700 rounded-2xl font-bold text-xl text-stone-800 dark:text-stone-100 cursor-pointer transition-all flex items-center justify-center shadow-2xs ios-spring"
                >
                  {val === 'DEL' ? <Delete size={20} className="mx-auto" /> : val}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Methods buttons */}
          <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-stone-800">
            <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block mb-1">
              Ödeme Tipini Seçerek Tahsil Et:
            </span>
            <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto no-scrollbar pr-0.5">
              {activeMethodsList.map(method => {
                const MethodIcon = getPaymentMethodIcon(method.icon);
                return (
                  <button
                    key={method.id}
                    onClick={() => addPaymentPart(method.id as PaymentMethod)}
                    className={cn(
                      "py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.96] cursor-pointer ios-spring",
                      method.color || 'bg-stone-800 text-white'
                    )}
                  >
                    <MethodIcon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{method.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
