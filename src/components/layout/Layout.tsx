import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useApp, defaultUser } from '@/lib/store';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Grid2X2, 
  ChefHat, 
  MenuSquare, 
  PackageSearch, 
  Users, 
  UserCircle, 
  CalendarClock, 
  BarChart3, 
  Globe, 
  History, 
  Settings, 
  Menu,
  ChevronLeft,
  Smartphone,
  LogOut,
  UtensilsCrossed,
  ShieldCheck,
  Coffee,
  Sun,
  Moon,
  Wifi,
  QrCode
} from 'lucide-react';
import type { UserRole } from '@/types/pos';
import { useTheme } from '@/lib/theme';
import { useLocalNetwork } from '@/lib/useLocalNetwork';
import LocalNetworkModal from '@/components/common/LocalNetworkModal';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}

export default function Layout() {
  const { state, dispatch } = useApp();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  
  const { isWifiConnected, activeGarsonCount } = useLocalNetwork();
  
  const user = state.currentUser || defaultUser;
  const isManager = user.role === 'owner' || user.role === 'manager';

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname]);

  const allNavItems: NavItem[] = [
    // Garson & Yetkili
    { path: '/tables', label: 'Masa Planı', icon: Grid2X2, roles: ['waiter', 'owner', 'manager'] },
    
    // Mutfak & Yetkili
    { path: '/kitchen', label: 'Mutfak Ekranı (KDS)', icon: ChefHat, roles: ['kitchen', 'owner', 'manager'] },

    // Yalnızca Yetkili / Patron
    { path: '/dashboard', label: 'Yönetim Dashboard', icon: LayoutDashboard, roles: ['owner', 'manager'] },
    { path: '/reports', label: 'Finansal Raporlar', icon: BarChart3, roles: ['owner', 'manager'] },
    { path: '/menu', label: 'Menü Yönetimi', icon: MenuSquare, roles: ['owner', 'manager'] },
    { path: '/inventory', label: 'Stok & Reçeteler', icon: PackageSearch, roles: ['kitchen', 'owner', 'manager'] },
    { path: '/staff', label: 'Personel & PIN', icon: Users, roles: ['owner', 'manager'] },
    { path: '/customers', label: 'Müşteri CRM', icon: UserCircle, roles: ['owner', 'manager'] },
    { path: '/reservations', label: 'Rezervasyonlar', icon: CalendarClock, roles: ['waiter', 'owner', 'manager'] },
    { path: '/online-orders', label: 'Online Paket Sipariş', icon: Globe, roles: ['owner', 'manager'] },
    { path: '/audit', label: 'Denetim Günlüğü', icon: History, roles: ['owner', 'manager'] },
    { path: '/settings', label: 'Sistem Ayarları', icon: Settings, roles: ['owner', 'manager'] },

    // Ortak Yardımcı
    { path: '/qr/t-2', label: 'Müşteri QR Menü', icon: Smartphone, roles: ['waiter', 'owner', 'manager'] },
  ];

  // Mobile Bottom Navigation Shortcuts
  const getMobileBottomNav = () => {
    if (user.role === 'waiter') {
      return [
        { path: '/tables', label: 'Masalar', icon: Grid2X2 },
        { path: '/reservations', label: 'Rezervasyon', icon: CalendarClock },
        { path: '/qr/t-2', label: 'QR Menü', icon: Smartphone },
      ];
    }
    if (user.role === 'kitchen') {
      return [
        { path: '/kitchen', label: 'Mutfak', icon: ChefHat },
        { path: '/inventory', label: 'Stok', icon: PackageSearch },
      ];
    }
    return [
      { path: '/tables', label: 'Masalar', icon: Grid2X2 },
      { path: '/kitchen', label: 'Mutfak', icon: ChefHat },
      { path: '/dashboard', label: 'Panel', icon: LayoutDashboard },
      { path: '/reports', label: 'Raporlar', icon: BarChart3 },
    ];
  };

  // Filter nav items strictly for current role
  const visibleNavItems = allNavItems.filter(item => item.roles.includes(user.role));

  // Check if current route is an order detail page
  const isOrderPage = location.pathname.startsWith('/order/');

  // Route protection: prevent unauthorized access
  const isAuthorized = () => {
    const currentPath = location.pathname;
    
    // Order pages accessible to waiter and owner
    if (currentPath.startsWith('/order/')) {
      return user.role === 'waiter' || user.role === 'owner' || user.role === 'manager';
    }
    
    const matchedItem = allNavItems.find(item => item.path === currentPath);
    if (!matchedItem) return true; // generic routes
    return matchedItem.roles.includes(user.role);
  };

  // Redirect if unauthorized for current role
  useEffect(() => {
    if (!isAuthorized()) {
      if (user.role === 'waiter') navigate('/tables', { replace: true });
      else if (user.role === 'kitchen') navigate('/kitchen', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [user.role, location.pathname]);

  const handleRoleChange = (newRole: UserRole) => {
    const updatedUser = {
      ...user,
      role: newRole,
      name: newRole === 'owner' 
        ? 'Patron (Yetkili)' 
        : newRole === 'waiter' 
          ? 'Ahmet Yılmaz (Garson)' 
          : 'Mehmet Demir (Mutfak Şefi)'
    };
    dispatch({ type: 'LOGIN', user: updatedUser });

    // Navigate to respective hero screen immediately
    if (newRole === 'waiter') navigate('/tables');
    else if (newRole === 'kitchen') navigate('/kitchen');
    else navigate('/dashboard');
  };

  const getRoleHeaderInfo = () => {
    switch (user.role) {
      case 'waiter':
        return {
          title: "GARSON TERMİNALİ",
          badge: "Sipariş & Masa Modu",
          badgeColor: "bg-orange-100 text-orange-800 border-orange-200",
        };
      case 'kitchen':
        return {
          title: "MUTFAK & BAR KDS",
          badge: "Hazırlık & İstasyon Modu",
          badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
        };
      case 'owner':
      case 'manager':
      default:
        return {
          title: "YETKİLİ & PATRON PANELİ",
          badge: "Tam Yönetim Modu",
          badgeColor: "bg-stone-900 text-white border-stone-800",
        };
    }
  };

  const roleInfo = getRoleHeaderInfo();

  return (
    <div className="flex h-screen bg-stone-50 dark:bg-stone-950 overflow-hidden text-stone-800 dark:text-stone-100 select-none">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside 
        className={cn(
          "hidden md:flex bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 transition-all duration-300 flex-col shrink-0 z-20 shadow-xs",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Brand Bar */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-stone-200 dark:border-stone-800 shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Coffee size={18} />
              </div>
              <div>
                <h1 className="font-black text-lg text-orange-600 tracking-tight leading-none">WOT'S CAFE</h1>
                <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wider">Silivri Sahil POS</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-xs mx-auto">
              <Coffee size={18} />
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Current Active Mode Badge in Sidebar */}
        {sidebarOpen && (
          <div className="px-4 py-3 bg-stone-50 dark:bg-stone-950/60 border-b border-stone-200/80 dark:border-stone-800">
            <span className="text-[10px] font-extrabold text-stone-400 dark:text-stone-500 uppercase tracking-wider block mb-1">
              Aktif Çalışma Modu
            </span>
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-stone-800 dark:text-stone-200">{roleInfo.title}</span>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border", roleInfo.badgeColor)}>
                {user.role.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Nav Links strictly filtered for this role */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center px-3 py-2.5 rounded-xl transition-all font-semibold text-xs min-h-[44px]",
                isActive 
                  ? "bg-orange-600 text-white shadow-xs font-bold" 
                  : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100"
              )}
            >
              <item.icon className={cn("shrink-0", sidebarOpen ? "mr-3" : "mx-auto")} size={18} />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </div>

        {/* Mode Switcher Footer */}
        <div className="p-3 border-t border-stone-200 shrink-0 bg-stone-50">
          {sidebarOpen ? (
            <div className="space-y-2">
              {isManager && (
                <>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Yetki / Mod Değiştir:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleRoleChange('waiter')}
                      className={cn(
                        "py-2 px-1 text-[11px] font-bold rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 min-h-[44px]",
                        user.role === 'waiter'
                          ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                          : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
                      )}
                    >
                      <UtensilsCrossed size={14} />
                      <span>Garson</span>
                    </button>
                    <button
                      onClick={() => handleRoleChange('kitchen')}
                      className={cn(
                        "py-2 px-1 text-[11px] font-bold rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 min-h-[44px]",
                        user.role === 'kitchen'
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
                      )}
                    >
                      <ChefHat size={14} />
                      <span>Mutfak</span>
                    </button>
                    <button
                      onClick={() => handleRoleChange('owner')}
                      className={cn(
                        "py-2 px-1 text-[11px] font-bold rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 min-h-[44px]",
                        user.role === 'owner'
                          ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                          : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
                      )}
                    >
                      <ShieldCheck size={14} />
                      <span>Yetkili</span>
                    </button>
                  </div>
                </>
              )}

              <button
                onClick={() => navigate('/')}
                className="w-full mt-1 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-h-[40px]"
              >
                <LogOut size={14} />
                <span>Giriş Ekranına Dön</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button 
                onClick={() => navigate('/')}
                className="p-2.5 text-stone-500 hover:text-stone-800 rounded-xl hover:bg-stone-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Çıkış Yap / Giriş Ekranı"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Slide-over Drawer */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 border-r border-stone-200 dark:border-stone-800">
            {/* Drawer Header */}
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-xs">
                  <Coffee size={18} />
                </div>
                <div>
                  <h2 className="font-black text-base text-orange-600 leading-tight">WOT'S CAFE</h2>
                  <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wider">Silivri Sahil</span>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-2 rounded-xl text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ChevronLeft size={20} />
              </button>
            </div>

            {/* Active Mode Banner */}
            <div className="p-3 bg-stone-100 dark:bg-stone-950/60 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <span className="text-xs font-black text-stone-800 dark:text-stone-200">{roleInfo.title}</span>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border", roleInfo.badgeColor)}>
                {user.role.toUpperCase()}
              </span>
            </div>

            {/* Navigation items list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {visibleNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className={({ isActive }) => cn(
                    "flex items-center px-3.5 py-3 rounded-xl transition-all font-semibold text-sm min-h-[48px]",
                    isActive 
                      ? "bg-orange-600 text-white shadow-xs font-bold" 
                      : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                  )}
                >
                  <item.icon className="shrink-0 mr-3 text-current" size={20} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            {/* Mode Switcher inside mobile drawer */}
            <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 space-y-2">
              {isManager && (
                <>
                  <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                    Mod Değiştir:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => {
                        handleRoleChange('waiter');
                        setIsMobileDrawerOpen(false);
                      }}
                      className={cn(
                        "py-2 px-1 text-[11px] font-bold rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[48px]",
                        user.role === 'waiter'
                          ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                          : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800"
                      )}
                    >
                      <UtensilsCrossed size={16} />
                      <span>Garson</span>
                    </button>
                    <button
                      onClick={() => {
                        handleRoleChange('kitchen');
                        setIsMobileDrawerOpen(false);
                      }}
                      className={cn(
                        "py-2 px-1 text-[11px] font-bold rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[48px]",
                        user.role === 'kitchen'
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800"
                      )}
                    >
                      <ChefHat size={16} />
                      <span>Mutfak</span>
                    </button>
                    <button
                      onClick={() => {
                        handleRoleChange('owner');
                        setIsMobileDrawerOpen(false);
                      }}
                      className={cn(
                        "py-2 px-1 text-[11px] font-bold rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[48px]",
                        user.role === 'owner'
                          ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                          : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800"
                      )}
                    >
                      <ShieldCheck size={16} />
                      <span>Yetkili</span>
                    </button>
                  </div>
                </>
              )}

              <button
                onClick={() => {
                  navigate('/');
                  setIsMobileDrawerOpen(false);
                }}
                className="w-full mt-1 py-2.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <LogOut size={16} />
                <span>Giriş Ekranına Dön</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-12 sm:h-13 bg-[#f8f7f5]/80 dark:bg-stone-950/80 backdrop-blur-md border-b border-stone-200/40 dark:border-stone-800/60 flex items-center justify-between px-3 sm:px-6 shrink-0 z-20 sticky top-0 transition-colors">
          <div className="flex items-center gap-2">
            {/* Mobile Hamburger Menu button */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 active:scale-95 min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer transition-all"
              title="Menüyü Aç"
            >
              <Menu size={20} />
            </button>

            <span className="font-black text-stone-900 dark:text-stone-100 text-sm tracking-tight md:hidden">
              WOT'S
            </span>

            {/* Subtle role indicator */}
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs", roleInfo.badgeColor)}>
              {user.role === 'waiter' ? 'Garson' : user.role === 'kitchen' ? 'Mutfak' : 'Yönetici'}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Local WiFi Network & Garson Presence Badge */}
            <button
              onClick={() => setIsNetworkModalOpen(true)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer border shadow-2xs active:scale-95",
                isWifiConnected
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100"
                  : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100"
              )}
              title="Yerel WiFi Ağ Durumu & Garson Telefon Bağlantılarını Göster"
            >
              <div className="relative flex h-2 w-2">
                {isWifiConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={cn("relative inline-flex rounded-full h-2 w-2", isWifiConnected ? "bg-emerald-500" : "bg-amber-500")}></span>
              </div>
              <Wifi size={14} />
              <span className="hidden sm:inline">
                WiFi {activeGarsonCount > 0 ? `(${activeGarsonCount} Garson)` : ''}
              </span>
            </button>

            {/* Theme Toggle Button (Sun / Moon) */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-full text-stone-600 dark:text-amber-400 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 active:scale-90 transition-all cursor-pointer border border-stone-200/60 dark:border-stone-800/60 shadow-2xs"
              title={resolvedTheme === 'dark' ? 'Açık Moduna Geç' : 'Koyu Moduna Geç'}
            >
              {resolvedTheme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-stone-700" />}
            </button>

            {/* Online Indicator (minimalist dot, no text) */}
            <div 
              className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/10 cursor-default" 
              title="Sistem Çevrimiçi & Aktif"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            {/* Current user avatar (compact, tooltip instead of wordy text) */}
            <div 
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center font-bold text-xs shadow-2xs cursor-default select-none border border-stone-300/40 dark:border-stone-700"
              title={`${user.name} (${user.role === 'waiter' ? 'Garson' : user.role === 'kitchen' ? 'Mutfak' : 'Yönetici'})`}
            >
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={cn("flex-1 overflow-auto bg-[#f8f7f5] dark:bg-stone-950 relative text-stone-800 dark:text-stone-100", !isOrderPage && "pb-24 md:pb-0")}>
          <Outlet />
        </main>

        {/* iOS Floating Island Tab Bar for Mobile (hidden on dedicated order page) */}
        {!isOrderPage && (
          <div className="md:hidden fixed bottom-3 left-3 right-3 z-40">
            <nav className="bg-white/85 dark:bg-stone-900/90 backdrop-blur-xl border border-white/60 dark:border-stone-800/80 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-3xl p-1.5 flex items-center justify-around">
              {getMobileBottomNav().map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all min-h-[48px] cursor-pointer active:scale-90",
                      isActive 
                        ? "bg-orange-600 text-white shadow-xs font-bold" 
                        : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 font-medium"
                    )}
                  >
                    <Icon size={18} className={cn(isActive && "scale-105 transition-transform")} />
                    <span className="text-[10px] tracking-tight mt-0.5 font-bold">{item.label}</span>
                  </NavLink>
                );
              })}
              {/* Quick Drawer Opener */}
              <button
                onClick={() => setIsMobileDrawerOpen(true)}
                className="flex-1 flex flex-col items-center justify-center py-1.5 rounded-2xl text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 font-medium min-h-[48px] cursor-pointer active:scale-90 transition-all"
              >
                <Menu size={18} />
                <span className="text-[10px] tracking-tight mt-0.5 font-bold">Menü</span>
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Yerel WiFi Ağ & Garson Bağlantı Modalı */}
      <LocalNetworkModal 
        isOpen={isNetworkModalOpen} 
        onClose={() => setIsNetworkModalOpen(false)} 
      />
    </div>
  );
}
