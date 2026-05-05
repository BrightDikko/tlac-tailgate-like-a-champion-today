import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLoginMutation } from '@/src/api/endpoints/authApi';
import { brandImages } from '@/src/assets/images';
import { Card, PrimaryButton, SecondaryButton } from '@/src/components';
import { selectAccessToken, selectCurrentUser, selectIsAuthenticated } from '@/src/features/auth/authSelectors';
import { defaultHrefForUserRole } from '@/src/features/auth/postAuthRoute';
import { useAppSelector } from '@/src/redux/hooks';
import { API_MODE } from '@/src/services/config/env';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import { messageFromUnknownError } from '@/src/utils/errorMessage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [login, { isLoading }] = useLoginMutation();

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const accessToken = useAppSelector(selectAccessToken);
  const user = useAppSelector(selectCurrentUser);

  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const pageMinHeight = Math.max(windowHeight - insets.top - insets.bottom, 520);

  useEffect(() => {
    if (!isAuthenticated || accessToken === null || accessToken.length === 0 || user === null) {
      return;
    }
    router.replace(defaultHrefForUserRole(user.role));
  }, [isAuthenticated, accessToken, user]);

  const onSubmit = async () => {
    setFormError(null);
    const trimmedEmail = email.trim();
    if (trimmedEmail.length === 0 || password.trim().length === 0) {
      setFormError('Email and password are required.');
      return;
    }
    try {
      const session = await login({
        email: trimmedEmail,
        password,
      }).unwrap();
      router.replace(defaultHrefForUserRole(session.user.role));
    } catch (err) {
      setFormError(messageFromUnknownError(err, 'Sign in failed. Please try again.'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardRoot}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            minHeight: pageMinHeight,
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + spacing.xl,
            paddingHorizontal: spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.column, { minHeight: pageMinHeight }]}>
          <View style={styles.hero}>
            <View style={styles.logoRing}>
              <Image source={brandImages.logo} resizeMode="contain" style={styles.logo} accessibilityLabel="TLAC logo" />
            </View>
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.subtitle}>
              Enter the email and password for an existing TLAC account.
              {API_MODE === 'mock'
                ? '\n\nIn demo builds, create an account first or use Continue in Demo Mode on Welcome.'
                : ''}
            </Text>
          </View>

          <Card variant="soft" accentColor={colors.gold} style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (formError !== null) setFormError(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                placeholder="you@school.edu"
                placeholderTextColor={colors.mutedDark}
                style={styles.input}
                editable={!isLoading}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (formError !== null) setFormError(null);
                }}
                secureTextEntry
                textContentType="password"
                autoComplete="password"
                placeholder="••••••••"
                placeholderTextColor={colors.mutedDark}
                style={styles.input}
                editable={!isLoading}
              />
            </View>

            {formError !== null ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.orange} />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            <PrimaryButton
              label={isLoading ? 'Signing in…' : 'Sign in'}
              onPress={() => void onSubmit()}
              disabled={isLoading}
              style={styles.submit}
              leftIcon={
                isLoading ? (
                  <ActivityIndicator size="small" color={colors.textInverse} accessibilityLabel="Signing in" />
                ) : undefined
              }
            />
          </Card>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/register')}
              disabled={isLoading}
              style={({ pressed }) => [styles.linkWrap, pressed && styles.linkPressed]}
            >
              <Text style={styles.linkLine}>
                New to TLAC?{' '}
                <Text style={styles.linkAccent}>Create an account</Text>
              </Text>
            </Pressable>

            {API_MODE === 'mock' ? (
              <SecondaryButton
                label="Back to welcome"
                onPress={() => router.push('/welcome')}
                disabled={isLoading}
                style={styles.footerSecondary}
              />
            ) : null}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  column: {
    flex: 1,
    justifyContent: 'space-between',
    gap: spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  logoRing: {
    padding: spacing.md,
    borderRadius: 28,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  logo: {
    width: 72,
    height: 72,
  },
  title: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 340,
    alignSelf: 'center',
  },
  formCard: {
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },
  fieldGroup: {
    gap: spacing.lg,
  },
  label: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
    color: colors.text,
    fontSize: typography.body,
    backgroundColor: colors.surface,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  errorText: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
    flex: 1,
  },
  submit: {
    marginTop: spacing.md,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: 'auto',
    paddingTop: spacing.md,
    marginBottom: spacing.xl,
  },
  linkWrap: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  linkPressed: {
    opacity: 0.75,
  },
  linkLine: {
    color: colors.muted,
    fontSize: typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  linkAccent: {
    color: colors.goldLight,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  footerSecondary: {
    alignSelf: 'stretch',
  },
});
