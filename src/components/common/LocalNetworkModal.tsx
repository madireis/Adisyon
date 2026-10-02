import React, { useState } from 'react';
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
  Download,
  Globe,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Terminal,
  FileText,
  CheckCircle2,
  Info
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
  const [addressMode, setAddressMode] = useState<'domain' | 'ip'>('domain');
  const [showToolsGuide, setShowToolsGuide] = useState(false);
  const [isEditingIp, setIsEditingIp] = useState(false);
  const [isLockingIp, setIsLockingIp] = useState(false);
  const [lockedIpSuccess, setLockedIpSuccess] = useState(false);
  const [customIp, setCustomIp] = useState(() => {
    return localStorage.getItem('wots_custom_local_ip') || '';
  });

  const handleLockStaticIp = async () => {
    setIsLockingIp(true);
    try {
      const res = await fetch('/api/system/lock-static-ip', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setLockedIpSuccess(true);
        setTimeout(() => setLockedIpSuccess(false), 3500);
      }
    } catch {
      // silent
    } finally {
      setIsLockingIp(false);
    }
  };

  // Calculate clean non-localhost IP
  const detectedIp = networkInfo?.localIp && networkInfo.localIp !== '127.0.0.1' && networkInfo.localIp !== 'localhost'
    ? networkInfo.localIp
    : (window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? window.location.hostname
        : '192.168.1.33');

  const effectiveIp = customIp.trim() || detectedIp;
  const isWebHosted = window.location.hostname.includes('github.io') || 
                      (!/^(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(window.location.hostname) && window.location.hostname.includes('.'));

  const hashTarget = targetType === 'customer' ? '#/qr' : '#/login';
  let joinUrl = '';
  if (isWebHosted && !customIp.trim()) {
    joinUrl = `${window.location.origin}${window.location.pathname}${hashTarget}`;
  } else if (addressMode === 'domain') {
    joinUrl = `http://adisyon.local:${selectedPort}/${hashTarget}`;
  } else {
    joinUrl = `http://${effectiveIp}:${selectedPort}/${hashTarget}`;
  }

  const qrSvg = generateQRCodeSVG(joinUrl, 200);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold shrink-0">
              <Wifi size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-base sm:text-lg text-stone-900 dark:text-stone-100 tracking-tight leading-snug truncate">
                WiFi & Ağ Bağlantısı
              </h2>
              <p className="text-[11px] sm:text-xs font-semibold text-stone-500 dark:text-stone-400 truncate">
                Yerel ağ, sabit domain ve bağlı garson cihazları
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1 min-w-0">
          {/* Status Alert Banner */}
          <div className={cn(
            "p-3 sm:p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors",
            isWifiConnected 
              ? "bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200"
              : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200"
          )}>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={cn("relative flex h-2.5 w-2.5 shrink-0 rounded-full", isWifiConnected ? "bg-emerald-500" : "bg-amber-500")}>
                {isWifiConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              </span>
              <div className="min-w-0">
                <span className="font-bold text-xs sm:text-sm block">
                  {isWifiConnected ? "Yerel Ağ & Sabit Domain Aktif" : "Yerel Ağ Aranıyor..."}
                </span>
                <div className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 font-medium truncate">
                  Domain: <code className="font-mono font-bold text-orange-600 dark:text-orange-400 bg-white dark:bg-stone-900 px-1 py-0.2 rounded border border-stone-200 dark:border-stone-800">adisyon.local</code> • IP: <code className="font-mono font-semibold">{effectiveIp}</code> • Port: {selectedPort} ({pingMs} ms)
                </div>
              </div>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="self-end sm:self-center px-3 py-1.5 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold rounded-xl border border-stone-300 dark:border-stone-700 shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shrink-0"
            >
              <RefreshCw size={13} className={cn(isRefreshing && "animate-spin")} />
              <span>Yenile</span>
            </button>
          </div>

          {/* Mode Tabs: Garson Terminal vs Customer Digital Menu & Port Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-stone-200 dark:border-stone-800 pb-3">
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-950 rounded-xl border border-stone-200/80 dark:border-stone-800 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setTargetType('garson')}
                className={cn(
                  "flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  targetType === 'garson'
                    ? "bg-white dark:bg-stone-800 text-orange-600 dark:text-orange-400 shadow-2xs"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
                )}
              >
                <Smartphone size={13} />
                <span>Garson Terminali</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetType('customer')}
                className={cn(
                  "flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  targetType === 'customer'
                    ? "bg-white dark:bg-stone-800 text-orange-600 dark:text-orange-400 shadow-2xs"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
                )}
              >
                <Utensils size={13} />
                <span>Müşteri Menü</span>
              </button>
            </div>

            {/* Port Selector */}
            <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-stone-500 shrink-0">
              <span className="text-[11px] font-bold text-stone-400">Port:</span>
              <div className="flex items-center gap-1 p-0.5 bg-stone-100 dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setSelectedPort('3001')}
                  className={cn(
                    "px-2 py-0.5 rounded-md font-mono text-xs font-bold transition-all cursor-pointer",
                    selectedPort === '3001'
                      ? "bg-orange-600 text-white shadow-2xs"
                      : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
                  )}
                  title="Adisyon Sunucusu (Varsayılan)"
                >
                  3001
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPort('5173')}
                  className={cn(
                    "px-2 py-0.5 rounded-md font-mono text-xs font-bold transition-all cursor-pointer",
                    selectedPort === '5173'
                      ? "bg-orange-600 text-white shadow-2xs"
                      : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
                  )}
                  title="Vite Geliştirici Sunucusu"
                >
                  5173
                </button>
              </div>
            </div>
          </div>

          {/* Address Mode Selector: Domain (Recommended) vs IP Address */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <Globe size={14} className="text-orange-600" />
                Bağlantı Adresi Tipi
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} /> Otomatik mDNS Yayını Açık
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setAddressMode('domain')}
                className={cn(
                  "p-2.5 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-0.5",
                  addressMode === 'domain'
                    ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm border border-stone-200 dark:border-stone-700"
                    : "text-stone-600 dark:text-stone-400 hover:bg-white/50 dark:hover:bg-stone-900/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-xs text-orange-600 dark:text-orange-400">
                    <Globe size={13} />
                    <span>adisyon.local</span>
                  </div>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    Önerilen
                  </span>
                </div>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight">
                  Modem IP değişse de adres sabit kalır
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAddressMode('ip')}
                className={cn(
                  "p-2.5 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-0.5",
                  addressMode === 'ip'
                    ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm border border-stone-200 dark:border-stone-700"
                    : "text-stone-600 dark:text-stone-400 hover:bg-white/50 dark:hover:bg-stone-900/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-stone-800 dark:text-stone-200">
                    <Server size={13} />
                    <span>IP Adresi</span>
                  </div>
                  <span className="text-[9px] font-bold text-stone-400">
                    Klasik
                  </span>
                </div>
                <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400 truncate">
                  {effectiveIp}
                </span>
              </button>
            </div>
          </div>

          {/* QR Code & Direct Join URL Card */}
          <div className="bg-stone-50 dark:bg-stone-950 p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 min-w-0">
            {/* SVG QR Code */}
            <div className="shrink-0 flex flex-col items-center">
              <div 
                className="p-2.5 sm:p-3 bg-white rounded-2xl shadow-md border border-stone-200 dark:border-stone-300 w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:aspect-square"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <span className="text-[11px] font-black text-stone-600 dark:text-stone-300 mt-2 flex items-center gap-1.5 text-center">
                <QrCode size={13} className="text-orange-600 shrink-0" /> Telefon Kamerası İle Tara
              </span>
            </div>

            {/* Connection Instructions & IP */}
            <div className="flex-1 space-y-2.5 w-full min-w-0">
              <div>
                <h3 className="font-black text-sm sm:text-base text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Smartphone className="text-orange-600 shrink-0" size={17} />
                  <span>{targetType === 'garson' ? 'Garson Telefonunu Bağlayın' : 'Müşteri Menüsünü Açın'}</span>
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mt-1">
                  Telefonunuz restoranın aynı Wi-Fi ağına bağlıyken kameranızı QR koda doğrultun veya aşağıdaki adrese dokunun.
                </p>
              </div>

              {/* URL Display Box */}
              <div className="bg-white dark:bg-stone-900 p-2.5 sm:p-3 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2 shadow-2xs min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  {addressMode === 'domain' ? (
                    <Globe size={14} className="text-orange-600 shrink-0" />
                  ) : (
                    <Server size={14} className="text-stone-400 shrink-0" />
                  )}
                  <code className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400 break-all select-all">
                    {joinUrl}
                  </code>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-stone-100 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex-1 py-1.5 px-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 text-white dark:text-stone-900 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Bağlantıyı Kopyala"
                  >
                    {copied ? <Check size={13} className="text-emerald-400 dark:text-emerald-600" /> : <Copy size={13} />}
                    <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
                  </button>
                  <a
                    href={joinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1.5 px-3 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                    title="Yeni Sekmede Aç ve Test Et"
                  >
                    <span>Aç</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              {/* Dynamic IP note or IP Override Section */}
              {addressMode === 'domain' ? (
                <div className="p-2 bg-orange-50/70 dark:bg-orange-950/20 rounded-xl border border-orange-200/60 dark:border-orange-900/40 text-[11px] text-stone-600 dark:text-stone-300 flex items-start gap-2">
                  <Sparkles size={14} className="text-orange-600 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    <strong>Dinamik IP Koruması:</strong> Modeminiz yeniden başlasa veya yeni IP atasa bile, mDNS desteği sayesinde tüm iPhone, Android, Mac ve PC'lerde bu sabit alan adı çalışmaya devam eder.
                  </p>
                </div>
              ) : (
                <div className="pt-0.5">
                  {isEditingIp ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <input
                        type="text"
                        value={customIp}
                        placeholder={detectedIp}
                        onChange={(e) => handleSaveIp(e.target.value)}
                        className="flex-1 min-w-[140px] px-2.5 py-1.5 text-xs font-mono font-bold bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg outline-none focus:ring-1 focus:ring-orange-500 text-stone-900 dark:text-stone-100"
                      />
                      <button
                        type="button"
                        onClick={() => setIsEditingIp(false)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Kaydet
                      </button>
                      {customIp && (
                        <button
                          type="button"
                          onClick={() => handleSaveIp('')}
                          className="px-2 py-1.5 bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Sıfırla
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-stone-500 gap-2">
                      <span className="truncate">
                        IP: <strong className="text-stone-800 dark:text-stone-200 font-mono">{effectiveIp}</strong> {customIp ? '(Manuel)' : '(Otomatik)'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingIp(true)}
                        className="text-orange-600 hover:underline flex items-center gap-1 font-bold cursor-pointer shrink-0"
                      >
                        <Edit3 size={11} /> IP Değiştir
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Expandable IP Freezing & Domain Tools Guide */}
          <div className="bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setShowToolsGuide(!showToolsGuide)}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-stone-100/60 dark:hover:bg-stone-900/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-600 flex items-center justify-center shrink-0">
                  <Terminal size={14} />
                </div>
                <div className="min-w-0">
                  <span className="font-extrabold text-xs text-stone-900 dark:text-stone-100 block truncate">
                    IP Değişmesini Önleme & Sabitleme Araçları (Dahil Edilen Dosyalar)
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block truncate">
                    Proje klasöründeki tek tıkla çalışan hazır Windows scriptleri ve çözümler
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-stone-400 shrink-0 ml-2">
                <span className="text-[10px] font-bold uppercase hidden sm:inline">
                  {showToolsGuide ? 'Gizle' : 'Gör'}
                </span>
                {showToolsGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {showToolsGuide && (
              <div className="p-3.5 sm:p-4 pt-1 border-t border-stone-200 dark:border-stone-800 space-y-3 bg-white/50 dark:bg-stone-900/40 text-xs animate-in fade-in duration-150">
                <p className="text-[11px] text-stone-600 dark:text-stone-400">
                  Restoran Wi-Fi modemleri yeniden başladığında bilgisayarınızın IP adresini değiştirebilir. Bu durumun önüne geçmek için projeye eklediğimiz hazır araçları kullanabilirsiniz:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Tool 1: adisyon.local */}
                  <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100">
                      <Globe size={13} className="text-orange-500" />
                      <span>1. adisyon.local (Otomatik mDNS)</span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                      Sunucuda yerleşik çalışır. Hiçbir şey yüklemeden iPhone (Safari), Android 12+, Mac ve Windows 10/11 tarayıcılarında <code>http://adisyon.local:3001</code> yazarak bağlanabilirsiniz.
                    </p>
                  </div>

                  {/* Tool 2: Sabit IP */}
                  <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100">
                        <Terminal size={13} className="text-blue-500" />
                        <span>2. Statik IP Sabitleme (Otomatik)</span>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug mt-1">
                        Sunucu açıldığında bu ayarı otomatik dener. İsterseniz aşağıdaki butonla Windows ağ kartınızın IP adresini hemen dondurabilirsiniz:
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLockStaticIp}
                      disabled={isLockingIp}
                      className="mt-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold border border-blue-200 dark:border-blue-800/60 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {isLockingIp ? <RefreshCw size={12} className="animate-spin" /> : <Shield size={12} />}
                      <span>{lockedIpSuccess ? 'IP Başarıyla Sabitlendi!' : 'IP Adresini Şimdi Dondur'}</span>
                    </button>
                  </div>

                  {/* Tool 3: Adisyon-Domain-Kurucu.bat */}
                  <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100">
                      <FileText size={13} className="text-purple-500" />
                      <span>3. Adisyon-Domain-Kurucu.bat</span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                      Kasa ve diğer Windows bilgisayarların hosts dosyasına <code>adisyon.local</code>, <code>adisyon.pos</code> ve <code>adisyon.cafe</code> domainlerini tek tıkla kaydeder.
                    </p>
                  </div>

                  {/* Tool 4: Bilgisayar-Adini-Adisyon-Yap.bat */}
                  <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100">
                      <Server size={13} className="text-emerald-500" />
                      <span>4. Bilgisayar-Adini-Adisyon-Yap.bat</span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                      Bilgisayarın adını "ADISYON" yapar. Böylece ağdaki tüm Windows cihazlar <code>http://adisyon:3001</code> yazarak da kasaya bağlanabilir.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-100 dark:bg-stone-950 text-stone-600 dark:text-stone-400 text-[11px]">
                  <Info size={14} className="text-orange-600 shrink-0" />
                  <span>
                    Detaylı modem DHCP IP rezervasyonu adımları için proje klasöründeki <strong>IP-Sabitleme-Rehberi.txt</strong> dosyasını açabilirsiniz.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* PWA Phone Installation Guide Banner */}
          <div className="p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-stone-900 dark:to-orange-950/30 rounded-2xl border border-orange-200 dark:border-orange-900/50 flex items-start gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <Download size={15} />
            </div>
            <div className="text-xs min-w-0">
              <span className="font-extrabold text-stone-900 dark:text-stone-100 block">
                Telefona Mobil Uygulama Olarak İndirme
              </span>
              <p className="text-stone-600 dark:text-stone-300 mt-0.5 leading-relaxed text-[11px] sm:text-xs">
                Garsonlar QR kodu telefonla tarattıktan sonra çıkan ekrandaki <strong>"Uygulama Olarak İndir"</strong> butonuna basabilir veya tarayıcı menüsünden <strong>"Ana Ekrana Ekle"</strong> diyerek tam ekran mobil uygulama gibi kullanabilirler.
              </p>
            </div>
          </div>

          {/* Connected Garsons Table */}
          <div className="min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
              <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Users size={15} className="text-orange-600 shrink-0" />
                <span>WiFi Ağındaki Garson Cihazları</span>
              </h3>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
                {connectedGarsons.filter(g => g.isOnline).length} Cihaz Canlı Bağlı
              </span>
            </div>

            <div className="bg-white dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-2xs">
              {connectedGarsons.filter(g => g.isOnline).length === 0 ? (
                <div className="p-6 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 mx-auto flex items-center justify-center">
                    <Smartphone size={20} />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200">
                    Şu an aktif bağlı garson cihazı bulunmuyor
                  </p>
                  <p className="text-[11px] text-stone-400 max-w-sm mx-auto leading-relaxed">
                    Garsonlar telefonlarından giriş yaptıklarında burada anlık olarak canlı görünecektir.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100 dark:divide-stone-800">
                  {connectedGarsons.filter(g => g.isOnline).map((garson) => (
                    <div 
                      key={garson.id}
                      className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-stone-50 dark:hover:bg-stone-900/60 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
                          {garson.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">
                              {garson.name}
                            </span>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 uppercase">
                              {garson.role === 'waiter' ? 'Garson' : garson.role === 'kitchen' ? 'Mutfak' : garson.role === 'owner' ? 'Patron' : 'Yönetici'}
                            </span>
                          </div>
                          <div className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 flex items-center gap-1.5 mt-0.5 truncate">
                            <span className="flex items-center gap-0.5 truncate"><Smartphone size={10} /> {garson.deviceName}</span>
                            <span>•</span>
                            <span className="font-mono">{garson.ip}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                            Canlı
                          </span>
                        </div>
                        <span className="text-[9px] text-stone-400 font-semibold block mt-0.5">
                          {garson.pingMs} ms
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
        <div className="p-3.5 sm:p-4 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] sm:text-xs font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1.5 min-w-0 truncate">
            <Shield size={14} className="text-emerald-600 shrink-0" />
            <span className="truncate">Yerel WiFi & mDNS Güvenliği Aktif</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs shrink-0"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
