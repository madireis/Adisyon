# WOT'S CAFE POS & Adisyon SaaS — Görev Listesi

## Phase 1: Proje İskeleti & Altyapı
- [x] Vite + React + TypeScript + Tailwind projesini oluştur
- [x] Bağımlılıkları kur (Dexie, Lucide, Recharts, React Router, clsx, tailwind-merge)
- [x] Tailwind konfigürasyonu (Wot's Cafe renk paleti, 8px grid, dokunmatik hedefler)
- [x] PWA manifest & viewport dokunmatik optimizasyonu

## Phase 2: Tip Tanımları & Veri Katmanı
- [x] `src/types/pos.ts` — Tüm veri tipleri
- [x] `src/lib/db.ts` — Dexie.js IndexedDB şeması
- [x] `src/lib/mockData.ts` — Wot's Cafe gerçekçi tohum verileri (26 masa, 31 menü ürünü, 7 personel)
- [x] `supabase/migrations/001_initial_schema.sql` — PostgreSQL / Supabase bulut şeması

## Phase 3: Tasarım Sistemi & Ortak Bileşenler
- [x] `src/lib/utils.ts` — cn(), formatCurrency(), getElapsedMinutes(), generateId()
- [x] `src/components/layout/Layout.tsx` — Kat seçici, online/offline rozeti, rol bazlı navigasyon
- [x] `src/lib/store.tsx` — React Context Auth, Floor ve Notification store

## Phase 4: Masa Yönetimi (Ürünün Kalbi)
- [x] `src/pages/TablesPage.tsx` — Kat sekmeli görsel masa planı
- [x] Masa kartları (Durum rozetleri, süre sayacı, kişi sayısı, garson, canlı ciro)
- [x] 4 Bölge: Sahil Teras, Ana Salon, Bar & Kahve, Üst Kat Balkon

## Phase 5: Sipariş & Adisyon Akışı
- [x] `src/pages/OrderPage.tsx` — 3 panelli tablet sipariş ekranı
- [x] Kategori navigasyonu (10 kategori) & Ürün Karoları
- [x] `src/components/pos/ModifierModal.tsx` — Pişme derecesi, ekstralar, çıkarılacaklar, mutfak notu
- [x] `src/components/pos/PaymentModal.tsx` — Hızlı ödeme terminali, parçalı tahsilat, Sodexo/Multinet/Ticket

## Phase 6: Mutfak Ekranı (KDS)
- [x] `src/pages/KitchenPage.tsx` — İstasyon filtreli Kanban (Yeni → Hazırlanıyor → Hazır → Servis Edildi)
- [x] Süre sayacı (>15 dk kırmızı alarm) & Hazır bildirimi

## Phase 7: Yönetim Paneli
- [x] `src/pages/DashboardPage.tsx` — Patron/Müdür analitiği, Recharts saatlik ciro grafiği, kategori pasta grafiği
- [x] `src/pages/ReportsPage.tsx` — 4 sekme: Satışlar, En Çok Satanlar, Garson Performansı, Ödeme Dağılımı
- [x] `src/pages/MenuPage.tsx` — Fiyat, kategori, hazırlık istasyonu ve tek tıkla tükenen ürün kontrolü
- [x] `src/pages/InventoryPage.tsx` — Depo stok takibi & Reçete maliyeti / brüt kâr analizi
- [x] `src/pages/StaffPage.tsx` — Personel hesapları, PIN kodları ve yetki yönetimi
- [x] `src/pages/CustomersPage.tsx` — Müşteri CRM, harcama geçmişi ve sadakat puanları
- [x] `src/pages/ReservationsPage.tsx` — Günün rezervasyonları & Masaya oturtma
- [x] `src/pages/AuditLogPage.tsx` — Denetim günlüğü (Silinenler, indirimler, ödemeler)
- [x] `src/pages/OnlineOrdersPage.tsx` — Yemeksepeti, Getir, Trendyol, Migros Yemek sipariş havuzu
- [x] `src/pages/SettingsPage.tsx` — Wot's Cafe resmi bilgileri, termal yazıcılar ve ödeme ayarları
- [x] `src/pages/CustomerQRPage.tsx` — Müşteri mobil menü, sepet ve "Garson Çağır / Hesap İste / Su İste"

## Phase 8: Routing & Derleme Doğrulaması
- [x] `src/App.tsx` — Lazy loading ve React Router v6
- [x] `src/pages/LoginPage.tsx` — Büyük tuş takımlı 4 haneli PIN giriş ekranı
- [x] Tam build doğrulaması (`npx tsc --noEmit` & `npm run build` → 0 hata)

## Done When
- [x] Uygulama hatasız derleniyor (TypeScript 0 hata, Vite 0 hata)
- [x] Garson → Masa → Sipariş → Mutfak → Adisyon → Ödeme akışı uçtan uca çalışıyor
- [x] Offline göstergesi ve yerel IndexedDB veri koruması aktif
- [x] Patron dashboard'u canlı veri gösteriyor
