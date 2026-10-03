import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { 
  Grid2X2, 
  ChefHat, 
  MenuSquare, 
  Users, 
  Settings, 
  Menu,
  ChevronLeft,
  LogOut,
  Banknote,
  ArrowLeftRight,
  BookOpen,
  Download,
  Terminal,
  ShieldAlert,
  Package,
} from 'lucide-react';
import type { UserRole, PosPermissions } from '@/types/pos';
import { usePermissions } from '@/lib/permissions';
import { useLocalNetwork } from '@/lib/useLocalNetwork';
import { disconnectLocalClient } from '@/lib/localNetwork';
import { usePwaInstall } from '@/lib/usePwaInstall';
import LocalNetworkModal from '@/components/common/LocalNetworkModal';
import AccountSwitcherModal from '@/components/common/AccountSwitcherModal';
import PwaInstallModal from '@/components/common/PwaInstallModal';
import wotsLogo from '@/assets/logo.jpg';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles?: UserRole[];
  permission?: keyof PosPermissions;
}

export default function Layout() {
  const { state, dispatch } = useApp();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  
  const { activeGarsonCount } = useLocalNetwork();
  const { isInstalled } = usePwaInstall();
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname]);

  // Route protection: prevent access if user is not signed in
  if (!state.currentUser) {
    return <Navigate to="/login" replace />;
  }

  const user = state.currentUser;
  const isManager = user.role === 'owner' || user.role === 'manager' || user.role === 'developer';
  const hasManagerSession = Boolean(state.originalManager || isManager);
  const isSwitchedToAnotherUser = Boolean(state.originalManager && user.id !== state.originalManager.id);

  // Clean, short navigation items with granular permission checking
  const allNavItems: NavItem[] = [
    { path: '/tables', label: 'Masalar', icon: Grid2X2, permission: 'canViewTablesPage', roles: ['waiter', 'cashier', 'owner', 'manager', 'developer'] },
    { path: '/kitchen', label: 'Mutfak', icon: ChefHat, permission: 'canViewKitchen', roles: ['kitchen', 'bar', 'owner', 'manager', 'developer'] },
    { path: '/reports', label: 'Kasa', icon: Banknote, permission: 'canViewReports', roles: ['cashier', 'owner', 'manager', 'developer'] },
    { path: '/patron-logs', label: 'Patron Logları', icon: ShieldAlert, permission: 'canViewAuditLogs', roles: ['owner', 'manager', 'developer'] },
    { path: '/menu', label: 'Menü', icon: MenuSquare, permission: 'canViewMenu', roles: ['owner', 'manager', 'developer'] },
    { path: '/inventory', label: 'Stok Takibi', icon: Package, permission: 'canViewInventory', roles: ['owner', 'manager', 'kitchen', 'bar', 'cashier', 'developer'] },
    { path: '/staff', label: 'Personel', icon: Users, permission: 'canViewStaff', roles: ['owner', 'manager', 'developer'] },
    { path: '/settings', label: 'Ayarlar', icon: Settings, permission: 'canManageSettings', roles: ['owner', 'manager', 'developer'] },
    { path: '/guide', label: 'Rehber', icon: BookOpen, roles: ['owner', 'manager', 'developer'] },
    { path: '/developer', label: 'Geliştirici', icon: Terminal, roles: ['developer'] },
  ];

  const visibleNavItems = allNavItems.filter(item => {
    if (user.role === 'developer' || user.role === 'owner') return true;
    if (item.permission) {
      return hasPermission(item.permission);
    }
    return item.roles ? item.roles.includes(user.role) : true;
  });

  const isOrderPage = location.pathname.startsWith('/order/');

  const isAuthorized = () => {
    if (user.role === 'developer' || user.role === 'owner') return true;
    const currentPath = location.pathname;
    if (currentPath.startsWith('/order/')) {
      return true;
    }
    const matchedItem = allNavItems.find(item => item.path === currentPath);
    if (!matchedItem) return true;
    if (matchedItem.permission) {
      return hasPermission(matchedItem.permission);
    }
    return matchedItem.roles ? matchedItem.roles.includes(user.role) : true;
  };

  useEffect(() => {
    if (!isAuthorized()) {
      if (hasPermission('canViewTablesPage')) navigate('/tables', { replace: true });
      else if (hasPermission('canViewKitchen')) navigate('/kitchen', { replace: true });
      else if (hasPermission('canViewReports')) navigate('/reports', { replace: true });
      else navigate('/login', { replace: true });
    }
  }, [user.role, location.pathname]);

  const handleRestoreManager = () => {
    dispatch({ type: 'RESTORE_MANAGER' });
    navigate('/reports');
  };

  const handleLogout = () => {
    if (user?.id) {
      disconnectLocalClient(user.id);
    }
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
  };

  const getRoleBadge = () => {
    switch (user.role) {
      case 'developer': return 'Geliştirici';
      case 'waiter': return 'Garson';
      case 'kitchen': return 'Mutfak';
      case 'bar': return 'Bar';
      case 'cashier': return 'Kasiyer';
      case 'owner': return 'Patron';
      default: return 'Yönetici';
    }
  };

  return (
    <div className="flex h-screen bg-stone-50 dark:bg-stone-950 overflow-hidden text-stone-800 dark:text-stone-100 select-none">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden md:flex bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 transition-all duration-200 flex-col shrink-0 z-20",
          sidebarOpen ? "w-56" : "w-16"
        )}
      >
        {/* Brand Bar */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-stone-200 dark:border-stone-800 shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-2 min-w-0">
              <img 
                src={wotsLogo} 
                alt="WOT'S" 
                className="w-7 h-7 rounded-lg object-contain bg-black shrink-0" 
              />
              <span className="font-black text-sm tracking-tight text-stone-900 dark:text-white">
                WOT'S <span className="text-orange-600">POS</span>
              </span>
            </div>
          ) : (
            <img 
              src={wotsLogo} 
              alt="WOT'S" 
              className="w-7 h-7 rounded-lg object-contain bg-black mx-auto" 
            />
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center px-3 py-2 rounded-xl transition-colors font-medium text-xs min-h-[38px]",
                isActive 
                  ? "bg-orange-600 text-white font-bold" 
                  : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white"
              )}
            >
              <item.icon className={cn("shrink-0", sidebarOpen ? "mr-2.5" : "mx-auto")} size={16} />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-2 border-t border-stone-200 dark:border-stone-800 shrink-0 space-y-1">
          {sidebarOpen ? (
            <>
              {hasManagerSession && (
                <button
                  onClick={() => setIsAccountSwitcherOpen(true)}
                  className="w-full py-2 px-2.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                >
                  <ArrowLeftRight size={14} className="text-orange-600" />
                  <span>Hesap Değiştir</span>
                </button>
              )}
              {isSwitchedToAnotherUser && state.originalManager && (
                <button
                  onClick={handleRestoreManager}
                  className="w-full py-2 px-2.5 bg-stone-900 text-white dark:bg-stone-800 hover:bg-stone-800 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>{state.originalManager.name} Dön</span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="w-full py-2 px-2.5 text-stone-500 hover:text-red-600 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-2"
              >
                <LogOut size={14} />
                <span>Çıkış</span>
              </button>
            </>
          ) : (
            <button 
              onClick={handleLogout}
              className="p-2 text-stone-400 hover:text-red-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl mx-auto flex items-center justify-center transition-colors cursor-pointer"
              title="Çıkış"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative w-64 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 h-full shadow-2xl flex flex-col z-10 border-r border-stone-200 dark:border-stone-800">
            <div className="p-3.5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={wotsLogo} alt="WOT'S" className="w-7 h-7 rounded-lg object-contain bg-black" />
                <span className="font-black text-sm text-stone-900 dark:text-white">WOT'S <span className="text-orange-600">POS</span></span>
              </div>
              <button 
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {visibleNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className={({ isActive }) => cn(
                    "flex items-center px-3 py-2.5 rounded-xl font-medium text-xs",
                    isActive 
                      ? "bg-orange-600 text-white font-bold" 
                      : "text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                  )}
                >
                  <item.icon className="shrink-0 mr-2.5" size={16} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            <div className="p-3 border-t border-stone-200 dark:border-stone-800 space-y-2">
              {hasManagerSession && (
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    setIsAccountSwitcherOpen(true);
                  }}
                  className="w-full py-2 px-3 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border border-stone-200 dark:border-stone-700"
                >
                  <ArrowLeftRight size={14} className="text-orange-600" />
                  <span>Hesap Değiştir</span>
                </button>
              )}
              {!isInstalled && (
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    setIsPwaModalOpen(true);
                  }}
                  className="w-full py-2 px-3 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  <Download size={14} />
                  <span>Uygulamayı İndir</span>
                </button>
              )}
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  handleLogout();
                }}
                className="w-full py-2 px-3 text-stone-500 hover:text-red-600 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5"
              >
                <LogOut size={14} />
                <span>Çıkış Yap</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className={cn(
          "h-14 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 flex items-center justify-between px-3 sm:px-6 shrink-0 z-20 sticky top-0 transition-all",
          isOrderPage && "hidden md:flex"
        )}>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl text-stone-300 hover:text-white bg-stone-850 hover:bg-stone-800 border border-stone-750 active:scale-95 transition-all cursor-pointer"
              title="Menü"
            >
              <Menu size={18} />
            </button>

            <span className="font-black text-white text-sm tracking-tight md:hidden">
              WOT'S <span className="text-orange-500">POS</span>
            </span>

            {/* Clean neutral role indicator */}
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-stone-850 text-stone-300 border border-stone-750">
              {getRoleBadge()}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* WiFi & Garson Badge */}
            <button
              onClick={() => setIsNetworkModalOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer bg-stone-850 hover:bg-stone-800 active:scale-95 text-stone-200 border border-stone-750 shadow-xs"
              title="Ağ ve Garson Bağlantıları"
            >
              <span className={cn("w-2 h-2 rounded-full shrink-0", activeGarsonCount > 0 ? "bg-emerald-500 shadow-xs shadow-emerald-500/50" : "bg-stone-500")} />
              <span>{activeGarsonCount > 0 ? `${activeGarsonCount} Garson` : 'Yerel Ağ'}</span>
            </button>

            {/* PWA Install Button */}
            {!isInstalled && (
              <button
                onClick={() => setIsPwaModalOpen(true)}
                className="p-2 rounded-xl text-stone-300 hover:text-white bg-stone-850 hover:bg-stone-800 active:scale-95 transition-all cursor-pointer border border-stone-750 shadow-xs"
                title="Uygulamayı İndir"
              >
                <Download size={15} />
              </button>
            )}

            {/* Current user */}
            <div 
              className="px-3 py-1.5 rounded-xl bg-stone-850 text-stone-200 text-xs font-bold border border-stone-750 shadow-xs cursor-default flex items-center gap-1.5"
              title={user.name}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <span>{user.name.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* Manager impersonation banner */}
        {isSwitchedToAnotherUser && state.originalManager && (
          <div className="bg-stone-900 text-stone-200 px-3 sm:px-6 py-1.5 text-xs font-medium flex items-center justify-between shrink-0 border-b border-stone-800">
            <span className="truncate">
              Görüntülenen: <strong className="text-white">{user.name}</strong> ({user.role})
            </span>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                onClick={() => setIsAccountSwitcherOpen(true)}
                className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-white rounded text-[11px] font-medium transition-colors cursor-pointer"
              >
                Değiştir
              </button>
              <button
                onClick={handleRestoreManager}
                className="px-2 py-0.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-[11px] font-bold transition-colors cursor-pointer"
              >
                Yöneticiye Dön
              </button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100">
          <Outlet />
        </main>
      </div>

      {/* Modals */}
      <LocalNetworkModal 
        isOpen={isNetworkModalOpen} 
        onClose={() => setIsNetworkModalOpen(false)} 
      />
      <AccountSwitcherModal 
        isOpen={isAccountSwitcherOpen}
        onClose={() => setIsAccountSwitcherOpen(false)}
      />
      <PwaInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
      />
    </div>
  );
}
