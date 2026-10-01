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

// ─── CATEGORIES (Scraped from Wot's Cafe - 18 Categories) ───────
export const categories: Category[] = [
  {
    "id": "cat-1",
    "name": "KAHVALTI",
    "icon": "egg",
    "order": 1,
    "color": "bg-amber-100 text-amber-800"
  },
  {
    "id": "cat-2",
    "name": "ATIŞTIRMALIKLAR",
    "icon": "drumstick",
    "order": 2,
    "color": "bg-orange-100 text-orange-800"
  },
  {
    "id": "cat-3",
    "name": "WRAPLAR",
    "icon": "sandwich",
    "order": 3,
    "color": "bg-lime-100 text-lime-800"
  },
  {
    "id": "cat-4",
    "name": "GÖZLEMELER",
    "icon": "utensils",
    "order": 4,
    "color": "bg-yellow-100 text-yellow-800"
  },
  {
    "id": "cat-5",
    "name": "TOSTLAR",
    "icon": "sandwich",
    "order": 5,
    "color": "bg-amber-100 text-amber-900"
  },
  {
    "id": "cat-6",
    "name": "SALATALAR",
    "icon": "salad",
    "order": 6,
    "color": "bg-emerald-100 text-emerald-800"
  },
  {
    "id": "cat-7",
    "name": "MAKARNALAR",
    "icon": "pasta",
    "order": 7,
    "color": "bg-yellow-100 text-yellow-800"
  },
  {
    "id": "cat-8",
    "name": "BURGERLER",
    "icon": "burger",
    "order": 8,
    "color": "bg-red-100 text-red-800"
  },
  {
    "id": "cat-9",
    "name": "PIZZALAR",
    "icon": "pizza",
    "order": 9,
    "color": "bg-orange-100 text-orange-800"
  },
  {
    "id": "cat-10",
    "name": "ANA YEMEKLER",
    "icon": "beef",
    "order": 10,
    "color": "bg-stone-100 text-stone-800"
  },
  {
    "id": "cat-11",
    "name": "IZGARALAR",
    "icon": "flame",
    "order": 11,
    "color": "bg-rose-100 text-rose-800"
  },
  {
    "id": "cat-12",
    "name": "TATLILAR & PASTALAR",
    "icon": "cake",
    "order": 12,
    "color": "bg-pink-100 text-pink-800"
  },
  {
    "id": "cat-13",
    "name": "DONDURMA",
    "icon": "ice-cream",
    "order": 13,
    "color": "bg-teal-100 text-teal-800"
  },
  {
    "id": "cat-14",
    "name": "SICAK İÇECEK",
    "icon": "coffee",
    "order": 14,
    "color": "bg-amber-100 text-amber-900"
  },
  {
    "id": "cat-15",
    "name": "SOĞUK KAHVELER",
    "icon": "coffee",
    "order": 15,
    "color": "bg-sky-100 text-sky-800"
  },
  {
    "id": "cat-16",
    "name": "SOĞUK İÇECEKLER",
    "icon": "glass-water",
    "order": 16,
    "color": "bg-cyan-100 text-cyan-800"
  },
  {
    "id": "cat-17",
    "name": "KOKTEYLLER",
    "icon": "martini",
    "order": 17,
    "color": "bg-purple-100 text-purple-800"
  },
  {
    "id": "cat-18",
    "name": "NARGILE",
    "icon": "flame",
    "order": 18,
    "color": "bg-indigo-100 text-indigo-800"
  }
]

