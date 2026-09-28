import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/store';
import { db } from '@/lib/db';
import { staffMembers as fallbackStaff } from '@/lib/mockData';
import { 
  User, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Loader2,
  Download
} from 'lucide-react';
import type { Staff } from '@/types/pos';
import wotsLogo from '@/assets/logo.jpg';
import { usePwaInstall } from '@/lib/usePwaInstall';
import PwaInstallModal from '@/components/common/PwaInstallModal';

export default function LoginPage() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const [usernameInput, setUsernameInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const { isInstalled } = usePwaInstall();

  // If already logged in, redirect to respective screen
  React.useEffect(() => {
    if (state.currentUser) {
      const role = state.currentUser.role;
      if (role === 'owner' || role === 'manager') {
        navigate('/reports');
      } else if (role === 'kitchen' || role === 'bar') {
        navigate('/kitchen');
      } else {
        navigate('/tables');
      }
    }
  }, [state.currentUser, navigate]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg('');

    const cleanUsername = usernameInput.trim();
    const cleanPin = pinInput.trim();

    if (!cleanUsername) {
      setErrorMsg('Lütfen kullanıcı adınızı veya numaranızı giriniz.');
      return;
    }

    if (!cleanPin) {
      setErrorMsg('Lütfen PIN / şifrenizi giriniz.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Query IndexedDB directly for freshly added staff
      let liveStaff: Staff[] = [];
      try {
        liveStaff = await db.staff.toArray();
      } catch (err) {
        console.warn('Direct db.staff query failed, using memory list:', err);
      }

      const searchPool = (liveStaff && liveStaff.length > 0) ? liveStaff : fallbackStaff;

      // Find staff with flexible matching: username, id, or name (case-insensitive) + PIN
      const matchedStaff = searchPool.find(s => {
        const sUsername = String(s.username || '').trim().toLowerCase();
        const sId = String(s.id || '').trim().toLowerCase();
        const sName = String(s.name || '').trim().toLowerCase();
        const input = cleanUsername.toLowerCase();
        const sPin = String(s.pin || '').trim();

        const userMatches = sUsername === input || sId === input || sName === input;
        const pinMatches = sPin === cleanPin;
        return userMatches && pinMatches;
      });

      if (!matchedStaff) {
        setErrorMsg('Hatalı kullanıcı adı veya PIN kodu!');
        setIsSubmitting(false);
        return;
      }

      if (matchedStaff.active === false) {
        setErrorMsg(`"${matchedStaff.name}" hesabı pasif durumdadır. Yöneticinizle iletişime geçiniz.`);
        setIsSubmitting(false);
        return;
      }

      // Check if logged in user is a manager/owner
      const isManager = matchedStaff.role === 'owner' || matchedStaff.role === 'manager';

      // Dispatch login with manager session state
      dispatch({ 
        type: 'LOGIN', 
        user: matchedStaff, 
        managerSession: isManager ? matchedStaff : null 
      });

      // Role-based routing
      if (isManager) {
        navigate('/dashboard');
      } else if (matchedStaff.role === 'kitchen' || matchedStaff.role === 'bar') {
        navigate('/kitchen');
      } else {
        navigate('/tables');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg('Giriş yapılırken bir hata oluştu: ' + (err?.message || err));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-stone-50 to-orange-50/30 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 flex flex-col items-center justify-center p-4 sm:p-6 select-none dark:text-stone-100">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-black p-2.5 shadow-2xl border-2 border-orange-500/30 mb-4 flex items-center justify-center transform transition-transform hover:scale-105">
            <img 
              src={wotsLogo} 
              alt="WOT'S CAFE" 
              className="w-full h-full object-contain rounded-2xl" 
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
            WOT'S CAFE
          </h1>
          <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-1">
            Restoran POS & Otomasyon Sistemi
          </p>
        </div>

        {/* Minimalist Card */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-200 dark:border-stone-800">
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {errorMsg && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-bold rounded-2xl border border-red-200 dark:border-red-900 flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle size={18} className="shrink-0 text-red-600 dark:text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Username / User No Input */}
            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-400 mb-2">
                Kullanıcı Numarası / Adı
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-stone-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  autoFocus
                  placeholder="Kullanıcı No (örn: 1007)"
                  value={usernameInput}
                  onChange={(e) => {
                    setErrorMsg('');
                    setUsernameInput(e.target.value);
                  }}
                  className="w-full pl-11 pr-4 py-3.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl text-stone-900 dark:text-stone-100 font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Password / PIN Input */}
            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 dark:text-stone-400 mb-2">
                Şifre / PIN Kodu
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-stone-400">
                  <KeyRound size={18} />
                </div>
                <input
                  type={showPin ? "text" : "password"}
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => {
                    setErrorMsg('');
                    setPinInput(e.target.value);
                  }}
                  className="w-full pl-11 pr-12 py-3.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl text-stone-900 dark:text-stone-100 font-mono tracking-widest placeholder:tracking-normal placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-base sm:text-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors cursor-pointer"
                  title={showPin ? "Şifreyi Gizle" : "Şifreyi Göster"}
                >
                  {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-70 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Doğrulanıyor...</span>
                </>
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* PWA Install Promo Button on Login Page */}
        {!isInstalled && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsPwaModalOpen(true)}
              className="w-full py-3 px-4 bg-white/90 dark:bg-stone-900/90 hover:bg-white dark:hover:bg-stone-900 border border-orange-200 dark:border-stone-800 hover:border-orange-500 rounded-2xl shadow-sm text-stone-700 dark:text-stone-300 font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer group active:scale-[0.99]"
            >
              <div className="w-7 h-7 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Download size={14} className="group-hover:animate-bounce" />
              </div>
              <div className="text-left">
                <div className="text-stone-900 dark:text-stone-100 font-extrabold text-xs">Bu Cihaza Uygulama Olarak İndir</div>
                <div className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">Ana ekrana ekle, tam ekran ve hızlı çalıştır</div>
              </div>
            </button>
          </div>
        )}

        {/* Minimal Footer */}
        <div className="text-center mt-6 text-xs text-stone-400 dark:text-stone-500">
          Wot's Cafe POS &copy; {new Date().getFullYear()} — Tüm Hakları Saklıdır
        </div>
      </div>

      {/* PWA Install Modal */}
      <PwaInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
      />
    </div>
  );
}
