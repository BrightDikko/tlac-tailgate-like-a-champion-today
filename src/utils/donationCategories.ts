import type { DonationCategory, DonationCenter } from '@/src/types';

const ALL_CATEGORIES: DonationCategory[] = [
  'prepared_food',
  'packaged_drinks',
  'packaged_food',
  'produce',
];

export function categoryLabel(category: DonationCategory): string {
  switch (category) {
    case 'prepared_food':
      return 'Prepared food';
    case 'packaged_drinks':
      return 'Packaged drinks';
    case 'packaged_food':
      return 'Packaged food';
    case 'produce':
      return 'Produce';
  }
}

export function acceptedCategoriesForCenter(center: DonationCenter): DonationCategory[] {
  if (Array.isArray(center.acceptedDonationCategories) && center.acceptedDonationCategories.length > 0) {
    return center.acceptedDonationCategories;
  }
  return center.acceptsPreparedFood ? ['prepared_food'] : [];
}

export function centerAcceptsCategory(center: DonationCenter, category: DonationCategory): boolean {
  return acceptedCategoriesForCenter(center).includes(category);
}

export function allDonationCategories(): DonationCategory[] {
  return [...ALL_CATEGORIES];
}
