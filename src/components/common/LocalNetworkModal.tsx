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
  Activity,
  Server,
  Laptop
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

  if (!isOpen) return null;

  const joinUrl = networkInfo?.joinUrl || `http://${window.location.hostname || '192.168.1.105'}:5173`;
  const qrSvg = generateQRCodeSVG(joinUrl, 220);

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Wifi size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="font-black text-lg text-stone-900 dark:text-stone-100 tracking-tight leading-snug">
                Yerel Ağ (WiFi) & Garson Bağlantı Paneli
              </h2>
              <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                Adisyon Ana PC ve Garson Telefonları Aynı WiFi Ağında Canlı Bağlı
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
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Alert Banner */}
          <div className={cn(
            "p-4 rounded-2xl border flex items-center justify-between transition-colors",
            isWifiConnected 
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200"
              : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200"
          )}>
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3 shrink-0">
                {isWifiConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={cn("relative inline-flex rounded-full h-3 w-3", isWifiConnected ? "bg-emerald-500" : "bg-amber-500")}></span>
              </div>
              <div>
                <span className="font-extrabold text-sm block">
                  {isWifiConnected ? "Yerel WiFi Ağı Aktif & Sunucu Bağlı" : "Yerel Ağ Bağlantısı Aranıyor..."}
                </span>
                <span className="text-xs opacity-80 font-medium">
                  Ana PC Sunucu IP: <code className="font-bold bg-white/60 dark:bg-stone-900/60 px-1.5 py-0.5 rounded">{networkInfo?.localIp || '192.168.1.105'}</code> (Gecikme: {pingMs} ms)
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

          {/* QR Code & Direct Join URL Card */}
          <div className="bg-stone-50 dark:bg-stone-950 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col md:flex-row items-center gap-6">
            {/* SVG QR Code */}
            <div className="shrink-0 flex flex-col items-center">
              <div 
                className="p-2.5 bg-white rounded-2xl shadow-md border border-stone-200"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <span className="text-[11px] font-extrabold text-stone-500 dark:text-stone-400 mt-2 flex items-center gap-1">
                <QrCode size={14} /> Telefon Kamerası İle Tara
              </span>
            </div>

            {/* Connection Instructions & IP */}
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-black text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Smartphone className="text-orange-600" size={18} />
                  Garson Telefonunu Yerel Ağa Bağlayın
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mt-1">
                  Garsonlar aynı WiFi ağına (Örn: <strong className="text-stone-800 dark:text-stone-200">WotsCafe_WiFi</strong>) bağlıyken telefon kameraları ile sol taraftaki QR kodu taratarak Adisyon Garson Terminalini anında açabilir.
                </p>
              </div>

              {/* URL Copy Box */}
              <div className="bg-white dark:bg-stone-900 p-3 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Server size={16} className="text-stone-400 shrink-0" />
                  <code className="text-xs font-bold text-orange-600 dark:text-orange-400 truncate select-all">
                    {joinUrl}
                  </code>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 text-white dark:text-stone-900 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? 'Kopyalandı!' : 'URL Kopyala'}</span>
                </button>
              </div>
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
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {connectedGarsons.map((garson) => (
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
                            {garson.role === 'waiter' ? 'Garson' : garson.role === 'kitchen' ? 'Mutfak' : 'Yönetici'}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Smartphone size={12} /> {garson.deviceName}
                          </span>
                          <span>•</span>
                          <span>IP: {garson.ip}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="relative flex h-2 w-2">
                          {garson.isOnline && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          )}
                          <span className={cn("relative inline-flex rounded-full h-2 w-2", garson.isOnline ? "bg-emerald-500" : "bg-stone-400")}></span>
                        </span>
                        <span className={cn("text-xs font-extrabold", garson.isOnline ? "text-emerald-600 dark:text-emerald-400" : "text-stone-400")}>
                          {garson.isOnline ? 'Ağda Bağlı' : 'Koptu'}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400 font-semibold block mt-0.5">
                        {garson.pingMs} ms • Canlı Ping
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
            className="px-5 py-2.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 text-white dark:text-stone-900 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
}
