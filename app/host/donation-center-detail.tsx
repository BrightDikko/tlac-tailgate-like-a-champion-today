import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import { placeholderImages } from '@/src/assets/images';
import { Card, PrimaryButton, Screen, SecondaryButton, StatusChip } from '@/src/components';
import { donationCenters } from '@/src/data/demoData';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

export default function DonationCenterDetailScreen() {
  const center =
    donationCenters.find((item) => item.acceptsPreparedFood) ??
    donationCenters[0];

  if (!center) {
    return (
      <Screen contentContainerStyle={styles.emptyState}>
        <Text style={styles.emptyText}>No donation center available.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <SecondaryButton label="Back" size="md" onPress={() => router.back()} style={styles.backButton} />
        <Text style={styles.topTitle}>Center Detail</Text>
        <View style={styles.topSpacer} />
      </View>

      <Card accentColor={colors.green}>
        <StatusChip status="available" label="Verified center" showDot={false} />
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
        <Text style={styles.sectionTitle}>Prepared food policy</Text>
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
        <Text style={styles.bodyText}>{center.dropoffInstructions ?? 'Follow center volunteer instructions at arrival.'}</Text>
      </Card>

      <Card variant="soft" style={styles.routeCard}>
        <Text style={styles.sectionTitle}>Route preview</Text>
        <Image
          source={placeholderImages.routePreview}
          resizeMode="cover"
          style={styles.routePreviewImage}
          accessibilityLabel="Route preview"
        />
        <Text style={styles.routeText}>Estimated drive: 9 min from Stadium Lot B</Text>
      </Card>

      <PrimaryButton label="Log Donation" onPress={() => router.push('/host/log-donation')} />
      <SecondaryButton label="Back to Donate" onPress={() => router.push('/donate')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
});
