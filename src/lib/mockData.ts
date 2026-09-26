import type { Floor, Table, Category, MenuItem, Staff, InventoryItem, Recipe, Customer, Reservation, Order, KitchenTicket, AuditLog, Payment } from '@/types/pos'

const now = new Date()

// ─── FLOORS ───────────────────────────────────────────────────
export const floors: Floor[] = [
  { id: 'floor-1', name: 'Sahil Teras', icon: 'waves', order: 1 },
  { id: 'floor-2', name: 'Ana Salon', icon: 'coffee', order: 2 },
  { id: 'floor-3', name: 'Bar & Kahve', icon: 'wine', order: 3 },
  { id: 'floor-4', name: 'Üst Kat Balkon', icon: 'sunset', order: 4 },
]

// ─── TABLES ───────────────────────────────────────────────────
export const tables: Table[] = [
  // Sahil Teras (M1-M10)
  { id: 't-1', floorId: 'floor-1', number: 1, label: 'M1', seats: 4, status: 'available', guestCount: 0, posX: 5, posY: 10, shape: 'square' },
  { id: 't-2', floorId: 'floor-1', number: 2, label: 'M2', seats: 4, status: 'available', guestCount: 0, posX: 25, posY: 10, shape: 'square' },
  { id: 't-3', floorId: 'floor-1', number: 3, label: 'M3', seats: 6, status: 'available', guestCount: 0, posX: 45, posY: 10, shape: 'rectangle' },
  { id: 't-4', floorId: 'floor-1', number: 4, label: 'M4', seats: 2, status: 'available', guestCount: 0, posX: 65, posY: 10, shape: 'round' },
  { id: 't-5', floorId: 'floor-1', number: 5, label: 'M5', seats: 4, status: 'available', guestCount: 0, posX: 5, posY: 45, shape: 'square' },
  { id: 't-6', floorId: 'floor-1', number: 6, label: 'M6', seats: 4, status: 'available', guestCount: 0, posX: 25, posY: 45, shape: 'square' },
  { id: 't-7', floorId: 'floor-1', number: 7, label: 'M7', seats: 8, status: 'available', guestCount: 0, posX: 45, posY: 45, shape: 'rectangle' },
  { id: 't-8', floorId: 'floor-1', number: 8, label: 'M8', seats: 2, status: 'available', guestCount: 0, posX: 65, posY: 45, shape: 'round' },
  { id: 't-9', floorId: 'floor-1', number: 9, label: 'M9', seats: 4, status: 'available', guestCount: 0, posX: 5, posY: 75, shape: 'square' },
  { id: 't-10', floorId: 'floor-1', number: 10, label: 'M10', seats: 6, status: 'available', guestCount: 0, posX: 25, posY: 75, shape: 'rectangle' },
  // Ana Salon (M11-M18)
  { id: 't-11', floorId: 'floor-2', number: 11, label: 'M11', seats: 4, status: 'available', guestCount: 0, posX: 10, posY: 15, shape: 'square' },
  { id: 't-12', floorId: 'floor-2', number: 12, label: 'M12', seats: 4, status: 'available', guestCount: 0, posX: 35, posY: 15, shape: 'square' },
  { id: 't-13', floorId: 'floor-2', number: 13, label: 'M13', seats: 6, status: 'available', guestCount: 0, posX: 60, posY: 15, shape: 'rectangle' },
  { id: 't-14', floorId: 'floor-2', number: 14, label: 'M14', seats: 2, status: 'available', guestCount: 0, posX: 10, posY: 50, shape: 'round' },
  { id: 't-15', floorId: 'floor-2', number: 15, label: 'M15', seats: 4, status: 'available', guestCount: 0, posX: 35, posY: 50, shape: 'square' },
  { id: 't-16', floorId: 'floor-2', number: 16, label: 'M16', seats: 4, status: 'available', guestCount: 0, posX: 60, posY: 50, shape: 'square' },
  { id: 't-17', floorId: 'floor-2', number: 17, label: 'M17', seats: 8, status: 'available', guestCount: 0, posX: 10, posY: 80, shape: 'rectangle' },
  { id: 't-18', floorId: 'floor-2', number: 18, label: 'M18', seats: 2, status: 'available', guestCount: 0, posX: 35, posY: 80, shape: 'round' },
  // Bar (B1-B4)
  { id: 't-19', floorId: 'floor-3', number: 19, label: 'B1', seats: 2, status: 'available', guestCount: 0, posX: 15, posY: 30, shape: 'round' },
  { id: 't-20', floorId: 'floor-3', number: 20, label: 'B2', seats: 2, status: 'available', guestCount: 0, posX: 40, posY: 30, shape: 'round' },
  { id: 't-21', floorId: 'floor-3', number: 21, label: 'B3', seats: 2, status: 'available', guestCount: 0, posX: 65, posY: 30, shape: 'round' },
  { id: 't-22', floorId: 'floor-3', number: 22, label: 'B4', seats: 4, status: 'available', guestCount: 0, posX: 40, posY: 65, shape: 'square' },
  // Üst Kat Balkon (M21-M26)
  { id: 't-23', floorId: 'floor-4', number: 23, label: 'M21', seats: 4, status: 'available', guestCount: 0, posX: 10, posY: 20, shape: 'square' },
  { id: 't-24', floorId: 'floor-4', number: 24, label: 'M22', seats: 4, status: 'available', guestCount: 0, posX: 40, posY: 20, shape: 'square' },
  { id: 't-25', floorId: 'floor-4', number: 25, label: 'M23', seats: 6, status: 'available', guestCount: 0, posX: 70, posY: 20, shape: 'rectangle' },
  { id: 't-26', floorId: 'floor-4', number: 26, label: 'M24', seats: 2, status: 'available', guestCount: 0, posX: 10, posY: 60, shape: 'round' },
]

