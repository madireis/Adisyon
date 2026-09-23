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
  Bell,
  Menu,
  ChevronLeft,
  Smartphone,
  LogOut,
  UtensilsCrossed,
  ShieldCheck,
  Coffee
} from 'lucide-react';
import type { UserRole } from '@/types/pos';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}

export default function Layout() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  
  const user = state.currentUser || defaultUser;

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
        { path: '/kitchen', label: 'Mutfak', icon: ChefHat },
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
    <div className="flex h-screen bg-stone-50 overflow-hidden text-stone-800 select-none">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside 
        className={cn(
          "hidden md:flex bg-white border-r border-stone-200 transition-all duration-300 flex-col shrink-0 z-20 shadow-xs",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Brand Bar */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-stone-200 shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Coffee size={18} />
              </div>
              <div>
                <h1 className="font-black text-lg text-orange-600 tracking-tight leading-none">WOT'S CAFE</h1>
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Silivri Sahil POS</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-xs mx-auto">
              <Coffee size={18} />
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Current Active Mode Badge in Sidebar */}
        {sidebarOpen && (
          <div className="px-4 py-3 bg-stone-50 border-b border-stone-200/80">
            <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block mb-1">
              Aktif Çalışma Modu
            </span>
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-stone-800">{roleInfo.title}</span>
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
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
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

              <button
                onClick={() => navigate('/')}
                className="w-full mt-1 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-h-[40px]"
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
                title="Mod Değiştir"
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
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-xs">
                  <Coffee size={18} />
                </div>
                <div>
                  <h2 className="font-black text-base text-orange-600 leading-tight">WOT'S CAFE</h2>
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Silivri Sahil</span>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-2 rounded-xl text-stone-500 hover:bg-stone-200 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ChevronLeft size={20} />
              </button>
            </div>

            {/* Active Mode Banner */}
            <div className="p-3 bg-stone-100 border-b border-stone-200 flex items-center justify-between">
              <span className="text-xs font-black text-stone-800">{roleInfo.title}</span>
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
                      : "text-stone-700 hover:bg-stone-100"
                  )}
                >
                  <item.icon className="shrink-0 mr-3 text-current" size={20} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            {/* Mode Switcher inside mobile drawer */}
            <div className="p-3 border-t border-stone-200 bg-stone-50 space-y-2">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
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
                      : "bg-white text-stone-700 border-stone-200"
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
                      : "bg-white text-stone-700 border-stone-200"
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
                      : "bg-white text-stone-700 border-stone-200"
                  )}
                >
                  <ShieldCheck size={16} />
                  <span>Yetkili</span>
                </button>
              </div>

              <button
                onClick={() => {
                  navigate('/');
                  setIsMobileDrawerOpen(false);
                }}
                className="w-full mt-2 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
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
        <header className="h-14 sm:h-16 bg-white/80 backdrop-blur-xl border-b border-stone-200/80 flex items-center justify-between px-3 sm:px-6 shrink-0 z-20 sticky top-0">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Hamburger Menu button */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-all"
              title="Menüyü Aç"
            >
              <Menu size={22} />
            </button>

            <span className="font-black text-stone-900 text-sm sm:text-base tracking-tight truncate">
              WOT'S CAFE
            </span>
            <span className="h-4 w-px bg-stone-300 hidden sm:inline-block"></span>
            <span className={cn("text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border truncate max-w-[140px] sm:max-w-none shadow-2xs", roleInfo.badgeColor)}>
              {roleInfo.title}
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-5">
            {/* Sync & Online Status */}
            <div className="flex items-center space-x-1.5 text-xs font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200/60">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-800 text-[11px] font-extrabold hidden sm:inline-block">Çevrimiçi</span>
            </div>

            <button className="relative p-2 text-stone-500 hover:bg-stone-100 rounded-full transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center active:scale-95">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-orange-600 rounded-full border border-white"></span>
            </button>

            {/* Current user badge */}
            <div className="flex items-center space-x-2 sm:space-x-3 border-l border-stone-200 pl-2 sm:pl-4">
              <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-stone-800 leading-tight">
                  {user.name}
                </p>
                <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider leading-tight">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={cn("flex-1 overflow-auto bg-[#f8f7f5] relative", !isOrderPage && "pb-24 md:pb-0")}>
          <Outlet />
        </main>

        {/* iOS Floating Island Tab Bar for Mobile (hidden on dedicated order page) */}
        {!isOrderPage && (
          <div className="md:hidden fixed bottom-3 left-3 right-3 z-40">
            <nav className="bg-white/85 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-3xl p-1.5 flex items-center justify-around">
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
                        : "text-stone-500 hover:text-stone-900 font-medium"
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
                className="flex-1 flex flex-col items-center justify-center py-1.5 rounded-2xl text-stone-500 hover:text-stone-900 font-medium min-h-[48px] cursor-pointer active:scale-90 transition-all"
              >
                <Menu size={18} />
                <span className="text-[10px] tracking-tight mt-0.5 font-bold">Menü</span>
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
