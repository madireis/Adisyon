import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Bell, Droplets, Receipt, CheckCircle2, ShoppingBag, Plus, Minus, Search, Sparkles, Check } from 'lucide-react';
import { cn, formatCurrency, generateId } from '@/lib/utils';
import PosIcon from '@/components/common/PosIcon';
import type { MenuItem, Category, Table, Order, KitchenTicket, KitchenStation, OrderItem } from '@/types/pos';
import wotsLogo from '@/assets/logo.jpg';

export default function CustomerQRPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [callAlert, setCallAlert] = useState<string | null>(null);
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccessBanner, setOrderSuccessBanner] = useState<string | null>(null);

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

  const handleCall = async (action: string) => {
    setCallAlert(action);
    const tableLabel = table?.label || (tableId ? `Masa ${tableId}` : 'Masa');
    try {
      await db.auditLogs.add({
        id: generateId(),
        userId: 'qr_customer',
        userName: `${tableLabel} (QR)`,
        action: action,
        details: `${tableLabel} müşterisi talepte bulundu: "${action}"`,
        entityType: 'table',
        entityId: table?.id || tableId || '',
        timestamp: new Date().toISOString(),
      });
    } catch {}
    setTimeout(() => setCallAlert(null), 4000);
  };

  const handleConfirmOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 1. Resolve table
      const targetTable = table || (tableId ? await db.table<Table>('tables').get(tableId) : null) || (await db.table<Table>('tables').toCollection().first());
      const resolvedTableId = targetTable?.id || tableId || 't-1';
      const tableLabel = targetTable?.label || (tableId ? `M${tableId}` : 'Masa 1');
      const nowIso = new Date().toISOString();

      // 2. Check if active order already exists for this table
      const existingOrder = await db.orders.where('tableId').equals(resolvedTableId)
        .filter((o: Order) => o.status !== 'paid' && o.status !== 'cancelled')
        .first();

      let orderId = existingOrder?.id;

      // 3. Map cart items to OrderItem
      const newOrderItems: OrderItem[] = cart.map(c => ({
        id: generateId(),
        orderId: orderId || '',
        menuItemId: c.item.id,
        name: c.item.name,
        quantity: c.quantity,
        unitPrice: c.item.price,
        modifiers: [],
        notes: '',
        status: 'sent',
        station: c.item.station || 'kitchen',
        addedAt: nowIso,
        addedBy: 'qr_customer',
      }));

      const cartSubtotal = cart.reduce((acc, c) => acc + c.item.price * c.quantity, 0);
      const cartTax = Math.round(cartSubtotal * 0.08);

      if (existingOrder) {
        orderId = existingOrder.id;
        const updatedItems = [
          ...existingOrder.items,
          ...newOrderItems.map(i => ({ ...i, orderId: existingOrder.id })),
        ];
        const newSubtotal = existingOrder.subtotal + cartSubtotal;
        const newTotal = newSubtotal;

        await db.orders.update(existingOrder.id, {
          items: updatedItems,
          subtotal: newSubtotal,
          total: newTotal,
          status: 'sent',
          sentToKitchenAt: nowIso,
          updatedAt: nowIso,
        });

        await db.table<Table>('tables').update(resolvedTableId, {
          status: 'occupied',
        });
      } else {
        orderId = generateId();
        const newOrder: Order = {
          id: orderId,
          tableId: resolvedTableId,
          tableLabel,
          waiterId: 'qr-customer',
          waiterName: 'QR Menü',
          status: 'sent',
          items: newOrderItems.map(i => ({ ...i, orderId: orderId! })),
          subtotal: cartSubtotal,
          discount: 0,
          tax: cartTax,
          total: cartSubtotal,
          guestCount: targetTable?.guestCount || 2,
          createdAt: nowIso,
          startedTakingAt: nowIso,
          sentToKitchenAt: nowIso,
          updatedAt: nowIso,
          notes: 'Müşteri QR Menü Siparişi',
        };

        await db.orders.add(newOrder);
        await db.table<Table>('tables').update(resolvedTableId, {
          status: 'occupied',
          currentOrderId: orderId,
          occupiedAt: nowIso,
          guestCount: targetTable?.guestCount || 2,
        });
      }

      // 4. Group new items into kitchen tickets by station
      const itemsByStation = new Map<KitchenStation, OrderItem[]>();
      for (const item of newOrderItems) {
        const station = item.station || 'kitchen';
        const existing = itemsByStation.get(station) || [];
        existing.push(item);
        itemsByStation.set(station, existing);
      }

      for (const [station, items] of itemsByStation.entries()) {
        const ticket: KitchenTicket = {
          id: generateId(),
          orderId: orderId!,
          tableLabel,
          station,
          items: items.map(i => ({
            name: i.name,
            quantity: i.quantity,
            modifiers: [],
            notes: '',
          })),
          status: 'new',
          createdAt: nowIso,
          priority: false,
        };
        await db.kitchenTickets.add(ticket);
      }

      // 5. Add Audit Log
      await db.auditLogs.add({
        id: generateId(),
        userId: 'qr_customer',
        userName: `Masa ${tableLabel} (Müşteri)`,
        action: 'QR Sipariş Mutfağa İletildi',
        details: `${tableLabel} için ${cart.length} çeşit sipariş mutfak ekranına aktarıldı.`,
        entityType: 'order',
        entityId: orderId,
        timestamp: nowIso,
      });

      // 6. Success Feedback
      setOrderSuccessBanner(`${tableLabel} siparişiniz alındı ve mutfağa iletildi! Hazırlanmaya başlanıyor.`);
      setCart([]);
      setIsCartOpen(false);
      setTimeout(() => setOrderSuccessBanner(null), 6000);
    } catch (err: any) {
      console.error('QR Sipariş Hatası:', err);
      alert('Sipariş kaydedilirken bir hata oluştu: ' + (err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
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
      <header className="bg-stone-900 text-white px-4 py-3 sm:p-5 sticky top-0 z-30 shadow-md pt-[max(env(safe-area-inset-top),0.75rem)]">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src={wotsLogo} 
              alt="WOT'S CAFE" 
              className="w-10 h-10 rounded-xl object-contain bg-black border border-orange-500/30 shadow-xs shrink-0" 
            />
            <div>
              <h1 className="text-base sm:text-lg font-black text-orange-400 tracking-tight leading-none">WOT'S CAFE</h1>
              <p className="text-[11px] text-stone-400 font-medium mt-0.5">Dijital Menü & Sipariş</p>
            </div>
          </div>
          <div className="bg-stone-800 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-200 border border-stone-700 shrink-0">
            Masa {table?.label || '12'}
          </div>
        </div>
      </header>

      {/* Action Call Banner */}
      <div className="max-w-md mx-auto p-3 sm:p-4 space-y-3">
        {orderSuccessBanner && (
          <div className="bg-emerald-600 text-white p-3.5 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2 shadow-lg animate-in slide-in-from-top duration-300">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{orderSuccessBanner}</span>
          </div>
        )}

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
            className="p-2.5 sm:p-3 bg-white text-stone-950 dark:bg-white dark:text-stone-950 hover:bg-stone-100 hover:text-black dark:hover:bg-stone-100 dark:hover:text-black border border-stone-300 dark:border-stone-300 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
          >
            <Bell size={18} className="text-orange-600 dark:text-orange-600" />
            <span className="text-[10px] sm:text-[11px] font-extrabold text-stone-950 dark:text-stone-950 text-center leading-tight">Garson Çağır</span>
          </button>
          <button
            onClick={() => handleCall('Hesap İstendi')}
            className="p-2.5 sm:p-3 bg-white text-stone-950 dark:bg-white dark:text-stone-950 hover:bg-stone-100 hover:text-black dark:hover:bg-stone-100 dark:hover:text-black border border-stone-300 dark:border-stone-300 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
          >
            <Receipt size={18} className="text-emerald-600 dark:text-emerald-600" />
            <span className="text-[10px] sm:text-[11px] font-extrabold text-stone-950 dark:text-stone-950 text-center leading-tight">Hesap İste</span>
          </button>
          <button
            onClick={() => handleCall('Su İstendi')}
            className="p-2.5 sm:p-3 bg-white text-stone-950 dark:bg-white dark:text-stone-950 hover:bg-stone-100 hover:text-black dark:hover:bg-stone-100 dark:hover:text-black border border-stone-300 dark:border-stone-300 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
          >
            <Droplets size={18} className="text-sky-600 dark:text-sky-600" />
            <span className="text-[10px] sm:text-[11px] font-extrabold text-stone-950 dark:text-stone-950 text-center leading-tight">Su İste</span>
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
        <div className="fixed bottom-safe bottom-4 left-3 right-3 max-w-md mx-auto z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-stone-900 dark:bg-stone-800 text-white p-4 rounded-2xl shadow-xl flex justify-between items-center border border-stone-700 dark:border-stone-700 cursor-pointer active:scale-98 transition-all"
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
          <div className="bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 w-full max-w-md h-full flex flex-col p-4 sm:p-5 shadow-2xl border-l border-stone-200 dark:border-stone-800 pb-safe">
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
                onClick={handleConfirmOrder}
                disabled={isSubmitting || cart.length === 0}
                className="w-full py-4 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>MUTFAĞA İLETİLİYOR...</span>
                  </>
                ) : (
                  <span>SİPARİŞİ ONAYLA</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