// ─── CATEGORIES ───────────────────────────────────────────────
export const categories: Category[] = [
  { id: 'cat-1', name: 'Kahvaltı', icon: 'egg', order: 1, color: 'bg-amber-100 text-amber-800' },
  { id: 'cat-2', name: 'Başlangıçlar', icon: 'salad', order: 2, color: 'bg-emerald-100 text-emerald-800' },
  { id: 'cat-3', name: 'Burgerler', icon: 'sandwich', order: 3, color: 'bg-red-100 text-red-800' },
  { id: 'cat-4', name: 'Pizza & Pide', icon: 'pizza', order: 4, color: 'bg-orange-100 text-orange-800' },
  { id: 'cat-5', name: 'Makarna', icon: 'utensils', order: 5, color: 'bg-yellow-100 text-yellow-800' },
  { id: 'cat-6', name: 'Ana Yemek', icon: 'beef', order: 6, color: 'bg-stone-100 text-stone-800' },
  { id: 'cat-7', name: 'Tatlılar', icon: 'cake', order: 7, color: 'bg-pink-100 text-pink-800' },
  { id: 'cat-8', name: 'Sıcak İçecek', icon: 'coffee', order: 8, color: 'bg-espresso-100 text-espresso-800' },
  { id: 'cat-9', name: 'Soğuk İçecek', icon: 'glass-water', order: 9, color: 'bg-sky-100 text-sky-800' },
  { id: 'cat-10', name: 'Kokteyller', icon: 'martini', order: 10, color: 'bg-purple-100 text-purple-800' },
]

