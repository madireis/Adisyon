import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { db } from '@/lib/db';
import { seedDatabase } from '@/lib/mockData';
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

const SuspenseFallback = () => (
  <div className="p-4 sm:p-8 flex items-center justify-center min-h-screen bg-stone-50 dark:bg-stone-950">
    <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  useEffect(() => {
    // Seed database on app mount
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
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/audit" element={<AuditLogPage />} />
          <Route path="/online-orders" element={<OnlineOrdersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        
        {/* Catch all redirect to role selection */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
