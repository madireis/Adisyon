import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useApp } from '@/lib/store';
import { cn, formatCurrency, getElapsedMinutes } from '@/lib/utils';
import { Clock, Users, Plus, Edit2, Settings2, Trash2, ArrowRightLeft } from 'lucide-react';
import type { Table, Floor, Order } from '@/types/pos';
import SectionModal from '@/components/tables/SectionModal';
import TableModal from '@/components/tables/TableModal';
import TableTransferModal from '@/components/pos/TableTransferModal';
import PosIcon from '@/components/common/PosIcon';
import { usePermissions } from '@/lib/permissions';

export default function TablesPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { hasPermission } = usePermissions();

  const canTransfer = hasPermission('canTransferTable');
  const canEditTables = hasPermission('canEditTables');
  const canViewReports = hasPermission('canViewDailyZReport') || hasPermission('canViewReports');
  const canOpen = hasPermission('canOpenTable');
  
  // Floor and table states
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);

  // Table transfer states
  const [transferSourceTable, setTransferSourceTable] = useState<Table | null>(null);
  const [transferSourceOrder, setTransferSourceOrder] = useState<Order | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const handleOpenTransferModal = async (table: Table, order?: Order | null) => {
    if (!canTransfer) {
      alert('Masa veya ürün taşıma yetkiniz bulunmamaktadır. Lütfen yönetici veya patron ile görüşün.');
      return;
    }

    let effectiveOrder = order;
    if (!effectiveOrder && table.currentOrderId) {
      effectiveOrder = await db.orders.get(table.currentOrderId) || null;
    }
    if (!effectiveOrder) {
      effectiveOrder = await db.orders.where('tableId').equals(table.id)
        .filter((o: Order) => o.status !== 'paid' && o.status !== 'cancelled')
        .first() || null;
    }
    setTransferSourceTable(table);
    setTransferSourceOrder(effectiveOrder || null);
    setIsTransferModalOpen(true);
  };

  const user = state.currentUser;
  const isManager = user?.role === 'owner' || user?.role === 'manager';
  const activeEditMode = canEditTables && isEditMode;

  const floors = useLiveQuery(() => db.floors.orderBy('order').toArray(), []) || [];
  const currentFloorId = state.currentFloor || floors[0]?.id || 'floor-1';
  const currentFloor = floors.find(f => f.id === currentFloorId) || floors[0];
  
  const rawTables = useLiveQuery(
    () => db.table<Table>('tables').where('floorId').equals(currentFloorId).toArray(),
    [currentFloorId]
  ) || [];

  const tables = useMemo(() => {
    return [...rawTables].sort((a, b) => {
      const numA = typeof a.number === 'number' ? a.number : parseInt(a.label?.replace(/\D/g, '') || '0', 10);
      const numB = typeof b.number === 'number' ? b.number : parseInt(b.label?.replace(/\D/g, '') || '0', 10);
      if (numA !== numB) return numA - numB;
      return (a.label || '').localeCompare(b.label || '', undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [rawTables]);

  const activeOrders = useLiveQuery(
    () => db.orders.where('status').anyOf(['open', 'sent', 'preparing', 'ready', 'served']).toArray(),
    []
  ) || [];

  const getOrderForTable = (tableId: string) => activeOrders.find((o: Order) => o.tableId === tableId);

  // Summaries
  const totalOccupied = tables.filter((t: Table) => t.status === 'occupied' || t.status === 'payment_waiting').length;
  const totalGuests = tables.reduce((acc: number, t: Table) => acc + (t.guestCount || 0), 0);
  const totalRevenue = activeOrders.reduce((acc: number, o: Order) => acc + (o.total || 0), 0);

  // Single unified color palette helper
  const getTableCardStyle = (status: string) => {
    switch (status) {
      case 'occupied':
      case 'payment_waiting':
        return 'bg-white dark:bg-stone-900 border-orange-500 shadow-sm text-stone-900 dark:text-stone-100';
      case 'reserved':
        return 'bg-stone-50 dark:bg-stone-900/60 border-stone-300 dark:border-stone-700 border-dashed text-stone-600 dark:text-stone-400';
      case 'available':
      default:
        return 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700 text-stone-800 dark:text-stone-200 shadow-xs';
    }
  };

  const handleTableClick = (table: Table) => {
    if (activeEditMode) {
      setEditingTable(table);
      setIsTableModalOpen(true);
      return;
    }
    if (table.status === 'available' && !canOpen) {
      alert('Yeni masa açma yetkiniz bulunmamaktadır.');
      return;
    }
    navigate(`/order/${table.id}`);
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-950 dark:text-stone-100 select-none">
      {/* Clean Toolbar: Floors & Stats */}
      <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
        {/* Floor Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0">
          {floors.map((floor: Floor) => (
            <button
              key={floor.id}
              onClick={() => dispatch({ type: 'SET_FLOOR', floorId: floor.id })}
              className={cn(
                "px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0",
                currentFloorId === floor.id
                  ? "bg-orange-600 text-white shadow-xs"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
              )}
            >
              <PosIcon name={floor.icon} className={cn("w-3.5 h-3.5 shrink-0", currentFloorId === floor.id ? "text-white" : "text-stone-500 dark:text-stone-400")} />
              <span>{floor.name}</span>
            </button>
          ))}

          {canEditTables && (
            <button
              onClick={() => {
                setEditingFloor(null);
                setIsSectionModalOpen(true);
              }}
              className="p-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer shrink-0"
              title="Yeni Bölüm Ekle"
            >
              <Plus size={15} />
            </button>
          )}
        </div>

        {/* Clean Stats & Actions */}
        <div className="flex items-center gap-2.5 shrink-0 text-xs">
          <div className="hidden sm:flex items-center gap-2 text-stone-500 dark:text-stone-400 font-medium">
            <span><strong>{totalOccupied}</strong> / {tables.length} Dolu</span>
            <span>•</span>
            <span><strong>{totalGuests}</strong> Misafir</span>
            {canViewReports && (
              <>
                <span>•</span>
                <span className="font-bold text-stone-900 dark:text-white">{formatCurrency(totalRevenue)}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {canTransfer && (
              <button
                type="button"
                onClick={() => {
                  const occupiedTable = tables.find((t: Table) => t.status === 'occupied' || t.status === 'payment_waiting') || tables[0];
                  if (occupiedTable) {
                    handleOpenTransferModal(occupiedTable, getOrderForTable(occupiedTable.id));
                  } else {
                    alert('Aktarılacak aktif veya dolu bir masa adisyonu bulunmuyor.');
                  }
                }}
                className="px-2.5 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Adisyon veya Sipariş Aktar"
              >
                <ArrowRightLeft size={13} className="text-orange-600 dark:text-orange-400" />
                <span className="hidden sm:inline">Adisyon Taşı</span>
              </button>
            )}

            {canEditTables && (
              <>
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer",
                    activeEditMode
                      ? "bg-orange-600 text-white"
                      : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
                  )}
                >
                  <Settings2 size={13} />
                  <span>{activeEditMode ? 'Tamam' : 'Düzenle'}</span>
                </button>

                <button
                  onClick={() => {
                    setEditingTable(null);
                    setIsTableModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} />
                  <span className="hidden sm:inline">Masa Ekle</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Table Grid */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-28 md:pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {tables.map((table: Table) => {
            const order = getOrderForTable(table.id);
            const isOccupied = table.status === 'occupied' || table.status === 'payment_waiting';
            const startIso = order?.startedTakingAt || order?.createdAt || table.occupiedAt;
            const elapsedMins = startIso ? getElapsedMinutes(new Date(startIso)) : 0;
            
            return (
              <div
                key={table.id}
                role="button"
                tabIndex={0}
                onClick={() => handleTableClick(table)}
                className={cn(
                  "relative flex flex-col justify-between border-2 transition-all hover:scale-[1.01] active:scale-[0.98] rounded-2xl p-3.5 sm:p-4 min-h-[125px] sm:min-h-[140px] cursor-pointer group focus:outline-none focus:ring-2 focus:ring-orange-500",
                  getTableCardStyle(table.status),
                  activeEditMode && "border-dashed"
                )}
              >
                {/* Top Row: Label & Status */}
                <div className="flex items-start justify-between gap-1 w-full shrink-0">
                  <div className="flex items-baseline gap-1.5 min-w-0">
                    <span className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
                      {table.label}
                    </span>
                    <span className="text-[10px] text-stone-400 font-medium shrink-0">
                      {table.seats}K
                    </span>
                  </div>

                  <div className="shrink-0">
                    {activeEditMode ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTable(table);
                          setIsTableModalOpen(true);
                        }}
                        className="p-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 rounded-lg cursor-pointer"
                        title="Düzenle"
                      >
                        <Edit2 size={12} />
                      </button>
                    ) : (isOccupied || Boolean(order)) ? (
                      <div className="flex items-center gap-1.5">
                        {canTransfer && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenTransferModal(table, order);
                            }}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-stone-100 hover:bg-orange-100 text-stone-700 hover:text-orange-700 dark:bg-stone-800 dark:hover:bg-orange-950 dark:text-stone-300 dark:hover:text-orange-400 border border-stone-200 dark:border-stone-700 hover:border-orange-400 transition-colors flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                            title="Bu masanın adisyonunu başka bir masaya aktar"
                          >
                            <ArrowRightLeft size={11} className="text-orange-600 dark:text-orange-400" />
                            <span>Adisyon Taşı</span>
                          </button>
                        )}
                        {table.status === 'payment_waiting' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-stone-900 text-white dark:bg-white dark:text-stone-900">
                            Hesap
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-orange-600 text-white">
                            Dolu
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-medium text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800">
                        Boş
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle: Total or Empty label */}
                <div className="my-auto py-1">
                  {isOccupied && order ? (
                    <div>
                      <div className="text-base sm:text-lg font-black text-orange-600 dark:text-orange-400 font-mono tracking-tight leading-tight">
                        {formatCurrency(order.total)}
                      </div>
                      <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                        {order.items?.length || 0} ürün
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-stone-400 dark:text-stone-500 font-medium">
                      Boş
                    </div>
                  )}
                </div>

                {/* Bottom Row */}
                {isOccupied && !activeEditMode && (
                  <div className="pt-1.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 shrink-0 font-medium gap-1">
                    <div className="flex items-center gap-1 shrink-0">
                      <Users className="w-3 h-3 text-stone-400" />
                      <span>{table.guestCount || 1}</span>
                    </div>

                    <div
                      className="flex-1 text-center truncate px-1 text-[10px] font-semibold text-stone-600 dark:text-stone-300"
                      title={order?.waiters && order.waiters.length > 0 ? `Garson(lar): ${order.waiters.join(', ')}` : `Garson: ${order?.waiterName || 'Garson'}`}
                    >
                      {order?.waiters && order.waiters.length > 1
                        ? order.waiters.join(', ')
                        : (order?.waiterName || 'Garson')}
                    </div>

                    {elapsedMins > 0 && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{elapsedMins} dk</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Modals */}
      {isSectionModalOpen && (
        <SectionModal
          floor={editingFloor}
          onClose={() => setIsSectionModalOpen(false)}
          onSuccess={(newId) => {
            setIsSectionModalOpen(false);
            if (newId) dispatch({ type: 'SET_FLOOR', floorId: newId });
          }}
        />
      )}
      {isTableModalOpen && (
        <TableModal
          floors={floors}
          defaultFloorId={currentFloorId}
          table={editingTable}
          onClose={() => setIsTableModalOpen(false)}
          onSuccess={(savedFloorId) => {
            setIsTableModalOpen(false);
            if (savedFloorId) dispatch({ type: 'SET_FLOOR', floorId: savedFloorId });
          }}
        />
      )}

      {/* Table Transfer Modal */}
      {isTransferModalOpen && transferSourceTable && (
        <TableTransferModal
          currentTable={transferSourceTable}
          currentOrder={transferSourceOrder}
          currentItems={transferSourceOrder?.items || []}
          onClose={() => {
            setIsTransferModalOpen(false);
            setTransferSourceTable(null);
            setTransferSourceOrder(null);
          }}
          onSuccess={() => {
            setIsTransferModalOpen(false);
            setTransferSourceTable(null);
            setTransferSourceOrder(null);
          }}
        />
      )}
    </div>
  );
}
