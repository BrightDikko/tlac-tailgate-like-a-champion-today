import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useGetMeQuery } from '@/src/api/endpoints/authApi';
import { useGetCurrentGameQuery } from '@/src/api/endpoints/gamesApi';
import { useGetTailgatesQuery } from '@/src/api/endpoints/tailgatesApi';
import { selectCurrentUser, selectIsAuthenticated } from '@/src/features/auth/authSelectors';
import { useAppSelector } from '@/src/redux/hooks';
import { API_MODE } from '@/src/services/config/env';
import {
  AppHeader,
  Card,
  FilterChip,
  Screen,
  SearchBar,
  SecondaryButton,
  SectionHeader,
  TailgateCard,
  UserAvatar,
} from '@/src/components';
import type { GamePhase, Tailgate } from '@/src/types';
import { messageFromUnknownError } from '@/src/utils/errorMessage';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

export type DiscoverFilterId = 'all' | 'trending' | 'near_me' | 'bbq' | 'entrees' | 'sides' | 'desserts';

const FILTER_OPTIONS: { id: DiscoverFilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'trending', label: 'Trending' },
  { id: 'near_me', label: 'Near Me' },
  { id: 'bbq', label: 'BBQ' },
  { id: 'entrees', label: 'Entrees' },
  { id: 'sides', label: 'Sides' },
  { id: 'desserts', label: 'Desserts' },
];

const BBQ_TERMS = [
  'bbq',
  'barbecue',
  'brisket',
  'rib',
  'ribs',
  'smoked',
  'smoke',
  'grill',
  'burger',
  'burgers',
  'wing',
  'wings',
  'patty',
] as const;

function phaseLabel(phase: GamePhase) {
  return phase === 'postgame' ? 'Post-game' : 'Pregame';
}