// ─── MENU ITEMS ───────────────────────────────────────────────
export const menuItems: MenuItem[] = [
  // ── 1. KAHVALTI (cat-1) ──
  {
    id: 'mi-1', categoryId: 'cat-1', name: 'Serpme Sahil Kahvaltısı', description: 'Zengin serpme kahvaltı tabağı, peynir çeşitleri, reçeller, sınırsız çay', price: 450,
    station: 'kitchen', available: true, preparationTime: 15, vat: 8,
    modifierGroups: [{ id: 'mg-1', name: 'Ekstra', type: 'multiple', modifiers: [
      { id: 'mod-1', name: 'Ekstra Peynir Tabağı', price: 80, group: 'Ekstra' },
      { id: 'mod-2', name: 'Ekstra Bal-Kaymak', price: 60, group: 'Ekstra' },
      { id: 'mod-3', name: 'Pişi (3 Adet)', price: 50, group: 'Ekstra' },
    ]}]
  },
  {
    id: 'mi-2', categoryId: 'cat-1', name: 'Hızlı Kahvaltı Tabağı', description: 'Beyaz peynir, kaşar, domates, salatalık, siyah/yeşil zeytin, haşlanmış yumurta, reçel, 1 çay', price: 220,
    station: 'kitchen', available: true, preparationTime: 8, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-3', categoryId: 'cat-1', name: 'Menemen', description: 'Köy tereyağında domates, biber ve taze yumurta', price: 150,
    station: 'kitchen', available: true, preparationTime: 10, vat: 8,
    modifierGroups: [{ id: 'mg-2', name: 'Seçenek', type: 'single', modifiers: [
      { id: 'mod-4', name: 'Sade', price: 0, group: 'Seçenek' },
      { id: 'mod-5', name: 'Kaşarlı', price: 30, group: 'Seçenek' },
      { id: 'mod-6', name: 'Sucuklu', price: 40, group: 'Seçenek' },
      { id: 'mod-7', name: 'Karışık (Sucuklu & Kaşarlı)', price: 50, group: 'Seçenek' },
    ]}]
  },
  {
    id: 'mi-4', categoryId: 'cat-1', name: 'Sahanda Sucuklu Yumurta', description: 'Özel kasap sucuk ve tereyağında 2 göz yumurta', price: 170,
    station: 'kitchen', available: true, preparationTime: 8, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-5', categoryId: 'cat-1', name: 'Kaşarlı Tost', description: 'Tost ekmeğinde bol kaşar peyniri, patates kızartması ve söğüş ile', price: 110,
    station: 'kitchen', available: true, preparationTime: 8, vat: 8,
    modifierGroups: [{ id: 'mg-3', name: 'Seçenek', type: 'multiple', modifiers: [
      { id: 'mod-8', name: 'Çift Kaşar', price: 25, group: 'Seçenek' },
      { id: 'mod-9', name: 'Domatesli', price: 0, group: 'Seçenek' },
    ]}]
  },
  {
    id: 'mi-6', categoryId: 'cat-1', name: 'Karışık Tost', description: 'Kasap sucuk, kaşar peyniri, domates salçası, patates kızartması ile', price: 135,
    station: 'kitchen', available: true, preparationTime: 8, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-7', categoryId: 'cat-1', name: 'Avokadolu Poşe Yumurta', description: 'Ekşi mayalı ekmek üzeri avokado ezmesi, 2 poşe yumurta ve çörek otu', price: 210,
    station: 'kitchen', available: true, preparationTime: 10, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-8', categoryId: 'cat-1', name: 'Pişi & Bal-Kaymak', description: 'Sıcak ev yapımı pişiler (4 adet), manda kaymağı ve çiçek balı ile', price: 130,
    station: 'kitchen', available: true, preparationTime: 8, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-9', categoryId: 'cat-1', name: 'Kuymak / Mıhlama', description: 'Trabzon kolot peyniri, taze mısır unu ve köy tereyağı ile', price: 185,
    station: 'kitchen', available: true, preparationTime: 12, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-10', categoryId: 'cat-1', name: 'Meyveli Pankek Tabağı', description: '3 adet pankek, nutella, muz, çilek ve akçaağaç şurubu', price: 160,
    station: 'kitchen', available: true, preparationTime: 10, vat: 8, modifierGroups: []
  },

  // ── 2. BAŞLANGIÇLAR & ATIŞTIRMALIKLAR (cat-2) ──
  {
    id: 'mi-11', categoryId: 'cat-2', name: 'Patates Kızartması', description: 'Özel baharat karışımlı çıtır patates sepeti', price: 95,
    station: 'kitchen', available: true, preparationTime: 8, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-12', categoryId: 'cat-2', name: 'Trüflü & Parmesanlı Patates', description: 'Trüf yağı ve taze rendelenmiş parmesan peynirli çıtır patates', price: 140,
    station: 'kitchen', available: true, preparationTime: 8, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-13', categoryId: 'cat-2', name: 'Çıtır Tavuk Sepeti (Tenders)', description: 'Baharatlı mısır gevreği kaplı tavuk parçaları, ballı hardal ve barbekü sos', price: 190,
    station: 'kitchen', available: true, preparationTime: 10, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-14', categoryId: 'cat-2', name: 'Çıtır Karides', description: '8 adet tereyağlı çıtır karides, tartar ve acı sos ile', price: 280,
    station: 'kitchen', available: true, preparationTime: 12, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-15', categoryId: 'cat-2', name: 'Falafel Tabağı', description: 'Ev yapımı falafel köfteleri, humus, tahin sos ve yeşillik', price: 180,
    station: 'kitchen', available: true, preparationTime: 10, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-16', categoryId: 'cat-2', name: 'Paçanga Böreği', description: 'Kayseri pastırması, kaşar peyniri ve domatesli çıtır börek (2 adet)', price: 160,
    station: 'kitchen', available: true, preparationTime: 10, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-17', categoryId: 'cat-2', name: 'Çıtır Sigara Böreği', description: 'Beyaz peynirli ve maydanozlu ev usulü börek (5 adet)', price: 110,
    station: 'kitchen', available: true, preparationTime: 8, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-18', categoryId: 'cat-2', name: 'Hellim Salatası', description: 'Izgara hellim peyniri, ceviz, nar ekşisi, kurutulmuş domates ve Akdeniz yeşilliği', price: 200,
    station: 'kitchen', available: true, preparationTime: 8, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-19', categoryId: 'cat-2', name: 'Tavuklu Sezar Salata', description: 'Izgara tavuk fileto, marul, sarımsaklı kruton, parmesan ve özel Sezar sos', price: 220,
    station: 'kitchen', available: true, preparationTime: 10, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-20', categoryId: 'cat-2', name: 'Ton Balıklı Salata', description: 'Akdeniz yeşillikleri, ton balığı, mısır, kapari çiçeği, kırmızı soğan ve limon sos', price: 210,
    station: 'kitchen', available: true, preparationTime: 8, vat: 8, modifierGroups: []
  },

  // ── 3. BURGERLER (cat-3) ──
  {
    id: 'mi-21', categoryId: 'cat-3', name: "Wot's Classic Burger", description: '180gr dana köfte, cheddar, karamelize soğan, marul, özel burger sos, patates ile', price: 320,
    station: 'kitchen', available: true, preparationTime: 15, vat: 8,
    modifierGroups: [
      { id: 'mg-4', name: 'Pişirme', type: 'single', modifiers: [
        { id: 'mod-10', name: 'Az Pişmiş', price: 0, group: 'Pişirme' },
        { id: 'mod-11', name: 'Orta Pişmiş', price: 0, group: 'Pişirme' },
        { id: 'mod-12', name: 'İyi Pişmiş', price: 0, group: 'Pişirme' },
      ]},
      { id: 'mg-5', name: 'Ekstra', type: 'multiple', modifiers: [
        { id: 'mod-13', name: 'Ekstra Cheddar', price: 35, group: 'Ekstra' },
        { id: 'mod-14', name: 'Dana Bacon', price: 45, group: 'Ekstra' },
        { id: 'mod-15', name: 'Ekstra Köfte (180gr)', price: 90, group: 'Ekstra' },
      ]},
      { id: 'mg-6', name: 'Çıkar', type: 'remove', modifiers: [
        { id: 'mod-16', name: 'Soğansız', price: 0, group: 'Çıkar' },
        { id: 'mod-17', name: 'Turşusuz', price: 0, group: 'Çıkar' },
        { id: 'mod-18', name: 'Yeşilliksiz', price: 0, group: 'Çıkar' },
      ]}
    ]
  },
  {
    id: 'mi-22', categoryId: 'cat-3', name: "Wot's Double Burger", description: '2x140gr dana köfte, çift kat cheddar, dana bacon, tütsülenmiş sos, patates ile', price: 420,
    station: 'kitchen', available: true, preparationTime: 15, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-23', categoryId: 'cat-3', name: 'Smash Burger', description: 'İnce preslenmiş çift kat köfte, eritilmiş Amerikan peyniri, turşu, patates ile', price: 290,
    station: 'kitchen', available: true, preparationTime: 12, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-24', categoryId: 'cat-3', name: 'Trüflü Mantarlı Burger', description: '180gr köfte, sote mantar, gravyer peyniri, trüflü mayonez, patates ile', price: 340,
    station: 'kitchen', available: true, preparationTime: 14, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-25', categoryId: 'cat-3', name: 'Crispy Chicken Burger', description: 'Çıtır pane tavuk göğsü, cheddar, ev yapımı coleslaw, acı-tatlı mayonez, patates ile', price: 260,
    station: 'kitchen', available: true, preparationTime: 12, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-26', categoryId: 'cat-3', name: 'BBQ Bacon Burger', description: 'Dana köfte, dana bacon, çıtır soğan halkası, cheddar ve barbekü sos, patates ile', price: 350,
    station: 'kitchen', available: true, preparationTime: 14, vat: 8, modifierGroups: []
  },

  // ── 4. PIZZA & PİDE (cat-4) ──
  {
    id: 'mi-27', categoryId: 'cat-4', name: 'Margarita Pizza', description: 'İtalyan domates sosu, bol mozzarella, taze fesleğen, sızma zeytinyağı', price: 240,
    station: 'kitchen', available: true, preparationTime: 15, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-28', categoryId: 'cat-4', name: 'Karışık Pizza', description: 'Mozzarella, kasap sucuk, salam, sosis, mantar, mısır, yeşil biber, siyah zeytin', price: 280,
    station: 'kitchen', available: true, preparationTime: 18, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-29', categoryId: 'cat-4', name: 'Pepperoni Pizza', description: 'Özel baharatlı İtalyan dana pepperoni, mozzarella, kekik', price: 290,
    station: 'kitchen', available: true, preparationTime: 15, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-30', categoryId: 'cat-4', name: 'Dört Peynirli (Quattro Formaggi)', description: 'Mozzarella, gorgonzola, parmesan ve kaşar peyniri harmanı', price: 285,
    station: 'kitchen', available: true, preparationTime: 15, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-31', categoryId: 'cat-4', name: 'Tavuklu & Mantarlı Pizza', description: 'Kremalı domates sos, jülyen tavuk, kültür mantarı, köz biber, mozzarella', price: 270,
    station: 'kitchen', available: true, preparationTime: 16, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-32', categoryId: 'cat-4', name: 'Kuşbaşılı & Kaşarlı Pide', description: 'Taş fırında marine edilmiş dana kuşbaşı eti ve eritilmiş kaşar peyniri', price: 265,
    station: 'kitchen', available: true, preparationTime: 15, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-33', categoryId: 'cat-4', name: 'Kıymalı Taş Fırın Pidesi', description: 'Özel baharatlı dana kıymalı geleneksel taş fırın pidesi', price: 235,
    station: 'kitchen', available: true, preparationTime: 14, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-34', categoryId: 'cat-4', name: 'Kaşarlı Pide', description: 'Bol tereyağlı ve erimiş kaşarlı çıtır taş fırın pidesi', price: 210,
    station: 'kitchen', available: true, preparationTime: 12, vat: 8, modifierGroups: []
  },

  // ── 5. MAKARNA & MANTI (cat-5) ──
  {
    id: 'mi-35', categoryId: 'cat-5', name: 'Fettuccine Alfredo', description: 'Jülyen tavuk parçaları, kültür mantarı, krema ve parmesan peyniri', price: 250,
    station: 'kitchen', available: true, preparationTime: 14, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-36', categoryId: 'cat-5', name: 'Spaghetti Bolognese', description: 'Ağır ateşte pişmiş dana kıymalı özel İtalyan sos, fesleğen ve parmesan', price: 240,
    station: 'kitchen', available: true, preparationTime: 12, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-37', categoryId: 'cat-5', name: 'Penne Arrabbiata', description: 'Acılı sarımsaklı domates sosu, dilim siyah zeytin, taze fesleğen', price: 210,
    station: 'kitchen', available: true, preparationTime: 12, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-38', categoryId: 'cat-5', name: 'Tavuklu Pesto Penne', description: 'Ev yapımı fesleğenli pesto sos, ızgara tavuk dilimleri ve parmesan', price: 245,
    station: 'kitchen', available: true, preparationTime: 13, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-39', categoryId: 'cat-5', name: 'Ev Yapımı Kayseri Mantısı', description: 'Sarımsaklı süzme yoğurt, kızgın tereyağında nane ve pul biber sosu ile', price: 230,
    station: 'kitchen', available: true, preparationTime: 12, vat: 8,
    modifierGroups: [{ id: 'mg-7', name: 'Yoğurt Tercihi', type: 'single', modifiers: [
      { id: 'mod-19', name: 'Sarımsaklı Yoğurt', price: 0, group: 'Yoğurt' },
      { id: 'mod-20', name: 'Sarımsaksız Yoğurt', price: 0, group: 'Yoğurt' },
    ]}]
  },
  {
    id: 'mi-40', categoryId: 'cat-5', name: 'Çıtır Kızarmış Mantı', description: 'Altın sarısı çıtır mantılar, domates sosu ve yoğurt eşliğinde', price: 240,
    station: 'kitchen', available: true, preparationTime: 10, vat: 8, modifierGroups: []
  },

  // ── 6. ANA YEMEK & IZGARALAR (cat-6) ──
  {
    id: 'mi-41', categoryId: 'cat-6', name: 'Izgara Kasap Köfte', description: '200gr dana köfte, tereyağlı pirinç pilavı, patates kızartması, köz domates ve biber', price: 280,
    station: 'kitchen', available: true, preparationTime: 15, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-42', categoryId: 'cat-6', name: 'Cafe de Paris Soslu Antrikot', description: '220gr dinlendirilmiş dana antrikot, özel Cafe de Paris sos ve patates tava', price: 480,
    station: 'kitchen', available: true, preparationTime: 18, vat: 8,
    modifierGroups: [{ id: 'mg-8', name: 'Pişirme Derecesi', type: 'single', modifiers: [
      { id: 'mod-21', name: 'Az Pişmiş', price: 0, group: 'Pişirme' },
      { id: 'mod-22', name: 'Orta', price: 0, group: 'Pişirme' },
      { id: 'mod-23', name: 'İyi Pişmiş', price: 0, group: 'Pişirme' },
    ]}]
  },
  {
    id: 'mi-43', categoryId: 'cat-6', name: 'Marine Tavuk Şiş', description: 'Özel marinasyonlu tavuk göğsü, sebzeli bulgur pilavı, köz sebzeler ve lavaş', price: 250,
    station: 'kitchen', available: true, preparationTime: 15, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-44', categoryId: 'cat-6', name: 'Çökertme Kebabı', description: 'Çıtır kibrit patates yatağında marine dana bonfile, sarımsaklı yoğurt ve kızgın tereyağı', price: 380,
    station: 'kitchen', available: true, preparationTime: 16, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-45', categoryId: 'cat-6', name: 'Beğendili Tavuk Külbastı', description: 'Köz patlıcan beğendi üzerinde ızgara tavuk pirzola, köz biber ile', price: 290,
    station: 'kitchen', available: true, preparationTime: 15, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-46', categoryId: 'cat-6', name: 'Somon Izgara', description: 'Norveç somon fileto, sote sebzeler, bebek patates, kaparili tereyağı sosu', price: 380,
    station: 'kitchen', available: true, preparationTime: 18, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-47', categoryId: 'cat-6', name: 'Izgara Levrek Fileto', description: 'Ege levrek fileto, roka-kırmızı soğan salatası, ızgara patates', price: 360,
    station: 'kitchen', available: true, preparationTime: 18, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-48', categoryId: 'cat-6', name: 'Kremalı Körili Tavuk', description: 'Jülyen tavuk parçaları, mantar, köri sos, basmati pirinç pilavı ile', price: 260,
    station: 'kitchen', available: true, preparationTime: 14, vat: 8, modifierGroups: []
  },

  // ── 7. TATLILAR (cat-7) ──
  {
    id: 'mi-49', categoryId: 'cat-7', name: 'San Sebastian Cheesecake', description: 'Karamelize kıvam, sıcak Belçika sütlü çikolatası sosu ile', price: 160,
    station: 'dessert', available: true, preparationTime: 4, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-50', categoryId: 'cat-7', name: 'Sıcak Çikolatalı Sufle', description: 'Akışkan sıcak çikolata keki, yanında hakiki vanilyalı Maraş dondurması', price: 155,
    station: 'dessert', available: true, preparationTime: 10, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-51', categoryId: 'cat-7', name: 'Fıstıklı Sıcak Künefe', description: 'Hatay peynirli sıcak künefe, bol Antep fıstığı ve kesme dondurma', price: 180,
    station: 'dessert', available: true, preparationTime: 12, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-52', categoryId: 'cat-7', name: "Wot's Special Waffle", description: 'Çıtır sıcak hamur, nutella, muz, çilek, fındık, dondurma ve çikolata sosu', price: 175,
    station: 'dessert', available: true, preparationTime: 10, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-53', categoryId: 'cat-7', name: 'Klasik İtalyan Tiramisu', description: 'Mascarpone peynirli, espresso ile ıslatılmış savoiardi bisküvili', price: 145,
    station: 'dessert', available: true, preparationTime: 4, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-54', categoryId: 'cat-7', name: 'Profiterol', description: 'Özel şu hamuru, vanilyalı pastacı kreması ve yoğun çikolata sosu', price: 140,
    station: 'dessert', available: true, preparationTime: 4, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-55', categoryId: 'cat-7', name: 'Dondurma Tabağı (3 Top)', description: 'Vanilya, Belçika çikolata, çilek veya Antep fıstığı seçenekleriyle', price: 110,
    station: 'dessert', available: true, preparationTime: 3, vat: 8, modifierGroups: []
  },

  // ── 8. SICAK İÇECEKLER (cat-8) ──
  {
    id: 'mi-56', categoryId: 'cat-8', name: 'Çay (Bardak)', description: 'Taze demlenmiş Doğu Karadeniz çayı', price: 30,
    station: 'coffee', available: true, preparationTime: 2, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-57', categoryId: 'cat-8', name: 'Fincan Çay', description: 'Büyük fincan taze çay', price: 45,
    station: 'coffee', available: true, preparationTime: 2, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-58', categoryId: 'cat-8', name: 'Türk Kahvesi', description: 'Geleneksel taze çekilmiş Türk kahvesi, lokum ve su ile', price: 70,
    station: 'coffee', available: true, preparationTime: 5, vat: 8,
    modifierGroups: [{ id: 'mg-9', name: 'Şeker', type: 'single', modifiers: [
      { id: 'mod-24', name: 'Sade', price: 0, group: 'Şeker' },
      { id: 'mod-25', name: 'Az Şekerli', price: 0, group: 'Şeker' },
      { id: 'mod-26', name: 'Orta', price: 0, group: 'Şeker' },
      { id: 'mod-27', name: 'Şekerli', price: 0, group: 'Şeker' },
    ]}]
  },
  {
    id: 'mi-59', categoryId: 'cat-8', name: 'Damla Sakızlı Türk Kahvesi', description: 'Hakiki Çeşme damla sakızı aromalı Türk kahvesi', price: 80,
    station: 'coffee', available: true, preparationTime: 5, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-60', categoryId: 'cat-8', name: 'Espresso', description: '%100 Arabica çekirdekten tek shot yoğun kahve', price: 75,
    station: 'coffee', available: true, preparationTime: 3, vat: 8,
    modifierGroups: [{ id: 'mg-10', name: 'Shot', type: 'single', modifiers: [
      { id: 'mod-28', name: 'Single Shot', price: 0, group: 'Shot' },
      { id: 'mod-29', name: 'Double Shot (Duble)', price: 25, group: 'Shot' },
    ]}]
  },
  {
    id: 'mi-61', categoryId: 'cat-8', name: 'Americano', description: 'Sıcak su ile inceltilmiş double shot espresso', price: 90,
    station: 'coffee', available: true, preparationTime: 3, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-62', categoryId: 'cat-8', name: 'Cafe Latte', description: 'Espresso ve kadifemsi kıvamda buharda ısıtılmış süt', price: 110,
    station: 'coffee', available: true, preparationTime: 4, vat: 8,
    modifierGroups: [{ id: 'mg-11', name: 'Süt Türü', type: 'single', modifiers: [
      { id: 'mod-30', name: 'Tam Yağlı Süt', price: 0, group: 'Süt' },
      { id: 'mod-31', name: 'Yulaf Sütü', price: 20, group: 'Süt' },
      { id: 'mod-32', name: 'Badem Sütü', price: 20, group: 'Süt' },
    ]}]
  },
  {
    id: 'mi-63', categoryId: 'cat-8', name: 'Cappuccino', description: 'Espresso, sıcak süt ve üzerinde yoğun süt kreması', price: 105,
    station: 'coffee', available: true, preparationTime: 4, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-64', categoryId: 'cat-8', name: 'Caramel Macchiato', description: 'Vanilya şurubu, sıcak süt, espresso ve karamel gezdirilmiş süt kreması', price: 125,
    station: 'coffee', available: true, preparationTime: 4, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-65', categoryId: 'cat-8', name: 'Caffe Mocha', description: 'Espresso, Belçika çikolata sosu, sıcak süt ve krema', price: 125,
    station: 'coffee', available: true, preparationTime: 4, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-66', categoryId: 'cat-8', name: 'Sıcak Çikolata', description: 'Hakiki eritilmiş çikolata ve sıcak süt', price: 110,
    station: 'coffee', available: true, preparationTime: 4, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-67', categoryId: 'cat-8', name: 'Hakiki Sahlep', description: 'Süt ile pişirilmiş doğal dağ sahlebi, bol tarçın ile', price: 120,
    station: 'coffee', available: true, preparationTime: 5, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-68', categoryId: 'cat-8', name: 'Bitki Çayları', description: 'Ihlamur, Yeşil Çay, Papatya, Adaçayı veya Kış Çayı (Bal ve limon ile)', price: 85,
    station: 'coffee', available: true, preparationTime: 4, vat: 8,
    modifierGroups: [{ id: 'mg-12', name: 'Çeşit', type: 'single', modifiers: [
      { id: 'mod-33', name: 'Ihlamur', price: 0, group: 'Çeşit' },
      { id: 'mod-34', name: 'Yeşil Çay', price: 0, group: 'Çeşit' },
      { id: 'mod-35', name: 'Papatya', price: 0, group: 'Çeşit' },
      { id: 'mod-36', name: 'Adaçayı', price: 0, group: 'Çeşit' },
      { id: 'mod-37', name: 'Atom Kış Çayı', price: 10, group: 'Çeşit' },
    ]}]
  },

  // ── 9. SOĞUK İÇECEKLER (cat-9) ──
  {
    id: 'mi-69', categoryId: 'cat-9', name: 'Ev Yapımı Limonata', description: 'Taze sıkılmış limon, nane yaprakları ve buz ile', price: 90,
    station: 'bar', available: true, preparationTime: 3, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-70', categoryId: 'cat-9', name: 'Çilekli Limonata', description: 'Ev yapımı limonata ve taze çilek püresi karışımı', price: 105,
    station: 'bar', available: true, preparationTime: 3, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-71', categoryId: 'cat-9', name: 'Taze Sıkma Portakal Suyu', description: 'Anlık sıkılmış %100 doğal portakal suyu', price: 110,
    station: 'bar', available: true, preparationTime: 4, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-72', categoryId: 'cat-9', name: 'Iced Latte', description: 'Soğuk süt, espresso ve bol buz', price: 115,
    station: 'coffee', available: true, preparationTime: 3, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-73', categoryId: 'cat-9', name: 'Iced Americano', description: 'Soğuk su, double shot espresso ve buz', price: 95,
    station: 'coffee', available: true, preparationTime: 3, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-74', categoryId: 'cat-9', name: 'Milkshake', description: 'Dondurma ve süt ile hazırlanan yoğun soğuk içecek', price: 130,
    station: 'bar', available: true, preparationTime: 4, vat: 8,
    modifierGroups: [{ id: 'mg-13', name: 'Aroma', type: 'single', modifiers: [
      { id: 'mod-38', name: 'Çilekli', price: 0, group: 'Aroma' },
      { id: 'mod-39', name: 'Çikolatalı', price: 0, group: 'Aroma' },
      { id: 'mod-40', name: 'Vanilyalı', price: 0, group: 'Aroma' },
      { id: 'mod-41', name: 'Muzlu', price: 0, group: 'Aroma' },
    ]}]
  },
  {
    id: 'mi-75', categoryId: 'cat-9', name: 'Frozen Mango & Çilek', description: 'Buzlu ferahlatıcı meyve püresi', price: 120,
    station: 'bar', available: true, preparationTime: 4, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-76', categoryId: 'cat-9', name: 'Kutu İçecekler (330ml)', description: 'Coca-Cola, Coca-Cola Zero, Fanta, Sprite', price: 60,
    station: 'bar', available: true, preparationTime: 1, vat: 8,
    modifierGroups: [{ id: 'mg-14', name: 'Seçenek', type: 'single', modifiers: [
      { id: 'mod-42', name: 'Coca-Cola', price: 0, group: 'İçecek' },
      { id: 'mod-43', name: 'Coca-Cola Zero', price: 0, group: 'İçecek' },
      { id: 'mod-44', name: 'Fanta', price: 0, group: 'İçecek' },
      { id: 'mod-45', name: 'Sprite', price: 0, group: 'İçecek' },
    ]}]
  },
  {
    id: 'mi-77', categoryId: 'cat-9', name: 'Köpüklü Yayık Ayran', description: 'Geleneksel soğuk yayık ayranı', price: 40,
    station: 'bar', available: true, preparationTime: 1, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-78', categoryId: 'cat-9', name: 'Şişe Maden Suyu', description: 'Cam şişe doğal maden suyu', price: 35,
    station: 'bar', available: true, preparationTime: 1, vat: 8,
    modifierGroups: [{ id: 'mg-15', name: 'Çeşit', type: 'single', modifiers: [
      { id: 'mod-46', name: 'Sade', price: 0, group: 'Çeşit' },
      { id: 'mod-47', name: 'Limonlu (+10 TL)', price: 10, group: 'Çeşit' },
      { id: 'mod-48', name: 'Elmalı (+10 TL)', price: 10, group: 'Çeşit' },
    ]}]
  },
  {
    id: 'mi-79', categoryId: 'cat-9', name: 'Su (500ml)', description: 'Şişe su', price: 20,
    station: 'bar', available: true, preparationTime: 1, vat: 8, modifierGroups: []
  },

  // ── 10. KOKTEYLLER & ÖZEL İÇECEKLER (cat-10) ──
  {
    id: 'mi-80', categoryId: 'cat-10', name: 'Mojito (Classic)', description: 'Taze nane yaprakları, taze lime suyu, esmer şeker, soda ve kırık buz', price: 180,
    station: 'bar', available: true, preparationTime: 5, vat: 18, modifierGroups: []
  },
  {
    id: 'mi-81', categoryId: 'cat-10', name: 'Aperol Spritz', description: 'Aperol, prosecco, maden suyu ve taze portakal dilimi', price: 220,
    station: 'bar', available: true, preparationTime: 4, vat: 18, modifierGroups: []
  },
  {
    id: 'mi-82', categoryId: 'cat-10', name: 'Espresso Martini', description: 'Taze çekilmiş espresso, kahlua ve krema', price: 230,
    station: 'bar', available: true, preparationTime: 5, vat: 18, modifierGroups: []
  },
  {
    id: 'mi-83', categoryId: 'cat-10', name: 'Klasik Margarita', description: 'Tekila, triple sec, taze sıkılmış lime suyu ve tuzlu bardak kenarı', price: 210,
    station: 'bar', available: true, preparationTime: 5, vat: 18, modifierGroups: []
  },
  {
    id: 'mi-84', categoryId: 'cat-10', name: 'Virgin Mojito (Alkolsüz)', description: 'Nane, esmer şeker, misket limonu, elma suyu ve gazoz ile ferahlatıcı mocktail', price: 140,
    station: 'bar', available: true, preparationTime: 4, vat: 8, modifierGroups: []
  },
  {
    id: 'mi-85', categoryId: 'cat-10', name: 'Blue Lagoon Mocktail (Alkolsüz)', description: 'Mavi turunç şurubu, ev yapımı limonata ve sprite ile egzotik sunum', price: 140,
    station: 'bar', available: true, preparationTime: 4, vat: 8, modifierGroups: []
  },
]

