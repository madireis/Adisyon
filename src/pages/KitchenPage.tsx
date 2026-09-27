import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Clock, CheckCircle2, ChefHat, Play, Flame, Coffee, Check, BellRing, Printer } from 'lucide-react';
import { db } from '@/lib/db';
import { cn, getElapsedMinutes } from '@/lib/utils';
import ThermalSlipModal from '@/components/pos/ThermalSlipModal';
import type { KitchenTicket, KitchenStation } from '@/types/pos';

export default function KitchenPage() {
  const [activeStation, setActiveStation] = useState<KitchenStation | 'ALL'>('ALL');
  const [mobileStatusTab, setMobileStatusTab] = useState<'new' | 'preparing' | 'ready' | 'completed'>('new');
  const [selectedTicketForPrint, setSelectedTicketForPrint] = useState<KitchenTicket | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const tickets = useLiveQuery(() => 
    db.kitchenTickets.orderBy('createdAt').toArray()
  , []) || [];

  const filteredTickets = tickets.filter(t => 
    activeStation === 'ALL' || t.station === activeStation
  );

  const newTickets = filteredTickets.filter(t => t.status === 'new');
  const preparingTickets = filteredTickets.filter(t => t.status === 'preparing');
  const readyTickets = filteredTickets.filter(t => t.status === 'ready');
  const servedTickets = filteredTickets.filter(t => t.status === 'completed');

  const stations: { id: KitchenStation | 'ALL', label: string, icon: React.ReactNode }[] = [
    { id: 'ALL', label: 'Tümü', icon: <ChefHat size={16} /> },
    { id: 'kitchen', label: 'Sıcak Mutfak', icon: <Flame size={16} /> },
    { id: 'bar', label: 'Bar', icon: <Coffee size={16} /> },
    { id: 'dessert', label: 'Tatlı', icon: <CheckCircle2 size={16} /> },
    { id: 'coffee', label: 'Kahve Barı', icon: <Coffee size={16} /> },
  ];

  const advanceStatus = async (ticket: KitchenTicket) => {
    const nowIso = new Date().toISOString();
    if (ticket.status === 'new') {
      await db.kitchenTickets.update(ticket.id, {
        status: 'preparing',
        startedAt: nowIso,
      });
      if (ticket.orderId) {
        try {
          await db.orders.update(ticket.orderId, { status: 'preparing' });
        } catch {}
      }
    } else if (ticket.status === 'preparing') {
      const sentTime = ticket.createdAt ? new Date(ticket.createdAt).getTime() : Date.now();
      const kitchenDurationMinutes = Math.max(1, Math.round((new Date(nowIso).getTime() - sentTime) / 60000));
      await db.kitchenTickets.update(ticket.id, {
        status: 'ready',
        completedAt: nowIso,
      });
      if (ticket.orderId) {
        try {
          await db.orders.update(ticket.orderId, {
            status: 'ready',
            kitchenReadyAt: nowIso,
            kitchenDurationMinutes,
          });
        } catch {}
      }
    } else if (ticket.status === 'ready') {
      await db.kitchenTickets.update(ticket.id, {
        status: 'completed',
      });
      if (ticket.orderId) {
        try {
          await db.orders.update(ticket.orderId, { status: 'served' });
        } catch {}
      }
    }
  };

  const TicketCard = ({ ticket }: { ticket: KitchenTicket }) => {
    const elapsedMinutes = getElapsedMinutes(new Date(ticket.createdAt));
    const isUrgent = elapsedMinutes > 15;

    return (
      <div className={cn(
        "bg-stone-800/95 rounded-2xl p-4 border-l-4 shadow-md flex flex-col gap-3 transition-all",
        isUrgent && ticket.status !== 'completed' ? "border-l-red-500 ring-1 ring-red-500/30" : "border-l-stone-600",
        ticket.status === 'ready' && "border-l-emerald-500",
        ticket.status === 'preparing' && "border-l-orange-500"
      )}>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-white">{ticket.tableLabel}</span>
              <span className="text-[11px] bg-stone-700 text-stone-300 px-2 py-0.5 rounded-md font-mono">
                #{ticket.id.slice(-4).toUpperCase()}
              </span>
            </div>
            <span className="text-stone-400 text-xs font-semibold mt-0.5 block">
              {stations.find(s => s.id === ticket.station)?.label || ticket.station}
            </span>
          </div>
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-xs sm:text-sm font-bold",
            isUrgent && ticket.status !== 'completed' ? "bg-red-500/25 text-red-300 animate-pulse" : "bg-stone-700 text-stone-200"
          )}>
            <Clock size={13} />
            {elapsedMinutes} dk
          </div>
        </div>

        {ticket.priority && (
          <div className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded-md w-max font-bold uppercase tracking-wider">
            ÖNCELİKLİ
          </div>
        )}

        <div className="flex-1 space-y-2 mt-1">
          {ticket.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-stone-200 border-b border-stone-700/50 pb-2 last:border-0">
              <div className="flex gap-2.5">
                <span className="font-black text-orange-400 text-base">{item.quantity}x</span>
                <div>
                  <div className="font-bold text-base text-stone-100 leading-snug">{item.name}</div>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div className="text-xs text-stone-400 mt-0.5">{item.modifiers.join(', ')}</div>
                  )}
                  {item.notes && (
                    <div className="text-xs text-amber-300 italic mt-0.5 font-medium">Not: {item.notes}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => setSelectedTicketForPrint(ticket)}
            className="py-2.5 px-3 bg-white text-stone-950 font-black text-xs rounded-xl shadow-xs hover:bg-stone-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            title="Mutfak Fişini Yazdır"
          >
            <Printer size={15} className="text-stone-950" />
            <span>Fiş Yazdır</span>
          </button>

          {ticket.status !== 'completed' && (
            <button
              onClick={() => advanceStatus(ticket)}
              className={cn(
                "flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95",
                ticket.status === 'new' ? "bg-blue-600 hover:bg-blue-700" : "",
                ticket.status === 'preparing' ? "bg-emerald-600 hover:bg-emerald-700" : "",
                ticket.status === 'ready' ? "bg-stone-600 hover:bg-stone-500" : ""
              )}
            >
              {ticket.status === 'new' && <><Play size={15} /> Başla</>}
              {ticket.status === 'preparing' && <><Check size={15} /> Hazır</>}
              {ticket.status === 'ready' && <><CheckCircle2 size={15} /> Servis Edildi</>}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-stone-900 text-stone-100 overflow-hidden select-none">
      {/* Top Bar */}
      <div className="bg-stone-950 p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-800 shrink-0 gap-3">
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <h1 className="text-lg sm:text-xl font-black text-white tracking-wider flex items-center gap-2">
            <ChefHat className="text-orange-500 w-5 h-5 sm:w-6 sm:h-6" />
            MUTFAK (KDS)
          </h1>
          <div className="text-sm sm:text-lg font-mono font-black text-white bg-stone-900 px-3 py-1 rounded-xl border border-stone-800 sm:hidden">
            {currentTime.toLocaleTimeString('tr-TR')}
          </div>
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto gap-3 overflow-x-auto no-scrollbar">
          {/* Station Filters */}
          <div className="flex bg-stone-900 rounded-xl p-1 gap-1 border border-stone-800 shrink-0">
            {stations.map(station => (
              <button
                key={station.id}
                onClick={() => setActiveStation(station.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap active:scale-95",
                  activeStation === station.id 
                    ? "bg-orange-600 text-white shadow-sm" 
                    : "text-stone-400 hover:text-white hover:bg-stone-800"
                )}
              >
                {station.icon}
                <span>{station.label}</span>
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-3">
            {newTickets.length > 0 && (
              <div className="flex items-center gap-1.5 text-amber-400 font-bold bg-amber-500/15 px-3 py-1.5 rounded-xl border border-amber-500/30 text-xs">
                <BellRing size={15} className="animate-bounce" />
                {newTickets.length} Yeni Fiş
              </div>
            )}
            <div className="text-base font-mono font-black text-white bg-stone-900 px-3.5 py-1.5 rounded-xl border border-stone-800">
              {currentTime.toLocaleTimeString('tr-TR')}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Column Selector Tabs (lg:hidden) */}
      <div className="lg:hidden flex bg-stone-950/80 p-2 border-b border-stone-800 gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setMobileStatusTab('new')}
          className={cn(
            "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap",
            mobileStatusTab === 'new'
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-stone-900 text-stone-400 hover:text-stone-200"
          )}
        >
          <span>YENİ</span>
          <span className="bg-blue-900/60 text-blue-200 text-[10px] px-1.5 py-0.5 rounded-full font-mono">{newTickets.length}</span>
        </button>
        <button
          onClick={() => setMobileStatusTab('preparing')}
          className={cn(
            "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap",
            mobileStatusTab === 'preparing'
              ? "bg-orange-600 text-white shadow-sm"
              : "bg-stone-900 text-stone-400 hover:text-stone-200"
          )}
        >
          <span>HAZIRLANIYOR</span>
          <span className="bg-orange-900/60 text-orange-200 text-[10px] px-1.5 py-0.5 rounded-full font-mono">{preparingTickets.length}</span>
        </button>
        <button
          onClick={() => setMobileStatusTab('ready')}
          className={cn(
            "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap",
            mobileStatusTab === 'ready'
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-stone-900 text-stone-400 hover:text-stone-200"
          )}
        >
          <span>HAZIR</span>
          <span className="bg-emerald-900/60 text-emerald-200 text-[10px] px-1.5 py-0.5 rounded-full font-mono">{readyTickets.length}</span>
        </button>
        <button
          onClick={() => setMobileStatusTab('completed')}
          className={cn(
            "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap",
            mobileStatusTab === 'completed'
              ? "bg-stone-700 text-white shadow-sm"
              : "bg-stone-900 text-stone-400 hover:text-stone-200"
          )}
        >
          <span>SERVİS EDİLDİ</span>
          <span className="bg-stone-800 text-stone-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono">{servedTickets.length}</span>
        </button>
      </div>

      {/* Mobile/Tablet Single Column Display (lg:hidden) */}
      <div className="lg:hidden flex-1 overflow-y-auto p-3 space-y-3 pb-20">
        {mobileStatusTab === 'new' && (
          newTickets.length === 0 ? <div className="text-stone-600 text-center py-16 text-sm">Bekleyen yeni sipariş fişi yok.</div> :
          newTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
        )}
        {mobileStatusTab === 'preparing' && (
          preparingTickets.length === 0 ? <div className="text-stone-600 text-center py-16 text-sm">Hazırlanan sipariş fişi yok.</div> :
          preparingTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
        )}
        {mobileStatusTab === 'ready' && (
          readyTickets.length === 0 ? <div className="text-stone-600 text-center py-16 text-sm">Bekleyen hazır sipariş fişi yok.</div> :
          readyTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
        )}
        {mobileStatusTab === 'completed' && (
          servedTickets.length === 0 ? <div className="text-stone-600 text-center py-16 text-sm">Servis edilen kayıt yok.</div> :
          servedTickets.slice(0, 15).map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)
        )}
      </div>

      {/* Desktop 4-Column Kanban Board (hidden on mobile, visible lg:grid) */}
      <div className="hidden lg:grid flex-1 grid-cols-4 gap-4 p-4 overflow-hidden">
        {/* YENİ */}
        <div className="flex flex-col bg-stone-950/60 rounded-2xl border border-stone-800 overflow-hidden">
          <div className="bg-blue-950/40 p-3.5 border-b border-blue-900/40 flex justify-between items-center">
            <h2 className="font-bold text-base text-blue-400">YENİ</h2>
            <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{newTickets.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {newTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)}
            {newTickets.length === 0 && <div className="text-stone-600 text-center py-10 text-sm">Yeni sipariş yok</div>}
          </div>
        </div>

        {/* HAZIRLANIYOR */}
        <div className="flex flex-col bg-stone-950/60 rounded-2xl border border-stone-800 overflow-hidden">
          <div className="bg-orange-950/40 p-3.5 border-b border-orange-900/40 flex justify-between items-center">
            <h2 className="font-bold text-base text-orange-400">HAZIRLANIYOR</h2>
            <span className="bg-orange-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{preparingTickets.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {preparingTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)}
            {preparingTickets.length === 0 && <div className="text-stone-600 text-center py-10 text-sm">Hazırlanan sipariş yok</div>}
          </div>
        </div>

        {/* HAZIR */}
        <div className="flex flex-col bg-stone-950/60 rounded-2xl border border-stone-800 overflow-hidden">
          <div className="bg-emerald-950/40 p-3.5 border-b border-emerald-900/40 flex justify-between items-center">
            <h2 className="font-bold text-base text-emerald-400">HAZIR</h2>
            <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{readyTickets.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {readyTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)}
            {readyTickets.length === 0 && <div className="text-stone-600 text-center py-10 text-sm">Bekleyen hazır fiş yok</div>}
          </div>
        </div>

        {/* SERVİS EDİLDİ */}
        <div className="flex flex-col bg-stone-950/60 rounded-2xl border border-stone-800 overflow-hidden opacity-75">
          <div className="bg-stone-900 p-3.5 border-b border-stone-800 flex justify-between items-center">
            <h2 className="font-bold text-base text-stone-400">SERVİS EDİLDİ</h2>
            <span className="bg-stone-700 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{servedTickets.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {servedTickets.slice(0, 10).map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)}
            {servedTickets.length === 0 && <div className="text-stone-600 text-center py-10 text-sm">Henüz kayıt yok</div>}
          </div>
        </div>
      </div>

      {selectedTicketForPrint && (
        <ThermalSlipModal
          isOpen={Boolean(selectedTicketForPrint)}
          onClose={() => setSelectedTicketForPrint(null)}
          type="kitchen"
          kitchenTicket={selectedTicketForPrint}
        />
      )}
    </div>
  );
}
