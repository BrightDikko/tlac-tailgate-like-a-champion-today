import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { authApi } from '@/src/api/endpoints/authApi';
import { store } from '@/src/redux/store';
import { clearCredentials, hydrateTokens, setCredentials } from '@/src/features/auth/authSlice';
import { tokenStorage } from '@/src/services/storage/tokenStorage';
import { colors } from '@/src/theme/colors';

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const access = await tokenStorage.getAccessToken();
        const refresh = await tokenStorage.getRefreshToken();
        if (access !== null && access.length > 0) {
          store.dispatch(hydrateTokens({ accessToken: access, refreshToken: refresh ?? undefined }));
          try {
            const user = await store
              .dispatch(authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true }))
              .unwrap();
            if (!cancelled) {
              store.dispatch(
                setCredentials({
                  user,
                  accessToken: access,
                  refreshToken: refresh ?? undefined,
                })
              );
            }
          } catch {
            if (!cancelled) {
              // Clear invalid credentials; remote public browse/read screens can still load without auth.
              store.dispatch(clearCredentials());
              await tokenStorage.clearTokens();
            }
          }
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <View style={styles.bootWrap}>
        <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Starting app" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  bootWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
