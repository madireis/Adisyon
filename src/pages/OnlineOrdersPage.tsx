import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Smartphone, Clock, MapPin, CheckCircle, Package, Bike, ChevronRight, Phone, Plus, X, AlertCircle } from 'lucide-react';
import { cn, formatCurrency, generateId, getTimeString } from '@/lib/utils';
import type { OnlineOrder, OnlineOrderStatus, OnlinePlatform, MenuItem } from '@/types/pos';

export default function OnlineOrdersPage() {
  const onlineOrders = useLiveQuery(() => db.onlineOrders.toArray()) || [];
  const menuItems = useLiveQuery(() => db.menuItems.toArray()) || [];

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [platform, setPlatform] = useState<OnlinePlatform>('direct');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [orderItems, setOrderItems] = useState<{ name: string; quantity: number; price: number }[]>([]);

  const advanceOrder = async (order: OnlineOrder) => {
    let nextStatus: OnlineOrderStatus = order.status;
    if (order.status === 'new') nextStatus = 'confirmed';
    else if (order.status === 'confirmed') nextStatus = 'preparing';
    else if (order.status === 'preparing') nextStatus = 'ready';
    else if (order.status === 'ready') nextStatus = 'out_for_delivery';
    else if (order.status === 'out_for_delivery') nextStatus = 'completed';

    if (nextStatus !== order.status) {
      await db.onlineOrders.update(order.id, {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleCancelOrder = async (order: OnlineOrder) => {
    if (confirm(`Bu siparişi iptal etmek istediğinize emin misiniz?`)) {
      await db.onlineOrders.update(order.id, {
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      });
    }
  };

  const platformBadge = (plat: OnlinePlatform) => {
    switch (plat) {
      case 'yemeksepeti':
        return <span className="bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded uppercase">Yemeksepeti</span>;
      case 'getir':
        return <span className="bg-purple-700 text-amber-300 font-black text-[10px] px-2 py-0.5 rounded uppercase">Getir</span>;
      case 'trendyol':
        return <span className="bg-amber-600 text-white font-black text-[10px] px-2 py-0.5 rounded uppercase">Trendyol</span>;
      case 'migros':
        return <span className="bg-orange-500 text-white font-black text-[10px] px-2 py-0.5 rounded uppercase">Migros</span>;
      default:
        return <span className="bg-stone-700 text-white font-bold text-[10px] px-2 py-0.5 rounded uppercase">Telefon / Paket</span>;
    }
  };

  const openAddModal = () => {
    setPlatform('direct');
    setCustomerName('');
    setCustomerPhone('');
    setAddress('Silivri Sahil Mah. ');
    setDeliveryNotes('');
    setOrderItems([]);
    if (menuItems.length > 0) {
      setSelectedItemId(menuItems[0].id);
    }
    setIsAddModalOpen(true);
  };

  const handleAddItemToOrder = () => {
    const m = menuItems.find(item => item.id === selectedItemId);
    if (!m) return;
    setOrderItems(prev => [...prev, { name: m.name, quantity: selectedQuantity, price: m.price }]);
    setSelectedQuantity(1);
  };

  const handleRemoveItemFromOrder = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveOnlineOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !address.trim()) {
      alert('Lütfen müşteri adı, telefon ve teslimat adresini doldurun.');
      return;
    }
    if (orderItems.length === 0) {
      alert('Lütfen siparişe en az bir ürün ekleyin.');
      return;
    }

    try {
      const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const newOrder: OnlineOrder = {
        id: generateId(),
        platform,
        platformOrderId: `${platform.toUpperCase().slice(0, 2)}-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        address: address.trim(),
        items: orderItems,
        total,
        status: 'new',
        notes: '',
        deliveryNotes: deliveryNotes.trim(),
        estimatedDelivery: '30-40 dk',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.onlineOrders.add(newOrder);
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error('Online sipariş eklenemedi:', err);
      alert('Sipariş kaydedilirken bir hata oluştu: ' + (err?.message || err));
    }
  };

  const columns: { id: OnlineOrderStatus; label: string; icon: React.ReactNode }[] = [
    { id: 'new', label: 'Yeni Düşen', icon: <Clock size={16} /> },
    { id: 'confirmed', label: 'Onaylandı', icon: <CheckCircle size={16} /> },
    { id: 'preparing', label: 'Hazırlanıyor', icon: <Package size={16} /> },
    { id: 'ready', label: 'Kurye Bekliyor', icon: <Bike size={16} /> },
    { id: 'out_for_delivery', label: 'Yolda', icon: <MapPin size={16} /> },
    { id: 'completed', label: 'Tamamlandı', icon: <CheckCircle size={16} /> },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto h-full flex flex-col dark:bg-stone-950 dark:text-stone-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-800 tracking-tight flex items-center gap-2">
            <Smartphone className="text-orange-600" />
            Online Paket Siparişleri
          </h1>
          <p className="text-stone-500 text-sm mt-1">Yemeksepeti, Getir, Trendyol ve telefonla paket sipariş entegrasyonu</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          <Plus size={18} />
          Yeni Paket Siparişi Al
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
        {columns.map(col => {
          const colOrders = onlineOrders.filter(o => o.status === col.id);
          return (
            <div key={col.id} className="w-[85vw] max-w-xs sm:w-80 shrink-0 bg-stone-100 dark:bg-stone-900 rounded-2xl flex flex-col max-h-full border border-stone-200 dark:border-stone-800">
              {/* Header */}
              <div className="p-3.5 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center font-bold text-stone-700 dark:text-stone-200 text-xs uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <span className="text-orange-600">{col.icon}</span>
                  <span>{col.label}</span>
                </div>
                <span className="bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-2 py-0.5 rounded-full text-xs font-mono font-bold">
                  {colOrders.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {colOrders.map(order => (
                  <div key={order.id} className="bg-white dark:bg-stone-950 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        {platformBadge(order.platform)}
                        <span className="font-mono text-xs font-bold text-stone-400 dark:text-stone-500">
                          {order.platformOrderId}
                        </span>
                      </div>

                      <div className="mb-2">
                        <div className="font-black text-stone-800 dark:text-stone-100 text-sm">{order.customerName}</div>
                        <div className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400 font-mono mt-0.5">
                          <Phone size={12} />
                          <span>{order.customerPhone}</span>
                        </div>
                      </div>

                      <div className="text-xs text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-900 p-2 rounded-lg border border-stone-100 dark:border-stone-800 mb-3 flex items-start gap-1.5">
                        <MapPin size={14} className="text-stone-400 dark:text-stone-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{order.address}</span>
                      </div>

                      <div className="space-y-1 mb-3">
                        {order.items.map((it, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-stone-700 dark:text-stone-300 font-medium">
                              <span className="font-bold text-orange-600">{it.quantity}x</span> {it.name}
                            </span>
                            <span className="font-mono text-stone-900 dark:text-stone-100 font-bold">{formatCurrency(it.price * it.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="border-t border-stone-100 dark:border-stone-800 pt-2 flex justify-between items-center mb-3">
                        <span className="text-xs text-stone-400 dark:text-stone-500">Toplam Tutar</span>
                        <span className="font-black text-base text-stone-900 dark:text-stone-100">{formatCurrency(order.total)}</span>
                      </div>

                      {order.status !== 'completed' && order.status !== 'cancelled' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCancelOrder(order)}
                            className="px-3 py-2 rounded-xl text-xs font-bold text-stone-500 dark:text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-stone-200 dark:border-stone-700 cursor-pointer"
                          >
                            İptal
                          </button>
                          <button
                            onClick={() => advanceOrder(order)}
                            className="flex-1 py-2 bg-stone-900 dark:bg-stone-800 hover:bg-orange-600 dark:hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>İlerle</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-100 dark:border-emerald-800">
                          {order.status === 'completed' ? 'Teslim Edildi' : 'İptal Edildi'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {colOrders.length === 0 && (
                  <div className="h-32 flex flex-col items-center justify-center text-stone-400 dark:text-stone-600 text-xs">
                    <span>Sipariş yok</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Online Order Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-6 w-full max-w-lg shadow-2xl border border-stone-200 dark:border-stone-800 dark:text-stone-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="text-xl font-black text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <Package className="text-orange-600" size={22} />
                Yeni Paket Siparişi Girişi
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveOnlineOrder} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Sipariş Kanalı</label>
                  <select
                    value={platform}
                    onChange={e => setPlatform(e.target.value as OnlinePlatform)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-semibold bg-white dark:bg-stone-850 text-stone-900 dark:text-stone-100"
                  >
                    <option value="direct">Telefon / Paket Servis</option>
                    <option value="yemeksepeti">Yemeksepeti</option>
                    <option value="getir">Getir Yemek</option>
                    <option value="trendyol">Trendyol Yemek</option>
                    <option value="migros">Migros Yemek</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Müşteri Adı</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Burak Kaya"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-semibold bg-white dark:bg-stone-850 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Telefon Numarası</label>
                <input
                  type="tel"
                  required
                  placeholder="Örn: 0532 999 8877"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-mono bg-white dark:bg-stone-850 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Teslimat Adresi</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Cadde, sokak, bina no, daire..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-sm resize-none bg-white dark:bg-stone-850 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
                />
              </div>

              {/* Product selector */}
              <div>
                <label className="block text-xs font-bold uppercase text-stone-500 dark:text-stone-400 mb-1">Ürün Ekle</label>
                <div className="flex gap-2">
                  <select
                    value={selectedItemId}
                    onChange={e => setSelectedItemId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold bg-white dark:bg-stone-850 text-stone-900 dark:text-stone-100"
                  >
                    {menuItems.map(m => (
                      <option key={m.id} value={m.id}>{m.name} - {formatCurrency(m.price)}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={selectedQuantity}
                    onChange={e => setSelectedQuantity(Number(e.target.value))}
                    className="w-16 px-2 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs text-center font-bold font-mono bg-white dark:bg-stone-850 text-stone-900 dark:text-stone-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddItemToOrder}
                    className="px-4 py-2 bg-stone-900 dark:bg-stone-800 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-orange-600 transition-colors"
                  >
                    Ekle
                  </button>
                </div>

                {orderItems.length > 0 && (
                  <div className="mt-2 space-y-1 bg-stone-50 dark:bg-stone-950 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 max-h-32 overflow-y-auto">
                    {orderItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-stone-700 dark:text-stone-300">{item.quantity}x {item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-stone-900 dark:text-stone-100">{formatCurrency(item.price * item.quantity)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromOrder(idx)}
                            className="text-stone-400 hover:text-red-600 p-0.5 cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl font-bold text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  Siparişi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
