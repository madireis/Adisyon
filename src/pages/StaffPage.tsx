import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { 
  UserPlus, Shield, Edit2, Trash2, X, Check, KeyRound, Wifi, 
  Smartphone, Eye, EyeOff, RotateCcw, ArrowRightLeft, DoorClosed, 
  CreditCard, Percent, Printer, BarChart3, LayoutGrid, Utensils, 
  XCircle, Users, CheckCircle2, Plus, PlusCircle, 
  ArrowDownUp, ChefHat, CheckSquare, MenuSquare, ToggleLeft, 
  UserCog, ShieldCheck, History, Settings, Sparkles, Filter,
  Banknote
} from 'lucide-react';
import { cn, generateId } from '@/lib/utils';
import type { Staff, UserRole, PosPermissions } from '@/types/pos';
import { useLocalNetwork } from '@/lib/useLocalNetwork';
import LocalNetworkModal from '@/components/common/LocalNetworkModal';
import { 
  usePermissions, 
  PERMISSION_CATEGORIES, 
  PERMISSION_DEFINITIONS, 
  EDITABLE_ROLES, 
  type PermissionCategoryKey
} from '@/lib/permissions';

export default function StaffPage() {
  const staffMembers = useLiveQuery(() => db.staff.toArray()) || [];
  const { connectedGarsons } = useLocalNetwork();
  const { 
    rolePermissionsMap, 
    updateRolePermission, 
    toggleCategoryPermissions,
    resetAllToDefault,
    permissionCategories,
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

  // Password / PIN reveal states
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [revealAllPins, setRevealAllPins] = useState(false);
  const [showAddPin, setShowAddPin] = useState(false);
  const [showEditPin, setShowEditPin] = useState(false);

  // Category filter state in permissions tab
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

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
      case 'Eye': return <Eye className="w-4 h-4 text-blue-500" />;
      case 'PlusCircle': return <PlusCircle className="w-4 h-4 text-blue-500" />;
      case 'ArrowRightLeft': return <ArrowRightLeft className="w-4 h-4 text-blue-500" />;
      case 'DoorClosed': return <DoorClosed className="w-4 h-4 text-blue-500" />;
      case 'LayoutGrid': return <LayoutGrid className="w-4 h-4 text-blue-500" />;
      case 'Plus': return <Plus className="w-4 h-4 text-amber-500" />;
      case 'Trash2': return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'XCircle': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'Percent': return <Percent className="w-4 h-4 text-amber-500" />;
      case 'Printer': return <Printer className="w-4 h-4 text-blue-500" />;
      case 'Banknote': return <Banknote className="w-4 h-4 text-emerald-500" />;
      case 'CreditCard': return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'BarChart3': return <BarChart3 className="w-4 h-4 text-emerald-500" />;
      case 'ArrowDownUp': return <ArrowDownUp className="w-4 h-4 text-emerald-500" />;
      case 'ChefHat': return <ChefHat className="w-4 h-4 text-purple-500" />;
      case 'CheckSquare': return <CheckSquare className="w-4 h-4 text-purple-500" />;
      case 'MenuSquare': return <MenuSquare className="w-4 h-4 text-orange-500" />;
      case 'Utensils': return <Utensils className="w-4 h-4 text-orange-500" />;
      case 'ToggleLeft': return <ToggleLeft className="w-4 h-4 text-orange-500" />;
      case 'Users': return <Users className="w-4 h-4 text-rose-500" />;
      case 'UserCog': return <UserCog className="w-4 h-4 text-rose-500" />;
      case 'ShieldCheck': return <ShieldCheck className="w-4 h-4 text-rose-500" />;
      case 'History': return <History className="w-4 h-4 text-rose-500" />;
      case 'Settings': return <Settings className="w-4 h-4 text-stone-500" />;
      default: return <Shield className="w-4 h-4 text-orange-500" />;
    }
  };

  const togglePinVisibility = (staffId: string) => {
    setRevealedPins(prev => ({
      ...prev,
      [staffId]: !prev[staffId]
    }));
  };

  const toggleActive = async (member: Staff) => {
    await db.staff.update(member.id, { active: !member.active });
  };

  const openAddModal = () => {
    setName('');
    setUsername('');
    setRole('waiter');
    setPin('');
    setHasCustomPermissions(false);
    setCustomPermState({});
    setErrorMessage('');
    setShowAddPin(false);
    setIsAddModalOpen(true);
  };

  const openEditModal = (member: Staff) => {
    setEditingStaff(member);
    setName(member.name);
    setUsername(member.username || '');
    setRole(member.role);
    setPin(member.pin);
    setHasCustomPermissions(Boolean(member.customPermissions && Object.keys(member.customPermissions).length > 0));
    setCustomPermState(member.customPermissions || {});
    setErrorMessage('');
    setShowEditPin(false);
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

    const existingUser = staffMembers.find(s => s.username === username.trim());
    if (existingUser) {
      setErrorMessage(`Bu Kullanıcı Numarası (${username.trim()}) zaten ${existingUser.name} tarafından kullanılıyor`);
      return;
    }

    const existingPin = staffMembers.find(s => s.pin === pin);
    if (existingPin) {
      setErrorMessage(`Bu PIN kodu zaten ${existingPin.name} tarafından kullanılıyor`);
      return;
    }

    const newStaff: Staff = {
      id: generateId(),
      name: name.trim(),
      username: username.trim(),
      role,
      pin,
      active: true,
      customPermissions: hasCustomPermissions ? customPermState : undefined,
    };

    try {
      await db.staff.add(newStaff);
      setIsAddModalOpen(false);
    } catch (err: any) {
      setErrorMessage('Personel eklenirken hata oluştu: ' + (err?.message || err));
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

    const existingUser = staffMembers.find(s => s.username === username.trim() && s.id !== editingStaff.id);
    if (existingUser) {
      setErrorMessage(`Bu Kullanıcı Numarası (${username.trim()}) zaten ${existingUser.name} tarafından kullanılıyor`);
      return;
    }

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

  const displayedCategories = selectedCategoryFilter === 'all'
    ? permissionCategories
    : permissionCategories.filter(c => c.key === selectedCategoryFilter);

  const toggleModalCategoryPermissions = (categoryKey: PermissionCategoryKey, enable: boolean) => {
    const categoryPerms = permissionDefinitions.filter(p => p.category === categoryKey);
    setCustomPermState(prev => {
      const next = { ...prev };
      for (const p of categoryPerms) {
        next[p.key] = enable;
      }
      return next;
    });
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto dark:bg-stone-950 dark:text-stone-100 select-none pb-24 md:pb-8 space-y-4 sm:space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight flex items-center gap-2.5">
            <Users className="text-orange-600 shrink-0" size={26} />
            <span>Personel & Yetkiler</span>
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Personel listesi, PIN kodları ve yetki matrisi
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            type="button"
            onClick={() => setIsNetworkModalOpen(true)}
            className="flex-1 sm:flex-initial bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800 px-3 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Wifi size={15} />
            <span>WiFi Ağ</span>
          </button>
          <button 
            type="button"
            onClick={openAddModal}
            className="flex-1 sm:flex-initial bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95"
          >
            <UserPlus size={15} />
            <span>Yeni Personel</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Switcher */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 w-full sm:w-max">
        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={cn(
            "flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
            activeTab === 'staff'
              ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs"
              : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
          )}
        >
          <Users size={15} />
          <span>Personel Listesi ({staffMembers.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('permissions')}
          className={cn(
            "flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
            activeTab === 'permissions'
              ? "bg-orange-600 text-white shadow-xs"
              : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
          )}
        >
          <ShieldCheck size={15} />
          <span>Yetki Matrisi</span>
        </button>
      </div>

      {/* TAB 1: PERSONEL LISTESI */}
      {activeTab === 'staff' && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden shadow-xs divide-y divide-stone-100 dark:divide-stone-800">
          {staffMembers.map((member: Staff) => {
            const liveConnection = connectedGarsons.find(
              g => g.id === member.id || g.name.toLowerCase().includes(member.name.toLowerCase())
            );
            const isWifiOnline = liveConnection?.isOnline;
            const isPinRevealed = revealAllPins || revealedPins[member.id] || false;
            const hasCustom = Boolean(member.customPermissions && Object.keys(member.customPermissions).length > 0);

            return (
              <div key={member.id} className="p-3 sm:px-4 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 font-bold text-xs shrink-0">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">{member.name}</span>
                      <span className="text-[10px] font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 px-1.5 py-0.5 rounded border border-orange-200/60 dark:border-orange-900/60">
                        #{member.username || member.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {roleBadge(member.role)}
                      {hasCustom && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">★ Özel Yetkili</span>
                      )}
                      {isWifiOnline && (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <Smartphone size={10} /> Aktif
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-2 py-0.5 rounded text-xs font-mono font-bold",
                      !isPinRevealed && "blur-xs hover:blur-none transition-all"
                    )}>
                      {member.pin}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePinVisibility(member.id)}
                      className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                    >
                      {isPinRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleActive(member)}
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors",
                      member.active 
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" 
                        : "bg-stone-100 text-stone-500 dark:bg-stone-800"
                    )}
                  >
                    {member.active ? 'Aktif' : 'Pasif'}
                  </button>

                  <button 
                    type="button"
                    onClick={() => openEditModal(member)}
                    className="p-1.5 text-stone-500 hover:text-orange-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                    title="Düzenle"
                  >
                    <Edit2 size={14} />
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleDeleteStaff(member)}
                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                    title="Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: YETKI MATRISI */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-900 p-3.5 sm:p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <ShieldCheck className="text-orange-600" size={18} />
                <span>Rol & İşlem İzinleri</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">Rol bazlı yetkileri tek tıkla açıp kapatabilirsiniz.</p>
            </div>
            <button
              type="button"
              onClick={handleResetAllPermissions}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RotateCcw size={13} />
              <span>Sıfırla</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('all')}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border",
                selectedCategoryFilter === 'all'
                  ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-transparent shadow-xs"
                  : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:bg-stone-100"
              )}
            >
              Tümü ({permissionDefinitions.length})
            </button>

            {permissionCategories.map(cat => {
              const isSelected = selectedCategoryFilter === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border",
                    isSelected
                      ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                      : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:bg-stone-100"
                  )}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Categories & Permission Rows */}
          <div className="space-y-4">
            {displayedCategories.map(cat => {
              const items = permissionDefinitions.filter(p => (p.category as string) === (cat.key as string));
              if (items.length === 0) return null;

              return (
                <div key={cat.key} className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 overflow-hidden shadow-xs">
                  <div className="px-4 py-3 bg-stone-50/50 dark:bg-stone-950/50 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center border font-bold", cat.color)}>
                        {getPermissionIcon(cat.icon)}
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100">{cat.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => toggleCategoryPermissions('waiter', cat.key, true)}
                        className="px-2 py-0.5 rounded text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                      >
                        Garsona Aç
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCategoryPermissions('waiter', cat.key, false)}
                        className="px-2 py-0.5 rounded text-[11px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      >
                        Kapat
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-stone-100 dark:divide-stone-800">
                    {items.map(perm => (
                      <div key={perm.key} className="p-3 sm:px-4 sm:py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-stone-900 dark:text-stone-100 block">{perm.label}</span>
                          <span className="text-[11px] text-stone-400 block">{perm.description}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          {editableRoles.map(r => {
                            const isAllowed = Boolean(rolePermissionsMap[r.role]?.[perm.key]);
                            return (
                              <button
                                key={r.role}
                                type="button"
                                onClick={() => updateRolePermission(r.role, perm.key, !isAllowed)}
                                className={cn(
                                  "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95",
                                  isAllowed
                                    ? "bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800"
                                    : "bg-stone-50 dark:bg-stone-950 text-stone-400 border border-stone-200 dark:border-stone-800"
                                )}
                              >
                                <span>{r.label}</span>
                                {isAllowed && <Check size={11} strokeWidth={3} className="text-emerald-500" />}
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
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-6 w-full max-w-lg shadow-2xl border border-stone-200 dark:border-stone-800 my-auto max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-stone-100 dark:border-stone-800 shrink-0">
              <h3 className="text-base sm:text-lg font-black text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <UserPlus className="text-orange-600" size={20} />
                <span>Yeni Personel Ekle</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1.5 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewStaff} className="space-y-3.5 overflow-y-auto pr-1 flex-1">
              {errorMessage && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-bold rounded-xl border border-red-200 dark:border-red-900">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Kullanıcı No (Rakam)</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 1008"
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 dark:bg-stone-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Pozisyon</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-semibold bg-white dark:bg-stone-950 cursor-pointer focus:outline-none"
                >
                  {roleOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">PIN Kodu (4 Hane)</label>
                <div className="relative">
                  <input
                    type={showAddPin ? "text" : "password"}
                    maxLength={4}
                    required
                    placeholder="••••"
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 dark:bg-stone-950 text-center text-base font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPin(!showAddPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showAddPin ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 border border-stone-200 dark:border-stone-800 rounded-xl font-bold text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-6 w-full max-w-lg shadow-2xl border border-stone-200 dark:border-stone-800 my-auto max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-stone-100 dark:border-stone-800 shrink-0">
              <h3 className="text-base sm:text-lg font-black text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <KeyRound className="text-orange-600" size={20} />
                <span>Personel Düzenle</span>
              </h3>
              <button 
                type="button"
                onClick={() => setEditingStaff(null)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1.5 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="space-y-3.5 overflow-y-auto pr-1 flex-1">
              {errorMessage && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-bold rounded-xl border border-red-200 dark:border-red-900">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Kullanıcı No</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 dark:bg-stone-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Pozisyon</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-semibold bg-white dark:bg-stone-950 cursor-pointer focus:outline-none"
                >
                  {roleOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 mb-1">PIN Kodu</label>
                <div className="relative">
                  <input
                    type={showEditPin ? "text" : "password"}
                    maxLength={4}
                    required
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-800 dark:bg-stone-950 text-center text-base font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPin(!showEditPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showEditPin ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="flex-1 py-2 border border-stone-200 dark:border-stone-800 rounded-xl font-bold text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Güncelle
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