// ─── MENU ITEMS (Scraped from Wot's Cafe - 167 Items) ────────────
export const menuItems: MenuItem[] = [
  {
    "id": "mi-1",
    "categoryId": "cat-1",
    "name": "Serpme Kahvaltı (2 kişilik)",
    "description": "Beyaz peynir, taze kaşar, eski kaşar, keçi peyniri, siyah zeytin, yeşil zeytin, acuka, bal, reçel, çikolata, tahin pekmez, tereyağı, domates, salatalık, mevsim yeşillikleri, patates kızartması, mini paçanga, pankek, pişi, soslu sosis, omlet, sucuk ve sınırsız çay ikramı ile servis edilir.",
    "price": 1050,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-1-1",
        "name": "Ekstra Lezzetler",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-1-1",
            "name": "Ekstra Pişi (3 Adet)",
            "price": 50,
            "group": "Ekstra"
          },
          {
            "id": "mod-mi-1-2",
            "name": "Ekstra Bal & Kaymak",
            "price": 60,
            "group": "Ekstra"
          },
          {
            "id": "mod-mi-1-3",
            "name": "Ekstra Peynir Tabağı",
            "price": 80,
            "group": "Ekstra"
          }
        ]
      }
    ],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-2",
    "categoryId": "cat-1",
    "name": "Kahvaltı Tabağı",
    "description": "Beyaz peynir, taze kaşar, eski kaşar, keçi peyniri, siyah-yeşil zeytin, acuka, bal, çikolata, reçel, haşlanmış yumurta, salatalık, domates, mini paçanga ve çay ile servis edilir.",
    "price": 450,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-3",
    "categoryId": "cat-1",
    "name": "Sade Omlet",
    "description": "",
    "price": 180,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-4",
    "categoryId": "cat-1",
    "name": "Sucuklu Omlet",
    "description": "",
    "price": 230,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-5",
    "categoryId": "cat-1",
    "name": "Sebzeli Omlet",
    "description": "",
    "price": 220,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-6",
    "categoryId": "cat-1",
    "name": "Kavurmalı Omlet",
    "description": "",
    "price": 290,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-7",
    "categoryId": "cat-1",
    "name": "Sahanda Sade Yumurta",
    "description": "",
    "price": 150,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-8",
    "categoryId": "cat-1",
    "name": "Sahanda Kavurmalı Yumurta",
    "description": "",
    "price": 290,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-9",
    "categoryId": "cat-1",
    "name": "Sahanda Sucuklu Yumurta",
    "description": "",
    "price": 230,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-10",
    "categoryId": "cat-1",
    "name": "Kaşarlı Menemen",
    "description": "",
    "price": 190,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-11",
    "categoryId": "cat-1",
    "name": "Sade Menemen",
    "description": "",
    "price": 180,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-11-1",
        "name": "Menemen Ekleme",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-11-1",
            "name": "Kaşar Peynirli",
            "price": 30,
            "group": "Ekleme"
          },
          {
            "id": "mod-mi-11-2",
            "name": "Kasap Sucuklu",
            "price": 50,
            "group": "Ekleme"
          }
        ]
      }
    ],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-12",
    "categoryId": "cat-2",
    "name": "Wot’s Combo Tabağı",
    "description": "Patates kızartması, soğan halkası, mozarella stick, dana sosis, kalem böreği, mini paçanga, çıtır tavuk topları ve özel soslarla servis edilir.",
    "price": 430,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 8,
    "vat": 10
  },
  {
    "id": "mi-13",
    "categoryId": "cat-2",
    "name": "Soğan Halkası Tabağı",
    "description": "",
    "price": 180,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 8,
    "vat": 10
  },
  {
    "id": "mi-14",
    "categoryId": "cat-2",
    "name": "Sosis Tabağı",
    "description": "",
    "price": 230,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 8,
    "vat": 10
  },
  {
    "id": "mi-15",
    "categoryId": "cat-2",
    "name": "Kalem Böreği Tabağı",
    "description": "",
    "price": 200,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 8,
    "vat": 10
  },
  {
    "id": "mi-16",
    "categoryId": "cat-2",
    "name": "Paçanga Böreği",
    "description": "",
    "price": 270,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 8,
    "vat": 10
  },
  {
    "id": "mi-17",
    "categoryId": "cat-2",
    "name": "Chicken Combo Tabağı",
    "description": "Patates kızartması, çıtır tavuk, çıtır baget tavuk, kemiksiz tavuk kanat, soğan halkası, sosis ve özel soslarla servis edilir.",
    "price": 500,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 8,
    "vat": 10
  },
  {
    "id": "mi-18",
    "categoryId": "cat-2",
    "name": "Patates Kızartması",
    "description": "",
    "price": 170,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 8,
    "vat": 10
  },
  {
    "id": "mi-19",
    "categoryId": "cat-2",
    "name": "Kaşık Patates",
    "description": "",
    "price": 200,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 8,
    "vat": 10
  },
  {
    "id": "mi-20",
    "categoryId": "cat-3",
    "name": "Tavuklu Wrap",
    "description": "Tavuk bonfile, renkli biberler, soğan, rende kaşar, patates kızartması, özel soslar ve mini salata ile servis edilir.",
    "price": 450,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 8,
    "vat": 10
  },
  {
    "id": "mi-21",
    "categoryId": "cat-3",
    "name": "Etli Wrap",
    "description": "Jülyen bonfile, renkli biberler, soğan, rende kaşar, patates kızartması, özel soslar ve mini salata ile servis edilir.",
    "price": 530,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 8,
    "vat": 10
  },
  {
    "id": "mi-22",
    "categoryId": "cat-3",
    "name": "Tavuklu Quasedilla",
    "description": "Tavuk bonfile, rende kaşar, patates kızartması ve mini salata ile servis edilir.",
    "price": 470,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 8,
    "vat": 10
  },
  {
    "id": "mi-23",
    "categoryId": "cat-3",
    "name": "Etli Quasedilla",
    "description": "Jülyen bonfile, rende kaşar, patates kızartması ve mini salata ile servis edilir.",
    "price": 570,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 8,
    "vat": 10
  },
  {
    "id": "mi-24",
    "categoryId": "cat-4",
    "name": "Kavurma Kaşarlı Gözleme",
    "description": "Patates kızartması ve mini salata ile servis edilir.",
    "price": 400,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 8,
    "vat": 10
  },
  {
    "id": "mi-25",
    "categoryId": "cat-4",
    "name": "Sucuk Kaşarlı Gözleme",
    "description": "Patates kızartması ve mini salata ile servis edilir.",
    "price": 300,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 8,
    "vat": 10
  },
  {
    "id": "mi-26",
    "categoryId": "cat-4",
    "name": "Patatesli Gözleme",
    "description": "Patates kızartması ve mini salata ile servis edilir.",
    "price": 250,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 8,
    "vat": 10
  },
  {
    "id": "mi-27",
    "categoryId": "cat-4",
    "name": "Beyaz Peynirli Gözleme",
    "description": "Patates kızartması ve mini salata ile servis edilir.",
    "price": 240,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 8,
    "vat": 10
  },
  {
    "id": "mi-28",
    "categoryId": "cat-4",
    "name": "Karışık Gözleme",
    "description": "Patates kızartması ve mini salata ile servis edilir.",
    "price": 350,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 8,
    "vat": 10
  },
  {
    "id": "mi-29",
    "categoryId": "cat-4",
    "name": "Kaşarlı Gözleme",
    "description": "Patates kızartması ve mini salata ile servis edilir.",
    "price": 260,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 8,
    "vat": 10
  },
  {
    "id": "mi-30",
    "categoryId": "cat-5",
    "name": "Karışık Tost",
    "description": "Sucuk, kaşar, patates kızartması ve mini salata ile servis edilir.",
    "price": 270,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 8,
    "vat": 10
  },
  {
    "id": "mi-31",
    "categoryId": "cat-5",
    "name": "Kaşarlı Tost",
    "description": "Kaşar peyniri, patates kızartması ve mini salata ile servis edilir.",
    "price": 200,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 8,
    "vat": 10
  },
  {
    "id": "mi-32",
    "categoryId": "cat-5",
    "name": "Beyaz Peynir-Domatesli Tost",
    "description": "Beyaz peynir, domates, patates kızartması ve mini salata ile servis edilir.",
    "price": 240,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 8,
    "vat": 10
  },
  {
    "id": "mi-33",
    "categoryId": "cat-5",
    "name": "Kavurma Kaşarlı Tost",
    "description": "Patates kızartması ve mini salata ile servis edilir.",
    "price": 320,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 8,
    "vat": 10
  },
  {
    "id": "mi-34",
    "categoryId": "cat-6",
    "name": "Çıtır Tavuk Salata",
    "description": "Çıtır tavuk topları, mevsim yeşillikleri, domates, salatalık, mısır, ballı hardal sos ile servis edilir.",
    "price": 400,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 7,
    "vat": 10
  },
  {
    "id": "mi-35",
    "categoryId": "cat-6",
    "name": "Sezar Salata",
    "description": "Izgara tavuk, iceberg marul, mısır, kruton ekmek, sezar sos, parmesan peyniri, domates, salatalık ile servis edilir.",
    "price": 390,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 7,
    "vat": 10
  },
  {
    "id": "mi-36",
    "categoryId": "cat-6",
    "name": "Ton Balıklı Salata",
    "description": "Mevsim yeşillikleri, mısır, ton balığı, balsamic sirkes, rende kaşar, domates, salatalık ile servis edilir.",
    "price": 390,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 7,
    "vat": 10
  },
  {
    "id": "mi-37",
    "categoryId": "cat-6",
    "name": "Mevsim Salata",
    "description": "",
    "price": 230,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 7,
    "vat": 10
  },
  {
    "id": "mi-38",
    "categoryId": "cat-7",
    "name": "Fettuccini Al Fredo",
    "description": "Fettuccini makarna, mantar, tavuk, pesto sos ve parmesan peyniri ile servis edilir.",
    "price": 400,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-39",
    "categoryId": "cat-7",
    "name": "Penne Al Arabiata",
    "description": "Penne makarna, dilim zeytin, acı napoliten, pesto sos ve parmesan peyniri ile servis edilir.",
    "price": 380,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-40",
    "categoryId": "cat-7",
    "name": "Spagetti Bolognese",
    "description": "Spagetti makarna, kıymalı sos, pesto sos ve parmesan peyniri ile servis edilir.",
    "price": 430,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-41",
    "categoryId": "cat-7",
    "name": "Peynirli Raviolli",
    "description": "İtalyan usulü peynir dolgulu raviolli, pesto sos ve parmesan peyniri ile servis edilir.",
    "price": 400,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-42",
    "categoryId": "cat-7",
    "name": "Mac And Cheese Makarna",
    "description": "Pipet makarna, cheddar peyniri, krema, jalopene biber ve eritilmiş rende kaşar ile servis edilir.",
    "price": 400,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-43",
    "categoryId": "cat-7",
    "name": "Ev Mantısı",
    "description": "Dana kıyma dolgulu, tercihe göre sarımsaklı veya sarımsaksız servis edilir.",
    "price": 360,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-43-1",
        "name": "Yoğurt Tercihi",
        "type": "single",
        "modifiers": [
          {
            "id": "mod-mi-43-1",
            "name": "Sarımsaklı Yoğurt",
            "price": 0,
            "group": "Yoğurt"
          },
          {
            "id": "mod-mi-43-2",
            "name": "Sarımsaksız Yoğurt",
            "price": 0,
            "group": "Yoğurt"
          }
        ]
      }
    ],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-44",
    "categoryId": "cat-8",
    "name": "Classic Burger",
    "description": "Dana köfte, marul, domates, kornişon turşu, patates kızartması ve soğan halkası ile servis edilir.",
    "price": 470,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-44-1",
        "name": "Burger Ekstraları",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-44-1",
            "name": "Ekstra Cheddar Peyniri",
            "price": 40,
            "group": "Ekstra"
          },
          {
            "id": "mod-mi-44-2",
            "name": "Ekstra Dana Bacon",
            "price": 60,
            "group": "Ekstra"
          },
          {
            "id": "mod-mi-44-3",
            "name": "Çift Köfte (Double)",
            "price": 150,
            "group": "Ekstra"
          }
        ]
      }
    ],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-45",
    "categoryId": "cat-8",
    "name": "Cheeseburger",
    "description": "Dana köfte, marul, domates, kornişon turşu, cheddar peyniri, patates kızartması ve soğan halkası ile servis edilir.",
    "price": 500,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-45-1",
        "name": "Burger Ekstraları",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-45-1",
            "name": "Ekstra Cheddar Peyniri",
            "price": 40,
            "group": "Ekstra"
          },
          {
            "id": "mod-mi-45-2",
            "name": "Ekstra Dana Bacon",
            "price": 60,
            "group": "Ekstra"
          },
          {
            "id": "mod-mi-45-3",
            "name": "Çift Köfte (Double)",
            "price": 150,
            "group": "Ekstra"
          }
        ]
      }
    ],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-46",
    "categoryId": "cat-8",
    "name": "Wot'S Burger",
    "description": "İki adet dana köfte, coslow salata, cheddar peyniri, patates kızartması ve soğan halkası ile servis edilir.",
    "price": 700,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-46-1",
        "name": "Burger Ekstraları",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-46-1",
            "name": "Ekstra Cheddar Peyniri",
            "price": 40,
            "group": "Ekstra"
          },
          {
            "id": "mod-mi-46-2",
            "name": "Ekstra Dana Bacon",
            "price": 60,
            "group": "Ekstra"
          },
          {
            "id": "mod-mi-46-3",
            "name": "Çift Köfte (Double)",
            "price": 150,
            "group": "Ekstra"
          }
        ]
      }
    ],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-47",
    "categoryId": "cat-8",
    "name": "Şefin Burgeri",
    "description": "Dana köfte, karamelize soğan, mantar, california biberleri, cheddar peyniri, dana bacon, patates kızartması ve soğan halkası ile servis edilir.",
    "price": 500,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-47-1",
        "name": "Burger Ekstraları",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-47-1",
            "name": "Ekstra Cheddar Peyniri",
            "price": 40,
            "group": "Ekstra"
          },
          {
            "id": "mod-mi-47-2",
            "name": "Ekstra Dana Bacon",
            "price": 60,
            "group": "Ekstra"
          },
          {
            "id": "mod-mi-47-3",
            "name": "Çift Köfte (Double)",
            "price": 150,
            "group": "Ekstra"
          }
        ]
      }
    ],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-48",
    "categoryId": "cat-8",
    "name": "Tavuk Burger",
    "description": "Tavuk köftesi, marul, domates, kornişon turşu, patates kızartması ve soğan halkası ile servis edilir.",
    "price": 450,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-48-1",
        "name": "Burger Ekstraları",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-48-1",
            "name": "Ekstra Cheddar Peyniri",
            "price": 40,
            "group": "Ekstra"
          },
          {
            "id": "mod-mi-48-2",
            "name": "Ekstra Dana Bacon",
            "price": 60,
            "group": "Ekstra"
          },
          {
            "id": "mod-mi-48-3",
            "name": "Çift Köfte (Double)",
            "price": 150,
            "group": "Ekstra"
          }
        ]
      }
    ],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-49",
    "categoryId": "cat-8",
    "name": "Döküm Dana Burger",
    "description": "Dana köfte, marul, domates, kornişon turşu, patates kızartması, soğan halkası ve sıcak cheddar sos ile servis edilir.",
    "price": 500,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-49-1",
        "name": "Burger Ekstraları",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-49-1",
            "name": "Ekstra Cheddar Peyniri",
            "price": 40,
            "group": "Ekstra"
          },
          {
            "id": "mod-mi-49-2",
            "name": "Ekstra Dana Bacon",
            "price": 60,
            "group": "Ekstra"
          },
          {
            "id": "mod-mi-49-3",
            "name": "Çift Köfte (Double)",
            "price": 150,
            "group": "Ekstra"
          }
        ]
      }
    ],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-50",
    "categoryId": "cat-8",
    "name": "Döküm Tavuk Burger",
    "description": "Tavuk köftesi, marul, domates, kornişon turşu, patates kızartması, soğan halkası ve sıcak mantar sos ile servis edilir.",
    "price": 450,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-50-1",
        "name": "Burger Ekstraları",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-50-1",
            "name": "Ekstra Cheddar Peyniri",
            "price": 40,
            "group": "Ekstra"
          },
          {
            "id": "mod-mi-50-2",
            "name": "Ekstra Dana Bacon",
            "price": 60,
            "group": "Ekstra"
          },
          {
            "id": "mod-mi-50-3",
            "name": "Çift Köfte (Double)",
            "price": 150,
            "group": "Ekstra"
          }
        ]
      }
    ],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-51",
    "categoryId": "cat-8",
    "name": "Lokum Burger",
    "description": "Dana bonfile, marul, domates, kornişon turşu, soğan, patates kızartması ve soğan halkası ile servis edilir.",
    "price": 700,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-51-1",
        "name": "Burger Ekstraları",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-51-1",
            "name": "Ekstra Cheddar Peyniri",
            "price": 40,
            "group": "Ekstra"
          },
          {
            "id": "mod-mi-51-2",
            "name": "Ekstra Dana Bacon",
            "price": 60,
            "group": "Ekstra"
          },
          {
            "id": "mod-mi-51-3",
            "name": "Çift Köfte (Double)",
            "price": 150,
            "group": "Ekstra"
          }
        ]
      }
    ],
    "preparationTime": 12,
    "vat": 10
  },
  {
    "id": "mi-52",
    "categoryId": "cat-9",
    "name": "Wots Pizza",
    "description": "Özel napolitan sos, mozzarella peyniri, sucuk, kavurma, pastırma ve mantar ile servis edilir.",
    "price": 600,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-52-1",
        "name": "Pizza Tercihi",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-52-1",
            "name": "Ekstra Mozzarella",
            "price": 45,
            "group": "Ekstra"
          },
          {
            "id": "mod-mi-52-2",
            "name": "Acı Soslu",
            "price": 0,
            "group": "Sos"
          }
        ]
      }
    ],
    "preparationTime": 15,
    "vat": 10
  },
  {
    "id": "mi-53",
    "categoryId": "cat-9",
    "name": "Margherita Pizza",
    "description": "Özel napolitan sos, mozzarella peyniri, pesto sos, domates ve roka ile servis edilir.",
    "price": 400,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-53-1",
        "name": "Pizza Tercihi",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-53-1",
            "name": "Ekstra Mozzarella",
            "price": 45,
            "group": "Ekstra"
          },
          {
            "id": "mod-mi-53-2",
            "name": "Acı Soslu",
            "price": 0,
            "group": "Sos"
          }
        ]
      }
    ],
    "preparationTime": 15,
    "vat": 10
  },
  {
    "id": "mi-54",
    "categoryId": "cat-9",
    "name": "Karışık Pizza",
    "description": "Özel napolitan sos, mozzarella peyniri, sucuk, sosis, biber, dilim zeytin, mantar ve mısır ile servis edilir.",
    "price": 500,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-54-1",
        "name": "Pizza Tercihi",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-54-1",
            "name": "Ekstra Mozzarella",
            "price": 45,
            "group": "Ekstra"
          },
          {
            "id": "mod-mi-54-2",
            "name": "Acı Soslu",
            "price": 0,
            "group": "Sos"
          }
        ]
      }
    ],
    "preparationTime": 15,
    "vat": 10
  },
  {
    "id": "mi-55",
    "categoryId": "cat-9",
    "name": "4 Peynirli Pizza",
    "description": "Özel napolitan sos, mozzarella peyniri, parmesan peyniri, cheddar peyniri, rokfor peyniri ve roka ile servis edilir.",
    "price": 460,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-55-1",
        "name": "Pizza Tercihi",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-55-1",
            "name": "Ekstra Mozzarella",
            "price": 45,
            "group": "Ekstra"
          },
          {
            "id": "mod-mi-55-2",
            "name": "Acı Soslu",
            "price": 0,
            "group": "Sos"
          }
        ]
      }
    ],
    "preparationTime": 15,
    "vat": 10
  },
  {
    "id": "mi-56",
    "categoryId": "cat-10",
    "name": "Körili Tavuk",
    "description": "Tavuk bonfile, renkli biberler, mantar, soğan, pilav, patates kızartması ve mini salata ile servis edilir.",
    "price": 450,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 18,
    "vat": 10
  },
  {
    "id": "mi-57",
    "categoryId": "cat-10",
    "name": "Barbekü Soslu Tavuk",
    "description": "Tavuk bonfile, renkli biberler, mantar, soğan, barbekü sosu, pilav, patates kızartması ve mini salata ile servis edilir.",
    "price": 450,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 18,
    "vat": 10
  },
  {
    "id": "mi-58",
    "categoryId": "cat-10",
    "name": "Soya Soslu Tavuk",
    "description": "Tavuk bonfile, renkli biberler, mantar, soğan, soya sosu, krema, patates kızartması, pilav ve mini salata ile servis edilir.",
    "price": 450,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 18,
    "vat": 10
  },
  {
    "id": "mi-59",
    "categoryId": "cat-10",
    "name": "Sweet Chili Soslu Tavuk",
    "description": "Tavuk bonfile, renkli biberler, mantar, soğan, sweet chili sos, patates kızartması, pilav ve mini salata ile servis edilir.",
    "price": 450,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 18,
    "vat": 10
  },
  {
    "id": "mi-60",
    "categoryId": "cat-10",
    "name": "Çökertme",
    "description": "Juliyen bonfile, kibrit patates, süzme yoğurt, domates sos ve tereyağı ile servis edilir.",
    "price": 520,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 18,
    "vat": 10
  },
  {
    "id": "mi-61",
    "categoryId": "cat-10",
    "name": "Tavuk Schnitzel",
    "description": "Panelenmiş tavuk bonfile, patates salatası, tereyağı, limon ve mini salata ile servis edilir.",
    "price": 400,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 18,
    "vat": 10
  },
  {
    "id": "mi-62",
    "categoryId": "cat-10",
    "name": "Mantar Soslu Tavuk Schnitzel",
    "description": "Panelenmiş tavuk bonfile, patates salatası, mantar sos ve mini salata ile servis edilir.",
    "price": 430,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 18,
    "vat": 10
  },
  {
    "id": "mi-63",
    "categoryId": "cat-10",
    "name": "Mantar Soslu Bonfile",
    "description": "Izgara bonfile, mantar sos, pilav ve patates kızartması ile servis edilir.",
    "price": 850,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 18,
    "vat": 10
  },
  {
    "id": "mi-64",
    "categoryId": "cat-10",
    "name": "Mantar Soslu Tavuk",
    "description": "Izgara tavuk külbastı, mantar sos, pilav, patates kızartması ve mini salata ile servis edilir.",
    "price": 480,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 18,
    "vat": 10
  },
  {
    "id": "mi-65",
    "categoryId": "cat-11",
    "name": "Izgara Köfte",
    "description": "Köfte, pilav, domates, biber, acı sos, kaşık patates ve mini salata ile servis edilir.",
    "price": 600,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 18,
    "vat": 10
  },
  {
    "id": "mi-66",
    "categoryId": "cat-11",
    "name": "Kaşarlı Köfte",
    "description": "Köfte, pilav, domates, biber, acı sos, kaşık patates ve mini salata ile servis edilir.",
    "price": 650,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 18,
    "vat": 10
  },
  {
    "id": "mi-67",
    "categoryId": "cat-11",
    "name": "Izgara Bonfile",
    "description": "Dana bonfile, pilav, domates, biber, kaşık patates ve mini salata ile servis edilir.",
    "price": 830,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 18,
    "vat": 10
  },
  {
    "id": "mi-68",
    "categoryId": "cat-11",
    "name": "Tavuk Şiş",
    "description": "Tavuk but, domates, biber, pilav, kaşık patates, lavaş ve mini salata ile servis edilir.",
    "price": 550,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 18,
    "vat": 10
  },
  {
    "id": "mi-69",
    "categoryId": "cat-11",
    "name": "Kuzu Şiş",
    "description": "Kuzu eti, domates, biber, pilav, kaşık patates, lavaş ve mini salata ile servis edilir.",
    "price": 650,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 18,
    "vat": 10
  },
  {
    "id": "mi-70",
    "categoryId": "cat-11",
    "name": "Kuzu Pirzola",
    "description": "Domates, biber, pilav, kaşık patates, lavaş ve mini salata ile servis edilir.",
    "price": 1000,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 18,
    "vat": 10
  },
  {
    "id": "mi-71",
    "categoryId": "cat-11",
    "name": "Dana Antrikot",
    "description": "Domates, biber, pilav, kaşık patates ve mini salata ile servis edilir.",
    "price": 1000,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 18,
    "vat": 10
  },
  {
    "id": "mi-72",
    "categoryId": "cat-11",
    "name": "Karışık Izgara",
    "description": "Köfte, kaşarlı köfte, tavuk şiş, bonfile, kuzu külbastı, domates, biber, pilav, beğendi ve çubuk patates ile servis edilir.",
    "price": 1250,
    "station": "kitchen",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 18,
    "vat": 10
  },
  {
    "id": "mi-73",
    "categoryId": "cat-12",
    "name": "Waffle",
    "description": "Muz, çilek, çikolata ve süsler ile servis edilir.",
    "price": 320,
    "station": "dessert",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-74",
    "categoryId": "cat-12",
    "name": "Dondurmalı Profiterol",
    "description": "4 top pataşu içinde dondurma ve çikolata ile servis edilir.",
    "price": 320,
    "station": "dessert",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-75",
    "categoryId": "cat-12",
    "name": "Çikolatalı Pankek",
    "description": "Özel sunum ile servis edilir.",
    "price": 300,
    "station": "dessert",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-76",
    "categoryId": "cat-12",
    "name": "Spoonful",
    "description": "",
    "price": 280,
    "station": "dessert",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-77",
    "categoryId": "cat-12",
    "name": "San Sebastian Cheesecake",
    "description": "",
    "price": 300,
    "station": "dessert",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-78",
    "categoryId": "cat-12",
    "name": "Magnolia",
    "description": "",
    "price": 280,
    "station": "dessert",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-79",
    "categoryId": "cat-12",
    "name": "Tiramisu",
    "description": "",
    "price": 280,
    "station": "dessert",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-80",
    "categoryId": "cat-12",
    "name": "Cedric Fıstık",
    "description": "",
    "price": 320,
    "station": "dessert",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-81",
    "categoryId": "cat-12",
    "name": "Profiterol",
    "description": "",
    "price": 280,
    "station": "dessert",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-82",
    "categoryId": "cat-12",
    "name": "Suffle",
    "description": "",
    "price": 300,
    "station": "dessert",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-83",
    "categoryId": "cat-12",
    "name": "Meyve Tabağı",
    "description": "",
    "price": 300,
    "station": "dessert",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-84",
    "categoryId": "cat-13",
    "name": "Cup Dondurma",
    "description": "",
    "price": 180,
    "station": "dessert",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-85",
    "categoryId": "cat-13",
    "name": "Top Dondurma",
    "description": "",
    "price": 60,
    "station": "dessert",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-86",
    "categoryId": "cat-14",
    "name": "Çay",
    "description": "",
    "price": 60,
    "station": "coffee",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-87",
    "categoryId": "cat-14",
    "name": "Fincan Çay",
    "description": "",
    "price": 80,
    "station": "coffee",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-88",
    "categoryId": "cat-14",
    "name": "Bitki Çayları",
    "description": "Yeşil çay, papatya çayı, ıhlamur, kış çayı, adaçayı, hibiskus.",
    "price": 180,
    "station": "coffee",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-89",
    "categoryId": "cat-14",
    "name": "Türk Kahvesi",
    "description": "",
    "price": 120,
    "station": "coffee",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-89-1",
        "name": "Süt & Şurup Seçimi",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-89-1",
            "name": "Yulaf Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-89-2",
            "name": "Soya Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-89-3",
            "name": "Ekstra Espresso Shot",
            "price": 35,
            "group": "Kahve"
          },
          {
            "id": "mod-mi-89-4",
            "name": "Vanilya Şurubu",
            "price": 20,
            "group": "Şurup"
          },
          {
            "id": "mod-mi-89-5",
            "name": "Karamel Şurubu",
            "price": 20,
            "group": "Şurup"
          }
        ]
      }
    ],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-90",
    "categoryId": "cat-14",
    "name": "Double Türk Kahvesi",
    "description": "",
    "price": 150,
    "station": "coffee",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-90-1",
        "name": "Süt & Şurup Seçimi",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-90-1",
            "name": "Yulaf Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-90-2",
            "name": "Soya Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-90-3",
            "name": "Ekstra Espresso Shot",
            "price": 35,
            "group": "Kahve"
          },
          {
            "id": "mod-mi-90-4",
            "name": "Vanilya Şurubu",
            "price": 20,
            "group": "Şurup"
          },
          {
            "id": "mod-mi-90-5",
            "name": "Karamel Şurubu",
            "price": 20,
            "group": "Şurup"
          }
        ]
      }
    ],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-91",
    "categoryId": "cat-14",
    "name": "Damla Sakızlı Türk Kahvesi",
    "description": "",
    "price": 130,
    "station": "coffee",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-91-1",
        "name": "Süt & Şurup Seçimi",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-91-1",
            "name": "Yulaf Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-91-2",
            "name": "Soya Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-91-3",
            "name": "Ekstra Espresso Shot",
            "price": 35,
            "group": "Kahve"
          },
          {
            "id": "mod-mi-91-4",
            "name": "Vanilya Şurubu",
            "price": 20,
            "group": "Şurup"
          },
          {
            "id": "mod-mi-91-5",
            "name": "Karamel Şurubu",
            "price": 20,
            "group": "Şurup"
          }
        ]
      }
    ],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-92",
    "categoryId": "cat-14",
    "name": "Sütlü Sıcak Çikolata",
    "description": "",
    "price": 210,
    "station": "coffee",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-93",
    "categoryId": "cat-14",
    "name": "Beyaz Sıcak Çikolata",
    "description": "",
    "price": 210,
    "station": "coffee",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-94",
    "categoryId": "cat-14",
    "name": "Salep",
    "description": "",
    "price": 190,
    "station": "coffee",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-95",
    "categoryId": "cat-14",
    "name": "Dondurmalı Salep",
    "description": "",
    "price": 220,
    "station": "coffee",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-96",
    "categoryId": "cat-14",
    "name": "Filtre Kahve",
    "description": "",
    "price": 150,
    "station": "coffee",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-96-1",
        "name": "Süt & Şurup Seçimi",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-96-1",
            "name": "Yulaf Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-96-2",
            "name": "Soya Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-96-3",
            "name": "Ekstra Espresso Shot",
            "price": 35,
            "group": "Kahve"
          },
          {
            "id": "mod-mi-96-4",
            "name": "Vanilya Şurubu",
            "price": 20,
            "group": "Şurup"
          },
          {
            "id": "mod-mi-96-5",
            "name": "Karamel Şurubu",
            "price": 20,
            "group": "Şurup"
          }
        ]
      }
    ],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-97",
    "categoryId": "cat-14",
    "name": "Sütlü Kahve",
    "description": "",
    "price": 180,
    "station": "coffee",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-97-1",
        "name": "Süt & Şurup Seçimi",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-97-1",
            "name": "Yulaf Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-97-2",
            "name": "Soya Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-97-3",
            "name": "Ekstra Espresso Shot",
            "price": 35,
            "group": "Kahve"
          },
          {
            "id": "mod-mi-97-4",
            "name": "Vanilya Şurubu",
            "price": 20,
            "group": "Şurup"
          },
          {
            "id": "mod-mi-97-5",
            "name": "Karamel Şurubu",
            "price": 20,
            "group": "Şurup"
          }
        ]
      }
    ],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-98",
    "categoryId": "cat-14",
    "name": "Espresso",
    "description": "",
    "price": 110,
    "station": "coffee",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-98-1",
        "name": "Süt & Şurup Seçimi",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-98-1",
            "name": "Yulaf Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-98-2",
            "name": "Soya Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-98-3",
            "name": "Ekstra Espresso Shot",
            "price": 35,
            "group": "Kahve"
          },
          {
            "id": "mod-mi-98-4",
            "name": "Vanilya Şurubu",
            "price": 20,
            "group": "Şurup"
          },
          {
            "id": "mod-mi-98-5",
            "name": "Karamel Şurubu",
            "price": 20,
            "group": "Şurup"
          }
        ]
      }
    ],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-99",
    "categoryId": "cat-14",
    "name": "Double Espresso",
    "description": "",
    "price": 140,
    "station": "coffee",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-99-1",
        "name": "Süt & Şurup Seçimi",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-99-1",
            "name": "Yulaf Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-99-2",
            "name": "Soya Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-99-3",
            "name": "Ekstra Espresso Shot",
            "price": 35,
            "group": "Kahve"
          },
          {
            "id": "mod-mi-99-4",
            "name": "Vanilya Şurubu",
            "price": 20,
            "group": "Şurup"
          },
          {
            "id": "mod-mi-99-5",
            "name": "Karamel Şurubu",
            "price": 20,
            "group": "Şurup"
          }
        ]
      }
    ],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-100",
    "categoryId": "cat-14",
    "name": "Caffe Latte",
    "description": "",
    "price": 180,
    "station": "coffee",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-100-1",
        "name": "Süt & Şurup Seçimi",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-100-1",
            "name": "Yulaf Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-100-2",
            "name": "Soya Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-100-3",
            "name": "Ekstra Espresso Shot",
            "price": 35,
            "group": "Kahve"
          },
          {
            "id": "mod-mi-100-4",
            "name": "Vanilya Şurubu",
            "price": 20,
            "group": "Şurup"
          },
          {
            "id": "mod-mi-100-5",
            "name": "Karamel Şurubu",
            "price": 20,
            "group": "Şurup"
          }
        ]
      }
    ],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-101",
    "categoryId": "cat-14",
    "name": "Americano",
    "description": "",
    "price": 150,
    "station": "coffee",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-102",
    "categoryId": "cat-14",
    "name": "Cappuccino",
    "description": "",
    "price": 180,
    "station": "coffee",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-102-1",
        "name": "Süt & Şurup Seçimi",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-102-1",
            "name": "Yulaf Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-102-2",
            "name": "Soya Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-102-3",
            "name": "Ekstra Espresso Shot",
            "price": 35,
            "group": "Kahve"
          },
          {
            "id": "mod-mi-102-4",
            "name": "Vanilya Şurubu",
            "price": 20,
            "group": "Şurup"
          },
          {
            "id": "mod-mi-102-5",
            "name": "Karamel Şurubu",
            "price": 20,
            "group": "Şurup"
          }
        ]
      }
    ],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-103",
    "categoryId": "cat-14",
    "name": "Macchiato",
    "description": "",
    "price": 170,
    "station": "coffee",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-104",
    "categoryId": "cat-14",
    "name": "Latte Macchiato",
    "description": "",
    "price": 170,
    "station": "coffee",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-104-1",
        "name": "Süt & Şurup Seçimi",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-104-1",
            "name": "Yulaf Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-104-2",
            "name": "Soya Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-104-3",
            "name": "Ekstra Espresso Shot",
            "price": 35,
            "group": "Kahve"
          },
          {
            "id": "mod-mi-104-4",
            "name": "Vanilya Şurubu",
            "price": 20,
            "group": "Şurup"
          },
          {
            "id": "mod-mi-104-5",
            "name": "Karamel Şurubu",
            "price": 20,
            "group": "Şurup"
          }
        ]
      }
    ],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-105",
    "categoryId": "cat-14",
    "name": "Mocha",
    "description": "",
    "price": 200,
    "station": "coffee",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-105-1",
        "name": "Süt & Şurup Seçimi",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-105-1",
            "name": "Yulaf Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-105-2",
            "name": "Soya Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-105-3",
            "name": "Ekstra Espresso Shot",
            "price": 35,
            "group": "Kahve"
          },
          {
            "id": "mod-mi-105-4",
            "name": "Vanilya Şurubu",
            "price": 20,
            "group": "Şurup"
          },
          {
            "id": "mod-mi-105-5",
            "name": "Karamel Şurubu",
            "price": 20,
            "group": "Şurup"
          }
        ]
      }
    ],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-106",
    "categoryId": "cat-14",
    "name": "White Chocolate Mocha",
    "description": "",
    "price": 200,
    "station": "coffee",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-106-1",
        "name": "Süt & Şurup Seçimi",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-106-1",
            "name": "Yulaf Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-106-2",
            "name": "Soya Sütü",
            "price": 30,
            "group": "Süt"
          },
          {
            "id": "mod-mi-106-3",
            "name": "Ekstra Espresso Shot",
            "price": 35,
            "group": "Kahve"
          },
          {
            "id": "mod-mi-106-4",
            "name": "Vanilya Şurubu",
            "price": 20,
            "group": "Şurup"
          },
          {
            "id": "mod-mi-106-5",
            "name": "Karamel Şurubu",
            "price": 20,
            "group": "Şurup"
          }
        ]
      }
    ],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-107",
    "categoryId": "cat-15",
    "name": "Ice Mocha",
    "description": "",
    "price": 200,
    "station": "coffee",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-108",
    "categoryId": "cat-15",
    "name": "Ice White Mocha",
    "description": "",
    "price": 200,
    "station": "coffee",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-109",
    "categoryId": "cat-15",
    "name": "Ice Latte",
    "description": "",
    "price": 200,
    "station": "coffee",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-110",
    "categoryId": "cat-15",
    "name": "Ice Americano",
    "description": "",
    "price": 160,
    "station": "coffee",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-111",
    "categoryId": "cat-15",
    "name": "Frappe",
    "description": "",
    "price": 200,
    "station": "coffee",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-112",
    "categoryId": "cat-15",
    "name": "Karamelli Frappe",
    "description": "",
    "price": 210,
    "station": "coffee",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-113",
    "categoryId": "cat-15",
    "name": "Ice Hibiscus",
    "description": "",
    "price": 240,
    "station": "coffee",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-114",
    "categoryId": "cat-15",
    "name": "Wotspresso",
    "description": "",
    "price": 250,
    "station": "coffee",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-115",
    "categoryId": "cat-15",
    "name": "Affogato",
    "description": "",
    "price": 170,
    "station": "coffee",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-116",
    "categoryId": "cat-15",
    "name": "Milkshake",
    "description": "Vanilya, muz, çilek, çikolata",
    "price": 220,
    "station": "coffee",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-117",
    "categoryId": "cat-15",
    "name": "Frozen",
    "description": "Çilek, orman meyveli, kavun, karpuz, mango",
    "price": 220,
    "station": "coffee",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-118",
    "categoryId": "cat-16",
    "name": "Su",
    "description": "",
    "price": 60,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-119",
    "categoryId": "cat-16",
    "name": "Soda",
    "description": "",
    "price": 90,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-120",
    "categoryId": "cat-16",
    "name": "Meyveli Soda",
    "description": "Limon, elma, mandalina, vişne, frenk üzümü",
    "price": 90,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-121",
    "categoryId": "cat-16",
    "name": "Churchill",
    "description": "",
    "price": 130,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-122",
    "categoryId": "cat-16",
    "name": "Taze Sıkılmış Portakal Suyu",
    "description": "",
    "price": 200,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-123",
    "categoryId": "cat-16",
    "name": "Coca Cola",
    "description": "Klasik, şekersiz",
    "price": 110,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-124",
    "categoryId": "cat-16",
    "name": "Fanta",
    "description": "",
    "price": 110,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-125",
    "categoryId": "cat-16",
    "name": "Sprite",
    "description": "",
    "price": 110,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-126",
    "categoryId": "cat-16",
    "name": "Ayran",
    "description": "",
    "price": 100,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-127",
    "categoryId": "cat-16",
    "name": "Cappy Meyve Suyu",
    "description": "Vişne, karışık, şeftali",
    "price": 110,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-128",
    "categoryId": "cat-16",
    "name": "Ice Tea",
    "description": "Limon, şeftali, karpuz, çilek, mango",
    "price": 110,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-129",
    "categoryId": "cat-16",
    "name": "Redbull",
    "description": "",
    "price": 180,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-130",
    "categoryId": "cat-16",
    "name": "Wot'S Lemonade",
    "description": "",
    "price": 180,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-131",
    "categoryId": "cat-16",
    "name": "Çilekli Limonata",
    "description": "",
    "price": 200,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 4,
    "vat": 10
  },
  {
    "id": "mi-132",
    "categoryId": "cat-17",
    "name": "Mojito",
    "description": "",
    "price": 220,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-133",
    "categoryId": "cat-17",
    "name": "Çilekli Mojito",
    "description": "",
    "price": 230,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-134",
    "categoryId": "cat-17",
    "name": "Elmalı Mojito",
    "description": "",
    "price": 230,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-135",
    "categoryId": "cat-17",
    "name": "Wots Special",
    "description": "",
    "price": 280,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-136",
    "categoryId": "cat-17",
    "name": "Hawai",
    "description": "",
    "price": 200,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-137",
    "categoryId": "cat-17",
    "name": "Cool Lime",
    "description": "",
    "price": 200,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-138",
    "categoryId": "cat-17",
    "name": "Tropicano",
    "description": "",
    "price": 200,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-139",
    "categoryId": "cat-17",
    "name": "Baby Love",
    "description": "",
    "price": 200,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-140",
    "categoryId": "cat-17",
    "name": "Meyve Partisi",
    "description": "Portakal, ananas ve limon yine bir arada.",
    "price": 250,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-141",
    "categoryId": "cat-17",
    "name": "Cherry Wot’s",
    "description": "Soda serinletir, vişne kan yapar, şeker canlandırır.",
    "price": 250,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-142",
    "categoryId": "cat-17",
    "name": "Cuba Libre",
    "description": "Misket limon, kola, buz ile serinliğin tadına varın.",
    "price": 250,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-143",
    "categoryId": "cat-17",
    "name": "Cosmopolitan",
    "description": "Misket limon, portakal, vişne mayhoş bir tat daha.",
    "price": 250,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-144",
    "categoryId": "cat-17",
    "name": "Acapulco",
    "description": "Hindistan cevizi, ananas, turunç ve krema ile mavi rüya.",
    "price": 250,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-145",
    "categoryId": "cat-17",
    "name": "Gizemli Adam",
    "description": "Anlatamam çok gizli İç zaten beğeneceksin.",
    "price": 300,
    "station": "bar",
    "available": true,
    "modifierGroups": [],
    "preparationTime": 5,
    "vat": 10
  },
  {
    "id": "mi-146",
    "categoryId": "cat-18",
    "name": "Love 66",
    "description": "",
    "price": 500,
    "station": "bar",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-146-1",
        "name": "Nargile Seçenekleri",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-146-1",
            "name": "Buzlu Marpuç",
            "price": 100,
            "group": "Nargile"
          },
          {
            "id": "mod-mi-146-2",
            "name": "Ekstra Kafa",
            "price": 250,
            "group": "Nargile"
          }
        ]
      }
    ],
    "preparationTime": 10,
    "vat": 10
  },
  {
    "id": "mi-147",
    "categoryId": "cat-18",
    "name": "Capuccino",
    "description": "",
    "price": 500,
    "station": "bar",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-147-1",
        "name": "Nargile Seçenekleri",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-147-1",
            "name": "Buzlu Marpuç",
            "price": 100,
            "group": "Nargile"
          },
          {
            "id": "mod-mi-147-2",
            "name": "Ekstra Kafa",
            "price": 250,
            "group": "Nargile"
          }
        ]
      }
    ],
    "preparationTime": 10,
    "vat": 10
  },
  {
    "id": "mi-148",
    "categoryId": "cat-18",
    "name": "Lady Killer",
    "description": "",
    "price": 500,
    "station": "bar",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-148-1",
        "name": "Nargile Seçenekleri",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-148-1",
            "name": "Buzlu Marpuç",
            "price": 100,
            "group": "Nargile"
          },
          {
            "id": "mod-mi-148-2",
            "name": "Ekstra Kafa",
            "price": 250,
            "group": "Nargile"
          }
        ]
      }
    ],
    "preparationTime": 10,
    "vat": 10
  },
  {
    "id": "mi-149",
    "categoryId": "cat-18",
    "name": "Yaban Mersini",
    "description": "",
    "price": 500,
    "station": "bar",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-149-1",
        "name": "Nargile Seçenekleri",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-149-1",
            "name": "Buzlu Marpuç",
            "price": 100,
            "group": "Nargile"
          },
          {
            "id": "mod-mi-149-2",
            "name": "Ekstra Kafa",
            "price": 250,
            "group": "Nargile"
          }
        ]
      }
    ],
    "preparationTime": 10,
    "vat": 10
  },
  {
    "id": "mi-150",
    "categoryId": "cat-18",
    "name": "Portakal",
    "description": "",
    "price": 500,
    "station": "bar",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-150-1",
        "name": "Nargile Seçenekleri",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-150-1",
            "name": "Buzlu Marpuç",
            "price": 100,
            "group": "Nargile"
          },
          {
            "id": "mod-mi-150-2",
            "name": "Ekstra Kafa",
            "price": 250,
            "group": "Nargile"
          }
        ]
      }
    ],
    "preparationTime": 10,
    "vat": 10
  },
  {
    "id": "mi-151",
    "categoryId": "cat-18",
    "name": "Nane",
    "description": "",
    "price": 500,
    "station": "bar",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-151-1",
        "name": "Nargile Seçenekleri",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-151-1",
            "name": "Buzlu Marpuç",
            "price": 100,
            "group": "Nargile"
          },
          {
            "id": "mod-mi-151-2",
            "name": "Ekstra Kafa",
            "price": 250,
            "group": "Nargile"
          }
        ]
      }
    ],
    "preparationTime": 10,
    "vat": 10
  },
  {
    "id": "mi-152",
    "categoryId": "cat-18",
    "name": "Şeftali",
    "description": "",
    "price": 500,
    "station": "bar",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-152-1",
        "name": "Nargile Seçenekleri",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-152-1",
            "name": "Buzlu Marpuç",
            "price": 100,
            "group": "Nargile"
          },
          {
            "id": "mod-mi-152-2",
            "name": "Ekstra Kafa",
            "price": 250,
            "group": "Nargile"
          }
        ]
      }
    ],
    "preparationTime": 10,
    "vat": 10
  },
  {
    "id": "mi-153",
    "categoryId": "cat-18",
    "name": "Çilek",
    "description": "",
    "price": 500,
    "station": "bar",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-153-1",
        "name": "Nargile Seçenekleri",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-153-1",
            "name": "Buzlu Marpuç",
            "price": 100,
            "group": "Nargile"
          },
          {
            "id": "mod-mi-153-2",
            "name": "Ekstra Kafa",
            "price": 250,
            "group": "Nargile"
          }
        ]
      }
    ],
    "preparationTime": 10,
    "vat": 10
  },
  {
    "id": "mi-154",
    "categoryId": "cat-18",
    "name": "Kavun",
    "description": "",
    "price": 500,
    "station": "bar",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-154-1",
        "name": "Nargile Seçenekleri",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-154-1",
            "name": "Buzlu Marpuç",
            "price": 100,
            "group": "Nargile"
          },
          {
            "id": "mod-mi-154-2",
            "name": "Ekstra Kafa",
            "price": 250,
            "group": "Nargile"
          }
        ]
      }
    ],
    "preparationTime": 10,
    "vat": 10
  },
  {
    "id": "mi-155",
    "categoryId": "cat-18",
    "name": "Karpuz",
    "description": "",
    "price": 500,
    "station": "bar",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-155-1",
        "name": "Nargile Seçenekleri",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-155-1",
            "name": "Buzlu Marpuç",
            "price": 100,
            "group": "Nargile"
          },
          {
            "id": "mod-mi-155-2",
            "name": "Ekstra Kafa",
            "price": 250,
            "group": "Nargile"
          }
        ]
      }
    ],
    "preparationTime": 10,
    "vat": 10
  },
  {
    "id": "mi-156",
    "categoryId": "cat-18",
    "name": "Elma",
    "description": "",
    "price": 500,
    "station": "bar",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-156-1",
        "name": "Nargile Seçenekleri",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-156-1",
            "name": "Buzlu Marpuç",
            "price": 100,
            "group": "Nargile"
          },
          {
            "id": "mod-mi-156-2",
            "name": "Ekstra Kafa",
            "price": 250,
            "group": "Nargile"
          }
        ]
      }
    ],
    "preparationTime": 10,
    "vat": 10
  },
  {
    "id": "mi-157",
    "categoryId": "cat-18",
    "name": "Damla Sakızı",
    "description": "",
    "price": 500,
    "station": "bar",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-157-1",
        "name": "Nargile Seçenekleri",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-157-1",
            "name": "Buzlu Marpuç",
            "price": 100,
            "group": "Nargile"
          },
          {
            "id": "mod-mi-157-2",
            "name": "Ekstra Kafa",
            "price": 250,
            "group": "Nargile"
          }
        ]
      }
    ],
    "preparationTime": 10,
    "vat": 10
  },
  {
    "id": "mi-158",
    "categoryId": "cat-18",
    "name": "Wot’s Special",
    "description": "",
    "price": 600,
    "station": "bar",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-158-1",
        "name": "Nargile Seçenekleri",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-158-1",
            "name": "Buzlu Marpuç",
            "price": 100,
            "group": "Nargile"
          },
          {
            "id": "mod-mi-158-2",
            "name": "Ekstra Kafa",
            "price": 250,
            "group": "Nargile"
          }
        ]
      }
    ],
    "preparationTime": 10,
    "vat": 10
  },
  {
    "id": "mi-159",
    "categoryId": "cat-18",
    "name": "Kola",
    "description": "",
    "price": 500,
    "station": "bar",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-159-1",
        "name": "Nargile Seçenekleri",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-159-1",
            "name": "Buzlu Marpuç",
            "price": 100,
            "group": "Nargile"
          },
          {
            "id": "mod-mi-159-2",
            "name": "Ekstra Kafa",
            "price": 250,
            "group": "Nargile"
          }
        ]
      }
    ],
    "preparationTime": 10,
    "vat": 10
  },
  {
    "id": "mi-160",
    "categoryId": "cat-18",
    "name": "Anason",
    "description": "",
    "price": 500,
    "station": "bar",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-160-1",
        "name": "Nargile Seçenekleri",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-160-1",
            "name": "Buzlu Marpuç",
            "price": 100,
            "group": "Nargile"
          },
          {
            "id": "mod-mi-160-2",
            "name": "Ekstra Kafa",
            "price": 250,
            "group": "Nargile"
          }
        ]
      }
    ],
    "preparationTime": 10,
    "vat": 10
  },
  {
    "id": "mi-161",
    "categoryId": "cat-18",
    "name": "Üzüm",
    "description": "",
    "price": 500,
    "station": "bar",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-161-1",
        "name": "Nargile Seçenekleri",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-161-1",
            "name": "Buzlu Marpuç",
            "price": 100,
            "group": "Nargile"
          },
          {
            "id": "mod-mi-161-2",
            "name": "Ekstra Kafa",
            "price": 250,
            "group": "Nargile"
          }
        ]
      }
    ],
    "preparationTime": 10,
    "vat": 10
  },
  {
    "id": "mi-162",
    "categoryId": "cat-18",
    "name": "Vivident",
    "description": "",
    "price": 500,
    "station": "bar",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-162-1",
        "name": "Nargile Seçenekleri",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-162-1",
            "name": "Buzlu Marpuç",
            "price": 100,
            "group": "Nargile"
          },
          {
            "id": "mod-mi-162-2",
            "name": "Ekstra Kafa",
            "price": 250,
            "group": "Nargile"
          }
        ]
      }
    ],
    "preparationTime": 10,
    "vat": 10
  },
  {
    "id": "mi-163",
    "categoryId": "cat-18",
    "name": "Redbull",
    "description": "",
    "price": 500,
    "station": "bar",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-163-1",
        "name": "Nargile Seçenekleri",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-163-1",
            "name": "Buzlu Marpuç",
            "price": 100,
            "group": "Nargile"
          },
          {
            "id": "mod-mi-163-2",
            "name": "Ekstra Kafa",
            "price": 250,
            "group": "Nargile"
          }
        ]
      }
    ],
    "preparationTime": 10,
    "vat": 10
  },
  {
    "id": "mi-164",
    "categoryId": "cat-18",
    "name": "Dejavu",
    "description": "",
    "price": 500,
    "station": "bar",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-164-1",
        "name": "Nargile Seçenekleri",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-164-1",
            "name": "Buzlu Marpuç",
            "price": 100,
            "group": "Nargile"
          },
          {
            "id": "mod-mi-164-2",
            "name": "Ekstra Kafa",
            "price": 250,
            "group": "Nargile"
          }
        ]
      }
    ],
    "preparationTime": 10,
    "vat": 10
  },
  {
    "id": "mi-165",
    "categoryId": "cat-18",
    "name": "İzmir Romantik",
    "description": "",
    "price": 500,
    "station": "bar",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-165-1",
        "name": "Nargile Seçenekleri",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-165-1",
            "name": "Buzlu Marpuç",
            "price": 100,
            "group": "Nargile"
          },
          {
            "id": "mod-mi-165-2",
            "name": "Ekstra Kafa",
            "price": 250,
            "group": "Nargile"
          }
        ]
      }
    ],
    "preparationTime": 10,
    "vat": 10
  },
  {
    "id": "mi-166",
    "categoryId": "cat-18",
    "name": "Ektra Kafa",
    "description": "",
    "price": 250,
    "station": "bar",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-166-1",
        "name": "Nargile Seçenekleri",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-166-1",
            "name": "Buzlu Marpuç",
            "price": 100,
            "group": "Nargile"
          },
          {
            "id": "mod-mi-166-2",
            "name": "Ekstra Kafa",
            "price": 250,
            "group": "Nargile"
          }
        ]
      }
    ],
    "preparationTime": 10,
    "vat": 10
  },
  {
    "id": "mi-167",
    "categoryId": "cat-18",
    "name": "Buzlu Marpuç",
    "description": "",
    "price": 100,
    "station": "bar",
    "available": true,
    "modifierGroups": [
      {
        "id": "mg-mi-167-1",
        "name": "Nargile Seçenekleri",
        "type": "multiple",
        "modifiers": [
          {
            "id": "mod-mi-167-1",
            "name": "Buzlu Marpuç",
            "price": 100,
            "group": "Nargile"
          },
          {
            "id": "mod-mi-167-2",
            "name": "Ekstra Kafa",
            "price": 250,
            "group": "Nargile"
          }
        ]
      }
    ],
    "preparationTime": 10,
    "vat": 10
  }
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
  { id: 'staff-dev', name: 'Sistem Geliştirici (Dev)', username: 'developer', role: 'developer', pin: '0000', active: true },
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
export const recipes: Recipe[] = [
  {
    id: 'rec-1', menuItemId: 'mi-42', menuItemName: "Classic Burger", totalCost: 140,
    items: [
      { inventoryItemId: 'inv-1', inventoryItemName: 'Dana Kıyma', quantity: 0.18, unit: 'kg' },
      { inventoryItemId: 'inv-3', inventoryItemName: 'Burger Ekmeği', quantity: 1, unit: 'adet' },
      { inventoryItemId: 'inv-4', inventoryItemName: 'Mozzarella', quantity: 0.04, unit: 'kg' },
      { inventoryItemId: 'inv-5', inventoryItemName: 'Domates', quantity: 0.05, unit: 'kg' },
    ]
  },
  {
    id: 'rec-2', menuItemId: 'mi-11', menuItemName: 'Sade Menemen', totalCost: 45,
    items: [
      { inventoryItemId: 'inv-5', inventoryItemName: 'Domates', quantity: 0.15, unit: 'kg' },
      { inventoryItemId: 'inv-6', inventoryItemName: 'Yumurta', quantity: 3, unit: 'adet' },
    ]
  },
  {
    id: 'rec-3', menuItemId: 'mi-94', menuItemName: 'Caffe Latte', totalCost: 35,
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

  // Ensure latest scraped Wot's Cafe menu is applied to IndexedDB
  if (typeof window !== 'undefined' && localStorage.getItem('wots_pos_v7_scraped_wots_menu') !== 'true') {
    try {
      await db.categories.clear()
      await db.categories.bulkPut(categories)
      await db.menuItems.clear()
      await db.menuItems.bulkPut(menuItems)
      localStorage.setItem('wots_pos_v7_scraped_wots_menu', 'true')
    } catch (e) {
      console.error('Failed to update scraped menu items:', e)
    }
  }

  // Ensure categories always exist
  const existingCatCount = await db.categories.count()
  if (existingCatCount === 0) {
    await db.categories.bulkPut(categories)
  }

  // Ensure rich restaurant menu items exist
  const existingMenuCount = await db.menuItems.count()
  if (existingMenuCount === 0) {
    try {
      await db.menuItems.bulkPut(menuItems)
    } catch (e) {
      console.error('Failed to seed menu items:', e)
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
    // Ensure staff-dev exists in db
    const devUser = await db.staff.get('staff-dev')
    if (!devUser) {
      await db.staff.put({
        id: 'staff-dev',
        name: 'Sistem Geliştirici (Dev)',
        username: 'developer',
        role: 'developer',
        pin: '0000',
        active: true
      })
    }
  } catch {
    // ignore
  }
}