// ─── STAFF ────────────────────────────────────────────────────
export const staffMembers: Staff[] = [
  { id: 'staff-1', name: 'Ahmet Yılmaz', username: '1001', role: 'waiter', pin: '1234', active: true },
  { id: 'staff-2', name: 'Zeynep Kaya', username: '1002', role: 'cashier', pin: '2345', active: true },
  { id: 'staff-3', name: 'Mehmet Demir', username: '1003', role: 'kitchen', pin: '3456', active: true },
  { id: 'staff-4', name: 'Can Aksoy', username: '1004', role: 'waiter', pin: '4567', active: true },
  { id: 'staff-5', name: 'Elif Şahin', username: '1005', role: 'bar', pin: '5678', active: true },
  { id: 'staff-6', name: 'Murat Bey', username: '1006', role: 'manager', pin: '7890', active: true },
  { id: 'staff-7', name: 'Patron', username: '1007', role: 'owner', pin: '9999', active: true },
]

// ─── SAMPLE ORDERS (Empty for production) ────────────────────────────
export const sampleOrders: Order[] = []

// ─── KITCHEN TICKETS (Empty for production) ──────────────────────────
export const sampleKitchenTickets: KitchenTicket[] = []

// ─── SAMPLE PAYMENTS (Empty for production) ──────────────────────────
export const samplePayments: Payment[] = []

