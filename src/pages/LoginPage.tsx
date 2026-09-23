import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/store';
import { Grid2X2, ShieldCheck, ChefHat, Smartphone, ArrowRight, Sparkles, Coffee } from 'lucide-react';
import type { Staff } from '@/types/pos';

export default function LoginPage() {
  const { dispatch } = useApp();
  const navigate = useNavigate();

  const handleSelectRole = (mode: 'waiter' | 'owner' | 'kitchen') => {
    if (mode === 'waiter') {
      const waiterUser: Staff = {
        id: 'staff-1',
        name: 'Ahmet Yılmaz',
        role: 'waiter',
        pin: '1234',
        active: true,
      };
      dispatch({ type: 'LOGIN', user: waiterUser });
      navigate('/tables');
    } else if (mode === 'owner') {
      const ownerUser: Staff = {
        id: 'staff-7',
        name: 'Patron (Yetkili)',
        role: 'owner',
        pin: '9999',
        active: true,
      };
      dispatch({ type: 'LOGIN', user: ownerUser });
      navigate('/dashboard');
    } else if (mode === 'kitchen') {
      const kitchenUser: Staff = {
        id: 'staff-3',
        name: 'Mehmet Demir',
        role: 'kitchen',
        pin: '3456',
        active: true,
      };
      dispatch({ type: 'LOGIN', user: kitchenUser });
      navigate('/kitchen');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/80 flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-3xl">
        {/* Brand Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-600/25 mb-4">
            <Coffee size={32} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">WOT'S CAFE</h1>
          <p className="text-xs sm:text-sm font-bold text-orange-600 uppercase tracking-widest mt-1">Silivri Sahil — Restoran POS Sistemi</p>
          <p className="text-stone-500 text-xs sm:text-sm mt-2 font-medium">
            Giriş yapmak istediğiniz çalışma alanını seçin:
          </p>
        </div>

        {/* 4 Clean Role Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Garson Girişi */}
          <button
            onClick={() => handleSelectRole('waiter')}
            className="bg-white hover:bg-orange-50/40 rounded-2xl p-4 sm:p-6 border-2 border-stone-200 hover:border-orange-500 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left flex flex-col justify-between min-h-[180px] cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Grid2X2 size={26} />
              </div>
              <span className="bg-orange-100 text-orange-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                Hızlı Servis
              </span>
            </div>
            <div className="my-3">
              <h2 className="text-xl font-black text-stone-900 group-hover:text-orange-600 transition-colors">
                Garson Terminali
              </h2>
              <p className="text-stone-500 text-xs mt-1 leading-relaxed">
                Masa planı, adisyon açma, sipariş alma ve mutfağa iletme.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-orange-600 font-bold text-xs pt-3 border-t border-stone-100">
              <span>Masalara Doğrudan Geç</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Mutfak Ekranı (KDS) */}
          <button
            onClick={() => handleSelectRole('kitchen')}
            className="bg-white hover:bg-blue-50/40 rounded-2xl p-4 sm:p-6 border-2 border-stone-200 hover:border-blue-500 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left flex flex-col justify-between min-h-[180px] cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ChefHat size={26} />
              </div>
              <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                Mutfak & Bar
              </span>
            </div>
            <div className="my-3">
              <h2 className="text-xl font-black text-stone-900 group-hover:text-blue-600 transition-colors">
                Mutfak Ekranı (KDS)
              </h2>
              <p className="text-stone-500 text-xs mt-1 leading-relaxed">
                İstasyon bazlı hazırlık fişleri ve sipariş durum takibi.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs pt-3 border-t border-stone-100">
              <span>Mutfak Ekranını Aç</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Yetkili / Yönetici Girişi */}
          <button
            onClick={() => handleSelectRole('owner')}
            className="bg-white hover:bg-stone-50 rounded-2xl p-4 sm:p-6 border-2 border-stone-200 hover:border-stone-800 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left flex flex-col justify-between min-h-[180px] cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldCheck size={26} />
              </div>
              <span className="bg-stone-100 text-stone-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                Tam Yetki
              </span>
            </div>
            <div className="my-3">
              <h2 className="text-xl font-black text-stone-900 group-hover:text-stone-700 transition-colors">
                Yönetici & Patron
              </h2>
              <p className="text-stone-500 text-xs mt-1 leading-relaxed">
                Canlı ciro, saatlik analitikler, menü fiyatları, stok ve raporlar.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-stone-900 font-bold text-xs pt-3 border-t border-stone-100">
              <span>Yönetim Paneline Geç</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Müşteri QR Menü */}
          <button
            onClick={() => navigate('/qr/t-2')}
            className="bg-white hover:bg-purple-50/40 rounded-2xl p-4 sm:p-6 border-2 border-stone-200 hover:border-purple-500 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left flex flex-col justify-between min-h-[180px] cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Smartphone size={26} />
              </div>
              <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                Mobil Menü
              </span>
            </div>
            <div className="my-3">
              <h2 className="text-xl font-black text-stone-900 group-hover:text-purple-600 transition-colors">
                Müşteri QR Menü
              </h2>
              <p className="text-stone-500 text-xs mt-1 leading-relaxed">
                Masadaki müşterilerin telefonlarından gördüğü dijital menü.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-purple-600 font-bold text-xs pt-3 border-t border-stone-100">
              <span>QR Menüyü Önizle</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
