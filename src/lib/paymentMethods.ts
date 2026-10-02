import { CreditCard, Banknote, Gift, Wallet, Coins, DollarSign, Smartphone } from 'lucide-react';
import type { PaymentMethodConfig, PaymentMethodCategory } from '@/types/pos';

export const DEFAULT_PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'cash',
    name: 'Nakit',
    description: 'Nakit Türk Lirası ile tahsilat',
    category: 'cash',
    icon: 'Banknote',
    color: 'bg-emerald-600 text-white hover:bg-emerald-700',
    enabled: true,
    isDefault: true,
    order: 1,
  },
  {
    id: 'credit_card',
    name: 'POS / Kredi Kartı',
    description: 'Banka ve Kredi Kartı (Fiziki POS)',
    category: 'card',
    icon: 'CreditCard',
    color: 'bg-blue-600 text-white hover:bg-blue-700',
    enabled: true,
    isDefault: true,
    order: 2,
  },
  {
    id: 'sodexo',
    name: 'Sodexo',
    description: 'Sodexo Restaurant Pass',
    category: 'meal_card',
    icon: 'CreditCard',
    color: 'bg-orange-600 text-white hover:bg-orange-700',
    enabled: true,
    isDefault: false,
    order: 3,
  },
  {
    id: 'multinet',
    name: 'Multinet',
    description: 'Multinet Yemek Kartı',
    category: 'meal_card',
    icon: 'CreditCard',
    color: 'bg-amber-600 text-white hover:bg-amber-700',
    enabled: true,
    isDefault: false,
    order: 4,
  },
  {
    id: 'ticket',
    name: 'Ticket Edenred',
    description: 'Ticket Restaurant Edenred',
    category: 'meal_card',
    icon: 'CreditCard',
    color: 'bg-red-600 text-white hover:bg-red-700',
    enabled: true,
    isDefault: false,
    order: 5,
  },
  {
    id: 'metropol',
    name: 'Metropol Card',
    description: 'Metropol Yemek Kartı',
    category: 'meal_card',
    icon: 'CreditCard',
    color: 'bg-purple-600 text-white hover:bg-purple-700',
    enabled: true,
    isDefault: false,
    order: 6,
  },
  {
    id: 'ikram',
    name: 'Müdür İkramı',
    description: 'Yetkili İkram (Yönetici Onaylı)',
    category: 'gift',
    icon: 'Gift',
    color: 'bg-stone-700 text-white hover:bg-stone-800',
    enabled: true,
    isDefault: true,
    order: 7,
  },
];

export const PAYMENT_METHOD_STORAGE_KEY = 'wots_payment_methods_custom';

export function getPaymentMethods(): PaymentMethodConfig[] {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_PAYMENT_METHODS;
    const raw = localStorage.getItem(PAYMENT_METHOD_STORAGE_KEY);
    if (!raw) return DEFAULT_PAYMENT_METHODS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('[PaymentMethods] Error reading from localStorage, falling back to defaults', err);
  }
  return DEFAULT_PAYMENT_METHODS;
}

export function savePaymentMethods(methods: PaymentMethodConfig[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PAYMENT_METHOD_STORAGE_KEY, JSON.stringify(methods));
      // Dispatch storage event so other components or tabs update immediately
      window.dispatchEvent(new CustomEvent('wots_payment_methods_updated', { detail: methods }));
    }
  } catch (err) {
    console.error('[PaymentMethods] Error saving to localStorage', err);
  }
}

export function getPaymentMethodIcon(iconName?: string) {
  switch (iconName) {
    case 'Banknote':
    case 'cash':
      return Banknote;
    case 'Gift':
    case 'ikram':
      return Gift;
    case 'Wallet':
      return Wallet;
    case 'Coins':
      return Coins;
    case 'DollarSign':
      return DollarSign;
    case 'Smartphone':
      return Smartphone;
    case 'CreditCard':
    default:
      return CreditCard;
  }
}

export function getPaymentMethodNameMap(methods?: PaymentMethodConfig[]): Record<string, string> {
  const current = methods || getPaymentMethods();
  const map: Record<string, string> = {
    cash: 'Nakit TL',
    credit_card: 'POS / Kredi Kartı',
    debit_card: 'Banka Kartı',
    sodexo: 'Sodexo',
    multinet: 'Multinet',
    ticket: 'Ticket Edenred',
    metropol: 'Metropol Card',
    ikram: 'Yetkili İkram',
  };

  current.forEach((m) => {
    map[m.id] = m.name;
  });

  return map;
}
