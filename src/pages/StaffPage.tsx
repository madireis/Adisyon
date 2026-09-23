import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { UserPlus, Shield, Edit2, Trash2, X, Check, KeyRound } from 'lucide-react';
import { cn, generateId } from '@/lib/utils';
import type { Staff, UserRole } from '@/types/pos';

export default function StaffPage() {
  const staffMembers = useLiveQuery(() => db.staff.toArray()) || [];
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('waiter');
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'waiter', label: 'Garson' },
    { value: 'cashier', label: 'Kasiyer' },
    { value: 'kitchen', label: 'Mutfak Şefi' },
    { value: 'bar', label: 'Bar & Kahve' },
    { value: 'manager', label: 'Müdür / Yönetici' },
    { value: 'owner', label: 'İşletme Sahibi (Patron)' },
  ];

  const roleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 flex items-center gap-1 w-max"><Shield size={12} /> Patron</span>;
      case 'manager':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex items-center gap-1 w-max"><Shield size={12} /> Müdür</span>;
      case 'cashier':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 w-max">Kasiyer</span>;
      case 'waiter':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 w-max">Garson</span>;
      case 'kitchen':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 w-max">Mutfak Şefi</span>;
      case 'bar':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-700 w-max">Bar & Kahve</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 w-max">{role}</span>;
    }
  };

  const toggleActive = async (member: Staff) => {
    await db.staff.update(member.id, { active: !member.active });
  };

  const openAddModal = () => {
    setName('');
    setRole('waiter');
    setPin('');
    setErrorMessage('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (member: Staff) => {
    setEditingStaff(member);
    setName(member.name);
    setRole(member.role);
    setPin(member.pin);
    setErrorMessage('');
  };

  const handleSaveNewStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Personel adı boş bırakılamaz');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setErrorMessage('PIN kodu tam olarak 4 haneli rakam olmalıdır (Örn: 1234)');
      return;
    }

    // Check duplicate PIN
    const existingPin = staffMembers.find(s => s.pin === pin);
    if (existingPin) {
      setErrorMessage(`Bu PIN kodu zaten ${existingPin.name} tarafından kullanılıyor`);
      return;
    }

    try {
      const newStaff: Staff = {
        id: generateId(),
        name: name.trim(),
        role,
        pin,
        active: true,
      };

      await db.staff.add(newStaff);
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error('Personel eklenemedi:', err);
      setErrorMessage('Personel kaydedilirken hata oluştu: ' + (err?.message || err));
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    if (!name.trim()) {
      setErrorMessage('Personel adı boş bırakılamaz');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setErrorMessage('PIN kodu tam olarak 4 haneli rakam olmalıdır (Örn: 1234)');
      return;
    }

    // Check duplicate PIN among other staff
    const existingPin = staffMembers.find(s => s.pin === pin && s.id !== editingStaff.id);
    if (existingPin) {
      setErrorMessage(`Bu PIN kodu zaten ${existingPin.name} tarafından kullanılıyor`);
      return;
    }

    try {
      await db.staff.update(editingStaff.id, {
        name: name.trim(),
        role,
        pin,
      });
      setEditingStaff(null);
    } catch (err: any) {
      console.error('Personel güncellenemedi:', err);
      setErrorMessage('Personel güncellenirken hata oluştu: ' + (err?.message || err));
    }
  };

  const handleDeleteStaff = async (member: Staff) => {
    if (staffMembers.length <= 1) {
      alert('Sistemde en az bir personel bulunmalıdır.');
      return;
    }
    if (confirm(`${member.name} isimli personeli silmek istediğinize emin misiniz?`)) {
      await db.staff.delete(member.id);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-800 tracking-tight">Personel Yönetimi</h1>
          <p className="text-stone-500 text-sm mt-1">Wot's Cafe çalışan hesapları, PIN kodları ve yetkilendirme</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          <UserPlus size={18} />
          Yeni Personel Ekle
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-stone-50 text-xs uppercase tracking-wider font-bold text-stone-500 border-b border-stone-200">
            <tr>
              <th className="py-3 sm:py-3.5 px-3 sm:px-6">Personel Adı</th>
              <th className="py-3 sm:py-3.5 px-3 sm:px-6">Görevi / Rolü</th>
              <th className="py-3 sm:py-3.5 px-3 sm:px-6">Giriş PIN Kodu</th>
              <th className="py-3 sm:py-3.5 px-3 sm:px-6">Durum</th>
              <th className="py-3 sm:py-3.5 px-3 sm:px-6 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-sm">
            {staffMembers.map((member: Staff) => (
              <tr key={member.id} className="hover:bg-stone-50/70 transition-colors">
                <td className="py-3 sm:py-4 px-3 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 font-bold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="font-bold text-stone-800">{member.name}</span>
                  </div>
                </td>
                <td className="py-3 sm:py-4 px-3 sm:px-6">
                  {roleBadge(member.role)}
                </td>
                <td className="py-3 sm:py-4 px-3 sm:px-6 font-mono text-stone-600 font-bold tracking-wider">
                  <span className="bg-stone-100 px-2.5 py-1 rounded-md text-xs">{member.pin}</span>
                </td>
                <td className="py-3 sm:py-4 px-3 sm:px-6">
                  <button
                    onClick={() => toggleActive(member)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer",
                      member.active 
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" 
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    )}
                  >
                    {member.active ? 'Aktif' : 'Pasif'}
                  </button>
                </td>
                <td className="py-3 sm:py-4 px-3 sm:px-6 text-right">
                  <div className="flex justify-end items-center gap-2">
                    <button 
                      onClick={() => openEditModal(member)}
                      className="p-1.5 text-stone-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                      title="Düzenle / PIN Değiştir"
                    >
                      <Edit2 size={15} />
                      <span>Düzenle</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteStaff(member)}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Personeli Sil"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-4 sm:p-6 w-full max-w-md shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-stone-100">
              <h3 className="text-xl font-black text-stone-800 flex items-center gap-2">
                <UserPlus className="text-orange-600" size={22} />
                Yeni Personel Ekle
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveNewStaff} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ayşe Demir"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Görevi / Pozisyonu</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold bg-white cursor-pointer"
                >
                  {roleOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Giriş PIN Kodu (4 Hane)</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="4 Haneli PIN (Örn: 1234)"
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono tracking-widest text-center text-lg font-bold"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 border border-stone-200 rounded-xl font-bold text-xs text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  Personeli Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff / Change PIN Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-4 sm:p-6 w-full max-w-md shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-stone-100">
              <h3 className="text-xl font-black text-stone-800 flex items-center gap-2">
                <KeyRound className="text-orange-600" size={22} />
                Personel Bilgileri & PIN
              </h3>
              <button 
                onClick={() => setEditingStaff(null)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Görevi / Pozisyonu</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold bg-white cursor-pointer"
                >
                  {roleOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Giriş PIN Kodu (4 Hane)</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono tracking-widest text-center text-lg font-bold"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="flex-1 py-2.5 border border-stone-200 rounded-xl font-bold text-xs text-stone-600 hover:bg-stone-50 cursor-pointer"
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
