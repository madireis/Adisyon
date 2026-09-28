import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useApp } from '@/lib/store';
import { cn, formatCurrency, getElapsedMinutes } from '@/lib/utils';
import { Clock, Users, Plus, Edit2, Settings2, Trash2, CheckCircle2, Utensils } from 'lucide-react';
import type { Table, Floor, Order } from '@/types/pos';
import SectionModal from '@/components/tables/SectionModal';
import TableModal from '@/components/tables/TableModal';
import PosIcon from '@/components/common/PosIcon';

export default function TablesPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  
  // Floor and table states
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);

  const user = state.currentUser;
  const isManager = user?.role === 'owner' || user?.role === 'manager';
  const activeEditMode = isManager && isEditMode;

  const floors = useLiveQuery(() => db.floors.orderBy('order').toArray(), []) || [];
  const currentFloorId = state.currentFloor || floors[0]?.id || 'floor-1';
  const currentFloor = floors.find(f => f.id === currentFloorId) || floors[0];
  
  const tables = useLiveQuery(
    () => db.table<Table>('tables').where('floorId').equals(currentFloorId).toArray(),
    [currentFloorId]
  ) || [];

  const activeOrders = useLiveQuery(
    () => db.orders.where('status').anyOf(['open', 'sent', 'preparing', 'ready', 'served']).toArray(),
    []
  ) || [];

  const getOrderForTable = (tableId: string) => activeOrders.find((o: Order) => o.tableId === tableId);

  // Summaries
  const totalAvailable = tables.filter((t: Table) => t.status === 'available').length;
  const totalOccupied = tables.filter((t: Table) => t.status === 'occupied').length;
  const totalPaymentWaiting = tables.filter((t: Table) => t.status === 'payment_waiting').length;
  const totalGuests = tables.reduce((acc: number, t: Table) => acc + (t.guestCount || 0), 0);
  const totalRevenue = activeOrders.reduce((acc: number, o: Order) => acc + (o.total || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-white dark:bg-stone-900/90 border-emerald-300 dark:border-emerald-500/40 hover:border-emerald-500 dark:hover:border-emerald-400 shadow-2xs hover:shadow-md text-emerald-950 dark:text-stone-100';
      case 'occupied': return 'bg-orange-50/70 dark:bg-stone-900/90 border-orange-400 dark:border-orange-500/60 hover:border-orange-500 dark:hover:border-orange-400 shadow-2xs hover:shadow-md text-orange-950 dark:text-stone-100';
      case 'payment_waiting': return 'bg-red-50/70 dark:bg-stone-900/90 border-red-400 dark:border-red-500/80 hover:border-red-500 dark:hover:border-red-400 shadow-2xs hover:shadow-md text-red-950 dark:text-stone-100';
      case 'reserved': return 'bg-purple-50/70 dark:bg-stone-900 border-purple-300 dark:border-stone-800 hover:border-purple-400 dark:hover:border-stone-700 shadow-2xs text-purple-950 dark:text-stone-100';
      case 'cleaning': return 'bg-stone-100 dark:bg-stone-900 border-stone-300 dark:border-stone-800 text-stone-600 dark:text-stone-400';
      default: return 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-100';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
      case 'occupied': return 'bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-800';
      case 'payment_waiting': return 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 animate-pulse';
      case 'reserved': return 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
      case 'cleaning': return 'bg-stone-200 dark:bg-stone-900 text-stone-700 dark:text-stone-400 border border-stone-300 dark:border-stone-800';
      default: return 'bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-400 border border-stone-200 dark:border-stone-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Boş';
      case 'occupied': return 'Dolu';
      case 'payment_waiting': return 'Hesap Bekliyor';
      case 'reserved': return 'Rezerve';
      case 'cleaning': return 'Temizleniyor';
      default: return status;
    }
  };

  const getShapeClasses = (shape: string) => {
    switch (shape) {
      case 'round': return 'rounded-full aspect-square p-2.5 sm:p-3 items-center justify-center text-center';
      case 'rectangle': return 'rounded-2xl aspect-[16/11] p-3.5 sm:p-4';
      case 'square': return 'rounded-2xl aspect-square p-3.5 sm:p-4';
      default: return 'rounded-2xl aspect-square p-3.5 sm:p-4';
    }
  };

  const handleTableClick = (table: Table) => {
    if (activeEditMode) {
      setEditingTable(table);
      setIsTableModalOpen(true);
      return;
    }
    navigate(`/order/${table.id}`);
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-950 dark:text-stone-100 select-none">
      {/* Blended Toolbar: Floors & Live Indicators */}
      <div className="px-3 sm:px-6 py-2 sm:py-2.5 flex flex-col gap-2 shrink-0 bg-[#f8f7f5]/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200/50 dark:border-stone-800">
        {/* Floor Switcher Row */}
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1">
            {floors.map((floor: Floor) => (
              <button
                key={floor.id}
                onClick={() => dispatch({ type: 'SET_FLOOR', floorId: floor.id })}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0 shadow-xs",
                  currentFloorId === floor.id
                    ? "bg-orange-600 text-white shadow-sm font-black"
                    : "bg-white text-stone-950 dark:bg-white dark:text-stone-950 hover:bg-stone-100 hover:text-black dark:hover:bg-stone-100 dark:hover:text-black border border-stone-300 dark:border-stone-300 font-extrabold shadow-xs"
                )}
              >
                <PosIcon name={floor.icon} className={cn("w-3.5 h-3.5 shrink-0", currentFloorId === floor.id ? "text-white" : "text-stone-950 dark:text-stone-950")} />
                <span>{floor.name}</span>
              </button>
            ))}

            {/* Manager: Add Floor */}
            {isManager && (
              <button
                onClick={() => {
                  setEditingFloor(null);
                  setIsSectionModalOpen(true);
                }}
                className="p-1.5 rounded-xl bg-white text-stone-950 dark:bg-white dark:text-stone-950 hover:bg-stone-100 hover:text-black dark:hover:bg-stone-100 dark:hover:text-black border border-stone-300 dark:border-stone-300 shadow-xs transition-colors cursor-pointer shrink-0 active:scale-95 font-bold"
                title="Yeni Bölüm Ekle"
              >
                <Plus size={15} className="text-stone-950 dark:text-stone-950 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Manager Quick Actions (Desktop/Tablet) */}
          {isManager && (
            <div className="hidden sm:flex items-center gap-1.5 shrink-0 border-l border-stone-200/80 dark:border-stone-800 pl-2.5">
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={cn(
                  "px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border active:scale-95 shadow-xs",
                  activeEditMode
                    ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                    : "bg-white text-stone-950 dark:bg-white dark:text-stone-950 hover:bg-stone-100 hover:text-black border-stone-300 dark:border-stone-300 font-extrabold"
                )}
                title={activeEditMode ? 'Düzenlemeyi Bitir' : 'Masa Planını Düzenle'}
              >
                <Settings2 size={14} className={activeEditMode ? "text-white" : "text-stone-950 dark:text-stone-950"} />
                <span>{activeEditMode ? 'Bitir' : 'Düzenle'}</span>
              </button>

              <button
                onClick={() => {
                  setEditingTable(null);
                  setIsTableModalOpen(true);
                }}
                className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                title="Yeni Masa Ekle"
              >
                <Plus size={14} />
                <span>Masa Ekle</span>
              </button>
            </div>
          )}
        </div>

        {/* Live Counters & Mobile Manager Actions */}
        <div className="flex items-center justify-between gap-2 w-full pt-1 border-t border-stone-200/40 dark:border-stone-800/40 text-xs">
          {/* Status badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 font-semibold">
            <span 
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0" 
              title="Boş Masalar"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="font-bold">{totalAvailable} Boş</span>
            </span>
            <span 
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/60 shrink-0" 
              title="Dolu Masalar"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
              <span className="font-bold">{totalOccupied} Dolu</span>
            </span>
            {totalPaymentWaiting > 0 && (
              <span 
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200/60 dark:border-red-800/60 animate-pulse shrink-0" 
                title="Hesap Bekleyenler"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                <span className="font-bold">{totalPaymentWaiting} Hesap</span>
              </span>
            )}
            <span 
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-transparent dark:border-stone-700 shrink-0" 
              title="Toplam Misafir Sayısı"
            >
              <Users size={12} className="text-stone-500 dark:text-stone-400" />
              <span className="font-bold">{totalGuests}</span>
            </span>
            {isManager && (
              <span 
                className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-black text-xs shadow-2xs shrink-0" 
                title="Canlı Ciro"
              >
                {formatCurrency(totalRevenue)}
              </span>
            )}
          </div>

          {/* Manager Quick Actions (Mobile only) */}
          {isManager && (
            <div className="flex sm:hidden items-center gap-1 shrink-0 ml-auto">
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer border active:scale-95 shadow-xs min-h-[30px] min-w-[30px]",
                  activeEditMode
                    ? "bg-amber-500 text-white border-amber-600"
                    : "bg-white text-stone-950 dark:bg-white dark:text-stone-950 border-stone-300"
                )}
                title={activeEditMode ? 'Düzenlemeyi Bitir' : 'Masa Planını Düzenle'}
              >
                <Settings2 size={13} className={activeEditMode ? "text-white" : "text-stone-950 dark:text-stone-950"} />
              </button>

              <button
                onClick={() => {
                  setEditingTable(null);
                  setIsTableModalOpen(true);
                }}
                className="p-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center shadow-2xs cursor-pointer min-h-[30px] min-w-[30px]"
                title="Yeni Masa Ekle"
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table Grid */}
      <main className="flex-1 overflow-y-auto p-2.5 sm:p-5 lg:p-6 pb-28 md:pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4 lg:gap-5">
          {tables.map((table: Table) => {
            const order = getOrderForTable(table.id);
            const isOccupied = table.status === 'occupied' || table.status === 'payment_waiting';
            const startIso = order?.startedTakingAt || order?.createdAt || table.occupiedAt;
            const startTimeStr = startIso ? new Date(startIso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '';
            const elapsedMins = startIso ? getElapsedMinutes(new Date(startIso)) : 0;
            
            return (
              <div
                key={table.id}
                role="button"
                tabIndex={0}
                data-table-id={table.id}
                data-table-label={table.label}
                onClick={() => handleTableClick(table)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTableClick(table);
                  }
                }}
                className={cn(
                  "relative flex flex-col justify-between border-2 transition-all hover:scale-[1.01] active:scale-[0.97] shadow-2xs rounded-2xl sm:rounded-3xl p-3 sm:p-4 min-h-[135px] sm:min-h-[148px] overflow-hidden cursor-pointer group focus:outline-none focus:ring-2 focus:ring-orange-500",
                  getStatusColor(table.status),
                  activeEditMode && "hover:border-amber-500 border-dashed"
                )}
              >
                {/* Top Row: Label, Capacity, Status Badge / Edit Button */}
                <div className="flex items-start justify-between gap-1 w-full shrink-0">
                  <div className="flex items-baseline gap-1.5 min-w-0">
                    <span className="text-xl sm:text-2xl font-black tracking-tight leading-none text-stone-900 dark:text-stone-100">
                      {table.label}
                    </span>
                    <span className="text-[10px] text-stone-400 dark:text-stone-500 font-bold shrink-0">
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
                        className="p-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
                        title="Masayı Düzenle"
                      >
                        <Edit2 size={12} />
                      </button>
                    ) : order?.status === 'ready' ? (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 bg-emerald-600 text-white shadow-xs animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0"></span>
                        <span className="truncate">Hazır!</span>
                      </span>
                    ) : (
                      <span className={cn(
                        "text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider flex items-center gap-1",
                        getStatusBadgeColor(table.status)
                      )}>
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          table.status === 'available' ? "bg-emerald-500" :
                          table.status === 'occupied' ? "bg-orange-500" :
                          table.status === 'payment_waiting' ? "bg-red-500" : "bg-stone-400"
                        )}></span>
                        <span className="truncate">{getStatusLabel(table.status)}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Content: Total Price or Empty Status */}
                <div className="my-auto py-1 flex flex-col justify-center">
                  {isOccupied && order ? (
                    <div>
                      <div className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 font-mono tracking-tight leading-tight">
                        {formatCurrency(order.total)}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                        {order.waiterName && <span className="font-semibold truncate">{order.waiterName}</span>}
                        {order.items && order.items.length > 0 && (
                          <span className="text-stone-400 dark:text-stone-600 font-bold">• {order.items.length} kalem</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] sm:text-xs text-stone-400 dark:text-stone-500 font-semibold group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      Masa Boş
                    </div>
                  )}
                </div>

                {/* Bottom Docked Footer: Guest Count & Elapsed Time */}
                {isOccupied && !activeEditMode ? (
                  <div className="pt-1.5 border-t border-stone-200/60 dark:border-stone-800/80 flex items-center justify-between text-[10px] font-semibold text-stone-600 dark:text-stone-400 shrink-0">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-stone-400 dark:text-stone-500 shrink-0" />
                      <span>{table.guestCount || 1} kişi</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-orange-500 dark:text-orange-400 shrink-0" />
                      <span>{startTimeStr ? `${startTimeStr} (${elapsedMins}dk)` : '-'}</span>
                    </div>
                  </div>
                ) : activeEditMode ? (
                  <div className="pt-1 text-center text-[10px] font-bold text-amber-600 dark:text-amber-400 border-t border-amber-200/50 dark:border-amber-800/50">
                    Düzenle
                  </div>
                ) : (
                  <div className="pt-1 border-t border-stone-100 dark:border-stone-800/40 text-[10px] text-stone-400 dark:text-stone-500 font-medium">
                    Sipariş almak için dokunun
                  </div>
                )}
              </div>
            );
          })}

          {/* Quick Add Table Card inside Grid in Edit Mode */}
          {activeEditMode && (
            <button
              onClick={() => {
                setEditingTable(null);
                setIsTableModalOpen(true);
              }}
              className="border-2 border-dashed border-stone-300 dark:border-stone-800 hover:border-orange-500 rounded-2xl flex flex-col items-center justify-center p-4 sm:p-6 text-stone-400 hover:text-orange-600 hover:bg-orange-50/40 dark:hover:bg-stone-900 transition-all cursor-pointer min-h-[140px]"
            >
              <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-2">
                <Plus size={20} />
              </div>
              <span className="text-xs font-bold">Yeni Masa Ekle</span>
              <span className="text-[10px] text-stone-400 mt-0.5">{currentFloor?.name} için</span>
            </button>
          )}
        </div>

        {tables.length === 0 && (
          <div className="py-20 text-center text-stone-400 flex flex-col items-center">
            <Utensils className="w-12 h-12 text-stone-300 mb-3" />
            <h3 className="text-lg font-bold text-stone-700">Bu bölümde henüz masa bulunmuyor</h3>
            <p className="text-xs text-stone-400 mt-1 mb-4">
              {isManager 
                ? 'Yeni masalar ekleyerek salon planınızı oluşturun.' 
                : 'Bu bölüme henüz masa tanımlanmamış. Lütfen yöneticinize danışın.'}
            </p>
            {isManager && (
              <button
                onClick={() => {
                  setEditingTable(null);
                  setIsTableModalOpen(true);
                }}
                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Plus size={16} />
                <span>Bu Bölüme İlk Masayı Ekle</span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button (Hızlı Masa Ekle - Yalnızca Yönetici) */}
      {isManager && (
        <button
          onClick={() => {
            setEditingTable(null);
            setIsTableModalOpen(true);
          }}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-30 bg-orange-600 hover:bg-orange-700 active:scale-90 text-white rounded-2xl p-3.5 shadow-xl shadow-orange-600/30 flex items-center gap-2 font-black text-xs transition-all cursor-pointer group"
          title="Hızlı Masa Ekle"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-200" />
          <span className="pr-1">Masa Ekle</span>
        </button>
      )}

      {/* Section / Floor Modal */}
      {isSectionModalOpen && (
        <SectionModal
          floor={editingFloor}
          onClose={() => {
            setIsSectionModalOpen(false);
            setEditingFloor(null);
          }}
          onSuccess={(newFloorId) => {
            setIsSectionModalOpen(false);
            setEditingFloor(null);
            if (newFloorId) {
              dispatch({ type: 'SET_FLOOR', floorId: newFloorId });
            }
          }}
        />
      )}

      {/* Table Modal */}
      {isTableModalOpen && (
        <TableModal
          table={editingTable}
          defaultFloorId={currentFloorId}
          floors={floors}
          onClose={() => {
            setIsTableModalOpen(false);
            setEditingTable(null);
          }}
          onSuccess={(savedFloorId) => {
            setIsTableModalOpen(false);
            setEditingTable(null);
            if (savedFloorId) {
              dispatch({ type: 'SET_FLOOR', floorId: savedFloorId });
            }
          }}
        />
      )}
    </div>
  );
}
