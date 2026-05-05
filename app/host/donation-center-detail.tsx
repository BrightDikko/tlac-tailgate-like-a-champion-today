import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import { useGetDonationCenterByIdQuery } from '@/src/api/endpoints/donationCentersApi';
import { placeholderImages } from '@/src/assets/images';
import { Card, FilterChip, PrimaryButton, Screen, SecondaryButton } from '@/src/components';
import { useRemoteAuthGate } from '@/src/features/auth/remoteAuthGate';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import { acceptedCategoriesForCenter, categoryLabel } from '@/src/utils/donationCategories';
import { isNotFoundError, messageFromUnknownError } from '@/src/utils/errorMessage';
import { paramOne } from '@/src/utils/routeParams';

export default function DonationCenterDetailScreen() {
  const { shouldRedirectToLogin } = useRemoteAuthGate();
  const params = useLocalSearchParams<{ donationCenterId?: string | string[] }>();
  const centerId = paramOne(params.donationCenterId) ?? 'center-1';

  const {
    data: center,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetDonationCenterByIdQuery(centerId, { skip: !centerId });

  if (shouldRedirectToLogin) {
    return <Redirect href="/login" />;
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <SecondaryButton label="Back" size="md" onPress={() => router.back()} style={styles.backButton} />
        <Text style={styles.topTitle}>Center Detail</Text>
        <View style={styles.topSpacer} />
      </View>

      {isLoading ? (
        <Card variant="soft">
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Loading center" />
          </View>
        </Card>
      ) : isError ? (
        <Card variant="soft">
          <Text style={styles.errorText}>{messageFromUnknownError(error, 'Could not load donation center.')}</Text>
          {isNotFoundError(error) ? (
            <SecondaryButton label="Back to Donate" onPress={() => router.push('/donate')} style={styles.retryButton} />
          ) : (
            <SecondaryButton label="Try again" onPress={() => void refetch()} style={styles.retryButton} />
          )}
        </Card>
      ) : center === undefined ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.emptyText}>No donation center available.</Text>
          <SecondaryButton label="Back to Donate" onPress={() => router.push('/donate')} style={styles.retryButton} />
        </Card>
      ) : (
        <>
          {acceptedCategoriesForCenter(center).length > 0 ? (
            <View style={styles.categoryRow}>
              {acceptedCategoriesForCenter(center).map((category) => (
                <FilterChip key={`${center.id}-${category}`} label={categoryLabel(category)} />
              ))}
            </View>
          ) : null}

          <Card accentColor={colors.green}>
            <Text style={styles.centerName}>{center.name}</Text>
            <Text style={styles.impactLabel}>{center.impactLabel ?? 'Donation partner'}</Text>

            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={16} color={colors.goldLight} />
              <Text style={styles.metaText}>{center.address}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="navigate-outline" size={16} color={colors.goldLight} />
              <Text style={styles.metaText}>{center.distance}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="call-outline" size={16} color={colors.goldLight} />
              <Text style={styles.metaText}>{center.phone}</Text>
            </View>
          </Card>

          <Card variant="soft">
            <Text style={styles.sectionTitle}>Donation policy</Text>
            {(center.policyNotes ?? []).map((note) => (
              <View key={note} style={styles.bulletRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.green} />
                <Text style={styles.bodyText}>{note}</Text>
              </View>
            ))}
          </Card>

          <Card variant="soft">
            <Text style={styles.sectionTitle}>Hours of operation</Text>
            {(center.hours ?? []).map((item) => (
              <Text key={item} style={styles.bodyText}>
                {item}
              </Text>
            ))}
          </Card>

          <Card variant="soft">
            <Text style={styles.sectionTitle}>Drop-off procedures</Text>
            <Text style={styles.bodyText}>
              {center.dropoffInstructions ?? 'Follow center volunteer instructions at arrival.'}
            </Text>
          </Card>

          <Card variant="soft" style={styles.routeCard}>
            <Text style={styles.sectionTitle}>Route preview</Text>
            <Image
              source={placeholderImages.routePreview}
              resizeMode="cover"
              style={styles.routePreviewImage}
              accessibilityLabel="Route preview"
            />
            <Text style={styles.routeText}>Use your maps app for turn-by-turn directions to this center.</Text>
          </Card>

          <PrimaryButton
            label="Log Donation"
            onPress={() =>
              router.push({
                pathname: '/host/log-donation',
                params: { donationCenterId: center.id },
              })
            }
          />
          <SecondaryButton label="Back to Donate" onPress={() => router.push('/donate')} />
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
  emptyText: {
    color: colors.text,
    fontSize: typography.body,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    minWidth: 84,
  },
  topTitle: {
    flex: 1,
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
    textAlign: 'center',
  },
  topSpacer: {
    minWidth: 84,
  },
  centerName: {
    marginTop: spacing.md,
    color: colors.goldLight,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  impactLabel: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '600',
  },
  metaRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  metaText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 21,
  },
  sectionTitle: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  bodyText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
  routeCard: {
    gap: spacing.sm,
  },
  routePreviewImage: {
    height: 120,
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  routeText: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  loadingBlock: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  errorText: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: spacing.md,
  },
});
