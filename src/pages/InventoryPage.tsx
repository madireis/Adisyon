import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useApp } from '@/lib/store';
import { 
  Package, 
  BookOpen, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  X, 
  ChefHat, 
  Search, 
  ArrowUpDown, 
  Filter, 
  Download, 
  Edit3, 
  Barcode, 
  Calendar, 
  MapPin, 
  Phone, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Boxes, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { cn, formatCurrency, generateId } from '@/lib/utils';
import { usePermissions } from '@/lib/permissions';
import type { InventoryItem, InventoryItemType, Recipe, RecipeItem, MenuItem } from '@/types/pos';

// Predefined categories for quick selection
const INVENTORY_CATEGORIES = [
  'İçecekler & Bar',
  'Et, Tavuk & Şarküteri',
  'Süt & Süt Ürünleri',
  'Sebze & Yeşillik',
  'Meyve',
  'Kuru Gıda & Bakliyat',
  'Un, Maya & Fırın',
  'Soslar, Sıvı Yağ & Baharat',
  'Tatlı & Dondurma',
  'Kahve, Çay & Şurup',
  'Ambalaj & Servis Sarf',
  'Temizlik & Hijyen',
  'Diğer',
];

// Predefined storage locations
const STORAGE_LOCATIONS = [
  'Ana Depo',
  'Soğuk Hava Deposu (+4°C)',
  'Derin Dondurucu (-18°C)',
  'Mutfak Kileri',
  'Bar Dolabı',
  'Kasa Altı / Ön Servis',
  'Kuru Gıda Rafı',
  'Servis İstasyonu',
];

// Measurement units
const MEASUREMENT_UNITS = [
  { value: 'adet', label: 'Adet' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'gr', label: 'Gram (gr)' },
  { value: 'lt', label: 'Litre (lt)' },
  { value: 'ml', label: 'Mililitre (ml)' },
  { value: 'porsiyon', label: 'Porsiyon' },
  { value: 'koli', label: 'Koli' },
  { value: 'paket', label: 'Paket' },
  { value: 'şişe', label: 'Şişe' },
  { value: 'kutu', label: 'Kutu' },
  { value: 'teneke', label: 'Teneke' },
];

export default function InventoryPage() {
  const { state } = useApp();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('canManageInventory') || state.currentUser?.role === 'owner' || state.currentUser?.role === 'manager';

  const [activeTab, setActiveTab] = useState<'STOCK' | 'RECIPES'>('STOCK');

  // Queries
  const inventoryItems = useLiveQuery(() => db.inventoryItems.toArray()) || [];
  const recipes = useLiveQuery(() => db.recipes.toArray()) || [];
  const menuItems = useLiveQuery(() => db.menuItems.toArray()) || [];

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CRITICAL' | 'EMPTY' | 'OK'>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');

  // Add / Edit Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form Fields (Tüm Detaylar)
  const [formName, setFormName] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState('İçecekler & Bar');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formType, setFormType] = useState<InventoryItemType>('product');
  const [formMenuItemId, setFormMenuItemId] = useState('');
  const [formUnit, setFormUnit] = useState('adet');
  const [formCurrentStock, setFormCurrentStock] = useState<number>(10);
  const [formMinimumStock, setFormMinimumStock] = useState<number>(5);
  const [formMaximumStock, setFormMaximumStock] = useState<number>(50);
  const [formPackQuantity, setFormPackQuantity] = useState<number>(1);
  const [formPurchaseCost, setFormPurchaseCost] = useState<number>(20);
  const [formSalePrice, setFormSalePrice] = useState<number>(45);
  const [formTaxRate, setFormTaxRate] = useState<number>(10);
  const [formSupplier, setFormSupplier] = useState('');
  const [formSupplierPhone, setFormSupplierPhone] = useState('');
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formStorageLocation, setFormStorageLocation] = useState('Ana Depo');
  const [formShelfNumber, setFormShelfNumber] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formLotNumber, setFormLotNumber] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Quick Stock Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustTargetItem, setAdjustTargetItem] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'set'>('in');
  const [adjustAmount, setAdjustAmount] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState('Yeni Sevkiyat / Alım Faturası');
  const [adjustNote, setAdjustNote] = useState('');

  // Add Recipe Modal State
  const [isAddRecipeModalOpen, setIsAddRecipeModalOpen] = useState(false);
  const [recipeMenuItemId, setRecipeMenuItemId] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState<{ inventoryItemId: string; quantity: number }[]>([]);

  // Open modal for NEW item
  const handleOpenNewModal = () => {
    setEditingItemId(null);
    setFormName('');
    setFormBarcode('');
    setFormCode(`STK-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormCategory('İçecekler & Bar');
    setFormCustomCategory('');
    setFormType('product');
    setFormMenuItemId('');
    setFormUnit('adet');
    setFormCurrentStock(10);
    setFormMinimumStock(5);
    setFormMaximumStock(50);
    setFormPackQuantity(1);
    setFormPurchaseCost(20);
    setFormSalePrice(45);
    setFormTaxRate(10);
    setFormSupplier('');
    setFormSupplierPhone('');
    setFormInvoiceNumber('');
    setFormStorageLocation('Ana Depo');
    setFormShelfNumber('');
    setFormExpiryDate('');
    setFormLotNumber('');
    setFormNotes('');
    setIsFormModalOpen(true);
  };

  // Open modal for EDITING item
  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setFormName(item.name);
    setFormBarcode(item.barcode || '');
    setFormCode(item.code || '');
    if (INVENTORY_CATEGORIES.includes(item.category || '')) {
      setFormCategory(item.category || 'İçecekler & Bar');
      setFormCustomCategory('');
    } else {
      setFormCategory('Diğer');
      setFormCustomCategory(item.category || '');
    }
    setFormType(item.type || 'product');
    setFormMenuItemId(item.menuItemId || '');
    setFormUnit(item.unit || 'adet');
    setFormCurrentStock(item.currentStock || 0);
    setFormMinimumStock(item.minimumStock || 0);
    setFormMaximumStock(item.maximumStock || 50);
    setFormPackQuantity(item.packQuantity || 1);
    setFormPurchaseCost(item.purchaseCost || 0);
    setFormSalePrice(item.salePrice || 0);
    setFormTaxRate(item.taxRate || 10);
    setFormSupplier(item.supplier || '');
    setFormSupplierPhone(item.supplierPhone || '');
    setFormInvoiceNumber(item.invoiceNumber || '');
    setFormStorageLocation(item.storageLocation || 'Ana Depo');
    setFormShelfNumber(item.shelfNumber || '');
    setFormExpiryDate(item.expiryDate ? item.expiryDate.split('T')[0] : '');
    setFormLotNumber(item.lotNumber || '');
    setFormNotes(item.notes || '');
    setIsFormModalOpen(true);
  };

  // Generate random barcode
  const handleGenerateBarcode = () => {
    const randomCode = '869' + Math.floor(1000000000 + Math.random() * 9000000000).toString().slice(0, 10);
    setFormBarcode(randomCode);
  };

  // Save new or edited item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Lütfen ürün / malzeme adını giriniz.');
      return;
    }

    const finalCategory = formCategory === 'Diğer' && formCustomCategory.trim() 
      ? formCustomCategory.trim() 
      : formCategory;

    const nowIso = new Date().toISOString();
    const itemData: InventoryItem = {
      id: editingItemId || generateId(),
      name: formName.trim(),
      barcode: formBarcode.trim() || undefined,
      code: formCode.trim() || undefined,
      category: finalCategory,
      type: formType,
      menuItemId: formMenuItemId || undefined,
      unit: formUnit,
      currentStock: Number(formCurrentStock) || 0,
      minimumStock: Number(formMinimumStock) || 0,
      maximumStock: Number(formMaximumStock) || undefined,
      packQuantity: Number(formPackQuantity) || 1,
      purchaseCost: Number(formPurchaseCost) || 0,
      salePrice: formType === 'product' ? (Number(formSalePrice) || 0) : undefined,
      taxRate: Number(formTaxRate) || 10,
      supplier: formSupplier.trim() || 'Genel Tedarikçi',
      supplierPhone: formSupplierPhone.trim() || undefined,
      invoiceNumber: formInvoiceNumber.trim() || undefined,
      storageLocation: formStorageLocation,
      shelfNumber: formShelfNumber.trim() || undefined,
      expiryDate: formExpiryDate ? new Date(formExpiryDate).toISOString() : undefined,
      lotNumber: formLotNumber.trim() || undefined,
      notes: formNotes.trim() || undefined,
      lastUpdated: nowIso,
      createdAt: editingItemId ? undefined : nowIso,
    };

    try {
      if (editingItemId) {
        await db.inventoryItems.update(editingItemId, itemData);
        await db.auditLogs.add({
          id: generateId(),
          userId: state.currentUser?.id || 'staff-1',
          userName: state.currentUser?.name || 'Yönetici',
          action: 'Stok Güncelleme',
          details: `"${itemData.name}" stok bilgileri güncellendi. Yeni stok: ${itemData.currentStock} ${itemData.unit}`,
          entityType: 'inventory',
          entityId: editingItemId,
          timestamp: nowIso,
        });
      } else {
        await db.inventoryItems.add(itemData);
        await db.auditLogs.add({
          id: generateId(),
          userId: state.currentUser?.id || 'staff-1',
          userName: state.currentUser?.name || 'Yönetici',
          action: 'Yeni Stok Eklendi',
          details: `"${itemData.name}" sisteme eklendi. Başlangıç stoku: ${itemData.currentStock} ${itemData.unit} (${formatCurrency(itemData.purchaseCost)})`,
          entityType: 'inventory',
          entityId: itemData.id,
          timestamp: nowIso,
        });
      }

      setIsFormModalOpen(false);
    } catch (err: any) {
      console.error('Stok kaydedilemedi:', err);
      alert('Stok kaydedilirken hata oluştu: ' + (err?.message || err));
    }
  };

  // Open quick stock adjust modal
  const handleOpenAdjustModal = (item: InventoryItem, defaultType: 'in' | 'out' = 'in') => {
    setAdjustTargetItem(item);
    setAdjustType(defaultType);
    setAdjustAmount(1);
    setAdjustReason(defaultType === 'in' ? 'Yeni Sevkiyat / Alım Faturası' : 'Zayi / Bozulma / Dökülme');
    setAdjustNote('');
    setIsAdjustModalOpen(true);
  };

  // Save quick stock adjustment
  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetItem) return;

    const amount = Number(adjustAmount) || 0;
    if (amount <= 0 && adjustType !== 'set') {
      alert('Lütfen geçerli bir miktar girin.');
      return;
    }

    let newStock = adjustTargetItem.currentStock;
    if (adjustType === 'in') {
      newStock += amount;
    } else if (adjustType === 'out') {
      newStock = Math.max(0, newStock - amount);
    } else if (adjustType === 'set') {
      newStock = Math.max(0, amount);
    }

    const nowIso = new Date().toISOString();
    try {
      await db.inventoryItems.update(adjustTargetItem.id, {
        currentStock: newStock,
        lastUpdated: nowIso,
      });

      await db.auditLogs.add({
        id: generateId(),
        userId: state.currentUser?.id || 'staff-1',
        userName: state.currentUser?.name || 'Personel',
        action: 'Stok Hareketi',
        details: `${adjustTargetItem.name}: ${adjustType === 'in' ? '+' : adjustType === 'out' ? '-' : 'Ayarlanan: '}${amount} ${adjustTargetItem.unit}. Sebep: ${adjustReason} ${adjustNote ? `(${adjustNote})` : ''}. Yeni Stok: ${newStock} ${adjustTargetItem.unit}`,
        entityType: 'inventory',
        entityId: adjustTargetItem.id,
        timestamp: nowIso,
      });

      setIsAdjustModalOpen(false);
      setAdjustTargetItem(null);
    } catch (err: any) {
      console.error('Stok hareketi işlenemedi:', err);
      alert('Hata: ' + (err?.message || err));
    }
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    if (!canManage) {
      alert('Stok silme yetkiniz bulunmamaktadır.');
      return;
    }
    if (window.confirm(`"${item.name}" ürününü stok listesinden tamamen silmek istediğinize emin misiniz?`)) {
      await db.inventoryItems.delete(item.id);
      await db.auditLogs.add({
        id: generateId(),
        userId: state.currentUser?.id || 'staff-1',
        userName: state.currentUser?.name || 'Yönetici',
        action: 'Stok Silme',
        details: `"${item.name}" stoktan tamamen silindi.`,
        entityType: 'inventory',
        entityId: item.id,
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Recipe Handlers
  const handleDeleteRecipe = async (recipe: Recipe) => {
    if (window.confirm(`"${recipe.menuItemName}" reçetesini silmek istediğinize emin misiniz?`)) {
      await db.recipes.delete(recipe.id);
    }
  };

  const handleAddIngredientRow = () => {
    if (inventoryItems.length === 0) return;
    setRecipeIngredients(prev => [...prev, { inventoryItemId: inventoryItems[0].id, quantity: 1 }]);
  };

  const handleRemoveIngredientRow = (index: number) => {
    setRecipeIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: 'inventoryItemId' | 'quantity', value: any) => {
    setRecipeIngredients(prev => prev.map((row, i) => {
      if (i === index) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const openAddRecipeModal = () => {
    if (menuItems.length === 0) {
      alert('Önce menüden bir ürün oluşturmalısınız.');
      return;
    }
    if (inventoryItems.length === 0) {
      alert('Önce depoya malzeme veya hammadde eklemelisiniz.');
      return;
    }
    setRecipeMenuItemId(menuItems[0]?.id || '');
    setRecipeIngredients([{ inventoryItemId: inventoryItems[0]?.id, quantity: 1 }]);
    setIsAddRecipeModalOpen(true);
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    const menuItem = menuItems.find(m => m.id === recipeMenuItemId);
    if (!menuItem) {
      alert('Lütfen bir menü ürünü seçin.');
      return;
    }

    if (recipeIngredients.length === 0) {
      alert('En az bir malzeme eklemelisiniz.');
      return;
    }

    try {
      let calculatedCost = 0;
      const items: RecipeItem[] = [];

      for (const ing of recipeIngredients) {
        const inv = inventoryItems.find(i => i.id === ing.inventoryItemId);
        if (inv) {
          const lineCost = (inv.purchaseCost || 0) * (Number(ing.quantity) || 0);
          calculatedCost += lineCost;
          items.push({
            inventoryItemId: inv.id,
            inventoryItemName: inv.name,
            quantity: Number(ing.quantity) || 0,
            unit: inv.unit,
          });
        }
      }

      const newRecipe: Recipe = {
        id: generateId(),
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        totalCost: Math.round(calculatedCost),
        items,
      };

      await db.recipes.add(newRecipe);
      setIsAddRecipeModalOpen(false);
    } catch (err: any) {
      console.error('Reçete eklenemedi:', err);
      alert('Reçete kaydedilirken hata oluştu: ' + (err?.message || err));
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (inventoryItems.length === 0) {
      alert('Dışa aktarılacak stok verisi bulunmuyor.');
      return;
    }

    const headers = [
      'Stok Kodu',
      'Ürün Adı',
      'Barkod',
      'Kategori',
      'Tür',
      'Mevcut Stok',
      'Birim',
      'Kritik Eşik',
      'Birim Alış (TL)',
      'Satış Fiyatı (TL)',
      'Tedarikçi',
      'Depo Konumu',
      'Raf No',
      'Son Kullanma Tarihi',
      'Son Güncelleme'
    ];

    const rows = inventoryItems.map(i => [
      i.code || '',
      `"${(i.name || '').replace(/"/g, '""')}"`,
      i.barcode || '',
      `"${(i.category || '').replace(/"/g, '""')}"`,
      i.type === 'product' ? 'Satış Ürünü' : i.type === 'consumable' ? 'Sarf' : 'Hammadde',
      i.currentStock,
      i.unit,
      i.minimumStock,
      i.purchaseCost,
      i.salePrice || '',
      `"${(i.supplier || '').replace(/"/g, '""')}"`,
      `"${(i.storageLocation || '').replace(/"/g, '""')}"`,
      i.shelfNumber || '',
      i.expiryDate ? i.expiryDate.split('T')[0] : '',
      i.lastUpdated ? i.lastUpdated.split('T')[0] : ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Adisyon-Stok-Raporu-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPI Calculations
  const totalItemsCount = inventoryItems.length;
  const criticalItems = useMemo(() => {
    return inventoryItems.filter(i => i.currentStock <= i.minimumStock);
  }, [inventoryItems]);

  const emptyItems = useMemo(() => {
    return inventoryItems.filter(i => i.currentStock === 0);
  }, [inventoryItems]);

  const totalInventoryValue = useMemo(() => {
    return inventoryItems.reduce((acc, i) => acc + (i.currentStock * (i.purchaseCost || 0)), 0);
  }, [inventoryItems]);

  const expiringSoonCount = useMemo(() => {
    const now = new Date().getTime();
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    return inventoryItems.filter(i => {
      if (!i.expiryDate) return false;
      const exp = new Date(i.expiryDate).getTime();
      return exp >= now && exp - now <= fourteenDaysMs;
    }).length;
  }, [inventoryItems]);

  // Categories list from existing items
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    inventoryItems.forEach(i => {
      if (i.category) set.add(i.category);
    });
    INVENTORY_CATEGORIES.forEach(c => set.add(c));
    return Array.from(set);
  }, [inventoryItems]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesBarcode = (item.barcode || '').toLowerCase().includes(q);
        const matchesCode = (item.code || '').toLowerCase().includes(q);
        const matchesSupplier = (item.supplier || '').toLowerCase().includes(q);
        if (!matchesName && !matchesBarcode && !matchesCode && !matchesSupplier) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      // Type
      if (selectedType !== 'ALL' && item.type !== selectedType) {
        return false;
      }

      // Location
      if (selectedLocation !== 'ALL' && item.storageLocation !== selectedLocation) {
        return false;
      }

      // Status
      if (statusFilter === 'CRITICAL' && item.currentStock > item.minimumStock) {
        return false;
      }
      if (statusFilter === 'EMPTY' && item.currentStock !== 0) {
        return false;
      }
      if (statusFilter === 'OK' && item.currentStock <= item.minimumStock) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort critical items to top, then alphabetical
      const aCrit = a.currentStock <= a.minimumStock;
      const bCrit = b.currentStock <= b.minimumStock;
      if (aCrit && !bCrit) return -1;
      if (!aCrit && bCrit) return 1;
      return a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' });
    });
  }, [inventoryItems, searchTerm, selectedCategory, selectedType, selectedLocation, statusFilter]);

  // Dynamic Margin Calculation for Add/Edit Form
  const calculatedMargin = useMemo(() => {
    const cost = Number(formPurchaseCost) || 0;
    const sale = Number(formSalePrice) || 0;
    if (formType !== 'product' || sale <= 0) return null;
    const grossProfit = sale - cost;
    const marginPct = (grossProfit / sale) * 100;
    return { grossProfit, marginPct };
  }, [formPurchaseCost, formSalePrice, formType]);

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto h-full flex flex-col dark:bg-stone-950 dark:text-stone-100 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-orange-600/15 text-orange-600 dark:text-orange-400">
              <Package size={26} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
                Stok & Depo Takibi
              </h1>
              <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm mt-0.5">
                Ürün, hammadde envanteri, kritik stok uyarıları ve birim maliyet yönetimi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-stone-100 dark:bg-stone-850 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 shrink-0"
            title="Tüm stok listesini Excel/CSV olarak indir"
          >
            <Download size={15} />
            <span>Excel / CSV</span>
          </button>

          {canManage && (
            <button
              onClick={() => {
                if (activeTab === 'STOCK') {
                  handleOpenNewModal();
                } else {
                  openAddRecipeModal();
                }
              }}
              className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Plus size={17} />
              <span>{activeTab === 'STOCK' ? 'Yeni Ürün / Stok Ekle' : 'Yeni Reçete Tanımla'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 shrink-0">
        {/* Total Items */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Kayıtlı Kalem</span>
            <Boxes size={18} className="text-stone-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 font-mono">
            {totalItemsCount}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {inventoryItems.filter(i => i.type === 'product').length} Satış • {inventoryItems.filter(i => i.type === 'raw_material').length} Hammadde
          </div>
        </div>

        {/* Critical Stock */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          className={cn(
            "p-4 rounded-2xl border shadow-xs cursor-pointer transition-all",
            criticalItems.length > 0 
              ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/60 hover:border-red-400" 
              : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800",
            statusFilter === 'CRITICAL' && "ring-2 ring-red-500"
          )}
        >
          <div className="flex items-center justify-between text-red-600 dark:text-red-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Kritik Stok</span>
            <AlertTriangle size={18} />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400 font-mono">
            {criticalItems.length}
          </div>
          <div className="text-[11px] text-red-600/80 dark:text-red-400/80 mt-1">
            {emptyItems.length > 0 ? `${emptyItems.length} ürün tamamen bitti!` : 'Eşik altına inen ürünler'}
          </div>
        </div>

        {/* Total Inventory Value */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Toplam Depo Değeri</span>
            <DollarSign size={18} className="text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatCurrency(totalInventoryValue)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            Mevcut envanter alış maliyeti
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">SKT Yaklaşanlar</span>
            <Clock size={18} className="text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {expiringSoonCount}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            14 gün içinde son kullanma tarihi dolacak
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <button
          onClick={() => setActiveTab('STOCK')}
          className={cn(
            "px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs",
            activeTab === 'STOCK' 
              ? "bg-orange-600 text-white shadow-sm" 
              : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800"
          )}
        >
          <Package size={16} />
          <span>Stok Listesi & Depo ({inventoryItems.length})</span>
          {criticalItems.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('RECIPES')}
          className={cn(
            "px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs",
            activeTab === 'RECIPES' 
              ? "bg-orange-600 text-white shadow-sm" 
              : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800"
          )}
        >
          <BookOpen size={16} />
          <span>Ürün Reçeteleri ({recipes.length})</span>
        </button>
      </div>

      {/* Tab 1: STOCK LIST */}
      {activeTab === 'STOCK' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 flex-1 flex flex-col overflow-hidden">
          {/* Filters Bar */}
          <div className="p-3 sm:p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40 flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] sm:min-w-[260px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Ürün adı, barkod, stok kodu veya tedarikçi ara..."
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-semibold text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value="ALL">Tüm Kategoriler ({inventoryItems.length})</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-semibold text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value="ALL">Tüm Türler</option>
              <option value="product">Satış Ürünleri</option>
              <option value="raw_material">Hammaddeler</option>
              <option value="consumable">Sarf Malzemeleri</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-semibold text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="CRITICAL">⚠️ Kritik Seviyedekiler ({criticalItems.length})</option>
              <option value="EMPTY">⛔ Bitenler ({emptyItems.length})</option>
              <option value="OK">✅ Yeterli Stok</option>
            </select>

            {/* Storage Location Filter */}
            <select
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-semibold text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer hidden md:block"
            >
              <option value="ALL">Tüm Depolar</option>
              {STORAGE_LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-stone-100/90 dark:bg-stone-850/90 backdrop-blur-xs text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 z-10 border-b border-stone-200 dark:border-stone-750">
                <tr>
                  <th className="py-3 px-4">Ürün / Malzeme</th>
                  <th className="py-3 px-3">Tür & Kategori</th>
                  <th className="py-3 px-3">Depo & Konum</th>
                  <th className="py-3 px-3">Mevcut Stok & Eşik</th>
                  <th className="py-3 px-3 text-right">Birim Maliyet</th>
                  <th className="py-3 px-3 text-right">Satış Fiyatı</th>
                  <th className="py-3 px-3">Tedarikçi</th>
                  <th className="py-3 px-4 text-center">Hızlı Stok</th>
                  <th className="py-3 px-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80 text-xs">
                {filteredItems.map(item => {
                  const isCritical = item.currentStock <= item.minimumStock;
                  const isEmpty = item.currentStock === 0;
                  const targetMax = item.maximumStock || Math.max(item.minimumStock * 2, 20);
                  const progressPct = Math.min(100, Math.round((item.currentStock / targetMax) * 100));

                  return (
                    <tr 
                      key={item.id}
                      className={cn(
                        "hover:bg-stone-50/80 dark:hover:bg-stone-850/50 transition-colors",
                        isEmpty ? "bg-red-500/5" : isCritical ? "bg-amber-500/5" : ""
                      )}
                    >
                      {/* Name & Code */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-sm text-stone-900 dark:text-stone-100">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-stone-400 font-mono mt-0.5">
                          {item.code && <span className="bg-stone-100 dark:bg-stone-800 px-1 rounded">{item.code}</span>}
                          {item.barcode && (
                            <span className="flex items-center gap-0.5">
                              <Barcode size={11} /> {item.barcode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Type & Category */}
                      <td className="py-3 px-3">
                        <span className={cn(
                          "inline-block px-2 py-0.5 rounded-md text-[10px] font-bold mb-0.5",
                          item.type === 'product'
                            ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40"
                            : item.type === 'consumable'
                            ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/40"
                            : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40"
                        )}>
                          {item.type === 'product' ? 'Satış Ürünü' : item.type === 'consumable' ? 'Sarf' : 'Hammadde'}
                        </span>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate max-w-[130px]">
                          {item.category || 'Genel'}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-3">
                        <div className="text-xs text-stone-800 dark:text-stone-200 font-medium">
                          {item.storageLocation || 'Ana Depo'}
                        </div>
                        {item.shelfNumber && (
                          <div className="text-[10px] text-stone-400">
                            Raf: {item.shelfNumber}
                          </div>
                        )}
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-mono font-black text-sm px-2 py-0.5 rounded-lg border",
                            isEmpty
                              ? "bg-red-600 text-white border-red-600 animate-pulse"
                              : isCritical
                              ? "bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border-red-300 dark:border-red-900"
                              : "bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700"
                          )}>
                            {item.currentStock} {item.unit}
                          </span>

                          {isCritical && (
                            <span className="text-[10px] text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded-md border border-red-200 dark:border-red-900/50">
                              Kritik! (Min: {item.minimumStock})
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-28 bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all",
                              isEmpty ? "bg-red-500 w-0" : isCritical ? "bg-red-500" : "bg-emerald-500"
                            )}
                            style={{ width: `${Math.min(100, Math.max(5, progressPct))}%` }}
                          />
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-stone-800 dark:text-stone-200">
                        {formatCurrency(item.purchaseCost)}
                        <span className="text-[10px] text-stone-400 font-normal block">
                          /{item.unit}
                        </span>
                      </td>

                      {/* Sale Price */}
                      <td className="py-3 px-3 text-right font-mono">
                        {item.salePrice ? (
                          <>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(item.salePrice)}
                            </span>
                            <span className="text-[10px] text-stone-400 block font-normal">
                              +{formatCurrency(item.salePrice - item.purchaseCost)}
                            </span>
                          </>
                        ) : (
                          <span className="text-stone-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Supplier */}
                      <td className="py-3 px-3 text-stone-700 dark:text-stone-300">
                        <div className="font-medium truncate max-w-[120px]">
                          {item.supplier || '-'}
                        </div>
                        {item.supplierPhone && (
                          <div className="text-[10px] text-stone-400">
                            {item.supplierPhone}
                          </div>
                        )}
                      </td>

                      {/* Quick Adjust Buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenAdjustModal(item, 'out')}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-red-100 dark:bg-stone-800 dark:hover:bg-red-950/60 text-stone-700 hover:text-red-700 dark:text-stone-300 dark:hover:text-red-400 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                            title="Hızlı Stok Çıkışı (Zayi/Tüketim)"
                          >
                            <ArrowDownRight size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAdjustModal(item, 'in')}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-emerald-100 dark:bg-stone-800 dark:hover:bg-emerald-950/60 text-stone-700 hover:text-emerald-700 dark:text-stone-300 dark:hover:text-emerald-400 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                            title="Hızlı Stok Girişi (Sevkiyat/Alım)"
                          >
                            <ArrowUpRight size={13} />
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-stone-500 hover:text-orange-600 dark:text-stone-400 dark:hover:text-orange-400 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                            title="Tüm Bilgileri Düzenle"
                          >
                            <Edit3 size={15} />
                          </button>
                          {canManage && (
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="p-1.5 text-stone-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                              title="Sil"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-stone-400 dark:text-stone-500">
                      <Package className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-700 mb-2" />
                      <p className="font-bold text-sm text-stone-600 dark:text-stone-400">Aradığınız kriterlere uygun ürün bulunamadı.</p>
                      <p className="text-xs text-stone-400 mt-1">Arama filtresini temizleyebilir veya yeni ürün ekleyebilirsiniz.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden divide-y divide-stone-100 dark:divide-stone-800 overflow-y-auto flex-1">
            {filteredItems.map(item => {
              const isCritical = item.currentStock <= item.minimumStock;
              const isEmpty = item.currentStock === 0;

              return (
                <div key={item.id} className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-stone-900 dark:text-stone-100">{item.name}</span>
                        {isCritical && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 px-1.5 py-0.5 rounded-md">
                            <AlertTriangle size={11} />
                            {isEmpty ? 'Bitti' : 'Kritik'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-400 mt-0.5">
                        {item.category} • {item.storageLocation || 'Ana Depo'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 text-stone-500 hover:text-orange-600"
                        title="Düzenle"
                      >
                        <Edit3 size={15} />
                      </button>
                      {canManage && (
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-1.5 text-stone-400 hover:text-red-600"
                          title="Sil"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100 dark:border-stone-800/60">
                    <div className="font-mono text-stone-500">
                      <div>Alış: <strong className="text-stone-800 dark:text-stone-200">{formatCurrency(item.purchaseCost)}</strong></div>
                      {item.salePrice && <div>Satış: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(item.salePrice)}</strong></div>}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-mono font-bold px-2.5 py-1 rounded-xl text-xs border",
                        isCritical 
                          ? "bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border-red-300" 
                          : "bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700"
                      )}>
                        {item.currentStock} {item.unit}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenAdjustModal(item, 'out')}
                          className="p-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-200 rounded-lg"
                        >
                          <ArrowDownRight size={13} />
                        </button>
                        <button
                          onClick={() => handleOpenAdjustModal(item, 'in')}
                          className="p-1.5 bg-orange-600 text-white rounded-lg"
                        >
                          <ArrowUpRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: RECIPES */}
      {activeTab === 'RECIPES' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map(recipe => {
              const menuItem = menuItems.find(m => m.id === recipe.menuItemId);
              const salePrice = menuItem?.price || 0;
              const margin = salePrice - recipe.totalCost;
              const marginPercent = salePrice > 0 ? (margin / salePrice) * 100 : 0;

              return (
                <div key={recipe.id} className="border border-stone-200 dark:border-stone-800 rounded-2xl p-4 bg-stone-50/50 dark:bg-stone-850/40 relative group hover:border-orange-500/50 transition-all shadow-xs">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-black text-base text-stone-900 dark:text-stone-100">{recipe.menuItemName}</h4>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400">Satış Fiyatı: {formatCurrency(salePrice)}</span>
                    </div>
                    {canManage && (
                      <button 
                        onClick={() => handleDeleteRecipe(recipe)}
                        className="text-stone-400 hover:text-red-600 p-1 rounded-md transition-colors cursor-pointer"
                        title="Reçeteyi Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Ingredients list */}
                  <div className="space-y-1.5 border-t border-b border-stone-200 dark:border-stone-800 py-3 mb-3 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Reçete Malzemeleri:</span>
                    {recipe.items.map((ing, idx) => (
                      <div key={idx} className="flex justify-between text-stone-700 dark:text-stone-300">
                        <span className="truncate">{ing.inventoryItemName}</span>
                        <span className="font-mono font-bold shrink-0">{ing.quantity} {ing.unit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Financials */}
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-stone-500 dark:text-stone-400">Porsiyon Hammadde Maliyeti:</span>
                      <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(recipe.totalCost)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-stone-200 dark:border-stone-800 pt-1.5">
                      <span className="text-stone-800 dark:text-stone-200">Tahmini Brüt Kâr:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(margin)} (%{marginPercent.toFixed(0)})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {recipes.length === 0 && (
              <div className="col-span-full py-16 text-center text-stone-400 dark:text-stone-500">
                <ChefHat className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-700 mb-2" />
                <p className="font-bold text-sm text-stone-600 dark:text-stone-400">Henüz ürün reçetesi tanımlanmadı.</p>
                <p className="text-xs text-stone-400 mt-1">Menüdeki ürünlerin birim porsiyon maliyetini takip etmek için yukarıdan reçete oluşturabilirsiniz.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD / EDIT INVENTORY ITEM MODAL (TÜM DETAYLARLI GİRİŞ FORMU) */}
      {/* ========================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div 
            className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-3xl shadow-2xl border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200 my-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-600/15 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                  <Package size={20} />
                </div>
                <div>
                  <h2 className="font-black text-base sm:text-lg tracking-tight">
                    {editingItemId ? 'Ürün / Stok Bilgilerini Düzenle' : 'Yeni Ürün & Stok Kaydı'}
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Lütfen ürün kimliği, miktar, maliyet ve tedarikçi detaylarını eksiksiz girin
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveItem} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* SECTION 1: Temel Bilgiler & Kimlik */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-stone-100 dark:border-stone-800">
                  <span className="w-6 h-6 rounded-lg bg-orange-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                  <h3 className="font-black text-sm text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                    Temel Ürün Bilgileri & Kimlik
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
                  {/* Product Name */}
                  <div className="sm:col-span-8">
                    <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                      Ürün / Malzeme Adı <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="Örn: Coca-Cola 330ml Kutu, Dana Kıyma, Sütaş Tam Yağlı Süt..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                    />
                  </div>

                  {/* Stock Type */}
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                      Stok Türü
                    </label>
                    <select
                      value={formType}
                      onChange={e => setFormType(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    >
                      <option value="product">Satış Ürünü (Direkt Satılan)</option>
                      <option value="raw_material">Hammadde (Mutfak/Bar)</option>
                      <option value="consumable">Sarf Malzemesi (Peçete, Kutu)</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                      Kategori
                    </label>
                    <select
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    >
                      {INVENTORY_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {formCategory === 'Diğer' && (
                      <input
                        type="text"
                        value={formCustomCategory}
                        onChange={e => setFormCustomCategory(e.target.value)}
                        placeholder="Özel kategori adı yazın..."
                        className="w-full mt-2 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                      />
                    )}
                  </div>

                  {/* Stock Code SKU */}
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                      Stok Kodu (SKU)
                    </label>
                    <input
                      type="text"
                      value={formCode}
                      onChange={e => setFormCode(e.target.value)}
                      placeholder="Örn: STK-204"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-mono font-bold"
                    />
                  </div>

                  {/* Barcode */}
                  <div className="sm:col-span-6">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400">
                        Barkod / EAN No
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateBarcode}
                        className="text-[11px] text-orange-600 dark:text-orange-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles size={11} /> Barkod Üret
                      </button>
                    </div>
                    <div className="relative">
                      <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                      <input
                        type="text"
                        value={formBarcode}
                        onChange={e => setFormBarcode(e.target.value)}
                        placeholder="Örn: 8690504123456"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-mono font-semibold"
                      />
                    </div>
                  </div>

                  {/* Linked Menu Item */}
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                      Bağlantılı Menü Ürünü (İsteğe Bağlı)
                    </label>
                    <select
                      value={formMenuItemId}
                      onChange={e => setFormMenuItemId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    >
                      <option value="">Bağlantısız (Sadece Depo Takibi)</option>
                      {menuItems.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({formatCurrency(m.price)})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Miktar & Ölçü Birimleri */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-stone-100 dark:border-stone-800">
                  <span className="w-6 h-6 rounded-lg bg-orange-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h3 className="font-black text-sm text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                    Miktar & Ölçü Birimleri
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {/* Unit */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                      Ölçü Birimi <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formUnit}
                      onChange={e => setFormUnit(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    >
                      {MEASUREMENT_UNITS.map(u => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Current Stock */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                      Mevcut Stok <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      required
                      value={formCurrentStock}
                      onChange={e => setFormCurrentStock(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Minimum / Critical Stock */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-red-600 dark:text-red-400 mb-1">
                      Kritik Eşik (Min) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      required
                      value={formMinimumStock}
                      onChange={e => setFormMinimumStock(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-red-300 dark:border-red-900 bg-red-50/50 dark:bg-red-950/30 text-stone-900 dark:text-stone-100 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  {/* Maximum Stock */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                      Hedef / Maks Stok
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={formMaximumStock}
                      onChange={e => setFormMaximumStock(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Pack Quantity */}
                  <div className="col-span-2 sm:col-span-4">
                    <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                      Koli / Paket İçi Adet (Örn: 1 kolide 24 kutu var ise)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formPackQuantity}
                      onChange={e => setFormPackQuantity(Number(e.target.value))}
                      placeholder="1"
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Maliyet & Fiyatlandırma */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-stone-100 dark:border-stone-800">
                  <span className="w-6 h-6 rounded-lg bg-orange-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                  <h3 className="font-black text-sm text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                    Fiyatlandırma, Maliyet & Kâr Marjı
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {/* Purchase Cost */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                      Birim Alış / Maliyet (₺) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      required
                      value={formPurchaseCost}
                      onChange={e => setFormPurchaseCost(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Sale Price */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                      Satış Fiyatı (₺)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={formSalePrice}
                      onChange={e => setFormSalePrice(Number(e.target.value))}
                      placeholder="Örn: 50"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* VAT Tax Rate */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                      KDV Oranı (%)
                    </label>
                    <select
                      value={formTaxRate}
                      onChange={e => setFormTaxRate(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    >
                      <option value={0}>%0 KDV</option>
                      <option value={1}>%1 KDV</option>
                      <option value={10}>%10 KDV (Gıda & Restoran)</option>
                      <option value={20}>%20 KDV (Genel)</option>
                    </select>
                  </div>
                </div>

                {/* Profit Margin Preview Banner */}
                {calculatedMargin && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-center justify-between text-xs">
                    <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                      Tahmini Birim Kâr: <strong className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">+{formatCurrency(calculatedMargin.grossProfit)}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded-md font-mono font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs">
                      %{calculatedMargin.marginPct.toFixed(1)} Kâr Marjı
                    </span>
                  </div>
                )}
              </div>

              {/* SECTION 4: Tedarikçi & Fatura Detayları */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-stone-100 dark:border-stone-800">
                  <span className="w-6 h-6 rounded-lg bg-orange-600 text-white text-xs font-bold flex items-center justify-center">4</span>
                  <h3 className="font-black text-sm text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                    Tedarikçi & Alım Faturası
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {/* Supplier Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                      Tedarikçi Firma / Toptancı
                    </label>
                    <input
                      type="text"
                      value={formSupplier}
                      onChange={e => setFormSupplier(e.target.value)}
                      placeholder="Örn: Metro Toptancı, Pınar Süt Bayi"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-semibold"
                    />
                  </div>

                  {/* Supplier Phone */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                      Tedarikçi İletişim / Tel
                    </label>
                    <input
                      type="text"
                      value={formSupplierPhone}
                      onChange={e => setFormSupplierPhone(e.target.value)}
                      placeholder="0532 000 00 00"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-mono"
                    />
                  </div>

                  {/* Invoice Ref */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                      Son Fatura / İrsaliye No
                    </label>
                    <input
                      type="text"
                      value={formInvoiceNumber}
                      onChange={e => setFormInvoiceNumber(e.target.value)}
                      placeholder="Örn: FTR-2026-9901"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: Depolama, Raf & SKT */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-stone-100 dark:border-stone-800">
                  <span className="w-6 h-6 rounded-lg bg-orange-600 text-white text-xs font-bold flex items-center justify-center">5</span>
                  <h3 className="font-black text-sm text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                    Depolama, Raf & Son Kullanma Tarihi (SKT)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                  {/* Storage Location */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                      Depo Alanı
                    </label>
                    <select
                      value={formStorageLocation}
                      onChange={e => setFormStorageLocation(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    >
                      {STORAGE_LOCATIONS.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  {/* Shelf Number */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                      Raf / Bölme No
                    </label>
                    <input
                      type="text"
                      value={formShelfNumber}
                      onChange={e => setFormShelfNumber(e.target.value)}
                      placeholder="Örn: Raf C-3"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-semibold"
                    />
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                      Son Kullanma Tarihi (SKT)
                    </label>
                    <input
                      type="date"
                      value={formExpiryDate}
                      onChange={e => setFormExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    />
                  </div>

                  {/* Lot / Batch */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                      Parti / Lot No
                    </label>
                    <input
                      type="text"
                      value={formLotNumber}
                      onChange={e => setFormLotNumber(e.target.value)}
                      placeholder="Örn: LOT-2026A"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-mono font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 6: Notlar & Muhafaza Koşulları */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400">
                  Özel Notlar & Saklama Talimatları
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Örn: Açıldıktan sonra buzdolabında saklanmalı, direkt güneş ışığından uzak tutulmalı..."
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-sm cursor-pointer active:scale-95"
                >
                  {editingItemId ? 'Değişiklikleri Kaydet' : 'Ürünü / Malzemeyi Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* QUICK STOCK ADJUSTMENT MODAL (+ / -) */}
      {/* ========================================================= */}
      {isAdjustModalOpen && adjustTargetItem && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 p-5 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center font-bold",
                  adjustType === 'in' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                )}>
                  {adjustType === 'in' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                </div>
                <div>
                  <h3 className="font-black text-sm text-stone-900 dark:text-stone-100">
                    {adjustType === 'in' ? 'Stok Girişi (Ekleme)' : 'Stok Çıkışı (Düşüm)'}
                  </h3>
                  <p className="text-[11px] text-stone-400 truncate max-w-[220px]">
                    {adjustTargetItem.name} • Mevcut: {adjustTargetItem.currentStock} {adjustTargetItem.unit}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              {/* Type Switcher */}
              <div className="flex p-1 bg-stone-100 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAdjustType('in');
                    setAdjustReason('Yeni Sevkiyat / Alım Faturası');
                  }}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg transition-all text-center",
                    adjustType === 'in' ? "bg-emerald-600 text-white shadow-xs" : "text-stone-600 dark:text-stone-400"
                  )}
                >
                  + Stok Girişi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdjustType('out');
                    setAdjustReason('Zayi / Bozulma / Dökülme');
                  }}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg transition-all text-center",
                    adjustType === 'out' ? "bg-red-600 text-white shadow-xs" : "text-stone-600 dark:text-stone-400"
                  )}
                >
                  - Stok Çıkışı
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdjustType('set');
                    setAdjustReason('Sayım Düzeltmesi');
                  }}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg transition-all text-center",
                    adjustType === 'set' ? "bg-blue-600 text-white shadow-xs" : "text-stone-600 dark:text-stone-400"
                  )}
                >
                  = Doğrudan Sayım
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                  {adjustType === 'set' ? 'Yeni Toplam Stok Miktarı' : 'İşlem Miktarı'} ({adjustTargetItem.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  min={adjustType === 'set' ? 0 : 0.01}
                  required
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono font-bold text-base focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                  İşlem Nedeni / Açıklaması
                </label>
                <select
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-semibold focus:ring-2 focus:ring-orange-500 cursor-pointer"
                >
                  {adjustType === 'in' ? (
                    <>
                      <option value="Yeni Sevkiyat / Alım Faturası">Yeni Sevkiyat / Alım Faturası</option>
                      <option value="Tedarikçi İade Kabulü">Tedarikçi İade Kabulü</option>
                      <option value="Sayım Fazlası">Sayım Fazlası Düzeltmesi</option>
                      <option value="Depolar Arası Transfer Girişi">Depolar Arası Transfer Girişi</option>
                    </>
                  ) : adjustType === 'out' ? (
                    <>
                      <option value="Zayi / Bozulma / Dökülme">Zayi / Bozulma / Dökülme</option>
                      <option value="Son Kullanma Tarihi Geçti">Son Kullanma Tarihi Geçti</option>
                      <option value="Mutfak / Bar Tüketimi">Mutfak / Bar Tüketimi</option>
                      <option value="İkram / Personel Yemeği">İkram / Personel Yemeği</option>
                      <option value="Sayım Eksiği Düzeltmesi">Sayım Eksiği Düzeltmesi</option>
                      <option value="Tedarikçiye İade">Tedarikçiye İade</option>
                    </>
                  ) : (
                    <>
                      <option value="Haftalık Sayım Düzeltmesi">Haftalık Sayım Düzeltmesi</option>
                      <option value="Aylık Envanter Sayımı">Aylık Envanter Sayımı</option>
                      <option value="Hata Düzeltme">Hata Düzeltme</option>
                    </>
                  )}
                </select>
              </div>

              {/* Optional Note */}
              <div>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={e => setAdjustNote(e.target.value)}
                  placeholder="İsteğe bağlı ek açıklama veya fatura no..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-xs bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className={cn(
                    "px-5 py-2 rounded-xl font-bold text-xs text-white transition-all shadow-sm cursor-pointer active:scale-95",
                    adjustType === 'in' ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"
                  )}
                >
                  Stoku Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD RECIPE MODAL */}
      {/* ========================================================= */}
      {isAddRecipeModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl border border-stone-200 dark:border-stone-800 dark:text-stone-100 space-y-4 max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-stone-100 dark:border-stone-800 shrink-0">
              <h3 className="text-lg font-black text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <ChefHat className="text-orange-600 dark:text-orange-400" size={20} />
                Yeni Ürün Reçetesi Tanımla
              </h3>
              <button 
                onClick={() => setIsAddRecipeModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">
                  Menü Ürünü Seçin
                </label>
                <select
                  value={recipeMenuItemId}
                  onChange={e => setRecipeMenuItemId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-bold focus:ring-2 focus:ring-orange-500 cursor-pointer"
                >
                  {menuItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} - Satış: {formatCurrency(item.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400">
                    Reçete Hammaddeleri
                  </label>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Malzeme Ekle
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {recipeIngredients.map((row, index) => {
                    const selectedInv = inventoryItems.find(i => i.id === row.inventoryItemId);
                    const unit = selectedInv?.unit || 'adet';
                    const costPerUnit = selectedInv?.purchaseCost || 0;
                    const lineTotal = costPerUnit * row.quantity;

                    return (
                      <div key={index} className="flex items-center gap-2 bg-stone-50 dark:bg-stone-800/50 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700/60">
                        <select
                          value={row.inventoryItemId}
                          onChange={e => handleIngredientChange(index, 'inventoryItemId', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-medium cursor-pointer"
                        >
                          {inventoryItems.map(inv => (
                            <option key={inv.id} value={inv.id}>
                              {inv.name} ({formatCurrency(inv.purchaseCost)}/{inv.unit})
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="any"
                            min="0.001"
                            value={row.quantity}
                            onChange={e => handleIngredientChange(index, 'quantity', Number(e.target.value))}
                            className="w-16 px-2 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-mono font-bold text-center"
                          />
                          <span className="text-[11px] text-stone-400 font-bold w-7 truncate">{unit}</span>
                        </div>

                        <span className="text-[11px] font-mono text-stone-500 w-16 text-right truncate">
                          {formatCurrency(lineTotal)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveIngredientRow(index)}
                          className="text-stone-400 hover:text-red-500 p-1 cursor-pointer"
                          title="Kaldır"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Estimated Cost */}
              <div className="p-3 bg-stone-100 dark:bg-stone-800 rounded-2xl flex justify-between items-center text-xs font-mono">
                <span className="text-stone-600 dark:text-stone-400 font-bold">Toplam Porsiyon Maliyeti:</span>
                <span className="font-black text-sm text-red-600 dark:text-red-400">
                  {formatCurrency(
                    recipeIngredients.reduce((acc, row) => {
                      const inv = inventoryItems.find(i => i.id === row.inventoryItemId);
                      return acc + ((inv?.purchaseCost || 0) * row.quantity);
                    }, 0)
                  )}
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddRecipeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-sm cursor-pointer active:scale-95"
                >
                  Reçeteyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
