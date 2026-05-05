import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useLazyGetMeQuery } from '@/src/api/endpoints/authApi';
import {
  useClaimSurplusMutation,
  useConfirmClaimMutation,
  useReleaseClaimMutation,
} from '@/src/api/endpoints/claimsApi';
import { useLazyGetDonationCentersQuery } from '@/src/api/endpoints/donationCentersApi';
import { useLazyGetCurrentGameQuery } from '@/src/api/endpoints/gamesApi';
import { useLazyGetGlobalImpactQuery } from '@/src/api/endpoints/impactApi';
import { useCreateMenuItemMutation } from '@/src/api/endpoints/menuApi';
import { useCreateSurplusMutation, useLazyGetSurplusQuery } from '@/src/api/endpoints/surplusApi';
import { useLazyGetTailgatesQuery } from '@/src/api/endpoints/tailgatesApi';
import { debugRemotePayload } from '@/src/api/debug/remotePayloadDebug';
import { Card, PrimaryButton, Screen, SecondaryButton, SectionHeader } from '@/src/components';
import { API_HOST_URL } from '@/src/services/config/apiUrls';
import { API_BASE_URL, API_MODE } from '@/src/services/config/env';
import { checkBackendHealth } from '@/src/services/health/healthCheck';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import { messageFromUnknownError } from '@/src/utils/errorMessage';

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function DevApiDiagnosticsScreen() {
  const [lastLabel, setLastLabel] = useState<string | null>(null);
  const [resultJson, setResultJson] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [claimSurplusId, setClaimSurplusId] = useState('');
  const [claimRecordId, setClaimRecordId] = useState('');
  const [publishTailgateId, setPublishTailgateId] = useState('');
  const [publishFoodItemId, setPublishFoodItemId] = useState('');
  const [menuTailgateId, setMenuTailgateId] = useState('');
  const [menuItemName, setMenuItemName] = useState('');
  const [menuCategory, setMenuCategory] = useState<'entree' | 'side' | 'drink' | 'dessert'>('entree');

  const [triggerGame] = useLazyGetCurrentGameQuery();
  const [triggerTailgates] = useLazyGetTailgatesQuery();
  const [triggerSurplus] = useLazyGetSurplusQuery();
  const [triggerCenters] = useLazyGetDonationCentersQuery();
  const [triggerGlobalImpact] = useLazyGetGlobalImpactQuery();
  const [triggerMe] = useLazyGetMeQuery();
  const [claimSurplus, { isLoading: claimBusy }] = useClaimSurplusMutation();
  const [confirmClaim, { isLoading: confirmBusy }] = useConfirmClaimMutation();
  const [releaseClaim, { isLoading: releaseBusy }] = useReleaseClaimMutation();
  const [createSurplus, { isLoading: publishBusy }] = useCreateSurplusMutation();
  const [createMenuItem, { isLoading: menuCreateBusy }] = useCreateMenuItemMutation();

  const run = useCallback(async (label: string, fn: () => Promise<unknown>) => {
    setBusy(true);
    setLastLabel(label);
    setErrorText(null);
    setResultJson(null);
    try {
      const data = await fn();
      setResultJson(formatJson(data));
    } catch (err) {
      setErrorText(messageFromUnknownError(err, `${label} failed.`));
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <Screen scroll safeAreaEdges={['top', 'left', 'right']} contentContainerStyle={styles.content}>
      <SectionHeader title="API diagnostics" subtitle="Developer-only checks for remote integration." />

      <Card variant="soft" style={styles.card}>
        <Text style={styles.monoLabel}>API_MODE</Text>
        <Text style={styles.monoValue}>{API_MODE}</Text>
        <Text style={[styles.monoLabel, styles.monoSpaced]}>API_BASE_URL</Text>
        <Text style={styles.monoValue}>{API_BASE_URL}</Text>
        <Text style={[styles.monoLabel, styles.monoSpaced]}>API_HOST_URL</Text>
        <Text style={styles.monoValue}>{API_HOST_URL}</Text>
      </Card>

      <Text style={styles.sectionLabel}>Actions</Text>
      <PrimaryButton
        label={busy && lastLabel === 'GET /health' ? 'Checking…' : 'Check /health'}
        disabled={busy}
        onPress={() =>
          void run('GET /health', async () => {
            return await checkBackendHealth();
          })
        }
      />

      <SecondaryButton
        size="md"
        label={busy && lastLabel === 'GET /games/current' ? 'Loading…' : 'Fetch current game'}
        disabled={busy}
        onPress={() =>
          void run('GET /games/current', async () => {
            return await triggerGame(undefined, false).unwrap();
          })
        }
      />
      <SecondaryButton
        size="md"
        label={busy && lastLabel === 'GET /tailgates' ? 'Loading…' : 'Fetch tailgates'}
        disabled={busy}
        onPress={() =>
          void run('GET /tailgates', async () => {
            return await triggerTailgates(undefined, false).unwrap();
          })
        }
      />
      <SecondaryButton
        size="md"
        label={busy && lastLabel === 'GET /surplus' ? 'Loading…' : 'Fetch surplus'}
        disabled={busy}
        onPress={() =>
          void run('GET /surplus', async () => {
            return await triggerSurplus(undefined, false).unwrap();
          })
        }
      />
      <SecondaryButton
        size="md"
        label={busy && lastLabel === 'GET /donation-centers' ? 'Loading…' : 'Fetch donation centers'}
        disabled={busy}
        onPress={() =>
          void run('GET /donation-centers', async () => {
            return await triggerCenters(undefined, false).unwrap();
          })
        }
      />
      <SecondaryButton
        size="md"
        label={busy && lastLabel === 'GET /impact/global' ? 'Loading…' : 'Fetch global impact'}
        disabled={busy}
        onPress={() =>
          void run('GET /impact/global', async () => {
            return await triggerGlobalImpact(undefined, false).unwrap();
          })
        }
      />
      <SecondaryButton
        size="md"
        label={busy && lastLabel === 'GET /auth/me' ? 'Loading…' : 'Fetch current user (/auth/me)'}
        disabled={busy}
        onPress={() =>
          void run('GET /auth/me', async () => {
            return await triggerMe(undefined, false).unwrap();
          })
        }
      />

      <Text style={styles.sectionLabel}>Protected write diagnostics</Text>
      <Card variant="soft" style={styles.card}>
        <Text style={styles.noteText}>
          Remote surplus publish currently sends: `tailgateId`, `foodName`, `groupName`, `location`,
          `servingsRemaining`, `pickupNote`, optional `foodItemId`, `expiresAt`, and `pickupWindowMinutes`.
        </Text>
        <Text style={styles.inputLabel}>Surplus id (for claim)</Text>
        <TextInput
          value={claimSurplusId}
          onChangeText={setClaimSurplusId}
          placeholder="surplus-123"
          placeholderTextColor={colors.muted}
          style={styles.input}
          editable={!busy}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={[styles.inputLabel, styles.monoSpaced]}>Claim record id (for confirm/release)</Text>
        <TextInput
          value={claimRecordId}
          onChangeText={setClaimRecordId}
          placeholder="claim-record-123"
          placeholderTextColor={colors.muted}
          style={styles.input}
          editable={!busy}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={[styles.inputLabel, styles.monoSpaced]}>Tailgate id (for publish)</Text>
        <TextInput
          value={publishTailgateId}
          onChangeText={setPublishTailgateId}
          placeholder="tailgate-123"
          placeholderTextColor={colors.muted}
          style={styles.input}
          editable={!busy}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={[styles.inputLabel, styles.monoSpaced]}>Food item id (optional for publish)</Text>
        <TextInput
          value={publishFoodItemId}
          onChangeText={setPublishFoodItemId}
          placeholder="food-123"
          placeholderTextColor={colors.muted}
          style={styles.input}
          editable={!busy}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={[styles.inputLabel, styles.monoSpaced]}>Tailgate id (for menu create)</Text>
        <TextInput
          value={menuTailgateId}
          onChangeText={setMenuTailgateId}
          placeholder="tailgate-123"
          placeholderTextColor={colors.muted}
          style={styles.input}
          editable={!busy}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={[styles.inputLabel, styles.monoSpaced]}>Menu item name</Text>
        <TextInput
          value={menuItemName}
          onChangeText={setMenuItemName}
          placeholder="Dev test menu item"
          placeholderTextColor={colors.muted}
          style={styles.input}
          editable={!busy}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={[styles.inputLabel, styles.monoSpaced]}>Menu category (default entree)</Text>
        <TextInput
          value={menuCategory}
          onChangeText={(t) => {
            if (t === 'entree' || t === 'side' || t === 'drink' || t === 'dessert') {
              setMenuCategory(t);
            }
          }}
          placeholder="entree"
          placeholderTextColor={colors.muted}
          style={styles.input}
          editable={!busy}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Card>

      <SecondaryButton
        size="md"
        label={busy && lastLabel === 'POST /surplus/:id/claims' ? 'Posting…' : 'POST /surplus/:id/claims'}
        disabled={busy || claimSurplusId.trim().length === 0}
        onPress={() =>
          void run('POST /surplus/:id/claims', async () => {
            return await claimSurplus({
              surplusId: claimSurplusId.trim(),
              input: { surplusId: claimSurplusId.trim(), servingsClaimed: 1 },
            }).unwrap();
          })
        }
      />

      <SecondaryButton
        size="md"
        label={busy && lastLabel === 'POST /claims/:id/confirm' ? 'Posting…' : 'POST /claims/:id/confirm'}
        disabled={busy || claimRecordId.trim().length === 0}
        onPress={() =>
          void run('POST /claims/:id/confirm', async () => {
            return await confirmClaim({ id: claimRecordId.trim() }).unwrap();
          })
        }
      />

      <SecondaryButton
        size="md"
        label={busy && lastLabel === 'POST /claims/:id/release' ? 'Posting…' : 'POST /claims/:id/release'}
        disabled={busy || claimRecordId.trim().length === 0}
        onPress={() =>
          void run('POST /claims/:id/release', async () => {
            return await releaseClaim({ id: claimRecordId.trim() }).unwrap();
          })
        }
      />

      <SecondaryButton
        size="md"
        label={busy && lastLabel === 'POST /surplus' ? 'Posting…' : 'POST /surplus (minimal publish)'}
        disabled={busy || publishTailgateId.trim().length === 0}
        onPress={() =>
          void run('POST /surplus', async () => {
            const tailgateId = publishTailgateId.trim();
            const payload = {
              tailgateId,
              ...(publishFoodItemId.trim().length > 0 ? { foodItemId: publishFoodItemId.trim() } : {}),
              foodName: 'Dev test item',
              groupName: 'Dev test group',
              location: 'Dev diagnostics',
              servingsRemaining: 1,
              pickupWindowMinutes: 30,
              minutesLeft: 30,
              status: 'available' as const,
              pickupNote: 'Dev API publish smoke test',
              expiresAt: new Date(Date.now() + 2 * 60 * 60_000).toISOString(),
            };
            debugRemotePayload('dev-api publishSurplus input', payload);
            return await createSurplus({
              ...payload,
              imageKey: undefined,
            }).unwrap();
          })
        }
      />

      <SecondaryButton
        size="md"
        label={
          busy && lastLabel === 'POST /tailgates/:id/menu'
            ? 'Posting…'
            : 'POST /tailgates/:id/menu'
        }
        disabled={busy || menuTailgateId.trim().length === 0 || menuItemName.trim().length === 0}
        onPress={() =>
          void run('POST /tailgates/:id/menu', async () => {
            const tailgateId = menuTailgateId.trim();
            const payload = {
              tailgateId,
              input: {
                tailgateId,
                name: menuItemName.trim(),
                category: menuCategory,
                description: 'Dev API menu create smoke test',
                quantityPrepared: 1,
              },
            };
            debugRemotePayload('dev-api createMenuItem input', payload);
            return await createMenuItem(payload).unwrap();
          })
        }
      />

      {busy || claimBusy || confirmBusy || releaseBusy || publishBusy || menuCreateBusy ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.goldLight} accessibilityLabel="Loading" />
          <Text style={styles.loadingText}>{lastLabel ?? 'Working…'}</Text>
        </View>
      ) : null}

      {resultJson !== null && lastLabel === 'POST /surplus' ? (
        <Card variant="soft" style={styles.card}>
          <Text style={styles.noteText}>
            Surplus publish response sanity: verify payload includes id plus tailgate/food/servings/expiry keys (camelCase
            or snake_case), e.g. id, tailgateId/tailgate_id, foodItemId/food_item_id,
            servingsRemaining/servings_remaining, expiresAt/expires_at.
          </Text>
        </Card>
      ) : null}

      {errorText !== null ? (
        <Card variant="soft" accentColor={colors.navy} style={styles.card}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorBody}>{errorText}</Text>
        </Card>
      ) : null}

      {resultJson !== null ? (
        <Card variant="soft" style={styles.card}>
          <Text style={styles.resultTitle}>{lastLabel ?? 'Result'}</Text>
          <ScrollView horizontal nestedScrollEnabled style={styles.jsonScroll}>
            <Text selectable style={styles.jsonText}>
              {resultJson}
            </Text>
          </ScrollView>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    gap: spacing.sm,
  },
  monoLabel: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  monoValue: {
    color: colors.text,
    fontSize: typography.body,
  },
  monoSpaced: {
    marginTop: spacing.sm,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  noteText: {
    color: colors.muted,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  inputLabel: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: typography.body,
    backgroundColor: colors.surface,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.muted,
    fontSize: typography.body,
  },
  errorTitle: {
    color: colors.orange,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  errorBody: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  resultTitle: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  jsonScroll: {
    maxHeight: 320,
  },
  jsonText: {
    color: colors.text,
    fontSize: typography.caption,
    lineHeight: 18,
  },
});
