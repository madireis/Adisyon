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
      case 'available': return 'bg-white border-emerald-300 hover:border-emerald-500 shadow-2xs hover:shadow-md text-emerald-950';
      case 'occupied': return 'bg-orange-50/70 border-orange-400 hover:border-orange-500 shadow-2xs hover:shadow-md text-orange-950';
      case 'payment_waiting': return 'bg-red-50/70 border-red-400 hover:border-red-500 shadow-2xs hover:shadow-md text-red-950';
      case 'reserved': return 'bg-purple-50/70 border-purple-300 hover:border-purple-400 shadow-2xs text-purple-950';
      case 'cleaning': return 'bg-stone-100 border-stone-300 text-stone-600';
      default: return 'bg-white border-stone-200 text-stone-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'occupied': return 'bg-orange-100 text-orange-800 border border-orange-300';
      case 'payment_waiting': return 'bg-red-100 text-red-700 border border-red-300 animate-pulse';
      case 'reserved': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'cleaning': return 'bg-stone-200 text-stone-700 border border-stone-300';
      default: return 'bg-stone-100 text-stone-700 border border-stone-200';
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
      case 'round': return 'rounded-full aspect-square';
      case 'square': return 'rounded-2xl aspect-square';
      case 'rectangle': return 'rounded-2xl aspect-[4/3]';
      default: return 'rounded-2xl aspect-square';
    }
  };

  const handleTableClick = (table: Table) => {
    if (isEditMode) {
      setEditingTable(table);
      setIsTableModalOpen(true);
      return;
    }
    navigate(`/order/${table.id}`);
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 select-none">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3.5 sm:p-4 bg-white shadow-xs shrink-0 border-b border-stone-200 gap-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-stone-900">Masa Planı</h1>
              {isEditMode && (
                <span className="bg-amber-100 text-amber-900 text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-full border border-amber-300 animate-pulse">
                  Düzenleme Modu
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">Wot's Cafe — Dokunmatik Salon & Bölüm Yönetimi</p>
          </div>

          {/* Mobile compact summary */}
          <div className="flex sm:hidden items-center gap-2 bg-stone-100 px-2.5 py-1.5 rounded-xl border border-stone-200 text-[11px] font-bold">
            <span className="text-stone-700">{totalOccupied}/{tables.length} Dolu</span>
            <span className="text-stone-300">•</span>
            <span className="text-emerald-700 font-extrabold">{formatCurrency(totalRevenue)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 justify-end">
          {/* Quick Add Table Button (Always accessible) */}
          <button
            onClick={() => {
              setEditingTable(null);
              setIsTableModalOpen(true);
            }}
            className="px-3 sm:px-4 py-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Yeni Masa Ekle"
          >
            <Plus size={16} />
            <span className="hidden xs:inline">Yeni Masa Ekle</span>
            <span className="xs:hidden">Masa Ekle</span>
          </button>

          {/* Section Management Button (Only for Manager/Admin) */}
          {isManager && (
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={cn(
                "px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border active:scale-95",
                isEditMode
                  ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200 border-stone-300"
              )}
            >
              <Settings2 size={16} />
              <span className="hidden sm:inline">{isEditMode ? 'Düzenlemeyi Bitir' : 'Planı Düzenle'}</span>
              <span className="sm:hidden">{isEditMode ? 'Bitir' : 'Düzenle'}</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-6 border-l border-stone-200 pl-5">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Açık Masalar</span>
              <span className="text-sm font-black text-stone-900">{totalOccupied} / {tables.length}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Misafirler</span>
              <span className="text-sm font-black text-stone-900">{totalGuests} Kişi</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Canlı Ciro</span>
              <span className="text-sm font-black text-emerald-600">{formatCurrency(totalRevenue)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Live Operational Status Strip */}
      <div className="bg-white border-b border-stone-200 px-3.5 sm:px-6 py-2 flex items-center justify-between overflow-x-auto no-scrollbar gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{totalAvailable} Boş</span>
          </div>
          <div className="flex items-center gap-1.5 bg-orange-50 text-orange-800 px-2.5 py-1 rounded-lg border border-orange-200 font-bold">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            <span>{totalOccupied} Dolu</span>
          </div>
          {totalPaymentWaiting > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 text-red-800 px-2.5 py-1 rounded-lg border border-red-200 font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>{totalPaymentWaiting} Hesap</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg border border-stone-200 font-semibold">
            <Users size={13} className="text-stone-500" />
            <span>{totalGuests} Misafir</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 font-bold">
          <span className="text-stone-400 text-[11px] uppercase tracking-wider hidden sm:inline">Canlı Ciro:</span>
          <span className="bg-emerald-600 text-white px-3 py-1 rounded-lg font-black text-xs shadow-2xs">
            {formatCurrency(totalRevenue)}
          </span>
        </div>
      </div>

      {/* Sections / Floors Bar */}
      <div className="flex items-center justify-between p-2.5 sm:p-3 bg-stone-100/60 border-b border-stone-200 shrink-0 overflow-x-auto no-scrollbar gap-2">
        <div className="flex items-center gap-1.5">
          {floors.map((floor: Floor) => (
            <button
              key={floor.id}
              onClick={() => dispatch({ type: 'SET_FLOOR', floorId: floor.id })}
              className={cn(
                "px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0",
                currentFloorId === floor.id
                  ? "bg-orange-600 text-white shadow-xs"
                  : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200"
              )}
            >
              <PosIcon name={floor.icon} className="w-4 h-4 shrink-0" />
              <span>{floor.name}</span>
            </button>
          ))}

          {/* Add Section Button (for Manager) */}
          {isManager && (
            <button
              onClick={() => {
                setEditingFloor(null);
                setIsSectionModalOpen(true);
              }}
              className="px-3 py-2 rounded-xl font-bold text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
            >
              <Plus size={15} />
              <span>Bölüm Ekle</span>
            </button>
          )}
        </div>

        {/* Current Section Actions */}
        {currentFloor && (
          <div className="flex items-center gap-2 shrink-0">
            {isEditMode && (
              <button
                onClick={() => {
                  setEditingFloor(currentFloor);
                  setIsSectionModalOpen(true);
                }}
                className="px-2.5 sm:px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1 border border-stone-200 active:scale-95"
              >
                <Edit2 size={13} />
                <span className="hidden sm:inline">"{currentFloor.name}" Düzenle</span>
                <span className="sm:hidden">Düzenle</span>
              </button>
            )}
            <button
              onClick={() => {
                setEditingTable(null);
                setIsTableModalOpen(true);
              }}
              className="px-3 sm:px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
              title={`${currentFloor.name} bölümüne yeni masa ekle`}
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Bu Bölüme Masa Ekle</span>
              <span className="sm:hidden">Masa Ekle</span>
            </button>
          </div>
        )}
      </div>

      {/* Table Grid */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-24 md:pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
          {tables.map((table: Table) => {
            const order = getOrderForTable(table.id);
            const isOccupied = table.status === 'occupied' || table.status === 'payment_waiting';
            
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
                  "relative flex flex-col p-3.5 sm:p-4 border-2 transition-all hover:scale-[1.01] active:scale-[0.97] shadow-2xs overflow-hidden text-left cursor-pointer group min-h-[125px] sm:min-h-[145px] focus:outline-none focus:ring-2 focus:ring-orange-500",
                  getStatusColor(table.status),
                  getShapeClasses(table.shape),
                  isEditMode && "hover:border-amber-500 border-dashed"
                )}
              >
                {/* Header info */}
                <div className="flex justify-between items-start w-full">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight">{table.label}</span>
                  {isEditMode ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTable(table);
                        setIsTableModalOpen(true);
                      }}
                      className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
                      title="Masayı Düzenle"
                    >
                      <Edit2 size={13} />
                    </button>
                  ) : (
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1",
                      getStatusBadgeColor(table.status)
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        table.status === 'available' ? "bg-emerald-500" :
                        table.status === 'occupied' ? "bg-orange-500" :
                        table.status === 'payment_waiting' ? "bg-red-500" : "bg-stone-400"
                      )}></span>
                      {getStatusLabel(table.status)}
                    </span>
                  )}
                </div>
                
                {/* Occupied State or Capacity */}
                {isOccupied && order ? (
                  <div className="mt-auto pt-2 space-y-0.5 w-full flex flex-col items-center justify-center pb-6">
                    <span className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">{formatCurrency(order.total)}</span>
                    <span className="text-[11px] font-medium text-stone-600 truncate max-w-[120px]">{order.waiterName}</span>
                  </div>
                ) : (
                  <div className="mt-auto pb-5 text-stone-400 text-xs font-semibold text-center group-hover:text-emerald-700 transition-colors">
                    {table.seats} Kişilik • <span className="font-bold">Boş</span>
                  </div>
                )}

                {/* Bottom Bar info */}
                {isOccupied && !isEditMode && (
                   <div className="absolute bottom-0 left-0 right-0 bg-stone-900/10 backdrop-blur-xs px-3 py-1.5 flex justify-between items-center text-[11px] font-semibold text-stone-700">
                     <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-stone-500" />
                        <span>{table.guestCount || 1} kişi</span>
                     </div>
                     <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-500" />
                        <span>{table.occupiedAt ? getElapsedMinutes(new Date(table.occupiedAt)) + ' dk' : '-'}</span>
                     </div>
                   </div>
                )}

                {isEditMode && (
                  <div className="absolute bottom-0 left-0 right-0 bg-amber-500/15 text-amber-950 text-center py-1 text-[10px] font-bold">
                    Düzenlemek İçin Tıkla
                  </div>
                )}
              </div>
            );
          })}

          {/* Quick Add Table Card inside Grid in Edit Mode */}
          {isEditMode && (
            <button
              onClick={() => {
                setEditingTable(null);
                setIsTableModalOpen(true);
              }}
              className="border-2 border-dashed border-stone-300 hover:border-orange-500 rounded-2xl flex flex-col items-center justify-center p-4 sm:p-6 text-stone-400 hover:text-orange-600 hover:bg-orange-50/40 transition-all cursor-pointer min-h-[140px]"
            >
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-2">
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
            <p className="text-xs text-stone-400 mt-1 mb-4">Yeni masalar ekleyerek salon planınızı oluşturun.</p>
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
          </div>
        )}
      </main>

      {/* Floating Action Button (Hızlı Masa Ekle) */}
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
