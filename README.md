# ☕ Wot's Cafe - Modern POS & Adisyon Sistemi (Prototype)

[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0.12-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Dexie.js](https://img.shields.io/badge/Dexie.js-IndexedDB-3B82F6?style=for-the-badge)](https://dexie.org/)
[![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20iOS%20%7C%20Android-orange?style=for-the-badge)](https://github.com/madireis/Adisyon)

> **Wot's Cafe** için geliştirilmiş yeni nesil, yerel ağ öncelikli (Local-First), gerçek zamanlı senkronizasyon yeteneklerine sahip dokunmatik **Restoran & Kafe Adisyon / POS Prototipi**.

---

## 📌 Proje Hakkında

Bu proje, kafe ve restoranların günlük operasyonlarını kesintisiz ve yüksek performansla yönetmesi için tasarlanmış bağımsız bir adisyon sistemidir. İnternet bağlantısı kopsa bile yerel WiFi ağı üzerinden tüm telefonlar, tabletler, mutfak ekranları ve kasa bilgisayarları arasında anlık veri senkronizasyonu sağlar.

### 🌟 Öne Çıkan Özellikler

- 📱 **Çoklu Cihaz ve PWA Desteği:** iOS (iPhone/iPad), Android (Telefon/Tablet) ve Windows PC'lerde tarayıcı üzerinden uygulama gibi çalışır (Ana Ekrana Ekle / PWA).
- 🚀 **Sıfır Kurulumlu Bağımsız Sunucu (`Adisyon-Server.exe`):** Harici veritabanı veya karmaşık sunucu kurulumu gerektirmeden tek tıkla çalışan Node.js tabanlı yerel sunucu.
- 📶 **Apple Bonjour / mDNS & Otomatik Alan Adı:** iPhone ve iPad'ler `http://adisyon.local:3001` adresiyle modemin IP adresi değişse bile otomatik bağlanır.
- ⚡ **Canlı SSE (Server-Sent Events) Senkronizasyonu:** Garson sipariş girdiğinde anında mutfak ekranına ve kasaya milisaniyeler içinde yansır.
- 🛡️ **Çökme ve Elektrik Kesintisi Koruması:** Otomatik dönen anlık yedeklemeler (Rolling Snapshots), atomik JSON yazma motoru ve acil durum kurtarma sistemi.
- 📊 **Patron & Yönetici Analitiği:** Saatlik ciro grafikleri, en çok satan ürünler, garson performans raporları, kategori dağılımı ve Z-Raporu.
- 🍳 **Mutfak Ekranı (KDS):** İstasyon filtreli Kanban panosu (Yeni -> Hazırlanıyor -> Hazır -> Servis Edildi), 15+ dakika gecikme uyarıları.
- 🏷️ **Masa & Kat Planı:** 4 farklı bölge (Sahil Teras, Ana Salon, Bar & Kahve, Üst Kat Balkon), masa taşıma, birleştirme ve süre takibi.
- 🧾 **Esnek Ödeme & Parçalı Tahsilat:** Nakit, Kredi Kartı, Sodexo, Multinet, Ticket, Setcard parçalı tahsilat ve termal fiş simülasyonu.
- 📦 **Stok & Reçete Maliyeti:** Malzeme envanteri, reçete maliyet hesabı ve brüt kâr marjı takibi.

---

## 🖥️ Sunucu Başlangıç Ekranı & QR Kod Entegrasyonu

`Adisyon-Server.exe` çalıştırıldığında terminalde gereksiz teknik yazılar yerine temiz bir kontrol paneli sunar:

```text
====================================================================
                 WOT'S CAFE ADISYON SISTEMI
====================================================================

  [ SISTEM & VERI DURUMU ]
  * Sunucu Durumu : AKTIF (Port 3001)
  * Kasa PC Giris : http://localhost:3001
  * Kayitli Veri  : 26 Masa | 31 Menu Urunu | 7 Personel
  * Senkronizasyon: Yerel WiFi, SSE & mDNS Aktif

--------------------------------------------------------------------
  [ TELEFON BAGLANTI ADRESLERI ]
  * iPhone / iOS  : http://adisyon.local:3001 (veya http://192.168.1.34:3001)
  * Android       : http://192.168.1.34:3001
--------------------------------------------------------------------
       [ iPhone / iOS QR ]                 [ Android QR ]
--------------------------------------------------------------------
  ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄         ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
  █ ▄▄▄▄▄ █▄▀▀▄▄▄ █▀█ ▄▄▄▄▄ █         █ ▄▄▄▄▄ ██▄▄ ▀ ██▄█ ▄▄▄▄▄ █
  █ █   █ ███▄█  ▄▀▀█ █   █ █         █ █   █ █▀▄  █▀ ▀ █ █   █ █
  █ █▄▄▄█ ██▄▀▄▀█▄█ █ █▄▄▄█ █         █ █▄▄▄█ █▄▀ █▄▀▄█▀█ █▄▄▄█ █
  █▄▄▄▄▄▄▄█ █ ▀▄▀▄█ █▄▄▄▄▄▄▄█         █▄▄▄▄▄▄▄█▄▀▄█ █ █▄█▄▄▄▄▄▄▄█
  █ ▄█▄ ▀▄▀█ ▄▄▀▀ ▀▄█▄▀▀▀▀▀▄█         █ ▄▀▄▄▀▄█▀▄▀█▄▀█ ▀▀▄█▀▀▀▀▄█
  █▄ █ ▄█▄▀▄▀  ▀██ █▄▀▀▄ ▀▀ █         █  █▀▀▄▄  ▄██▄▄▄ █ ▄▄  ▀▀ █
  █  ▀▄  ▄▄  █▄▄█▄▀▄▀▄▄▀██▀▄█         █ ▄ █▄▄▄▄▀▄ █▀▀▄▀▄▄▄▀▀██▀▄█
  █ ▄▄ █▀▄█▀█▄ ▄█▀ ▄▀▄█▀▄ ▄ █         █ ▄▄█ ▄▄▄██▄█▀██▄ ▄██▀▄ ▄ █
  █▄█▄███▄▄▀▄▄▀ ▄ █ ▄▄▄ █▄ ██         █▄█▄█▄█▄█▀▀▄ ▄▄ ▀ ▄▄▄ █▄ ██
  █ ▄▄▄▄▄ ███▀▄▀▀▄▀ █▄█ ▄█▀ █         █ ▄▄▄▄▄ ███▀▀▄  █ █▄█ ▄██ █
  █ █   █ █ █▀▀▀██ ▄  ▄▄ █▀▀█         █ █   █ █ ▀▀▄ ██▄▄▄  ▄ █▀▀█
  █ █▄▄▄█ █▀█▄  █▄█▄▀█  █   █         █ █▄▄▄█ █▀▀█ ▀█▄▀█▀▀▀ █   █
  █▄▄▄▄▄▄▄█▄█▄▄██▄█▄█▄██▄██▄█         █▄▄▄▄▄▄▄█▄▄█▄██▄▄▄█▄██▄██▄█

--------------------------------------------------------------------
  [ AKTIF BAGLI HESAPLAR (Canli) ]
  * Ahmet Yılmaz [Garson] - iPhone 15 (192.168.1.45)
  * Mutfak Ekranı [Mutfak] - Android Tablet (192.168.1.52)
====================================================================
 * Telefon kamerasini QR koda tutarak aninda baglanabilirsiniz.
====================================================================
```

---

## 🛠️ Kullanılan Teknolojiler & Paketler

### Frontend & Arayüz
| Paket | Versiyon | Açıklama |
| :--- | :--- | :--- |
| **React** | `^19.0.0` | Temel UI bileşen mimarisi |
| **TypeScript** | `^5.7.3` | Tip güvenliği ve ölçeklenebilir kod yapısı |
| **Vite** | `^6.2.0` | Hızlı HMR ve optimize üretim derleyicisi |
| **Tailwind CSS** | `^4.0.12` | Modern tasarım sistemi ve responsive stiller |
| **React Router** | `^7.3.0` | SPA istemci tarafı sayfa yönlendirmeleri |
| **Lucide React** | `^1.16.0` | Yüksek kaliteli modern arayüz ikon seti |
| **Recharts** | `^2.15.1` | Satış, ciro ve performans analitiği grafikleri |
| **clsx & tailwind-merge** | En güncel | Dinamik CSS sınıf birleştirme yardımcıları |

### Veri Tabanı & Senkronizasyon
| Paket | Versiyon | Açıklama |
| :--- | :--- | :--- |
| **Dexie.js** | `^4.0.11` | İstemci tarafı IndexedDB offline veri yönetimi |
| **dexie-react-hooks** | `^1.1.7` | IndexedDB canlı reaktif React kancaları |
| **QRCode** | `^1.5.4` | Müşteri masası ve garson giriş QR SVG üretimi |
| **QRCode-Terminal** | `^0.12.0` | Sunucu konsolunda anında taranabilir ANSI QR çıktısı |
| **MQTT** | `^5.16.0` | IoT donanım ve termal yazıcı entegrasyon protokolü |

### Sunucu & Dağıtım Araçları
| Araç | Açıklama |
| :--- | :--- |
| **Node.js HTTP & dgram** | Sıfır harici bağımlılıkla çalışan yerel HTTP API & UDP mDNS yanıtlayıcı |
| **@yao-pkg/pkg** | Node.js uygulamasını ve SPA derlemesini tek bir `.exe` dosyasına paketler |
| **Playwright** | `^1.63.0` - Uçtan uca (E2E) otomatik test paketi |

---

## 📁 Proje Dizin Yapısı

```
Adisyon/
├── Adisyon-Baslat.bat            # Tek tıkla sunucuyu başlatan Windows batch scripti
├── Adisyon-Domain-Kurucu.bat     # adisyon.local alan adını Windows hosts dosyasına ekler
├── Bilgisayar-Adini-Adisyon-Yap.bat # Windows cihaz adını ADISYON olarak yapılandırır
├── Sabit-IP-Ayarla.bat           # Statik yerel IP yapılandırma aracı
├── Adisyon-Server.exe            # Bağımsız derlenmiş sunucu çalıştırılabilir dosyası
├── server.cjs / server.js        # Yerel senkronizasyon, mDNS, veri saklama ve HTTP API sunucusu
├── pkg.config.json               # @yao-pkg/pkg yapılandırma dosyası
├── dist/                         # Vite tarafından üretilen optimize frontend derlemesi
├── public/                       # PWA manifest, ikonlar ve statik varlıklar
├── src/
│   ├── assets/                   # Logolar ve grafikler
│   ├── components/
│   │   ├── common/               # Modal'lar, Hata yakalayıcılar, PWA yükleme banner'ı
│   │   ├── layout/               # Ana navigasyon, üst bar, bildirim merkezi
│   │   ├── orders/               # Sipariş geçmişi ve zaman çizelgesi modalı
│   │   ├── pos/                  # Ödeme, adisyon fişi, masa taşıma, ürün modifiye modalı
│   │   └── tables/               # Masa ekleme ve kat/bölge düzenleme modalı
│   ├── lib/
│   │   ├── db.ts                 # Dexie IndexedDB şeması ve tabloları
│   │   ├── localNetwork.ts       # mDNS, cihaz algılama ve heartbeat yöneticisi
│   │   ├── mockData.ts           # Wot's Cafe tohum verileri (Menü, masalar, personel)
│   │   ├── qrCodeGenerator.ts    # QR kod SVG ve DataURL motoru
│   │   ├── store.tsx             # Genel React state ve veri sağlayıcısı
│   │   └── syncEngine.ts         # Sunucu-İstemci SSE senkronizasyon motoru
│   └── pages/                    # 14 ana sayfa (Kasa, Masalar, Mutfak, Raporlar, Stok vb.)
└── supabase/                     # İsteğe bağlı Supabase PostgreSQL şemaları
```

---

## 🚀 Başlangıç & Kurulum

### Gereksinimler
- **Node.js**: v18 veya üzeri (Geliştirme için)
- **Paket Yöneticisi**: npm / yarn / pnpm

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/madireis/Adisyon.git
cd Adisyon
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Geliştirme Sunucusunu Başlatın
```bash
# Frontend geliştirme sunucusu (Port: 5173)
npm run dev

# Senkronizasyon sunucusu (Port: 3001)
npm run server
```

### 4. Üretim İçin Derleyin ve Tek `.exe` Oluşturun
```bash
# Frontend'i derler ve Adisyon-Server.exe dosyasını üretir
npm run build:exe
```

---

## 📱 Garson ve Mutfak Cihazlarını Bağlama

1. Ana bilgisayarda **`Adisyon-Baslat.bat`** dosyasını çalıştırın.
2. Tüm telefon ve tabletleri işletmenin **aynı WiFi ağına** bağlayın.
3. **iPhone / iPad:** Telefonun kamerasını ekrandaki sol QR koda doğrultun veya Safari'den `http://adisyon.local:3001` adresine gidin.
4. **Android:** Telefonun kamerasını ekrandaki sağ QR koda doğrultun veya Chrome'dan `http://<Sunucu-IP>:3001` adresine gidin.
5. Açılan ekranda **"Uygulama Olarak Yükle"** butonuna basarak tam ekran mobil pos olarak kullanmaya başlayın.

---

## 🏷️ Etiketler & Anahtar Kelimeler

`restaurant-pos` `adisyon-sistemi` `cafe-pos` `react19` `typescript` `tailwindcss-v4` `vite` `local-first` `offline-first` `pwa` `dexie-indexeddb` `server-sent-events` `kds-kitchen-display` `qr-menu` `wots-cafe` `nodejs` `portable-server`

---

## 📄 Lisans & Katkı

Bu proje **Wot's Cafe & Restoran** adisyon altyapısı prototipi olarak geliştirilmiştir. Tüm hakları saklıdır.
