import type { FoodCategory, FoodItem } from '@/src/types';

/** Legacy shape used by publish flows; category aligned with FoodItem. */
export type MenuItemInput = {
  name: string;
  description?: string;
  category: FoodCategory;
  quantityPrepared: number;
};

export type MenuQueryParams = {
  page?: number;
  pageSize?: number;
  category?: FoodCategory;
};

export type CreateMenuItemInput = Omit<FoodItem, 'id'>;

export type UpdateMenuItemInput = Partial<Omit<FoodItem, 'id' | 'tailgateId'>> & {
  id: string;
};
