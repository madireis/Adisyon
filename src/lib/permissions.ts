import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useApp } from '@/lib/store';
import type { PosPermissions, RolePermissionsRecord, Staff, UserRole } from '@/types/pos';

export type PermissionCategoryKey = 'tables' | 'orders' | 'cashier' | 'kitchen' | 'menu' | 'staff';

export interface PermissionCategoryInfo {
  key: PermissionCategoryKey;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const PERMISSION_CATEGORIES: PermissionCategoryInfo[] = [
  {
    key: 'tables',
    label: 'Masalar & Salon',
    description: 'Masa açma, taşıma, birleştirme, salon krokisi ve masa silme yetkileri',
    icon: 'LayoutGrid',
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
  },
  {
    key: 'orders',
    label: 'Sipariş & Adisyon',
    description: 'Sipariş alma, masadan ürün çekme/silme, adisyon iptali, indirim ve fiş yazdırma',
    icon: 'UtensilsCrossed',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
  },
  {
    key: 'cashier',
    label: 'Kasa & Ödeme',
    description: 'Ödeme alma, hesap kapatma, kasa sayfası, ciro & Z-raporu ve kasa hareketleri',
    icon: 'Banknote',
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
  },
  {
    key: 'kitchen',
    label: 'Mutfak & Bar',
    description: 'Mutfak/Bar ekranına erişim ve sipariş hazırlık durumunu değiştirme yetkileri',
    icon: 'ChefHat',
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900',
  },
  {
    key: 'menu',
    label: 'Menü & Stok',
    description: 'Menü ekranı, ürün/fiyat yönetimi ve stokta var/tükendi durumunu değiştirme',
    icon: 'MenuSquare',
    color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900',
  },
  {
    key: 'staff',
    label: 'Personel & Yönetim',
    description: 'Personel listesi, şifre/PIN yönetimi, yetki değiştirme, işlem geçmişi ve sistem ayarları',
    icon: 'ShieldCheck',
    color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
  },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, PosPermissions> = {
  owner: {
    canViewTablesPage: true,
    canOpenTable: true,
    canTransferTable: true,
    canDeleteTable: true,
    canEditTables: true,
    canTakeOrder: true,
    canDeleteOrderItem: true,
    canCancelOrder: true,
    canApplyDiscount: true,
    canPrintReceipt: true,
    canViewReports: true,
    canTakePayment: true,
    canViewDailyZReport: true,
    canCashInOut: true,
    canViewKitchen: true,
    canUpdateKitchenStatus: true,
    canViewMenu: true,
    canManageMenu: true,
    canToggleItemAvailability: true,
    canViewStaff: true,
    canManageStaff: true,
    canManagePermissions: true,
    canViewAuditLogs: true,
    canManageSettings: true,
  },
  developer: {
    canViewTablesPage: true,
    canOpenTable: true,
    canTransferTable: true,
    canDeleteTable: true,
    canEditTables: true,
    canTakeOrder: true,
    canDeleteOrderItem: true,
    canCancelOrder: true,
    canApplyDiscount: true,
    canPrintReceipt: true,
    canViewReports: true,
    canTakePayment: true,
    canViewDailyZReport: true,
    canCashInOut: true,
    canViewKitchen: true,
    canUpdateKitchenStatus: true,
    canViewMenu: true,
    canManageMenu: true,
    canToggleItemAvailability: true,
    canViewStaff: true,
    canManageStaff: true,
    canManagePermissions: true,
    canViewAuditLogs: true,
    canManageSettings: true,
  },
  manager: {
    canViewTablesPage: true,
    canOpenTable: true,
    canTransferTable: true,
    canDeleteTable: true,
    canEditTables: true,
    canTakeOrder: true,
    canDeleteOrderItem: true,
    canCancelOrder: true,
    canApplyDiscount: true,
    canPrintReceipt: true,
    canViewReports: true,
    canTakePayment: true,
    canViewDailyZReport: true,
    canCashInOut: true,
    canViewKitchen: true,
    canUpdateKitchenStatus: true,
    canViewMenu: true,
    canManageMenu: true,
    canToggleItemAvailability: true,
    canViewStaff: true,
    canManageStaff: true,
    canManagePermissions: true,
    canViewAuditLogs: true,
    canManageSettings: true,
  },
  cashier: {
    canViewTablesPage: true,
    canOpenTable: true,
    canTransferTable: true,
    canDeleteTable: true,
    canEditTables: false,
    canTakeOrder: true,
    canDeleteOrderItem: true,
    canCancelOrder: true,
    canApplyDiscount: true,
    canPrintReceipt: true,
    canViewReports: true,
    canTakePayment: true,
    canViewDailyZReport: true,
    canCashInOut: true,
    canViewKitchen: true,
    canUpdateKitchenStatus: false,
    canViewMenu: true,
    canManageMenu: false,
    canToggleItemAvailability: true,
    canViewStaff: false,
    canManageStaff: false,
    canManagePermissions: false,
    canViewAuditLogs: true,
    canManageSettings: false,
  },
  waiter: {
    canViewTablesPage: true,
    canOpenTable: true,
    canTransferTable: true,
    canDeleteTable: false,
    canEditTables: false,
    canTakeOrder: true,
    canDeleteOrderItem: false,
    canCancelOrder: false,
    canApplyDiscount: false,
    canPrintReceipt: true,
    canViewReports: false,
    canTakePayment: false,
    canViewDailyZReport: false,
    canCashInOut: false,
    canViewKitchen: false,
    canUpdateKitchenStatus: false,
    canViewMenu: true,
    canManageMenu: false,
    canToggleItemAvailability: false,
    canViewStaff: false,
    canManageStaff: false,
    canManagePermissions: false,
    canViewAuditLogs: false,
    canManageSettings: false,
  },
  kitchen: {
    canViewTablesPage: false,
    canOpenTable: false,
    canTransferTable: false,
    canDeleteTable: false,
    canEditTables: false,
    canTakeOrder: false,
    canDeleteOrderItem: false,
    canCancelOrder: false,
    canApplyDiscount: false,
    canPrintReceipt: true,
    canViewReports: false,
    canTakePayment: false,
    canViewDailyZReport: false,
    canCashInOut: false,
    canViewKitchen: true,
    canUpdateKitchenStatus: true,
    canViewMenu: true,
    canManageMenu: false,
    canToggleItemAvailability: true,
    canViewStaff: false,
    canManageStaff: false,
    canManagePermissions: false,
    canViewAuditLogs: false,
    canManageSettings: false,
  },
  bar: {
    canViewTablesPage: false,
    canOpenTable: false,
    canTransferTable: false,
    canDeleteTable: false,
    canEditTables: false,
    canTakeOrder: false,
    canDeleteOrderItem: false,
    canCancelOrder: false,
    canApplyDiscount: false,
    canPrintReceipt: true,
    canViewReports: false,
    canTakePayment: false,
    canViewDailyZReport: false,
    canCashInOut: false,
    canViewKitchen: true,
    canUpdateKitchenStatus: true,
    canViewMenu: true,
    canManageMenu: false,
    canToggleItemAvailability: true,
    canViewStaff: false,
    canManageStaff: false,
    canManagePermissions: false,
    canViewAuditLogs: false,
    canManageSettings: false,
  },
};

export interface PermissionDefinition {
  key: keyof PosPermissions;
  label: string;
  description: string;
  category: PermissionCategoryKey;
  icon: string;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // ─── Masalar & Salon ──────────────────────────────────────────
  {
    key: 'canViewTablesPage',
    label: 'Masalar Sayfası Erişimi',
    description: 'Masalar ve salon krokisi ekranına erişebilir ve masaların durumunu görebilir.',
    category: 'tables',
    icon: 'Eye',
  },
  {
    key: 'canOpenTable',
    label: 'Masa Açma & Misafir Kabul',
    description: 'Boş masaya misafir sayısı belirleyip masayı oturuma açabilir.',
    category: 'tables',
    icon: 'PlusCircle',
  },
  {
    key: 'canTransferTable',
    label: 'Masa / Ürün Taşıma & Birleştirme',
    description: 'Masalar arasında adisyon aktarabilir, seçili ürünleri taşıyabilir veya masaları birleştirebilir.',
    category: 'tables',
    icon: 'ArrowRightLeft',
  },
  {
    key: 'canDeleteTable',
    label: 'Masa Kapatma & Boşaltma',
    description: 'Masayı boşaltabilir, hesabı sıfırlayabilir ve masayı doğrudan Boş durumuna getirebilir.',
    category: 'tables',
    icon: 'DoorClosed',
  },
  {
    key: 'canEditTables',
    label: 'Masa & Salon Kroki Düzenleme',
    description: 'Yeni masa ve salon katı ekleyebilir, krokide masaların konumlarını ve şekillerini düzenleyebilir.',
    category: 'tables',
    icon: 'LayoutGrid',
  },

  // ─── Sipariş & Adisyon ────────────────────────────────────────
  {
    key: 'canTakeOrder',
    label: 'Sipariş Alma & Ürün Ekleme',
    description: 'Masaya yeni ürün veya içecek ekleyebilir, mutfak ve bara sipariş gönderebilir.',
    category: 'orders',
    icon: 'Plus',
  },
  {
    key: 'canDeleteOrderItem',
    label: 'Masadan Ürün Çekme / Kalem İptali',
    description: 'Adisyondan mutfağa iletilmiş sipariş kalemlerini çekebilir, iptal edip adisyondan silebilir.',
    category: 'orders',
    icon: 'Trash2',
  },
  {
    key: 'canCancelOrder',
    label: 'Komple Sipariş İptali',
    description: 'Açık olan sipariş adisyonunu ve tüm içeriğini tek tıkla tamamen iptal edebilir.',
    category: 'orders',
    icon: 'XCircle',
  },
  {
    key: 'canApplyDiscount',
    label: 'İndirim & İkram Tanımlama',
    description: 'Adisyona yüzde/tutar indirim uygulayabilir veya ürünleri ikram olarak hesaptan düşebilir.',
    category: 'orders',
    icon: 'Percent',
  },
  {
    key: 'canPrintReceipt',
    label: 'Adisyon & Ara Hesap Yazdırma',
    description: 'Termal yazıcıdan ara hesap fişi, mutfak sipariş fişi veya müşteri adisyonu basabilir.',
    category: 'orders',
    icon: 'Printer',
  },

  // ─── Kasa & Ödeme ─────────────────────────────────────────────
  {
    key: 'canViewReports',
    label: 'Kasa & Raporlar Sayfası Erişimi',
    description: 'Kasa ve ciro raporları sayfasına giriş yapabilir.',
    category: 'cashier',
    icon: 'Banknote',
  },
  {
    key: 'canTakePayment',
    label: 'Ödeme Alma & Hesap Kapatma',
    description: 'Nakit, kredi kartı veya yemek çeki ile tahsilat yapıp masanın hesabını kapatabilir.',
    category: 'cashier',
    icon: 'CreditCard',
  },
  {
    key: 'canViewDailyZReport',
    label: 'Günlük Ciro & Z-Raporu Görme',
    description: 'Kasa ekranında gün sonu ciro toplamlarını, Z-raporunu ve kar özetini görebilir.',
    category: 'cashier',
    icon: 'BarChart3',
  },
  {
    key: 'canCashInOut',
    label: 'Kasa Giriş / Çıkış (Masraf & Avans)',
    description: 'Kasaya nakit para koyabilir veya kasadan harcama/avans çıkışı yapabilir.',
    category: 'cashier',
    icon: 'ArrowDownUp',
  },

  // ─── Mutfak & Bar ─────────────────────────────────────────────
  {
    key: 'canViewKitchen',
    label: 'Mutfak & Bar Ekranı Erişimi',
    description: 'Mutfak ve Bar sipariş hazırlık ekranına giriş yapabilir.',
    category: 'kitchen',
    icon: 'ChefHat',
  },
  {
    key: 'canUpdateKitchenStatus',
    label: 'Mutfak Sipariş Durumu Güncelleme',
    description: 'Gelen siparişleri "Hazırlanıyor", "Hazır" veya "Teslim Edildi" olarak işaretleyebilir.',
    category: 'kitchen',
    icon: 'CheckSquare',
  },

  // ─── Menü & Stok ──────────────────────────────────────────────
  {
    key: 'canViewMenu',
    label: 'Menü Sayfası Erişimi',
    description: 'Menü ve ürün listesi sayfasına giriş yapabilir.',
    category: 'menu',
    icon: 'MenuSquare',
  },
  {
    key: 'canManageMenu',
    label: 'Ürün & Fiyat Yönetimi',
    description: 'Yeni ürün/kategori ekleyebilir, fiyatları değiştirebilir ve ürün silebilir.',
    category: 'menu',
    icon: 'Utensils',
  },
  {
    key: 'canToggleItemAvailability',
    label: 'Ürün Stok / Tükendi Durumu Değiştirme',
    description: 'Ürünleri anında "Tükendi" veya "Stokta Var" olarak işaretleyebilir.',
    category: 'menu',
    icon: 'ToggleLeft',
  },

  // ─── Personel & Yönetim ───────────────────────────────────────
  {
    key: 'canViewStaff',
    label: 'Personel Sayfası Erişimi',
    description: 'Personel listesi sayfasına giriş yapabilir.',
    category: 'staff',
    icon: 'Users',
  },
  {
    key: 'canManageStaff',
    label: 'Personel Hesapları & PIN Yönetimi',
    description: 'Yeni personel ekleyebilir, bilgilerini düzenleyebilir, şifre/PIN kodlarını görebilir.',
    category: 'staff',
    icon: 'UserCog',
  },
  {
    key: 'canManagePermissions',
    label: 'Rol ve Personel Yetkilerini Değiştirme',
    description: 'Rol ve personel yetki matrisinde değişiklik yapabilir, izin açıp kapatabilir.',
    category: 'staff',
    icon: 'ShieldCheck',
  },
  {
    key: 'canViewAuditLogs',
    label: 'İşlem Geçmişi & Denetim Kayıtları',
    description: 'Kimin hangi masayı taşıdığı, sildiği veya ödeme aldığı gibi tüm sistem loglarını görebilir.',
    category: 'staff',
    icon: 'History',
  },
  {
    key: 'canManageSettings',
    label: 'Sistem & Restoran Ayarları Yönetimi',
    description: 'Restoran adı, logo, termal yazıcı ayarları ve ağ bağlantılarını düzenleyebilir.',
    category: 'staff',
    icon: 'Settings',
  },
];

export const EDITABLE_ROLES: { role: UserRole; label: string; description: string }[] = [
  { role: 'waiter', label: 'Garson', description: 'Masa siparişlerini alan servis personeli' },
  { role: 'cashier', label: 'Kasiyer', description: 'Kasa ve ödeme işlemlerini yürüten personel' },
  { role: 'kitchen', label: 'Mutfak Şefi', description: 'Yemek hazırlama ve mutfak ekranı' },
  { role: 'bar', label: 'Bar & Kahve', description: 'İçecek ve kahve hazırlama istasyonu' },
  { role: 'manager', label: 'Müdür / Yönetici', description: 'Restoran ve vardiya yöneticisi' },
];

/**
 * Core permission evaluator
 */
export function hasPermission(
  user: Staff | null | undefined,
  permissionKey: keyof PosPermissions,
  rolePermissionsMap?: Record<string, PosPermissions>
): boolean {
  if (!user) return false;

  // Patron (Owner) and Developer have unrestricted root access
  if (user.role === 'owner' || user.role === 'developer') {
    return true;
  }

  // 1. Check individual staff member's custom permission override if defined
  if (user.customPermissions && user.customPermissions[permissionKey] !== undefined) {
    return Boolean(user.customPermissions[permissionKey]);
  }

  // 2. Check active role permission from map (Dexie)
  if (rolePermissionsMap && rolePermissionsMap[user.role]) {
    const val = rolePermissionsMap[user.role][permissionKey];
    if (val !== undefined) return Boolean(val);
  }

  // 3. Check localStorage cache
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(`wots_perm_${user.role}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed[permissionKey] !== undefined) return Boolean(parsed[permissionKey]);
      }
    } catch {}
  }

  // 4. Fallback to default role permissions
  return DEFAULT_ROLE_PERMISSIONS[user.role]?.[permissionKey] ?? false;
}

/**
 * React hook to observe and update permissions reactively
 */
export function usePermissions() {
  const { state } = useApp();
  const currentUser = state.currentUser;

  // Live query from Dexie rolePermissions
  const records = useLiveQuery(() => db.rolePermissions.toArray(), []) || [];

  // Build role permissions map: fallback to default if not saved in Dexie
  const rolePermissionsMap = useMemo(() => {
    const map: Record<UserRole, PosPermissions> = { ...DEFAULT_ROLE_PERMISSIONS };
    for (const r of records) {
      if (r.role && r.permissions) {
        map[r.role] = { ...DEFAULT_ROLE_PERMISSIONS[r.role], ...r.permissions };
      }
    }
    return map;
  }, [records]);

  // Sync to localStorage for instant synchronous lookups
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        Object.entries(rolePermissionsMap).forEach(([role, perms]) => {
          localStorage.setItem(`wots_perm_${role}`, JSON.stringify(perms));
        });
      } catch {}
    }
  }, [rolePermissionsMap]);

  // Check if current user has a specific permission
  const checkPermission = useCallback(
    (permissionKey: keyof PosPermissions, targetUser?: Staff | null): boolean => {
      const u = targetUser !== undefined ? targetUser : currentUser;
      return hasPermission(u, permissionKey, rolePermissionsMap);
    },
    [currentUser, rolePermissionsMap]
  );

  // Update a single permission for a role
  const updateRolePermission = async (role: UserRole, permissionKey: keyof PosPermissions, value: boolean) => {
    const current = rolePermissionsMap[role] || { ...DEFAULT_ROLE_PERMISSIONS[role] };
    const updated: PosPermissions = {
      ...current,
      [permissionKey]: value,
    };

    await db.rolePermissions.put({
      role,
      permissions: updated,
      updatedAt: new Date().toISOString(),
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(`wots_perm_${role}`, JSON.stringify(updated));
    }
  };

  // Toggle all permissions for a specific category for a role
  const toggleCategoryPermissions = async (role: UserRole, categoryKey: PermissionCategoryKey, enable: boolean) => {
    const current = rolePermissionsMap[role] || { ...DEFAULT_ROLE_PERMISSIONS[role] };
    const categoryPerms = PERMISSION_DEFINITIONS.filter(p => p.category === categoryKey);
    const updated: PosPermissions = { ...current };

    for (const p of categoryPerms) {
      updated[p.key] = enable;
    }

    await db.rolePermissions.put({
      role,
      permissions: updated,
      updatedAt: new Date().toISOString(),
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(`wots_perm_${role}`, JSON.stringify(updated));
    }
  };

  // Reset a specific role or all roles to default permissions
  const resetRoleToDefault = async (role: UserRole) => {
    const def = DEFAULT_ROLE_PERMISSIONS[role];
    await db.rolePermissions.put({
      role,
      permissions: def,
      updatedAt: new Date().toISOString(),
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem(`wots_perm_${role}`, JSON.stringify(def));
    }
  };

  const resetAllToDefault = async () => {
    for (const role of EDITABLE_ROLES) {
      const def = DEFAULT_ROLE_PERMISSIONS[role.role];
      await db.rolePermissions.put({
        role: role.role,
        permissions: def,
        updatedAt: new Date().toISOString(),
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(`wots_perm_${role.role}`, JSON.stringify(def));
      }
    }
  };

  return {
    currentUser,
    rolePermissionsMap,
    hasPermission: checkPermission,
    updateRolePermission,
    toggleCategoryPermissions,
    resetRoleToDefault,
    resetAllToDefault,
    permissionCategories: PERMISSION_CATEGORIES,
    permissionDefinitions: PERMISSION_DEFINITIONS,
    editableRoles: EDITABLE_ROLES,
  };
}
