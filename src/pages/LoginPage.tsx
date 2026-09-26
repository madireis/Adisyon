import React, { useState, useEffect } from 'react';
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
  Info,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import type { Staff } from '@/types/pos';

export default function LoginPage() {
  const { dispatch } = useApp();
  const navigate = useNavigate();

  // Query live staff from IndexedDB for live helper cards
  const dbStaff = useLiveQuery(() => db.staff.toArray());
  const allStaff: Staff[] = (dbStaff && dbStaff.length > 0) ? dbStaff : fallbackStaff;

  // Selected mode (defaults to 'waiter')
  const [selectedMode, setSelectedMode] = useState<'waiter' | 'kitchen' | 'owner' | 'general'>('waiter');
  const [usernameInput, setUsernameInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [activeField, setActiveField] = useState<'username' | 'pin'>('username');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showAllDemoPins, setShowAllDemoPins] = useState(false);

  // Handle mode card selection
  const handleSelectMode = (mode: 'waiter' | 'kitchen' | 'owner' | 'general') => {
    setSelectedMode(mode);
    setErrorMsg('');
    setSuccessMsg('');
    setActiveField('username');
  };

  // Numpad button click
  const handleNumpadClick = (numStr: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    if (activeField === 'username') {
      if (usernameInput.length < 8) {
        const nextVal = usernameInput + numStr;
        setUsernameInput(nextVal);
        // If username reaches 4 digits, automatically hint to enter PIN
        if (nextVal.length === 4 && pinInput.length === 0) {
          setActiveField('pin');
        }
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
    setSuccessMsg('');
    if (activeField === 'username') {
      setUsernameInput(prev => prev.slice(0, -1));
    } else {
      setPinInput(prev => prev.slice(0, -1));
    }
  };

  // Clear inputs
  const handleClear = () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (activeField === 'username') {
      setUsernameInput('');
    } else {
      setPinInput('');
    }
  };

  // Quick auto-fill helper from sample list
  const handleQuickFill = (staff: Staff) => {
    setUsernameInput(staff.username || staff.id);
    setPinInput(staff.pin);
    setActiveField('pin');
    setErrorMsg('');
    setSuccessMsg(`"${staff.name}" bilgileri dolduruldu.`);
  };

  // Form submission authentication
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg('');
    setSuccessMsg('');

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

    setIsSubmitting(true);

    try {
      // Query IndexedDB directly to ensure we get newly added staff immediately
      let liveStaff: Staff[] = [];
      try {
        liveStaff = await db.staff.toArray();
      } catch (err) {
        console.warn('Direct db.staff query failed, using memory list:', err);
      }

      const searchPool = (liveStaff && liveStaff.length > 0) ? liveStaff : allStaff;

      // Find staff with flexible string matching for username and PIN
      const matchedStaff = searchPool.find(s => {
        const sUsername = String(s.username || s.id || '').trim();
        const sPin = String(s.pin || '').trim();
        const sId = String(s.id || '').trim();
        return (sUsername === cleanUsername || sId === cleanUsername) && sPin === cleanPin;
      });

      if (!matchedStaff) {
        setErrorMsg('Hatalı Kullanıcı Numarası veya PIN Kodu! Lütfen kontrol ediniz.');
        setIsSubmitting(false);
        return;
      }

      if (matchedStaff.active === false) {
        setErrorMsg(`"${matchedStaff.name}" hesabı pasif durumdadır. Yöneticinizle iletişime geçiniz.`);
        setIsSubmitting(false);
        return;
      }

      // Login successful
      dispatch({ type: 'LOGIN', user: matchedStaff });
      setSuccessMsg(`Giriş başarılı! Hoş geldiniz, ${matchedStaff.name}.`);

      // Intelligent routing:
      // Owners and managers can navigate to selected mode or dashboard
      if (matchedStaff.role === 'owner' || matchedStaff.role === 'manager') {
        if (selectedMode === 'waiter') navigate('/tables');
        else if (selectedMode === 'kitchen') navigate('/kitchen');
        else navigate('/dashboard');
        return;
      }

      // Kitchen and Bar staff route to kitchen KDS
      if (matchedStaff.role === 'kitchen' || matchedStaff.role === 'bar') {
        navigate('/kitchen');
        return;
      }

      // Waiters and Cashiers route to tables POS
      navigate('/tables');
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg('Giriş yapılırken bir hata oluştu: ' + (err?.message || err));
      setIsSubmitting(false);
    }
  };

  const getModeTitle = () => {
    switch (selectedMode) {
      case 'waiter': return 'Garson Terminali Girişi';
      case 'kitchen': return 'Mutfak Ekranı (KDS) Girişi';
      case 'owner': return 'Yönetici & Patron Girişi';
      default: return 'Personel POS Girişi';
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/90 dark:bg-stone-950 flex flex-col items-center justify-center p-4 sm:p-6 select-none dark:text-stone-100">
      <div className="w-full max-w-4xl">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-600/25 mb-3">
            <Coffee size={30} />
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-stone-900 dark:text-stone-100 tracking-tight">WOT'S CAFE</h1>
          <p className="text-[11px] sm:text-xs font-bold text-orange-600 uppercase tracking-widest mt-1">Silivri Sahil — Restoran POS Sistemi</p>
          <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm mt-1 font-medium">
            Giriş modunu seçin veya doğrudan Kullanıcı Numarası ve PIN ile oturum açın:
          </p>
        </div>

        {/* Workspace Mode Selection Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
          {/* Garson Girişi */}
          <button
            type="button"
            onClick={() => handleSelectMode('waiter')}
            className={`bg-white dark:bg-stone-900 rounded-2xl p-3.5 sm:p-4 border-2 text-left flex flex-col justify-between min-h-[140px] sm:min-h-[150px] cursor-pointer transition-all ${
              selectedMode === 'waiter' 
                ? 'border-orange-500 shadow-md ring-2 ring-orange-500/20 bg-orange-50/40 dark:bg-orange-950/20' 
                : 'border-stone-200 dark:border-stone-800 hover:border-orange-400 hover:shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                <Grid2X2 size={20} />
              </div>
              <span className="bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Servis
              </span>
            </div>
            <div className="my-1.5">
              <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100">
                Garson Terminali
              </h2>
              <p className="text-stone-500 dark:text-stone-400 text-[11px] sm:text-xs mt-0.5 line-clamp-1">
                Masa planı ve sipariş
              </p>
            </div>
            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold text-xs pt-1.5 border-t border-stone-100 dark:border-stone-800">
              <span>{selectedMode === 'waiter' ? '● Aktif Mod' : 'Seç'}</span>
              <ArrowRight size={13} />
            </div>
          </button>

          {/* Mutfak Ekranı (KDS) */}
          <button
            type="button"
            onClick={() => handleSelectMode('kitchen')}
            className={`bg-white dark:bg-stone-900 rounded-2xl p-3.5 sm:p-4 border-2 text-left flex flex-col justify-between min-h-[140px] sm:min-h-[150px] cursor-pointer transition-all ${
              selectedMode === 'kitchen' 
                ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/20' 
                : 'border-stone-200 dark:border-stone-800 hover:border-blue-400 hover:shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <ChefHat size={20} />
              </div>
              <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Mutfak
              </span>
            </div>
            <div className="my-1.5">
              <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100">
                Mutfak (KDS)
              </h2>
              <p className="text-stone-500 dark:text-stone-400 text-[11px] sm:text-xs mt-0.5 line-clamp-1">
                Hazırlık & fişler
              </p>
            </div>
            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold text-xs pt-1.5 border-t border-stone-100 dark:border-stone-800">
              <span>{selectedMode === 'kitchen' ? '● Aktif Mod' : 'Seç'}</span>
              <ArrowRight size={13} />
            </div>
          </button>

          {/* Yetkili / Yönetici Girişi */}
          <button
            type="button"
            onClick={() => handleSelectMode('owner')}
            className={`bg-white dark:bg-stone-900 rounded-2xl p-3.5 sm:p-4 border-2 text-left flex flex-col justify-between min-h-[140px] sm:min-h-[150px] cursor-pointer transition-all ${
              selectedMode === 'owner' 
                ? 'border-purple-600 shadow-md ring-2 ring-purple-500/20 bg-purple-50/40 dark:bg-purple-950/20' 
                : 'border-stone-200 dark:border-stone-800 hover:border-purple-500 hover:shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold">
                <ShieldCheck size={20} />
              </div>
              <span className="bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Yetkili
              </span>
            </div>
            <div className="my-1.5">
              <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100">
                Yönetici & Patron
              </h2>
              <p className="text-stone-500 dark:text-stone-400 text-[11px] sm:text-xs mt-0.5 line-clamp-1">
                Panel, personel & raporlar
              </p>
            </div>
            <div className="flex items-center gap-1 text-purple-700 dark:text-purple-400 font-bold text-xs pt-1.5 border-t border-stone-100 dark:border-stone-800">
              <span>{selectedMode === 'owner' ? '● Aktif Mod' : 'Seç'}</span>
              <ArrowRight size={13} />
            </div>
          </button>

          {/* Müşteri QR Menü */}
          <button
            type="button"
            onClick={() => navigate('/qr/t-2')}
            className="bg-white dark:bg-stone-900 hover:bg-emerald-50/40 dark:hover:border-emerald-500/50 rounded-2xl p-3.5 sm:p-4 border-2 border-stone-200 dark:border-stone-800 hover:border-emerald-500 shadow-xs text-left flex flex-col justify-between min-h-[140px] sm:min-h-[150px] cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Smartphone size={20} />
              </div>
              <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Müşteri
              </span>
            </div>
            <div className="my-1.5">
              <h2 className="text-base sm:text-lg font-black text-stone-900 dark:text-stone-100 group-hover:text-emerald-600 transition-colors">
                QR Menü
              </h2>
              <p className="text-stone-500 dark:text-stone-400 text-[11px] sm:text-xs mt-0.5 line-clamp-1">
                Masa mobil menü
              </p>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs pt-1.5 border-t border-stone-100 dark:border-stone-800">
              <span>Önizle</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* PIN Sign-In Interactive Panel */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 shadow-xl border border-stone-200 dark:border-stone-800 mb-5">
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <KeyRound className="text-orange-600" size={20} />
                {getModeTitle()}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Kullanıcı Numarası (Rakamlar) ve 4 haneli PIN kodunuzu klavyeden veya ekrandan tuşlayın.
              </p>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 rounded-full text-[11px] font-extrabold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
              Dokunmatik & Klavye Destekli
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
            {/* Left Column: Form & Inputs */}
            <form onSubmit={handleLoginSubmit} className="md:col-span-6 flex flex-col justify-between space-y-3.5">
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-bold rounded-2xl border border-red-200 dark:border-red-900 flex items-center gap-2">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-2xl border border-emerald-200 dark:border-emerald-900 flex items-center gap-2">
                  <CheckCircle2 size={18} className="shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Field Selectors */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveField('username')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    activeField === 'username'
                      ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                  }`}
                >
                  1. Kullanıcı No
                </button>
                <button
                  type="button"
                  onClick={() => setActiveField('pin')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    activeField === 'pin'
                      ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                  }`}
                >
                  2. PIN Kodu
                </button>
              </div>

              {/* Input: Kullanıcı Numarası (Editable via keyboard AND numpad) */}
              <div 
                onClick={() => setActiveField('username')}
                className={`p-3 sm:p-3.5 rounded-2xl border-2 transition-all cursor-text ${
                  activeField === 'username'
                    ? 'border-orange-500 bg-orange-50/20 dark:bg-stone-950 ring-2 ring-orange-500/20'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950'
                }`}
              >
                <label className="block text-[11px] font-bold uppercase text-stone-500 dark:text-stone-400 mb-1 flex items-center justify-between">
                  <span>Kullanıcı Numarası (Sadece Rakamlar)</span>
                  {activeField === 'username' && <span className="text-orange-600 font-bold">● Aktif Alan</span>}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Örn: 1001"
                  value={usernameInput}
                  onChange={(e) => {
                    setErrorMsg('');
                    setUsernameInput(e.target.value.replace(/\D/g, ''));
                  }}
                  onFocus={() => setActiveField('username')}
                  className="w-full bg-transparent text-xl font-mono font-black text-stone-900 dark:text-stone-100 focus:outline-none tracking-wider"
                />
              </div>

              {/* Input: PIN Kodu (Editable via keyboard AND numpad) */}
              <div 
                onClick={() => setActiveField('pin')}
                className={`p-3 sm:p-3.5 rounded-2xl border-2 transition-all cursor-text ${
                  activeField === 'pin'
                    ? 'border-orange-500 bg-orange-50/20 dark:bg-stone-950 ring-2 ring-orange-500/20'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950'
                }`}
              >
                <label className="block text-[11px] font-bold uppercase text-stone-500 dark:text-stone-400 mb-1 flex items-center justify-between">
                  <span>4 Haneli Giriş PIN Kodu</span>
                  {activeField === 'pin' && <span className="text-orange-600 font-bold">● Aktif Alan</span>}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={pinInput}
                    onChange={(e) => {
                      setErrorMsg('');
                      setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                    }}
                    onFocus={() => setActiveField('pin')}
                    className="w-full bg-transparent text-2xl font-mono font-black text-stone-900 dark:text-stone-100 focus:outline-none tracking-widest pr-10"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPin(!showPin);
                    }}
                    className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
                    title={showPin ? "PIN'i Gizle" : "PIN'i Göster"}
                  >
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-2xl font-black text-sm shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <UserCheck size={18} />
                <span>{isSubmitting ? 'Doğrulanıyor...' : 'Sisteme Giriş Yap'}</span>
              </button>
            </form>

            {/* Right Column: Touch Numpad Keyboard */}
            <div className="md:col-span-6 bg-stone-50 dark:bg-stone-950 p-3 sm:p-4 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col justify-between">
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleNumpadClick(num)}
                    className="h-11 sm:h-12 bg-white dark:bg-stone-900 hover:bg-orange-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100 font-black text-xl rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  className="h-11 sm:h-12 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs rounded-xl border border-stone-300 dark:border-stone-700 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                >
                  TEMİZLE
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadClick('0')}
                  className="h-11 sm:h-12 bg-white dark:bg-stone-900 hover:bg-orange-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-100 font-black text-xl rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleNumpadDelete}
                  className="h-11 sm:h-12 bg-red-100 dark:bg-red-950/50 hover:bg-red-200 text-red-700 dark:text-red-300 font-bold rounded-xl border border-red-200 dark:border-red-900 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                  title="Geri Sil"
                >
                  <Delete size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Registered Staff Accounts (including newly created ones) */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-5 shadow-sm border border-stone-200 dark:border-stone-800">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
              <Info size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-stone-900 dark:text-stone-100">
                    Kayıtlı Personel Hesapları ({allStaff.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAllDemoPins(!showAllDemoPins)}
                    className="flex items-center gap-1 text-[11px] font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    title={showAllDemoPins ? "Tüm PIN'leri Bulanıklaştır" : "Tüm PIN'leri Göster"}
                  >
                    {showAllDemoPins ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{showAllDemoPins ? "PIN'leri Gizle" : "PIN'leri Göster"}</span>
                  </button>
                </div>
                <span className="text-[11px] text-stone-400">
                  Hızlı giriş için karta tıklayabilirsiniz
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                Yönetici hesabı ile giriş yapıp <strong className="text-stone-800 dark:text-stone-200">Personel Yönetimi</strong> ekranından dilediğiniz sayıda yeni kullanıcı numarası ve PIN tanımlayabilirsiniz.
              </p>

              {/* Dynamic Staff Grid with newly added staff */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                {allStaff.map((staff) => (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => handleQuickFill(staff)}
                    className="bg-stone-50 dark:bg-stone-950 hover:bg-orange-50/60 dark:hover:bg-stone-800/80 p-2.5 rounded-xl border border-stone-200/80 dark:border-stone-800 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-stone-800 dark:text-stone-200 truncate group-hover:text-orange-600">
                        {staff.name}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                        staff.role === 'owner' || staff.role === 'manager' 
                          ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300' 
                          : staff.role === 'kitchen' || staff.role === 'bar'
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                            : 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300'
                      }`}>
                        {staff.role}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono mt-1 pt-1 border-t border-stone-200/40 dark:border-stone-800">
                      <span className="text-stone-600 dark:text-stone-400">No: <strong className="text-stone-900 dark:text-stone-100">{staff.username || staff.id}</strong></span>
                      <span className="text-stone-500 flex items-center gap-1">
                        PIN: <strong className={`text-stone-900 dark:text-stone-100 transition-all select-none ${
                          !showAllDemoPins ? 'filter blur-xs group-hover:blur-none hover:blur-none' : ''
                        }`}>{staff.pin}</strong>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
