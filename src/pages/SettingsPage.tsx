import React, { useState, useEffect } from 'react';
import { 
  Settings, Printer, CreditCard, Bell, Store, CheckCircle2, Database, Trash2, 
  Plus, X, AlertTriangle, Sun, Moon, Monitor, Wifi, QrCode, Smartphone,
  HardDrive, ShieldCheck, FileText, Download, RefreshCw, FolderTree, ArrowDownToLine, Clock
} from 'lucide-react';
import { cn, generateId } from '@/lib/utils';
import { db } from '@/lib/db';
import { resetDatabaseToCleanState } from '@/lib/mockData';
import { useTheme } from '@/lib/theme';
import { 
  useLocalNetwork 
} from '@/lib/useLocalNetwork';
import { 
  fetchStorageStatus, 
  fetchStorageBackups, 
  triggerStorageBackup, 
  restoreStorageBackup, 
  fetchTodayStorageLogs,
  type StorageStatusInfo,
  type BackupFileInfo 
} from '@/lib/localNetwork';
import LocalNetworkModal from '@/components/common/LocalNetworkModal';
import { generateQRCodeSVG } from '@/lib/qrCodeGenerator';
import wotsLogo from '@/assets/logo.jpg';

interface PrinterConfig {
  id: string;
  name: string;
  ip: string;
  station: string;
  status: string;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<'general' | 'network' | 'printers' | 'payments' | 'notifications' | 'database'>('general');
  const [saved, setSaved] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);

  const { networkInfo, connectedGarsons, isWifiConnected, pingMs } = useLocalNetwork();

  // Storage, Backups & Crash Recovery states
  const [storageStatus, setStorageStatus] = useState<StorageStatusInfo | null>(null);
  const [backupsList, setBackupsList] = useState<BackupFileInfo[]>([]);
  const [todayLogs, setTodayLogs] = useState<string[]>([]);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccessMsg, setBackupSuccessMsg] = useState<string | null>(null);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);
  const [isRestoringFile, setIsRestoringFile] = useState<string | null>(null);

  const refreshStorageData = async () => {
    try {
      const [status, backups] = await Promise.all([
        fetchStorageStatus(),
        fetchStorageBackups(),
      ]);
      setStorageStatus(status);
      setBackupsList(backups);
    } catch {}
  };

  useEffect(() => {
    refreshStorageData();
  }, [activeSection]);

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    setBackupSuccessMsg(null);
    try {
      const res = await triggerStorageBackup('manuel');
      if (res.success) {
        setBackupSuccessMsg(`Yedek oluşturuldu: ${res.filename}`);
        await refreshStorageData();
        setTimeout(() => setBackupSuccessMsg(null), 4000);
      } else {
        alert(res.error || 'Yedek alınamadı');
      }
    } catch (err: any) {
      alert('Yedek alma hatası: ' + err?.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!confirm(`DİKKAT: "${filename}" yedeğini geri yüklemek istiyor musunuz? Mevcut durumunuz yedeklenip bu snapshot yüklenecektir.`)) {
      return;
    }
    setIsRestoringFile(filename);
    setRestoreSuccessMsg(null);
    try {
      const res = await restoreStorageBackup(filename);
      if (res.success) {
        setRestoreSuccessMsg(`"${filename}" başarıyla geri yüklendi!`);
        await refreshStorageData();
        setTimeout(() => setRestoreSuccessMsg(null), 5000);
      } else {
        alert(res.error || 'Geri yükleme başarısız');
      }
    } catch (err: any) {
      alert('Geri yükleme hatası: ' + err?.message);
    } finally {
      setIsRestoringFile(null);
    }
  };

  const handleOpenTodayLogs = async () => {
    try {
      const lines = await fetchTodayStorageLogs();
      setTodayLogs(lines);
      setIsLogsModalOpen(true);
    } catch {
      alert('Loglar okunamadı');
    }
  };

  // Business Profile states
  const [profile, setProfile] = useState({
    name: "WOT'S CAFE RESTAURANT",
    address: 'Piri Mehmet Paşa Mah. İnönü Cad. No:25A, 34570 Silivri / İstanbul',
    phone: '0 (532) 267 69 84',
    tax: 'Silivri V.D. 9210482110',
  });

  // Printers
  const [printers, setPrinters] = useState<PrinterConfig[]>([
    { id: 'p-1', name: 'Kasa Adisyon Yazıcısı', ip: '192.168.1.200', status: 'Bağlı', station: 'Kasa' },
    { id: 'p-2', name: 'Sıcak Mutfak Fiş Yazıcısı', ip: '192.168.1.201', status: 'Bağlı', station: 'Mutfak' },
    { id: 'p-3', name: 'Bar & Kahve Yazıcısı', ip: '192.168.1.202', status: 'Bağlı', station: 'Bar' },
  ]);

  const [isAddPrinterOpen, setIsAddPrinterOpen] = useState(false);
  const [newPrinterName, setNewPrinterName] = useState('');
  const [newPrinterIp, setNewPrinterIp] = useState('192.168.1.');
  const [newPrinterStation, setNewPrinterStation] = useState('Kasa');

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('wots_settings_profile');
      if (savedProfile) setProfile(JSON.parse(savedProfile));

      const savedPrinters = localStorage.getItem('wots_settings_printers');
      if (savedPrinters) setPrinters(JSON.parse(savedPrinters));
    } catch {
      // ignore
    }
  }, []);

  const handleSaveProfile = () => {
    localStorage.setItem('wots_settings_profile', JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleAddPrinter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrinterName.trim()) return;

    const newP: PrinterConfig = {
      id: generateId(),
      name: newPrinterName.trim(),
      ip: newPrinterIp.trim(),
      station: newPrinterStation,
      status: 'Bağlı'
    };

    const updated = [...printers, newP];
    setPrinters(updated);
    localStorage.setItem('wots_settings_printers', JSON.stringify(updated));
    setIsAddPrinterOpen(false);
    setNewPrinterName('');
    setNewPrinterIp('192.168.1.');
  };

  const handleDeletePrinter = (id: string) => {
    const updated = printers.filter(p => p.id !== id);
    setPrinters(updated);
    localStorage.setItem('wots_settings_printers', JSON.stringify(updated));
  };

  const handleResetDatabase = async () => {
    if (confirm('DİKKAT: Bu işlem tüm aktif ve geçmiş siparişleri, mutfak fişlerini, tahsilatları ve denetim kayıtlarını kalıcı olarak silecektir. Masalar boş duruma getirilecektir. Onaylıyor musunuz?')) {
      await resetDatabaseToCleanState(db);
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 4000);
    }
  };

  const sections = [
    { id: 'general' as const, label: 'Restoran & Görünüm', icon: <Store size={18} /> },
    { id: 'network' as const, label: 'Yerel WiFi & Garsonlar', icon: <Wifi size={18} /> },
    { id: 'printers' as const, label: 'Termal Yazıcılar', icon: <Printer size={18} /> },
    { id: 'payments' as const, label: 'Ödeme Metodları', icon: <CreditCard size={18} /> },
    { id: 'notifications' as const, label: 'Bildirimler & Ses', icon: <Bell size={18} /> },
    { id: 'database' as const, label: 'Sistem & Veri Sıfırlama', icon: <Database size={18} /> },
  ];

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col lg:flex-row lg:h-full gap-3 sm:gap-4 lg:gap-8 select-none">
      {/* Sidebar navigation */}
      <div className="w-full lg:w-64 flex flex-col gap-2 shrink-0">
        <h1 className="text-xl sm:text-2xl font-black text-stone-800 dark:text-stone-100 lg:mb-4 flex items-center gap-2">
          <Settings className="text-orange-600 w-5 h-5 sm:w-6 sm:h-6" />
          <span>Sistem Ayarları</span>
        </h1>
        <div className="flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "flex items-center gap-2 sm:gap-3 px-3.5 py-2.5 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm text-left transition-all cursor-pointer shrink-0 whitespace-nowrap",
                activeSection === section.id 
                  ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm" 
                  : "text-stone-600 dark:text-stone-400 bg-white/70 dark:bg-stone-900/60 lg:bg-transparent border border-stone-200/60 dark:border-stone-800 lg:border-transparent hover:bg-stone-100 dark:hover:bg-stone-800/60"
              )}
            >
              {section.icon}
              <span>{section.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Settings Panel */}
      <div className="flex-1 bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 p-3.5 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
        {activeSection === 'general' && (
          <div className="space-y-8">
            {/* Theme Selector Section */}
            <div>
              <h2 className="text-xl font-black text-stone-900 dark:text-stone-100 mb-1">Uygulama Teması & Görünüm</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">iOS Warm Charcoal Koyu Modu veya Aydınlık Temayı seçin</p>
              
              <div className="grid grid-cols-3 gap-3 max-w-xl">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={cn(
                    "p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer font-bold text-xs",
                    theme === 'light'
                      ? "border-orange-600 bg-orange-50/50 dark:bg-stone-800 text-orange-600"
                      : "border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                  )}
                >
                  <Sun size={24} className="text-amber-500" />
                  <span>Açık Mod</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={cn(
                    "p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer font-bold text-xs",
                    theme === 'dark'
                      ? "border-orange-600 bg-orange-50/50 dark:bg-stone-800 text-orange-600"
                      : "border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                  )}
                >
                  <Moon size={24} className="text-indigo-400" />
                  <span>Koyu Mod</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={cn(
                    "p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer font-bold text-xs",
                    theme === 'system'
                      ? "border-orange-600 bg-orange-50/50 dark:bg-stone-800 text-orange-600"
                      : "border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                  )}
                >
                  <Monitor size={24} className="text-stone-400" />
                  <span>Sistem</span>
                </button>
              </div>
            </div>

            <hr className="border-stone-200 dark:border-stone-800" />

            {/* Profile Section */}
            <div>
              <h2 className="text-xl font-black text-stone-900 dark:text-stone-100 mb-1">WOT'S CAFE RESTAURANT İşletme Profili</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-5">Adisyon ve fiş üzerinde yer alacak resmi işletme bilgileri</p>
              
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 mb-6 max-w-xl shadow-2xs">
                <div className="w-16 h-16 rounded-2xl bg-black p-1.5 shadow-md border border-orange-500/30 flex items-center justify-center shrink-0">
                  <img src={wotsLogo} alt="WOT'S CAFE" className="w-full h-full object-contain rounded-xl" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">Resmi WOT'S CAFE Logosu</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Tüm adisyon hesap fişlerinde, mutfak sipariş çıktılarında, QR müşteri menüsünde ve giriş ekranında bu logo kullanılmaktadır.</p>
                </div>
              </div>

              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Ticari Ünvan / Restoran Adı</label>
                  <input 
                    type="text" 
                    value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-800 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-orange-500 outline-none text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Açık Adres (Silivri Şubesi)</label>
                  <textarea 
                    value={profile.address}
                    onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-800 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none h-20 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">İşletme Telefonu</label>
                    <input 
                      type="text" 
                      value={profile.phone}
                      onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-800 rounded-xl text-sm font-mono focus:ring-2 focus:ring-orange-500 outline-none text-stone-900 dark:text-stone-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1">Vergi Dairesi / No</label>
                    <input 
                      type="text" 
                      value={profile.tax}
                      onChange={e => setProfile(p => ({ ...p, tax: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-800 rounded-xl text-sm font-mono focus:ring-2 focus:ring-orange-500 outline-none text-stone-900 dark:text-stone-100"
                    />
                  </div>
                </div>
                <div className="pt-4 flex items-center gap-3">
                  <button 
                    onClick={handleSaveProfile}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer shadow-sm"
                  >
                    Ayarları Kaydet
                  </button>
                  {saved && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={16} /> Kaydedildi!
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'network' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-stone-900 dark:text-stone-100 mb-1 flex items-center gap-2">
                <Wifi className="text-emerald-600" size={22} />
                Yerel Ağ (WiFi) & Garson Telefon Bağlantısı
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Adisyon sistemi ve garson cep telefonları aynı yerel Wi-Fi ağında (Örn: WotsCafe_WiFi) canlı olarak birbirini görür.
              </p>
            </div>

            {/* Network Info Banner */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 sm:p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                  <Wifi size={22} className="animate-pulse" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm text-emerald-900 dark:text-emerald-200 truncate">
                    Yerel Ağ Sunucusu Aktif & Dinleniyor
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mt-0.5 break-all">
                    Ana PC IP Adresi: <code className="font-bold bg-white/70 dark:bg-stone-900/70 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 break-all">{networkInfo?.joinUrl || `http://${window.location.hostname && window.location.hostname !== 'localhost' ? window.location.hostname : '192.168.1.33'}:3001`}</code>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsNetworkModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
              >
                <QrCode size={16} />
                <span>QR Kod & Cihaz Listesi</span>
              </button>
            </div>

            {/* Active Connected Devices List */}
            <div className="bg-stone-50 dark:bg-stone-950 p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-stone-800 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3">
                <h3 className="font-extrabold text-xs sm:text-sm text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <Smartphone size={16} className="text-orange-600 shrink-0" />
                  <span>WiFi Ağındaki Garson Telefonları ({connectedGarsons.filter(g => g.isOnline).length} Cihaz)</span>
                </h3>
                <span className="text-xs text-stone-500 font-semibold self-start sm:self-auto">
                  Gecikme: {pingMs} ms
                </span>
              </div>

              <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
                {connectedGarsons.filter(g => g.isOnline).length === 0 ? (
                  <div className="p-6 text-center text-xs text-stone-400">
                    Şu an WiFi ağında aktif bağlı garson cihazı yok.
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100 dark:divide-stone-800">
                    {connectedGarsons.filter(g => g.isOnline).map((garson) => (
                      <div key={garson.id} className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {garson.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 block truncate">{garson.name}</span>
                            <span className="text-[10px] text-stone-500 dark:text-stone-400 font-semibold truncate block">{garson.deviceName} • {garson.ip}</span>
                          </div>
                        </div>

                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shrink-0">
                          Aktif Bağlı
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'printers' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <div>
                <h2 className="text-xl font-black text-stone-900 dark:text-stone-100 mb-1">Mutfak & Kasa Termal Yazıcıları</h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">ESC/POS 80mm fiş ve adisyon yazıcı istasyonları</p>
              </div>
              <button
                onClick={() => setIsAddPrinterOpen(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus size={16} />
                Yazıcı Ekle
              </button>
            </div>

            <div className="space-y-3 max-w-xl">
              {printers.map((p) => (
                <div key={p.id} className="flex justify-between items-center p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
                  <div>
                    <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">{p.name}</h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 font-mono mt-0.5">{p.ip} (LAN) • İstasyon: {p.station}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      {p.status}
                    </span>
                    <button
                      onClick={() => handleDeletePrinter(p.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg cursor-pointer transition-colors"
                      title="Yazıcıyı Kaldır"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Printer Modal */}
            {isAddPrinterOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
                <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-stone-200 dark:border-stone-800 dark:text-stone-100 animate-in fade-in zoom-in-95">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-stone-100 dark:border-stone-800">
                    <h3 className="text-lg font-black text-stone-800 dark:text-stone-100 flex items-center gap-2">
                      <Printer className="text-orange-600" size={20} />
                      Yeni Termal Yazıcı Tanımla
                    </h3>
                    <button onClick={() => setIsAddPrinterOpen(false)} className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer">
                      <X size={18} />
                    </button>
                  </div>
                  <form onSubmit={handleAddPrinter} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Yazıcı Adı</label>
                      <input
                        type="text"
                        required
                        placeholder="Örn: Tatlı İstasyonu Yazıcısı"
                        value={newPrinterName}
                        onChange={e => setNewPrinterName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-semibold bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Ağ IP Adresi</label>
                      <input
                        type="text"
                        required
                        placeholder="192.168.1.205"
                        value={newPrinterIp}
                        onChange={e => setNewPrinterIp(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-mono bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">İstasyon</label>
                      <select
                        value={newPrinterStation}
                        onChange={e => setNewPrinterStation(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-semibold bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                      >
                        <option value="Kasa">Kasa</option>
                        <option value="Mutfak">Sıcak Mutfak</option>
                        <option value="Bar">Bar & Kahve</option>
                        <option value="Tatlı">Tatlı İstasyonu</option>
                      </select>
                    </div>
                    <div className="pt-2 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsAddPrinterOpen(false)}
                        className="flex-1 py-2 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
                      >
                        İptal
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Yazıcıyı Ekle
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'payments' && (
          <div>
            <h2 className="text-xl font-black text-stone-900 dark:text-stone-100 mb-1">Kabul Edilen Ödeme Yöntemleri</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">Kasada ve garson terminalinde aktif ödeme kanalları</p>

            <div className="space-y-3 max-w-xl">
              {[
                { name: 'Nakit Türk Lirası (₺)', active: true },
                { name: 'Banka / Kredi Kartı (Fiziki POS)', active: true },
                { name: 'Sodexo Restaurant Pass', active: true },
                { name: 'Multinet Yemek Kartı', active: true },
                { name: 'Ticket Restaurant (Edenred)', active: true },
                { name: 'Metropol Card', active: true },
                { name: 'Yetkili İkram (Yönetici Onaylı)', active: true },
              ].map((m, idx) => (
                <div key={idx} className="flex justify-between items-center p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950">
                  <span className="font-bold text-sm text-stone-800 dark:text-stone-200">{m.name}</span>
                  <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Aktif
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'notifications' && (
          <div>
            <h2 className="text-xl font-black text-stone-900 dark:text-stone-100 mb-1">Mutfak & Sipariş Bildirim Sesleri</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">Yeni sipariş ve servis hazır çan sesleri</p>

            <div className="space-y-3 max-w-xl">
              <div className="flex justify-between items-center p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
                <div>
                  <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">Mutfak Yeni Fiş Zili</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Yeni adisyon düştüğünde uyarı tonu çalar</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-orange-600 rounded cursor-pointer" />
              </div>
              <div className="flex justify-between items-center p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
                <div>
                  <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">Masa Sipariş Hazır Uyarısı</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Mutfak fişi 'Hazır' yaptığında garson ekranına bildirim düşer</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-orange-600 rounded cursor-pointer" />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'database' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-black text-stone-900 dark:text-stone-100 mb-1">Yerel Veri Depolama & Ani Kapanma Koruması</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
                Elektrik kesintisi veya ani kapanmalara karşı atomik çift yedekleme, organize dosya dizinleri ve günlük işlem kayıtları
              </p>

              {/* Status Banner */}
              <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/80 space-y-4 max-w-3xl mb-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-stone-900 dark:text-stone-100 text-sm">
                        Otomatik Çift Yedekleme & Ani Kapanma Koruması: <span className="text-emerald-600 dark:text-emerald-400">Aktif</span>
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {storageStatus?.resilience || 'Atomik Temp-Rename Yazma + Çift Kurtarma Dosyası + Dönen Yedekler'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCreateBackup}
                    disabled={isBackingUp}
                    className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs shrink-0"
                  >
                    <RefreshCw size={14} className={cn(isBackingUp && "animate-spin")} />
                    <span>{isBackingUp ? 'Yedek Alınıyor...' : 'Şimdi Anlık Yedek Al'}</span>
                  </button>
                </div>

                {backupSuccessMsg && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} /> {backupSuccessMsg}
                  </div>
                )}

                {restoreSuccessMsg && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} /> {restoreSuccessMsg}
                  </div>
                )}

                {/* Directory & Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
                    <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs font-semibold mb-1">
                      <FolderTree size={15} className="text-orange-500" />
                      <span>Sipariş Dosyaları</span>
                    </div>
                    <div className="font-mono font-black text-sm text-stone-800 dark:text-stone-100">data/orders/</div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                      {storageStatus?.orderFilesCount ?? 1} günlük dosya (.jsonl & .json)
                    </div>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
                    <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs font-semibold mb-1">
                      <FileText size={15} className="text-sky-500" />
                      <span>Sistem Günlükleri</span>
                    </div>
                    <div className="font-mono font-black text-sm text-stone-800 dark:text-stone-100">data/logs/</div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                      {storageStatus?.logFilesCount ?? 1} log dosyası (.log & .jsonl)
                    </div>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
                    <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs font-semibold mb-1">
                      <HardDrive size={15} className="text-emerald-500" />
                      <span>Snapshot Yedekler</span>
                    </div>
                    <div className="font-mono font-black text-sm text-stone-800 dark:text-stone-100">data/backups/</div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                      {backupsList.length} kayıtlı geri yükleme noktası
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={handleOpenTodayLogs}
                    className="text-xs font-bold text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 px-3.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <FileText size={14} className="text-orange-500" />
                    <span>Bugünün Sistem & Sipariş Loglarını Gör</span>
                  </button>
                  <button
                    onClick={refreshStorageData}
                    className="text-xs font-bold text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw size={13} />
                    <span>Yenile</span>
                  </button>
                </div>
              </div>

              {/* Historical Snapshots Table */}
              <div className="max-w-3xl space-y-3">
                <h3 className="font-black text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Clock size={16} className="text-orange-500" />
                  <span>Kayıtlı Geri Yükleme Noktaları (Otomatik & Manuel Snapshotlar)</span>
                </h3>

                {backupsList.length === 0 ? (
                  <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-500 text-xs text-center font-medium">
                    Henüz snapshot yedek bulunmuyor. "Şimdi Anlık Yedek Al" butonuna tıklayarak ilk yedeğinizi oluşturabilirsiniz.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-900 divide-y divide-stone-100 dark:divide-stone-800">
                    {backupsList.slice(0, 8).map((b) => (
                      <div key={b.filename} className="p-3.5 flex items-center justify-between gap-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                        <div className="min-w-0">
                          <div className="font-mono font-bold text-xs text-stone-800 dark:text-stone-200 truncate">
                            {b.filename}
                          </div>
                          <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
                            <span>{new Date(b.createdAt).toLocaleString('tr-TR')}</span>
                            <span>•</span>
                            <span>{b.sizeKb} KB</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRestoreBackup(b.filename)}
                          disabled={isRestoringFile === b.filename}
                          className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-orange-600 hover:text-white dark:hover:bg-orange-600 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                        >
                          {isRestoringFile === b.filename ? 'Yükleniyor...' : 'Geri Yükle'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <hr className="border-stone-200 dark:border-stone-800 max-w-3xl" />

            {/* Reset Database Card */}
            <div className="max-w-3xl space-y-6">
              <div className="p-6 rounded-2xl border-2 border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-xl">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-stone-900 dark:text-stone-100 text-base">İşlem Verilerini Temizle (Temiz Gün Başlangıcı)</h3>
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                      Tüm aktif/geçmiş siparişleri, mutfak fişlerini ve tahsilatları temizler. Masaların durumunu sıfırlar ("Boş" duruma getirir). Menü (18 kategori, 167 ürün), personel listeniz ve masalarınız aynen korunur.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={handleResetDatabase}
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Trash2 size={16} />
                    Tüm İşlem Verilerini Sıfırla
                  </button>
                  {resetSuccess && (
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-in fade-in">
                      <CheckCircle2 size={16} /> Veriler temizlendi, masalar boşaltıldı!
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Logs Viewer Modal */}
      {isLogsModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 w-full max-w-4xl h-[80vh] rounded-3xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <FileText className="text-orange-500" size={20} />
                <div>
                  <h3 className="font-black text-base">Bugünün Sistem & Sipariş Günlüğü (Activity Log)</h3>
                  <p className="text-xs text-stone-400">data/logs/ dizinindeki gerçek zamanlı operasyonel kayıtlar</p>
                </div>
              </div>
              <button
                onClick={() => setIsLogsModalOpen(false)}
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-stone-950 text-emerald-400 p-4 rounded-2xl font-mono text-xs my-4 space-y-1 select-text">
              {todayLogs.length === 0 ? (
                <div className="text-stone-500 py-8 text-center">Henüz bugüne ait log kaydı bulunmuyor.</div>
              ) : (
                todayLogs.map((line, idx) => (
                  <div key={idx} className="leading-relaxed hover:bg-stone-900/60 px-1.5 py-0.5 rounded">
                    {line}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsLogsModalOpen(false)}
                className="px-5 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs rounded-xl cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      <LocalNetworkModal 
        isOpen={isNetworkModalOpen} 
        onClose={() => setIsNetworkModalOpen(false)} 
      />
    </div>
  );
}
