import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useApp } from '@/lib/store';
import type { PosPermissions, RolePermissionsRecord, Staff, UserRole } from '@/types/pos';

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, PosPermissions> = {
  owner: {
    canTransferTable: true,
    canDeleteTable: true,
    canDeleteOrderItem: true,
    canCancelOrder: true,
    canTakePayment: true,
    canApplyDiscount: true,
    canPrintReceipt: true,
    canViewReports: true,
    canEditTables: true,
    canManageMenu: true,
    canManageStaff: true,
  },
  developer: {
    canTransferTable: true,
    canDeleteTable: true,
    canDeleteOrderItem: true,
    canCancelOrder: true,
    canTakePayment: true,
    canApplyDiscount: true,
    canPrintReceipt: true,
    canViewReports: true,
    canEditTables: true,
    canManageMenu: true,
    canManageStaff: true,
  },
  manager: {
    canTransferTable: true,
    canDeleteTable: true,
    canDeleteOrderItem: true,
    canCancelOrder: true,
    canTakePayment: true,
    canApplyDiscount: true,
    canPrintReceipt: true,
    canViewReports: true,
    canEditTables: true,
    canManageMenu: true,
    canManageStaff: true,
  },
  cashier: {
    canTransferTable: true,
    canDeleteTable: true,
    canDeleteOrderItem: true,
    canCancelOrder: true,
    canTakePayment: true,
    canApplyDiscount: true,
    canPrintReceipt: true,
    canViewReports: true,
    canEditTables: false,
    canManageMenu: false,
    canManageStaff: false,
  },
  waiter: {
    canTransferTable: true,
    canDeleteTable: false,
    canDeleteOrderItem: false,
    canCancelOrder: false,
    canTakePayment: false,
    canApplyDiscount: false,
    canPrintReceipt: true,
    canViewReports: false,
    canEditTables: false,
    canManageMenu: false,
    canManageStaff: false,
  },
  kitchen: {
    canTransferTable: false,
    canDeleteTable: false,
    canDeleteOrderItem: false,
    canCancelOrder: false,
    canTakePayment: false,
    canApplyDiscount: false,
    canPrintReceipt: true,
    canViewReports: false,
    canEditTables: false,
    canManageMenu: false,
    canManageStaff: false,
  },
  bar: {
    canTransferTable: false,
    canDeleteTable: false,
    canDeleteOrderItem: false,
    canCancelOrder: false,
    canTakePayment: false,
    canApplyDiscount: false,
    canPrintReceipt: true,
    canViewReports: false,
    canEditTables: false,
    canManageMenu: false,
    canManageStaff: false,
  },
};

export interface PermissionDefinition {
  key: keyof PosPermissions;
  label: string;
  description: string;
  category: 'Masa & Adisyon' | 'Ödeme & Finans' | 'Yönetim & Menü';
  icon: string;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    key: 'canTransferTable',
    label: 'Masa / Ürün Taşıma & Birleştirme',
    description: 'Masalar arasında adisyon aktarabilir, ürün taşıyabilir veya masaları birleştirebilir.',
    category: 'Masa & Adisyon',
    icon: 'ArrowRightLeft',
  },
  {
    key: 'canDeleteTable',
    label: 'Masa Kapatma & Boşaltma',
    description: 'Masayı boşaltabilir, hesabı sıfırlayabilir ve masayı Boş durumuna getirebilir.',
    category: 'Masa & Adisyon',
    icon: 'DoorClosed',
  },
  {
    key: 'canDeleteOrderItem',
    label: 'Adisyondan Ürün Silme / İptal',
    description: 'Adisyondaki mutfağa veya bara iletilmiş sipariş kalemlerini iptal edip silebilir.',
    category: 'Masa & Adisyon',
    icon: 'Trash2',
  },
  {
    key: 'canCancelOrder',
    label: 'Komple Sipariş İptali',
    description: 'Açık olan adisyonu tamamen iptal edebilir.',
    category: 'Masa & Adisyon',
    icon: 'XCircle',
  },
  {
    key: 'canTakePayment',
    label: 'Ödeme Alma & Hesap Kapatma',
    description: 'Nakit, kredi kartı veya yemek çeki ile tahsilat yapıp masayı kapatabilir.',
    category: 'Ödeme & Finans',
    icon: 'CreditCard',
  },
  {
    key: 'canApplyDiscount',
    label: 'İndirim & İkram Tanımlama',
    description: 'Adisyona yüzde indirim uygulayabilir veya ürünleri ikram olarak işaretleyebilir.',
    category: 'Ödeme & Finans',
    icon: 'Percent',
  },
  {
    key: 'canPrintReceipt',
    label: 'Adisyon & Fiş Yazdırma',
    description: 'Termal yazıcıdan ara hesap fişi, mutfak sipariş fişi veya müşteri adisyonu basabilir.',
    category: 'Ödeme & Finans',
    icon: 'Printer',
  },
  {
    key: 'canViewReports',
    label: 'Kasa & Ciro Raporlarını Görme',
    description: 'Günlük ciro, kasa hareketleri, z-raporu ve finansal istatistikleri görüntüleyebilir.',
    category: 'Ödeme & Finans',
    icon: 'BarChart3',
  },
  {
    key: 'canEditTables',
    label: 'Masa & Kroki Düzenleme',
    description: 'Yeni masa ekleyebilir, salon krokisini düzenleyebilir, masa silebilir.',
    category: 'Yönetim & Menü',
    icon: 'LayoutGrid',
  },
  {
    key: 'canManageMenu',
    label: 'Menü & Fiyat Yönetimi',
    description: 'Ürün ekleyebilir, fiyatları değiştirebilir ve ürün stok durumunu güncelleyebilir.',
    category: 'Yönetim & Menü',
    icon: 'Utensils',
  },
  {
    key: 'canManageStaff',
    label: 'Personel & Yetki Yönetimi',
    description: 'Personel ekleyebilir, PIN kodlarını görebilir ve rol yetkilerini değiştirebilir.',
    category: 'Yönetim & Menü',
    icon: 'ShieldAlert',
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
    resetRoleToDefault,
    resetAllToDefault,
    permissionDefinitions: PERMISSION_DEFINITIONS,
    editableRoles: EDITABLE_ROLES,
  };
}