function distanceValue(distance: string): number {
  const match = distance.match(/[\d.]+/);
  if (!match) return Number.POSITIVE_INFINITY;
  const n = parseFloat(match[0]);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

function statusRank(status: Tailgate['status']): number {
  if (status === 'active') return 0;
  if (status === 'planned') return 1;
  return 2;
}

function createdAtMs(t: Tailgate): number | null {
  if (t.createdAt === undefined) return null;
  const ms = Date.parse(t.createdAt);
  return Number.isFinite(ms) ? ms : null;
}

function buildSearchHaystack(t: Tailgate): string {
  const parts: string[] = [
    t.groupName,
    t.groupType,
    t.hostName,
    t.description,
    t.locationDetail,
    ...(t.campusZone ? [t.campusZone] : []),
    ...(t.servingWindow ? [t.servingWindow] : []),
    ...(t.featuredMenuItems ?? []),
    ...t.tags,
  ];
  return parts.join(' ').toLowerCase();
}

function normalizeSearchQuery(raw: string): string {
  let s = raw.toLowerCase().replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  const pairs: [RegExp, string][] = [
    [/veggies?/g, 'vegetarian'],
    [/veg\b/g, 'vegetarian'],
    [/plant[- ]?based/g, 'vegetarian'],
    [/desserts/g, 'dessert'],
    [/sweets?/g, 'dessert'],
    [/treats?/g, 'dessert'],
    [/bbq\b/g, 'barbecue'],
    [/smash/g, 'smashburger'],
  ];
  for (const [re, rep] of pairs) {
    s = s.replace(re, rep);
  }
  return s;
}

function tailgateMatchesSearch(t: Tailgate, rawQuery: string): boolean {
  const q = normalizeSearchQuery(rawQuery);
  if (!q) return true;
  const hay = buildSearchHaystack(t);
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every((tok) => hay.includes(tok));
}

function textMentionsAny(hay: string, terms: readonly string[]): boolean {
  return terms.some((term) => hay.includes(term));
}

function tailgateMatchesBbq(t: Tailgate): boolean {
  const featuredHay = (t.featuredMenuItems ?? []).join(' ').toLowerCase();
  if (textMentionsAny(featuredHay, BBQ_TERMS)) return true;
  const tagHay = t.tags.join(' ').toLowerCase();
  if (textMentionsAny(tagHay, BBQ_TERMS)) return true;
  const descHay = `${t.description} ${t.groupName}`.toLowerCase();
  if (textMentionsAny(descHay, BBQ_TERMS)) return true;
  return false;
}

const ENTREE_HINTS = [
  'burger',
  'brat',
  'rib',
  'hot dog',
  'dog',
  'wings',
  'wing',
  'pulled',
  'brisket',
  'entree',
  'chili',
  'smash',
  'taco',
  'dogs',
] as const;

const DESSERT_HINTS = ['dessert', 'cupcake', 'brownie', 'sweet', 'cookie', 'cake', 'treat'] as const;

function tailgateMatchesCategoryFilter(t: Tailgate, filter: DiscoverFilterId): boolean {
  const tagBlob = t.tags.join(' ').toLowerCase();
  const descBlob = t.description.toLowerCase();
  const featuredBlob = (t.featuredMenuItems ?? []).join(' ').toLowerCase();

  switch (filter) {
    case 'all':
    case 'trending':
    case 'near_me':
      return true;
    case 'bbq':
      return tailgateMatchesBbq(t);
    case 'entrees': {
      const blob = `${tagBlob} ${descBlob} ${featuredBlob}`;
      return ENTREE_HINTS.some((h) => blob.includes(h));
    }
    case 'sides': {
      return (
        t.tags.some((tag) => tag.toLowerCase().includes('side')) ||
        descBlob.includes('sides') ||
        featuredBlob.includes('side') ||
        descBlob.includes('vegetarian') ||
        tagBlob.includes('vegetarian') ||
        featuredBlob.includes('vegetarian')
      );
    }
    case 'desserts': {
      const blob = `${tagBlob} ${descBlob} ${featuredBlob}`;
      return DESSERT_HINTS.some((h) => blob.includes(h));
    }
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}

function sortTailgatesForDiscover(list: Tailgate[], filter: DiscoverFilterId): Tailgate[] {
  const indexed = list.map((item, index) => ({ item, index }));
  indexed.sort((a, b) => {
    if (filter === 'near_me') {
      const d = distanceValue(a.item.distance) - distanceValue(b.item.distance);
      return d !== 0 ? d : a.index - b.index;
    }
    if (filter === 'trending') {
      const trend = b.item.trendingScore - a.item.trendingScore;
      return trend !== 0 ? trend : a.index - b.index;
    }
    if (filter === 'all') {
      const rank = statusRank(a.item.status) - statusRank(b.item.status);
      if (rank !== 0) return rank;
      const aCreated = createdAtMs(a.item);
      const bCreated = createdAtMs(b.item);
      if (aCreated !== null && bCreated !== null && aCreated !== bCreated) {
        return bCreated - aCreated;
      }
      return a.index - b.index;
    }
    const trend = b.item.trendingScore - a.item.trendingScore;
    return trend !== 0 ? trend : a.index - b.index;
  });
  return indexed.map((x) => x.item);
}

function filterAndSortTailgates(all: Tailgate[], filter: DiscoverFilterId, query: string): Tailgate[] {
  const narrowed = all.filter((t) => {
    if (filter === 'trending') {
      return t.status === 'active';
    }
    return tailgateMatchesCategoryFilter(t, filter);
  });
  const searched = narrowed.filter((t) => tailgateMatchesSearch(t, query));
  return sortTailgatesForDiscover(searched, filter);
}

function resultsSectionCopy(
  filter: DiscoverFilterId,
  query: string
): { title: string; subtitle: string } {
  const hasQuery = query.trim().length > 0;
  if (filter === 'near_me') {
    return {
      title: 'Results near you',
      subtitle: 'Walking distance from campus. Closest tailgates first.',
    };
  }
  if (filter === 'trending') {
    return {
      title: 'Trending tailgates',
      subtitle: hasQuery
        ? 'Highest buzz among groups that still match your search.'
        : 'What the gameday network is buzzing about right now.',
    };
  }
  if (filter === 'all') {
    return {
      title: 'All tailgates',
      subtitle: 'All active, planned, and completed listings for this gameday.',
    };
  }
  return {
    title: 'Matching tailgates',
    subtitle: hasQuery
        ? 'Hosts, featured bites, lots, and tags that match what you typed.'
      : 'Filtered for this gameday. Refine with search anytime.',
  };
}

export default function DiscoverTabScreen() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const reduxUser = useAppSelector(selectCurrentUser);
  const skipMeQuery = reduxUser !== null || (API_MODE === 'remote' && !isAuthenticated);
  const { data: queriedUser } = useGetMeQuery(undefined, { skip: skipMeQuery });
  const currentUser = reduxUser ?? queriedUser;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<DiscoverFilterId>('all');

  const {
    data: currentGame,
    isLoading: gameLoading,
    isError: gameError,
    error: gameErr,
    refetch: refetchGame,
  } = useGetCurrentGameQuery();
  const {
    data: tailgatesResponse,
    isLoading: tailgatesLoading,
    isError: tailgatesError,
    error: tailgatesErr,
    refetch: refetchTailgates,
  } = useGetTailgatesQuery();

  const tailgatesList = useMemo(() => tailgatesResponse?.data ?? [], [tailgatesResponse]);
  const isLoading = gameLoading || tailgatesLoading;
  const isError = gameError || tailgatesError;
  const combinedError = gameErr ?? tailgatesErr;

  const matchingTailgates = useMemo(
    () => filterAndSortTailgates(tailgatesList, selectedFilter, searchQuery),
    [tailgatesList, searchQuery, selectedFilter]
  );

  const resultsCopy = useMemo(
    () => resultsSectionCopy(selectedFilter, searchQuery),
    [selectedFilter, searchQuery]
  );

  const resetDiscover = () => {
    setSearchQuery('');
    setSelectedFilter('all');
  };

  const refetchDiscover = () => {
    void refetchGame();
    void refetchTailgates();
  };

  const metaLine = currentGame
    ? `${currentGame.gameDate} · ${currentGame.kickoffTime} · ${currentGame.weather}`
    : '';

  return (
    <Screen scroll safeAreaEdges={['top', 'left', 'right']} contentContainerStyle={styles.content}>
      <AppHeader
        title="TAILGATE LIKE A CHAMP!"
        subtitle={
          currentGame
            ? `${phaseLabel(currentGame.phase)} · ${currentGame.matchup}`
            : 'Loading gameday…'
        }
        rightAction={
          <Pressable accessibilityRole="button" hitSlop={12} style={styles.iconHit}>
            <UserAvatar user={currentUser} size={42} borderColor={colors.gold} fallbackInitials="TL" />
          </Pressable>
        }
      />

      <View style={styles.statusPill}>
        <Text style={styles.statusPillEmoji}>🔥</Text>
        <Text style={styles.statusPillText}>Tailgates active</Text>
      </View>

      <Text style={styles.screenLead}>Discover</Text>
      <Text style={styles.screenLeadMuted}>Browse menus and find tailgates around gameday.</Text>

      {isLoading ? (
        <Card style={styles.gameCard} variant="soft">
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Loading discover" />
          </View>
        </Card>
      ) : isError ? (
        <Card variant="soft">
          <Text style={styles.emptyBody}>
            {messageFromUnknownError(combinedError, 'Could not load discover data.')}
          </Text>
          <SecondaryButton label="Try again" onPress={() => void refetchDiscover()} />
        </Card>
      ) : (
        <>
          <Card style={styles.gameCard} noPadding>
            <View style={styles.gameTopAccent} />
            <View style={styles.gameCardInner}>
              <Text style={styles.gameLabel}>Current game</Text>
              <Text style={styles.gameMatchup}>{currentGame?.matchup ?? ''}</Text>
              <Text style={styles.gameMeta}>{metaLine}</Text>
              <Text style={styles.gameMeta}>{currentGame?.location ?? ''}</Text>
            </View>
          </Card>

          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search tailgates, menus, lots…"
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
          >
            {FILTER_OPTIONS.map(({ id, label }) => (
              <FilterChip
                key={id}
                label={label}
                selected={selectedFilter === id}
                onPress={() => setSelectedFilter(id)}
              />
            ))}
          </ScrollView>

          {matchingTailgates.length > 0 ? (
            <>
              <SectionHeader title={resultsCopy.title} subtitle={resultsCopy.subtitle} />
              <View style={styles.tailgateList}>
                {matchingTailgates.map((tailgate, index) => (
                  <TailgateCard
                    key={tailgate.id}
                    tailgate={tailgate}
                    highlightLabel={
                      index === 0 ? (searchQuery.trim() ? 'Top match' : 'Top pick') : undefined
                    }
                    heroTone={index === 0 ? 'gold' : 'navy'}
                    onViewPress={() =>
                      router.push({
                        pathname: '/student/tailgate-detail',
                        params: { tailgateId: tailgate.id },
                      })
                    }
                    viewLabel="View tailgate"
                  />
                ))}
              </View>
            </>
          ) : (
            <Card style={styles.emptyCard} variant="soft" accentColor={colors.navy}>
              <Text style={styles.emptyTitle}>No tailgates found</Text>
              <Text style={styles.emptyBody}>Try a different food, lot, or tailgate group.</Text>
              <SecondaryButton label="Clear search & filters" onPress={resetDiscover} />
            </Card>
          )}
        </>
      )}

      <SecondaryButton label="Host tools" size="md" onPress={() => router.push('/dashboard')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  iconHit: {
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  statusPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  statusPillEmoji: {
    fontSize: 14,
  },
  statusPillText: {
    color: '#991B1B',
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
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
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  gameCard: {
    borderColor: colors.border,
  },
  gameTopAccent: {
    height: 4,
    backgroundColor: colors.gold,
  },
  gameCardInner: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surfaceSoft,
  },
  gameLabel: {
    color: '#D8E3F1',
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gameMatchup: {
    marginTop: spacing.sm,
    color: colors.white,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  gameMeta: {
    marginTop: spacing.xs,
    color: '#D8E3F1',
    fontSize: typography.caption,
    lineHeight: 18,
  },
  filtersRow: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  tailgateList: {
    gap: spacing.lg,
  },
  emptyCard: {
    gap: spacing.md,
    alignItems: 'stretch',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  emptyBody: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  loadingBlock: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