// ─── INVENTORY ────────────────────────────────────────────────
export const inventoryItems: InventoryItem[] = [
  { id: 'inv-1', name: 'Dana Kıyma', unit: 'kg', currentStock: 25, minimumStock: 10, purchaseCost: 350, supplier: 'Kardeşler Et', lastUpdated: now.toISOString() },
  { id: 'inv-2', name: 'Tavuk Göğsü', unit: 'kg', currentStock: 15, minimumStock: 8, purchaseCost: 180, supplier: 'Kardeşler Et', lastUpdated: now.toISOString() },
  { id: 'inv-3', name: 'Burger Ekmeği', unit: 'adet', currentStock: 80, minimumStock: 30, purchaseCost: 8, supplier: 'Sahil Fırın', lastUpdated: now.toISOString() },
  { id: 'inv-4', name: 'Mozzarella', unit: 'kg', currentStock: 8, minimumStock: 5, purchaseCost: 280, supplier: 'Peynirci Ali', lastUpdated: now.toISOString() },
  { id: 'inv-5', name: 'Domates', unit: 'kg', currentStock: 20, minimumStock: 10, purchaseCost: 35, supplier: 'Hal Sebze', lastUpdated: now.toISOString() },
  { id: 'inv-6', name: 'Yumurta', unit: 'adet', currentStock: 120, minimumStock: 50, purchaseCost: 5, supplier: 'Çiftlik Yumurta', lastUpdated: now.toISOString() },
  { id: 'inv-7', name: 'Kahve Çekirdeği', unit: 'kg', currentStock: 3, minimumStock: 5, purchaseCost: 600, supplier: 'Roast İstanbul', lastUpdated: now.toISOString() },
  { id: 'inv-8', name: 'Süt', unit: 'lt', currentStock: 30, minimumStock: 15, purchaseCost: 40, supplier: 'Güney Mandıra', lastUpdated: now.toISOString() },
  { id: 'inv-9', name: 'Limon', unit: 'kg', currentStock: 12, minimumStock: 5, purchaseCost: 45, supplier: 'Hal Sebze', lastUpdated: now.toISOString() },
  { id: 'inv-10', name: 'Ayran', unit: 'adet', currentStock: 45, minimumStock: 40, purchaseCost: 10, supplier: 'Güney Mandıra', lastUpdated: now.toISOString() },
]

