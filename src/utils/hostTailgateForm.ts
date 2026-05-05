import type { ImageSourcePropType } from 'react-native';

import { foodImages, placeholderImages, tailgateImages } from '@/src/assets/images';
import type { FoodCategory } from '@/src/types';

export const CATEGORY_OPTIONS: { value: FoodCategory; label: string }[] = [
  { value: 'entree', label: 'Entree' },
  { value: 'side', label: 'Side' },
  { value: 'drink', label: 'Drink' },
  { value: 'dessert', label: 'Dessert' },
];

export const TAILGATE_IMAGE_KEYS = Object.keys(tailgateImages) as (keyof typeof tailgateImages)[];
export const FOOD_IMAGE_KEYS = Object.keys(foodImages) as (keyof typeof foodImages)[];

export const TAILGATE_IMAGE_LABELS: Record<string, string> = {
  'domer-grill-crew': 'Domer grill crew',
  'gold-lot-bbq-smoke': 'Gold lot BBQ smoke',
  'irish-veggie-table': 'Irish veggie table',
  'touchdown-taco-cantina': 'Touchdown taco cantina',
  'zahm-dogs-chili': 'Zahm dogs and chili',
};

export const FOOD_IMAGE_LABELS: Record<string, string> = {
  'blue-gold-cupcakes': 'Blue and gold cupcakes',
  'domer-smashburgers': 'Domer smashburgers',
  'four-cheese-mac': 'Four-cheese mac',
  'fudge-brownies': 'Fudge brownies',
  'lemonade-and-iced-tea': 'Lemonade and iced tea',
  'roasted-veggie-tacos': 'Roasted veggie tacos',
  'smoked-brisket': 'Smoked brisket',
  'smoked-wings': 'Smoked wings',
  'stadium-brats': 'Stadium brats',
};

export function sentenceCase(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function labelFromKey(key: string, labels?: Record<string, string>): string {
  return labels?.[key] ?? sentenceCase(key.replace(/-/g, ' '));
}

export function tailgatePreviewSource(key: string | undefined): ImageSourcePropType {
  if (key !== undefined && key in tailgateImages) {
    return tailgateImages[key as keyof typeof tailgateImages];
  }
  return placeholderImages.tailgate;
}

export function foodThumbSource(key: string | undefined): ImageSourcePropType {
  if (key !== undefined && key in foodImages) {
    return foodImages[key as keyof typeof foodImages];
  }
  return placeholderImages.emptyVenue;
}

/** Shared menu row validation for host create/edit tailgate flows. */
export function validateMenuItemFields(
  name: string,
  description: string,
  qtyRaw: string,
  category: FoodCategory | null
): string | null {
  if (name.trim() === '') return 'Menu item name is required.';
  if (description.trim() === '') return 'Menu description is required.';
  if (category === null) return 'Pick a category.';
  const q = Number.parseInt(qtyRaw, 10);
  if (!Number.isFinite(q) || q < 1) return 'Quantity must be a positive integer.';
  return null;
}
