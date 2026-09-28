import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  ChefHat, 
  Grid2X2, 
  QrCode, 
  CreditCard, 
  Banknote, 
  Users, 
  Settings, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Smartphone, 
  Printer, 
  Flame, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  Receipt, 
  Plus, 
  HelpCircle,
  Lightbulb,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Laptop,
  Wifi,
  ShoppingBag,
  BellRing
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GuidePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>('faq-1');

  const toggleFaq = (id: string) => {
    setExpandedFaq(prev => prev === id ? null : id);
  };

  const tabs = [
    { id: 'all', label: 'Tüm Kılavuz', icon: BookOpen },
    { id: 'overview', label: '1. Sistemin Mantığı', icon: Lightbulb },
    { id: 'waiter', label: '2. Garson & Sipariş', icon: Grid2X2 },
    { id: 'kitchen', label: '3. Mutfak (KDS)', icon: ChefHat },
    { id: 'qr', label: '4. QR Dijital Menü', icon: QrCode },
    { id: 'cashier', label: '5. Kasa & Ödeme', icon: CreditCard },
    { id: 'reports', label: '6. Ciro & Masraflar', icon: Banknote },
    { id: 'menu', label: '7. Menü & Tükendi', icon: ShoppingBag },
    { id: 'staff', label: '8. Telefonları Bağlama', icon: Smartphone },
    { id: 'faq', label: '9. Sık Sorulanlar', icon: HelpCircle },
  ];

  return (
    <div className="h-full flex flex-col bg-stone-100 dark:bg-stone-950 overflow-y-auto select-none pb-24">
      {/* Top Hero Banner */}
      <div className="bg-stone-900 text-stone-100 p-4 sm:p-8 border-b border-stone-800 shrink-0">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-950/80 text-orange-400 border border-orange-800/80 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2">
                <ShieldCheck size={14} />
                Patron & Yönetici Başucu Kılavuzu
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Sistem Nasıl Çalışır? (Tüm Akış & Patron Rehberi)
              </h1>
              <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl leading-relaxed">
                Karmaşık teknik terimler yok. Masaya müşteri oturduğu andan gün sonu kasanın kapanışına kadar neyi, nereden, nasıl yapacağınız adım adım en sade haliyle burada.
              </p>
            </div>

            {/* Fast Jump Shortcuts for Owner */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate('/tables')}
                className="px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Grid2X2 size={14} />
                <span>Masalara Git</span>
              </button>
              <button
                onClick={() => navigate('/kitchen')}
                className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold transition-all border border-stone-700 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <ChefHat size={14} />
                <span>Mutfağa Git</span>
              </button>
              <button
                onClick={() => navigate('/reports')}
                className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Banknote size={14} />
                <span>Kasa & Ciro</span>
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="mt-6 relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rehberde ara (örn: fiyat değiştirme, fiş yazdır, garson ekle)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-800/90 border border-stone-700 rounded-xl text-xs text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Category Pills Navigation */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-3 sm:px-8 py-2.5 overflow-x-auto no-scrollbar">
        <div className="max-w-6xl mx-auto flex items-center gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer active:scale-95 shrink-0",
                  isActive
                    ? "bg-orange-600 text-white shadow-sm"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
                )}
              >
                <Icon size={14} className={isActive ? "text-white" : "text-stone-500 dark:text-stone-400"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="max-w-6xl mx-auto w-full p-4 sm:p-8 space-y-8">
        
        {/* SECTION 1: GENEL SİSTEM MANTIĞI */}
        {(activeTab === 'all' || activeTab === 'overview') && (
          <section className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black">
                <Lightbulb size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100">
                  1. Sistemin Mantığı: "Bu Sistem Nasıl Çalışıyor?"
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">Teknik bilmenize gerek yok, 3 cümlede özet</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-black text-sm mb-1.5">
                  <Laptop size={16} />
                  <span>Kasa / Kurulum Gerekmez</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Pahalı bilgisayarlar veya sunucu kutuları almanıza gerek yok. Telefon, tablet veya normal bilgisayarın internet tarayıcısından (Chrome/Safari) siteyi açtığınız anda çalışır.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm mb-1.5">
                  <Wifi size={16} />
                  <span>Canlı Senkronizasyon</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Garson telefondan siparişi girdiği anda mutfaktaki tablet çalar ve fiş düşer. Kasiyerin ekranında masa turuncu (dolu) olur. Her cihaz saniyenin onda birinde birbiriyle konuşur.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-sm mb-1.5">
                  <ShieldCheck size={16} />
                  <span>İnternet Gitse Bile Güvende</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Kafede internet 5 dakika kesilse dahi aldığınız siparişler cihazınızın hafızasında korunur. İnternet geri geldiği anda diğer ekranlarla otomatik eşitlenir.
                </p>
              </div>
            </div>

            {/* Renk Kodları Tablosu */}
            <div className="p-4 rounded-2xl bg-stone-900 text-white border border-stone-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-orange-400 mb-3">
                Masa Renklerinin Anlamı (Masalar Ekranı)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="flex items-center gap-2 bg-stone-800/80 p-2.5 rounded-xl border border-emerald-500/40">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                  <div>
                    <span className="font-bold text-xs text-emerald-300 block">YEŞİL: Boş Masa</span>
                    <span className="text-[10px] text-stone-400">Yeni müşteri oturabilir.</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-stone-800/80 p-2.5 rounded-xl border border-orange-500/40">
                  <span className="w-3.5 h-3.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50"></span>
                  <div>
                    <span className="font-bold text-xs text-orange-300 block">TURUNCU: Dolu Masa</span>
                    <span className="text-[10px] text-stone-400">İçeride aktif sipariş var.</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-stone-800/80 p-2.5 rounded-xl border border-red-500/40">
                  <span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50 animate-pulse"></span>
                  <div>
                    <span className="font-bold text-xs text-red-300 block">KIRMIZI: Hesap Bekliyor</span>
                    <span className="text-[10px] text-stone-400">Müşteri hesabı istedi.</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-stone-800/80 p-2.5 rounded-xl border border-purple-500/40">
                  <span className="w-3.5 h-3.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50"></span>
                  <div>
                    <span className="font-bold text-xs text-purple-300 block">MOR: Rezerve Masa</span>
                    <span className="text-[10px] text-stone-400">İleri saate ayrılmış masa.</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: GARSON & SİPARİŞ İŞ AKIŞI */}
        {(activeTab === 'all' || activeTab === 'waiter') && (
          <section className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black">
                <Grid2X2 size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100">
                  2. Garson İş Akışı: "Sipariş Nasıl Alınır ve Mutfağa Gider?"
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">Garsonun telefonda yapacağı 3 basit adım</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 items-start">
                <div className="w-8 h-8 rounded-full bg-orange-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-black text-sm text-stone-900 dark:text-stone-100">Masayı Seç</h4>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5 leading-relaxed">
                    Garson ana ekrandaki masalardan müşterinin oturduğu masaya (Örneğin <strong>Masa 4</strong>) tıklar. Karşısına kategoriler ve ürünler gelir.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 items-start">
                <div className="w-8 h-8 rounded-full bg-orange-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-black text-sm text-stone-900 dark:text-stone-100">Ürünleri Sepete Ekle</h4>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5 leading-relaxed">
                    İstenen ürünlerin üstüne basar (Örn: 2x Çay, 1x Cheeseburger). Altta turuncu renkli <strong>"Adisyon Çubuğu"</strong> otomatik yükselir ve toplam tutarı gösterir.
                  </p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-1">
                    İpucu: Ürün üzerine tekrar basarak veya açılan pencereden adet arttırıp azaltabilir, varsa "Az pişmiş", "Buzsuz" gibi özel mutfak notu yazabilir.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 items-start">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-black text-sm text-orange-900 dark:text-orange-200">"MUTFAĞA GÖNDER"e Bas!</h4>
                  <p className="text-xs text-orange-800 dark:text-orange-300 mt-0.5 leading-relaxed">
                    Büyük turuncu <strong>"MUTFAĞA GÖNDER"</strong> butonuna basar. Bu kadar! Masa anında turuncu (Dolu) olur ve mutfaktaki tablete sesli bildirim gider.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Masaya sonradan ilave sipariş gelirse ne olur?</span>
                Garson masayı tekrar açıp yeni ürünü seçer ve yine "MUTFAĞA GÖNDER" der. Sistem sadece <strong>yeni eklenen</strong> ürünleri mutfağa ikinci bir fiş olarak gönderir; önceki yemekleri mükerrer basmaz!
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: MUTFAK (KDS) İŞ AKIŞI */}
        {(activeTab === 'all' || activeTab === 'kitchen') && (
          <section className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                <ChefHat size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100">
                  3. Mutfak Ekranı (KDS): "Aşçı ve Barmen Ne Yapar?"
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">Kağıt fiş israfına son veren akıllı mutfak paneli</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Mutfaktaki veya bardaki tablete <strong>Mutfak Ekranı</strong> açılır. Garson siparişi gönderdiği anda ekranda 4 aşamalı bir kart düzeni çalışır:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800">
                <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-300 block mb-1">1. Aşama</span>
                <h4 className="font-black text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <BellRing size={15} className="text-blue-600" />
                  YENİ (Mavi)
                </h4>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1">
                  Mutfakta zil çalar. Fiş burada belirir. Aşçı hangi masanın ne istediğini görür.
                </p>
                <div className="mt-2 text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-900/60 p-1.5 rounded-lg text-center">
                  Aşçı "BAŞLA" butonuna basar
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800">
                <span className="text-[10px] font-black uppercase text-orange-700 dark:text-orange-300 block mb-1">2. Aşama</span>
                <h4 className="font-black text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Flame size={15} className="text-orange-600" />
                  HAZIRLANIYOR
                </h4>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1">
                  Yemek ocakta pişiyor demektir. Garsonun telefonunda "Mutfakta hazırlanıyor (3 dk)" diye süre sayar.
                </p>
                <div className="mt-2 text-[10px] font-bold text-orange-700 dark:text-orange-300 bg-orange-100/70 dark:bg-orange-900/60 p-1.5 rounded-lg text-center">
                  Yemek pişince "HAZIR"a basar
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 block mb-1">3. Aşama</span>
                <h4 className="font-black text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  HAZIR (Yeşil)
                </h4>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1">
                  Garsonun telefonuna hazır melodisi çalar ve masası yeşil yanıp söner. Garson yemeği tezgâhtan alır.
                </p>
                <div className="mt-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/60 p-1.5 rounded-lg text-center">
                  "SERVİS EDİLDİ"ye basılır
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <span className="text-[10px] font-black uppercase text-stone-500 dark:text-stone-400 block mb-1">4. Aşama</span>
                <h4 className="font-black text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Check size={15} className="text-stone-500" />
                  SERVİS EDİLDİ
                </h4>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1">
                  Fiş arşivlenir, mutfak ekranı temizlenir. Günlük mutfak hız raporuna (Kaç dakikada çıktı) kaydedilir.
                </p>
                <div className="mt-2 text-[10px] font-bold text-stone-600 dark:text-stone-400 bg-stone-200 dark:bg-stone-700 p-1.5 rounded-lg text-center">
                  Süreç Tamamlandı
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 flex items-center justify-between">
              <span>İstasyon Filtreleri: Mutfak sadece sıcak yemekleri, Bar sadece içecekleri görebilir.</span>
              <span className="font-bold text-orange-600 dark:text-orange-400">Tek tıkla istasyon filtresi</span>
            </div>
          </section>
        )}

        {/* SECTION 4: QR DİJİTAL MENÜ */}
        {(activeTab === 'all' || activeTab === 'qr') && (
          <section className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
                <QrCode size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100">
                  4. QR Dijital Menü: "Müşteri Masadan Nasıl Sipariş Verir?"
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">Garson beklemeden sipariş ve garson çağırma sistemi</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2">
                <h4 className="font-black text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Smartphone size={16} className="text-purple-600" />
                  Müşteri Ne Yaşar?
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  1. Masadaki QR kodu telefon kamerasıyla okutur.<br />
                  2. Şık fotoğraflı menü açılır (Örn: <code>madireis.github.io/Adisyon/#/qr/t-1</code>).<br />
                  3. İstediği yemekleri ve tatlıları sepete atar.<br />
                  4. <strong>"Siparişi Onayla"</strong> butonuna basar.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2">
                <h4 className="font-black text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  Sistemde Ne Olur?
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  1. Masa otomatik olarak <strong>Dolu (Turuncu)</strong> duruma geçer.<br />
                  2. Mutfaktaki aşçı tabletinde zil çalar ve <strong>"Masa 1 (QR Sipariş)"</strong> fişi çıkar.<br />
                  3. Garsonun telefonundaki masalar ekranında da adisyon anında gözükür.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
              <h4 className="font-black text-xs uppercase tracking-wider text-purple-900 dark:text-purple-300 mb-2">
                Müşteri Hızlı Çağrı Butonları (Garson Çağır / Hesap İste / Su İste)
              </h4>
              <p className="text-xs text-purple-800 dark:text-purple-300 leading-relaxed">
                Müşteri menünün en üstündeki <strong>"Garson Çağır"</strong> veya <strong>"Hesap İste"</strong> butonuna bastığında, personelin ekranına ve denetim günlüğüne sesli bildirimle <em>"Masa 3 garson çağırdı"</em> uyarısı düşer.
              </p>
            </div>
          </section>
        )}

        {/* SECTION 5: KASA & HESAP ALMA İŞ AKIŞI */}
        {(activeTab === 'all' || activeTab === 'cashier') && (
          <section className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                <CreditCard size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100">
                  5. Kasa & Hesap Alma: "Ödeme Nasıl Alınır ve Masa Nasıl Kapanır?"
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">Nakit, Kredi Kartı ve Parçalı Ödeme İşlemleri</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <h4 className="font-black text-sm text-stone-900 dark:text-stone-100 mb-1">
                  Adım 1: Masaya Tıklayın ve "Hesabı Al" Butonuna Basın
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Müşteri kalkmak istediğinde masasını seçin. Sağ alttaki yeşil <strong>"Hesabı Al"</strong> butonuna basın. Karşınıza ödeme ekranı gelir.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <h4 className="font-black text-sm text-stone-900 dark:text-stone-100 mb-1">
                  Adım 2: Ödeme Türünü Seçin
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2">
                  <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-xs">
                    <span className="font-black text-stone-900 dark:text-stone-100 block mb-1">💵 Tamamı Nakit</span>
                    Müşteri nakit verdiğinde "Nakit"e basın. Para üstünü sistem otomatik hesaplar.
                  </div>
                  <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-xs">
                    <span className="font-black text-stone-900 dark:text-stone-100 block mb-1">💳 Tamamı Kredi Kartı</span>
                    POS cihazından çekim yaptıktan sonra "Kredi Kartı" butonuna basarak adisyonu kapatın.
                  </div>
                  <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-xs">
                    <span className="font-black text-stone-900 dark:text-stone-100 block mb-1">⚖️ Parçalı Ödeme</span>
                    Masa 500 TL tuttu; 200 TL'sini nakit, 300 TL'sini kart çektiler. Rakamları yazıp ikisini ayrı ayrı kaydedebilirsiniz.
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <h4 className="font-black text-sm text-stone-900 dark:text-stone-100 mb-1">
                  Adım 3: İndirim, İkram ve Fiş Yazdırma
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Ödeme ekranında <strong>"İndirim Uygula"</strong> butonuyla %10 indirim veya ikram düşebilirsiniz. <strong>"Fiş Yazdır"</strong> butonuyla termal adisyon fişi alabilirsiniz.
                </p>
                <div className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Ödeme tamamlandığı anda masa kendiliğinden YEŞİL (Boş) olur ve ciroya işlenir.
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 6: GÜN SONU, KASA & RAPORLAR */}
        {(activeTab === 'all' || activeTab === 'reports') && (
          <section className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                <Banknote size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100">
                  6. Kasa, Ciro & Gün Sonu Z Raporu
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">Patronun cebine giren ve çıkan her kuruşun net dökümü</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2">
                <h4 className="font-black text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-600" />
                  Kasa & Gün Sonu Ekranında Ne Görürsünüz?
                </h4>
                <ul className="text-xs text-stone-600 dark:text-stone-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li><strong>Bugünkü Net Ciro:</strong> Masalardan toplanan toplam para.</li>
                  <li><strong>Nakit Kasası:</strong> Çekmecede şu an fiziki olarak bulunması gereken nakit para.</li>
                  <li><strong>POS Kredi Kartı:</strong> Gün boyu banka POS cihazından çekilen tutar.</li>
                  <li><strong>En Çok Satanlar:</strong> Bugün kaç bardak çay, kaç hamburger satıldı?</li>
                  <li><strong>Personel Satışları:</strong> Hangi garson kaç liralık ciro yaptı?</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2">
                <h4 className="font-black text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Receipt size={16} className="text-red-500" />
                  Kasadan Masraf / Gider Çıkışı Nasıl Yapılır?
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Gün içinde manav geldi 400 TL verdiniz, veya garsona 200 TL avans verdiniz:<br />
                  1. <strong>"Kasa & Gün Sonu Ciro"</strong> ekranına gidin.<br />
                  2. <strong>"Kasa Giriş / Çıkış (Gider)"</strong> butonuna basın.<br />
                  3. Tutarı ve açıklamasını yazıp onaylayın.<br />
                  Sistem çekmecedeki nakit paradan bunu otomatik düşer, kasanız asla açık vermez!
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-black text-xs uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                  Akşam Kapanış: "Gün Sonu Z Raporu Fişi"
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                  Günü kapatırken tek tıkla termal yazıcıdan Gün Sonu Z Raporu dökümü alabilir veya arşivleyebilirsiniz.
                </p>
              </div>
              <button
                onClick={() => navigate('/reports')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shrink-0 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                Ciro Raporunu Aç
              </button>
            </div>
          </section>
        )}

        {/* SECTION 7: MENÜ YÖNETİMİ & TÜKENDİ YAPMA */}
        {(activeTab === 'all' || activeTab === 'menu') && (
          <section className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center font-black">
                <ShoppingBag size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100">
                  7. Menü, Fiyat Değiştirme & 'Tükendi' Özelliği
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">Zamlarda fiyat güncelleme ve biten ürünleri kapatma</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2">
                <h4 className="font-black text-sm text-stone-900 dark:text-stone-100">
                  Ürün Fiyatı Nasıl Güncellenir?
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  1. Sol menüden <strong>"Menü & Fiyatlar"</strong> sayfasına gidin.<br />
                  2. Fiyatını değiştirmek istediğiniz ürünün üstündeki <strong>Düzenle</strong> (kalem) ikonuna basın.<br />
                  3. Yeni fiyatı yazın (Örn: 40 yerine 45 TL) ve "Kaydet"e basın.<br />
                  4. Anında tüm garsonların telefonunda ve müşterilerin QR menüsünde fiyat güncellenir!
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2">
                <h4 className="font-black text-sm text-stone-900 dark:text-stone-100">
                  Mutfakta Malzeme Bittiğinde: "Tükendi" Butonu
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Örneğin akşam tatlısı veya köfte bitti:<br />
                  Ürünün yanındaki <strong>"Mevcut / Tükendi"</strong> anahtarına tek bir tıkla basın.<br />
                  Ürün kırmızı "Tükendi" olur; garsonlar sipariş veremez, QR menüde siparişe kapanır. Müşteriye "Yemek kalmadı" mahcubiyeti yaşamazsınız.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 8: PERSONEL VE GARSON TELEFONLARINI BAĞLAMA */}
        {(activeTab === 'all' || activeTab === 'staff') && (
          <section className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center font-black">
                <Smartphone size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100">
                  8. Garson Telefonlarını Bağlama: "Personel Nasıl Giriş Yapar?"
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">Garsonun kendi cep telefonunu terminale dönüştürme</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 space-y-3">
              <h4 className="font-black text-sm text-sky-950 dark:text-sky-200">
                Uygulama İndirtmeye Gerek Yok! 3 Adımda Garsonu Başlatın:
              </h4>
              <ol className="text-xs text-sky-900 dark:text-sky-300 space-y-2 list-decimal pl-4 leading-relaxed">
                <li>
                  Garsona cep telefonunun internet tarayıcısından (Chrome veya Safari) sitenizin linkini açtırın:<br />
                  <code className="bg-white dark:bg-stone-900 px-2 py-0.5 rounded text-[11px] font-mono text-orange-600 dark:text-orange-400 font-bold">
                    https://madireis.github.io/Adisyon/
                  </code>
                </li>
                <li>
                  Giriş ekranında <strong>"Garson Girişi"</strong> seçeneğine tıklar, kendi adını seçer ve PIN kodunu girer (Varsayılan PIN: 1234).
                </li>
                <li>
                  Artık garsonun telefonu bir el terminalidir! Masaları görür, sipariş alır, mutfağa gönderir. Patron panelini veya ciro ekranını göremez, yetkisi kısıtlıdır.
                </li>
              </ol>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
              <span className="text-stone-600 dark:text-stone-300">
                Yeni garson eklemek veya PIN kodunu değiştirmek için <strong>"Garsonlar & Personel"</strong> sayfasına gidebilirsiniz.
              </span>
              <button
                onClick={() => navigate('/staff')}
                className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-white rounded-xl font-bold cursor-pointer transition-all active:scale-95 shrink-0 ml-3"
              >
                Personel Yönetimi
              </button>
            </div>
          </section>
        )}

        {/* SECTION 9: SIK SORULAN SORULAR & ALTIN KURALLAR */}
        {(activeTab === 'all' || activeTab === 'faq') && (
          <section className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                <HelpCircle size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100">
                  9. Sık Sorulan Sorular & Patron İpuçları
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">Kafanızda hiçbir soru işareti kalmasın</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* FAQ 1 */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleFaq('faq-1')}
                  className="w-full p-4 text-left font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center justify-between bg-stone-50/50 dark:bg-stone-950/50 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <span>1. Kafede internet kesilirse siparişler kaybolur mu?</span>
                  {expandedFaq === 'faq-1' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedFaq === 'faq-1' && (
                  <div className="p-4 pt-2 text-xs text-stone-600 dark:text-stone-300 leading-relaxed border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
                    <strong>Kesinlikle hayır!</strong> Sistem IndexedDB adı verilen yerel tarayıcı veritabanını kullanır. İnternet dursa dahi sipariş cihazda güvenle saklanır. İnternet geldiğinde anında diğer cihazlarla otomatik eşitlenir.
                  </div>
                )}
              </div>

              {/* FAQ 2 */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleFaq('faq-2')}
                  className="w-full p-4 text-left font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center justify-between bg-stone-50/50 dark:bg-stone-950/50 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <span>2. Garsonun telefonunun şarjı biterse masanın siparişi silinir mi?</span>
                  {expandedFaq === 'faq-2' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedFaq === 'faq-2' && (
                  <div className="p-4 pt-2 text-xs text-stone-600 dark:text-stone-300 leading-relaxed border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
                    <strong>Hayır!</strong> Sipariş bulut üzerinden senkronize olduğu için başka herhangi bir telefondan, kasadaki bilgisayardan veya mutfak tabletinden o masaya tıklandığında sipariş kalemleri eksiksiz karşınıza gelir.
                  </div>
                )}
              </div>

              {/* FAQ 3 */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleFaq('faq-3')}
                  className="w-full p-4 text-left font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center justify-between bg-stone-50/50 dark:bg-stone-950/50 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <span>3. Müşteri masasını değiştirmek isterse (Masa Taşıma) ne yapılır?</span>
                  {expandedFaq === 'faq-3' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedFaq === 'faq-3' && (
                  <div className="p-4 pt-2 text-xs text-stone-600 dark:text-stone-300 leading-relaxed border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
                    Mevcut masayı açın. Üst bardaki "Masayı Aktar / Taşı" butonu ile yeni masayı seçtiğinizde tüm adisyon ve mutfak durumu yeni masaya aktarılır, eski masa boşa çıkar.
                  </div>
                )}
              </div>

              {/* FAQ 4 */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleFaq('faq-4')}
                  className="w-full p-4 text-left font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center justify-between bg-stone-50/50 dark:bg-stone-950/50 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <span>4. Termal Fiş Yazıcısı nasıl bağlanır?</span>
                  {expandedFaq === 'faq-4' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedFaq === 'faq-4' && (
                  <div className="p-4 pt-2 text-xs text-stone-600 dark:text-stone-300 leading-relaxed border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
                    Sistem standart 80mm ve 58mm termal yazıcılarla doğrudan uyumludur. Bilgisayarınıza veya tabletinize USB / Bluetooth / Wi-Fi ile bağlı herhangi bir yazıcıya sistemden "Fiş Yazdır" dediğinizde otomatik profesyonel restoran fişi formatında çıktı verir.
                  </div>
                )}
              </div>

              {/* FAQ 5 */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleFaq('faq-5')}
                  className="w-full p-4 text-left font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center justify-between bg-stone-50/50 dark:bg-stone-950/50 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <span>5. Garson hesabı kendi cebine atabilir mi? (Güvenlik & Denetim)</span>
                  {expandedFaq === 'faq-5' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedFaq === 'faq-5' && (
                  <div className="p-4 pt-2 text-xs text-stone-600 dark:text-stone-300 leading-relaxed border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
                    <strong>Hayır.</strong> Garson rolündeki personeller adisyon iptal edemez, indirim yapamaz ve kasayı kapatamaz. Ayrıca yapılan her işlem (kim saat kaçta hangi ürünü ekledi, ne zaman mutfağa gönderildi) sistemin <strong>Denetim Günlüğü</strong> (Audit Log) sayfasına saniyesi saniyesine kaydedilir.
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Footer Pro Tip */}
        <div className="p-5 rounded-2xl bg-stone-900 text-stone-100 border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black shrink-0">
              W
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Wot's Cafe Adisyon & POS Sistemi</h4>
              <p className="text-xs text-stone-400">Her gün güncellenen akıllı ve kesintisiz restoran yönetim altyapısı.</p>
            </div>
          </div>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-stone-700 cursor-pointer active:scale-95 shrink-0"
          >
            Sayfa Başına Dön ↑
          </button>
        </div>
      </div>
    </div>
  );
}
