import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { useGetMeQuery } from '../api/endpoints/authApi';
import { avatarImages } from '../assets/images';
import type { CurrentUser } from '../types';
import { colors } from '../theme/colors';
import { AppHeader } from './AppHeader';

type HostBrandedHeaderProps = {
  subtitle: string;
  rightAction?: ReactNode;
};

function displayInitials(user: CurrentUser | undefined): string {
  const explicit = user?.avatarInitials?.trim();
  if (explicit) return explicit.toUpperCase().slice(0, 3);

  const first = user?.firstName?.trim().charAt(0) ?? '';
  const last = user?.lastName?.trim().charAt(0) ?? '';
  const pair = `${first}${last}`.toUpperCase();

  if (pair) return pair;
  return 'TL';
}

function avatarSourceFor(user: CurrentUser | undefined): ImageSourcePropType | undefined {
  const key = user?.avatarImageKey;
  if (!key) return undefined;
  const src = (avatarImages as Record<string, ImageSourcePropType>)[key];
  return src;
}

/**
 * Host shell header aligned with Student/Fan Discover: TLAC brand and logged-in host avatar.
 */
export function HostBrandedHeader({ subtitle, rightAction }: HostBrandedHeaderProps) {
  const { data: currentUser } = useGetMeQuery();
  const avatarSource = avatarSourceFor(currentUser);
  const initials = displayInitials(currentUser);

  return (
    <AppHeader
      title="TLAC"
      subtitle={subtitle}
      rightAction={
        rightAction ?? (
          <Pressable accessibilityRole="button" hitSlop={12} style={styles.iconHit}>
            <View style={styles.avatarRing}>
              {avatarSource ? (
                <Image
                  source={avatarSource}
                  resizeMode="cover"
                  style={styles.headerAvatarImage}
                  accessibilityLabel={`${currentUser?.displayName ?? 'Host'} avatar`}
                />
              ) : (
                <View style={styles.headerAvatarFallback}>
                  <Text style={styles.headerAvatarInitials}>{initials}</Text>
                </View>
              )}
            </View>
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
  avatarRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  headerAvatarFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  headerAvatarInitials: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
