import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Bell, Droplets, Receipt, CheckCircle2, ShoppingBag, Plus, Minus, Search, Sparkles } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import PosIcon from '@/components/common/PosIcon';
import type { MenuItem, Category, Table } from '@/types/pos';

export default function CustomerQRPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [callAlert, setCallAlert] = useState<string | null>(null);
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const table = useLiveQuery(async () => {
    if (!tableId) return null;
    const byId = await db.table<Table>('tables').get(tableId);
    if (byId) return byId;
    const byLabel = await db.table<Table>('tables').where('label').equalsIgnoreCase(tableId).first();
    if (byLabel) return byLabel;
    const num = parseInt(tableId, 10);
    if (!isNaN(num)) {
      return await db.table<Table>('tables').where('number').equals(num).first();
    }
    return null;
  }, [tableId]);
  const categories = useLiveQuery(() => db.categories.orderBy('order').toArray(), []) || [];
  const menuItems = useLiveQuery(() => db.menuItems.toArray(), []) || [];

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = !activeCategoryId || item.categoryId === activeCategoryId;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesCategory && matchesSearch;
  });

  const handleCall = (action: string) => {
    setCallAlert(action);
    setTimeout(() => setCallAlert(null), 3500);
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateCartQty = (itemId: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.item.id === itemId) {
        const newQ = c.quantity + delta;
        return newQ > 0 ? { ...c, quantity: newQ } : null;
      }
      return c;
    }).filter(Boolean) as { item: MenuItem; quantity: number }[]);
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 pb-28 select-none">
      {/* Brand Header */}
      <header className="bg-stone-900 text-white p-5 sticky top-0 z-30 shadow-md">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-orange-400 tracking-tight">WOT'S CAFE</h1>
            <p className="text-[11px] text-stone-400 font-medium">Dijital Menü</p>
          </div>
          <div className="bg-stone-800 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-200 border border-stone-700">
            Masa {table?.label || '12'}
          </div>
        </div>
      </header>

      {/* Action Call Banner */}
      <div className="max-w-md mx-auto p-4 space-y-3">
        {callAlert && (
          <div className="bg-emerald-600 text-white p-3 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2 shadow-lg animate-bounce">
            <CheckCircle2 size={16} />
            <span>Talebiniz garsona iletildi: "{callAlert}"</span>
          </div>
        )}

        {/* Quick Service Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleCall('Garson Çağrıldı')}
            className="p-3 bg-white text-stone-950 dark:bg-white dark:text-stone-950 hover:bg-stone-100 hover:text-black dark:hover:bg-stone-100 dark:hover:text-black border border-stone-300 dark:border-stone-300 rounded-2xl flex flex-col items-center gap-1 shadow-xs transition-colors cursor-pointer"
          >
            <Bell size={20} className="text-orange-600 dark:text-orange-600" />
            <span className="text-[11px] font-extrabold text-stone-950 dark:text-stone-950">Garson Çağır</span>
          </button>
          <button
            onClick={() => handleCall('Hesap İstendi')}
            className="p-3 bg-white text-stone-950 dark:bg-white dark:text-stone-950 hover:bg-stone-100 hover:text-black dark:hover:bg-stone-100 dark:hover:text-black border border-stone-300 dark:border-stone-300 rounded-2xl flex flex-col items-center gap-1 shadow-xs transition-colors cursor-pointer"
          >
            <Receipt size={20} className="text-emerald-600 dark:text-emerald-600" />
            <span className="text-[11px] font-extrabold text-stone-950 dark:text-stone-950">Hesap İste</span>
          </button>
          <button
            onClick={() => handleCall('Su İstendi')}
            className="p-3 bg-white text-stone-950 dark:bg-white dark:text-stone-950 hover:bg-stone-100 hover:text-black dark:hover:bg-stone-100 dark:hover:text-black border border-stone-300 dark:border-stone-300 rounded-2xl flex flex-col items-center gap-1 shadow-xs transition-colors cursor-pointer"
          >
            <Droplets size={20} className="text-sky-600 dark:text-sky-600" />
            <span className="text-[11px] font-extrabold text-stone-950 dark:text-stone-950">Su İste</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
          <input
            type="text"
            placeholder="Lezzet ara (örn: burger, latte, cheesecake)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs font-medium"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto py-1 hide-scrollbar">
          <button
            onClick={() => setActiveCategoryId('')}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer shadow-xs",
              !activeCategoryId 
                ? "bg-orange-600 text-white shadow-sm" 
                : "bg-white text-stone-950 dark:bg-white dark:text-stone-950 hover:bg-stone-100 hover:text-black dark:hover:bg-stone-100 dark:hover:text-black border border-stone-300 dark:border-stone-300"
            )}
          >
            Tümü
          </button>
          {categories.map((cat: Category) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-xs",
                activeCategoryId === cat.id 
                  ? "bg-orange-600 text-white shadow-sm" 
                  : "bg-white text-stone-950 dark:bg-white dark:text-stone-950 hover:bg-stone-100 hover:text-black dark:hover:bg-stone-100 dark:hover:text-black border border-stone-300 dark:border-stone-300"
              )}
            >
              <PosIcon name={cat.icon} className={cn("w-3.5 h-3.5 shrink-0", activeCategoryId === cat.id ? "text-white" : "text-stone-950 dark:text-stone-950")} />
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Product Feed */}
        <div className="space-y-3 pt-2">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex justify-between items-center gap-3">
              <div className="flex-1">
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">{item.name}</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2">{item.description}</p>
                <span className="text-base font-extrabold text-orange-600 dark:text-orange-400 mt-1 block">
                  {formatCurrency(item.price)}
                </span>
              </div>
              <button
                onClick={() => addToCart(item)}
                disabled={!item.available}
                className="bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:opacity-40 text-white p-2.5 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <Plus size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-stone-900 dark:bg-stone-800 text-white p-4 rounded-2xl shadow-xl flex justify-between items-center border border-stone-700 dark:border-stone-700 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="bg-orange-600 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs">
                {cart.reduce((s, c) => s + c.quantity, 0)}
              </div>
              <span className="font-bold text-sm">Sipariş Sepetim</span>
            </div>
            <span className="font-black text-base text-orange-400">{formatCurrency(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 w-full max-w-md h-full flex flex-col p-5 shadow-2xl border-l border-stone-200 dark:border-stone-800">
            <div className="flex justify-between items-center pb-4 border-b border-stone-200 dark:border-stone-800">
              <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">Masa {table?.label || '12'} Siparişi</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 text-sm font-bold cursor-pointer">
                Kapat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cart.map(c => (
                <div key={c.item.id} className="flex justify-between items-center p-3 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800">
                  <div>
                    <h4 className="font-bold text-xs text-stone-800 dark:text-stone-200">{c.item.name}</h4>
                    <span className="text-xs text-orange-600 dark:text-orange-400 font-bold">{formatCurrency(c.item.price)}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-stone-800 px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700">
                    <button onClick={() => updateCartQty(c.item.id, -1)} className="text-stone-600 dark:text-stone-300 p-1 cursor-pointer">
                      <Minus size={14} />
                    </button>
                    <span className="font-bold text-xs text-stone-900 dark:text-stone-100">{c.quantity}</span>
                    <button onClick={() => updateCartQty(c.item.id, 1)} className="text-stone-600 dark:text-stone-300 p-1 cursor-pointer">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
              <div className="flex justify-between text-base font-bold text-stone-900 dark:text-stone-100">
                <span>Toplam</span>
                <span className="text-xl font-black text-orange-600 dark:text-orange-400">{formatCurrency(cartTotal)}</span>
              </div>
              <button
                onClick={() => {
                  alert('Siparişiniz masanıza kaydedildi ve mutfağa iletildi!');
                  setCart([]);
                  setIsCartOpen(false);
                }}
                className="w-full py-4 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white rounded-2xl font-bold text-sm shadow-md transition-colors cursor-pointer"
              >
                SİPARİŞİ ONAYLA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