// ─── RECIPES ──────────────────────────────────────────────────
// ─── RECIPES ──────────────────────────────────────────────────
export const recipes: Recipe[] = [
  {
    id: 'rec-1', menuItemId: 'mi-21', menuItemName: "Wot's Classic Burger", totalCost: 98,
    items: [
      { inventoryItemId: 'inv-1', inventoryItemName: 'Dana Kıyma', quantity: 0.18, unit: 'kg' },
      { inventoryItemId: 'inv-3', inventoryItemName: 'Burger Ekmeği', quantity: 1, unit: 'adet' },
      { inventoryItemId: 'inv-4', inventoryItemName: 'Mozzarella', quantity: 0.04, unit: 'kg' },
      { inventoryItemId: 'inv-5', inventoryItemName: 'Domates', quantity: 0.05, unit: 'kg' },
    ]
  },
  {
    id: 'rec-2', menuItemId: 'mi-3', menuItemName: 'Menemen', totalCost: 32,
    items: [
      { inventoryItemId: 'inv-5', inventoryItemName: 'Domates', quantity: 0.15, unit: 'kg' },
      { inventoryItemId: 'inv-6', inventoryItemName: 'Yumurta', quantity: 3, unit: 'adet' },
    ]
  },
  {
    id: 'rec-3', menuItemId: 'mi-62', menuItemName: 'Cafe Latte', totalCost: 28,
    items: [
      { inventoryItemId: 'inv-7', inventoryItemName: 'Kahve Çekirdeği', quantity: 0.02, unit: 'kg' },
      { inventoryItemId: 'inv-8', inventoryItemName: 'Süt', quantity: 0.25, unit: 'lt' },
    ]
  },
]

