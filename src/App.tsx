import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { db } from '@/lib/db';
import { seedDatabase } from '@/lib/mockData';
import { initSyncEngine } from '@/lib/syncEngine';
import Layout from '@/components/layout/Layout';
import LoginPage from '@/pages/LoginPage';

// Lazy loading pages
const TablesPage = lazy(() => import('@/pages/TablesPage'));
const OrderPage = lazy(() => import('@/pages/OrderPage'));
const KitchenPage = lazy(() => import('@/pages/KitchenPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const MenuPage = lazy(() => import('@/pages/MenuPage'));
const InventoryPage = lazy(() => import('@/pages/InventoryPage'));
const StaffPage = lazy(() => import('@/pages/StaffPage'));
const CustomersPage = lazy(() => import('@/pages/CustomersPage'));
const ReservationsPage = lazy(() => import('@/pages/ReservationsPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const AuditLogPage = lazy(() => import('@/pages/AuditLogPage'));
const OnlineOrdersPage = lazy(() => import('@/pages/OnlineOrdersPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const CustomerQRPage = lazy(() => import('@/pages/CustomerQRPage'));
const GuidePage = lazy(() => import('@/pages/GuidePage'));
const DeveloperPage = lazy(() => import('@/pages/DeveloperPage'));
const PatronLogsPage = lazy(() => import('@/pages/PatronLogsPage'));

const SuspenseFallback = () => (
  <div className="p-4 sm:p-8 flex items-center justify-center min-h-screen bg-stone-50 dark:bg-stone-950">
    <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  useEffect(() => {
    // 1. Initialize real-time cross-device & cross-tab synchronization
    initSyncEngine(db);

    // 2. Seed database on app mount if necessary
    seedDatabase(db).catch(console.error);
  }, []);

  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        {/* Role Selection Screen (Garson veya Yetkili Girişi) */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Public Customer QR Menu Routes */}
        <Route path="/qr/:tableId" element={<CustomerQRPage />} />
        <Route path="/qr" element={<CustomerQRPage />} />

        {/* POS Operational & Management Screens inside Layout */}
        <Route element={<Layout />}>
          <Route path="/tables" element={<TablesPage />} />
          <Route path="/order/:tableId" element={<OrderPage />} />
          <Route path="/kitchen" element={<KitchenPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/patron-logs" element={<PatronLogsPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/developer" element={<DeveloperPage />} />

          {/* Clean redirects for removed bloated routes */}
          <Route path="/dashboard" element={<Navigate to="/reports" replace />} />
          <Route path="/inventory" element={<Navigate to="/tables" replace />} />
          <Route path="/customers" element={<Navigate to="/tables" replace />} />
          <Route path="/reservations" element={<Navigate to="/tables" replace />} />
          <Route path="/online-orders" element={<Navigate to="/tables" replace />} />
          <Route path="/audit" element={<Navigate to="/patron-logs" replace />} />
        </Route>
        
        {/* Catch all redirect to role selection */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
