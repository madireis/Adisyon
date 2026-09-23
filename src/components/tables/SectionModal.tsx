import React, { useState } from 'react';
import { X, Trash2, Check } from 'lucide-react';
import { db } from '@/lib/db';
import { generateId, cn } from '@/lib/utils';
import type { Floor, Table } from '@/types/pos';
import PosIcon from '@/components/common/PosIcon';

interface SectionModalProps {
  floor?: Floor | null;
  onClose: () => void;
  onSuccess: (floorId?: string) => void;
}

const SECTION_ICONS = [
  { id: 'waves', label: 'Sahil / Deniz' },
  { id: 'trees', label: 'Bahçe / Açık Alan' },
  { id: 'sun', label: 'Teras / Güneş' },
  { id: 'sunset', label: 'Balkon / Manzara' },
  { id: 'coffee', label: 'Salon / Kafe' },
  { id: 'armchair', label: 'Lounge' },
  { id: 'wine', label: 'Bar & Kokteyl' },
  { id: 'umbrella', label: 'Tente / Gölge' },
  { id: 'crown', label: 'VIP Bölüm' },
  { id: 'flame', label: 'Ocakbaşı' },
  { id: 'store', label: 'İç Mekan' },
  { id: 'sparkles', label: 'Özel Alan' },
];

export default function SectionModal({ floor, onClose, onSuccess }: SectionModalProps) {
  const [name, setName] = useState(floor?.name || '');
  const [icon, setIcon] = useState(floor?.icon || 'trees');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!name.trim()) return;

      if (floor) {
        // Update existing floor
        await db.floors.update(floor.id, {
          name: name.trim(),
          icon,
        });
        onSuccess(floor.id);
      } else {
        // Create new floor
        const count = await db.floors.count();
        const newFloorId = generateId();
        const newFloor: Floor = {
          id: newFloorId,
          name: name.trim(),
          icon,
          order: count + 1,
        };
        await db.floors.add(newFloor);
        onSuccess(newFloorId);
      }
    } catch (err: any) {
      console.error('Bölüm kaydedilemedi:', err);
      alert('Bölüm kaydedilirken bir hata oluştu: ' + (err?.message || err));
    }
  };

  const handleDelete = async () => {
    if (!floor) return;
    try {
      const tableCount = await db.table<Table>('tables').where('floorId').equals(floor.id).count();
      if (tableCount > 0) {
        if (!confirm(`Bu bölümde ${tableCount} adet masa bulunuyor. Bölümü silerseniz bu masalar da silinecektir. Devam etmek istiyor musunuz?`)) {
          return;
        }
        await db.table<Table>('tables').where('floorId').equals(floor.id).delete();
      }
      await db.floors.delete(floor.id);
      onSuccess();
    } catch (err: any) {
      console.error('Bölüm silinemedi:', err);
      alert('Bölüm silinirken bir hata oluştu: ' + (err?.message || err));
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-white rounded-3xl w-full max-w-lg p-4 sm:p-6 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center pb-4 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <PosIcon name={icon} className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-stone-900">
              {floor ? 'Bölümü Düzenle' : 'Yeni Bölüm / Alan Ekle'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-stone-400 hover:text-stone-600 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5 pt-4 overflow-y-auto flex-1 pr-1">
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
              Bölüm / Alan Adı
            </label>
            <input
              type="text"
              required
              placeholder="Örn: Açık Teras, Ön Bahçe, Balkon, VIP..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
              Bölüm Vektör İkonu
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SECTION_ICONS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIcon(item.id)}
                  className={cn(
                    "px-3 py-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all cursor-pointer text-left",
                    icon === item.id
                      ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                      : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300"
                  )}
                >
                  <PosIcon name={item.id} className={cn("w-4 h-4 shrink-0", icon === item.id ? "text-white" : "text-stone-500")} />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 flex gap-2 border-t border-stone-100 mt-4">
            {floor && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 size={16} />
                <span>Bölümü Sil</span>
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check size={18} />
              <span>{floor ? 'Değişiklikleri Kaydet' : 'Bölümü Oluştur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
