
import { router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, Screen } from '@/src/components';
import { brandImages } from '@/src/assets/images';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

export default function WelcomeScreen() {
  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.logoWrap}>
        <Image source={brandImages.logo} resizeMode="contain" style={styles.logo} />
      </View>
      <View style={styles.heroCopy}>
        <Text style={styles.heroTitle}>Welcome to TLAC</Text>
        <Text style={styles.heroSubtitle}>A smarter way to discover tailgate food and reduce gameday waste.</Text>
      </View>

      <View style={styles.cardsWrap}>
        <Card style={styles.valueCard} accentColor={colors.navy}>
          <Text style={styles.cardTitle}>Discover tailgate food</Text>
          <Text style={styles.cardBody}>
            Browse active tailgates, menus, and locations before kickoff.
          </Text>
        </Card>

        <Card style={styles.valueCard} accentColor={colors.gold}>
          <Text style={styles.cardTitle}>Claim surplus after the game</Text>
          <Text style={styles.cardBody}>
            Reserve available servings with a timed pickup window.
          </Text>
        </Card>

        <Card style={styles.valueCard} accentColor={colors.green}>
          <Text style={styles.cardTitle}>Reduce gameday waste</Text>
          <Text style={styles.cardBody}>
            Help the Notre Dame community redirect good food.
          </Text>
        </Card>
      </View>

      <PrimaryButton label="Get Started" onPress={() => router.push('/role-select')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  cardsWrap: {
    gap: spacing.lg,
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
  valueCard: {
    gap: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  cardBody: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 23,
  },
});
