import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useGetDonationCentersQuery } from '@/src/api/endpoints/donationCentersApi';
import { Card, FilterChip, HostBrandedHeader, PrimaryButton, Screen, SecondaryButton } from '@/src/components';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import { acceptedCategoriesForCenter, categoryLabel } from '@/src/utils/donationCategories';
import { messageFromUnknownError } from '@/src/utils/errorMessage';

export default function HostDonateTabScreen() {
  const {
    data: donationCentersResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetDonationCentersQuery();

  const centers = donationCentersResponse?.data ?? [];

  return (
    <Screen scroll safeAreaEdges={['top', 'left', 'right']} contentContainerStyle={styles.content}>
      <HostBrandedHeader subtitle="Host · Donation safety net" />

      <Card accentColor={colors.green}>
        <Text style={styles.heroTitle}>Donate remaining surplus</Text>
        <Text style={styles.heroBody}>
          When pickup windows close, TLAC helps hosts route safe leftover food to local South Bend
          donation partners.
        </Text>
      </Card>

      {isLoading ? (
        <Card variant="soft">
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Loading donation centers" />
          </View>
        </Card>
      ) : isError ? (
        <Card variant="soft">
          <Text style={styles.errorText}>{messageFromUnknownError(error, 'Could not load donation centers.')}</Text>
          <SecondaryButton label="Try again" onPress={() => void refetch()} style={styles.retryButton} />
        </Card>
      ) : centers.length === 0 ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.emptyBody}>No donation centers are listed yet. Check back soon.</Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {centers.map((center) => {
            const acceptedCategories = acceptedCategoriesForCenter(center);
            const canLogDonation = acceptedCategories.length > 0;
            return (
              <Card key={center.id} style={styles.centerCard} variant="soft">
                <View style={styles.centerHead}>
                  <Text style={styles.centerName}>{center.name}</Text>
                </View>
                <View style={styles.categoryRow}>
                  {acceptedCategories.map((category) => (
                    <FilterChip key={`${center.id}-${category}`} label={categoryLabel(category)} />
                  ))}
                  {acceptedCategories.length === 0 ? (
                    <Text style={styles.preparedHint}>No donation categories enabled for this center.</Text>
                  ) : null}
                </View>

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
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={16} color={colors.goldLight} />
                  <Text style={styles.metaText}>{center.openStatus}</Text>
                </View>

                {center.description ? <Text style={styles.description}>{center.description}</Text> : null}

                <View style={styles.actions}>
                  <SecondaryButton
                    label="View Details"
                    size="md"
                    onPress={() =>
                      router.push({
                        pathname: '/host/donation-center-detail',
                        params: { donationCenterId: center.id },
                      })
                    }
                  />
                  <PrimaryButton
                    label="Log Donation"
                    size="md"
                    disabled={!canLogDonation}
                    onPress={() =>
                      router.push({
                        pathname: '/host/log-donation',
                        params: { donationCenterId: center.id },
                      })
                    }
                  />
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  heroTitle: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  heroBody: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  list: {
    gap: spacing.lg,
  },
  centerCard: {
    gap: spacing.sm,
  },
  centerHead: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  categoryRow: {
    marginVertical: spacing.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  centerName: {
    color: colors.goldLight,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  metaRow: {
    marginTop: spacing.xs,
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
  description: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  preparedHint: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '600',
    lineHeight: 18,
  },
  actions: {
    marginTop: spacing.md,
    gap: spacing.md,
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
  emptyBody: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
