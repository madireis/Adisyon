import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Search, Plus, Edit2, Check, X, Trash2, Utensils, Sparkles } from 'lucide-react';
import { cn, generateId } from '@/lib/utils';
import PosIcon from '@/components/common/PosIcon';
import type { MenuItem, KitchenStation } from '@/types/pos';
import { seedDefaultMenu } from '@/lib/mockData';

export default function MenuPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(100);
  const [categoryId, setCategoryId] = useState('');
  const [station, setStation] = useState<KitchenStation>('kitchen');
  const [preparationTime, setPreparationTime] = useState<number>(10);
  const [vat, setVat] = useState<number>(8);
  const [errorMessage, setErrorMessage] = useState('');
  
  const menuItems = useLiveQuery(() => db.menuItems.toArray()) || [];
  const categories = useLiveQuery(() => db.categories.toArray()) || [];

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategory = activeCategory === 'ALL' || item.categoryId === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleAvailability = async (item: MenuItem) => {
    await db.menuItems.update(item.id, { available: !item.available });
  };

  const stationLabels: Record<string, string> = {
    kitchen: 'Sıcak Mutfak',
    bar: 'Bar',
    dessert: 'Tatlı',
    coffee: 'Kahve Barı',
  };

  const openAddModal = () => {
    setName('');
    setDescription('');
    setPrice(120);
    setCategoryId(categories[0]?.id || 'cat-1');
    setStation('kitchen');
    setPreparationTime(10);
    setVat(8);
    setErrorMessage('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description || '');
    setPrice(item.price);
    setCategoryId(item.categoryId);
    setStation(item.station);
    setPreparationTime(item.preparationTime || 10);
    setVat(item.vat || 8);
    setErrorMessage('');
  };

  const handleSaveNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Ürün adı boş bırakılamaz');
      return;
    }
    if (price <= 0) {
      setErrorMessage('Satış fiyatı 0\'dan büyük olmalıdır');
      return;
    }

    try {
      const newItem: MenuItem = {
        id: generateId(),
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        categoryId: categoryId || categories[0]?.id || 'cat-1',
        station,
        preparationTime: Number(preparationTime) || 10,
        vat: Number(vat) || 8,
        available: true,
        modifierGroups: [],
      };

      await db.menuItems.add(newItem);
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error('Ürün eklenemedi:', err);
      setErrorMessage('Ürün eklenirken bir hata oluştu: ' + (err?.message || err));
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!name.trim()) {
      setErrorMessage('Ürün adı boş bırakılamaz');
      return;
    }
    if (price <= 0) {
      setErrorMessage('Satış fiyatı 0\'dan büyük olmalıdır');
      return;
    }

    try {
      await db.menuItems.update(editingItem.id, {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        categoryId,
        station,
        preparationTime: Number(preparationTime) || 10,
        vat: Number(vat) || 8,
      });
      setEditingItem(null);
    } catch (err: any) {
      console.error('Ürün güncellenemedi:', err);
      setErrorMessage('Ürün güncellenirken bir hata oluştu: ' + (err?.message || err));
    }
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (confirm(`"${item.name}" ürününü menüden tamamen silmek istediğinize emin misiniz?`)) {
      await db.menuItems.delete(item.id);
    }
  };

  const handleLoadDefaultMenu = async () => {
    try {
      if (menuItems.length > 0) {
        if (!confirm("Wot's Cafe 85 çeşit standart restoran menüsünü (Kahvaltı, Burger, Pizza, Izgara, İçecekler vb.) yüklemek istiyor musunuz?")) {
          return;
        }
      }
      await seedDefaultMenu(db, false);
      alert("Wot's Cafe standart restoran menüsü başarıyla yüklendi! (85 ürün)");
    } catch (err: any) {
      console.error('Menü yüklenirken hata:', err);
      alert('Menü yüklenirken bir hata oluştu: ' + (err?.message || err));
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-800 tracking-tight">Menü Yönetimi</h1>
          <p className="text-stone-500 text-sm mt-1">Wot's Cafe lezzetlerini, porsiyonlarını ve istasyonlarını yönetin</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <button 
            onClick={handleLoadDefaultMenu}
            className="bg-white hover:bg-stone-50 text-stone-700 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 border border-stone-200 shadow-xs transition-colors cursor-pointer"
            title="Wot's Cafe 85 kalem standart restoran menüsünü yükle"
          >
            <Sparkles size={16} className="text-orange-500" />
            Standart Menüyü Yükle
          </button>
          <button 
            onClick={openAddModal}
            className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Plus size={18} />
            Yeni Ürün Ekle
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-stone-50/50">
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer",
                activeCategory === 'ALL' ? "bg-stone-900 text-white shadow-sm" : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
              )}
            >
              Tümü ({menuItems.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer",
                  activeCategory === cat.id ? "bg-stone-900 text-white shadow-sm" : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
                )}
              >
                <PosIcon name={cat.icon} className="w-4 h-4 shrink-0" />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              placeholder="Ürün adı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-stone-50 sticky top-0 z-10 text-xs uppercase tracking-wider font-bold text-stone-500 border-b border-stone-200">
              <tr>
                <th className="py-3 sm:py-3.5 px-3 sm:px-6">Ürün Adı</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-6">Kategori</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-6 text-right">Fiyat</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-6">Hazırlık İstasyonu</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-6">Durum</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-6 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {filteredItems.map(item => {
                const category = categories.find(c => c.id === item.categoryId);
                return (
                  <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <div className="font-bold text-stone-800">{item.name}</div>
                      {item.description && <div className="text-xs text-stone-400 truncate max-w-xs mt-0.5">{item.description}</div>}
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-stone-600 font-medium">{category?.name || '-'}</td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-right font-extrabold text-stone-900">₺{item.price}</td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <span className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-xs font-semibold">
                        {stationLabels[item.station] || item.station}
                      </span>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6">
                      <button 
                        onClick={() => toggleAvailability(item)}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                          item.available 
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" 
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        )}
                      >
                        {item.available ? <Check size={13} /> : <X size={13} />}
                        {item.available ? 'Satışta' : 'Tükendi'}
                      </button>
                    </td>
                    <td className="py-3 sm:py-4 px-3 sm:px-6 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                          title="Ürünü Düzenle"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(item)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Ürünü Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    {menuItems.length === 0 ? (
                      <div className="max-w-md mx-auto flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                          <Utensils size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-stone-800 mb-1">Menüde Henüz Ürün Yok</h3>
                        <p className="text-sm text-stone-500 mb-5">
                          Wot's Cafe Silivri Sahil için hazırlanmış kahvaltı, ızgara, burger, pizza, tatlı ve kahve çeşitlerini tek tıkla yükleyebilirsiniz.
                        </p>
                        <button
                          onClick={handleLoadDefaultMenu}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                        >
                          <Sparkles size={18} />
                          Wot's Cafe Restoran Menüsünü Yükle (85 Ürün)
                        </button>
                      </div>
                    ) : (
                      <span className="text-stone-400">Arama kriterine uygun ürün bulunamadı.</span>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-4 sm:p-6 w-full max-w-lg shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-stone-100">
              <h3 className="text-xl font-black text-stone-800 flex items-center gap-2">
                <Utensils className="text-orange-600" size={22} />
                Yeni Menü Ürünü Ekle
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Ürün Adı</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Trüflü Burger"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Kategori</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold bg-white cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Satış Fiyatı (₺)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={price}
                    onChange={e => setPrice(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-extrabold text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Hazırlık İstasyonu</label>
                  <select
                    value={station}
                    onChange={e => setStation(e.target.value as KitchenStation)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold bg-white cursor-pointer"
                  >
                    <option value="kitchen">Sıcak Mutfak</option>
                    <option value="bar">Bar</option>
                    <option value="coffee">Kahve Barı</option>
                    <option value="dessert">Tatlı</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Hazırlık Süresi (dk)</label>
                  <input
                    type="number"
                    min={1}
                    value={preparationTime}
                    onChange={e => setPreparationTime(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Açıklama / İçindekiler</label>
                  <textarea
                    rows={2}
                    placeholder="Örn: 180gr dana köfte, cheddar, karamelize soğan"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 border border-stone-200 rounded-xl font-bold text-xs text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  Ürünü Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-4 sm:p-6 w-full max-w-lg shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-stone-100">
              <h3 className="text-xl font-black text-stone-800 flex items-center gap-2">
                <Edit2 className="text-orange-600" size={20} />
                Ürünü Düzenle
              </h3>
              <button 
                onClick={() => setEditingItem(null)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateItem} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Ürün Adı</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Kategori</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold bg-white cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Satış Fiyatı (₺)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={price}
                    onChange={e => setPrice(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-extrabold text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Hazırlık İstasyonu</label>
                  <select
                    value={station}
                    onChange={e => setStation(e.target.value as KitchenStation)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold bg-white cursor-pointer"
                  >
                    <option value="kitchen">Sıcak Mutfak</option>
                    <option value="bar">Bar</option>
                    <option value="coffee">Kahve Barı</option>
                    <option value="dessert">Tatlı</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Hazırlık Süresi (dk)</label>
                  <input
                    type="number"
                    min={1}
                    value={preparationTime}
                    onChange={e => setPreparationTime(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Açıklama / İçindekiler</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 border border-stone-200 rounded-xl font-bold text-xs text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  Güncellemeyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
