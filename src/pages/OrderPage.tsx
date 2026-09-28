import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useApp } from '@/lib/store';
import { cn, formatCurrency, generateId } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus, Minus, Trash2, CheckCircle2, Send, CreditCard, Utensils, Sparkles, X, Receipt, Search, Printer, Clock, Users, ChefHat, Timer } from 'lucide-react';
import ModifierModal from '@/components/pos/ModifierModal';
import PaymentModal from '@/components/pos/PaymentModal';
import ThermalSlipModal from '@/components/pos/ThermalSlipModal';
import PosIcon from '@/components/common/PosIcon';
import type { OrderItem, MenuItem, Order, OrderItemModifier, KitchenTicket, KitchenStation, Table } from '@/types/pos';

export default function OrderPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const { state } = useApp();
  
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isMobileTicketOpen, setIsMobileTicketOpen] = useState(false);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [slipModalType, setSlipModalType] = useState<'kitchen' | 'receipt'>('receipt');
  const [notes, setNotes] = useState('');
  const [orderStartedAt] = useState<string>(() => new Date().toISOString());
  
  const table = useLiveQuery(() => db.table<Table>('tables').get(tableId || ''), [tableId]);
  
  const categories = useLiveQuery(() => db.categories.orderBy('order').toArray(), []) || [];
  const allMenuItems = useLiveQuery(() => db.menuItems.toArray(), []) || [];
  
  const menuItems = searchQuery.trim()
    ? allMenuItems.filter(i => 
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        i.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : (activeCategoryId 
        ? allMenuItems.filter(i => i.categoryId === activeCategoryId) 
        : allMenuItems);
  
  const order = useLiveQuery(
    async () => {
      if (!tableId) return undefined;
      const activeOrder = await db.orders.where('tableId').equals(tableId)
        .filter((o: Order) => o.status !== 'paid' && o.status !== 'cancelled')
        .first();
      return activeOrder;
    },
    [tableId]
  );

  useEffect(() => {
    if (categories.length > 0 && !activeCategoryId) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  const [localItems, setLocalItems] = useState<OrderItem[]>([]);
  
  useEffect(() => {
    if (order) {
      setLocalItems(order.items || []);
      setNotes(order.notes || '');
    } else {
      setLocalItems([]);
      setNotes('');
    }
  }, [order]);

  const getItemLineTotal = (item: OrderItem) => {
    const modsCost = (item.modifiers || []).reduce((acc, m) => acc + (m.price || 0), 0);
    return (item.unitPrice + modsCost) * item.quantity;
  };

  const handleAddItem = (item: MenuItem, modifiers: OrderItemModifier[] = []) => {
    const newItem: OrderItem = {
      id: generateId(),
      orderId: order?.id || '',
      menuItemId: item.id,
      name: item.name,
      quantity: 1,
      unitPrice: item.price,
      modifiers,
      notes: '',
      status: 'open',
      station: item.station,
      addedAt: new Date().toISOString(),
      addedBy: state.currentUser?.id || 'staff-1',
    };
    
    setLocalItems(prev => [...prev, newItem]);
  };

  const handleProductClick = (item: MenuItem) => {
    if (!item.available) return;
    
    if (item.modifierGroups && item.modifierGroups.length > 0) {
      setSelectedItem(item);
      setIsModifierModalOpen(true);
    } else {
      handleAddItem(item);
    }
  };

  const updateItemQuantity = (id: string, delta: number) => {
    setLocalItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setLocalItems(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = localItems.reduce((acc, item) => acc + getItemLineTotal(item), 0);
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal;

  const handleSendToKitchen = async () => {
    if (!tableId) return;
    if (localItems.length === 0) {
      alert('Mutfağa göndermek için en az bir ürün seçmelisiniz.');
      return;
    }

    try {
      const currentTable = table || await db.table<Table>('tables').get(tableId);
      const tableLabel = currentTable?.label || 'Masa';
      
      const nowIso = new Date().toISOString();
      let currentOrderId = order?.id;
      
      // Split new items into kitchen tickets by station
      const newItems = localItems.filter(i => i.status === 'open');
      if (newItems.length === 0 && order && (order.status === 'sent' || order.status === 'preparing' || order.status === 'ready')) {
        const resend = window.confirm('Bu adisyondaki ürünler zaten mutfağa iletilmiştir. Tekrar yeni mutfak fişi oluşturmak istiyor musunuz?');
        if (!resend) return;
      }
      const itemsToTicket = newItems.length > 0 ? newItems : localItems;
      const itemsByStation = new Map<KitchenStation, OrderItem[]>();
      for (const item of itemsToTicket) {
        const station = item.station || 'kitchen';
        const existing = itemsByStation.get(station) || [];
        existing.push(item);
        itemsByStation.set(station, existing);
      }

      if (!currentOrderId) {
        currentOrderId = generateId();
        const newOrder: Order = {
          id: currentOrderId,
          tableId,
          tableLabel,
          waiterId: state.currentUser?.id || 'staff-1',
          waiterName: state.currentUser?.name || 'Garson',
          items: localItems.map(i => ({ ...i, orderId: currentOrderId!, status: 'sent' })),
          status: 'sent',
          subtotal,
          discount: 0,
          tax,
          total,
          guestCount: currentTable?.guestCount || 2,
          createdAt: orderStartedAt || nowIso,
          startedTakingAt: orderStartedAt || nowIso,
          sentToKitchenAt: nowIso,
          updatedAt: nowIso,
          notes,
        };
        await db.orders.add(newOrder);
        await db.table<Table>('tables').update(tableId, {
          status: 'occupied',
          currentOrderId,
          occupiedAt: currentTable?.occupiedAt || orderStartedAt || nowIso,
          guestCount: currentTable?.guestCount || 2,
        });
      } else {
        await db.orders.update(currentOrderId, {
          items: localItems.map(i => ({ ...i, status: 'sent' })),
          status: 'sent',
          subtotal,
          total,
          sentToKitchenAt: order?.sentToKitchenAt || nowIso,
          updatedAt: nowIso,
          notes,
        });
        await db.table<Table>('tables').update(tableId, { status: 'occupied' });
      }

      // Create tickets for kitchen/bar/dessert
      for (const [station, items] of itemsByStation.entries()) {
        const ticket: KitchenTicket = {
          id: generateId(),
          orderId: currentOrderId,
          tableLabel,
          station,
          items: items.map(i => ({
            name: i.name,
            quantity: i.quantity,
            modifiers: (i.modifiers || []).map(m => m.name),
            notes: i.notes || '',
          })),
          status: 'new',
          createdAt: nowIso,
          priority: false,
        };
        await db.kitchenTickets.add(ticket);
      }

      // Log to audit
      await db.auditLogs.add({
        id: generateId(),
        userId: state.currentUser?.id || 'staff-1',
        userName: state.currentUser?.name || 'Garson',
        action: 'Mutfağa Gönderildi',
        details: `${tableLabel} masası için ${localItems.length} kalem sipariş iletildi.`,
        entityType: 'order',
        entityId: currentOrderId,
        timestamp: nowIso,
      });
      
      navigate('/tables');
    } catch (err: any) {
      console.error('Mutfağa gönderme hatası:', err);
      alert('Sipariş kaydedilirken bir hata oluştu: ' + (err?.message || err));
    }
  };

  const handleSave = async () => {
    if (!tableId) return;
    if (localItems.length === 0 && !order) {
      navigate('/tables');
      return;
    }

    try {
      const currentTable = table || await db.table<Table>('tables').get(tableId);
      const tableLabel = currentTable?.label || 'Masa';
      const nowIso = new Date().toISOString();
      let currentOrderId = order?.id;

      if (!currentOrderId && localItems.length > 0) {
        currentOrderId = generateId();
        const newOrder: Order = {
          id: currentOrderId,
          tableId,
          tableLabel,
          waiterId: state.currentUser?.id || 'staff-1',
          waiterName: state.currentUser?.name || 'Garson',
          items: localItems.map(i => ({ ...i, orderId: currentOrderId! })),
          status: 'open',
          subtotal,
          discount: 0,
          tax,
          total,
          guestCount: currentTable?.guestCount || 2,
          startedTakingAt: orderStartedAt || nowIso,
          createdAt: orderStartedAt || nowIso,
          updatedAt: nowIso,
          notes,
        };
        await db.orders.add(newOrder);
        await db.table<Table>('tables').update(tableId, {
          status: 'occupied',
          currentOrderId,
          occupiedAt: currentTable?.occupiedAt || orderStartedAt || nowIso,
          guestCount: currentTable?.guestCount || 2,
        });
      } else if (currentOrderId) {
        await db.orders.update(currentOrderId, {
          items: localItems,
          subtotal,
          total,
          updatedAt: nowIso,
          notes,
          ...((!order?.startedTakingAt) ? { startedTakingAt: orderStartedAt || nowIso } : {}),
        });
      }
      navigate('/tables');
    } catch (err: any) {
      console.error('Sipariş kaydetme hatası:', err);
      alert('Sipariş kaydedilirken bir hata oluştu: ' + (err?.message || err));
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-stone-100 dark:bg-stone-950 overflow-hidden select-none relative">
      {/* Mobile Top Header (lg:hidden) */}
      <div className="lg:hidden bg-stone-900 text-white px-3.5 py-2.5 pt-[max(env(safe-area-inset-top),0.75rem)] flex items-center justify-between shrink-0 shadow-sm z-20 border-b border-stone-800">
        <button
          onClick={() => navigate('/tables')}
          className="flex items-center gap-1.5 text-stone-200 hover:text-white font-bold text-xs py-2 px-3 rounded-full bg-stone-800/90 active:scale-95 transition-all ios-spring cursor-pointer border border-stone-700 min-h-[38px]"
        >
          <ChevronLeft className="w-4 h-4 text-orange-400" />
          <span>Masalar</span>
        </button>
        <div className="flex items-center gap-2 text-center">
          <span className="text-base font-black text-orange-400 tracking-tight">Masa {table?.label || ''}</span>
          <span className="text-[11px] bg-stone-800 text-stone-300 px-2.5 py-0.5 rounded-full font-bold border border-stone-700">
            {table?.guestCount || 2} Kişi
          </span>
        </div>
        <button
          onClick={() => setIsMobileTicketOpen(true)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ios-spring cursor-pointer min-h-[38px]",
            localItems.length > 0
              ? "bg-orange-600 text-white shadow-sm"
              : "bg-stone-800 text-stone-400 border border-stone-700"
          )}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>{localItems.length} Kalem</span>
        </button>
      </div>

      {/* Mobile Horizontal Category Bar (lg:hidden) */}
      <div className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-white/80 dark:bg-stone-900/90 backdrop-blur-lg border-b border-stone-200/60 dark:border-stone-800 overflow-x-auto no-scrollbar shrink-0 shadow-2xs">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategoryId(cat.id)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors shrink-0 cursor-pointer shadow-xs",
              activeCategoryId === cat.id
                ? "bg-orange-600 text-white shadow-xs"
                : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800"
            )}
          >
            <PosIcon name={cat.icon} className={cn("w-3.5 h-3.5 shrink-0", activeCategoryId === cat.id ? "text-white" : "text-stone-500 dark:text-stone-400")} />
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Desktop Left Panel: Categories (hidden on mobile, visible lg:flex) */}
      <div className="hidden lg:flex w-52 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex-col h-full overflow-y-auto shrink-0">
        <div className="p-3 border-b border-stone-200 dark:border-stone-800 shrink-0">
           <button 
             onClick={() => navigate('/tables')} 
             className="flex items-center gap-2 text-stone-700 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 font-bold text-xs px-2.5 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors w-full cursor-pointer"
           >
             <ChevronLeft className="w-4 h-4 text-orange-600" />
             <span>Masalara Dön</span>
           </button>
        </div>
        <div className="flex-1 py-2 space-y-1 px-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-left text-xs font-semibold cursor-pointer",
                activeCategoryId === cat.id
                  ? "bg-orange-600 text-white font-bold shadow-xs"
                  : "bg-transparent text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
              )}
            >
              <PosIcon name={cat.icon} className={cn("w-4 h-4 shrink-0", activeCategoryId === cat.id ? "text-white" : "text-stone-500 dark:text-stone-400")} />
              <span className="truncate">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Center Panel: Products */}
      <div className="flex-1 bg-stone-50 dark:bg-stone-950 p-3 sm:p-5 overflow-y-auto pb-28 lg:pb-6">
        {/* Instant Search Bar */}
        <div className="relative mb-3.5">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Hızlı ürün ara... (örn: Çay, Burger, Köfte, Latte)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-semibold placeholder:text-stone-400 dark:placeholder:text-stone-500 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="mb-3 flex justify-between items-center">
          <h2 className="text-base sm:text-lg font-bold text-stone-800 dark:text-stone-100">
            {searchQuery.trim() ? `Arama Sonuçları ("${searchQuery}")` : (categories.find(c => c.id === activeCategoryId)?.name || 'Menü')}
          </h2>
          <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">{menuItems.length} ürün</span>
        </div>

        {menuItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 sm:p-6 shadow-xs">
            <div className="w-14 h-14 bg-orange-100 dark:bg-stone-800 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-3">
              <Utensils size={28} />
            </div>
            <h3 className="text-base font-bold text-stone-800 dark:text-stone-100 mb-1">
              {searchQuery ? 'Aramanıza uygun ürün bulunamadı' : 'Bu kategoride ürün bulunamadı'}
            </h3>
            <p className="text-xs text-stone-400 dark:text-stone-500 mb-4 max-w-sm">
              {searchQuery ? 'Farklı bir arama terimi deneyin veya aramayı temizleyin.' : 'Bu kategoride henüz ürün bulunmuyor.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
              >
                Aramayı Temizle
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleProductClick(item)}
                disabled={!item.available}
                className={cn(
                  "group relative flex flex-col justify-between p-3.5 sm:p-4 bg-white dark:bg-stone-900 rounded-2xl shadow-2xs border-2 text-left min-h-[115px] sm:min-h-[135px] transition-all hover:shadow-md active:scale-[0.97] cursor-pointer",
                  item.available 
                    ? "border-stone-200 dark:border-stone-800 hover:border-orange-400 dark:hover:border-stone-700" 
                    : "border-stone-200 dark:border-stone-800 opacity-50 cursor-not-allowed bg-stone-100 dark:bg-stone-950"
                )}
              >
                <div className="flex-1">
                  <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm sm:text-base leading-snug group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-[11px] sm:text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="flex justify-between items-center mt-2.5 w-full pt-2 border-t border-stone-100 dark:border-stone-800">
                  <span className="font-black text-orange-600 dark:text-orange-400 text-base sm:text-lg tracking-tight">
                    {formatCurrency(item.price)}
                  </span>
                  
                  {item.available ? (
                    <div className="w-7 h-7 rounded-full bg-orange-50 dark:bg-stone-800 text-orange-600 dark:text-orange-400 group-hover:bg-orange-600 group-hover:text-white flex items-center justify-center transition-colors shadow-2xs">
                      <Plus size={14} />
                    </div>
                  ) : (
                    <span className="text-[9px] sm:text-[10px] bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">
                      Tükendi
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Floating Island Adisyon Bar (lg:hidden) */}
      {(localItems.length > 0 || order) && (
        <div className="lg:hidden fixed bottom-safe left-3 right-3 z-30 max-w-md mx-auto p-2.5 bg-stone-950/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl border border-stone-800 flex items-center justify-between gap-2.5 animate-in slide-in-from-bottom duration-200">
          <button
            type="button"
            onClick={() => setIsMobileTicketOpen(true)}
            className="flex-1 flex items-center gap-2.5 px-1 py-1 text-left cursor-pointer active:scale-98 transition-transform min-w-0"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-sm shadow-md shrink-0">
              {localItems.reduce((acc, i) => acc + i.quantity, 0)}x
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-xs font-black text-orange-400 uppercase tracking-wider">Adisyon</span>
                <span className="text-[10px] text-stone-400 font-bold truncate">• Masa {table?.label}</span>
              </div>
              <div className="text-base font-black font-mono text-white leading-tight">
                {formatCurrency(total)}
              </div>
            </div>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            {localItems.length > 0 && (
              <button
                type="button"
                onClick={handleSendToKitchen}
                className="py-2.5 px-3 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1 cursor-pointer transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gönder</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsMobileTicketOpen(true)}
              className="py-2.5 px-3 bg-white text-stone-950 font-black text-xs rounded-xl shadow-xs hover:bg-stone-100 active:scale-95 flex items-center gap-1 cursor-pointer transition-all border border-stone-300"
            >
              <span>Aç</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Slide-Up Ticket Sheet (lg:hidden) */}
      {isMobileTicketOpen && (
        <div className="lg:hidden fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-stone-900 text-stone-100 rounded-t-[32px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-250 border-t border-stone-700 pb-safe">
            {/* Handle */}
            <div className="w-full pt-3 pb-1 flex justify-center bg-stone-950 shrink-0">
              <div className="w-12 h-1.5 bg-stone-700 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-4 py-3 bg-stone-950 border-b border-stone-800 flex justify-between items-center shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-orange-400">Masa {table?.label}</span>
                  <span className="text-[11px] bg-stone-800 text-stone-200 px-2.5 py-0.5 rounded-full font-bold border border-stone-700">
                    {localItems.reduce((acc, i) => acc + i.quantity, 0)} Ürün
                  </span>
                </div>
                <p className="text-xs text-stone-400 font-medium mt-0.5">Garson: {order?.waiterName || state.currentUser?.name || 'Garson'}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileTicketOpen(false)}
                className="p-2 bg-stone-800 hover:bg-stone-700 rounded-full text-white active:scale-95 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Timing & Status Details */}
            <div className="px-4 py-2 bg-stone-950/90 border-b border-stone-800 flex items-center justify-between gap-2 text-xs shrink-0">
              <div className="flex items-center gap-1.5 text-stone-300">
                <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span className="font-semibold text-stone-200">
                  {new Date(order?.startedTakingAt || order?.createdAt || orderStartedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-stone-600">•</span>
                <span className="text-orange-300 font-bold">
                  {Math.max(0, Math.floor((Date.now() - new Date(order?.startedTakingAt || order?.createdAt || orderStartedAt).getTime()) / 60000))} dk
                </span>
              </div>
              <div>
                {order?.kitchenReadyAt ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold text-[11px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Mutfak Hazır ({order.kitchenDurationMinutes || 0} dk)
                  </span>
                ) : order?.sentToKitchenAt ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-700/60 font-bold text-[11px] flex items-center gap-1">
                    <ChefHat className="w-3 h-3 text-amber-400" />
                    Mutfakta ({Math.max(0, Math.floor((Date.now() - new Date(order.sentToKitchenAt).getTime()) / 60000))} dk)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 border border-stone-700 font-medium text-[11px]">
                    Sipariş Alınıyor
                  </span>
                )}
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 min-h-[160px] bg-stone-900">
              {localItems.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-stone-500" />
                  <p className="font-black text-base text-white">Adisyon henüz boş</p>
                  <p className="text-xs text-stone-400 mt-1">Menüden ürün ekleyin.</p>
                </div>
              ) : (
                localItems.map(item => {
                  const lineTotal = getItemLineTotal(item);
                  const isSent = item.status !== 'open';
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "p-3 rounded-2xl border transition-all flex flex-col gap-2",
                        isSent
                          ? "bg-stone-950/70 border-stone-800"
                          : "bg-stone-800 border-stone-700 shadow-xs"
                      )}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-sm text-white">{item.name}</span>
                            {isSent ? (
                              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-md font-bold">
                                ✓ İletildi
                              </span>
                            ) : (
                              <span className="text-[10px] bg-orange-950 text-orange-300 border border-orange-800 px-2 py-0.5 rounded-md font-bold">
                                ● Yeni
                              </span>
                            )}
                          </div>
                          {item.modifiers && item.modifiers.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.modifiers.map((m, mIdx) => (
                                <span key={mIdx} className="text-[10px] font-bold bg-stone-700 text-amber-300 px-2 py-0.5 rounded-md border border-amber-400/20">
                                  +{m.name}
                                </span>
                              ))}
                            </div>
                          )}
                          {item.notes && (
                            <p className="text-xs text-amber-400 font-medium italic mt-1">
                              Not: {item.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-black text-sm text-white">
                            {formatCurrency(lineTotal)}
                          </span>
                          <div className="text-[10px] text-stone-400">
                            {item.quantity} x {formatCurrency(item.unitPrice)}
                          </div>
                        </div>
                      </div>

                      {!isSent && (
                        <div className="flex items-center justify-between pt-2 border-t border-stone-700/60 mt-1">
                          {/* Large Touch Stepper */}
                          <div className="flex items-center bg-stone-950 rounded-xl border border-stone-700 p-0.5 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(item.id, -1)}
                              className="w-9 h-9 flex items-center justify-center text-white hover:bg-stone-800 active:bg-stone-700 rounded-lg cursor-pointer transition-colors active:scale-90"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-mono font-black text-sm text-white">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(item.id, 1)}
                              className="w-9 h-9 flex items-center justify-center text-white hover:bg-stone-800 active:bg-stone-700 rounded-lg cursor-pointer transition-colors active:scale-90"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="w-9 h-9 flex items-center justify-center bg-red-950/70 hover:bg-red-900 text-red-400 rounded-xl border border-red-800/60 transition-all cursor-pointer active:scale-90"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Sheet Footer */}
            <div className="p-4 bg-stone-950 border-t border-stone-800 flex flex-col gap-3 shrink-0">
              <input
                type="text"
                placeholder="Mutfak için sipariş notu..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-3 bg-stone-900 border border-stone-800 text-white placeholder-stone-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
              />

              {/* Total Row */}
              <div className="flex justify-between items-center bg-stone-900/60 p-3 rounded-xl border border-stone-800/80">
                <div>
                  <span className="text-[11px] font-bold text-stone-400 block uppercase tracking-wider">Adisyon Toplamı</span>
                  <span className="text-[10px] text-stone-500">KDV Dahil</span>
                </div>
                <span className="text-2xl font-black font-mono text-orange-400">
                  {formatCurrency(total)}
                </span>
              </div>

              {/* Primary Full-Width Action: Mutfağa Gönder */}
              <button
                type="button"
                onClick={() => {
                  handleSendToKitchen();
                  setIsMobileTicketOpen(false);
                }}
                disabled={localItems.length === 0}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>MUTFAĞA GÖNDER</span>
              </button>

              {/* Secondary Actions: 2 Clean Grid Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSlipModalType('receipt');
                    setIsSlipModalOpen(true);
                  }}
                  disabled={!order && localItems.length === 0}
                  className="py-3 px-2 bg-white text-stone-950 font-black text-xs rounded-xl shadow-xs hover:bg-stone-100 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 border border-stone-300 disabled:opacity-50"
                >
                  <Printer className="w-3.5 h-3.5 text-stone-950" />
                  <span>Fiş Yazdır</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileTicketOpen(false);
                    setIsPaymentModalOpen(true);
                  }}
                  disabled={!order && localItems.length === 0}
                  className="py-3 px-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Ödeme Al</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Right Panel: Ticket (hidden on mobile, visible lg:flex) */}
      <div className="hidden lg:flex w-[380px] xl:w-[420px] bg-stone-900 border-l border-stone-800 flex-col h-full shrink-0 shadow-xl text-stone-100">
        {/* Table & Order header */}
        <div className="p-4 bg-stone-950 text-white flex justify-between items-center border-b border-stone-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-orange-400">Masa {table?.label}</span>
              <span className="text-xs bg-stone-800 text-stone-200 px-2.5 py-0.5 rounded-full font-bold border border-stone-700">
                {table?.guestCount || 2} Kişi
              </span>
            </div>
            <p className="text-xs text-stone-400 font-medium mt-0.5">Garson: {order?.waiterName || state.currentUser?.name || 'Garson'}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-bold">Adisyon</span>
            <span className="font-mono font-black text-sm text-stone-200">
              #{order?.id?.slice(0, 6).toUpperCase() || 'YENİ'}
            </span>
          </div>
        </div>

        {/* Order Lifecycle Details Banner */}
        <div className="px-4 py-2.5 bg-stone-950/70 border-b border-stone-800/80 flex items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 text-stone-300">
            <div className="flex items-center gap-1.5 bg-stone-800/80 px-2.5 py-1 rounded-lg border border-stone-700/60">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              <span className="font-black text-stone-100">
                {new Date(order?.startedTakingAt || order?.createdAt || orderStartedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-stone-500">•</span>
              <span className="text-orange-300 font-bold">
                {Math.max(0, Math.floor((Date.now() - new Date(order?.startedTakingAt || order?.createdAt || orderStartedAt).getTime()) / 60000))} dk
              </span>
            </div>
          </div>
          <div>
            {order?.kitchenReadyAt ? (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Mutfak Hazır ({order.kitchenDurationMinutes || 0} dk)
              </span>
            ) : order?.sentToKitchenAt ? (
              <span className="px-2.5 py-1 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs">
                <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                Mutfakta ({Math.max(0, Math.floor((Date.now() - new Date(order.sentToKitchenAt).getTime()) / 60000))} dk)
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-300 border border-stone-700 font-medium text-xs">
                Sipariş Alınıyor
              </span>
            )}
          </div>
        </div>

        {/* Order items list */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-stone-900">
          {localItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 py-12">
              <CheckCircle2 className="w-12 h-12 mb-3 text-stone-600" />
              <p className="font-black text-base text-white">Sipariş henüz boş</p>
              <p className="text-xs text-stone-400 mt-1">Ürün eklemek için soldan seçim yapın</p>
            </div>
          ) : (
            localItems.map(item => {
              const lineTotal = getItemLineTotal(item);
              const isSent = item.status !== 'open';
              return (
                <div 
                  key={item.id} 
                  className={cn(
                    "p-3 rounded-2xl border transition-all flex flex-col gap-2",
                    isSent 
                      ? "bg-stone-950/70 border-stone-800" 
                      : "bg-stone-800/90 border-stone-700 shadow-xs"
                  )}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-white">{item.name}</span>
                        {isSent ? (
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-md font-bold">
                            ✓ İletildi
                          </span>
                        ) : (
                          <span className="text-[10px] bg-orange-950 text-orange-300 border border-orange-800 px-2 py-0.5 rounded-md font-bold">
                            ● Yeni
                          </span>
                        )}
                      </div>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.modifiers.map((m, mIdx) => (
                            <span key={mIdx} className="text-[10px] font-bold bg-stone-700 text-amber-300 px-2 py-0.5 rounded-md border border-amber-400/20">
                              +{m.name}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.notes && (
                        <p className="text-xs text-amber-400 font-medium italic mt-1">
                          Not: {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-sm text-white">
                        {formatCurrency(lineTotal)}
                      </span>
                      <div className="text-[10px] text-stone-400">
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                      </div>
                    </div>
                  </div>
                  
                  {!isSent && (
                    <div className="flex items-center justify-between pt-2 border-t border-stone-700/60 mt-1">
                      <div className="flex items-center bg-stone-950 rounded-xl border border-stone-700 p-0.5 shadow-2xs">
                        <button 
                          type="button"
                          onClick={() => updateItemQuantity(item.id, -1)} 
                          className="w-8 h-8 flex items-center justify-center text-white hover:bg-stone-800 active:bg-stone-700 rounded-lg cursor-pointer transition-colors active:scale-90"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-mono font-black text-sm text-white">{item.quantity}</span>
                        <button 
                          type="button"
                          onClick={() => updateItemQuantity(item.id, 1)} 
                          className="w-8 h-8 flex items-center justify-center text-white hover:bg-stone-800 active:bg-stone-700 rounded-lg cursor-pointer transition-colors active:scale-90"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeItem(item.id)} 
                        className="w-8 h-8 flex items-center justify-center bg-red-950/70 hover:bg-red-900 text-red-400 rounded-xl border border-red-800/60 transition-all cursor-pointer active:scale-90"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Action / Checkout footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex flex-col gap-3 shrink-0">
          <input
            type="text"
            placeholder="Mutfak için sipariş notu..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs p-2.5 bg-stone-900 border border-stone-800 text-white placeholder-stone-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
          />
          
          <div className="flex justify-between items-center bg-stone-900/60 p-3 rounded-xl border border-stone-800/80">
            <div>
              <span className="text-[11px] font-bold text-stone-400 block uppercase tracking-wider">Adisyon Toplamı</span>
              <span className="text-[10px] text-stone-500">KDV Dahil</span>
            </div>
            <span className="text-2xl font-black font-mono text-orange-400">{formatCurrency(total)}</span>
          </div>

          <div className="flex flex-col gap-2">
            <button 
              type="button"
              onClick={handleSendToKitchen} 
              disabled={localItems.length === 0}
              className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-orange-600 text-white hover:bg-orange-500 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <Send className="w-4 h-4" />
              <span>MUTFAĞA GÖNDER</span>
            </button>
            <button 
              type="button"
              onClick={() => {
                setSlipModalType('receipt');
                setIsSlipModalOpen(true);
              }} 
              disabled={!order && localItems.length === 0}
              className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 transition-colors"
            >
              <Printer className="w-4 h-4 text-stone-300" />
              <span>Fiş Yazdır</span>
            </button>
            <button 
              type="button"
              onClick={() => setIsPaymentModalOpen(true)} 
              disabled={!order && localItems.length === 0}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-orange-600 text-white hover:bg-orange-500 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              <span>Ödeme Al</span>
            </button>
          </div>
        </div>
      </div>

      {isModifierModalOpen && selectedItem && (
        <ModifierModal
          item={selectedItem}
          onClose={() => {
            setIsModifierModalOpen(false);
            setSelectedItem(null);
          }}
          onConfirm={(modifiers) => {
            handleAddItem(selectedItem, modifiers);
            setIsModifierModalOpen(false);
            setSelectedItem(null);
          }}
        />
      )}

      {isPaymentModalOpen && (
        <PaymentModal
          order={order || {
            id: generateId(),
            tableId: tableId || '',
            tableLabel: table?.label || 'Masa',
            waiterId: state.currentUser?.id || 'staff-1',
            waiterName: state.currentUser?.name || 'Garson',
            items: localItems,
            status: 'open',
            subtotal,
            discount: 0,
            tax,
            total,
            guestCount: table?.guestCount || 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes,
          }}
          table={table!}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={() => navigate('/tables')}
        />
      )}

      {isSlipModalOpen && (
        <ThermalSlipModal
          isOpen={isSlipModalOpen}
          onClose={() => setIsSlipModalOpen(false)}
          type={slipModalType}
          order={order || {
            id: generateId(),
            tableId: tableId || '',
            tableLabel: table?.label || 'Masa',
            waiterId: state.currentUser?.id || 'staff-1',
            waiterName: state.currentUser?.name || 'Garson',
            items: localItems,
            status: 'open',
            subtotal,
            discount: 0,
            tax,
            total,
            guestCount: table?.guestCount || 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes,
          }}
        />
      )}
    </div>
  );
}
