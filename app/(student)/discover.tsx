import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useGetMeQuery } from '@/src/api/endpoints/authApi';
import { useGetCurrentGameQuery } from '@/src/api/endpoints/gamesApi';
import { useGetTailgatesQuery } from '@/src/api/endpoints/tailgatesApi';
import { placeImages } from '@/src/assets/images';
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

function phaseBadgeLabel(phase: GamePhase): string {
  return phase === 'postgame' ? 'POSTGAME' : 'PREGAME';
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

      <View style={styles.screenLeadContainer}>
        <Text style={styles.screenLead}>Discover Tailgates</Text>
        <Text style={styles.screenLeadMuted}>Browse menus and find tailgates around gameday.</Text>
      </View>

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
            <ImageBackground
              source={placeImages['notre-dame-stadium']}
              resizeMode="cover"
              style={styles.currentGameCard}
              imageStyle={styles.currentGameImage}
            >
              <View style={styles.currentGameOverlay} />
              <View style={styles.currentGameContent}>
                <View style={styles.currentGameTopRow}>
                  <Text style={styles.currentGameLabel}>Current game</Text>
                  <Text style={styles.currentGamePhaseText}>
                    {currentGame ? phaseBadgeLabel(currentGame.phase) : 'GAMEDAY'}
                  </Text>
                </View>

                <Text style={styles.currentGameTitle}>{currentGame?.matchup ?? 'Game details loading…'}</Text>

                <View style={styles.gameInfoList}>
                  <View style={styles.gameInfoRow}>
                    <View style={styles.gameInfoIcon}>
                      <Ionicons name="calendar-outline" size={15} color={colors.goldLight} />
                    </View>
                    <Text style={styles.gameInfoText}>{currentGame?.gameDate ?? 'Date pending'}</Text>
                  </View>
                  <View style={styles.gameInfoRow}>
                    <View style={styles.gameInfoIcon}>
                      <Ionicons name="time-outline" size={15} color={colors.goldLight} />
                    </View>
                    <Text style={styles.gameInfoText}>
                      {currentGame?.kickoffTime ? `Kickoff ${currentGame.kickoffTime}` : 'Kickoff pending'}
                    </Text>
                  </View>
                  <View style={styles.gameInfoRow}>
                    <View style={styles.gameInfoIcon}>
                      <Ionicons name="partly-sunny-outline" size={15} color={colors.goldLight} />
                    </View>
                    <Text style={styles.gameInfoText}>{currentGame?.weather ?? 'Weather loading'}</Text>
                  </View>
                  <View style={styles.gameInfoRow}>
                    <View style={styles.gameInfoIcon}>
                      <Ionicons name="location-outline" size={15} color={colors.goldLight} />
                    </View>
                    <Text style={styles.gameInfoText}>{currentGame?.location ?? 'Location pending'}</Text>
                  </View>
                </View>
              </View>
            </ImageBackground>
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
  screenLeadContainer: {
    gap: spacing.md,
    marginTop: spacing.sm,
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
  },
  gameCard: {
    borderColor: colors.border,
  },
  gameTopAccent: {
    height: 4,
    backgroundColor: colors.gold,
  },
  currentGameCard: {
    position: 'relative',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    minHeight: 250,
  },
  currentGameImage: {
    opacity: 0.9,
  },
  currentGameOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 11, 21, 0.74)',
  },
  currentGameContent: {
    gap: spacing.md,
  },
  currentGameTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  currentGameLabel: {
    color: '#D8E3F1',
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentGamePhaseText: {
    color: colors.goldLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.45,
    textTransform: 'uppercase',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  currentGameTitle: {
    color: colors.white,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  gameInfoList: {
    gap: spacing.sm,
  },
  gameInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: 'rgba(7, 26, 45, 0.85)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  gameInfoIcon: {
    width: 20,
    alignItems: 'center',
    marginTop: 1,
  },
  gameInfoText: {
    flex: 1,
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
