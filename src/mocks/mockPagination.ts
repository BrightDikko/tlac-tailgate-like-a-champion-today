import type { PaginatedResponse } from '@/src/types';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

function normalizePage(page?: number): number {
  if (page === undefined || !Number.isFinite(page) || Number.isNaN(page)) {
    return DEFAULT_PAGE;
  }
  const floored = Math.floor(page);
  return floored < 1 ? DEFAULT_PAGE : floored;
}

function normalizePageSize(pageSize?: number): number {
  if (pageSize === undefined || !Number.isFinite(pageSize) || Number.isNaN(pageSize)) {
    return DEFAULT_PAGE_SIZE;
  }
  const floored = Math.floor(pageSize);
  return floored < 1 ? DEFAULT_PAGE_SIZE : floored;
}

export function paginate<T>(items: T[], page?: number, pageSize?: number): PaginatedResponse<T> {
  const safePage = normalizePage(page);
  const safePageSize = normalizePageSize(pageSize);
  const total = items.length;
  const totalPages = Math.ceil(total / safePageSize);

  const startIndex = (safePage - 1) * safePageSize;
  const endIndex = startIndex + safePageSize;
  const data =
    startIndex >= total || startIndex < 0 ? [] : items.slice(startIndex, Math.min(endIndex, total));

  return {
    data,
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages,
  };
}
