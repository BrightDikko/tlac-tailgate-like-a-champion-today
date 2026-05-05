import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useGetMeQuery } from '../api/endpoints/authApi';
import { selectCurrentUser, selectIsAuthenticated } from '../features/auth/authSelectors';
import { useAppSelector } from '../redux/hooks';
import { API_MODE } from '../services/config/env';
import { colors } from '../theme/colors';
import { AppHeader } from './AppHeader';
import { UserAvatar } from './UserAvatar';

type HostBrandedHeaderProps = {
  subtitle: string;
  rightAction?: ReactNode;
};

/**
 * Host shell header aligned with Student/Fan Discover: TLAC brand and logged-in host avatar.
 */
export function HostBrandedHeader({ subtitle, rightAction }: HostBrandedHeaderProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const reduxUser = useAppSelector(selectCurrentUser);
  const skipMeQuery = reduxUser !== null || (API_MODE === 'remote' && !isAuthenticated);
  const { data: queriedUser } = useGetMeQuery(undefined, { skip: skipMeQuery });
  const currentUser = reduxUser ?? queriedUser;

  return (
    <AppHeader
      title="TLAC"
      subtitle={subtitle}
      rightAction={
        rightAction ?? (
          <Pressable accessibilityRole="button" hitSlop={12} style={styles.iconHit}>
            <UserAvatar user={currentUser} size={42} borderColor={colors.gold} fallbackInitials="TL" />
          </Pressable>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  iconHit: {
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
  },
});
