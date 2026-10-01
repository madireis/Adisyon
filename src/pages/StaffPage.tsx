import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { 
  UserPlus, Shield, Edit2, Trash2, X, Check, KeyRound, Wifi, 
  Smartphone, Eye, EyeOff, RotateCcw, ArrowRightLeft, DoorClosed, 
  Trash2 as TrashIcon, CreditCard, Percent, Printer, BarChart3, 
  LayoutGrid, Utensils, ShieldAlert, XCircle, Users, CheckCircle2
} from 'lucide-react';
import { cn, generateId } from '@/lib/utils';
import type { Staff, UserRole, PosPermissions } from '@/types/pos';
import { useLocalNetwork } from '@/lib/useLocalNetwork';
import LocalNetworkModal from '@/components/common/LocalNetworkModal';
import { usePermissions, PERMISSION_DEFINITIONS, EDITABLE_ROLES, DEFAULT_ROLE_PERMISSIONS } from '@/lib/permissions';

export default function StaffPage() {
  const staffMembers = useLiveQuery(() => db.staff.toArray()) || [];
  const { connectedGarsons } = useLocalNetwork();
  const { 
    rolePermissionsMap, 
    updateRolePermission, 
    resetRoleToDefault, 
    resetAllToDefault,
    permissionDefinitions,
    editableRoles
  } = usePermissions();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'staff' | 'permissions'>('staff');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('waiter');
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Custom permissions for individual staff member
  const [hasCustomPermissions, setHasCustomPermissions] = useState(false);
  const [customPermState, setCustomPermState] = useState<Partial<PosPermissions>>({});

  // Password / PIN blur & reveal states
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [revealAllPins, setRevealAllPins] = useState(false);
  const [showAddPin, setShowAddPin] = useState(false);
  const [showEditPin, setShowEditPin] = useState(false);

  // Permissions filter / search
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<UserRole | 'all'>('all');

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
        return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 flex items-center gap-1 w-max"><Shield size={12} /> Patron</span>;
      case 'manager':
        return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-stone-800 text-stone-200 dark:bg-stone-200 dark:text-stone-800 flex items-center gap-1 w-max"><Shield size={12} /> Müdür</span>;
      case 'cashier':
        return <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 w-max">Kasiyer</span>;
      case 'waiter':
        return <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/60 w-max">Garson</span>;
      case 'kitchen':
        return <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 w-max">Mutfak Şefi</span>;
      case 'bar':
        return <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 w-max">Bar & Kahve</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 w-max">{role}</span>;
    }
  };

  const getPermissionIcon = (iconName: string) => {
    switch (iconName) {
      case 'ArrowRightLeft':
        return <ArrowRightLeft className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case 'DoorClosed':
        return <DoorClosed className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case 'Trash2':
        return <TrashIcon className="w-4 h-4 text-red-500" />;
      case 'XCircle':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'CreditCard':
        return <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'Percent':
        return <Percent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'Printer':
        return <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'BarChart3':
        return <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'LayoutGrid':
        return <LayoutGrid className="w-4 h-4 text-stone-600 dark:text-stone-400" />;
      case 'Utensils':
        return <Utensils className="w-4 h-4 text-stone-600 dark:text-stone-400" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Shield className="w-4 h-4 text-orange-600" />;
    }
  };

  const toggleActive = async (member: Staff) => {
    await db.staff.update(member.id, { active: !member.active });
  };

  const togglePinVisibility = (staffId: string) => {
    setRevealedPins(prev => ({
      ...prev,
      [staffId]: !prev[staffId]
    }));
  };

  const toggleAllPins = () => {
    const next = !revealAllPins;
    setRevealAllPins(next);
    const updated: Record<string, boolean> = {};
    staffMembers.forEach((m: Staff) => {
      updated[m.id] = next;
    });
    setRevealedPins(updated);
  };

  const getNextUsername = () => {
    const nums = staffMembers.map(s => parseInt(s.username || '0', 10)).filter(n => !isNaN(n) && n >= 1000);
    const max = nums.length > 0 ? Math.max(...nums) : 1000;
    return (max + 1).toString();
  };

  const openAddModal = () => {
    setName('');
    setUsername(getNextUsername());
    setRole('waiter');
    setPin('');
    setShowAddPin(false);
    setHasCustomPermissions(false);
    setCustomPermState({});
    setErrorMessage('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (member: Staff) => {
    setEditingStaff(member);
    setName(member.name);
    setUsername(member.username || '');
    setRole(member.role);
    setPin(member.pin);
    setShowEditPin(false);
    const hasCustom = Boolean(member.customPermissions && Object.keys(member.customPermissions).length > 0);
    setHasCustomPermissions(hasCustom);
    setCustomPermState(member.customPermissions || {});
    setErrorMessage('');
  };

  const handleSaveNewStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Personel adı boş bırakılamaz');
      return;
    }
    if (!username.trim() || !/^\d+$/.test(username.trim())) {
      setErrorMessage('Kullanıcı Numarası sadece rakamlardan oluşmalıdır (Örn: 1008)');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setErrorMessage('PIN kodu tam olarak 4 haneli rakam olmalıdır (Örn: 1234)');
      return;
    }

    // Check duplicate Username
    const existingUser = staffMembers.find(s => s.username === username.trim());
    if (existingUser) {
      setErrorMessage(`Bu Kullanıcı Numarası (${username.trim()}) zaten ${existingUser.name} tarafından kullanılıyor`);
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
        username: username.trim(),
        role,
        pin: pin.trim(),
        active: true,
        customPermissions: hasCustomPermissions ? customPermState : undefined,
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
    if (!username.trim() || !/^\d+$/.test(username.trim())) {
      setErrorMessage('Kullanıcı Numarası sadece rakamlardan oluşmalıdır (Örn: 1008)');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setErrorMessage('PIN kodu tam olarak 4 haneli rakam olmalıdır (Örn: 1234)');
      return;
    }

    // Check duplicate Username
    const existingUser = staffMembers.find(s => s.username === username.trim() && s.id !== editingStaff.id);
    if (existingUser) {
      setErrorMessage(`Bu Kullanıcı Numarası (${username.trim()}) zaten ${existingUser.name} tarafından kullanılıyor`);
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
        username: username.trim(),
        role,
        pin,
        customPermissions: hasCustomPermissions ? customPermState : undefined,
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

  const handleResetAllPermissions = async () => {
    if (confirm('Tüm rollerin yetkilerini fabrika varsayılan ayarlarına döndürmek istediğinize emin misiniz?')) {
      await resetAllToDefault();
    }
  };

  // Group permissions by category
  const categories = ['Masa & Adisyon', 'Ödeme & Finans', 'Yönetim & Menü'] as const;

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto dark:bg-stone-950 dark:text-stone-100 select-none pb-24 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
            Personel & Yetki Yönetimi
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Personel hesapları, PIN kodları ve rollere özel yetkilendirme
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            type="button"
            onClick={() => setIsNetworkModalOpen(true)}
            className="flex-1 sm:flex-initial bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <Wifi size={16} />
            <span>WiFi & Ağ</span>
          </button>
          <button 
            type="button"
            onClick={openAddModal}
            className="flex-1 sm:flex-initial bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer active:scale-95"
          >
            <UserPlus size={16} />
            <span>Yeni Personel</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Switcher */}
      <div className="flex items-center gap-2 p-1 bg-stone-100 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 mb-6 w-full sm:w-max">
        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={cn(
            "flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer",
            activeTab === 'staff'
              ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs"
              : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
          )}
        >
          <Users size={16} />
          <span>Personel Listesi ({staffMembers.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('permissions')}
          className={cn(
            "flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer",
            activeTab === 'permissions'
              ? "bg-orange-600 text-white shadow-xs"
              : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
          )}
        >
          <Shield size={16} />
          <span>Rol Yetkileri & İzinler</span>
        </button>
      </div>

      {/* TAB 1: PERSONEL LISTESI */}
      {activeTab === 'staff' && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
          {/* Mobile Cards View (md:hidden) */}
          <div className="md:hidden divide-y divide-stone-100 dark:divide-stone-800 p-2 space-y-2.5">
            {staffMembers.map((member: Staff) => {
              const liveConnection = connectedGarsons.find(
                g => g.id === member.id || g.name.toLowerCase().includes(member.name.toLowerCase())
              );
              const isWifiOnline = liveConnection?.isOnline;
              const isPinRevealed = revealedPins[member.id] || false;
              const hasCustom = Boolean(member.customPermissions && Object.keys(member.customPermissions).length > 0);

              return (
                <div key={member.id} className="bg-stone-50/70 dark:bg-stone-950/60 p-3.5 rounded-2xl border border-stone-200/80 dark:border-stone-800 flex flex-col gap-2.5 shadow-2xs">
                  {/* Header: Avatar, Name, UserNo & Role */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-stone-800 text-orange-600 dark:text-orange-400 font-black text-sm flex items-center justify-center shrink-0 border border-orange-200 dark:border-stone-700">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-sm text-stone-900 dark:text-stone-100 truncate">{member.name}</span>
                          <span className="font-mono text-[10px] font-bold bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 px-1.5 py-0.2 rounded border border-orange-200 dark:border-orange-900">
                            #{member.username || member.id}
                          </span>
                        </div>
                        {hasCustom ? (
                          <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold block mt-0.5">
                            ★ Özel Yetki Tanımlı
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-400 block mt-0.5">
                            Standart Rol Yetkileri
                          </span>
                        )}
                        {isWifiOnline && (
                          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                            <Smartphone size={10} /> {liveConnection.deviceName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {roleBadge(member.role)}
                    </div>
                  </div>

                  {/* Details: PIN & WiFi Status */}
                  <div className="grid grid-cols-2 gap-2 bg-white dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200/60 dark:border-stone-800 text-xs">
                    <div>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold block mb-1">Giriş PIN:</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className={cn(
                          "font-bold text-stone-800 dark:text-stone-200",
                          !isPinRevealed && "filter blur-xs select-none"
                        )}>
                          {member.pin}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePinVisibility(member.id)}
                          className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                          title={isPinRevealed ? "PIN'i Gizle" : "PIN'i Göster"}
                        >
                          {isPinRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold block mb-1">WiFi Durumu:</span>
                      {isWifiOnline ? (
                        <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          Aktif Bağlı ({liveConnection.pingMs}ms)
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-400 italic">Çevrimdışı</span>
                      )}
                    </div>
                  </div>

                  {/* Footer: Status & Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 dark:border-stone-800/80 gap-2">
                    <button
                      type="button"
                      onClick={() => toggleActive(member)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer",
                        member.active 
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60" 
                          : "bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                      )}
                    >
                      {member.active ? '● Aktif' : '○ Pasif'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button 
                        type="button"
                        onClick={() => openEditModal(member)}
                        className="px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:text-orange-600 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold shadow-2xs min-h-[34px]"
                        title="Düzenle / Yetkileri Ayarla"
                      >
                        <Edit2 size={13} />
                        <span>Düzenle</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDeleteStaff(member)}
                        className="p-1.5 text-red-500 hover:text-red-700 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl transition-colors cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center shadow-2xs"
                        title="Personeli Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (hidden md:table) */}
          <table className="hidden md:table w-full text-left">
            <thead className="bg-stone-50 dark:bg-stone-950/80 text-xs uppercase tracking-wider font-bold text-stone-500 dark:text-stone-300 border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="py-3 sm:py-3.5 px-3 sm:px-6">Kullanıcı No</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-6">Personel Adı</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-6">Görevi / Rolü</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-6">Yetki Durumu</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-6">
                  <div className="flex items-center gap-1.5">
                    <span>Giriş PIN Kodu</span>
                    <button
                      type="button"
                      onClick={toggleAllPins}
                      className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                      title={revealAllPins ? "Tüm PIN'leri Bulanıklaştır" : "Tüm PIN'leri Göster"}
                    >
                      {revealAllPins ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-6">Yerel WiFi Cihazı</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-6">Durum</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-6 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-sm">
              {staffMembers.map((member: Staff) => {
                const liveConnection = connectedGarsons.find(
                  g => g.id === member.id || g.name.toLowerCase().includes(member.name.toLowerCase())
                );
                const isWifiOnline = liveConnection?.isOnline;
                const isPinRevealed = revealedPins[member.id] || false;
                const hasCustom = Boolean(member.customPermissions && Object.keys(member.customPermissions).length > 0);

                return (
                  <tr key={member.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/50 transition-colors">
                    <td className="py-3 sm:py-4 px-3 sm:px-6 font-mono font-bold text-orange-600 dark:text-orange-400">
                      <span className="bg-orange-50 dark:bg-orange-950/50 px-2.5 py-1 rounded-md text-xs border border-orange-200 dark:border-orange-900">
                        {member.username || member.id}
                      </span>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 font-bold">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <span className="font-bold text-stone-800 dark:text-stone-200 block">{member.name}</span>
                          {isWifiOnline && (
                            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Smartphone size={10} /> {liveConnection.deviceName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      {roleBadge(member.role)}
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      {hasCustom ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                          ★ Özel Yetki Tanımlı
                        </span>
                      ) : (
                        <span className="text-xs text-stone-500 dark:text-stone-400">
                          Standart Rol İzinleri
                        </span>
                      )}
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 font-mono font-bold tracking-wider">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 px-2.5 py-1 rounded-md text-xs transition-all select-none",
                          !isPinRevealed && "filter blur-xs hover:blur-none select-none"
                        )}>
                          {member.pin}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePinVisibility(member.id)}
                          className="p-1 rounded text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                          title={isPinRevealed ? "PIN'i Bulanıklaştır" : "PIN'i Göster"}
                        >
                          {isPinRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      {isWifiOnline ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          Aktif Bağlı ({liveConnection.pingMs}ms)
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-stone-400 dark:text-stone-500">
                          Çevrimdışı
                        </span>
                      )}
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <button
                        type="button"
                        onClick={() => toggleActive(member)}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer",
                          member.active 
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60" 
                            : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                        )}
                      >
                        {member.active ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button 
                          type="button"
                          onClick={() => openEditModal(member)}
                          className="p-1.5 text-stone-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                          title="Düzenle / Yetkileri Ayarla"
                        >
                          <Edit2 size={15} />
                          <span>Düzenle</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleDeleteStaff(member)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Personeli Sil"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: ROL YETKILERI & IZINLER MATRISI */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          {/* Information & Action Banner */}
          <div className="bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="text-orange-600 dark:text-orange-400" size={20} />
                <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100">
                  Rol Yetki Matrisi
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                Patron olarak personellerin rollerine göre masa taşıma, ürün silme, masa kapatma ve ödeme alma gibi yetkilerini buradan tek tıkla açıp kapatabilirsiniz.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetAllPermissions}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition-colors flex items-center gap-2 cursor-pointer shrink-0"
              title="Tüm rolleri önerilen fabrika ayarlarına döndür"
            >
              <RotateCcw size={14} />
              <span>Varsayılan Yetkilere Sıfırla</span>
            </button>
          </div>

          {/* Categorized Permissions Grid */}
          <div className="space-y-6">
            {categories.map(cat => {
              const items = permissionDefinitions.filter(p => p.category === cat);
              if (items.length === 0) return null;

              return (
                <div key={cat} className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
                  {/* Category Header */}
                  <div className="px-4 sm:px-6 py-3.5 bg-stone-50 dark:bg-stone-950/70 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
                    <h3 className="font-black text-sm text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                      {cat} Yetkileri
                    </h3>
                    <span className="text-xs text-stone-400 font-medium">
                      {items.length} Yetki Tanımı
                    </span>
                  </div>

                  {/* Permissions Table / Rows */}
                  <div className="divide-y divide-stone-100 dark:divide-stone-800">
                    {items.map(perm => (
                      <div key={perm.key} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                        {/* Left: Permission Info */}
                        <div className="flex items-start gap-3 lg:max-w-md">
                          <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-stone-800 border border-orange-100 dark:border-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                            {getPermissionIcon(perm.icon)}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-stone-900 dark:text-stone-100 block">
                              {perm.label}
                            </span>
                            <span className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed block">
                              {perm.description}
                            </span>
                          </div>
                        </div>

                        {/* Right: Role Toggles */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 lg:gap-3 shrink-0">
                          {editableRoles.map(r => {
                            const isAllowed = Boolean(rolePermissionsMap[r.role]?.[perm.key]);

                            return (
                              <button
                                key={r.role}
                                type="button"
                                onClick={() => updateRolePermission(r.role, perm.key, !isAllowed)}
                                className={cn(
                                  "p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 text-center min-w-[85px]",
                                  isAllowed
                                    ? "bg-orange-50 dark:bg-orange-950/40 border-orange-400 dark:border-orange-900/80 text-orange-950 dark:text-orange-200 ring-1 ring-orange-500/30"
                                    : "bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-400 hover:border-stone-300 dark:hover:border-stone-700"
                                )}
                                title={`${r.label} için ${perm.label} yetkisini ${isAllowed ? 'Kaldır' : 'Ver'}`}
                              >
                                <span className={cn("text-[11px] font-black", isAllowed ? "text-orange-600 dark:text-orange-400" : "text-stone-600 dark:text-stone-400")}>
                                  {r.label}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] font-bold">
                                  {isAllowed ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                      <Check size={11} strokeWidth={3} /> Yetkili
                                    </span>
                                  ) : (
                                    <span className="text-stone-400">
                                      Yetkisiz
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-6 w-full max-w-lg shadow-2xl border border-stone-200 dark:border-stone-800 dark:text-stone-100 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-stone-100 dark:border-stone-800 shrink-0">
              <h3 className="text-lg sm:text-xl font-black text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <UserPlus className="text-orange-600" size={22} />
                Yeni Personel Ekle
              </h3>
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveNewStaff} className="space-y-4 overflow-y-auto pr-1 flex-1">
              {errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-bold rounded-xl border border-red-200 dark:border-red-900">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Kullanıcı Numarası (Sadece Rakamlar)</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 1008"
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ahmet Yılmaz"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 dark:bg-stone-950 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Görevi / Pozisyonu</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold bg-white dark:bg-stone-950 cursor-pointer"
                >
                  {roleOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Giriş PIN Kodu (4 Hane)</label>
                <div className="relative">
                  <input
                    type={showAddPin ? "text" : "password"}
                    maxLength={4}
                    required
                    placeholder="••••"
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 dark:bg-stone-950 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono tracking-widest text-center text-lg font-bold pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPin(!showAddPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                    title={showAddPin ? "PIN'i Gizle" : "PIN'i Göster"}
                  >
                    {showAddPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Kişiye Özel Yetkiler Accordion */}
              <div className="pt-3 border-t border-stone-200 dark:border-stone-800">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">Kişiye Özel Yetki Tanımla</span>
                    <span className="text-[10px] text-stone-400">Rolün varsayılan yetkilerinden farklı yetkiler atamak için açın</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasCustomPermissions(!hasCustomPermissions)}
                    className={cn(
                      "w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0",
                      hasCustomPermissions ? "bg-orange-600" : "bg-stone-300 dark:bg-stone-700"
                    )}
                  >
                    <span className={cn(
                      "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-xs",
                      hasCustomPermissions ? "left-[22px]" : "left-0.5"
                    )} />
                  </button>
                </div>

                {hasCustomPermissions && (
                  <div className="space-y-1.5 p-3 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 max-h-48 overflow-y-auto">
                    {permissionDefinitions.map(def => {
                      const activeVal = customPermState[def.key] !== undefined 
                        ? Boolean(customPermState[def.key]) 
                        : Boolean(rolePermissionsMap[role]?.[def.key]);

                      return (
                        <label key={def.key} className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800/50 cursor-pointer">
                          <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">{def.label}</span>
                          <input
                            type="checkbox"
                            checked={activeVal}
                            onChange={e => setCustomPermState(prev => ({ ...prev, [def.key]: e.target.checked }))}
                            className="w-4 h-4 rounded text-orange-600 accent-orange-600 cursor-pointer"
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-3 flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 border border-stone-200 dark:border-stone-800 rounded-xl font-bold text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
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

      {/* Edit Staff / Change PIN / Permissions Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-6 w-full max-w-lg shadow-2xl border border-stone-200 dark:border-stone-800 dark:text-stone-100 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-stone-100 dark:border-stone-800 shrink-0">
              <h3 className="text-lg sm:text-xl font-black text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <KeyRound className="text-orange-600" size={22} />
                Personel Bilgileri & Yetkileri
              </h3>
              <button 
                type="button"
                onClick={() => setEditingStaff(null)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="space-y-4 overflow-y-auto pr-1 flex-1">
              {errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-bold rounded-xl border border-red-200 dark:border-red-900">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Kullanıcı Numarası (Sadece Rakamlar)</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 1008"
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 dark:bg-stone-950 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Görevi / Pozisyonu</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold bg-white dark:bg-stone-950 cursor-pointer"
                >
                  {roleOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Giriş PIN Kodu (4 Hane)</label>
                <div className="relative">
                  <input
                    type={showEditPin ? "text" : "password"}
                    maxLength={4}
                    required
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 dark:bg-stone-950 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono tracking-widest text-center text-lg font-bold pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPin(!showEditPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                    title={showEditPin ? "PIN'i Gizle" : "PIN'i Göster"}
                  >
                    {showEditPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Kişiye Özel Yetkiler Accordion */}
              <div className="pt-3 border-t border-stone-200 dark:border-stone-800">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">Kişiye Özel Yetki Tanımla</span>
                    <span className="text-[10px] text-stone-400">Rol yetkilerini ezmek veya bu kişiye özel izin vermek için açın</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasCustomPermissions(!hasCustomPermissions)}
                    className={cn(
                      "w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0",
                      hasCustomPermissions ? "bg-orange-600" : "bg-stone-300 dark:bg-stone-700"
                    )}
                  >
                    <span className={cn(
                      "w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-xs",
                      hasCustomPermissions ? "left-[22px]" : "left-0.5"
                    )} />
                  </button>
                </div>

                {hasCustomPermissions && (
                  <div className="space-y-1.5 p-3 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 max-h-48 overflow-y-auto">
                    {permissionDefinitions.map(def => {
                      const activeVal = customPermState[def.key] !== undefined 
                        ? Boolean(customPermState[def.key]) 
                        : Boolean(rolePermissionsMap[role]?.[def.key]);

                      return (
                        <label key={def.key} className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800/50 cursor-pointer">
                          <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">{def.label}</span>
                          <input
                            type="checkbox"
                            checked={activeVal}
                            onChange={e => setCustomPermState(prev => ({ ...prev, [def.key]: e.target.checked }))}
                            className="w-4 h-4 rounded text-orange-600 accent-orange-600 cursor-pointer"
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-3 flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="flex-1 py-2.5 border border-stone-200 dark:border-stone-800 rounded-xl font-bold text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
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

      {/* Yerel Ağ WiFi Modalı */}
      <LocalNetworkModal 
        isOpen={isNetworkModalOpen} 
        onClose={() => setIsNetworkModalOpen(false)} 
      />
    </div>
  );
}