// ─── CUSTOMERS (Empty for production) ─────────────────────────
export const customers: Customer[] = []

// ─── RESERVATIONS (Empty for production) ──────────────────────
export const reservations: Reservation[] = []

// ─── AUDIT LOG (Empty for production) ─────────────────────────
export const auditLogs: AuditLog[] = []

// ─── RESET DATABASE HELPER ────────────────────────────────────
export async function resetDatabaseToCleanState(db: import('@/lib/db').PosDatabase) {
  const tablesTable = db.table('tables');
  await db.transaction('rw',
    [tablesTable, db.orders, db.kitchenTickets, db.payments, db.auditLogs, db.reservations, db.onlineOrders],
    async () => {
      await db.orders.clear()
      await db.kitchenTickets.clear()
      await db.payments.clear()
      await db.auditLogs.clear()
      await db.reservations.clear()
      await db.onlineOrders.clear()
      
      const allTables = await tablesTable.toArray()
      for (const t of allTables) {
        await tablesTable.update(t.id, {
          status: 'available',
          guestCount: 0,
          currentOrderId: undefined,
          waiterId: undefined,
          occupiedAt: undefined
        })
      }
    }
  )
}

// ─── SEED DEFAULT RESTAURANT MENU HELPER ──────────────────────
export async function seedDefaultMenu(db: import('@/lib/db').PosDatabase, force = false) {
  const catCount = await db.categories.count()
  if (catCount === 0 || force) {
    if (force) await db.categories.clear()
    await db.categories.bulkPut(categories)
  }

  const menuCount = await db.menuItems.count()
  if (menuCount === 0 || force) {
    if (force) await db.menuItems.clear()
    await db.menuItems.bulkPut(menuItems)
  } else {
    // Non-destructive update: add standard items if missing
    await db.menuItems.bulkPut(menuItems)
  }
}

