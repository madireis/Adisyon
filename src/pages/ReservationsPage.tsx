import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Calendar as CalendarIcon, Clock, Users, Plus, CheckCircle2, Phone, X } from 'lucide-react';
import { cn, generateId } from '@/lib/utils';
import type { Reservation, ReservationStatus } from '@/types/pos';

export default function ReservationsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [time, setTime] = useState('19:30');
  const [notes, setNotes] = useState('');

  const reservations = useLiveQuery(() => db.reservations.toArray()) || [];

  const handleAddReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone) return;

    const newRes: Reservation = {
      id: generateId(),
      customerName,
      phone,
      guestCount,
      date: new Date().toISOString().split('T')[0],
      time,
      notes,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    await db.reservations.add(newRes);
    setIsModalOpen(false);
    setCustomerName('');
    setPhone('');
    setNotes('');
  };

  const updateStatus = async (id: string, status: ReservationStatus) => {
    await db.reservations.update(id, { status });
  };

  const statusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'confirmed':
        return <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">Onaylandı</span>;
      case 'seated':
        return <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">Masaya Oturdu</span>;
      case 'completed':
        return <span className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-stone-200 dark:border-stone-700">Tamamlandı</span>;
      case 'cancelled':
        return <span className="bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-900">İptal Edildi</span>;
      case 'no_show':
        return <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">Gelmedi</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-full flex flex-col space-y-6 dark:bg-stone-950 dark:text-stone-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-800 dark:text-stone-100 tracking-tight">Masa Rezervasyonları</h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Günün randevulu misafirleri, sahil masası tercihleri ve kapasite yönetimi</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          <Plus size={18} />
          Yeni Rezervasyon Al
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reservations.map((res: Reservation) => (
          <div key={res.id} className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">{res.customerName}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    <Phone size={12} />
                    <span>{res.phone}</span>
                  </div>
                </div>
                {statusBadge(res.status)}
              </div>

              <div className="flex gap-4 py-2 border-y border-stone-100 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 font-semibold mb-3">
                <div className="flex items-center gap-1">
                  <Clock size={14} className="text-orange-600" />
                  <span>Saat {res.time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={14} className="text-orange-600" />
                  <span>{res.guestCount} Kişi</span>
                </div>
              </div>

              {res.notes && (
                <p className="text-xs text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-950 p-2.5 rounded-xl border border-stone-100 dark:border-stone-800 italic">
                  "{res.notes}"
                </p>
              )}
            </div>

            <div className="flex gap-2 mt-4 pt-3 border-t border-stone-100 dark:border-stone-800">
              {res.status === 'confirmed' && (
                <button
                  onClick={() => updateStatus(res.id, 'seated')}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Masaya Oturt
                </button>
              )}
              {res.status !== 'cancelled' && res.status !== 'completed' && (
                <button
                  onClick={() => updateStatus(res.id, 'cancelled')}
                  className="px-3 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-300 text-stone-600 dark:text-stone-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  İptal
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Reservation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-6 w-full max-w-md shadow-2xl border border-stone-200 dark:border-stone-800 dark:text-stone-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Yeni Rezervasyon</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddReservation} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase block mb-1">Misafir Adı Soyadı</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-stone-850 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Örn: Mehmet Bey"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase block mb-1">Telefon</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-stone-850 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0532 ..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase block mb-1">Kişi Sayısı</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={guestCount}
                    onChange={e => setGuestCount(Number(e.target.value))}
                    className="w-full p-2.5 bg-white dark:bg-stone-850 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase block mb-1">Saat</label>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-stone-850 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase block mb-1">Özel İstek / Not</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Örn: Teras ön masa, bebek sandalyesi..."
                  className="w-full p-2.5 bg-white dark:bg-stone-850 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={2}
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
              >
                Kaydet
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
