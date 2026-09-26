import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import type { MenuItem, ModifierGroup, Modifier, OrderItemModifier } from '@/types/pos';

interface ModifierModalProps {
  item: MenuItem;
  onClose: () => void;
  onConfirm: (modifiers: OrderItemModifier[]) => void;
}

export default function ModifierModal({ item, onClose, onConfirm }: ModifierModalProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, Modifier[]>>({});
  const [notes, setNotes] = useState('');

  const handleToggleModifier = (group: ModifierGroup, modifier: Modifier) => {
    setSelectedModifiers(prev => {
      const groupMods = prev[group.id] || [];
      const isSelected = groupMods.some(m => m.id === modifier.id);

      if (group.type === 'single') {
        return { ...prev, [group.id]: [modifier] };
      }

      if (isSelected) {
        return { ...prev, [group.id]: groupMods.filter(m => m.id !== modifier.id) };
      } else {
        return { ...prev, [group.id]: [...groupMods, modifier] };
      }
    });
  };

  const isModifierSelected = (groupId: string, modifierId: string) => {
    return (selectedModifiers[groupId] || []).some(m => m.id === modifierId);
  };

  const handleConfirm = () => {
    const allModifiers: Modifier[] = Object.values(selectedModifiers).flat();
    const orderItemModifiers: OrderItemModifier[] = allModifiers.map(m => ({
      modifierId: m.id,
      name: m.name,
      price: m.price,
    }));
    onConfirm(orderItemModifiers);
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-stone-900 dark:border-stone-800 dark:text-stone-100 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border border-stone-200">
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h2 className="text-xl font-black text-stone-900 dark:text-stone-100">{item.name}</h2>
            <p className="text-orange-600 dark:text-orange-400 font-bold text-base mt-0.5">{formatCurrency(item.price)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {item.modifierGroups?.map(group => (
            <div key={group.id}>
              <div className="flex justify-between items-baseline mb-2.5">
                <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 uppercase tracking-wider">{group.name}</h3>
                <span className="text-[11px] text-stone-400 dark:text-stone-400">
                  {group.type === 'single' ? 'Tek seçim' : group.type === 'remove' ? 'Çıkarılacaklar' : 'İsteğe bağlı'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {group.modifiers.map(modifier => {
                  const isSelected = isModifierSelected(group.id, modifier.id);
                  const isRemove = group.type === 'remove';
                  
                  return (
                    <button
                      key={modifier.id}
                      onClick={() => handleToggleModifier(group, modifier)}
                      className={cn(
                        "flex items-center justify-between p-3.5 rounded-xl border-2 transition-all w-full text-left cursor-pointer",
                        isSelected 
                          ? "border-orange-600 bg-orange-50/70 dark:bg-orange-950/40" 
                          : "border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:border-orange-300 dark:hover:border-stone-600"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-5 h-5 flex items-center justify-center shrink-0 border-2",
                          group.type === 'single' ? 'rounded-full' : 'rounded-lg',
                          isSelected ? "bg-orange-600 text-white border-orange-600" : "border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800"
                        )}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className={cn(
                          "font-semibold text-sm",
                          isRemove && isSelected && "line-through text-stone-400",
                          !isRemove && "text-stone-800 dark:text-stone-200"
                        )}>
                          {modifier.name}
                        </span>
                      </div>
                      {modifier.price > 0 && !isRemove && (
                        <span className="font-bold text-stone-700 dark:text-stone-300 text-sm shrink-0">+{formatCurrency(modifier.price)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          
          <div>
             <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 uppercase tracking-wider mb-2">Özel Mutfak Notu</h3>
             <textarea
               value={notes}
               onChange={e => setNotes(e.target.value)}
               placeholder="Örn: Az tuzlu, alerjen uyarısı vb."
               className="w-full p-3 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
               rows={2}
             />
          </div>
        </div>

        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
          <button
            onClick={handleConfirm}
            className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
          >
            SİPARİŞE EKLE
          </button>
        </div>
      </div>
    </div>
  );
}
