
import { router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import { brandImages } from '@/src/assets/images';
import { Card, PrimaryButton, Screen } from '@/src/components';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

export default function RoleSelectScreen() {
  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.logoWrap}>
        <Image source={brandImages.logo} resizeMode="contain" style={styles.logo} />
      </View>
      <View style={styles.heroCopy}>
        <Text style={styles.heroTitle}>How are you joining?</Text>
        <Text style={styles.heroSubtitle}>Pick a path to explore the TLAC gameday experience.</Text>
      </View>

      <Card style={styles.roleCard} accentColor={colors.navy}>
        <Text style={styles.roleTitle}>Student / Fan</Text>
        <Text style={styles.roleBody}>Browse tailgates, claim surplus, track impact.</Text>
        <PrimaryButton
          label="Continue as Student / Fan"
          onPress={() => router.push('/discover')}
          style={styles.roleButton}
        />
      </Card>

      <Card style={styles.roleCard} accentColor={colors.gold}>
        <Text style={styles.roleTitle}>Tailgate Host</Text>
        <Text style={styles.roleBody}>Post menu, flag leftovers, support donation pathways.</Text>
        <PrimaryButton
          label="Continue as Host"
          onPress={() => router.push('/dashboard')}
          style={styles.roleButton}
        />
      </Card>
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
