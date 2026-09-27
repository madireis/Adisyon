import React, { useState, useEffect } from 'react';
import { X, Trash2, Check, AlertCircle, Loader2, QrCode, ExternalLink, Copy } from 'lucide-react';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { generateQRCodeSVG } from '@/lib/qrCodeGenerator';
import { useLocalNetwork } from '@/lib/useLocalNetwork';
import type { Table, Floor } from '@/types/pos';

interface TableModalProps {
  table?: Table | null;
  defaultFloorId: string;
  floors: Floor[];
  onClose: () => void;
  onSuccess: (savedFloorId?: string) => void;
}

export default function TableModal({ table, defaultFloorId, floors, onClose, onSuccess }: TableModalProps) {
  // Ensure we have a valid initial floor ID
  const getInitialFloorId = () => {
    if (table?.floorId) return table.floorId;
    if (floors.some(f => f.id === defaultFloorId)) return defaultFloorId;
    return floors[0]?.id || 'floor-1';
  };

  const [label, setLabel] = useState(table?.label || '');
  const [seats, setSeats] = useState<number>(table?.seats || 4);
  const [shape, setShape] = useState<'square' | 'round' | 'rectangle'>(table?.shape || 'square');
  const [floorId, setFloorId] = useState<string>(getInitialFloorId());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [copiedQr, setCopiedQr] = useState(false);

  const { networkInfo } = useLocalNetwork();
  const effectiveIp = networkInfo?.localIp && networkInfo.localIp !== '127.0.0.1' && networkInfo.localIp !== 'localhost'
    ? networkInfo.localIp
    : (window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
        ? window.location.hostname
        : '192.168.1.33');
  const tableQrUrl = table ? `http://${effectiveIp}:3001/qr/${table.id}` : '';

  // Sync state when props change
  useEffect(() => {
    if (table) {
      setLabel(table.label);
      setSeats(table.seats);
      setShape(table.shape);
      setFloorId(table.floorId);
    } else {
      setLabel('');
      setSeats(4);
      setShape('square');
      const validFloorId = floors.some(f => f.id === defaultFloorId) ? defaultFloorId : (floors[0]?.id || 'floor-1');
      setFloorId(validFloorId);
    }
    setErrorMsg('');
  }, [table, defaultFloorId, floors]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = label.trim().toUpperCase();
    if (!cleanLabel) {
      setErrorMsg('Lütfen masa etiketi / numarası girin.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      // Check if table label already exists in the selected floor (exclude current table if editing)
      const existing = await db.table<Table>('tables')
        .where('floorId')
        .equals(floorId)
        .filter(t => t.label.toUpperCase() === cleanLabel && (!table || t.id !== table.id))
        .first();

      if (existing) {
        setErrorMsg(`"${cleanLabel}" masası seçilen bölümde zaten kayıtlı! Lütfen farklı bir numara/etiket verin.`);
        setIsSubmitting(false);
        return;
      }

      if (table) {
        // Update existing table
        await db.table<Table>('tables').update(table.id, {
          label: cleanLabel,
          seats: Number(seats),
          shape,
          floorId,
        });
      } else {
        // Extract numeric part for sorting
        const match = cleanLabel.match(/\d+/);
        const number = match ? parseInt(match[0], 10) : 99;

        const newTable: Table = {
          id: generateId(),
          floorId,
          number,
          label: cleanLabel,
          seats: Number(seats),
          status: 'available',
          guestCount: 0,
          posX: 20,
          posY: 20,
          shape,
        };
        await db.table<Table>('tables').add(newTable);
      }

      onSuccess(floorId);
    } catch (err: any) {
      console.error('Masa kaydedilemedi:', err);
      setErrorMsg(err?.message || 'Masa kaydedilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!table) return;
    if (table.status === 'occupied' || table.status === 'payment_waiting') {
      alert('Dolu veya hesabı bekleyen masa silinemez! Lütfen önce adisyonu kapatın.');
      return;
    }
    if (confirm(`${table.label} masasını silmek istediğinize emin misiniz?`)) {
      try {
        setIsSubmitting(true);
        await db.table<Table>('tables').delete(table.id);
        onSuccess(floorId);
      } catch (err: any) {
        console.error('Masa silinemedi:', err);
        setErrorMsg('Masa silinirken bir hata meydana geldi.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none animate-fadeIn">
      <div className="bg-white dark:bg-stone-900 dark:border-stone-800 dark:text-stone-100 rounded-3xl w-full max-w-md p-4 sm:p-6 shadow-2xl border border-stone-200">
        <div className="flex justify-between items-center pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-xl font-black text-stone-900">
              {table ? `${table.label} Masasını Düzenle` : 'Yeni Masa Ekle'}
            </h2>
            <p className="text-xs text-stone-400 font-medium mt-0.5">
              {table ? 'Masa kapasitesi, şekli ve bölümünü güncelleyin.' : 'Masa planına yeni bir servis masası tanımlayın.'}
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-bold">
            <AlertCircle size={16} className="shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
              Masa Etiketi / Numarası *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Örn: M12, T4, B2, BAHÇE-1..."
              value={label}
              onChange={e => {
                setLabel(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-800 rounded-xl text-base font-black focus:ring-2 focus:ring-orange-500 outline-none uppercase dark:text-stone-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
              Bulunduğu Bölüm / Alan *
            </label>
            <select
              value={floorId}
              onChange={e => setFloorId(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer dark:text-stone-100"
            >
              {floors.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                Kişi Kapasitesi
              </label>
              <input
                type="number"
                min="1"
                max="30"
                required
                value={seats}
                onChange={e => setSeats(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                Görsel Şekil
              </label>
              <select
                value={shape}
                onChange={e => setShape(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer dark:text-stone-100"
              >
                <option value="square">Kare (Standart)</option>
                <option value="round">Yuvarlak (Bistro/Cafe)</option>
                <option value="rectangle">Dikdörtgen (Geniş Masa)</option>
              </select>
            </div>
          </div>

          {/* Visual Preview */}
          <div className="bg-stone-50 dark:bg-stone-950 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">Masa Önizlemesi</span>
            <div className={`border-2 border-orange-500 bg-orange-50/70 dark:bg-orange-950/40 flex flex-col items-center justify-center shadow-xs transition-all ${
              shape === 'round' ? 'w-24 h-24 rounded-full' : shape === 'rectangle' ? 'w-32 h-20 rounded-2xl' : 'w-24 h-24 rounded-2xl'
            }`}>
              <span className="font-black text-xl text-stone-900 dark:text-stone-100">{label.trim().toUpperCase() || 'M?'}</span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 font-bold">{seats} Kişilik</span>
            </div>
          </div>

          {/* Table Customer QR Code Section */}
          {table && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className="w-full py-2 px-3 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <QrCode size={16} className="text-orange-600" />
                  <span>Müşteri Menü QR Kodu (Masa {table.label})</span>
                </span>
                <span className="text-[11px] text-stone-500 font-bold">{showQr ? 'Kapat' : 'QR Göster'}</span>
              </button>

              {showQr && (
                <div className="mt-2.5 p-3.5 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col items-center gap-2.5 text-center animate-in fade-in">
                  <div 
                    className="p-2.5 bg-white rounded-xl shadow-xs border border-stone-200"
                    dangerouslySetInnerHTML={{ __html: generateQRCodeSVG(tableQrUrl, 160) }}
                  />
                  <code className="text-[11px] font-mono text-orange-600 font-bold truncate max-w-full px-2">
                    {tableQrUrl}
                  </code>
                  <div className="flex gap-2 w-full pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(tableQrUrl);
                        setCopiedQr(true);
                        setTimeout(() => setCopiedQr(false), 2000);
                      }}
                      className="flex-1 py-1.5 bg-white hover:bg-stone-100 text-stone-950 font-black text-xs rounded-lg border border-stone-300 shadow-2xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedQr ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      <span>{copiedQr ? 'Kopyalandı' : 'Kopyala'}</span>
                    </button>
                    <a
                      href={tableQrUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-1.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 text-white dark:text-stone-900 font-bold text-xs rounded-lg shadow-2xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <ExternalLink size={14} />
                      <span>Test Et</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex gap-2">
            {table && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-3 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={16} />
                <span>Masayı Sil</span>
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Check size={18} />
              )}
              <span>{table ? 'Değişiklikleri Kaydet' : 'Masayı Ekle'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
