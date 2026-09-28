import React from 'react';
import { usePwaInstall } from '@/lib/usePwaInstall';
import {
  Download,
  Share2,
  PlusSquare,
  Smartphone,
  CheckCircle2,
  X,
  Zap,
  WifiOff,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import wotsLogo from '@/assets/logo.jpg';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PwaInstallModal({ isOpen, onClose }: PwaInstallModalProps) {
  const { isInstalled, isIos, hasNativePrompt, triggerInstall } = usePwaInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const res = await triggerInstall();
    if (res.outcome === 'accepted') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with App Branding */}
        <div className="relative p-6 bg-stone-950 text-white text-center border-b border-stone-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
            title="Kapat"
          >
            <X size={18} />
          </button>

          <div className="w-16 h-16 mx-auto rounded-2xl bg-black p-1.5 shadow-lg mb-3 flex items-center justify-center border border-stone-800">
            <img
              src={wotsLogo}
              alt="Wot's Cafe Logo"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          <h2 className="text-lg font-black tracking-tight">Uygulamayı Telefona İndir</h2>
          <p className="text-xs text-stone-400 font-medium mt-1">
            Tarayıcı çubuğu olmadan tam ekran ve hızlı kullanım
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
          {isInstalled ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-center space-y-2">
              <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
              <h3 className="font-extrabold text-emerald-900 dark:text-emerald-200 text-sm">
                Uygulama Zaten Yüklü!
              </h3>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                Wot's Cafe Adisyon cihazınıza başarıyla kuruldu. Ana ekranınızdaki simgeye dokunarak tam ekran kullanabilirsiniz.
              </p>
            </div>
          ) : isIos ? (
            /* iOS Safari Step-by-Step Instructions */
            <div className="space-y-3">
              <div className="text-center">
                <span className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  iPhone / iPad İçin Kolay Kurulum
                </span>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  App Store gerekmeden ana ekranınıza doğrudan ekleyin:
                </p>
              </div>

              <div className="bg-stone-50 dark:bg-stone-950 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="text-xs leading-relaxed">
                    Safari tarayıcısının en altındaki{' '}
                    <span className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                      <Share2 size={13} /> Paylaş
                    </span>{' '}
                    butonuna dokunun.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-orange-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="text-xs leading-relaxed">
                    Açılan menüde aşağı kaydırıp{' '}
                    <span className="inline-flex items-center gap-1 font-bold text-stone-900 dark:text-stone-100 bg-stone-200 dark:bg-stone-800 px-1.5 py-0.5 rounded">
                      <PlusSquare size={13} /> Ana Ekrana Ekle
                    </span>{' '}
                    seçeneğini seçin.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="text-xs leading-relaxed">
                    Sağ üst köşedeki <strong className="text-emerald-600">"Ekle"</strong> butonuna basın. Uygulama hemen ana ekranınızda belirecektir!
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Android / Chrome One-Tap Install */
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                  Tarayıcı adres çubuğu olmadan tam ekran, hızlı ve mobil uygulama gibi çalışması için tek tıkla telefonunuza indirin:
                </p>
              </div>

              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-black text-sm rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30"
              >
                <Download size={18} />
                <span>Uygulamayı Telefona İndir</span>
              </button>

              {!hasNativePrompt && (
                <p className="text-[11px] text-stone-400 text-center">
                  💡 İpucu: Tarayıcı menüsünden (üç nokta) <strong>"Uygulamayı Yükle"</strong> veya <strong>"Ana Ekrana Ekle"</strong> seçeneğini de kullanabilirsiniz.
                </p>
              )}
            </div>
          )}

          {/* Advantages List */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-1">
              Özellikler:
            </span>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-stone-600 dark:text-stone-300">
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <Smartphone size={14} className="text-orange-600 shrink-0" />
                <span>Tam Ekran</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <Zap size={14} className="text-orange-600 shrink-0" />
                <span>Hızlı Açılış</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <WifiOff size={14} className="text-orange-600 shrink-0" />
                <span>Çevrimdışı Mod</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <CheckCircle2 size={14} className="text-orange-600 shrink-0" />
                <span>Hafif Yapı</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
