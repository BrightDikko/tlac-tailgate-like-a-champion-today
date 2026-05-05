import { defaultHrefForUserRole } from '@/src/features/auth/postAuthRoute';
import type { UserRole } from '@/src/types';
import { paramOne } from '@/src/utils/routeParams';

/** Safe in-app paths only; used after login/register (no arbitrary open redirects). */
const POST_AUTH_REDIRECT_ALLOWLIST = new Set([
  '/surplus',
  '/discover',
  '/impact',
  '/profile',
  '/dashboard',
  // Host tabs/workflows behind existing remote auth gate; safe explicit redirect targets after login.
  '/publish',
  '/donate',
]);

export function normalizeAllowlistedRedirectPath(raw: string | undefined): string | null {
  if (raw === undefined || raw === '') return null;
  const pathOnly = raw.split('?')[0].trim();
  if (!pathOnly.startsWith('/') || pathOnly.includes('..')) return null;
  return POST_AUTH_REDIRECT_ALLOWLIST.has(pathOnly) ? pathOnly : null;
}

/**
 * Resolve navigation target after successful login/register.
 * Honors optional `redirectTo`, `intent`, `surplusId` search params when safe.
 */
export function hrefAfterAuthFromParams(
  role: UserRole,
  raw: Record<string, string | string[] | undefined>,
): string {
  const redirectTo = normalizeAllowlistedRedirectPath(paramOne(raw.redirectTo));
  const intent = paramOne(raw.intent);
  const surplusId = paramOne(raw.surplusId);

  if (redirectTo === '/surplus' && intent === 'claimSurplus' && surplusId !== undefined && surplusId.length > 0) {
    const id = encodeURIComponent(surplusId);
    return `/surplus?focusSurplusId=${id}&claimSurplusId=${id}`;
  }
  if (redirectTo !== null) {
    return redirectTo;
  }
  return defaultHrefForUserRole(role);
}
