import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useApp } from '@/lib/store';
import { cn, formatCurrency, generateId } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus, Minus, Trash2, CheckCircle2, Send, CreditCard, Save, Utensils, Sparkles, X, Receipt, Search } from 'lucide-react';
import ModifierModal from '@/components/pos/ModifierModal';
import PaymentModal from '@/components/pos/PaymentModal';
import PosIcon from '@/components/common/PosIcon';
import type { OrderItem, MenuItem, Order, OrderItemModifier, KitchenTicket, KitchenStation, Table } from '@/types/pos';
import { seedDefaultMenu } from '@/lib/mockData';

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
  const [notes, setNotes] = useState('');
  
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
      const itemsByStation = new Map<KitchenStation, OrderItem[]>();
      for (const item of (newItems.length > 0 ? newItems : localItems)) {
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
          createdAt: nowIso,
          updatedAt: nowIso,
          sentToKitchenAt: nowIso,
          notes,
        };
        await db.orders.add(newOrder);
        await db.table<Table>('tables').update(tableId, {
          status: 'occupied',
          currentOrderId,
          occupiedAt: currentTable?.occupiedAt || nowIso,
          guestCount: currentTable?.guestCount || 2,
        });
      } else {
        await db.orders.update(currentOrderId, {
          items: localItems.map(i => ({ ...i, status: 'sent' })),
          status: 'sent',
          subtotal,
          total,
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
          createdAt: nowIso,
          updatedAt: nowIso,
          notes,
        };
        await db.orders.add(newOrder);
        await db.table<Table>('tables').update(tableId, {
          status: 'occupied',
          currentOrderId,
          occupiedAt: nowIso,
          guestCount: currentTable?.guestCount || 2,
        });
      } else if (currentOrderId) {
        await db.orders.update(currentOrderId, {
          items: localItems,
          subtotal,
          total,
          updatedAt: nowIso,
          notes,
        });
      }
      navigate('/tables');
    } catch (err: any) {
      console.error('Sipariş kaydetme hatası:', err);
      alert('Sipariş kaydedilirken bir hata oluştu: ' + (err?.message || err));
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-stone-100 overflow-hidden select-none relative">
      {/* Mobile Top Header (lg:hidden) */}
      <div className="lg:hidden bg-stone-900/95 backdrop-blur-xl text-white px-3.5 py-2.5 flex items-center justify-between shrink-0 shadow-sm z-20 border-b border-white/10">
        <button
          onClick={() => navigate('/tables')}
          className="flex items-center gap-1.5 text-stone-200 hover:text-white font-bold text-xs py-1.5 px-2.5 rounded-full bg-stone-800/80 active:scale-95 transition-all ios-spring cursor-pointer border border-white/5"
        >
          <ChevronLeft className="w-4 h-4 text-orange-400" />
          <span>Masalar</span>
        </button>
        <div className="flex items-center gap-2 text-center">
          <span className="text-base font-black text-orange-400 tracking-tight">Masa {table?.label || ''}</span>
          <span className="text-[11px] bg-stone-800/80 text-stone-300 px-2.5 py-0.5 rounded-full font-medium border border-white/5">
            {table?.guestCount || 2} Kişi
          </span>
        </div>
        <button
          onClick={() => setIsMobileTicketOpen(true)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ios-spring cursor-pointer",
            localItems.length > 0
              ? "bg-orange-600 text-white shadow-sm"
              : "bg-stone-800/80 text-stone-400 border border-white/5"
          )}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>{localItems.length} Kalem</span>
        </button>
      </div>

      {/* Mobile Horizontal Category Bar (lg:hidden) */}
      <div className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-white/80 backdrop-blur-lg border-b border-stone-200/60 overflow-x-auto no-scrollbar shrink-0 shadow-2xs">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategoryId(cat.id)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 active:scale-95 cursor-pointer ios-spring",
              activeCategoryId === cat.id
                ? "bg-orange-600 text-white shadow-xs"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200/50"
            )}
          >
            <PosIcon name={cat.icon} className="w-3.5 h-3.5 shrink-0" />
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Desktop Left Panel: Categories (hidden on mobile, visible lg:flex) */}
      <div className="hidden lg:flex w-52 bg-white border-r border-stone-200 flex-col h-full overflow-y-auto shrink-0">
        <div className="p-3.5 border-b border-stone-200 shrink-0">
           <button 
             onClick={() => navigate('/tables')} 
             className="flex items-center gap-2 text-stone-700 hover:text-stone-900 font-semibold text-sm px-2 py-1.5 rounded-lg hover:bg-stone-100 transition-colors w-full cursor-pointer"
           >
             <ChevronLeft className="w-5 h-5 text-orange-600" />
             <span>Masalara Dön</span>
           </button>
        </div>
        <div className="flex-1 py-2 space-y-1 px-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left text-sm font-semibold cursor-pointer",
                activeCategoryId === cat.id
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-stone-600 hover:bg-stone-100"
              )}
            >
              <PosIcon name={cat.icon} className="w-5 h-5 shrink-0" />
              <span className="truncate">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Center Panel: Products */}
      <div className="flex-1 bg-stone-50 p-3 sm:p-5 overflow-y-auto pb-28 lg:pb-6">
        {/* Instant Search Bar */}
        <div className="relative mb-3.5">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Hızlı ürün ara... (örn: Çay, Burger, Köfte, Latte)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-semibold placeholder:text-stone-400 text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="mb-3 flex justify-between items-center">
          <h2 className="text-base sm:text-lg font-bold text-stone-800">
            {searchQuery.trim() ? `Arama Sonuçları ("${searchQuery}")` : (categories.find(c => c.id === activeCategoryId)?.name || 'Menü')}
          </h2>
          <span className="text-xs text-stone-500 font-medium">{menuItems.length} ürün</span>
        </div>

        {menuItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 shadow-xs">
            <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-3">
              <Utensils size={28} />
            </div>
            <h3 className="text-base font-bold text-stone-800 mb-1">
              {searchQuery ? 'Aramanıza uygun ürün bulunamadı' : 'Bu kategoride ürün bulunamadı'}
            </h3>
            <p className="text-xs text-stone-400 mb-4 max-w-sm">
              {searchQuery ? 'Farklı bir arama terimi deneyin veya aramayı temizleyin.' : 'Wot\'s Cafe standart restoran menüsünü tek tıkla yükleyebilirsiniz.'}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
              >
                Aramayı Temizle
              </button>
            ) : (
              <button
                onClick={async () => {
                  await seedDefaultMenu(db, false);
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors active:scale-95"
              >
                <Sparkles size={14} />
                Wot's Cafe Menüsünü Yükle
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
                  "group relative flex flex-col justify-between p-3.5 sm:p-4 bg-white rounded-2xl shadow-2xs border-2 text-left min-h-[115px] sm:min-h-[135px] transition-all hover:shadow-md active:scale-[0.97] cursor-pointer",
                  item.available 
                    ? "border-stone-200 hover:border-orange-400" 
                    : "border-stone-200 opacity-50 cursor-not-allowed bg-stone-100"
                )}
              >
                <div className="flex-1">
                  <h3 className="font-bold text-stone-900 text-sm sm:text-base leading-snug group-hover:text-orange-600 transition-colors">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-[11px] sm:text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="flex justify-between items-center mt-2.5 w-full pt-2 border-t border-stone-100">
                  <span className="font-black text-orange-600 text-base sm:text-lg tracking-tight">
                    {formatCurrency(item.price)}
                  </span>
                  
                  {item.available ? (
                    <div className="w-7 h-7 rounded-full bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white flex items-center justify-center transition-colors shadow-2xs">
                      <Plus size={14} />
                    </div>
                  ) : (
                    <span className="text-[9px] sm:text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
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
      <div className="lg:hidden fixed bottom-3 left-3 right-3 z-30 p-2 bg-stone-900/95 backdrop-blur-xl text-white rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.28)] border border-white/10 flex items-center justify-between gap-2 ios-spring">
        <button
          onClick={() => setIsMobileTicketOpen(true)}
          className="flex-1 flex items-center justify-between px-3 py-2 bg-white/10 hover:bg-white/15 rounded-xl active:scale-[0.98] transition-all text-left cursor-pointer border border-white/5"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
              {localItems.reduce((acc, i) => acc + i.quantity, 0)}
            </div>
            <div>
              <span className="text-[10px] font-bold text-stone-300 block uppercase tracking-wider leading-none mb-0.5">Adisyon</span>
              <span className="text-sm font-black text-white font-mono">{formatCurrency(total)}</span>
            </div>
          </div>
          <span className="text-xs font-bold text-orange-400 flex items-center">
            İncele
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </span>
        </button>

        {localItems.length > 0 && (
          <button
            onClick={handleSendToKitchen}
            className="py-2.5 px-3.5 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ios-spring"
          >
            <Send className="w-4 h-4" />
            <span>Mutfağa İlet</span>
          </button>
        )}

        {(order || localItems.length > 0) && (
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1 whitespace-nowrap cursor-pointer transition-all ios-spring"
          >
            <CreditCard className="w-4 h-4" />
            <span>Öde</span>
          </button>
        )}
      </div>

      {/* Mobile Slide-Up Ticket Sheet (lg:hidden) */}
      {isMobileTicketOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-white rounded-t-[32px] max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-250 border-t border-white/20">
            {/* Centered iOS Grab Handle Pill */}
            <div className="w-full pt-3 pb-1 flex justify-center bg-stone-900 shrink-0">
              <div className="w-12 h-1.5 bg-white/30 rounded-full" />
            </div>

            {/* Sheet Header */}
            <div className="px-4 pb-3.5 pt-1 bg-stone-900 text-white flex justify-between items-center shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-orange-400 tracking-tight">Masa {table?.label}</span>
                  <span className="text-xs bg-stone-800 text-stone-300 px-2.5 py-0.5 rounded-full font-medium border border-white/5">
                    {table?.guestCount || 2} Kişi
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">Garson: {state.currentUser?.name || 'Garson'}</p>
              </div>
              <button
                onClick={() => setIsMobileTicketOpen(false)}
                className="p-2 bg-stone-800/80 hover:bg-stone-700 rounded-full text-stone-300 active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[160px]">
              {localItems.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                  <p className="font-bold text-sm">Adisyon boş</p>
                  <p className="text-xs text-stone-400 mt-0.5">Menüden ürün seçerek adisyona ekleyin.</p>
                </div>
              ) : (
                localItems.map(item => {
                  const lineTotal = getItemLineTotal(item);
                  const isSent = item.status !== 'open';
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex flex-col p-3 rounded-2xl border transition-all",
                        isSent ? "bg-stone-50 border-stone-200" : "bg-orange-50/40 border-orange-200"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-900 text-sm">{item.name}</span>
                            {isSent && (
                              <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded-full font-semibold">
                                İletildi
                              </span>
                            )}
                          </div>
                          {item.modifiers && item.modifiers.length > 0 && (
                            <p className="text-xs text-stone-500 mt-0.5">
                              {item.modifiers.map(m => `+${m.name}`).join(', ')}
                            </p>
                          )}
                        </div>
                        <span className="font-extrabold text-stone-900 text-sm whitespace-nowrap">
                          {formatCurrency(lineTotal)}
                        </span>
                      </div>

                      {!isSent && (
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-orange-100">
                          <div className="flex items-center bg-white rounded-xl border border-stone-200 shadow-2xs">
                            <button
                              onClick={() => updateItemQuantity(item.id, -1)}
                              className="p-2 text-stone-600 hover:text-stone-900 active:bg-stone-100 rounded-l-xl cursor-pointer"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-bold text-sm text-stone-800">{item.quantity}</span>
                            <button
                              onClick={() => updateItemQuantity(item.id, 1)}
                              className="p-2 text-stone-600 hover:text-stone-900 active:bg-stone-100 rounded-r-xl cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-red-500 hover:bg-red-50 active:bg-red-100 rounded-xl transition-colors cursor-pointer"
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
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col gap-3 shrink-0">
              <input
                type="text"
                placeholder="Mutfak için sipariş notu..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-3 bg-white border border-stone-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />

              <div className="flex justify-between items-center py-1">
                <span className="text-sm font-semibold text-stone-500">Toplam Tutar</span>
                <span className="text-2xl font-black text-stone-900">{formatCurrency(total)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    handleSave();
                    setIsMobileTicketOpen(false);
                  }}
                  className="py-3 px-2 rounded-2xl font-bold text-xs bg-stone-200 text-stone-700 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ios-spring"
                >
                  <Save className="w-4 h-4" />
                  KAYDET
                </button>
                <button
                  onClick={() => {
                    handleSendToKitchen();
                    setIsMobileTicketOpen(false);
                  }}
                  disabled={localItems.length === 0}
                  className="py-3 px-2 rounded-2xl font-bold text-xs bg-orange-600 text-white active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md cursor-pointer ios-spring"
                >
                  <Send className="w-4 h-4" />
                  MUTFAĞA GÖNDER
                </button>
                <button
                  onClick={() => {
                    setIsMobileTicketOpen(false);
                    setIsPaymentModalOpen(true);
                  }}
                  disabled={!order && localItems.length === 0}
                  className="py-3.5 px-4 rounded-2xl font-bold text-sm bg-emerald-600 text-white active:scale-95 disabled:opacity-50 col-span-2 flex items-center justify-center gap-2 shadow-md cursor-pointer ios-spring"
                >
                  <CreditCard className="w-5 h-5" />
                  HESABI AL & ÖDEME
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Right Panel: Ticket (hidden on mobile, visible lg:flex) */}
      <div className="hidden lg:flex w-[380px] xl:w-[420px] bg-white border-l border-stone-200 flex-col h-full shrink-0 shadow-lg">
        {/* Table & Order header */}
        <div className="p-4 bg-stone-900 text-white flex justify-between items-center shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-orange-400">Masa {table?.label}</span>
              <span className="text-xs bg-stone-800 text-stone-300 px-2 py-0.5 rounded-full font-medium">
                {table?.guestCount || 2} Kişi
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">Garson: {state.currentUser?.name || 'Ahmet Yılmaz'}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-stone-400 block">Adisyon</span>
            <span className="font-mono font-bold text-sm text-stone-200">
              #{order?.id?.slice(0, 6).toUpperCase() || 'YENİ'}
            </span>
          </div>
        </div>

        {/* Order items list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {localItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 py-12">
              <CheckCircle2 className="w-12 h-12 mb-3 text-stone-300" />
              <p className="font-medium text-sm">Sipariş henüz boş</p>
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
                    "flex flex-col p-3 rounded-xl border transition-all",
                    isSent ? "bg-stone-50 border-stone-200" : "bg-orange-50/40 border-orange-200"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-stone-900 text-sm">{item.name}</span>
                        {isSent && (
                          <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-semibold">
                            İletildi
                          </span>
                        )}
                      </div>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <p className="text-xs text-stone-500 mt-0.5">
                          {item.modifiers.map(m => `+${m.name}`).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-stone-900 text-sm whitespace-nowrap">
                      {formatCurrency(lineTotal)}
                    </span>
                  </div>
                  
                  {!isSent && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-orange-100">
                      <div className="flex items-center bg-white rounded-lg border border-stone-200 shadow-2xs">
                        <button 
                          onClick={() => updateItemQuantity(item.id, -1)} 
                          className="p-1.5 text-stone-600 hover:text-stone-900 active:bg-stone-100 rounded-l-lg"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-bold text-sm text-stone-800">{item.quantity}</span>
                        <button 
                          onClick={() => updateItemQuantity(item.id, 1)} 
                          className="p-1.5 text-stone-600 hover:text-stone-900 active:bg-stone-100 rounded-r-lg"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeItem(item.id)} 
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col gap-3 shrink-0">
          <input
            type="text"
            placeholder="Mutfak için sipariş notu..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          
          <div className="flex justify-between items-center py-1">
            <span className="text-sm font-semibold text-stone-500">Toplam Tutar</span>
            <span className="text-2xl font-black text-stone-900">{formatCurrency(total)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={handleSave} 
              className="py-3 px-2 rounded-xl font-bold text-xs bg-stone-200 text-stone-700 hover:bg-stone-300 active:bg-stone-400 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              KAYDET
            </button>
            <button 
              onClick={handleSendToKitchen} 
              disabled={localItems.length === 0}
              className="py-3 px-2 rounded-xl font-bold text-xs bg-orange-600 text-white hover:bg-orange-700 active:bg-orange-800 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <Send className="w-4 h-4" />
              MUTFAĞA GÖNDER
            </button>
            <button 
              onClick={() => setIsPaymentModalOpen(true)} 
              disabled={!order && localItems.length === 0}
              className="py-3.5 px-4 rounded-xl font-bold text-sm bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 col-span-2 flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <CreditCard className="w-5 h-5" />
              HESABI AL & ÖDEME
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
    </div>
  );
}
