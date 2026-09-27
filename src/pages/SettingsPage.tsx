import React, { useState, useEffect } from 'react';
import { Settings, Printer, CreditCard, Bell, Store, CheckCircle2, Database, Trash2, Plus, X, AlertTriangle, Sun, Moon, Monitor, Wifi, QrCode, Smartphone } from 'lucide-react';
import { cn, generateId } from '@/lib/utils';
import { db } from '@/lib/db';
import { resetDatabaseToCleanState } from '@/lib/mockData';
import { useTheme } from '@/lib/theme';
import { useLocalNetwork } from '@/lib/useLocalNetwork';
import LocalNetworkModal from '@/components/common/LocalNetworkModal';
import { generateQRCodeSVG } from '@/lib/qrCodeGenerator';

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col lg:flex-row lg:h-full gap-4 lg:gap-8 select-none">
      {/* Sidebar navigation */}
      <div className="w-full lg:w-64 flex lg:flex-col gap-2 shrink-0 overflow-x-auto pb-2 lg:pb-0">
        <h1 className="text-2xl font-black text-stone-800 dark:text-stone-100 lg:mb-6 flex items-center gap-2 shrink-0 pr-4 lg:pr-0">
          <Settings className="text-orange-600 w-6 h-6" />
          Sistem Ayarları
        </h1>
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm text-left transition-all cursor-pointer shrink-0 whitespace-nowrap",
              activeSection === section.id 
                ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm" 
                : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60"
            )}
          >
            {section.icon}
            <span>{section.label}</span>
          </button>
        ))}
      </div>

      {/* Main Settings Panel */}
      <div className="flex-1 bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
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
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">Adisyon ve fiş üzerinde yer alacak resmi işletme bilgileri</p>
              
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
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                  <Wifi size={24} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-emerald-900 dark:text-emerald-200">
                    Yerel Ağ Sunucusu Aktif & Dinleniyor
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mt-0.5">
                    Ana PC IP Adresi: <code className="font-bold bg-white/70 dark:bg-stone-900/70 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">{networkInfo?.joinUrl || `http://${window.location.hostname && window.location.hostname !== 'localhost' ? window.location.hostname : '192.168.1.33'}:3001`}</code>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsNetworkModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer shrink-0"
              >
                <QrCode size={16} />
                <span>QR Kod & Cihaz Listesi</span>
              </button>
            </div>

            {/* Active Connected Devices List */}
            <div className="bg-stone-50 dark:bg-stone-950 p-5 rounded-2xl border border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-sm text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <Smartphone size={16} className="text-orange-600" />
                  WiFi Ağındaki Garson Telefonları ({connectedGarsons.filter(g => g.isOnline).length} Cihaz)
                </h3>
                <span className="text-xs text-stone-500 font-semibold">
                  Gecikme: {pingMs} ms
                </span>
              </div>

              <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden divide-y divide-stone-100 dark:divide-stone-800">
                {connectedGarsons.map((garson) => (
                  <div key={garson.id} className="p-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center">
                        {garson.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-stone-900 dark:text-stone-100 block">{garson.name}</span>
                        <span className="text-[10px] text-stone-500 dark:text-stone-400 font-semibold">{garson.deviceName} • {garson.ip}</span>
                      </div>
                    </div>

                    <span className={cn(
                      "text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border",
                      garson.isOnline 
                        ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" 
                        : "bg-stone-100 text-stone-500 border-stone-200"
                    )}>
                      {garson.isOnline ? 'Canlı Bağlı' : 'Koptu'}
                    </span>
                  </div>
                ))}
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
          <div>
            <h2 className="text-xl font-black text-stone-900 dark:text-stone-100 mb-1">Sistem & Veri Yönetimi</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">İşlem verileri temizliği, sıfırdan başlama ve fabrika ayarları</p>

            <div className="max-w-xl space-y-6">
              <div className="p-6 rounded-2xl border-2 border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-xl">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-stone-900 dark:text-stone-100 text-base">İşlem Verilerini Temizle (Temiz Başlangıç)</h3>
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                      Tüm test siparişlerini, mutfak fişlerini, tahsilatları ve denetim kayıtlarını temizler. Masaların durumunu sıfırlar ("Boş" duruma getirir). Menünüz, personel listeniz ve masalarınız korunur.
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

      <LocalNetworkModal 
        isOpen={isNetworkModalOpen} 
        onClose={() => setIsNetworkModalOpen(false)} 
      />
    </div>
  );
}
