import React from 'react';
import {
  Waves,
  Coffee,
  Wine,
  Sunset,
  Trees,
  Leaf,
  Palmtree,
  Sun,
  Umbrella,
  Armchair,
  Crown,
  Flame,
  Store,
  Sparkles,
  Egg,
  Salad,
  Sandwich,
  Pizza,
  Utensils,
  UtensilsCrossed,
  Beef,
  Cake,
  GlassWater,
  Martini,
  Beer,
  Soup,
  Drumstick,
  IceCream2,
  ChefHat,
  Sailboat,
  LayoutGrid,
} from 'lucide-react';

interface PosIconProps {
  name?: string;
  className?: string;
  size?: number;
}

// Map both semantic names and legacy emoji characters to Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  // Named sections & environments
  waves: Waves,
  coffee: Coffee,
  wine: Wine,
  sunset: Sunset,
  trees: Trees,
  leaf: Leaf,
  palmtree: Palmtree,
  sun: Sun,
  umbrella: Umbrella,
  armchair: Armchair,
  crown: Crown,
  flame: Flame,
  store: Store,
  sparkles: Sparkles,
  sailboat: Sailboat,
  'layout-grid': LayoutGrid,

  // Named food & drinks
  egg: Egg,
  breakfast: Egg,
  salad: Salad,
  starters: Salad,
  sandwich: Sandwich,
  burger: Sandwich,
  pizza: Pizza,
  utensils: Utensils,
  pasta: Utensils,
  beef: Beef,
  main: Beef,
  meat: Beef,
  cake: Cake,
  dessert: Cake,
  'glass-water': GlassWater,
  cold: GlassWater,
  drink: GlassWater,
  martini: Martini,
  cocktail: Martini,
  beer: Beer,
  soup: Soup,
  chicken: Drumstick,
  drumstick: Drumstick,
  'ice-cream': IceCream2,
  'chef-hat': ChefHat,

  // Legacy emoji fallback mapping (replaces default Windows emojis with crisp vector icons)
  '🌿': Leaf,
  '☕': Coffee,
  '🍸': Martini,
  '🌅': Sunset,
  '🍳': Egg,
  '🥗': Salad,
  '🍔': Sandwich,
  '🍕': Pizza,
  '🍝': Utensils,
  '🥩': Beef,
  '🍰': Cake,
  '🧊': GlassWater,
  '🍹': Martini,
  '🏖️': Umbrella,
  '🛋️': Armchair,
  '🌴': Palmtree,
  '🍷': Wine,
  '⛵': Sailboat,
  '🔥': Flame,
  '🪑': Armchair,
  '🍽️': Utensils,
  '⭐': Sparkles,
  '👑': Crown,
  '🌊': Waves,
  '🌳': Trees,
  '☀️': Sun,
};

export default function PosIcon({ name, className = 'w-4 h-4', size }: PosIconProps) {
  if (!name) {
    return <Utensils className={className} size={size} />;
  }

  const normalized = name.toLowerCase().trim();
  const Component = ICON_MAP[normalized] || ICON_MAP[name] || UtensilsCrossed;

  return <Component className={className} size={size} />;
}