// ─── SEED ALL DATA ────────────────────────────────────────────
export async function seedDatabase(db: import('@/lib/db').PosDatabase) {
  // One-time cleanup for users with legacy mock data in browser IndexedDB
  if (typeof window !== 'undefined' && localStorage.getItem('wots_pos_v3_clean_state') !== 'true') {
    try {
      await resetDatabaseToCleanState(db)
      localStorage.setItem('wots_pos_v3_clean_state', 'true')
    } catch (e) {
      console.error('Failed to run clean state migration:', e)
    }
  }

  const tablesTable = db.table('tables');
  const existingFloors = await db.floors.count()
  if (existingFloors === 0) {
    await db.transaction('rw',
      [db.floors, tablesTable, db.categories, db.menuItems, db.staff, db.orders, db.kitchenTickets, db.payments, db.inventoryItems, db.recipes, db.customers, db.reservations, db.auditLogs],
      async () => {
        await db.floors.bulkAdd(floors)
        await tablesTable.bulkAdd(tables)
        await db.categories.bulkAdd(categories)
        await db.menuItems.bulkAdd(menuItems)
        await db.staff.bulkAdd(staffMembers)
        await db.orders.bulkAdd(sampleOrders)
        await db.kitchenTickets.bulkAdd(sampleKitchenTickets)
        await db.payments.bulkAdd(samplePayments)
        await db.inventoryItems.bulkAdd(inventoryItems)
        await db.recipes.bulkAdd(recipes)
        await db.customers.bulkAdd(customers)
        await db.reservations.bulkAdd(reservations)
        await db.auditLogs.bulkAdd(auditLogs)
      }
    )
    return
  }

  // Ensure categories always exist
  const existingCatCount = await db.categories.count()
  if (existingCatCount === 0) {
    await db.categories.bulkPut(categories)
  }

  // Ensure rich restaurant menu items exist
  const existingMenuCount = await db.menuItems.count()
  if (existingMenuCount === 0 || (typeof window !== 'undefined' && localStorage.getItem('wots_pos_v5_rich_menu') !== 'true')) {
    try {
      await db.menuItems.bulkPut(menuItems)
      if (typeof window !== 'undefined') {
        localStorage.setItem('wots_pos_v5_rich_menu', 'true')
      }
    } catch (e) {
      console.error('Failed to seed rich menu items:', e)
    }
  }

  // Ensure staff members have numeric usernames assigned
  try {
    const staffToUpdate = await db.staff.toArray()
    for (const s of staffToUpdate) {
      if (!s.username) {
        const match = staffMembers.find(sm => sm.id === s.id)
        const fallbackUsername = match ? match.username : `100${s.id.replace(/\D/g, '') || Math.floor(Math.random() * 900 + 100)}`
        await db.staff.update(s.id, { username: fallbackUsername })
      }
    }
  } catch {
    // ignore
  }
}
