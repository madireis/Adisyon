import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { staffMembers as fallbackStaff } from '@/lib/mockData';
import { 
  Grid2X2, 
  ShieldCheck, 
  ChefHat, 
  Smartphone, 
  ArrowRight, 
  Coffee, 
  Delete, 
  UserCheck, 
  AlertCircle,
  KeyRound,
  Info
} from 'lucide-react';
import type { Staff } from '@/types/pos';

export default function LoginPage() {
  const { dispatch } = useApp();
  const navigate = useNavigate();

  // Query live staff from IndexedDB
  const dbStaff = useLiveQuery(() => db.staff.toArray());
  const allStaff: Staff[] = (dbStaff && dbStaff.length > 0) ? dbStaff : fallbackStaff;

  // Sign-in form state
  const [selectedMode, setSelectedMode] = useState<'waiter' | 'kitchen' | 'owner' | 'general' | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [activeField, setActiveField] = useState<'username' | 'pin'>('username');
  const [errorMsg, setErrorMsg] = useState('');

  // Handle mode selection (opens the PIN/Username sign-in modal/panel)
  const handleSelectMode = (mode: 'waiter' | 'kitchen' | 'owner' | 'general') => {
    setSelectedMode(mode);
    setUsernameInput('');
    setPinInput('');
    setActiveField('username');
    setErrorMsg('');
  };

  // Numpad button click
  const handleNumpadClick = (numStr: string) => {
    setErrorMsg('');
    if (activeField === 'username') {
      if (usernameInput.length < 10) {
        const nextVal = usernameInput + numStr;
        setUsernameInput(nextVal);
      }
    } else {
      if (pinInput.length < 4) {
        const nextVal = pinInput + numStr;
        setPinInput(nextVal);
      }
    }
  };

  // Numpad backspace
  const handleNumpadDelete = () => {
    setErrorMsg('');
    if (activeField === 'username') {
      setUsernameInput(prev => prev.slice(0, -1));
    } else {
      setPinInput(prev => prev.slice(0, -1));
    }
  };

  // Clear inputs
  const handleClear = () => {
    setErrorMsg('');
    if (activeField === 'username') {
      setUsernameInput('');
    } else {
      setPinInput('');
    }
  };

  // Form submission authentication
  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const cleanUsername = usernameInput.trim();
    const cleanPin = pinInput.trim();

    if (!cleanUsername) {
      setErrorMsg('Lütfen Kullanıcı Numarasını giriniz.');
      setActiveField('username');
      return;
    }

    if (!cleanPin || cleanPin.length < 4) {
      setErrorMsg('Lütfen 4 haneli PIN kodunu giriniz.');
      setActiveField('pin');
      return;
    }

    // Authenticate user against staff database
    const matchedStaff = allStaff.find(
      s => (s.username === cleanUsername || s.id === cleanUsername) && s.pin === cleanPin
    );

    if (!matchedStaff) {
      setErrorMsg('Hatalı Kullanıcı Numarası veya PIN Kodu!');
      return;
    }

    if (!matchedStaff.active) {
      setErrorMsg('Bu personel hesabı pasif durumdadır. Yöneticinizle iletişime geçin.');
      return;
    }

    // Check permissions if a specific mode card was selected
    if (selectedMode === 'waiter' && !['waiter', 'cashier', 'owner', 'manager'].includes(matchedStaff.role)) {
      setErrorMsg(`Bu hesap (${matchedStaff.name}) Garson terminaline giriş yetkisine sahip değil.`);
      return;
    }

    if (selectedMode === 'kitchen' && !['kitchen', 'bar', 'owner', 'manager'].includes(matchedStaff.role)) {
      setErrorMsg(`Bu hesap (${matchedStaff.name}) Mutfak ekranına giriş yetkisine sahip değil.`);
      return;
    }

    if (selectedMode === 'owner' && !['owner', 'manager'].includes(matchedStaff.role)) {
      setErrorMsg(`Bu hesap (${matchedStaff.name}) Yönetici paneline giriş yetkisine sahip değil.`);
      return;
    }

    // Login successful
    dispatch({ type: 'LOGIN', user: matchedStaff });

    // Navigate to appropriate landing page
    if (selectedMode === 'kitchen' || matchedStaff.role === 'kitchen' || matchedStaff.role === 'bar') {
      navigate('/kitchen');
    } else if (selectedMode === 'owner' || matchedStaff.role === 'owner' || matchedStaff.role === 'manager') {
      navigate('/dashboard');
    } else {
      navigate('/tables');
    }
  };

  const getModeTitle = () => {
    switch (selectedMode) {
      case 'waiter': return 'Garson Terminali Girişi';
      case 'kitchen': return 'Mutfak Ekranı (KDS) Girişi';
      case 'owner': return 'Yönetici & Patron Girişi';
      default: return 'Personel Girişi';
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/90 dark:bg-stone-950 flex flex-col items-center justify-center p-4 sm:p-6 select-none dark:text-stone-100">
      <div className="w-full max-w-4xl">
        {/* Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-600/25 mb-3">
            <Coffee size={32} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-stone-100 tracking-tight">WOT'S CAFE</h1>
          <p className="text-xs sm:text-sm font-bold text-orange-600 uppercase tracking-widest mt-1">Silivri Sahil — Restoran POS Sistemi</p>
          <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm mt-1.5 font-medium">
            Giriş yapmak istediğiniz çalışma alanını seçin ve Kullanıcı Numarası & PIN ile oturum açın:
          </p>
        </div>

        {/* Workspace Mode Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Garson Girişi */}
          <button
            onClick={() => handleSelectMode('waiter')}
            className={`bg-white dark:bg-stone-900 rounded-2xl p-4 border-2 text-left flex flex-col justify-between min-h-[160px] cursor-pointer transition-all ${
              selectedMode === 'waiter' 
                ? 'border-orange-500 shadow-md ring-2 ring-orange-500/20 bg-orange-50/30 dark:bg-stone-900' 
                : 'border-stone-200 dark:border-stone-800 hover:border-orange-400 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <Grid2X2 size={22} />
              </div>
              <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Hızlı Servis
              </span>
            </div>
            <div className="my-2">
              <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">
                Garson Terminali
              </h2>
              <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">
                Masa planı, adisyon açma ve sipariş.
              </p>
            </div>
            <div className="flex items-center gap-1 text-orange-600 font-bold text-xs pt-2 border-t border-stone-100 dark:border-stone-800">
              <span>Giriş Yap</span>
              <ArrowRight size={14} />
            </div>
          </button>

          {/* Mutfak Ekranı (KDS) */}
          <button
            onClick={() => handleSelectMode('kitchen')}
            className={`bg-white dark:bg-stone-900 rounded-2xl p-4 border-2 text-left flex flex-col justify-between min-h-[160px] cursor-pointer transition-all ${
              selectedMode === 'kitchen' 
                ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-stone-900' 
                : 'border-stone-200 dark:border-stone-800 hover:border-blue-400 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <ChefHat size={22} />
              </div>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Mutfak & Bar
              </span>
            </div>
            <div className="my-2">
              <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">
                Mutfak Ekranı (KDS)
              </h2>
              <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">
                Hazırlık fişleri ve sipariş takibi.
              </p>
            </div>
            <div className="flex items-center gap-1 text-blue-600 font-bold text-xs pt-2 border-t border-stone-100 dark:border-stone-800">
              <span>Giriş Yap</span>
              <ArrowRight size={14} />
            </div>
          </button>

          {/* Yetkili / Yönetici Girişi */}
          <button
            onClick={() => handleSelectMode('owner')}
            className={`bg-white dark:bg-stone-900 rounded-2xl p-4 border-2 text-left flex flex-col justify-between min-h-[160px] cursor-pointer transition-all ${
              selectedMode === 'owner' 
                ? 'border-purple-600 shadow-md ring-2 ring-purple-500/20 bg-purple-50/30 dark:bg-stone-900' 
                : 'border-stone-200 dark:border-stone-800 hover:border-purple-500 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <ShieldCheck size={22} />
              </div>
              <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Tam Yetki
              </span>
            </div>
            <div className="my-2">
              <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">
                Yönetici & Patron
              </h2>
              <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">
                Canlı ciro, stok, personel & raporlar.
              </p>
            </div>
            <div className="flex items-center gap-1 text-purple-700 font-bold text-xs pt-2 border-t border-stone-100 dark:border-stone-800">
              <span>Giriş Yap</span>
              <ArrowRight size={14} />
            </div>
          </button>

          {/* Müşteri QR Menü */}
          <button
            onClick={() => navigate('/qr/t-2')}
            className="bg-white dark:bg-stone-900 hover:bg-emerald-50/40 dark:hover:border-emerald-500/50 rounded-2xl p-4 border-2 border-stone-200 dark:border-stone-800 hover:border-emerald-500 shadow-xs text-left flex flex-col justify-between min-h-[160px] cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <Smartphone size={22} />
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Önizleme
              </span>
            </div>
            <div className="my-2">
              <h2 className="text-lg font-black text-stone-900 dark:text-stone-100 group-hover:text-emerald-600 transition-colors">
                Müşteri QR Menü
              </h2>
              <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">
                Masalardaki dijital mobil menü.
              </p>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs pt-2 border-t border-stone-100 dark:border-stone-800">
              <span>Menüyü Aç</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* PIN Sign-In Modal / Interactive Section */}
        {selectedMode ? (
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-xl border border-stone-200 dark:border-stone-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h2 className="text-xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <KeyRound className="text-orange-600" size={22} />
                  {getModeTitle()}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Lütfen yöneticiniz tarafından tanımlanan Kullanıcı Numarası ve 4 haneli PIN kodunuzu giriniz.
                </p>
              </div>
              <button
                onClick={() => setSelectedMode(null)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs font-bold px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Kapat / Mod Değiştir
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Form & Inputs */}
              <form onSubmit={handleLoginSubmit} className="md:col-span-6 flex flex-col justify-between space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-bold rounded-2xl border border-red-200 dark:border-red-900 flex items-center gap-2">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Input: Kullanıcı Numarası */}
                <div 
                  onClick={() => setActiveField('username')}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                    activeField === 'username'
                      ? 'border-orange-500 bg-orange-50/20 dark:bg-stone-950 ring-2 ring-orange-500/20'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950'
                  }`}
                >
                  <label className="block text-[11px] font-bold uppercase text-stone-500 dark:text-stone-400 mb-1 flex items-center justify-between">
                    <span>Kullanıcı Numarası (Sadece Rakamlar)</span>
                    {activeField === 'username' && <span className="text-orange-600 font-bold">● Aktif Giriş</span>}
                  </label>
                  <input
                    type="text"
                    readOnly
                    placeholder="Örn: 1001"
                    value={usernameInput}
                    className="w-full bg-transparent text-xl font-mono font-black text-stone-900 dark:text-stone-100 focus:outline-none tracking-wider"
                  />
                </div>

                {/* Input: PIN Kodu */}
                <div 
                  onClick={() => setActiveField('pin')}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                    activeField === 'pin'
                      ? 'border-orange-500 bg-orange-50/20 dark:bg-stone-950 ring-2 ring-orange-500/20'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950'
                  }`}
                >
                  <label className="block text-[11px] font-bold uppercase text-stone-500 dark:text-stone-400 mb-1 flex items-center justify-between">
                    <span>4 Haneli PIN Kodu</span>
                    {activeField === 'pin' && <span className="text-orange-600 font-bold">● Aktif Giriş</span>}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      readOnly
                      maxLength={4}
                      placeholder="••••"
                      value={pinInput}
                      className="w-full bg-transparent text-2xl font-mono font-black text-stone-900 dark:text-stone-100 focus:outline-none tracking-widest"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-sm shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <UserCheck size={18} />
                  <span>Sisteme Giriş Yap</span>
                </button>
              </form>

              {/* Right Column: Touch Numpad Keyboard */}
              <div className="md:col-span-6 bg-stone-50 dark:bg-stone-950 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col justify-between">
                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleNumpadClick(num)}
                      className="h-12 bg-white dark:bg-stone-900 hover:bg-orange-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100 font-black text-xl rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClear}
                    className="h-12 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs rounded-xl border border-stone-300 dark:border-stone-700 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                  >
                    TEMİZLE
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNumpadClick('0')}
                    className="h-12 bg-white dark:bg-stone-900 hover:bg-orange-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100 font-black text-xl rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleNumpadDelete}
                    className="h-12 bg-red-100 dark:bg-red-950/50 hover:bg-red-200 text-red-700 dark:text-red-300 font-bold rounded-xl border border-red-200 dark:border-red-900 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                    title="Sil"
                  >
                    <Delete size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Info & Helper Panel */
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 shadow-sm border border-stone-200 dark:border-stone-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                <Info size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-black text-stone-900 dark:text-stone-100">
                  Giriş Bilgilendirmesi & Örnek Hesaplar
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                  Tüm kullanıcı hesapları işletme yöneticisi/patron tarafından <strong className="text-stone-800 dark:text-stone-200">Personel Yönetimi</strong> ekranından oluşturulur. Giriş yapmak için bir moda tıklayın ve hesaba ait Kullanıcı No ve PIN kodunu girin.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                  <div className="bg-stone-50 dark:bg-stone-950 p-2.5 rounded-xl border border-stone-200/80 dark:border-stone-800">
                    <span className="text-[10px] font-bold text-orange-600 block uppercase">Garson (Ahmet)</span>
                    <span className="text-xs font-mono font-bold block text-stone-800 dark:text-stone-200 mt-0.5">No: <strong>1001</strong></span>
                    <span className="text-[11px] font-mono text-stone-500 block">PIN: <strong>1234</strong></span>
                  </div>
                  <div className="bg-stone-50 dark:bg-stone-950 p-2.5 rounded-xl border border-stone-200/80 dark:border-stone-800">
                    <span className="text-[10px] font-bold text-blue-600 block uppercase">Mutfak (Mehmet)</span>
                    <span className="text-xs font-mono font-bold block text-stone-800 dark:text-stone-200 mt-0.5">No: <strong>1003</strong></span>
                    <span className="text-[11px] font-mono text-stone-500 block">PIN: <strong>3456</strong></span>
                  </div>
                  <div className="bg-stone-50 dark:bg-stone-950 p-2.5 rounded-xl border border-stone-200/80 dark:border-stone-800">
                    <span className="text-[10px] font-bold text-amber-600 block uppercase">Kasiyer (Zeynep)</span>
                    <span className="text-xs font-mono font-bold block text-stone-800 dark:text-stone-200 mt-0.5">No: <strong>1002</strong></span>
                    <span className="text-[11px] font-mono text-stone-500 block">PIN: <strong>2345</strong></span>
                  </div>
                  <div className="bg-stone-50 dark:bg-stone-950 p-2.5 rounded-xl border border-stone-200/80 dark:border-stone-800">
                    <span className="text-[10px] font-bold text-purple-600 block uppercase">Patron (Yetkili)</span>
                    <span className="text-xs font-mono font-bold block text-stone-800 dark:text-stone-200 mt-0.5">No: <strong>1007</strong></span>
                    <span className="text-[11px] font-mono text-stone-500 block">PIN: <strong>9999</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
