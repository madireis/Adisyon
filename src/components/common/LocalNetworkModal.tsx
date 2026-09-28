import React, { useState, useEffect } from 'react';
import { useLocalNetwork } from '@/lib/useLocalNetwork';
import { generateQRCodeSVG } from '@/lib/qrCodeGenerator';
import {
  Wifi,
  QrCode,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  X,
  Users,
  Shield,
  Server,
  ExternalLink,
  Edit3,
  Utensils,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocalNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LocalNetworkModal({ isOpen, onClose }: LocalNetworkModalProps) {
  const { networkInfo, connectedGarsons, isWifiConnected, pingMs, refresh } = useLocalNetwork();
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [targetType, setTargetType] = useState<'garson' | 'customer'>('garson');
  const [selectedPort, setSelectedPort] = useState<'3001' | '5173'>('3001');
  const [isEditingIp, setIsEditingIp] = useState(false);
  const [customIp, setCustomIp] = useState(() => {
    return localStorage.getItem('wots_custom_local_ip') || '';
  });

  // Calculate clean non-localhost IP
  const detectedIp = networkInfo?.localIp && networkInfo.localIp !== '127.0.0.1' && networkInfo.localIp !== 'localhost'
    ? networkInfo.localIp
    : (window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? window.location.hostname
        : '192.168.1.33');

  const effectiveIp = customIp.trim() || detectedIp;
  const isWebHosted = window.location.hostname.includes('github.io') || 
                      (!/^(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(window.location.hostname) && window.location.hostname.includes('.'));

  let joinUrl = '';
  if (isWebHosted && !customIp.trim()) {
    const hashTarget = targetType === 'customer' ? '#/qr' : '#/login';
    joinUrl = `${window.location.origin}${window.location.pathname}${hashTarget}`;
  } else {
    const hashTarget = targetType === 'customer' ? '#/qr' : '#/login';
    joinUrl = `http://${effectiveIp}:${selectedPort}/${hashTarget}`;
  }

  const qrSvg = generateQRCodeSVG(joinUrl, 230);

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveIp = (newIp: string) => {
    setCustomIp(newIp);
    if (newIp.trim()) {
      localStorage.setItem('wots_custom_local_ip', newIp.trim());
    } else {
      localStorage.removeItem('wots_custom_local_ip');
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <Wifi size={20} />
            </div>
            <div>
              <h2 className="font-black text-lg text-stone-900 dark:text-stone-100 tracking-tight leading-snug">
                WiFi & Ağ Bağlantısı
              </h2>
              <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                Yerel ağ ve bağlı garson cihazları
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status Alert Banner */}
          <div className={cn(
            "p-3.5 rounded-2xl border flex items-center justify-between transition-colors",
            isWifiConnected 
              ? "bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200"
              : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200"
          )}>
            <div className="flex items-center gap-3">
              <div className="relative flex h-2.5 w-2.5 shrink-0">
                <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", isWifiConnected ? "bg-emerald-500" : "bg-amber-500")}></span>
              </div>
              <div>
                <span className="font-bold text-sm block">
                  {isWifiConnected ? "Yerel Ağ Bağlı" : "Yerel Ağ Aranıyor..."}
                </span>
                <span className="text-xs text-stone-500 font-medium">
                  IP: <code className="font-bold bg-white/70 dark:bg-stone-900/70 px-1.5 py-0.5 rounded">{effectiveIp}</code> • Port: {selectedPort} ({pingMs} ms)
                </span>
              </div>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 bg-white/80 dark:bg-stone-900/80 hover:bg-white text-xs font-bold rounded-xl border border-current shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <RefreshCw size={14} className={cn(isRefreshing && "animate-spin")} />
              <span>Yenile</span>
            </button>
          </div>

          {/* Mode Tabs: Garson Terminal vs Customer Digital Menu */}
          <div className="flex items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTargetType('garson')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer",
                  targetType === 'garson'
                    ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200"
                )}
              >
                <Smartphone size={14} />
                <span>Garson Terminali QR</span>
              </button>
              <button
                onClick={() => setTargetType('customer')}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer",
                  targetType === 'customer'
                    ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200"
                )}
              >
                <Utensils size={14} />
                <span>Müşteri Menü QR</span>
              </button>
            </div>

            {/* Port Toggle */}
            <div className="flex items-center gap-1 text-[11px] font-bold text-stone-500">
              <span>Port:</span>
              <button
                onClick={() => setSelectedPort('3001')}
                className={cn(
                  "px-2 py-0.5 rounded-md font-mono font-bold transition-all cursor-pointer",
                  selectedPort === '3001'
                    ? "bg-orange-600 text-white"
                    : "bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
                )}
                title="Adisyon Sunucusu (Varsayılan)"
              >
                3001
              </button>
              <button
                onClick={() => setSelectedPort('5173')}
                className={cn(
                  "px-2 py-0.5 rounded-md font-mono font-bold transition-all cursor-pointer",
                  selectedPort === '5173'
                    ? "bg-orange-600 text-white"
                    : "bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
                )}
                title="Vite Geliştirici Sunucusu"
              >
                5173
              </button>
            </div>
          </div>

          {/* QR Code & Direct Join URL Card */}
          <div className="bg-stone-50 dark:bg-stone-950 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col md:flex-row items-center gap-6">
            {/* SVG QR Code */}
            <div className="shrink-0 flex flex-col items-center">
              <div 
                className="p-3 bg-white rounded-2xl shadow-md border border-stone-200"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <span className="text-[11px] font-black text-stone-600 dark:text-stone-300 mt-2 flex items-center gap-1.5">
                <QrCode size={14} className="text-orange-600" /> Telefon Kamerası İle Tara
              </span>
            </div>

            {/* Connection Instructions & IP */}
            <div className="flex-1 space-y-3 w-full">
              <div>
                <h3 className="font-black text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Smartphone className="text-orange-600" size={18} />
                  {targetType === 'garson' ? 'Garson Telefonunu Bağlayın' : 'Müşteri Menüsünü Açın'}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mt-1">
                  Telefon ile aynı Wi-Fi ağına bağlıyken kamerayı açıp soldaki QR koda doğrultun. Doğrudan tarayıcıda açılacaktır.
                </p>
              </div>

              {/* URL Display Box */}
              <div className="bg-white dark:bg-stone-900 p-3 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Server size={16} className="text-stone-400 shrink-0" />
                  <code className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400 truncate select-all">
                    {joinUrl}
                  </code>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleCopy}
                    className="px-2.5 py-1.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 text-white dark:text-stone-900 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    title="Bağlantıyı Kopyala"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
                  </button>
                  <a
                    href={joinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg transition-colors"
                    title="Yeni Sekmede Aç ve Test Et"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              {/* IP Override Section */}
              <div className="pt-1">
                {isEditingIp ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customIp}
                      placeholder={detectedIp}
                      onChange={(e) => handleSaveIp(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs font-mono font-bold bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <button
                      onClick={() => setIsEditingIp(false)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Kaydet
                    </button>
                    {customIp && (
                      <button
                        onClick={() => handleSaveIp('')}
                        className="px-2 py-1.5 bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Sıfırla
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <span>IP: <strong className="text-stone-800 dark:text-stone-200 font-mono">{effectiveIp}</strong> {customIp ? '(Manuel Ayarlandı)' : '(Otomatik Algılandı)'}</span>
                    <button
                      onClick={() => setIsEditingIp(true)}
                      className="text-orange-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Edit3 size={12} /> IP Değiştir
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PWA Phone Installation Guide Banner */}
          <div className="p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-stone-900 dark:to-orange-950/30 rounded-2xl border border-orange-200 dark:border-orange-900/50 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <Download size={16} />
            </div>
            <div className="text-xs">
              <span className="font-extrabold text-stone-900 dark:text-stone-100 block">
                Telefona Mobil Uygulama Olarak İndirme
              </span>
              <p className="text-stone-600 dark:text-stone-300 mt-0.5 leading-relaxed">
                Garsonlar QR kodu telefonla tarattıktan sonra çıkan ekrandaki <strong>"Uygulama Olarak İndir"</strong> butonuna basabilir veya tarayıcı menüsünden <strong>"Ana Ekrana Ekle"</strong> diyerek tam ekran yerel bir mobil uygulama gibi kullanabilirler.
              </p>
            </div>
          </div>

          {/* Connected Garsons Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-sm uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-2">
                <Users size={16} className="text-orange-600" />
                Yerel WiFi Ağındaki Garson Cihazları
              </h3>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {connectedGarsons.filter(g => g.isOnline).length} Cihaz Bağlı & Canlı
              </span>
            </div>

            <div className="bg-white dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-2xs">
              {connectedGarsons.filter(g => g.isOnline).length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 mx-auto flex items-center justify-center">
                    <Smartphone size={24} />
                  </div>
                  <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
                    Şu an aktif bağlı garson cihazı bulunmuyor
                  </p>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Garsonlar telefonlarından giriş yaptıklarında burada anlık olarak canlı görünecektir. Uygulamayı veya tarayıcıyı kapattıklarında durumları otomatik sonlanır.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100 dark:divide-stone-800">
                  {connectedGarsons.filter(g => g.isOnline).map((garson) => (
                    <div 
                      key={garson.id}
                      className="p-3.5 flex items-center justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-900/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                          {garson.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                              {garson.name}
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 uppercase">
                              {garson.role === 'waiter' ? 'Garson' : garson.role === 'kitchen' ? 'Mutfak' : garson.role === 'owner' ? 'Patron' : 'Yönetici'}
                            </span>
                          </div>
                          <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Smartphone size={12} /> {garson.deviceName}
                            </span>
                            <span>•</span>
                            <span>{garson.ip}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                            Aktif & Bağlı
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-400 font-semibold block mt-0.5">
                          {garson.pingMs} ms • Canlı Ping
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
            <Shield size={14} className="text-emerald-600" /> Yerel WiFi Veri Güvenliği Aktif (Çevrimdışı Çalışabilir)
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white hover:bg-stone-100 text-stone-950 font-black text-xs rounded-xl border border-stone-300 transition-colors cursor-pointer shadow-xs"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
}
