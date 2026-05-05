import type { UserRole } from '@/src/types';

/** Default tab shell after login/register based on API user role. */
export function defaultHrefForUserRole(role: UserRole): '/dashboard' | '/discover' {
  if (role === 'host' || role === 'admin') {
    return '/dashboard';
  }
  return '/discover';
}
