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
  Download, 
  Edit3, 
  Barcode, 
  Clock, 
  Boxes, 
  DollarSign, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  User,
  Truck,
  RotateCcw
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

  // Form Fields (Tüm Detaylar - Kullanıcı istediği alanları seçip doldurabilir, tümü opsiyonel)
  const [formName, setFormName] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState('İçecekler & Bar');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formType, setFormType] = useState<InventoryItemType>('product');
  const [formMenuItemId, setFormMenuItemId] = useState('');
  const [formUnit, setFormUnit] = useState('adet');
  const [formCurrentStock, setFormCurrentStock] = useState<string>('');
  const [formMinimumStock, setFormMinimumStock] = useState<string>('');
  const [formMaximumStock, setFormMaximumStock] = useState<string>('');
  const [formPackQuantity, setFormPackQuantity] = useState<string>('');
  const [formPurchaseCost, setFormPurchaseCost] = useState<string>('');
  const [formSalePrice, setFormSalePrice] = useState<string>('');
  const [formTaxRate, setFormTaxRate] = useState<number>(10);
  const [formSupplier, setFormSupplier] = useState('');
  const [formSupplierPhone, setFormSupplierPhone] = useState('');
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formDeliveredBy, setFormDeliveredBy] = useState('');
  const [formReceivedBy, setFormReceivedBy] = useState('');
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
  const [adjustDeliveredBy, setAdjustDeliveredBy] = useState('');
  const [adjustReceivedBy, setAdjustReceivedBy] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  // Add Recipe Modal State
  const [isAddRecipeModalOpen, setIsAddRecipeModalOpen] = useState(false);
  const [recipeMenuItemId, setRecipeMenuItemId] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState<{ inventoryItemId: string; quantity: number }[]>([]);

  // Open modal for NEW item (Boşlukların tümü opsiyonel)
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
    setFormCurrentStock('');
    setFormMinimumStock('');
    setFormMaximumStock('');
    setFormPackQuantity('');
    setFormPurchaseCost('');
    setFormSalePrice('');
    setFormTaxRate(10);
    setFormSupplier('');
    setFormSupplierPhone('');
    setFormInvoiceNumber('');
    setFormDeliveredBy('');
    setFormReceivedBy(state.currentUser?.name || '');
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
    setFormName(item.name || '');
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
    setFormCurrentStock(item.currentStock !== undefined ? String(item.currentStock) : '');
    setFormMinimumStock(item.minimumStock !== undefined ? String(item.minimumStock) : '');
    setFormMaximumStock(item.maximumStock !== undefined ? String(item.maximumStock) : '');
    setFormPackQuantity(item.packQuantity !== undefined ? String(item.packQuantity) : '');
    setFormPurchaseCost(item.purchaseCost !== undefined ? String(item.purchaseCost) : '');
    setFormSalePrice(item.salePrice !== undefined ? String(item.salePrice) : '');
    setFormTaxRate(item.taxRate !== undefined ? item.taxRate : 10);
    setFormSupplier(item.supplier || '');
    setFormSupplierPhone(item.supplierPhone || '');
    setFormInvoiceNumber(item.invoiceNumber || '');
    setFormDeliveredBy(item.deliveredBy || '');
    setFormReceivedBy(item.receivedBy || '');
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

  // Save item (Tüm alanlar opsiyonel, hiçbir zorunlu alan engeli yok)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ürün adı boş bırakılmışsa otomatik kod veya genel isim ata
    const finalName = formName.trim() || (formCode.trim() ? `Ürün ${formCode.trim()}` : 'Yeni Stok Kalemi');

    const finalCategory = formCategory === 'Diğer' && formCustomCategory.trim() 
      ? formCustomCategory.trim() 
      : (formCategory || 'Genel');

    const nowIso = new Date().toISOString();
    const itemData: InventoryItem = {
      id: editingItemId || generateId(),
      name: finalName,
      barcode: formBarcode.trim() || undefined,
      code: formCode.trim() || undefined,
      category: finalCategory,
      type: formType,
      menuItemId: formMenuItemId || undefined,
      unit: formUnit || 'adet',
      currentStock: formCurrentStock !== '' ? (Number(formCurrentStock) || 0) : 0,
      minimumStock: formMinimumStock !== '' ? (Number(formMinimumStock) || 0) : 0,
      maximumStock: formMaximumStock !== '' ? (Number(formMaximumStock) || undefined) : undefined,
      packQuantity: formPackQuantity !== '' ? (Number(formPackQuantity) || 1) : 1,
      purchaseCost: formPurchaseCost !== '' ? (Number(formPurchaseCost) || 0) : 0,
      salePrice: formSalePrice !== '' ? (Number(formSalePrice) || undefined) : undefined,
      taxRate: Number(formTaxRate) || 10,
      supplier: formSupplier.trim() || 'Genel Tedarikçi',
      supplierPhone: formSupplierPhone.trim() || undefined,
      invoiceNumber: formInvoiceNumber.trim() || undefined,
      deliveredBy: formDeliveredBy.trim() || undefined,
      receivedBy: formReceivedBy.trim() || undefined,
      storageLocation: formStorageLocation || 'Ana Depo',
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
          details: `"${itemData.name}" güncellendi. Stok: ${itemData.currentStock} ${itemData.unit} | Teslim Alan: ${itemData.receivedBy || '-'} | Teslim Eden: ${itemData.deliveredBy || '-'}`,
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
          details: `"${itemData.name}" eklendi. Başlangıç: ${itemData.currentStock} ${itemData.unit} | Teslim Alan: ${itemData.receivedBy || '-'} | Teslim Eden: ${itemData.deliveredBy || '-'}`,
          entityType: 'inventory',
          entityId: itemData.id,
          timestamp: nowIso,
        });
      }

      setIsFormModalOpen(false);
    } catch (err: any) {
      console.error('Stok kaydedilemedi:', err);
      alert('Stok kaydedilirken bir hata oluştu: ' + (err?.message || err));
    }
  };

  // Open quick stock adjust modal
  const handleOpenAdjustModal = (item: InventoryItem, defaultType: 'in' | 'out' = 'in') => {
    setAdjustTargetItem(item);
    setAdjustType(defaultType);
    setAdjustAmount(1);
    setAdjustReason(defaultType === 'in' ? 'Yeni Sevkiyat / Alım Faturası' : 'Zayi / Bozulma / Dökülme');
    setAdjustDeliveredBy(item.deliveredBy || item.supplier || '');
    setAdjustReceivedBy(state.currentUser?.name || item.receivedBy || '');
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
      const updatedFields: Partial<InventoryItem> = {
        currentStock: newStock,
        lastUpdated: nowIso,
      };
      if (adjustDeliveredBy.trim()) {
        updatedFields.deliveredBy = adjustDeliveredBy.trim();
      }
      if (adjustReceivedBy.trim()) {
        updatedFields.receivedBy = adjustReceivedBy.trim();
      }

      await db.inventoryItems.update(adjustTargetItem.id, updatedFields);

      const deliveryInfo = [
        adjustDeliveredBy.trim() ? `Teslim Eden: ${adjustDeliveredBy.trim()}` : null,
        adjustReceivedBy.trim() ? `Teslim Alan: ${adjustReceivedBy.trim()}` : null,
      ].filter(Boolean).join(' | ');

      await db.auditLogs.add({
        id: generateId(),
        userId: state.currentUser?.id || 'staff-1',
        userName: state.currentUser?.name || 'Personel',
        action: 'Stok Hareketi',
        details: `${adjustTargetItem.name}: ${adjustType === 'in' ? '+' : adjustType === 'out' ? '-' : 'Ayarlanan: '}${amount} ${adjustTargetItem.unit}. Sebep: ${adjustReason} ${adjustNote ? `(${adjustNote})` : ''} ${deliveryInfo ? `[${deliveryInfo}]` : ''}. Yeni Stok: ${newStock} ${adjustTargetItem.unit}`,
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

  // Tüm stokları tek tıkla temizleme
  const handleClearAllInventory = async () => {
    if (!canManage) {
      alert('Stokları temizleme yetkiniz bulunmamaktadır.');
      return;
    }
    if (inventoryItems.length === 0) {
      alert('Zaten silinecek stok ürünü bulunmamaktadır.');
      return;
    }
    if (window.confirm(`Mevcut tüm stok kayıtlarını (${inventoryItems.length} ürün) ve reçeteleri tamamen silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz!`)) {
      await db.inventoryItems.clear();
      await db.recipes.clear();
      await db.auditLogs.add({
        id: generateId(),
        userId: state.currentUser?.id || 'staff-1',
        userName: state.currentUser?.name || 'Yönetici',
        action: 'Tüm Stoklar Temizlendi',
        details: `Kullanıcı tarafından tüm stok ve reçete listesi sıfırlandı.`,
        entityType: 'inventory',
        entityId: 'all',
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
      alert('Reçete tanımlamak için önce depoya en az bir hammadde veya malzeme eklemelisiniz.');
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
      'Teslim Eden',
      'Teslim Alan',
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
      `"${(i.deliveredBy || '').replace(/"/g, '""')}"`,
      `"${(i.receivedBy || '').replace(/"/g, '""')}"`,
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
    link.setAttribute('download', `Wots-Stok-Raporu-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPI Calculations
  const totalItemsCount = inventoryItems.length;
  const criticalItems = useMemo(() => {
    return inventoryItems.filter(i => (i.currentStock || 0) <= (i.minimumStock || 0));
  }, [inventoryItems]);

  const emptyItems = useMemo(() => {
    return inventoryItems.filter(i => (i.currentStock || 0) === 0);
  }, [inventoryItems]);

  const totalInventoryValue = useMemo(() => {
    return inventoryItems.reduce((acc, i) => acc + ((i.currentStock || 0) * (i.purchaseCost || 0)), 0);
  }, [inventoryItems]);

  const expiringSoonCount = useMemo(() => {
    const nowTime = new Date().getTime();
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    return inventoryItems.filter(i => {
      if (!i.expiryDate) return false;
      const exp = new Date(i.expiryDate).getTime();
      return exp >= nowTime && exp - nowTime <= fourteenDaysMs;
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
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = (item.name || '').toLowerCase().includes(q);
        const matchesBarcode = (item.barcode || '').toLowerCase().includes(q);
        const matchesCode = (item.code || '').toLowerCase().includes(q);
        const matchesSupplier = (item.supplier || '').toLowerCase().includes(q);
        const matchesDelivered = (item.deliveredBy || '').toLowerCase().includes(q);
        const matchesReceived = (item.receivedBy || '').toLowerCase().includes(q);
        if (!matchesName && !matchesBarcode && !matchesCode && !matchesSupplier && !matchesDelivered && !matchesReceived) {
          return false;
        }
      }

      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      if (selectedType !== 'ALL' && item.type !== selectedType) {
        return false;
      }

      if (selectedLocation !== 'ALL' && item.storageLocation !== selectedLocation) {
        return false;
      }

      if (statusFilter === 'CRITICAL' && (item.currentStock || 0) > (item.minimumStock || 0)) {
        return false;
      }
      if (statusFilter === 'EMPTY' && (item.currentStock || 0) !== 0) {
        return false;
      }
      if (statusFilter === 'OK' && (item.currentStock || 0) <= (item.minimumStock || 0)) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const aCrit = (a.currentStock || 0) <= (a.minimumStock || 0);
      const bCrit = (b.currentStock || 0) <= (b.minimumStock || 0);
      if (aCrit && !bCrit) return -1;
      if (!aCrit && bCrit) return 1;
      return (a.name || '').localeCompare(b.name || '', 'tr', { sensitivity: 'base' });
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
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto h-full flex flex-col bg-stone-950 text-stone-100 select-none overflow-y-auto no-scrollbar">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/30 shadow-xs shrink-0">
              <Package size={24} className="sm:w-[26px] sm:h-[26px]" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                Stok & Depo Takibi
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Tümünü Temizle */}
          {canManage && inventoryItems.length > 0 && (
            <button
              onClick={handleClearAllInventory}
              className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-2.5 min-h-[42px] bg-red-950/60 hover:bg-red-900/80 active:bg-red-900 text-red-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-red-800/60 active:scale-95 shrink-0 shadow-xs"
              title="Tüm stok ürünlerini ve reçeteleri temizle"
            >
              <Trash2 size={15} />
              <span>Temizle</span>
            </button>
          )}

          {/* Excel / CSV */}
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-2.5 min-h-[42px] bg-stone-900 hover:bg-stone-850 active:bg-stone-800 text-stone-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-stone-800 active:scale-95 shrink-0 shadow-xs"
            title="Tüm stok listesini Excel/CSV olarak indir"
          >
            <Download size={15} />
            <span>Excel / CSV</span>
          </button>

          {/* Yeni Ürün / Reçete Ekle */}
          {canManage && (
            <button
              onClick={() => {
                if (activeTab === 'STOCK') {
                  handleOpenNewModal();
                } else {
                  openAddRecipeModal();
                }
              }}
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white px-4 py-2.5 min-h-[42px] rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Plus size={17} />
              <span>{activeTab === 'STOCK' ? 'Yeni Ürün / Stok Ekle' : 'Yeni Reçete Tanımla'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Summary Cards (Mobil Uyumlu) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6 shrink-0">
        {/* Total Items */}
        <div className="bg-stone-900 border border-stone-800 p-3 sm:p-4 rounded-2xl shadow-sm text-stone-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-400 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">Kayıtlı Kalem</span>
              <Boxes size={16} className="text-stone-500 shrink-0" />
            </div>
            <div className="text-xl sm:text-3xl font-black text-white font-mono">
              {totalItemsCount}
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] text-stone-400 mt-1 truncate">
            {inventoryItems.filter(i => i.type === 'product').length} Satış • {inventoryItems.filter(i => i.type === 'raw_material').length} Hammadde
          </div>
        </div>

        {/* Critical Stock */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          className={cn(
            "p-3 sm:p-4 rounded-2xl border shadow-sm cursor-pointer transition-all flex flex-col justify-between",
            criticalItems.length > 0 
              ? "bg-red-950/40 border-red-900/70 hover:border-red-500 text-red-400" 
              : "bg-stone-900 border-stone-800 text-stone-100",
            statusFilter === 'CRITICAL' && "ring-2 ring-red-500"
          )}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-red-400 truncate">Kritik Stok</span>
              <AlertTriangle size={16} className="text-red-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-3xl font-black text-red-400 font-mono">
              {criticalItems.length}
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] text-red-300/80 mt-1 truncate">
            {emptyItems.length > 0 ? `${emptyItems.length} ürün tükendi!` : 'Eşik altına inenler'}
          </div>
        </div>

        {/* Total Inventory Value */}
        <div className="bg-stone-900 border border-stone-800 p-3 sm:p-4 rounded-2xl shadow-sm text-stone-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-400 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">Toplam Değer</span>
              <DollarSign size={16} className="text-emerald-400 shrink-0" />
            </div>
            <div className="text-base sm:text-2xl lg:text-3xl font-black text-emerald-400 font-mono truncate">
              {formatCurrency(totalInventoryValue)}
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] text-stone-400 mt-1 truncate">
            Mevcut depo alış maliyeti
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-stone-900 border border-stone-800 p-3 sm:p-4 rounded-2xl shadow-sm text-stone-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-400 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">SKT Yaklaşan</span>
              <Clock size={16} className="text-amber-400 shrink-0" />
            </div>
            <div className="text-xl sm:text-3xl font-black text-amber-400 font-mono">
              {expiringSoonCount}
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] text-stone-400 mt-1 truncate">
            14 gün içinde dolacak
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 mb-3 sm:mb-4 shrink-0 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('STOCK')}
          className={cn(
            "flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs min-h-[40px] whitespace-nowrap",
            activeTab === 'STOCK' 
              ? "bg-orange-600 text-white shadow-sm" 
              : "bg-stone-900 text-stone-300 hover:bg-stone-850 border border-stone-800"
          )}
        >
          <Package size={16} />
          <span>Stok Listesi ({inventoryItems.length})</span>
          {criticalItems.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('RECIPES')}
          className={cn(
            "flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs min-h-[40px] whitespace-nowrap",
            activeTab === 'RECIPES' 
              ? "bg-orange-600 text-white shadow-sm" 
              : "bg-stone-900 text-stone-300 hover:bg-stone-850 border border-stone-800"
          )}
        >
          <BookOpen size={16} />
          <span>Ürün Reçeteleri ({recipes.length})</span>
        </button>
      </div>

      {/* Tab 1: STOCK LIST */}
      {activeTab === 'STOCK' && (
        <div className="bg-stone-900 rounded-3xl shadow-sm border border-stone-800 flex-1 flex flex-col overflow-hidden">
          {/* Filters Bar */}
          <div className="p-2.5 sm:p-4 border-b border-stone-800 bg-stone-950/60 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 shrink-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0 sm:min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Ürün, barkod, teslimatçı ara..."
                className="w-full pl-9 pr-8 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[40px]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 p-1 min-w-[28px] min-h-[28px] flex items-center justify-center"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Filter Dropdowns Container (Horizontal Scroll on Mobile) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-2.5 sm:px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs font-semibold text-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer min-h-[38px] shrink-0"
              >
                <option value="ALL">Kategori: Tümü ({inventoryItems.length})</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="px-2.5 sm:px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs font-semibold text-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer min-h-[38px] shrink-0"
              >
                <option value="ALL">Tür: Tümü</option>
                <option value="product">Satış Ürünü</option>
                <option value="raw_material">Hammadde</option>
                <option value="consumable">Sarf Malzemesi</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="px-2.5 sm:px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs font-semibold text-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer min-h-[38px] shrink-0"
              >
                <option value="ALL">Durum: Tümü</option>
                <option value="CRITICAL">⚠️ Kritik ({criticalItems.length})</option>
                <option value="EMPTY">⛔ Tükendi ({emptyItems.length})</option>
                <option value="OK">✅ Yeterli</option>
              </select>

              {/* Storage Location Filter */}
              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                className="px-2.5 sm:px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs font-semibold text-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer min-h-[38px] shrink-0"
              >
                <option value="ALL">Depo: Tümü</option>
                {STORAGE_LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-stone-950/90 backdrop-blur-xs text-[11px] font-bold uppercase tracking-wider text-stone-400 z-10 border-b border-stone-800">
                <tr>
                  <th className="py-3 px-4">Ürün / Malzeme</th>
                  <th className="py-3 px-3">Tür & Kategori</th>
                  <th className="py-3 px-3">Teslimat & Sorumlu</th>
                  <th className="py-3 px-3">Mevcut Stok & Eşik</th>
                  <th className="py-3 px-3 text-right">Birim Alış</th>
                  <th className="py-3 px-3 text-right">Satış Fiyatı</th>
                  <th className="py-3 px-3">Depo & Konum</th>
                  <th className="py-3 px-4 text-center">Hızlı Stok</th>
                  <th className="py-3 px-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80 text-xs">
                {filteredItems.map(item => {
                  const isCritical = (item.currentStock || 0) <= (item.minimumStock || 0);
                  const isEmpty = (item.currentStock || 0) === 0;
                  const targetMax = item.maximumStock || Math.max((item.minimumStock || 0) * 2, 20);
                  const progressPct = Math.min(100, Math.round(((item.currentStock || 0) / targetMax) * 100));

                  return (
                    <tr 
                      key={item.id}
                      className={cn(
                        "hover:bg-stone-850/50 transition-colors",
                        isEmpty ? "bg-red-950/20" : isCritical ? "bg-amber-950/20" : ""
                      )}
                    >
                      {/* Name & Code */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-sm text-white">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-stone-400 font-mono mt-0.5">
                          {item.code && <span className="bg-stone-800 px-1 rounded text-stone-300">{item.code}</span>}
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
                            ? "bg-blue-950/60 text-blue-400 border border-blue-900/60"
                            : item.type === 'consumable'
                            ? "bg-purple-950/60 text-purple-400 border border-purple-900/60"
                            : "bg-emerald-950/60 text-emerald-400 border border-emerald-900/60"
                        )}>
                          {item.type === 'product' ? 'Satış Ürünü' : item.type === 'consumable' ? 'Sarf' : 'Hammadde'}
                        </span>
                        <div className="text-[11px] text-stone-400 truncate max-w-[130px]">
                          {item.category || 'Genel'}
                        </div>
                      </td>

                      {/* Delivery & Responsibility (Teslim Eden & Teslim Alan) */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5 text-[11px]">
                          <div className="flex items-center gap-1 text-stone-300">
                            <Truck size={12} className="text-orange-400 shrink-0" />
                            <span className="truncate max-w-[130px]" title={item.deliveredBy || item.supplier || 'Tedarikçi belirtilmedi'}>
                              {item.deliveredBy || item.supplier || '-'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-stone-400">
                            <User size={12} className="text-amber-400 shrink-0" />
                            <span className="truncate max-w-[130px]" title={item.receivedBy || 'Teslim alan belirtilmedi'}>
                              Alan: <strong className="text-stone-300">{item.receivedBy || '-'}</strong>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-mono font-black text-sm px-2 py-0.5 rounded-lg border",
                            isEmpty
                              ? "bg-red-950 text-red-300 border-red-800 animate-pulse"
                              : isCritical
                              ? "bg-amber-950/70 text-amber-300 border-amber-800"
                              : "bg-stone-800 text-stone-200 border-stone-700"
                          )}>
                            {item.currentStock || 0} {item.unit}
                          </span>

                          {isCritical && (
                            <span className="text-[10px] text-amber-400 font-bold bg-amber-950/40 px-1.5 py-0.5 rounded-md border border-amber-900/60">
                              Kritik! (Min: {item.minimumStock || 0})
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-28 bg-stone-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all",
                              isEmpty ? "bg-red-500 w-0" : isCritical ? "bg-amber-500" : "bg-emerald-500"
                            )}
                            style={{ width: `${Math.min(100, Math.max(5, progressPct))}%` }}
                          />
                        </div>
                      </td>

                      {/* Purchase Cost */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-stone-200">
                        {formatCurrency(item.purchaseCost || 0)}
                        <span className="text-[10px] text-stone-400 font-normal block">
                          /{item.unit}
                        </span>
                      </td>

                      {/* Sale Price */}
                      <td className="py-3 px-3 text-right font-mono">
                        {item.salePrice ? (
                          <>
                            <span className="font-bold text-emerald-400">
                              {formatCurrency(item.salePrice)}
                            </span>
                            <span className="text-[10px] text-stone-400 block font-normal">
                              +{formatCurrency(item.salePrice - (item.purchaseCost || 0))}
                            </span>
                          </>
                        ) : (
                          <span className="text-stone-500 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3 px-3 text-stone-300">
                        <div className="text-xs font-medium">
                          {item.storageLocation || 'Ana Depo'}
                        </div>
                        {item.shelfNumber && (
                          <div className="text-[10px] text-stone-400">
                            Raf: {item.shelfNumber}
                          </div>
                        )}
                      </td>

                      {/* Quick Adjust Buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenAdjustModal(item, 'out')}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-800 hover:bg-red-950/80 text-stone-300 hover:text-red-400 border border-stone-700 transition-colors cursor-pointer"
                            title="Hızlı Stok Çıkışı (Zayi/Tüketim)"
                          >
                            <ArrowDownRight size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAdjustModal(item, 'in')}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-800 hover:bg-emerald-950/80 text-stone-300 hover:text-emerald-400 border border-stone-700 transition-colors cursor-pointer"
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
                            className="p-1.5 text-stone-400 hover:text-orange-400 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
                            title="Tüm Bilgileri Düzenle"
                          >
                            <Edit3 size={15} />
                          </button>
                          {canManage && (
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="p-1.5 text-stone-400 hover:text-red-400 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
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
                    <td colSpan={9} className="py-20 text-center text-stone-400">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-stone-950 flex items-center justify-center border border-stone-800 text-orange-400">
                        <Package size={28} />
                      </div>
                      <p className="font-bold text-base text-white">Depoda Kayıtlı Stok Ürünü Yok</p>
                      <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
                        Tüm alanları isteğe bağlı olarak doldurabileceğiniz yeni bir ürün eklemek için butona tıklayın.
                      </p>
                      {canManage && (
                        <button
                          onClick={handleOpenNewModal}
                          className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        >
                          <Plus size={16} />
                          <span>İlk Ürünü / Stoku Ekle</span>
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden divide-y divide-stone-800/80 overflow-y-auto flex-1 p-2 space-y-2">
            {filteredItems.map(item => {
              const isCritical = (item.currentStock || 0) <= (item.minimumStock || 0);
              const isEmpty = (item.currentStock || 0) === 0;

              return (
                <div key={item.id} className="p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800/80 space-y-3 shadow-xs">
                  {/* Item Header & Management */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-white break-words">{item.name}</span>
                        {isCritical && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-900/80 px-2 py-0.5 rounded-full shrink-0">
                            <AlertTriangle size={11} />
                            {isEmpty ? 'Tükendi' : 'Kritik'}
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-stone-400 bg-stone-900 px-2 py-0.5 rounded-full border border-stone-800">
                          {item.type === 'product' ? 'Satış' : item.type === 'raw_material' ? 'Hammadde' : 'Sarf'}
                        </span>
                      </div>
                      <div className="text-xs text-stone-400 mt-1 flex items-center gap-1.5 flex-wrap">
                        <span>{item.category || 'Genel'}</span>
                        <span>•</span>
                        <span>{item.storageLocation || 'Ana Depo'}</span>
                        {item.shelfNumber && <span>({item.shelfNumber})</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-orange-400 border border-stone-800 active:scale-95 transition-all"
                        title="Düzenle"
                        aria-label="Düzenle"
                      >
                        <Edit3 size={15} />
                      </button>
                      {canManage && (
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-900 hover:bg-red-950/60 text-stone-300 hover:text-red-400 border border-stone-800 active:scale-95 transition-all"
                          title="Sil"
                          aria-label="Sil"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Teslim Eden & Teslim Alan Bilgisi */}
                  {(item.deliveredBy || item.receivedBy || item.supplier) && (
                    <div className="flex flex-col gap-1 text-xs bg-stone-900/90 p-2.5 rounded-xl border border-stone-800/80">
                      {(item.deliveredBy || item.supplier) && (
                        <div className="flex items-center gap-1.5 text-stone-300 truncate">
                          <Truck size={13} className="text-orange-400 shrink-0" />
                          <span className="truncate">Veren / Tedarikçi: <strong className="text-white">{item.deliveredBy || item.supplier}</strong></span>
                        </div>
                      )}
                      {item.receivedBy && (
                        <div className="flex items-center gap-1.5 text-stone-300 truncate">
                          <User size={13} className="text-amber-400 shrink-0" />
                          <span className="truncate">Teslim Alan: <strong className="text-white">{item.receivedBy}</strong></span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pricing and Quick Stock Adjustment Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-800/80">
                    <div className="font-mono text-xs text-stone-400 space-y-0.5">
                      <div>Alış: <strong className="text-stone-200">{formatCurrency(item.purchaseCost || 0)}</strong></div>
                      {item.salePrice ? (
                        <div>Satış: <strong className="text-emerald-400">{formatCurrency(item.salePrice)}</strong></div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className={cn(
                          "font-mono font-black text-sm px-2.5 py-1 rounded-xl border text-center",
                          isCritical 
                            ? "bg-amber-950/80 text-amber-300 border-amber-800" 
                            : "bg-stone-900 text-stone-100 border-stone-750"
                        )}>
                          {item.currentStock || 0} <span className="text-xs font-normal text-stone-400">{item.unit}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenAdjustModal(item, 'out')}
                          className="w-10 h-10 flex items-center justify-center bg-stone-900 hover:bg-stone-800 active:bg-stone-750 text-red-400 rounded-xl border border-stone-800 shadow-xs cursor-pointer active:scale-95 transition-all"
                          title="Stok Düşür"
                          aria-label="Stok Düşür"
                        >
                          <ArrowDownRight size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenAdjustModal(item, 'in')}
                          className="w-10 h-10 flex items-center justify-center bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all"
                          title="Stok Arttır"
                          aria-label="Stok Arttır"
                        >
                          <ArrowUpRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="py-14 text-center text-stone-400 p-4">
                <Package className="w-12 h-12 mx-auto text-stone-600 mb-2" />
                <p className="font-bold text-sm text-white">Depoda Kayıtlı Stok Ürünü Yok</p>
                <p className="text-xs text-stone-400 mt-1">İstediğiniz alanları doldurup kaydetmek için yeni ürün ekleyin.</p>
                {canManage && (
                  <button
                    onClick={handleOpenNewModal}
                    className="mt-3 px-4 py-2.5 min-h-[42px] bg-orange-600 active:bg-orange-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus size={16} />
                    <span>Ürün Ekle</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: RECIPES */}
      {activeTab === 'RECIPES' && (
        <div className="bg-stone-900 rounded-3xl shadow-sm border border-stone-800 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map(recipe => {
              const menuItem = menuItems.find(m => m.id === recipe.menuItemId);
              const salePrice = menuItem?.price || 0;
              const margin = salePrice - recipe.totalCost;
              const marginPercent = salePrice > 0 ? (margin / salePrice) * 100 : 0;

              return (
                <div key={recipe.id} className="border border-stone-800 rounded-2xl p-4 bg-stone-950/70 relative group hover:border-orange-500/50 transition-all shadow-xs">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-black text-base text-white">{recipe.menuItemName}</h4>
                      <span className="text-[11px] text-stone-400">Satış Fiyatı: {formatCurrency(salePrice)}</span>
                    </div>
                    {canManage && (
                      <button 
                        onClick={() => handleDeleteRecipe(recipe)}
                        className="text-stone-400 hover:text-red-400 p-1 rounded-md transition-colors cursor-pointer"
                        title="Reçeteyi Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Ingredients list */}
                  <div className="space-y-1.5 border-t border-b border-stone-800 py-3 mb-3 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Reçete Malzemeleri:</span>
                    {recipe.items.map((ing, idx) => (
                      <div key={idx} className="flex justify-between text-stone-300">
                        <span className="truncate">{ing.inventoryItemName}</span>
                        <span className="font-mono font-bold shrink-0">{ing.quantity} {ing.unit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Financials */}
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Porsiyon Maliyeti:</span>
                      <span className="font-bold text-red-400">{formatCurrency(recipe.totalCost)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-stone-800 pt-1.5">
                      <span className="text-stone-200">Tahmini Brüt Kâr:</span>
                      <span className="text-emerald-400">
                        {formatCurrency(margin)} (%{marginPercent.toFixed(0)})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {recipes.length === 0 && (
              <div className="col-span-full py-20 text-center text-stone-400">
                <ChefHat className="w-12 h-12 mx-auto text-stone-600 mb-2" />
                <p className="font-bold text-base text-white">Tanımlı Ürün Reçetesi Bulunmuyor</p>
                <p className="text-xs text-stone-400 mt-1">Menüdeki ürünlerin hammadde maliyetini otomatik hesaplamak için reçete ekleyebilirsiniz.</p>
                {canManage && (
                  <button
                    onClick={openAddRecipeModal}
                    className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Plus size={16} />
                    <span>Reçete Tanımla</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD / EDIT INVENTORY ITEM MODAL (TÜM ALANLAR OPSİYONEL & MOBİL BOTTOM SHEET) */}
      {/* ========================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div 
            className="bg-stone-900 rounded-t-[28px] sm:rounded-3xl w-full max-w-3xl shadow-2xl border border-stone-800 text-stone-100 flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 sm:my-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile Sheet Grab Handle */}
            <div className="w-12 h-1.5 bg-stone-750 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-950 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold shrink-0">
                  <Package size={20} />
                </div>
                <div>
                  <h2 className="font-black text-base sm:text-lg text-white tracking-tight">
                    {editingItemId ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
                  </h2>
                </div>
              </div>
              <button 
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveItem} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* SECTION 1: Temel Bilgiler & Kimlik */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-stone-800">
                  <span className="w-6 h-6 rounded-lg bg-orange-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                  <h3 className="font-black text-sm text-white uppercase tracking-wider">
                    Temel Ürün Bilgileri & Kimlik
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
                  {/* Product Name (Opsiyonel) */}
                  <div className="sm:col-span-8">
                    <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                      Ürün / Malzeme Adı <span className="text-stone-500 font-normal lowercase">(isteğe bağlı)</span>
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="Örn: Coca-Cola 330ml, Dana Kıyma, Süt..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                    />
                  </div>

                  {/* Stock Type */}
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                      Stok Türü
                    </label>
                    <select
                      value={formType}
                      onChange={e => setFormType(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    >
                      <option value="product">Satış Ürünü (Direkt Satılan)</option>
                      <option value="raw_material">Hammadde (Mutfak / Bar)</option>
                      <option value="consumable">Sarf Malzemesi (Peçete, Paket)</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                      Kategori
                    </label>
                    <select
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
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
                        className="w-full mt-2 px-3 py-2 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs"
                      />
                    )}
                  </div>

                  {/* Stock Code SKU */}
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                      Stok Kodu (SKU) <span className="text-stone-500 font-normal lowercase">(isteğe bağlı)</span>
                    </label>
                    <input
                      type="text"
                      value={formCode}
                      onChange={e => setFormCode(e.target.value)}
                      placeholder="Örn: STK-204"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-mono font-bold"
                    />
                  </div>

                  {/* Barcode */}
                  <div className="sm:col-span-6">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase text-stone-400">
                        Barkod / EAN No <span className="text-stone-500 font-normal lowercase">(isteğe bağlı)</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateBarcode}
                        className="text-[11px] text-orange-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles size={11} /> Barkod Üret
                      </button>
                    </div>
                    <div className="relative">
                      <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
                      <input
                        type="text"
                        value={formBarcode}
                        onChange={e => setFormBarcode(e.target.value)}
                        placeholder="Örn: 8690504123456"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-mono font-semibold"
                      />
                    </div>
                  </div>

                  {/* Linked Menu Item */}
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                      Bağlantılı Menü Ürünü <span className="text-stone-500 font-normal lowercase">(isteğe bağlı)</span>
                    </label>
                    <select
                      value={formMenuItemId}
                      onChange={e => setFormMenuItemId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    >
                      <option value="">Bağlantısız (Sadece Depo Takibi)</option>
                      {menuItems.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({formatCurrency(m.price)})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Miktar & Ölçü Birimleri (Tümü Opsiyonel) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-stone-800">
                  <span className="w-6 h-6 rounded-lg bg-orange-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h3 className="font-black text-sm text-white uppercase tracking-wider">
                    Miktar & Ölçü Birimleri
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {/* Unit */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                      Ölçü Birimi
                    </label>
                    <select
                      value={formUnit}
                      onChange={e => setFormUnit(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    >
                      {MEASUREMENT_UNITS.map(u => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Current Stock */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                      Mevcut Stok <span className="text-stone-500 font-normal lowercase">(isteğe bağlı)</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={formCurrentStock}
                      onChange={e => setFormCurrentStock(e.target.value)}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Minimum / Critical Stock */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-amber-400 mb-1">
                      Kritik Eşik (Min) <span className="text-stone-500 font-normal lowercase">(isteğe bağlı)</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={formMinimumStock}
                      onChange={e => setFormMinimumStock(e.target.value)}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Maximum Stock */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                      Hedef / Maks Stok <span className="text-stone-500 font-normal lowercase">(isteğe bağlı)</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={formMaximumStock}
                      onChange={e => setFormMaximumStock(e.target.value)}
                      placeholder="Örn: 50"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Pack Quantity */}
                  <div className="col-span-2 sm:col-span-4">
                    <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                      Koli / Paket İçi Adet <span className="text-stone-500 font-normal lowercase">(isteğe bağlı)</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formPackQuantity}
                      onChange={e => setFormPackQuantity(e.target.value)}
                      placeholder="1"
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Maliyet & Fiyatlandırma (Tümü Opsiyonel) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-stone-800">
                  <span className="w-6 h-6 rounded-lg bg-orange-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                  <h3 className="font-black text-sm text-white uppercase tracking-wider">
                    Fiyatlandırma, Maliyet & Kâr Marjı
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {/* Purchase Cost */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                      Birim Alış / Maliyet (₺) <span className="text-stone-500 font-normal lowercase">(isteğe bağlı)</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={formPurchaseCost}
                      onChange={e => setFormPurchaseCost(e.target.value)}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Sale Price */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                      Satış Fiyatı (₺) <span className="text-stone-500 font-normal lowercase">(isteğe bağlı)</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={formSalePrice}
                      onChange={e => setFormSalePrice(e.target.value)}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* VAT Tax Rate */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                      KDV Oranı (%)
                    </label>
                    <select
                      value={formTaxRate}
                      onChange={e => setFormTaxRate(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
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
                  <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-2xl flex items-center justify-between text-xs">
                    <span className="text-emerald-300 font-medium">
                      Tahmini Birim Kâr: <strong className="font-mono font-bold text-sm text-emerald-400">+{formatCurrency(calculatedMargin.grossProfit)}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded-md font-mono font-bold bg-emerald-900/60 text-emerald-300 text-xs border border-emerald-800">
                      %{calculatedMargin.marginPct.toFixed(1)} Kâr Marjı
                    </span>
                  </div>
                )}
              </div>

              {/* SECTION 4: Tedarikçi, Teslimat & Sorumlu (KİME TESLİM EDİLDİ / KİM VERDİ) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-stone-800">
                  <span className="w-6 h-6 rounded-lg bg-orange-600 text-white text-xs font-bold flex items-center justify-center">4</span>
                  <h3 className="font-black text-sm text-white uppercase tracking-wider">
                    Tedarikçi, Teslimat Sorumluları & Fatura
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Delivered By (Kim Teslim Etti / Tedarikçi / Kurye) */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-orange-400 mb-1 flex items-center gap-1.5">
                      <Truck size={14} />
                      <span>Siparişi / Malı Teslim Eden <span className="text-stone-500 font-normal lowercase">(isteğe bağlı)</span></span>
                    </label>
                    <input
                      type="text"
                      value={formDeliveredBy}
                      onChange={e => setFormDeliveredBy(e.target.value)}
                      placeholder="Örn: Metro Toptancı / Kurye Mehmet / Sütçü Ahmet"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Received By (Kime Teslim Edildi / Teslim Alan Personel) */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-amber-400 mb-1 flex items-center gap-1.5">
                      <User size={14} />
                      <span>Siparişi / Malı Teslim Alan <span className="text-stone-500 font-normal lowercase">(isteğe bağlı)</span></span>
                    </label>
                    <input
                      type="text"
                      value={formReceivedBy}
                      onChange={e => setFormReceivedBy(e.target.value)}
                      placeholder="Örn: Garson Ali / Şef Mehmet / Madi"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Supplier Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                      Tedarikçi Firma / Toptancı <span className="text-stone-500 font-normal lowercase">(isteğe bağlı)</span>
                    </label>
                    <input
                      type="text"
                      value={formSupplier}
                      onChange={e => setFormSupplier(e.target.value)}
                      placeholder="Örn: Metro Grossmarket, Sütaş Bayi..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Supplier Phone */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                      Tedarikçi İletişim / Tel <span className="text-stone-500 font-normal lowercase">(isteğe bağlı)</span>
                    </label>
                    <input
                      type="text"
                      value={formSupplierPhone}
                      onChange={e => setFormSupplierPhone(e.target.value)}
                      placeholder="0532 000 00 00"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Invoice Ref */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                      Son Fatura / İrsaliye No <span className="text-stone-500 font-normal lowercase">(isteğe bağlı)</span>
                    </label>
                    <input
                      type="text"
                      value={formInvoiceNumber}
                      onChange={e => setFormInvoiceNumber(e.target.value)}
                      placeholder="Örn: FTR-2026-9901"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: Depolama, Raf & SKT (Tümü Opsiyonel) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-stone-800">
                  <span className="w-6 h-6 rounded-lg bg-orange-600 text-white text-xs font-bold flex items-center justify-center">5</span>
                  <h3 className="font-black text-sm text-white uppercase tracking-wider">
                    Depolama, Raf & Son Kullanma Tarihi (SKT)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                  {/* Storage Location */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                      Depo Alanı
                    </label>
                    <select
                      value={formStorageLocation}
                      onChange={e => setFormStorageLocation(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    >
                      {STORAGE_LOCATIONS.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  {/* Shelf Number */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                      Raf / Bölme No <span className="text-stone-500 font-normal lowercase">(isteğe bağlı)</span>
                    </label>
                    <input
                      type="text"
                      value={formShelfNumber}
                      onChange={e => setFormShelfNumber(e.target.value)}
                      placeholder="Örn: Raf C-3"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                      Son Kullanma Tarihi (SKT) <span className="text-stone-500 font-normal lowercase">(isteğe bağlı)</span>
                    </label>
                    <input
                      type="date"
                      value={formExpiryDate}
                      onChange={e => setFormExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    />
                  </div>

                  {/* Lot / Batch */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                      Parti / Lot No <span className="text-stone-500 font-normal lowercase">(isteğe bağlı)</span>
                    </label>
                    <input
                      type="text"
                      value={formLotNumber}
                      onChange={e => setFormLotNumber(e.target.value)}
                      placeholder="Örn: LOT-2026A"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 6: Notlar */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase text-stone-400">
                  Özel Notlar & Saklama Talimatları <span className="text-stone-500 font-normal lowercase">(isteğe bağlı)</span>
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="İsteğe bağlı özel saklama talimatı veya not..."
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-3 pb-2 sm:pb-0 border-t border-stone-800 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="flex-1 sm:flex-initial px-4 py-3 min-h-[44px] rounded-xl font-bold text-xs bg-stone-800 hover:bg-stone-750 active:bg-stone-700 text-stone-300 transition-colors cursor-pointer text-center"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="flex-2 sm:flex-initial px-6 py-3 min-h-[44px] rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white transition-all shadow-sm cursor-pointer active:scale-95 text-center"
                >
                  {editingItemId ? 'Değişiklikleri Kaydet' : 'Ürünü Kaydet'}
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div 
            className="bg-stone-900 rounded-t-[28px] sm:rounded-3xl w-full max-w-md shadow-2xl border border-stone-800 text-stone-100 p-4 sm:p-5 space-y-4 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 sm:my-auto max-h-[92vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile Grab Handle */}
            <div className="w-12 h-1.5 bg-stone-750 rounded-full mx-auto sm:hidden shrink-0" />

            <div className="flex items-center justify-between pb-3 border-b border-stone-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-bold border shrink-0",
                  adjustType === 'in' ? "bg-emerald-950/80 text-emerald-400 border-emerald-800" : "bg-red-950/80 text-red-400 border-red-800"
                )}>
                  {adjustType === 'in' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white">
                    {adjustType === 'in' ? 'Stok Girişi (Ekleme)' : adjustType === 'out' ? 'Stok Çıkışı (Düşüm)' : 'Stok Sayımı'}
                  </h3>
                  <p className="text-xs text-stone-400 truncate max-w-[200px] sm:max-w-[250px]">
                    {adjustTargetItem.name} • Mevcut: <strong className="text-stone-200">{adjustTargetItem.currentStock || 0} {adjustTargetItem.unit}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-stone-400 hover:text-white p-2 rounded-xl hover:bg-stone-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              {/* Type Switcher */}
              <div className="flex p-1 bg-stone-950 rounded-xl border border-stone-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAdjustType('in');
                    setAdjustReason('Yeni Sevkiyat / Alım Faturası');
                  }}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer",
                    adjustType === 'in' ? "bg-emerald-600 text-white shadow-xs" : "text-stone-400"
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
                    "flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer",
                    adjustType === 'out' ? "bg-red-600 text-white shadow-xs" : "text-stone-400"
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
                    "flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer",
                    adjustType === 'set' ? "bg-blue-600 text-white shadow-xs" : "text-stone-400"
                  )}
                >
                  = Doğrudan Sayım
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                  {adjustType === 'set' ? 'Yeni Toplam Stok Miktarı' : 'İşlem Miktarı'} ({adjustTargetItem.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  min={adjustType === 'set' ? 0 : 0.01}
                  required
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white font-mono font-bold text-base focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Teslim Eden & Teslim Alan (Kime Teslim Edildi / Kim Verdi) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-orange-400 mb-1">
                    Teslim Eden <span className="text-stone-500 font-normal lowercase">(opsiyonel)</span>
                  </label>
                  <input
                    type="text"
                    value={adjustDeliveredBy}
                    onChange={e => setAdjustDeliveredBy(e.target.value)}
                    placeholder="Tedarikçi / Kurye..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-amber-400 mb-1">
                    Teslim Alan <span className="text-stone-500 font-normal lowercase">(opsiyonel)</span>
                  </label>
                  <input
                    type="text"
                    value={adjustReceivedBy}
                    onChange={e => setAdjustReceivedBy(e.target.value)}
                    placeholder="Personel..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                  İşlem Nedeni / Açıklaması
                </label>
                <select
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-semibold focus:ring-2 focus:ring-orange-500 cursor-pointer"
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
                  className="w-full px-3 py-2 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-2 pb-1 sm:pb-0 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="flex-1 sm:flex-initial px-4 py-3 min-h-[44px] rounded-xl font-bold text-xs bg-stone-800 hover:bg-stone-750 active:bg-stone-700 text-stone-300 cursor-pointer text-center"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className={cn(
                    "flex-2 sm:flex-initial px-5 py-3 min-h-[44px] rounded-xl font-bold text-xs text-white transition-all shadow-sm cursor-pointer active:scale-95 text-center",
                    adjustType === 'in' ? "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700" : "bg-red-600 hover:bg-red-500 active:bg-red-700"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div 
            className="bg-stone-900 rounded-t-[28px] sm:rounded-3xl p-4 sm:p-6 w-full max-w-lg shadow-2xl border border-stone-800 text-stone-100 space-y-4 max-h-[92vh] sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 sm:my-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile Sheet Grab Handle */}
            <div className="w-12 h-1.5 bg-stone-750 rounded-full mx-auto sm:hidden shrink-0" />

            <div className="flex justify-between items-center pb-3 border-b border-stone-800 shrink-0">
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <ChefHat className="text-orange-400" size={20} />
                Yeni Ürün Reçetesi Tanımla
              </h3>
              <button 
                onClick={() => setIsAddRecipeModalOpen(false)}
                className="text-stone-400 hover:text-white p-1.5 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="space-y-4 overflow-y-auto flex-1 pr-1">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                  Menü Ürünü Seçin
                </label>
                <select
                  value={recipeMenuItemId}
                  onChange={e => setRecipeMenuItemId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-700 bg-stone-950 text-white text-xs font-bold focus:ring-2 focus:ring-orange-500 cursor-pointer"
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
                  <label className="block text-xs font-bold uppercase text-stone-400">
                    Reçete Hammaddeleri
                  </label>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="text-xs font-bold text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
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
                      <div key={index} className="flex items-center gap-2 bg-stone-950/70 p-2.5 rounded-xl border border-stone-800">
                        <select
                          value={row.inventoryItemId}
                          onChange={e => handleIngredientChange(index, 'inventoryItemId', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-stone-700 bg-stone-900 text-white text-xs font-medium cursor-pointer"
                        >
                          {inventoryItems.map(inv => (
                            <option key={inv.id} value={inv.id}>
                              {inv.name} ({formatCurrency(inv.purchaseCost || 0)}/{inv.unit})
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
                            className="w-16 px-2 py-1.5 rounded-lg border border-stone-700 bg-stone-900 text-white text-xs font-mono font-bold text-center"
                          />
                          <span className="text-[11px] text-stone-400 font-bold w-7 truncate">{unit}</span>
                        </div>

                        <span className="text-[11px] font-mono text-stone-300 w-16 text-right truncate">
                          {formatCurrency(lineTotal)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveIngredientRow(index)}
                          className="text-stone-400 hover:text-red-400 p-1 cursor-pointer"
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
              <div className="p-3 bg-stone-950 rounded-2xl border border-stone-800 flex justify-between items-center text-xs font-mono">
                <span className="text-stone-400 font-bold">Toplam Porsiyon Maliyeti:</span>
                <span className="font-black text-sm text-red-400">
                  {formatCurrency(
                    recipeIngredients.reduce((acc, row) => {
                      const inv = inventoryItems.find(i => i.id === row.inventoryItemId);
                      return acc + ((inv?.purchaseCost || 0) * row.quantity);
                    }, 0)
                  )}
                </span>
              </div>

              <div className="pt-2 pb-1 sm:pb-0 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddRecipeModalOpen(false)}
                  className="flex-1 sm:flex-initial px-4 py-3 min-h-[44px] rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-750 active:bg-stone-700 text-stone-300 cursor-pointer text-center"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="flex-2 sm:flex-initial px-5 py-3 min-h-[44px] rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white shadow-sm cursor-pointer active:scale-95 text-center"
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
