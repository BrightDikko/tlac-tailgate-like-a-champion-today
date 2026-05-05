import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { avatarImages } from '../assets/images';
import type { CurrentUser } from '../types';
import { colors } from '../theme/colors';

type UserAvatarProps = {
  user?: CurrentUser | null;
  size?: number;
  borderColor?: string;
  fallbackInitials?: string;
  accessibilityLabel?: string;
};

function initialsFromName(value: string | undefined): string {
  if (!value) return '';
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0]?.charAt(0) ?? '';
  const second = parts.length > 1 ? (parts[1]?.charAt(0) ?? '') : '';
  return `${first}${second}`.toUpperCase();
}

function initialsForCurrentUser(user?: CurrentUser | null, fallbackInitials = 'TL'): string {
  const explicit = user?.avatarInitials?.trim();
  if (explicit) return explicit.toUpperCase().slice(0, 3);

  const first = user?.firstName?.trim().charAt(0) ?? '';
  const last = user?.lastName?.trim().charAt(0) ?? '';
  const fromNames = `${first}${last}`.toUpperCase();
  if (fromNames) return fromNames;

  const fromDisplay = initialsFromName(user?.displayName);
  if (fromDisplay) return fromDisplay;

  const fallback = fallbackInitials.trim().toUpperCase();
  return fallback || 'TL';
}

function avatarSourceForCurrentUser(user?: CurrentUser | null): ImageSourcePropType | undefined {
  const key = user?.avatarImageKey;
  if (!key) return undefined;
  return (avatarImages as Record<string, ImageSourcePropType>)[key];
}

export function UserAvatar({
  user,
  size = 42,
  borderColor = colors.gold,
  fallbackInitials = 'TL',
  accessibilityLabel,
}: UserAvatarProps) {
  const source = avatarSourceForCurrentUser(user);
  const initials = initialsForCurrentUser(user, fallbackInitials);
  const borderRadius = size / 2;

  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius,
          borderColor,
        },
      ]}
    >
      {source ? (
        <Image
          source={source}
          resizeMode="cover"
          style={{ width: '100%', height: '100%' }}
          accessibilityLabel={accessibilityLabel ?? `${user?.displayName ?? 'User'} avatar`}
        />
      ) : (
        <View style={styles.fallback}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 2,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  initials: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
