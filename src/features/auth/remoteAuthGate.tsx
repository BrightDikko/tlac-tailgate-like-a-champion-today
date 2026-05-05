import type { ReactNode } from 'react';
import { Redirect } from 'expo-router';

import { selectAccessToken, selectIsAuthenticated } from '@/src/features/auth/authSelectors';
import { useAppSelector } from '@/src/redux/hooks';
import { API_MODE } from '@/src/services/config/env';

export type RemoteAuthGateResult = {
  /**
   * When true (remote mode only), the user has no valid session and should be sent to `/login`.
   * Role is not considered — any authenticated user passes.
   */
  shouldRedirectToLogin: boolean;
};

/**
 * Remote API mode requires a stored access token and `isAuthenticated` from Redux.
 * Mock mode never redirects — frictionless demo navigation is preserved.
 */
export function useRemoteAuthGate(): RemoteAuthGateResult {
  const accessToken = useAppSelector(selectAccessToken);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (API_MODE !== 'remote') {
    return { shouldRedirectToLogin: false };
  }

  const hasToken = typeof accessToken === 'string' && accessToken.length > 0;
  return {
    shouldRedirectToLogin: !hasToken || !isAuthenticated,
  };
}

/**
 * Wraps screen content: in remote mode, unauthenticated users see `/login` instead of children.
 */
export function RequireRemoteAuth({ children }: { children: ReactNode }) {
  const { shouldRedirectToLogin } = useRemoteAuthGate();
  if (shouldRedirectToLogin) {
    return <Redirect href="/login" />;
  }
  return <>{children}</>;
}
