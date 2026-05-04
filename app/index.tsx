
import { router } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

import { PrimaryButton, Screen } from '@/src/components';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export default function SplashScreen() {
  return (
    <Screen padded={false} backgroundColor={colors.background}>
      <View style={styles.container}>
        <View style={styles.centerStack}>
          <Image
            source={require('../assets/images/brand/TLAC-logo.png')}
            resizeMode="contain"
            style={styles.logoImage}
            accessibilityLabel="TLAC logo"
          />
          <View style={styles.posterWrap}>
            <Image
              source={require('../assets/images/brand/onboarding-splash-screen.png')}
              resizeMode="contain"
              style={styles.posterImage}
              accessibilityLabel="Tailgate Like A Champion Today sign"
            />
          </View>
        </View>
        <View style={styles.footer}>
          <PrimaryButton
            label="Continue"
            onPress={() => router.push('/welcome')}
            style={styles.getStartedButton}
            textStyle={styles.getStartedText}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
  },
  centerStack: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: spacing.lg,
  },
  logoImage: {
    width: 172,
    height: 172,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  posterWrap: {
    width: '95%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  posterImage: {
    width: '100%',
    height: 280,
  },
  footer: {
    paddingBottom: spacing.lg,
  },
  getStartedButton: {
    minHeight: 62,
    borderRadius: 14,
    marginHorizontal: spacing.xs,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  getStartedText: {
    color: colors.textInverse,
  },
});
