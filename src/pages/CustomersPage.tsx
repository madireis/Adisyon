import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Heart, Search, Star, UserPlus, Edit2, Trash2, X, Phone, User } from 'lucide-react';
import { formatCurrency, generateId } from '@/lib/utils';
import type { Customer } from '@/types/pos';

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const customers = useLiveQuery(() => db.customers.toArray()) || [];

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(50);
  const [errorMessage, setErrorMessage] = useState('');

  const filtered = customers.filter((c: Customer) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const openAddModal = () => {
    setName('');
    setPhone('');
    setNotes('');
    setLoyaltyPoints(50);
    setErrorMessage('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone);
    setNotes(customer.notes || '');
    setLoyaltyPoints(customer.loyaltyPoints || 0);
    setErrorMessage('');
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setErrorMessage('Müşteri adı ve telefon numarası zorunludur');
      return;
    }

    try {
      const newCust: Customer = {
        id: generateId(),
        name: name.trim(),
        phone: phone.trim(),
        totalVisits: 1,
        totalSpend: 0,
        averageOrder: 0,
        favoriteProducts: [],
        lastVisit: new Date().toISOString(),
        notes: notes.trim(),
        loyaltyPoints: Number(loyaltyPoints) || 0,
      };

      await db.customers.add(newCust);
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error('Müşteri eklenemedi:', err);
      setErrorMessage('Müşteri kaydedilirken hata oluştu: ' + (err?.message || err));
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    if (!name.trim() || !phone.trim()) {
      setErrorMessage('Müşteri adı ve telefon numarası zorunludur');
      return;
    }

    try {
      await db.customers.update(editingCustomer.id, {
        name: name.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
        loyaltyPoints: Number(loyaltyPoints) || 0,
      });
      setEditingCustomer(null);
    } catch (err: any) {
      console.error('Müşteri güncellenemedi:', err);
      setErrorMessage('Müşteri güncellenirken hata oluştu: ' + (err?.message || err));
    }
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (confirm(`"${customer.name}" müşterisini silmek istediğinize emin misiniz?`)) {
      await db.customers.delete(customer.id);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto dark:bg-stone-950 dark:text-stone-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 w-full">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-800 dark:text-stone-100 tracking-tight">Müşteri CRM & Sadakat</h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Müşteri profilleri, ziyaret sıklığı ve sadakat puanları</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              placeholder="İsim veya telefon ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs"
            />
          </div>
          <button 
            onClick={openAddModal}
            className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <UserPlus size={18} />
            Yeni Müşteri Ekle
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-stone-50 dark:bg-stone-950/80 text-xs uppercase tracking-wider font-bold text-stone-500 dark:text-stone-300 border-b border-stone-200 dark:border-stone-800">
            <tr>
              <th className="py-3 sm:py-3.5 px-3 sm:px-6">Müşteri Adı</th>
              <th className="py-3 sm:py-3.5 px-3 sm:px-6">Telefon</th>
              <th className="py-3 sm:py-3.5 px-3 sm:px-6">Sadakat Puanı</th>
              <th className="py-3 sm:py-3.5 px-3 sm:px-6">Toplam Ziyaret</th>
              <th className="py-3 sm:py-3.5 px-3 sm:px-6">Toplam Harcama</th>
              <th className="py-3 sm:py-3.5 px-3 sm:px-6">Ortalama Hesap</th>
              <th className="py-3 sm:py-3.5 px-3 sm:px-6 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-sm">
            {filtered.map((customer: Customer) => (
              <tr key={customer.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/50 transition-colors">
                <td className="py-3 sm:py-4 px-3 sm:px-6">
                  <div className="font-bold text-stone-800 dark:text-stone-100">{customer.name}</div>
                  {customer.notes && <div className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">{customer.notes}</div>}
                </td>
                <td className="py-3 sm:py-4 px-3 sm:px-6 text-stone-600 dark:text-stone-300 font-mono text-xs">{customer.phone}</td>
                <td className="py-3 sm:py-4 px-3 sm:px-6">
                  <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 px-2.5 py-1 rounded-lg w-max text-xs">
                    <Star size={14} className="fill-amber-400 text-amber-500" />
                    {customer.loyaltyPoints} Puan
                  </span>
                </td>
                <td className="py-3 sm:py-4 px-3 sm:px-6 text-stone-700 dark:text-stone-300 font-semibold">{customer.totalVisits} ziyaret</td>
                <td className="py-3 sm:py-4 px-3 sm:px-6 font-extrabold text-stone-900 dark:text-stone-100">{formatCurrency(customer.totalSpend)}</td>
                <td className="py-3 sm:py-4 px-3 sm:px-6 text-stone-600 dark:text-stone-300 font-medium">{formatCurrency(customer.averageOrder)}</td>
                <td className="py-3 sm:py-4 px-3 sm:px-6 text-right">
                  <div className="flex justify-end items-center gap-2">
                    <button 
                      onClick={() => openEditModal(customer)}
                      className="p-1.5 text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                      title="Müşteriyi Düzenle"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteCustomer(customer)}
                      className="p-1.5 text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                      title="Müşteriyi Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-stone-400">
                  <Heart size={40} className="mx-auto text-stone-300 dark:text-stone-600 mb-2" />
                  <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">Müşteri kaydı bulunamadı.</p>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Yukarıdaki "Yeni Müşteri Ekle" butonuyla yeni profil oluşturabilirsiniz.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-6 w-full max-w-md shadow-2xl border border-stone-200 dark:border-stone-800 dark:text-stone-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="text-xl font-black text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <UserPlus className="text-orange-600 dark:text-orange-400" size={22} />
                Yeni Müşteri Kaydı
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Müşteri Ad Soyad</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Canan Tekin"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Telefon Numarası</label>
                <input
                  type="tel"
                  required
                  placeholder="Örn: 0532 123 45 67"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Başlangıç Puanı</label>
                <input
                  type="number"
                  min={0}
                  value={loyaltyPoints}
                  onChange={e => setLoyaltyPoints(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Özel Not / Tercihler</label>
                <textarea
                  rows={2}
                  placeholder="Örn: Sahil tarafında oturmayı sever, şekersiz latte içer"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl font-bold text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  Müşteriyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-6 w-full max-w-md shadow-2xl border border-stone-200 dark:border-stone-800 dark:text-stone-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="text-xl font-black text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <Edit2 className="text-orange-600 dark:text-orange-400" size={20} />
                Müşteri Bilgilerini Güncelle
              </h3>
              <button 
                onClick={() => setEditingCustomer(null)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Müşteri Ad Soyad</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Telefon Numarası</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Sadakat Puanı</label>
                <input
                  type="number"
                  min={0}
                  value={loyaltyPoints}
                  onChange={e => setLoyaltyPoints(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Özel Not / Tercihler</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="flex-1 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl font-bold text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  Güncellemeyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
