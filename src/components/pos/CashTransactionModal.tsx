import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Check, AlertCircle } from 'lucide-react';
import { db } from '@/lib/db';
import { useApp } from '@/lib/store';
import { generateId } from '@/lib/utils';
import type { CashTransaction } from '@/types/pos';

interface CashTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'in' | 'out';
  onSuccess?: () => void;
}

export default function CashTransactionModal({
  isOpen,
  onClose,
  defaultType = 'out',
  onSuccess,
}: CashTransactionModalProps) {
  const { state } = useApp();
  const [type, setType] = useState<'in' | 'out'>(defaultType);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>(
    defaultType === 'in' ? 'Kasa Açılışı' : 'Market / Manav'
  );
  const [description, setDescription] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const inCategories = [
    'Kasa Açılışı',
    'Bozukluk Takviyesi',
    'Ortak / Patron Katkısı',
    'Diğer Giriş'
  ];

  const outCategories = [
    'Market / Manav / Kasap',
    'Tedarikçi & Toptancı',
    'Personel Avansı',
    'Dükkan Masrafı / Fatura',
    'Kurye / Nakliye',
    'Diğer Masraf'
  ];

  const handleTypeChange = (newType: 'in' | 'out') => {
    setType(newType);
    setCategory(newType === 'in' ? inCategories[0] : outCategories[0]);
  };

  const handleQuickAmount = (val: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + val).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Lütfen geçerli bir tutar girin.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const nowIso = new Date().toISOString();
      const currentUser = state.currentUser;
      const userName = currentUser?.name || 'Yetkili';

      const transaction: CashTransaction = {
        id: generateId(),
        type,
        amount: numAmount,
        category,
        description: description.trim() || category,
        processedBy: userName,
        createdAt: nowIso,
      };

      await db.cashTransactions.add(transaction);

      // Audit log
      await db.auditLogs.add({
        id: generateId(),
        userId: currentUser?.id || 'staff-1',
        userName,
        action: type === 'in' ? 'Kasaya Para Girişi' : 'Kasadan Masraf / Çıkış',
        details: `${category} - ${numAmount.toLocaleString('tr-TR')} ₺ (${description || 'Açıklamasız'})`,
        entityType: 'order',
        entityId: transaction.id,
        timestamp: nowIso,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Kasa hareketi kaydedilemedi:', err);
      setErrorMsg('İşlem kaydedilemedi: ' + (err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-xs select-none">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
              type === 'in' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-red-600/20 text-red-400'
            }`}>
              {type === 'in' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {type === 'in' ? 'Kasaya Para Girişi' : 'Kasadan Masraf / Para Çıkışı'}
              </h3>
              <p className="text-xs text-stone-400 font-medium">Nakit kasa hareketini kaydet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {/* Type Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-stone-950 rounded-2xl border border-stone-800">
            <button
              type="button"
              onClick={() => handleTypeChange('in')}
              className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                type === 'in'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <ArrowDownRight size={15} />
              <span>KASAYA GİRİŞ (+)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('out')}
              className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                type === 'out'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <ArrowUpRight size={15} />
              <span>MASRAF / ÇIKIŞ (-)</span>
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
              İşlem Tutarı (₺)
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.01"
                required
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setErrorMsg('');
                  setAmount(e.target.value);
                }}
                className="w-full pl-8 pr-4 py-3 bg-stone-950 border border-stone-800 rounded-2xl text-xl sm:text-2xl font-mono font-black text-white placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-black text-stone-500 text-lg">
                ₺
              </span>
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-5 gap-1.5 mt-2">
              {[50, 100, 200, 500, 1000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className="py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl transition-all cursor-pointer text-center active:scale-95"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
              Kategori
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(type === 'in' ? inCategories : outCategories).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-2.5 rounded-xl text-left text-xs font-bold transition-all border cursor-pointer truncate ${
                    category === cat
                      ? 'bg-orange-600/20 border-orange-500 text-orange-300'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
              Açıklama / Fiş Detayı (İsteğe Bağlı)
            </label>
            <input
              type="text"
              placeholder={type === 'in' ? 'Örn: Gün başı bozuk para takviyesi' : 'Örn: Manavdan domates-limon fişi'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-white hover:bg-stone-100 text-stone-950 font-black text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Check size={16} className="text-stone-950" />
              <span>{type === 'in' ? 'GİRİŞİ KAYDET' : 'MASRAFI KAYDET'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
