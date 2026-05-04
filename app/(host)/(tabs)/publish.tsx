import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useGetMeQuery } from '@/src/api/endpoints/authApi';
import { useGetCurrentGameQuery } from '@/src/api/endpoints/gamesApi';
import { useGetTailgatesQuery } from '@/src/api/endpoints/tailgatesApi';
import { useCreateSurplusMutation } from '@/src/api/endpoints/surplusApi';
import {
  Card,
  FilterChip,
  HostBrandedHeader,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionHeader,
  StatusChip,
} from '@/src/components';
import type { GamePhase } from '@/src/types';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

type LeftoverItem = {
  id: string;
  name: string;
  servingsLabel: string;
  selected: boolean;
};

const pickupWindows = ['15 min', '30 min', '45 min', '60 min'];

const leftoverItems: LeftoverItem[] = [
  {
    id: 'leftover-1',
    name: 'Pulled Pork Sliders',
    servingsLabel: '12 servings',
    selected: true,
  },
  {
    id: 'leftover-2',
    name: 'Mac & Cheese Tray',
    servingsLabel: '8 servings',
    selected: true,
  },
  {
    id: 'leftover-3',
    name: 'Brownies',
    servingsLabel: '20 pieces',
    selected: false,
  },
];

function phaseLabel(phase: GamePhase) {
  return phase === 'postgame' ? 'Post-game' : 'Pregame';
}

function parseServingsFromLabel(label: string): number {
  const match = label.match(/(\d+)/);
  if (!match) return 1;
  const n = Number.parseInt(match[1], 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function publishErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const d = (err as { data: unknown }).data;
    if (d && typeof d === 'object' && d !== null && 'message' in d) {
      return String((d as { message: string }).message);
    }
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return 'Could not publish surplus.';
}

function queryErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const d = (err as { data: unknown }).data;
    if (d && typeof d === 'object' && d !== null && 'message' in d) {
      return String((d as { message: string }).message);
    }
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return 'Could not load publish data.';
}

