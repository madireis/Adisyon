import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, ArrowRightLeft, Check, Minus, Plus, Users, UtensilsCrossed, AlertCircle, Sparkles } from 'lucide-react';
import { db } from '@/lib/db';
import { useApp } from '@/lib/store';
import { cn, formatCurrency, generateId } from '@/lib/utils';
import { hasPermission } from '@/lib/permissions';
import type { Order, Table, OrderItem, Floor } from '@/types/pos';

interface TableTransferModalProps {
  currentTable: Table;
  currentOrder: Order | null;
  currentItems: OrderItem[];
  onClose: () => void;
  onSuccess: (targetTableId: string) => void;
}

export default function TableTransferModal({
  currentTable,
  currentOrder,
  currentItems,
  onClose,
  onSuccess,
}: TableTransferModalProps) {
  const { state } = useApp();
  const floors = useLiveQuery(() => db.floors.orderBy('order').toArray()) || [];
  const allTables = useLiveQuery(() => db.table<Table>('tables').toArray()) || [];

  const [activeFloorId, setActiveFloorId] = useState<string>('');
  const [selectedTargetTableId, setSelectedTargetTableId] = useState<string>('');
  const [transferMode, setTransferMode] = useState<'all' | 'partial'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available items: from currentItems or currentOrder?.items
  const allAvailableItems = useMemo(() => {
    if (currentItems && currentItems.length > 0) return currentItems;
    if (currentOrder && currentOrder.items && currentOrder.items.length > 0) return currentOrder.items;
    return [];
  }, [currentItems, currentOrder]);

  // Partial transfer item quantities: { [itemId]: quantityToMove }
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    allAvailableItems.forEach(i => {
      init[i.id] = i.quantity;
    });
    return init;
  });

  // Selected item checked states
  const [checkedItemIds, setCheckedItemIds] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    allAvailableItems.forEach(i => {
      init[i.id] = true;
    });
    return init;
  });

  // Keep state synced if allAvailableItems changes
  useEffect(() => {
    if (allAvailableItems.length > 0) {
      setSelectedItems(prev => {
        const next = { ...prev };
        allAvailableItems.forEach(i => {
          if (!next[i.id]) next[i.id] = i.quantity;
        });
        return next;
      });
      setCheckedItemIds(prev => {
        const next = { ...prev };
        allAvailableItems.forEach(i => {
          if (next[i.id] === undefined) next[i.id] = true;
        });
        return next;
      });
    }
  }, [allAvailableItems]);

  // Default floor selection
  const currentFloorId = activeFloorId || currentTable.floorId || floors[0]?.id;

  // Filter tables for current floor excluding the current source table, sorted stably
  const availableTargetTables = useMemo(() => {
    const list = allTables.filter(t => t.id !== currentTable.id && (!currentFloorId || t.floorId === currentFloorId));
    return [...list].sort((a, b) => {
      const numA = typeof a.number === 'number' ? a.number : parseInt(a.label?.replace(/\D/g, '') || '0', 10);
      const numB = typeof b.number === 'number' ? b.number : parseInt(b.label?.replace(/\D/g, '') || '0', 10);
      if (numA !== numB) return numA - numB;
      return (a.label || '').localeCompare(b.label || '', undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [allTables, currentTable.id, currentFloorId]);

  const selectedTargetTable = useMemo(() => {
    return allTables.find(t => t.id === selectedTargetTableId);
  }, [allTables, selectedTargetTableId]);

  // Toggle item selection for partial transfer
  const toggleItemCheck = (itemId: string) => {
    setCheckedItemIds(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const updateQuantityToMove = (itemId: string, maxQty: number, delta: number) => {
    setSelectedItems(prev => {
      const current = prev[itemId] || 1;
      const next = Math.min(maxQty, Math.max(1, current + delta));
      return { ...prev, [itemId]: next };
    });
  };

  // Calculate items selected to be moved
  const itemsToMoveList = useMemo(() => {
    if (transferMode === 'all') {
      return allAvailableItems.map(i => ({ item: i, qty: i.quantity }));
    }
    return allAvailableItems
      .filter(i => checkedItemIds[i.id])
      .map(i => ({
        item: i,
        qty: Math.min(i.quantity, selectedItems[i.id] || 1),
      }));
  }, [transferMode, allAvailableItems, checkedItemIds, selectedItems]);

  const handleExecuteTransfer = async () => {
    if (!hasPermission(state.currentUser, 'canTransferTable')) {
      alert('Masa veya ürün taşıma yetkiniz bulunmamaktadır.');
      return;
    }

    if (!selectedTargetTable) {
      alert('Lütfen ürünleri aktarmak istediğiniz hedef masayı seçin.');
      return;
    }

    if (transferMode === 'partial' && itemsToMoveList.length === 0) {
      alert('Lütfen taşınacak en az bir ürün seçin.');
      return;
    }

    setIsSubmitting(true);
    const nowIso = new Date().toISOString();
    const currentUser = state.currentUser;
    const currentUserName = currentUser?.name || 'Garson';

    try {
      // 1. Resolve source order if missing
      let effectiveOrder = currentOrder;
      if (!effectiveOrder && currentTable.currentOrderId) {
        effectiveOrder = await db.orders.get(currentTable.currentOrderId) || null;
      }
      if (!effectiveOrder) {
        effectiveOrder = await db.orders.where('tableId').equals(currentTable.id)
          .filter((o: Order) => o.status !== 'paid' && o.status !== 'cancelled')
          .first() || null;
      }

      // 2. Resolve target order
      let targetOrder = selectedTargetTable.currentOrderId ? await db.orders.get(selectedTargetTable.currentOrderId) : null;
      if (!targetOrder) {
        targetOrder = await db.orders.where('tableId').equals(selectedTargetTable.id)
          .filter((o: Order) => o.status !== 'paid' && o.status !== 'cancelled')
          .first() || null;
      }
      const isTargetOccupied = Boolean(targetOrder) || selectedTargetTable.status === 'occupied' || selectedTargetTable.status === 'payment_waiting';
      const isFullTableMove = transferMode === 'all' || (allAvailableItems.length > 0 && itemsToMoveList.length === allAvailableItems.length && itemsToMoveList.every(m => m.qty === m.item.quantity));

      // CASE 1: FULL TABLE TRANSFER TO AN EMPTY TABLE
      if (isFullTableMove && !isTargetOccupied) {
        if (effectiveOrder) {
          await db.orders.update(effectiveOrder.id, {
            tableId: selectedTargetTable.id,
            tableLabel: selectedTargetTable.label,
            updatedAt: nowIso,
            waiters: Array.from(new Set([...(effectiveOrder.waiters || [effectiveOrder.waiterName]), currentUserName].filter(Boolean) as string[])),
          });

          // Update kitchen tickets tableLabel
          const tickets = await db.kitchenTickets.where('orderId').equals(effectiveOrder.id).toArray();
          for (const ticket of tickets) {
            await db.kitchenTickets.update(ticket.id, {
              tableLabel: selectedTargetTable.label,
            });
          }
        }

        // Mark target table occupied with this order
        await db.table<Table>('tables').update(selectedTargetTable.id, {
          status: currentTable.status === 'payment_waiting' ? 'payment_waiting' : 'occupied',
          currentOrderId: effectiveOrder?.id || undefined,
          guestCount: currentTable.guestCount || 2,
          occupiedAt: currentTable.occupiedAt || effectiveOrder?.createdAt || nowIso,
        });

        // Mark source table available
        await db.table<Table>('tables').update(currentTable.id, {
          status: 'available',
          currentOrderId: undefined,
          guestCount: 0,
          occupiedAt: undefined,
        });

        // Audit Log
        await db.auditLogs.add({
          id: generateId(),
          userId: currentUser?.id || 'staff-1',
          userName: currentUserName,
          action: 'Adisyon Aktarma',
          details: `Masa ${currentTable.label} adisyonu Masa ${selectedTargetTable.label}'e aktarıldı (Masa düzeni korundu).`,
          entityType: 'order',
          entityId: effectiveOrder?.id || 'order',
          timestamp: nowIso,
        });
      }
      // CASE 2: MERGING ENTIRE TABLE INTO AN OCCUPIED TARGET TABLE
      else if (isFullTableMove && isTargetOccupied) {
        let activeTargetOrder = targetOrder;
        if (!activeTargetOrder && selectedTargetTable.currentOrderId) {
          activeTargetOrder = await db.orders.get(selectedTargetTable.currentOrderId) || null;
        }
        if (!activeTargetOrder) {
          activeTargetOrder = await db.orders.where('tableId').equals(selectedTargetTable.id)
            .filter((o: Order) => o.status !== 'paid' && o.status !== 'cancelled')
            .first() || null;
        }

        if (activeTargetOrder) {
          const mergedItems = [...(activeTargetOrder.items || [])];
          for (const { item, qty } of itemsToMoveList) {
            const existingIdx = mergedItems.findIndex(x => x.menuItemId === item.menuItemId && JSON.stringify(x.modifiers || []) === JSON.stringify(item.modifiers || []));
            if (existingIdx >= 0) {
              mergedItems[existingIdx].quantity += qty;
            } else {
              mergedItems.push({
                ...item,
                id: generateId(),
                orderId: activeTargetOrder.id,
                quantity: qty,
                addedByWaiterName: item.addedByWaiterName || currentUserName,
              });
            }
          }

          const newSubtotal = mergedItems.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
          const newTotal = newSubtotal;

          await db.orders.update(activeTargetOrder.id, {
            items: mergedItems,
            subtotal: newSubtotal,
            total: newTotal,
            updatedAt: nowIso,
            waiters: Array.from(new Set([...(activeTargetOrder.waiters || [activeTargetOrder.waiterName]), currentUserName])),
          });

          // Cancel or mark source order transferred
          if (effectiveOrder) {
            await db.orders.update(effectiveOrder.id, {
              status: 'cancelled',
              notes: (effectiveOrder.notes ? effectiveOrder.notes + ' - ' : '') + `Masa ${selectedTargetTable.label}'e aktarıldı.`,
            });
          }

          // Mark source table free
          await db.table<Table>('tables').update(currentTable.id, {
            status: 'available',
            currentOrderId: undefined,
            guestCount: 0,
            occupiedAt: undefined,
          });

          await db.auditLogs.add({
            id: generateId(),
            userId: currentUser?.id || 'staff-1',
            userName: currentUserName,
            action: 'Adisyon Birleştirme',
            details: `Masa ${currentTable.label} adisyonu, Masa ${selectedTargetTable.label} adisyonu ile birleştirildi.`,
            entityType: 'order',
            entityId: activeTargetOrder.id,
            timestamp: nowIso,
          });
        }
      }
      // CASE 3: PARTIAL PRODUCT TRANSFER (Seçili ürünleri başka masaya taşıma)
      else {
        // Items to remove/decrement from current order
        const remainingItems: OrderItem[] = [];
        const movedItemsForTarget: OrderItem[] = [];

        for (const item of allAvailableItems) {
          const moveInfo = itemsToMoveList.find(m => m.item.id === item.id);
          if (!moveInfo) {
            // Not moving this item
            remainingItems.push(item);
          } else if (moveInfo.qty < item.quantity) {
            // Decrement quantity on source table
            remainingItems.push({
              ...item,
              quantity: item.quantity - moveInfo.qty,
            });
            // And add the moved portion to target
            movedItemsForTarget.push({
              ...item,
              id: generateId(),
              quantity: moveInfo.qty,
              addedByWaiterName: item.addedByWaiterName || currentUserName,
            });
          } else {
            // Entire line moved
            movedItemsForTarget.push({
              ...item,
              id: generateId(),
              quantity: moveInfo.qty,
              addedByWaiterName: item.addedByWaiterName || currentUserName,
            });
          }
        }

        // 1. Update source table order
        if (effectiveOrder) {
          if (remainingItems.length === 0) {
            // All items moved away, free the source table
            await db.orders.update(effectiveOrder.id, {
              status: 'cancelled',
              items: [],
              subtotal: 0,
              total: 0,
              updatedAt: nowIso,
            });
            await db.table<Table>('tables').update(currentTable.id, {
              status: 'available',
              currentOrderId: undefined,
              guestCount: 0,
              occupiedAt: undefined,
            });
          } else {
            const remSubtotal = remainingItems.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
            await db.orders.update(effectiveOrder.id, {
              items: remainingItems,
              subtotal: remSubtotal,
              total: remSubtotal,
              updatedAt: nowIso,
            });
          }
        }

        // 2. Add moved items to target table
        let activeTargetOrder = targetOrder;
        if (!activeTargetOrder && selectedTargetTable.currentOrderId) {
          activeTargetOrder = await db.orders.get(selectedTargetTable.currentOrderId) || null;
        }
        if (!activeTargetOrder) {
          activeTargetOrder = await db.orders.where('tableId').equals(selectedTargetTable.id)
            .filter((o: Order) => o.status !== 'paid' && o.status !== 'cancelled')
            .first() || null;
        }

        if (isTargetOccupied && activeTargetOrder) {
          // Merge into existing target table order
          const updatedTargetItems = [...(activeTargetOrder.items || [])];
          for (const movedIt of movedItemsForTarget) {
            const existingIdx = updatedTargetItems.findIndex(x => x.menuItemId === movedIt.menuItemId && JSON.stringify(x.modifiers || []) === JSON.stringify(movedIt.modifiers || []));
            if (existingIdx >= 0) {
              updatedTargetItems[existingIdx].quantity += movedIt.quantity;
            } else {
              updatedTargetItems.push({
                ...movedIt,
                orderId: activeTargetOrder.id,
              });
            }
          }

          const newSubtotal = updatedTargetItems.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
          await db.orders.update(activeTargetOrder.id, {
            items: updatedTargetItems,
            subtotal: newSubtotal,
            total: newSubtotal,
            updatedAt: nowIso,
            waiters: Array.from(new Set([...(activeTargetOrder.waiters || [activeTargetOrder.waiterName]), currentUserName])),
          });
        } else {
          // Create new order on empty target table
          const newOrderId = generateId();
          const newSubtotal = movedItemsForTarget.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
          const newOrder: Order = {
            id: newOrderId,
            tableId: selectedTargetTable.id,
            tableLabel: selectedTargetTable.label,
            waiterId: currentUser?.id || 'staff-1',
            waiterName: currentUserName,
            waiters: [currentUserName],
            status: 'sent',
            items: movedItemsForTarget.map(it => ({ ...it, orderId: newOrderId, status: 'sent' })),
            subtotal: newSubtotal,
            discount: 0,
            tax: Math.round(newSubtotal * 0.08),
            total: newSubtotal,
            guestCount: 2,
            createdAt: nowIso,
            updatedAt: nowIso,
            notes: `Masa ${currentTable.label}'den taşınan ürünler`,
          };
          await db.orders.add(newOrder);

          await db.table<Table>('tables').update(selectedTargetTable.id, {
            status: 'occupied',
            currentOrderId: newOrderId,
            guestCount: 2,
            occupiedAt: nowIso,
          });
        }

        // 3. Log audit
        await db.auditLogs.add({
          id: generateId(),
          userId: currentUser?.id || 'staff-1',
          userName: currentUserName,
          action: 'Ürün Aktarma',
          details: `Masa ${currentTable.label} -> Masa ${selectedTargetTable.label}: ${itemsToMoveList.map(m => `${m.qty}x ${m.item.name}`).join(', ')} aktarıldı.`,
          entityType: 'order',
          entityId: effectiveOrder?.id || 'order',
          timestamp: nowIso,
        });
      }

      onSuccess(selectedTargetTable.id);
    } catch (err: any) {
      console.error('Masa / ürün taşıma hatası:', err);
      alert('Taşıma sırasında bir hata oluştu: ' + (err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600/15 text-orange-600 flex items-center justify-center font-bold">
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg tracking-tight">
                Adisyon Taşı / Masaya Aktar
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Kaynak: <strong className="text-stone-900 dark:text-stone-100 font-bold">Masa {currentTable.label}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Layout notice banner */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Salon düzeni ve masalar sabit kalır.</span> Sadece <strong>Masa {currentTable.label}</strong>'ye ait adisyon ve siparişler seçtiğiniz hedef masaya aktarılır.
            </div>
          </div>

          {/* Transfer Mode Switcher */}
          <div className="flex p-1 bg-stone-100 dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setTransferMode('all')}
              className={cn(
                "flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer text-center",
                transferMode === 'all'
                  ? "bg-orange-600 text-white shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
              )}
            >
              Tüm Adisyonu Aktar
            </button>
            <button
              type="button"
              onClick={() => setTransferMode('partial')}
              className={cn(
                "flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer text-center",
                transferMode === 'partial'
                  ? "bg-orange-600 text-white shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
              )}
            >
              Seçili Ürünleri Aktar
            </button>
          </div>

          {/* Mode explanation */}
          {transferMode === 'all' ? (
            <div className="px-3 py-2 bg-stone-50 dark:bg-stone-850/40 border border-stone-200 dark:border-stone-800 rounded-xl text-[11px] text-stone-600 dark:text-stone-400">
              Masa {currentTable.label}'deki tüm açık siparişler ve hesap hedef masaya aktarılır. Masa {currentTable.label} boş duruma geçer.
            </div>
          ) : (
            <div className="px-3 py-2 bg-stone-50 dark:bg-stone-850/40 border border-stone-200 dark:border-stone-800 rounded-xl text-[11px] text-stone-600 dark:text-stone-400">
              Aşağıdan seçtiğiniz ürünler hedef masaya aktarılır. Seçilmeyenler Masa {currentTable.label}'de kalmaya devam eder.
            </div>
          )}

          {/* If Partial Transfer: Product List with Checkboxes & Quantities */}
          {transferMode === 'partial' && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                Taşınacak Ürünleri Seçin:
              </span>
              <div className="border border-stone-200 dark:border-stone-800 rounded-2xl p-2 divide-y divide-stone-100 dark:divide-stone-800 max-h-56 overflow-y-auto">
                {allAvailableItems.length === 0 ? (
                  <div className="py-6 px-4 text-center">
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Bu masada henüz kayıtlı sipariş veya ürün bulunmuyor.
                    </p>
                    <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
                      Masa oturumunu veya adisyonu aktarmak için yukarıdan <strong>"Tüm Adisyonu Aktar"</strong> seçeneğini kullanabilirsiniz.
                    </p>
                  </div>
                ) : (
                  allAvailableItems.map(item => {
                    const isChecked = Boolean(checkedItemIds[item.id]);
                    const qtyToMove = selectedItems[item.id] || item.quantity;
                    return (
                      <div key={item.id} className="py-2 px-2 flex items-center justify-between gap-3">
                        <div 
                          onClick={() => toggleItemCheck(item.id)}
                          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0",
                            isChecked 
                              ? "bg-orange-600 border-orange-600 text-white" 
                              : "border-stone-400 dark:border-stone-600"
                          )}>
                            {isChecked && <Check size={13} strokeWidth={3} />}
                          </div>
                          <div className="min-w-0">
                            <span className={cn("text-xs font-bold block truncate", isChecked ? "text-stone-900 dark:text-stone-100" : "text-stone-400")}>
                              {item.name}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              Mevcut: {item.quantity} adet • {formatCurrency(item.unitPrice)}
                            </span>
                          </div>
                        </div>

                        {/* Quantity Stepper (if checked) */}
                        {isChecked && item.quantity > 1 && (
                          <div className="flex items-center bg-stone-100 dark:bg-stone-800 rounded-xl p-0.5 border border-stone-200 dark:border-stone-700 shrink-0">
                            <button
                              type="button"
                              onClick={() => updateQuantityToMove(item.id, item.quantity, -1)}
                              className="w-7 h-7 flex items-center justify-center text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg cursor-pointer"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-6 text-center font-mono font-bold text-xs text-orange-600 dark:text-orange-400">
                              {qtyToMove}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantityToMove(item.id, item.quantity, 1)}
                              className="w-7 h-7 flex items-center justify-center text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg cursor-pointer"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Target Table Selector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                Hedef Masa Seçin:
              </span>
              {/* Floor Switcher */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {floors.map(floor => (
                  <button
                    key={floor.id}
                    type="button"
                    onClick={() => setActiveFloorId(floor.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                      currentFloorId === floor.id
                        ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                        : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                    )}
                  >
                    {floor.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Tables Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-56 overflow-y-auto p-1 border border-stone-200 dark:border-stone-800 rounded-2xl">
              {availableTargetTables.map(tbl => {
                const isSelected = selectedTargetTableId === tbl.id;
                const isOccupied = tbl.status === 'occupied';
                return (
                  <button
                    key={tbl.id}
                    type="button"
                    onClick={() => setSelectedTargetTableId(tbl.id)}
                    className={cn(
                      "p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center relative",
                      isSelected
                        ? "border-orange-600 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 ring-2 ring-orange-500"
                        : "border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700 bg-stone-50 dark:bg-stone-950"
                    )}
                  >
                    <span className="font-black text-sm text-stone-900 dark:text-stone-100">
                      Masa {tbl.label}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.2 rounded-md",
                      isOccupied 
                        ? "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400" 
                        : "bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                    )}>
                      {isOccupied ? 'Dolu (Adisyonu Birleştir)' : 'Boş Masa'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-500 truncate">
            {selectedTargetTable ? (
              <span>Hedef: <strong className="text-orange-600 font-bold">Masa {selectedTargetTable.label}</strong></span>
            ) : (
              <span>Lütfen hedef masa seçin</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleExecuteTransfer}
              disabled={!selectedTargetTableId || isSubmitting || (transferMode === 'partial' && itemsToMoveList.length === 0)}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <ArrowRightLeft size={14} />
              <span>
                {isSubmitting
                  ? 'Aktarılıyor...'
                  : transferMode === 'all'
                    ? (selectedTargetTable ? `Adisyonu Masa ${selectedTargetTable.label}'e Aktar` : 'Adisyonu Aktar')
                    : (selectedTargetTable ? `Seçilenleri Masa ${selectedTargetTable.label}'e Aktar` : 'Ürünleri Aktar')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
