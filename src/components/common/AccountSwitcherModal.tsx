import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { staffMembers as fallbackStaff } from '@/lib/mockData';
import type { Staff, UserRole } from '@/types/pos';
import { 
  X, 
  Search, 
  ArrowLeftRight, 
  ShieldCheck, 
  ChefHat, 
  UtensilsCrossed, 
  Check, 
  UserCheck,
  Smartphone,
  Coffee
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccountSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountSwitcherModal({ isOpen, onClose }: AccountSwitcherModalProps) {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // Query live staff members from IndexedDB
  const dbStaff = useLiveQuery(() => db.staff.toArray());
  const allStaff: Staff[] = (dbStaff && dbStaff.length > 0) ? dbStaff : fallbackStaff;

  if (!isOpen) return null;

  const currentUser = state.currentUser;
  const originalManager = state.originalManager;

  // Filter staff by search and role
  const filteredStaff = allStaff.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.username && s.username.includes(searchQuery)) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (selectedRoleFilter === 'waiter') {
      return s.role === 'waiter' || s.role === 'cashier';
    }
    if (selectedRoleFilter === 'kitchen') {
      return s.role === 'kitchen' || s.role === 'bar';
    }
    if (selectedRoleFilter === 'manager') {
      return s.role === 'owner' || s.role === 'manager';
    }

    return true;
  });

  const handleSelectAccount = (staff: Staff) => {
    if (staff.active === false) {
      alert(`"${staff.name}" hesabı pasif durumdadır. Lütfen aktif bir hesap seçiniz.`);
      return;
    }

    dispatch({ type: 'SWITCH_ACCOUNT', user: staff });

    // Intelligently route to selected staff's primary workspace
    if (staff.role === 'waiter' || staff.role === 'cashier') {
      navigate('/tables');
    } else if (staff.role === 'kitchen' || staff.role === 'bar') {
      navigate('/kitchen');
    } else {
      navigate('/dashboard');
    }

    onClose();
  };

  const handleRestoreManager = () => {
    dispatch({ type: 'RESTORE_MANAGER' });
    navigate('/dashboard');
    onClose();
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return <span className="bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-purple-200 dark:border-purple-800">Patron</span>;
      case 'manager':
        return <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-indigo-200 dark:border-indigo-800">Yönetici</span>;
      case 'kitchen':
        return <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-blue-200 dark:border-blue-800">Mutfak Şefi</span>;
      case 'bar':
        return <span className="bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-teal-200 dark:border-teal-800">Barista</span>;
      case 'cashier':
        return <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-amber-200 dark:border-amber-800">Kasiyer</span>;
      case 'waiter':
      default:
        return <span className="bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-orange-200 dark:border-orange-800">Garson</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-600/20">
              <ArrowLeftRight size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 leading-tight">
                Hesaplar Arası Hızlı Geçiş
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Yönetici yetkisiyle dilediğiniz personel hesabına PIN girmeden geçiş yapın
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
            title="Kapat"
          >
            <X size={20} />
          </button>
        </div>

        {/* Switched Session Banner (if not currently on manager account) */}
        {originalManager && currentUser.id !== originalManager.id && (
          <div className="p-3 bg-amber-500/15 border-b border-amber-500/30 flex items-center justify-between gap-2 px-4 sm:px-5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              <ShieldCheck size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                Şu an <strong>{currentUser.name}</strong> olarak aktifsini̇z.
              </span>
            </div>
            <button
              onClick={handleRestoreManager}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <ShieldCheck size={13} />
              <span>{originalManager.name} Hesabına Dön</span>
            </button>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="p-3 sm:p-4 border-b border-stone-100 dark:border-stone-800/80 bg-stone-50/40 dark:bg-stone-950/40 space-y-2.5">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Personel adı veya Kullanıcı No ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: `Tümü (${allStaff.length})` },
              { id: 'waiter', label: 'Garson / Kasiyer' },
              { id: 'kitchen', label: 'Mutfak / Bar' },
              { id: 'manager', label: 'Yönetici / Patron' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedRoleFilter(tab.id)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                  selectedRoleFilter === tab.id
                    ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs"
                    : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Staff List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {filteredStaff.length === 0 ? (
            <div className="text-center py-10 text-stone-400 dark:text-stone-500 text-xs sm:text-sm">
              Arama kriterlerine uygun personel hesabı bulunamadı.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredStaff.map((staff) => {
                const isCurrent = staff.id === currentUser.id;
                const isOrigManager = originalManager && staff.id === originalManager.id;

                return (
                  <button
                    key={staff.id}
                    onClick={() => handleSelectAccount(staff)}
                    disabled={isCurrent}
                    className={cn(
                      "p-3 rounded-2xl border text-left flex items-center justify-between transition-all group cursor-pointer",
                      isCurrent
                        ? "bg-orange-50/50 dark:bg-orange-950/20 border-orange-500/80 ring-2 ring-orange-500/20 cursor-default"
                        : "bg-white dark:bg-stone-900/90 border-stone-200 dark:border-stone-800 hover:border-orange-500 hover:shadow-md hover:bg-orange-50/20 dark:hover:bg-stone-800/60"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border transition-all",
                        isCurrent 
                          ? "bg-orange-600 text-white border-orange-500"
                          : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 group-hover:bg-orange-100 group-hover:text-orange-700 dark:group-hover:bg-stone-700"
                      )}>
                        {staff.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100 truncate group-hover:text-orange-600 transition-colors">
                            {staff.name}
                          </span>
                          {isOrigManager && (
                            <span className="text-[9px] font-black bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 px-1.5 py-0.2 rounded-md">
                              Ana Yetkili
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {getRoleBadge(staff.role)}
                          <span className="text-[11px] font-mono font-bold text-stone-400 dark:text-stone-500">
                            No: {staff.username || staff.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {isCurrent ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-100 dark:bg-orange-950/80 px-2 py-1 rounded-xl">
                          <Check size={14} />
                          <span className="hidden sm:inline">Aktif</span>
                        </div>
                      ) : (
                        <div className="p-2 text-stone-400 group-hover:text-orange-600 transition-colors">
                          <ArrowLeftRight size={16} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <span>Toplam {allStaff.length} personel hesabı kayıtlı</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
