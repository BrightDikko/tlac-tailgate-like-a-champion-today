
import { router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import { brandImages } from '@/src/assets/images';
import { Card, PrimaryButton, Screen, SecondaryButton } from '@/src/components';
import { API_MODE } from '@/src/services/config/env';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

export default function RoleSelectScreen() {
  const isRemote = API_MODE === 'remote';

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.logoWrap}>
        <Image source={brandImages.logo} resizeMode="contain" style={styles.logo} />
      </View>
      <View style={styles.heroCopy}>
        <Text style={styles.heroTitle}>What would you like to do first?</Text>
        <Text style={styles.heroSubtitle}>
          {isRemote
            ? 'Sign in or create an account to continue. Your starting view can still be changed later.'
            : 'Pick a starting view for this demo. You can switch between exploring and hosting anytime.'}
        </Text>
      </View>

      {isRemote ? (
        <Card style={styles.roleCard} accentColor={colors.navy}>
          <Text style={styles.roleTitle}>Continue with your account</Text>
          <Text style={styles.roleBody}>
            Use a real account so tokens, saved activity, and server data stay in sync.
          </Text>
          <PrimaryButton label="Sign in" onPress={() => router.push('/login')} style={styles.roleButton} />
          <SecondaryButton label="Create account" onPress={() => router.push('/register')} />
        </Card>
      ) : (
        <>
          <Card style={styles.roleCard} accentColor={colors.navy}>
            <Text style={styles.roleTitle}>Explore tailgates</Text>
            <Text style={styles.roleBody}>Browse tailgates, claim surplus, and track gameday impact.</Text>
            <PrimaryButton
              label="Start exploring"
              onPress={() => router.push('/discover')}
              style={styles.roleButton}
            />
          </Card>

          <Card style={styles.roleCard} accentColor={colors.gold}>
            <Text style={styles.roleTitle}>Host a tailgate</Text>
            <Text style={styles.roleBody}>
              Create a tailgate, publish menus, manage surplus, and coordinate donation pathways.
            </Text>
            <PrimaryButton
              label="Start hosting"
              onPress={() => router.push('/dashboard')}
              style={styles.roleButton}
            />
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  logoWrap: {
    alignItems: 'center',
  },
  logo: {
    width: 84,
    height: 84,
  },
  heroCopy: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroSubtitle: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
    textAlign: 'center',
  },
  roleCard: {
    gap: spacing.md,
  },
  roleTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '800',
  },
  roleBody: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
  },
  roleButton: {
    marginTop: spacing.md,
  },
});
