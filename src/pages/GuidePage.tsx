import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  ChefHat, 
  Grid2X2, 
  QrCode, 
  CreditCard, 
  Banknote, 
  Users, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone, 
  Flame, 
  ShieldCheck, 
  TrendingUp, 
  Receipt, 
  HelpCircle,
  Lightbulb,
  Check,
  ChevronDown,
  ChevronUp,
  Laptop,
  Wifi,
  ShoppingBag,
  BellRing,
  Copy,
  X,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import wotsLogo from '@/assets/logo.jpg';

export default function GuidePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>('faq-1');
  const [copiedUrl, setCopiedUrl] = useState(false);

  const toggleFaq = (id: string) => {
    setExpandedFaq(prev => prev === id ? null : id);
  };

  const handleCopyLink = () => {
    const fullUrl = window.location.origin + window.location.pathname;
    try {
      navigator.clipboard.writeText(fullUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // Fallback
    }
  };

  const tabs = [
    { id: 'all', label: 'Tümü', icon: BookOpen },
    { id: 'overview', label: '1. Sistem Mantığı', icon: Lightbulb },
    { id: 'waiter', label: '2. Garson & Sipariş', icon: Grid2X2 },
    { id: 'kitchen', label: '3. Mutfak (KDS)', icon: ChefHat },
    { id: 'qr', label: '4. QR Dijital Menü', icon: QrCode },
    { id: 'cashier', label: '5. Kasa & Ödeme', icon: CreditCard },
    { id: 'reports', label: '6. Ciro & Masraflar', icon: Banknote },
    { id: 'menu', label: '7. Menü & Tükendi', icon: ShoppingBag },
    { id: 'staff', label: '8. Telefonları Bağlama', icon: Smartphone },
    { id: 'faq', label: '9. Sık Sorulanlar', icon: HelpCircle },
  ];

  const cleanQuery = searchQuery.trim().toLowerCase();

  // Search keyword matchers for each section
  const sectionMatches = useMemo(() => {
    if (!cleanQuery) return {
      overview: true,
      waiter: true,
      kitchen: true,
      qr: true,
      cashier: true,
      reports: true,
      menu: true,
      staff: true,
      faq: true
    };

    const testMatch = (words: string[]) => words.some(w => w.toLowerCase().includes(cleanQuery));

    return {
      overview: testMatch(['sistem', 'mantık', 'nasıl', 'kurulum', 'wifi', 'internet', 'renk', 'yeşil', 'turuncu', 'kırmızı', 'mor', 'çevrimdışı']),
      waiter: testMatch(['garson', 'sipariş', 'masa', 'sepet', 'ekle', 'mutfağa gönder', 'not', 'ilave', 'adisyon']),
      kitchen: testMatch(['mutfak', 'kds', 'aşçı', 'barmen', 'bar', 'yeni', 'hazırlanıyor', 'hazır', 'servis edildi', 'istasyon', 'zil']),
      qr: testMatch(['qr', 'menü', 'müşteri', 'dijital', 'garson çağır', 'hesap iste', 'onayla', 'çağrı']),
      cashier: testMatch(['kasa', 'ödeme', 'hesap', 'nakit', 'kredi kartı', 'parçalı', 'indirim', 'ikram', 'fiş', 'termal', 'pos']),
      reports: testMatch(['ciro', 'gün sonu', 'z raporu', 'rapor', 'gider', 'masraf', 'kasa çıkış', 'avans', 'net ciro', 'satış']),
      menu: testMatch(['menü', 'fiyat', 'zam', 'fiyat güncelle', 'tükendi', 'mevcut', 'kategori', 'kalem']),
      staff: testMatch(['personel', 'garson', 'telefon', 'bağlama', 'pin', 'şifre', 'giriş', 'terminal', 'link']),
      faq: testMatch(['soru', 'sss', 'faq', 'internet kesilirse', 'şarj', 'taşı', 'aktar', 'yazıcı', 'güvenlik', 'denetim', 'çalınma'])
    };
  }, [cleanQuery]);

  const totalMatches = Object.values(sectionMatches).filter(Boolean).length;

  const faqs = [
    {
      id: 'faq-1',
      q: '1. Kafede internet kesilirse siparişler kaybolur mu?',
      a: 'Kesinlikle hayır! Sistem IndexedDB adı verilen yerel tarayıcı veritabanını kullanır. İnternet dursa dahi aldığınız sipariş cihazda güvenle saklanır. İnternet geldiğinde anında diğer cihazlarla otomatik eşitlenir.',
      keywords: 'internet kesinti çevrimdışı kaybolma veri saklama'
    },
    {
      id: 'faq-2',
      q: '2. Garsonun telefonunun şarjı biterse masanın siparişi silinir mi?',
      a: 'Hayır! Sipariş anlık senkronize olduğu için başka herhangi bir telefondan, kasadaki bilgisayardan veya mutfak tabletinden o masaya tıklandığında sipariş kalemleri eksiksiz karşınıza gelir.',
      keywords: 'şarj pil telefon kapanma silinme'
    },
    {
      id: 'faq-3',
      q: '3. Müşteri masasını değiştirmek isterse (Masa Taşıma) ne yapılır?',
      a: 'Mevcut masayı açın. Üst bardaki "Masayı Aktar / Taşı" butonu ile yeni masayı seçtiğinizde tüm adisyon ve mutfak durumu yeni masaya aktarılır, eski masa boşa çıkar.',
      keywords: 'masa taşıma aktarma değiştirme yer'
    },
    {
      id: 'faq-4',
      q: '4. Termal Fiş Yazıcısı nasıl bağlanır?',
      a: 'Sistem standart 80mm ve 58mm termal yazıcılarla doğrudan uyumludur. Bilgisayarınıza veya tabletinize USB / Bluetooth / Wi-Fi ile bağlı herhangi bir yazıcıya sistemden "Fiş Yazdır" dediğinizde otomatik profesyonel restoran fişi formatında çıktı verir.',
      keywords: 'termal fiş yazıcı bluetooth usb yazdırma çıktı'
    },
    {
      id: 'faq-5',
      q: '5. Garson hesabı kendi cebine atabilir mi? (Güvenlik & Denetim)',
      a: 'Hayır. Garson rolündeki personeller adisyon iptal edemez, indirim yapamaz ve kasayı kapatamaz. Ayrıca yapılan her işlem (kim saat kaçta hangi ürünü ekledi, ne zaman mutfağa gönderildi) sistemin Denetim Günlüğü sayfasına saniyesi saniyesine kaydedilir.',
      keywords: 'güvenlik denetim hırsızlık iptal yetki silme log'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    if (!cleanQuery) return true;
    return faq.q.toLowerCase().includes(cleanQuery) || 
           faq.a.toLowerCase().includes(cleanQuery) || 
           faq.keywords.toLowerCase().includes(cleanQuery);
  });

  return (
    <div className="w-full min-h-full flex flex-col bg-stone-100 dark:bg-stone-950 pb-8 sm:pb-12">
      {/* Top Hero Banner */}
      <div className="bg-stone-900 text-stone-100 p-4 sm:p-6 lg:p-8 border-b border-stone-800 shrink-0">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-black p-1 shadow-lg border border-orange-500/30 shrink-0 flex items-center justify-center">
                <img src={wotsLogo} alt="WOT'S CAFE" className="w-full h-full object-contain rounded-xl" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                  Kullanım Rehberi
                </h1>
              </div>
            </div>

            {/* Fast Jump Shortcuts (Responsive 3-grid on mobile, flex on desktop) */}
            <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2 shrink-0">
              <button
                onClick={() => navigate('/tables')}
                className="px-2.5 sm:px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[11px] sm:text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95 text-center"
              >
                <Grid2X2 size={14} className="shrink-0" />
                <span className="truncate">Masalar</span>
              </button>
              <button
                onClick={() => navigate('/kitchen')}
                className="px-2.5 sm:px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-[11px] sm:text-xs font-bold transition-all border border-stone-700 flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95 text-center"
              >
                <ChefHat size={14} className="shrink-0" />
                <span className="truncate">Mutfak</span>
              </button>
              <button
                onClick={() => navigate('/reports')}
                className="px-2.5 sm:px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-[11px] sm:text-xs font-bold transition-all border border-stone-700 flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95 text-center"
              >
                <Banknote size={14} className="shrink-0" />
                <span className="truncate">Kasa & Ciro</span>
              </button>
            </div>
          </div>

          {/* Quick Real-Time Search Bar */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Rehberde ara (örn: fiş, fiyat, garson, kasa)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-stone-800/90 border border-stone-700 rounded-xl text-xs text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-white rounded-md transition-colors"
                title="Aramayı Temizle"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search Result Info Chip */}
          {cleanQuery && (
            <div className="flex items-center justify-between text-xs text-stone-300 bg-stone-800/60 px-3 py-1.5 rounded-lg border border-stone-700/60 animate-in fade-in">
              <span>
                "<strong>{cleanQuery}</strong>" ile ilgili <strong>{totalMatches}</strong> bölüm listeleniyor.
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-orange-400 hover:underline font-bold text-[11px] ml-2"
              >
                Tümünü Göster
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category Pills Navigation (Horizontal Touch Scroll with Momentum) */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-3 sm:px-6 py-2 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="max-w-6xl mx-auto flex items-center gap-1.5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (cleanQuery) setSearchQuery('');
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer active:scale-95 shrink-0",
                  isActive
                    ? "bg-orange-600 text-white shadow-xs font-black"
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
      <div className="max-w-6xl mx-auto w-full px-3 py-4 sm:px-6 sm:py-8 space-y-5 sm:space-y-8">
        
        {/* Empty Search State */}
        {cleanQuery && totalMatches === 0 && (
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 border border-stone-200 dark:border-stone-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 mx-auto flex items-center justify-center">
              <Search size={22} />
            </div>
            <h3 className="font-black text-base text-stone-900 dark:text-stone-100">
              "{cleanQuery}" ile ilgili konu bulunamadı
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Farklı bir arama terimi deneyebilir veya kategorilerden ilgili başlığı inceleyebilirsiniz.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Aramayı Temizle & Tüm Kılavuzu Göster
            </button>
          </div>
        )}

        {/* SECTION 1: GENEL SİSTEM MANTIĞI */}
        {(activeTab === 'all' || activeTab === 'overview') && sectionMatches.overview && (
          <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4 sm:space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black shrink-0">
                <Lightbulb size={22} />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black text-stone-900 dark:text-stone-100">
                  1. Sistemin Mantığı: "Bu Sistem Nasıl Çalışıyor?"
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">Teknik bilmenize gerek yok, 3 cümlede özet</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-black text-xs sm:text-sm mb-1.5">
                  <Laptop size={16} className="shrink-0" />
                  <span>Kasa / Kurulum Gerekmez</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Pahalı bilgisayarlar veya sunucu kutuları almanıza gerek yok. Telefon, tablet veya normal bilgisayarın internet tarayıcısından (Chrome/Safari) açtığınız anda çalışır.
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs sm:text-sm mb-1.5">
                  <Wifi size={16} className="shrink-0" />
                  <span>Canlı Senkronizasyon</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Garson telefondan siparişi girdiği anda mutfaktaki tablet çalar ve fiş düşer. Kasiyerin ekranında masa turuncu (dolu) olur. Her cihaz saniyenin onda birinde konuşur.
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-xs sm:text-sm mb-1.5">
                  <ShieldCheck size={16} className="shrink-0" />
                  <span>İnternet Gitse Bile Güvende</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Kafede internet 5 dakika kesilse dahi aldığınız siparişler cihazınızın hafızasında korunur. İnternet geri geldiği anda diğer ekranlarla otomatik eşitlenir.
                </p>
              </div>
            </div>

            {/* Renk Kodları Tablosu (Responsive 1-col on mobile, 2 on small tablets, 4 on desktop) */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-900 text-white border border-stone-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-orange-400 mb-3">
                Masa Renklerinin Anlamı (Masalar Ekranı)
              </h3>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
                <div className="flex items-center gap-2.5 bg-stone-800/80 p-2.5 rounded-xl border border-emerald-500/40">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50 shrink-0"></span>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-emerald-300 block truncate">YEŞİL: Boş Masa</span>
                    <span className="text-[10px] text-stone-400 block truncate">Yeni müşteri oturabilir.</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 bg-stone-800/80 p-2.5 rounded-xl border border-orange-500/40">
                  <span className="w-3.5 h-3.5 rounded-full bg-orange-500 shadow-xs shadow-orange-500/50 shrink-0"></span>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-orange-300 block truncate">TURUNCU: Dolu Masa</span>
                    <span className="text-[10px] text-stone-400 block truncate">İçeride aktif sipariş var.</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 bg-stone-800/80 p-2.5 rounded-xl border border-red-500/40">
                  <span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-xs shadow-red-500/50 animate-pulse shrink-0"></span>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-red-300 block truncate">KIRMIZI: Hesap Bekliyor</span>
                    <span className="text-[10px] text-stone-400 block truncate">Müşteri hesabı istedi.</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 bg-stone-800/80 p-2.5 rounded-xl border border-purple-500/40">
                  <span className="w-3.5 h-3.5 rounded-full bg-purple-500 shadow-xs shadow-purple-500/50 shrink-0"></span>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-purple-300 block truncate">MOR: Rezerve Masa</span>
                    <span className="text-[10px] text-stone-400 block truncate">İleri saate ayrılmış masa.</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: GARSON & SİPARİŞ İŞ AKIŞI */}
        {(activeTab === 'all' || activeTab === 'waiter') && sectionMatches.waiter && (
          <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4 sm:space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black shrink-0">
                <Grid2X2 size={22} />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black text-stone-900 dark:text-stone-100">
                  2. Garson İş Akışı: "Sipariş Nasıl Alınır ve Mutfağa Gider?"
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">Garsonun telefonda yapacağı 3 basit adım</p>
              </div>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 items-start">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-600 text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100">Masayı Seç</h4>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5 leading-relaxed">
                    Garson ana ekrandaki masalardan müşterinin oturduğu masaya (Örneğin <strong>Masa 4</strong>) tıklar. Karşısına kategoriler ve ürünler gelir.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 items-start">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-600 text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100">Ürünleri Sepete Ekle</h4>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5 leading-relaxed">
                    İstenen ürünlerin üstüne basar (Örn: 2x Çay, 1x Cheeseburger). Altta turuncu renkli <strong>"Adisyon Çubuğu"</strong> otomatik yükselir ve toplam tutarı gösterir.
                  </p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-1">
                    💡 İpucu: Ürün üzerine tekrar basarak adet arttırıp azaltabilir, "Az pişmiş", "Buzsuz" gibi özel mutfak notu yazabilir.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 items-start">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-600 text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-black text-xs sm:text-sm text-orange-900 dark:text-orange-200">"MUTFAĞA GÖNDER"e Bas!</h4>
                  <p className="text-xs text-orange-800 dark:text-orange-300 mt-0.5 leading-relaxed">
                    Büyük turuncu <strong>"MUTFAĞA GÖNDER"</strong> butonuna basar. Bu kadar! Masa anında turuncu (Dolu) olur ve mutfaktaki tablete sesli bildirim gider.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="block">Masaya sonradan ilave sipariş gelirse ne olur?</strong>
                Garson masayı tekrar açıp yeni ürünü seçer ve yine "MUTFAĞA GÖNDER" der. Sistem sadece <strong>yeni eklenen</strong> ürünleri mutfağa ikinci bir fiş olarak gönderir; önceki yemekleri mükerrer basmaz!
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: MUTFAK (KDS) İŞ AKIŞI */}
        {(activeTab === 'all' || activeTab === 'kitchen') && sectionMatches.kitchen && (
          <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4 sm:space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black shrink-0">
                <ChefHat size={22} />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black text-stone-900 dark:text-stone-100">
                  3. Mutfak Ekranı (KDS): "Aşçı ve Barmen Ne Yapar?"
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">Kağıt fiş israfına son veren akıllı mutfak paneli</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Mutfaktaki veya bardaki tablete <strong>Mutfak Ekranı</strong> açılır. Garson siparişi gönderdiği anda ekranda 4 aşamalı bir kart düzeni çalışır:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-300 block mb-1">1. Aşama</span>
                  <h4 className="font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <BellRing size={15} className="text-blue-600 shrink-0" />
                    <span>YENİ (Mavi)</span>
                  </h4>
                  <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                    Mutfakta zil çalar. Fiş burada belirir. Aşçı hangi masanın ne istediğini görür.
                  </p>
                </div>
                <div className="mt-3 text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-900/60 p-1.5 rounded-lg text-center">
                  Aşçı "BAŞLA" butonuna basar
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-orange-700 dark:text-orange-300 block mb-1">2. Aşama</span>
                  <h4 className="font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <Flame size={15} className="text-orange-600 shrink-0" />
                    <span>HAZIRLANIYOR</span>
                  </h4>
                  <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                    Yemek ocakta pişiyor demektir. Garsonun telefonunda "Mutfakta hazırlanıyor" süresi sayar.
                  </p>
                </div>
                <div className="mt-3 text-[10px] font-bold text-orange-700 dark:text-orange-300 bg-orange-100/70 dark:bg-orange-900/60 p-1.5 rounded-lg text-center">
                  Yemek pişince "HAZIR"a basar
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 block mb-1">3. Aşama</span>
                  <h4 className="font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>HAZIR (Yeşil)</span>
                  </h4>
                  <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                    Garsonun telefonuna bildirim melodisi çalar ve masası yanıp söner. Garson yemeği tezgâhtan alır.
                  </p>
                </div>
                <div className="mt-3 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/60 p-1.5 rounded-lg text-center">
                  "SERVİS EDİLDİ"ye basılır
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-stone-500 dark:text-stone-400 block mb-1">4. Aşama</span>
                  <h4 className="font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <Check size={15} className="text-stone-500 shrink-0" />
                    <span>SERVİS EDİLDİ</span>
                  </h4>
                  <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                    Fiş arşivlenir, mutfak ekranı temizlenir. Günlük mutfak hız raporuna (Kaç dakikada çıktı) işlenir.
                  </p>
                </div>
                <div className="mt-3 text-[10px] font-bold text-stone-600 dark:text-stone-400 bg-stone-200 dark:bg-stone-700 p-1.5 rounded-lg text-center">
                  Süreç Tamamlandı
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span>İstasyon Filtreleri: Mutfak sadece sıcak yemekleri, Bar sadece içecekleri görebilir.</span>
              <span className="font-bold text-orange-600 dark:text-orange-400">Tek tıkla istasyon filtresi</span>
            </div>
          </section>
        )}

        {/* SECTION 4: QR DİJİTAL MENÜ */}
        {(activeTab === 'all' || activeTab === 'qr') && sectionMatches.qr && (
          <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4 sm:space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black shrink-0">
                <QrCode size={22} />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black text-stone-900 dark:text-stone-100">
                  4. QR Dijital Menü: "Müşteri Masadan Nasıl Sipariş Verir?"
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">Garson beklemeden sipariş ve garson çağırma sistemi</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2">
                <h4 className="font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Smartphone size={16} className="text-purple-600 shrink-0" />
                  <span>Müşteri Ne Yaşar?</span>
                </h4>
                <div className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed space-y-1">
                  <p>1. Masadaki QR kodu telefon kamerasıyla okutur.</p>
                  <p className="break-all">2. Şık fotoğraflı menü açılır: <code className="bg-stone-200 dark:bg-stone-800 px-1 py-0.5 rounded text-[11px] font-mono font-bold">#/qr/t-1</code></p>
                  <p>3. İstediği yemekleri ve tatlıları sepete atar.</p>
                  <p>4. <strong>"Siparişi Onayla"</strong> butonuna basar.</p>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2">
                <h4 className="font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Sistemde Ne Olur?</span>
                </h4>
                <div className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed space-y-1">
                  <p>1. Masa otomatik olarak <strong>Dolu (Turuncu)</strong> duruma geçer.</p>
                  <p>2. Mutfaktaki aşçı tabletinde zil çalar ve <strong>"Masa 1 (QR Sipariş)"</strong> fişi çıkar.</p>
                  <p>3. Garsonun telefonundaki masalar ekranında da adisyon anında gözükür.</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
              <h4 className="font-black text-xs uppercase tracking-wider text-purple-900 dark:text-purple-300 mb-1.5">
                Müşteri Hızlı Çağrı Butonları (Garson Çağır / Hesap İste / Su İste)
              </h4>
              <p className="text-xs text-purple-800 dark:text-purple-300 leading-relaxed">
                Müşteri menünün en üstündeki <strong>"Garson Çağır"</strong> veya <strong>"Hesap İste"</strong> butonuna bastığında, personelin ekranına sesli bildirimle <em>"Masa 3 garson çağırdı"</em> uyarısı düşer.
              </p>
            </div>
          </section>
        )}

        {/* SECTION 5: KASA & HESAP ALMA İŞ AKIŞI */}
        {(activeTab === 'all' || activeTab === 'cashier') && sectionMatches.cashier && (
          <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4 sm:space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black shrink-0">
                <CreditCard size={22} />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black text-stone-900 dark:text-stone-100">
                  5. Kasa & Hesap Alma: "Ödeme Nasıl Alınır ve Masa Nasıl Kapanır?"
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">Nakit, Kredi Kartı ve Parçalı Ödeme İşlemleri</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <h4 className="font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100 mb-1">
                  Adım 1: Masaya Tıklayın ve "Hesabı Al" Butonuna Basın
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Müşteri kalkmak istediğinde masasını seçin. Sağ alttaki yeşil <strong>"Hesabı Al"</strong> butonuna basın. Karşınıza ödeme ekranı gelir.
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <h4 className="font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100 mb-2">
                  Adım 2: Ödeme Türünü Seçin
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                  <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-xs">
                    <span className="font-black text-stone-900 dark:text-stone-100 block mb-1">💵 Tamamı Nakit</span>
                    <p className="text-stone-600 dark:text-stone-400 leading-relaxed">Müşteri nakit verdiğinde "Nakit"e basın. Para üstünü sistem otomatik hesaplar.</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-xs">
                    <span className="font-black text-stone-900 dark:text-stone-100 block mb-1">💳 Kredi Kartı</span>
                    <p className="text-stone-600 dark:text-stone-400 leading-relaxed">POS cihazından çekim yaptıktan sonra "Kredi Kartı" butonuna basarak adisyonu kapatın.</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-xs">
                    <span className="font-black text-stone-900 dark:text-stone-100 block mb-1">⚖️ Parçalı Ödeme</span>
                    <p className="text-stone-600 dark:text-stone-400 leading-relaxed">Bir kısmı nakit, kalanı kart ödenebilir. Rakamları yazıp ayrı ayrı kaydedebilirsiniz.</p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <h4 className="font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100 mb-1">
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
        {(activeTab === 'all' || activeTab === 'reports') && sectionMatches.reports && (
          <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4 sm:space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black shrink-0">
                <Banknote size={22} />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black text-stone-900 dark:text-stone-100">
                  6. Kasa, Ciro & Gün Sonu Z Raporu
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">Patronun cebine giren ve çıkan her kuruşun net dökümü</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2">
                <h4 className="font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-600 shrink-0" />
                  <span>Kasa & Gün Sonu Ekranında Ne Görürsünüz?</span>
                </h4>
                <ul className="text-xs text-stone-600 dark:text-stone-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li><strong>Bugünkü Net Ciro:</strong> Masalardan toplanan toplam para.</li>
                  <li><strong>Nakit Kasası:</strong> Çekmecede şu an fiziki bulunması gereken nakit.</li>
                  <li><strong>POS Kredi Kartı:</strong> Gün boyu banka POS cihazından çekilen tutar.</li>
                  <li><strong>En Çok Satanlar:</strong> Bugün kaç bardak çay, kaç hamburger satıldı?</li>
                  <li><strong>Personel Satışları:</strong> Hangi garson kaç liralık ciro yaptı?</li>
                </ul>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2">
                <h4 className="font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Receipt size={16} className="text-red-500 shrink-0" />
                  <span>Kasadan Masraf / Gider Çıkışı Nasıl Yapılır?</span>
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

            <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-black text-xs uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                  Akşam Kapanış: "Gün Sonu Z Raporu Fişi"
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5 leading-relaxed">
                  Günü kapatırken tek tıkla termal yazıcıdan Gün Sonu Z Raporu dökümü alabilir veya arşivleyebilirsiniz.
                </p>
              </div>
              <button
                onClick={() => navigate('/reports')}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shrink-0 transition-all shadow-xs active:scale-95 cursor-pointer text-center"
              >
                Ciro Raporunu Aç
              </button>
            </div>
          </section>
        )}

        {/* SECTION 7: MENÜ YÖNETİMİ & TÜKENDİ YAPMA */}
        {(activeTab === 'all' || activeTab === 'menu') && sectionMatches.menu && (
          <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4 sm:space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center font-black shrink-0">
                <ShoppingBag size={22} />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black text-stone-900 dark:text-stone-100">
                  7. Menü, Fiyat Değiştirme & 'Tükendi' Özelliği
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">Zamlarda fiyat güncelleme ve biten ürünleri kapatma</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2">
                <h4 className="font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                  Ürün Fiyatı Nasıl Güncellenir?
                </h4>
                <div className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed space-y-1">
                  <p>1. Sol menüden <strong>"Menü & Fiyatlar"</strong> sayfasına gidin.</p>
                  <p>2. Fiyatını değiştirmek istediğiniz ürünün üstündeki <strong>Düzenle</strong> (kalem) ikonuna basın.</p>
                  <p>3. Yeni fiyatı yazın (Örn: 40 yerine 45 TL) ve "Kaydet"e basın.</p>
                  <p>4. Anında tüm garsonların telefonunda ve müşterilerin QR menüsünde fiyat güncellenir!</p>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2">
                <h4 className="font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100">
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
        {(activeTab === 'all' || activeTab === 'staff') && sectionMatches.staff && (
          <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4 sm:space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center font-black shrink-0">
                <Smartphone size={22} />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black text-stone-900 dark:text-stone-100">
                  8. Garson Telefonlarını Bağlama: "Personel Nasıl Giriş Yapar?"
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">Garsonun kendi cep telefonunu terminale dönüştürme</p>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 space-y-3">
              <h4 className="font-black text-xs sm:text-sm text-sky-950 dark:text-sky-200">
                Uygulama İndirtmeye Gerek Yok! 3 Adımda Garsonu Başlatın:
              </h4>
              <ol className="text-xs text-sky-900 dark:text-sky-300 space-y-2.5 list-decimal pl-4 leading-relaxed">
                <li>
                  Garsona cep telefonunun internet tarayıcısından (Chrome veya Safari) sitenizin linkini açtırın:
                  <div className="mt-1.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <code className="bg-white dark:bg-stone-900 px-2.5 py-1.5 rounded-lg text-xs font-mono text-orange-600 dark:text-orange-400 font-bold border border-sky-200 dark:border-stone-800 break-all select-all">
                      https://madireis.github.io/Adisyon/
                    </code>
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 text-white dark:text-stone-900 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {copiedUrl ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copiedUrl ? 'Kopyalandı' : 'Linki Kopyala'}</span>
                    </button>
                  </div>
                </li>
                <li>
                  Giriş ekranında kendi kullanıcı adı / numarasını ve PIN kodunu girer (Örn: 1007 / 1234).
                </li>
                <li>
                  Artık garsonun telefonu bir el terminalidir! Masaları görür, sipariş alır, mutfağa gönderir. Patron panelini veya ciro ekranını göremez, yetkisi kısıtlıdır.
                </li>
              </ol>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
              <span className="text-stone-600 dark:text-stone-300 leading-relaxed">
                Yeni garson eklemek veya PIN kodunu değiştirmek için <strong>"Garsonlar & Personel"</strong> sayfasına gidebilirsiniz.
              </span>
              <button
                onClick={() => navigate('/staff')}
                className="w-full sm:w-auto px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl font-bold cursor-pointer transition-all active:scale-95 shrink-0 text-center"
              >
                Personel Yönetimi
              </button>
            </div>
          </section>
        )}

        {/* SECTION 9: SIK SORULAN SORULAR & ALTIN KURALLAR */}
        {(activeTab === 'all' || activeTab === 'faq') && sectionMatches.faq && (
          <section className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4 sm:space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black shrink-0">
                <HelpCircle size={22} />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black text-stone-900 dark:text-stone-100">
                  9. Sık Sorulan Sorular & Patron İpuçları
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">Kafanızda hiçbir soru işareti kalmasın</p>
              </div>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              {filteredFaqs.map(faq => {
                const isOpen = expandedFaq === faq.id || (Boolean(cleanQuery) && filteredFaqs.length <= 3);
                return (
                  <div key={faq.id} className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden transition-colors">
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full p-3.5 sm:p-4 text-left font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center justify-between gap-3 bg-stone-50/50 dark:bg-stone-950/50 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                    >
                      <span className="leading-snug">{faq.q}</span>
                      {isOpen ? <ChevronUp size={16} className="shrink-0 text-orange-600" /> : <ChevronDown size={16} className="shrink-0 text-stone-400" />}
                    </button>
                    {isOpen && (
                      <div className="p-3.5 sm:p-4 pt-1 sm:pt-1 text-xs text-stone-600 dark:text-stone-300 leading-relaxed border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 animate-in fade-in">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Footer Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-stone-900 text-stone-100 border border-stone-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-black p-1 shadow-md border border-orange-500/30 flex items-center justify-center shrink-0">
              <img src={wotsLogo} alt="WOT'S CAFE" className="w-full h-full object-contain rounded-lg" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-white truncate">Wot's Cafe Adisyon & POS Sistemi</h4>
              <p className="text-[11px] sm:text-xs text-stone-400 truncate">Her gün güncellenen akıllı ve kesintisiz restoran altyapısı.</p>
            </div>
          </div>
          <button
            onClick={() => {
              const scrollable = document.querySelector('main');
              if (scrollable) {
                scrollable.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-stone-700 cursor-pointer active:scale-95 shrink-0 text-center"
          >
            Sayfa Başına Dön ↑
          </button>
        </div>
      </div>
    </div>
  );
}
