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
  Download,
  Terminal
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
      if (role === 'developer') {
        navigate('/developer');
      } else if (role === 'owner' || role === 'manager') {
        navigate('/tables');
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
      setErrorMsg('Kullanıcı adınızı veya numaranızı girin.');
      return;
    }

    if (!cleanPin) {
      setErrorMsg('PIN / şifrenizi girin.');
      return;
    }

    setIsSubmitting(true);

    try {
      let liveStaff: Staff[] = [];
      try {
        liveStaff = await db.staff.toArray();
      } catch (err) {
        console.warn('Direct db.staff query failed, using memory list:', err);
      }

      const searchPool = (liveStaff && liveStaff.length > 0) ? liveStaff : fallbackStaff;

      const matchedStaff = searchPool.find(s => {
        const sUsername = String(s.username || '').trim().toLowerCase();
        const sId = String(s.id || '').trim().toLowerCase();
        const sName = String(s.name || '').trim().toLowerCase();
        const input = cleanUsername.toLowerCase();
        const sPin = String(s.pin || '').trim();

        const userMatches = sUsername === input || sId === input || sName === input || (s.role === 'developer' && (input === 'dev' || input === 'developer' || input === '0000'));
        const pinMatches = sPin === cleanPin;
        return userMatches && pinMatches;
      });

      if (!matchedStaff) {
        setErrorMsg('Hatalı kullanıcı veya PIN!');
        setIsSubmitting(false);
        return;
      }

      if (matchedStaff.active === false) {
        setErrorMsg(`"${matchedStaff.name}" hesabı pasif.`);
        setIsSubmitting(false);
        return;
      }

      const isManager = matchedStaff.role === 'owner' || matchedStaff.role === 'manager' || matchedStaff.role === 'developer';

      dispatch({ 
        type: 'LOGIN', 
        user: matchedStaff, 
        managerSession: isManager ? matchedStaff : null 
      });

      if (matchedStaff.role === 'developer') {
        navigate('/developer');
      } else if (matchedStaff.role === 'kitchen' || matchedStaff.role === 'bar') {
        navigate('/kitchen');
      } else {
        navigate('/tables');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg('Giriş hatası: ' + (err?.message || err));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col items-center justify-center p-4 select-none text-stone-900 dark:text-stone-100">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-black p-2 shadow-md border border-stone-800 mb-3 flex items-center justify-center">
            <img 
              src={wotsLogo} 
              alt="WOT'S" 
              className="w-full h-full object-contain rounded-xl" 
            />
          </div>
          <h1 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">
            WOT'S <span className="text-orange-600">POS</span>
          </h1>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200 dark:border-stone-800">
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-900/60 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1.5">
                Kullanıcı No / Adı
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-stone-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  autoFocus
                  placeholder="örn: 1007"
                  value={usernameInput}
                  onChange={(e) => {
                    setErrorMsg('');
                    setUsernameInput(e.target.value);
                  }}
                  className="w-full pl-10 pr-3.5 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 mb-1.5">
                Şifre / PIN
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-stone-400">
                  <KeyRound size={16} />
                </div>
                <input
                  type={showPin ? "text" : "password"}
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => {
                    setErrorMsg('');
                    setPinInput(e.target.value);
                  }}
                  className="w-full pl-10 pr-10 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 font-mono tracking-widest placeholder:tracking-normal placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-base transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors cursor-pointer"
                >
                  {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-70 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Giriş Yapılıyor...</span>
                </>
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Developer Mode Quick Link */}
        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setUsernameInput('developer');
              setPinInput('0000');
            }}
            className="text-xs text-stone-500 hover:text-orange-500 dark:text-stone-400 dark:hover:text-orange-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <Terminal size={13} />
            <span>Geliştirici Girişi (Dev / 0000)</span>
          </button>

          {!isInstalled && (
            <button
              type="button"
              onClick={() => setIsPwaModalOpen(true)}
              className="text-xs text-stone-500 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download size={13} />
              <span>Uygulamayı bu cihaza yükle</span>
            </button>
          )}
        </div>
      </div>

      <PwaInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
      />
    </div>
  );
}