export default function HostPublishTabScreen() {
  const {
    data: currentUser,
    isLoading: meLoading,
    isError: meError,
    error: meErr,
    refetch: refetchMe,
  } = useGetMeQuery();

  const {
    data: currentGame,
    isLoading: gameLoading,
    isError: gameError,
    error: gameErr,
    refetch: refetchGame,
  } = useGetCurrentGameQuery();

  const userId = currentUser?.id;

  const {
    data: hostTailgatesResponse,
    isLoading: tailgatesLoading,
    isError: tailgatesError,
    error: tailgatesErr,
    refetch: refetchTailgates,
  } = useGetTailgatesQuery(userId ? { hostUserId: userId } : undefined, { skip: !userId });

  const hostTailgates = hostTailgatesResponse?.data ?? [];
  const selectedHostTailgate = hostTailgates[0];

  const [createSurplus, { isLoading: isPublishing, error: publishError, reset: resetPublishError }] =
    useCreateSurplusMutation();

  const queriesLoading = meLoading || (Boolean(userId) && (gameLoading || tailgatesLoading));
  const queriesError = meError || gameError || (Boolean(userId) && tailgatesError);
  const combinedQueryError = meErr ?? gameErr ?? tailgatesErr;

  const refetchAll = () => {
    void refetchMe();
    void refetchGame();
    void refetchTailgates();
  };

  const headerSubtitle = currentGame
    ? `Host · ${phaseLabel(currentGame.phase)} · ${currentGame.matchup}`
    : gameLoading || meLoading
      ? 'Host · Loading gameday…'
      : 'Host · Gameday';

  const handlePublish = async () => {
    if (selectedHostTailgate === undefined) return;
    resetPublishError();
    const selected = leftoverItems.filter((item) => item.selected);
    const pickupNote = `Pickup near ${selectedHostTailgate.locationDetail}`;
    try {
      await Promise.all(
        selected.map((item) =>
          createSurplus({
            foodName: item.name,
            groupName: selectedHostTailgate.groupName,
            location: selectedHostTailgate.locationDetail,
            servingsRemaining: parseServingsFromLabel(item.servingsLabel),
            minutesLeft: 30,
            status: 'available',
            pickupNote,
          }).unwrap()
        )
      );
      router.push('/host/surplus-published');
    } catch {
      // surfaced via publishError
    }
  };

  const blockPublish = selectedHostTailgate === undefined || isPublishing || queriesLoading || queriesError;

  return (
    <Screen scroll safeAreaEdges={['top', 'left', 'right']} contentContainerStyle={styles.content}>
      <HostBrandedHeader subtitle={headerSubtitle} />

      <Text style={styles.screenLead}>Publish surplus</Text>
      <Text style={styles.screenLeadMuted}>
        {selectedHostTailgate
          ? `${selectedHostTailgate.groupName} · ${selectedHostTailgate.locationDetail}`
          : 'Select a host tailgate to publish under your listing.'}
      </Text>

      {queriesError ? (
        <Card variant="soft">
          <Text style={styles.errorBody}>{queryErrorMessage(combinedQueryError)}</Text>
          <SecondaryButton label="Try again" onPress={() => void refetchAll()} />
        </Card>
      ) : null}

      {queriesLoading && !queriesError ? (
        <Card variant="soft">
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Loading publish data" />
          </View>
        </Card>
      ) : null}

      {!queriesLoading && !queriesError && userId && hostTailgates.length === 0 ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.errorBody}>Create a tailgate before publishing surplus.</Text>
          <PrimaryButton label="Create tailgate" onPress={() => router.push('/create-tailgate')} />
        </Card>
      ) : null}

      {!queriesLoading && !queriesError && selectedHostTailgate ? (
        <>
          <Card variant="soft">
            <Text style={styles.afterGameLabel}>After-game surplus</Text>
            <Text style={styles.afterGameCopy}>
              List extra servings with a pickup window so Student / Fan neighbors can reserve what is actually
              available.
            </Text>
          </Card>

          <SectionHeader title="Leftover items" subtitle="Choose what to list for pickup." />
          <View style={styles.leftoversList}>
            {leftoverItems.map((item) => (
              <Card key={item.id} style={item.selected ? styles.selectedItem : styles.unselectedItem}>
                <View style={styles.itemRow}>
                  <View style={styles.itemCopy}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemServings}>{item.servingsLabel}</Text>
                  </View>
                  {item.selected ? (
                    <StatusChip status="available" label="Ready to publish" showDot={false} />
                  ) : (
                    <Text style={styles.optionalText}>Optional</Text>
                  )}
                </View>
              </Card>
            ))}
          </View>

          <SectionHeader title="Pickup window" subtitle="How long claims stay active." />
          <View style={styles.pickupRow}>
            {pickupWindows.map((window) => (
              <FilterChip key={window} label={window} selected={window === '30 min'} />
            ))}
          </View>

          <SectionHeader title="Pickup note" />
          <Card variant="soft">
            <Text style={styles.noteText}>Pickup near {selectedHostTailgate.locationDetail}</Text>
          </Card>

          <Card style={styles.summaryCard} accentColor={colors.gold}>
            <Text style={styles.summaryTitle}>Publish summary</Text>
            <Text style={styles.summaryLine}>2 items selected</Text>
            <Text style={styles.summaryLine}>20 total servings</Text>
            <Text style={styles.summaryLine}>30-minute pickup window</Text>
            <Text style={styles.summarySubtext}>
              Student / Fan nearby can reserve servings once you publish.
            </Text>
          </Card>

          {publishError ? (
            <Card variant="soft" accentColor={colors.navy}>
              <Text style={styles.publishErrorText}>{publishErrorMessage(publishError)}</Text>
            </Card>
          ) : null}

          <PrimaryButton
            label="Publish surplus"
            onPress={() => void handlePublish()}
            disabled={blockPublish}
          />
        </>
      ) : null}

      <SecondaryButton label="Back to dashboard" onPress={() => router.push('/dashboard')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  screenLead: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  screenLeadMuted: {
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  errorBody: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  loadingBlock: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  afterGameLabel: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  afterGameCopy: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 23,
  },
  leftoversList: {
    gap: spacing.md,
  },
  selectedItem: {
    borderColor: '#B7E5C5',
  },
  unselectedItem: {
    opacity: 0.82,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  itemCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  itemName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  itemServings: {
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '600',
  },
  optionalText: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pickupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  noteText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
  summaryCard: {
    borderColor: '#E3D5A6',
  },
  summaryTitle: {
    color: colors.goldLight,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  summaryLine: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
  summarySubtext: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  publishErrorText: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
