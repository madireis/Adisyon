import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Package, BookOpen, AlertTriangle, Plus, PlusCircle, MinusCircle, Trash2, X, ChefHat } from 'lucide-react';
import { cn, formatCurrency, generateId } from '@/lib/utils';
import type { InventoryItem, Recipe, RecipeItem, MenuItem } from '@/types/pos';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'STOCK' | 'RECIPES'>('STOCK');
  const inventoryItems = useLiveQuery(() => db.inventoryItems.toArray()) || [];
  const recipes = useLiveQuery(() => db.recipes.toArray()) || [];
  const menuItems = useLiveQuery(() => db.menuItems.toArray()) || [];

  // Add Item Modal
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemUnit, setItemUnit] = useState('kg');
  const [itemStock, setItemStock] = useState<number>(10);
  const [itemMinStock, setItemMinStock] = useState<number>(5);
  const [itemCost, setItemCost] = useState<number>(50);
  const [itemSupplier, setItemSupplier] = useState('');

  // Add Recipe Modal
  const [isAddRecipeModalOpen, setIsAddRecipeModalOpen] = useState(false);
  const [recipeMenuItemId, setRecipeMenuItemId] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState<{ inventoryItemId: string; quantity: number }[]>([]);

  const handleStockAdjust = async (id: string, current: number, change: number) => {
    const newStock = Math.max(0, current + change);
    await db.inventoryItems.update(id, { 
      currentStock: newStock,
      lastUpdated: new Date().toISOString()
    });
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    if (confirm(`"${item.name}" malzemesini silmek istediğinize emin misiniz?`)) {
      await db.inventoryItems.delete(item.id);
    }
  };

  const handleDeleteRecipe = async (recipe: Recipe) => {
    if (confirm(`"${recipe.menuItemName}" reçetesini silmek istediğinize emin misiniz?`)) {
      await db.recipes.delete(recipe.id);
    }
  };

  const handleSaveNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      alert('Lütfen hammadde adını giriniz.');
      return;
    }

    try {
      const newItem: InventoryItem = {
        id: generateId(),
        name: itemName.trim(),
        unit: itemUnit,
        currentStock: Number(itemStock) || 0,
        minimumStock: Number(itemMinStock) || 0,
        purchaseCost: Number(itemCost) || 0,
        supplier: itemSupplier.trim(),
        lastUpdated: new Date().toISOString()
      };

      await db.inventoryItems.add(newItem);
      setIsAddItemModalOpen(false);
      setItemName('');
      setItemStock(10);
      setItemMinStock(5);
      setItemCost(50);
      setItemSupplier('');
    } catch (err: any) {
      console.error('Hammadde eklenemedi:', err);
      alert('Hammadde kaydedilirken hata oluştu: ' + (err?.message || err));
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
      alert('Önce hammadde deposuna malzeme eklemelisiniz.');
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
            unit: inv.unit
          });
        }
      }

      const newRecipe: Recipe = {
        id: generateId(),
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        totalCost: Math.round(calculatedCost),
        items
      };

      await db.recipes.add(newRecipe);
      setIsAddRecipeModalOpen(false);
    } catch (err: any) {
      console.error('Reçete eklenemedi:', err);
      alert('Reçete kaydedilirken hata oluştu: ' + (err?.message || err));
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-full flex flex-col dark:bg-stone-950 dark:text-stone-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-800 dark:text-stone-100 tracking-tight">Hammadde Stok & Reçeteler</h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Depo seviyeleri, reçete birim maliyeti ve brüt kâr analizi</p>
        </div>
        <button 
          onClick={() => activeTab === 'STOCK' ? setIsAddItemModalOpen(true) : openAddRecipeModal()}
          className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          <Plus size={18} />
          {activeTab === 'STOCK' ? 'Yeni Malzeme Ekle' : 'Yeni Reçete Tanımla'}
        </button>
      </div>

      <div className="flex overflow-x-auto gap-2 sm:gap-3 mb-4 sm:mb-6">
        <button
          onClick={() => setActiveTab('STOCK')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-extrabold text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-xs",
            activeTab === 'STOCK' 
              ? "bg-orange-600 text-white shadow-sm" 
              : "bg-white text-stone-950 dark:bg-white dark:text-stone-950 hover:bg-stone-100 hover:text-black dark:hover:bg-stone-100 dark:hover:text-black border border-stone-300 dark:border-stone-300"
          )}
        >
          <Package size={18} className={activeTab === 'STOCK' ? "text-white" : "text-stone-950 dark:text-stone-950"} />
          <span>Depo & Stok Takibi ({inventoryItems.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('RECIPES')}
          className={cn(
            "px-5 py-2.5 rounded-xl font-extrabold text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-xs",
            activeTab === 'RECIPES' 
              ? "bg-orange-600 text-white shadow-sm" 
              : "bg-white text-stone-950 dark:bg-white dark:text-stone-950 hover:bg-stone-100 hover:text-black dark:hover:bg-stone-100 dark:hover:text-black border border-stone-300 dark:border-stone-300"
          )}
        >
          <BookOpen size={18} className={activeTab === 'RECIPES' ? "text-white" : "text-stone-950 dark:text-stone-950"} />
          <span>Ürün Reçeteleri ({recipes.length})</span>
        </button>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 flex-1 overflow-hidden">
        {activeTab === 'STOCK' ? (
          <div className="overflow-x-auto h-full">
            <table className="w-full text-left border-collapse">
              <thead className="bg-stone-50 dark:bg-stone-950/80 text-xs uppercase tracking-wider font-bold text-stone-500 dark:text-stone-300 border-b border-stone-200 dark:border-stone-800 sticky top-0">
                <tr>
                  <th className="py-3 sm:py-3.5 px-3 sm:px-6">Hammadde Malzeme</th>
                  <th className="py-3 sm:py-3.5 px-3 sm:px-6">Mevcut Miktar</th>
                  <th className="py-3 sm:py-3.5 px-3 sm:px-6">Kritik Eşik</th>
                  <th className="py-3 sm:py-3.5 px-3 sm:px-6">Birim Alış Maliyeti</th>
                  <th className="py-3 sm:py-3.5 px-3 sm:px-6">Tedarikçi Firma</th>
                  <th className="py-3 sm:py-3.5 px-3 sm:px-6 text-center">Stok Güncelle</th>
                  <th className="py-3 sm:py-3.5 px-3 sm:px-6 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-sm">
                {inventoryItems.map((item: InventoryItem) => {
                  const isLow = item.currentStock <= item.minimumStock;
                  return (
                    <tr key={item.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/50 transition-colors">
                      <td className="py-3 sm:py-4 px-3 sm:px-6 font-bold text-stone-800 dark:text-stone-100">
                        <div className="flex items-center gap-2">
                          {item.name}
                          {isLow && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 px-2 py-0.5 rounded-md">
                              <AlertTriangle size={12} />
                              Kritik
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6">
                        <span className={cn(
                          "font-mono font-bold px-3 py-1 rounded-lg text-sm border",
                          isLow 
                            ? "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900" 
                            : "bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700"
                        )}>
                          {item.currentStock} {item.unit}
                        </span>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-stone-500 dark:text-stone-400 font-mono text-xs">
                        Min. {item.minimumStock} {item.unit}
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 font-bold text-stone-900 dark:text-stone-100">
                        {formatCurrency(item.purchaseCost)} / {item.unit}
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-stone-600 dark:text-stone-300 font-medium">{item.supplier || '-'}</td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-center">
                        <div className="flex justify-center items-center gap-1.5 text-stone-400">
                          <button 
                            onClick={() => handleStockAdjust(item.id, item.currentStock, -1)} 
                            className="p-1 hover:text-red-500 active:bg-stone-100 dark:active:bg-stone-800 rounded-md transition-colors cursor-pointer"
                            title="1 Azalt"
                          >
                            <MinusCircle size={22} />
                          </button>
                          <span className="text-xs font-mono font-bold text-stone-700 dark:text-stone-300 px-1">±1</span>
                          <button 
                            onClick={() => handleStockAdjust(item.id, item.currentStock, 1)} 
                            className="p-1 hover:text-emerald-500 active:bg-stone-100 dark:active:bg-stone-800 rounded-md transition-colors cursor-pointer"
                            title="1 Ekle"
                          >
                            <PlusCircle size={22} />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-right">
                        <button 
                          onClick={() => handleDeleteItem(item)}
                          className="p-1.5 text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                          title="Malzemeyi Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {inventoryItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-400 dark:text-stone-500">
                      Depoda henüz hammadde malzemesi tanımlı değil.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-auto h-full">
            {recipes.map((recipe: Recipe) => {
              const menuItem = menuItems.find(m => m.id === recipe.menuItemId);
              const sellingPrice = menuItem?.price || 0;
              const margin = sellingPrice - recipe.totalCost;
              const marginPercent = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;
              
              return (
                <div key={recipe.id} className="border border-stone-200 dark:border-stone-800 rounded-2xl p-5 hover:border-orange-300 dark:hover:border-stone-700 transition-all bg-white dark:bg-stone-900 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-black text-stone-800 dark:text-stone-100 mb-3 pb-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                      <span>{recipe.menuItemName}</span>
                      <button
                        onClick={() => handleDeleteRecipe(recipe)}
                        className="text-stone-300 dark:text-stone-600 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-md"
                        title="Reçeteyi Sil"
                      >
                        <Trash2 size={15} />
                      </button>
                    </h3>
                    <div className="space-y-2 mb-6">
                      <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Gerekli Malzemeler:</span>
                      {recipe.items.map((ing: RecipeItem, i: number) => (
                        <div key={i} className="flex justify-between text-xs py-1 border-b border-stone-50 dark:border-stone-800/60">
                          <span className="text-stone-600 dark:text-stone-300 font-medium">{ing.inventoryItemName}</span>
                          <span className="font-mono font-bold text-stone-800 dark:text-stone-100">{ing.quantity} {ing.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-stone-50 dark:bg-stone-950 p-4 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-stone-500 dark:text-stone-400">Satış Fiyatı</span>
                      <span className="font-bold text-stone-900 dark:text-stone-100">{formatCurrency(sellingPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500 dark:text-stone-400">Hammadde Maliyeti</span>
                      <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(recipe.totalCost)}</span>
                    </div>
                    <div className="border-t border-stone-200 dark:border-stone-800 pt-2 flex justify-between font-bold">
                      <span className="text-stone-800 dark:text-stone-200">Brüt Kâr</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(margin)} (%{marginPercent.toFixed(0)})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {recipes.length === 0 && (
              <div className="col-span-3 py-16 text-center text-stone-400 dark:text-stone-500">
                <ChefHat className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-2" />
                <p className="font-bold text-sm text-stone-600 dark:text-stone-300">Henüz ürün reçetesi tanımlanmadı.</p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Yukarıdaki "Yeni Reçete Tanımla" butonuna basarak menü ürünlerine malzeme reçetesi bağlayabilirsiniz.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Inventory Item Modal */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-6 w-full max-w-md shadow-2xl border border-stone-200 dark:border-stone-800 dark:text-stone-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="text-xl font-black text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <Package className="text-orange-600 dark:text-orange-400" size={22} />
                Yeni Hammadde Ekle
              </h3>
              <button 
                onClick={() => setIsAddItemModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Malzeme Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Zeytinyağı"
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Birim</label>
                  <select
                    value={itemUnit}
                    onChange={e => setItemUnit(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="lt">lt (Litre)</option>
                    <option value="adet">adet</option>
                    <option value="gr">gr (Gram)</option>
                    <option value="porsiyon">porsiyon</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Birim Alış (₺)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={itemCost}
                    onChange={e => setItemCost(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Mevcut Stok</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={itemStock}
                    onChange={e => setItemStock(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Kritik Eşik</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={itemMinStock}
                    onChange={e => setItemMinStock(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Tedarikçi Firma (İsteğe bağlı)</label>
                <input
                  type="text"
                  placeholder="Örn: Hal Toptan Ticaret"
                  value={itemSupplier}
                  onChange={e => setItemSupplier(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="flex-1 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl font-bold text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  Malzemeyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Recipe Modal */}
      {isAddRecipeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-6 w-full max-w-lg shadow-2xl border border-stone-200 dark:border-stone-800 dark:text-stone-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="text-xl font-black text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <ChefHat className="text-orange-600 dark:text-orange-400" size={22} />
                Yeni Ürün Reçetesi Tanımla
              </h3>
              <button 
                onClick={() => setIsAddRecipeModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Reçete Eklenecek Menü Ürünü</label>
                <select
                  value={recipeMenuItemId}
                  onChange={e => setRecipeMenuItemId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                >
                  {menuItems.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({formatCurrency(m.price)})</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase text-stone-500 dark:text-stone-400">Kullanılan Hammaddeler</label>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Malzeme Ekle
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {recipeIngredients.map((row, idx) => {
                    const selectedInv = inventoryItems.find(i => i.id === row.inventoryItemId);
                    return (
                      <div key={idx} className="flex gap-2 items-center bg-stone-50 dark:bg-stone-800 p-2 rounded-xl border border-stone-200 dark:border-stone-700">
                        <select
                          value={row.inventoryItemId}
                          onChange={e => handleIngredientChange(idx, 'inventoryItemId', e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-semibold bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100"
                        >
                          {inventoryItems.map(inv => (
                            <option key={inv.id} value={inv.id}>
                              {inv.name} ({formatCurrency(inv.purchaseCost)}/{inv.unit})
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1 w-28">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            value={row.quantity}
                            onChange={e => handleIngredientChange(idx, 'quantity', Number(e.target.value))}
                            className="w-full px-2 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 text-xs font-mono font-bold text-right"
                          />
                          <span className="text-xs text-stone-500 dark:text-stone-400 font-bold">{selectedInv?.unit}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredientRow(idx)}
                          className="text-stone-400 hover:text-red-600 dark:hover:text-red-400 p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddRecipeModalOpen(false)}
                  className="flex-1 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl font-bold text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
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
