import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
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

import { useRegisterMutation } from '@/src/api/endpoints/authApi';
import { brandImages } from '@/src/assets/images';
import { Card, PrimaryButton, SecondaryButton } from '@/src/components';
import { selectAccessToken, selectCurrentUser, selectIsAuthenticated } from '@/src/features/auth/authSelectors';
import { useAppSelector } from '@/src/redux/hooks';
import { API_MODE } from '@/src/services/config/env';
import type { UserRole } from '@/src/types';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import { messageFromUnknownError } from '@/src/utils/errorMessage';
import { hrefAfterAuthFromParams } from '@/src/utils/postAuthRedirect';
import { paramOne } from '@/src/utils/routeParams';

type RegisterRoleChoice = 'student' | 'host';

function userRoleFromChoice(choice: RegisterRoleChoice): UserRole {
  return choice === 'host' ? 'host' : 'student';
}

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleChoice, setRoleChoice] = useState<RegisterRoleChoice>('student');
  const [formError, setFormError] = useState<string | null>(null);

  const [registerUser, { isLoading }] = useRegisterMutation();
  const searchParams = useLocalSearchParams();

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const accessToken = useAppSelector(selectAccessToken);
  const user = useAppSelector(selectCurrentUser);

  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const pageMinHeight = Math.max(windowHeight - insets.top - insets.bottom, 560);

  useEffect(() => {
    if (!isAuthenticated || accessToken === null || accessToken.length === 0 || user === null) {
      return;
    }
    router.replace(hrefAfterAuthFromParams(user.role, searchParams));
  }, [isAuthenticated, accessToken, user, searchParams]);

  const onSubmit = async () => {
    setFormError(null);
    if (
      firstName.trim().length === 0 ||
      lastName.trim().length === 0 ||
      email.trim().length === 0 ||
      password.trim().length === 0
    ) {
      setFormError('First name, last name, email, and password are required.');
      return;
    }
    try {
      const session = await registerUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        role: userRoleFromChoice(roleChoice),
      }).unwrap();
      router.replace(hrefAfterAuthFromParams(session.user.role, searchParams));
    } catch (err) {
      setFormError(messageFromUnknownError(err, 'Could not create account. Please try again.'));
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
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Join the Notre Dame tailgate community. You can explore, claim surplus, and host whenever you’re ready.
            </Text>
          </View>

          <Card variant="soft" accentColor={colors.gold} style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>First name</Text>
              <TextInput
                value={firstName}
                onChangeText={(t) => {
                  setFirstName(t);
                  if (formError !== null) setFormError(null);
                }}
                autoComplete="given-name"
                textContentType="givenName"
                placeholder="First name"
                placeholderTextColor={colors.mutedDark}
                style={styles.input}
                editable={!isLoading}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Last name</Text>
              <TextInput
                value={lastName}
                onChangeText={(t) => {
                  setLastName(t);
                  if (formError !== null) setFormError(null);
                }}
                autoComplete="family-name"
                textContentType="familyName"
                placeholder="Last name"
                placeholderTextColor={colors.mutedDark}
                style={styles.input}
                editable={!isLoading}
              />
            </View>

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
                textContentType="newPassword"
                autoComplete="password-new"
                placeholder="Create a secure password"
                placeholderTextColor={colors.mutedDark}
                style={styles.input}
                editable={!isLoading}
              />
            </View>

            <View style={styles.roleBlock}>
              <Text style={[styles.label, styles.roleSectionLabel]}>What would you like to do first?</Text>
              <Text style={styles.roleHint}>
                You can switch between exploring and hosting anytime. This just picks your starting view.
              </Text>

              <View style={styles.roleList}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: roleChoice === 'student' }}
                  onPress={() => setRoleChoice('student')}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    styles.roleTile,
                    roleChoice === 'student' && styles.roleTileSelected,
                    pressed && styles.roleTilePressed,
                  ]}
                >
                  <View style={[styles.roleIconWrap, roleChoice === 'student' && styles.roleIconWrapSelected]}>
                    <Ionicons
                      name="compass"
                      size={22}
                      color={roleChoice === 'student' ? colors.goldLight : colors.muted}
                    />
                  </View>
                  <View style={styles.roleCopy}>
                    <Text style={[styles.roleTileTitle, roleChoice === 'student' && styles.roleTileTitleSelected]}>
                      Explore tailgates
                    </Text>
                    <Text style={styles.roleTileDesc}>
                      Discover food, claim surplus, and track your gameday impact.
                    </Text>
                  </View>
                  <Ionicons
                    name={roleChoice === 'student' ? 'checkbox' : 'square-outline'}
                    size={26}
                    color={roleChoice === 'student' ? colors.goldLight : colors.muted}
                  />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: roleChoice === 'host' }}
                  onPress={() => setRoleChoice('host')}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    styles.roleTile,
                    roleChoice === 'host' && styles.roleTileSelected,
                    pressed && styles.roleTilePressed,
                  ]}
                >
                  <View style={[styles.roleIconWrap, roleChoice === 'host' && styles.roleIconWrapSelected]}>
                    <Ionicons name="flame" size={22} color={roleChoice === 'host' ? colors.goldLight : colors.muted} />
                  </View>
                  <View style={styles.roleCopy}>
                    <Text style={[styles.roleTileTitle, roleChoice === 'host' && styles.roleTileTitleSelected]}>
                      Host a tailgate
                    </Text>
                    <Text style={styles.roleTileDesc}>
                      Create a tailgate, publish menus, manage surplus, and coordinate pickups.
                    </Text>
                  </View>
                  <Ionicons
                    name={roleChoice === 'host' ? 'checkbox' : 'square-outline'}
                    size={26}
                    color={roleChoice === 'host' ? colors.goldLight : colors.muted}
                  />
                </Pressable>
              </View>
            </View>

            {formError !== null ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.orange} />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            <PrimaryButton
              label={isLoading ? 'Creating account…' : 'Create account'}
              onPress={() => void onSubmit()}
              disabled={isLoading}
              style={styles.submit}
              leftIcon={
                isLoading ? (
                  <ActivityIndicator size="small" color={colors.textInverse} accessibilityLabel="Creating account" />
                ) : undefined
              }
            />
          </Card>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                const next: Record<string, string> = {};
                const r = paramOne(searchParams.redirectTo);
                const it = paramOne(searchParams.intent);
                const sid = paramOne(searchParams.surplusId);
                if (r !== undefined) next.redirectTo = r;
                if (it !== undefined) next.intent = it;
                if (sid !== undefined) next.surplusId = sid;
                router.push(Object.keys(next).length > 0 ? { pathname: '/login', params: next } : '/login');
              }}
              disabled={isLoading}
              style={({ pressed }) => [styles.linkWrap, pressed && styles.linkPressed]}
            >
              <Text style={styles.linkLine}>
                Already have an account?{' '}
                <Text style={styles.linkAccent}>Sign in</Text>
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
    gap: spacing.xl,
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
  roleBlock: {
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  roleSectionLabel: {
    textAlign: 'center',
    alignSelf: 'center',
    fontSize: typography.caption,
    fontWeight: '900',
    letterSpacing: 0.55,
    color: colors.goldLight,
  },
  roleHint: {
    color: colors.mutedDark,
    fontSize: typography.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    color: colors.text,
    fontSize: typography.body,
    backgroundColor: colors.surface,
  },
  roleList: {
    marginTop: spacing.md,
    gap: spacing.xl,
  },
  roleTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  roleTileSelected: {
    borderColor: colors.goldLight,
    backgroundColor: colors.surfaceElevated,
    shadowColor: colors.goldLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  roleTilePressed: {
    opacity: 0.92,
  },
  roleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleIconWrapSelected: {
    borderColor: 'rgba(244, 197, 66, 0.45)',
    backgroundColor: 'rgba(244, 197, 66, 0.12)',
  },
  roleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  roleTileTitle: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  roleTileTitleSelected: {
    color: colors.goldLight,
  },
  roleTileDesc: {
    color: colors.muted,
    fontSize: typography.caption,
    lineHeight: 18,
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
    marginTop: 0,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: 'auto',
    paddingTop: spacing.md,
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
