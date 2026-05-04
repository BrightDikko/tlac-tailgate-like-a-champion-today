import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card, HostBrandedHeader, PrimaryButton, Screen, SecondaryButton, StatusChip } from '@/src/components';
import { donationCenters } from '@/src/data/demoData';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

export default function HostDonateTabScreen() {
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

      <View style={styles.list}>
        {donationCenters.map((center) => (
          <Card key={center.id} style={styles.centerCard} variant="soft">
            <View style={styles.centerHead}>
              <Text style={styles.centerName}>{center.name}</Text>
              <StatusChip
                status={center.acceptsPreparedFood ? 'available' : 'planned'}
                label={center.acceptsPreparedFood ? 'Prepared food accepted' : 'Shelf-stable only'}
                showDot={false}
              />
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
                onPress={() => router.push('/host/donation-center-detail')}
              />
              <PrimaryButton label="Log Donation" size="md" onPress={() => router.push('/host/log-donation')} />
            </View>
          </Card>
        ))}
      </View>
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
  actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
});
