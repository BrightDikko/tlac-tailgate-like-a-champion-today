import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { useGetMeQuery } from '@/src/api/endpoints/authApi';
import { useGetCurrentGameQuery } from '@/src/api/endpoints/gamesApi';
import { selectIsAuthenticated } from '@/src/features/auth/authSelectors';
import { useAppSelector } from '@/src/redux/hooks';
import { API_MODE } from '@/src/services/config/env';
import { useGetMenuByTailgateIdQuery } from '@/src/api/endpoints/menuApi';
import { useGetTailgatesQuery } from '@/src/api/endpoints/tailgatesApi';
import { useCreateSurplusMutation } from '@/src/api/endpoints/surplusApi';
import { foodImages, placeholderImages, tailgateImages } from '@/src/assets/images';
import { Card, HostBrandedHeader, PrimaryButton, Screen, SecondaryButton } from '@/src/components';
import type { FoodItem, GamePhase, Tailgate } from '@/src/types';
import { colors } from '@/src/theme/colors';
import { radii } from '@/src/theme/radii';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import { messageFromUnknownError } from '@/src/utils/errorMessage';

type PublishDraftItem = {
  foodItemId: string;
  foodName: string;
  selected: boolean;
  servingsRemaining: string;
  imageKey?: string;
};

const pickupWindows = ['15 min', '30 min', '45 min', '60 min'] as const;
const availabilityWindows = ['1 hr', '2 hr', '4 hr', 'Until 8 PM'] as const;

function phaseLabel(phase: GamePhase) {
  return phase === 'postgame' ? 'Post-game' : 'Pregame';
}

function defaultServingsFor(quantityPrepared: number): string {
  return String(Math.max(1, Math.round(quantityPrepared * 0.25)));
}

function minutesFromWindow(value: string): number {
  const match = value.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : 30;
}

function availabilityDeadlineFromWindow(value: string): Date {
  if (value === 'Until 8 PM') {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(20, 0, 0, 0);
    if (endOfDay.getTime() > now.getTime()) {
      return endOfDay;
    }
  }
  const match = value.match(/\d+/);
  const hours = match ? Number.parseInt(match[0], 10) : 4;
  return new Date(Date.now() + hours * 60 * 60_000);
}

function mergeDraftsFromMenu(menu: FoodItem[], prev: PublishDraftItem[]): PublishDraftItem[] {
  const prevMap = new Map(prev.map((d) => [d.foodItemId, d]));
  return menu.map((item) => {
    const old = prevMap.get(item.id);
    if (old) {
      return {
        ...old,
        foodName: item.name,
        imageKey: item.imageKey,
      };
    }
    return {
      foodItemId: item.id,
      foodName: item.name,
      selected: false,
      servingsRemaining: defaultServingsFor(item.quantityPrepared),
      imageKey: item.imageKey,
    };
  });
}

function validatePublishDrafts(
  drafts: PublishDraftItem[],
  pickupNote: string,
  tailgate: Tailgate | undefined,
  availabilityWindow: string,
  pickupWindow: string,
): string | null {
  if (tailgate === undefined) {
    return 'Choose a tailgate to publish under.';
  }
  const selected = drafts.filter((d) => d.selected);
  if (selected.length === 0) {
    return 'Select at least one menu item to publish.';
  }
  for (const item of selected) {
    const n = Number.parseInt(item.servingsRemaining, 10);
    if (!Number.isFinite(n) || n < 1) {
      return `Enter a valid serving count for “${item.foodName}”.`;
    }
  }
  if (pickupNote.trim() === '') {
    return 'Add a pickup note so neighbors know how to find you.';
  }
  if (tailgate.groupName.trim().length === 0) {
    return 'This tailgate is missing a group name. Update it before publishing.';
  }
  if (tailgate.locationDetail.trim().length === 0) {
    return 'This tailgate is missing a location. Update it before publishing.';
  }
  const availabilityDeadline = availabilityDeadlineFromWindow(availabilityWindow);
  if (!Number.isFinite(availabilityDeadline.getTime()) || availabilityDeadline.getTime() <= Date.now()) {
    return 'Choose an availability deadline in the future.';
  }
  if (minutesFromWindow(pickupWindow) <= 0) {
    return 'Choose a valid pickup hold window.';
  }
  return null;
}

function foodThumbSource(key: string | undefined): ImageSourcePropType | undefined {
  if (key !== undefined && key in foodImages) {
    return foodImages[key as keyof typeof foodImages];
  }
  return undefined;
}

function tailgateHeroSource(tailgate: Tailgate): ImageSourcePropType {
  return (
    (tailgate.imageKey ? (tailgateImages as Record<string, ImageSourcePropType>)[tailgate.imageKey] : undefined) ??
    placeholderImages.tailgate
  );
}

export default function HostPublishTabScreen() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const skipProtected = API_MODE === 'remote' && !isAuthenticated;

  const {
    data: currentUser,
    isLoading: meLoading,
    isError: meError,
    error: meErr,
    refetch: refetchMe,
  } = useGetMeQuery(undefined, { skip: skipProtected });

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

  const hostTailgates = useMemo(() => hostTailgatesResponse?.data ?? [], [hostTailgatesResponse?.data]);

  const [selectedTailgateId, setSelectedTailgateId] = useState<string | undefined>(undefined);
  const draftsTailgateRef = useRef<string | null>(null);

  useEffect(() => {
    if (hostTailgates.length === 0) {
      setSelectedTailgateId(undefined);
      draftsTailgateRef.current = null;
      return;
    }
    setSelectedTailgateId((prev) => {
      if (prev === undefined || !hostTailgates.some((t) => t.id === prev)) {
        return hostTailgates[0]!.id;
      }
      return prev;
    });
  }, [hostTailgates]);

  const selectedHostTailgate = useMemo(
    () => hostTailgates.find((t) => t.id === selectedTailgateId) ?? hostTailgates[0],
    [hostTailgates, selectedTailgateId],
  );

  const {
    data: menuResponse,
    isLoading: menuLoading,
    isError: menuError,
    error: menuErr,
    refetch: refetchMenu,
  } = useGetMenuByTailgateIdQuery(
    { tailgateId: selectedHostTailgate?.id ?? '' },
    { skip: selectedHostTailgate === undefined },
  );

  const menuItems = useMemo(() => menuResponse?.data ?? [], [menuResponse?.data]);

  const [drafts, setDrafts] = useState<PublishDraftItem[]>([]);
  const [pickupWindowMinutes, setPickupWindowMinutes] = useState<string>('30 min');
  const [availabilityWindow, setAvailabilityWindow] = useState<string>('4 hr');
  const [pickupNote, setPickupNote] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const tailgateId = selectedHostTailgate?.id;
  const tailgateLocation = selectedHostTailgate?.locationDetail;

  useEffect(() => {
    if (tailgateId === undefined || tailgateLocation === undefined) {
      setPickupNote('');
      return;
    }
    setPickupNote(`Pickup near ${tailgateLocation}`);
  }, [tailgateId, tailgateLocation]);

  useEffect(() => {
    if (tailgateId === undefined) {
      setDrafts([]);
      draftsTailgateRef.current = null;
      return;
    }
    if (draftsTailgateRef.current !== tailgateId) {
      draftsTailgateRef.current = tailgateId;
      setDrafts(
        menuItems.map((item) => ({
          foodItemId: item.id,
          foodName: item.name,
          selected: false,
          servingsRemaining: defaultServingsFor(item.quantityPrepared),
          imageKey: item.imageKey,
        })),
      );
      return;
    }
    setDrafts((prev) => mergeDraftsFromMenu(menuItems, prev));
  }, [tailgateId, menuItems]);

  const [createSurplus, { isLoading: isPublishing, error: publishError, reset: resetPublishError }] =
    useCreateSurplusMutation();

  const fatalQueryError = (!skipProtected && meError) || gameError || (Boolean(userId) && tailgatesError);
  const fatalQueryErr = (skipProtected ? undefined : meErr) ?? gameErr ?? tailgatesErr;

  const queriesLoading =
    (!skipProtected && meLoading) ||
    (Boolean(userId) && (gameLoading || tailgatesLoading)) ||
    (Boolean(userId) && selectedHostTailgate !== undefined && menuLoading);

  const refetchAll = () => {
    if (!skipProtected) {
      void refetchMe();
    }
    void refetchGame();
    if (userId) {
      void refetchTailgates();
    }
    if (userId && selectedHostTailgate !== undefined) {
      void refetchMenu();
    }
  };

  const headerSubtitle = currentGame
    ? `Host · ${phaseLabel(currentGame.phase)} · ${currentGame.matchup}`
    : gameLoading || (!skipProtected && meLoading)
      ? 'Host · Loading gameday…'
      : 'Host · Gameday';

  const selectedDrafts = drafts.filter((d) => d.selected);
  const totalServingsSelected = selectedDrafts.reduce((sum, d) => {
    const n = Number.parseInt(d.servingsRemaining, 10);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

  const handlePublish = async () => {
    if (skipProtected || currentUser === undefined) return;
    if (selectedHostTailgate === undefined) return;
    resetPublishError();
    const err = validatePublishDrafts(
      drafts,
      pickupNote,
      selectedHostTailgate,
      availabilityWindow,
      pickupWindowMinutes,
    );
    if (err !== null) {
      setValidationMessage(err);
      return;
    }
    setValidationMessage(null);
    const groupName = selectedHostTailgate.groupName.trim();
    const location = selectedHostTailgate.locationDetail.trim();
    if (groupName.length === 0 || location.length === 0) {
      setValidationMessage('This tailgate is missing group name or location. Update the listing before publishing.');
      return;
    }
    try {
      const listingExpiresAtDate = availabilityDeadlineFromWindow(availabilityWindow);
      if (!Number.isFinite(listingExpiresAtDate.getTime()) || listingExpiresAtDate.getTime() <= Date.now()) {
        setValidationMessage('Choose an availability deadline in the future.');
        return;
      }
      const pickupHoldMinutes = minutesFromWindow(pickupWindowMinutes);
      if (pickupHoldMinutes <= 0) {
        setValidationMessage('Choose a valid pickup hold window.');
        return;
      }
      const availabilityMinutesLeft = Math.max(
        1,
        Math.ceil((listingExpiresAtDate.getTime() - Date.now()) / 60_000),
      );
      const createdAt = new Date().toISOString();
      // Surplus expiresAt is listing availability deadline; pickup hold is sent separately.
      const expiresAt = listingExpiresAtDate.toISOString();
      const trimmedNote = pickupNote.trim();
      const itemsPublished = selectedDrafts.length;
      const totalServings = selectedDrafts.reduce((sum, draft) => {
        const n = Number.parseInt(draft.servingsRemaining, 10);
        return sum + (Number.isFinite(n) ? n : 0);
      }, 0);
      await Promise.all(
        selectedDrafts.map((draft) =>
          createSurplus({
            tailgateId: selectedHostTailgate.id,
            foodItemId: draft.foodItemId,
            foodName: draft.foodName,
            groupName,
            location,
            servingsRemaining: Number.parseInt(draft.servingsRemaining, 10),
            minutesLeft: availabilityMinutesLeft,
            status: 'available',
            pickupNote: trimmedNote,
            createdAt,
            expiresAt,
            pickupWindowMinutes: pickupHoldMinutes,
            ...(draft.imageKey !== undefined ? { imageKey: draft.imageKey } : {}),
          }).unwrap(),
        ),
      );
      router.push({
        pathname: '/host/surplus-published',
        params: {
          tailgateId: selectedHostTailgate.id,
          tailgateName: selectedHostTailgate.groupName,
          itemsPublished: String(itemsPublished),
          totalServings: String(totalServings),
          pickupWindowMinutes: String(pickupHoldMinutes),
          availabilityWindowMinutes: String(availabilityMinutesLeft),
          pickupNote: trimmedNote,
        },
      });
    } catch {
      // surfaced via publishError
    }
  };

  const blockPublish =
    skipProtected ||
    currentUser === undefined ||
    selectedHostTailgate === undefined ||
    isPublishing ||
    queriesLoading ||
    fatalQueryError ||
    menuError ||
    menuLoading;

  const notePreview =
    pickupNote.trim() === ''
      ? 'No pickup note yet'
      : pickupNote.trim().length > 80
        ? `${pickupNote.trim().slice(0, 80)}…`
        : pickupNote.trim();

  return (
    <Screen scroll safeAreaEdges={['top', 'left', 'right']} contentContainerStyle={styles.content}>
      <HostBrandedHeader subtitle={headerSubtitle} />

      {fatalQueryError ? (
        <Card variant="soft" accentColor={colors.navy}>
          <View style={styles.stateIconWrap}>
            <Ionicons name="cloud-offline-outline" size={36} color={colors.goldLight} />
          </View>
          <Text style={styles.stateTitle}>Couldn’t load workspace</Text>
          <Text style={styles.errorBody}>{messageFromUnknownError(fatalQueryErr, 'Could not load publish data.')}</Text>
          <SecondaryButton label="Try again" onPress={() => void refetchAll()} />
        </Card>
      ) : null}

      {queriesLoading && !fatalQueryError ? (
        <Card variant="soft">
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Loading publish data" />
            <Text style={styles.loadingHint}>Loading tailgates and menu…</Text>
          </View>
        </Card>
      ) : null}

      {(skipProtected || (!meLoading && !meError)) && !currentUser ? (
        <Card variant="soft" accentColor={colors.navy}>
          <View style={styles.stateIconWrap}>
            <Ionicons name="person-outline" size={36} color={colors.goldLight} />
          </View>
          <Text style={styles.stateTitle}>Sign in required</Text>
          <Text style={styles.errorBody}>Sign in to publish surplus from your host listings.</Text>
        </Card>
      ) : null}

      {!queriesLoading && !fatalQueryError && userId && hostTailgates.length === 0 ? (
        <Card variant="soft" accentColor={colors.navy}>
          <View style={styles.stateIconWrap}>
            <Ionicons name="flag-outline" size={36} color={colors.goldLight} />
          </View>
          <Text style={styles.stateTitle}>No tailgate yet</Text>
          <Text style={styles.errorBody}>Create a tailgate before publishing surplus.</Text>
          <PrimaryButton label="Create tailgate" onPress={() => router.push('/create-tailgate')} />
        </Card>
      ) : null}

      {!queriesLoading && !fatalQueryError && selectedHostTailgate ? (
        <>
          <Card variant="soft" accentColor={colors.navy} style={styles.heroCard}>
            <Text style={styles.heroKicker}>Surplus publish</Text>
            <Text style={styles.heroTitle}>Publish surplus</Text>
            <Text style={styles.heroLead}>
              Turn real menu leftovers into pickup listings. Students and fans see servings, window, and your note on
              the surplus feed.
            </Text>

            {currentGame ? (
              <View style={styles.gameContext}>
                <View style={styles.gameContextIcon}>
                  <Ionicons name="calendar-outline" size={18} color={colors.goldLight} />
                </View>
                <View style={styles.gameContextCopy}>
                  <Text style={styles.gameContextLabel}>Game context</Text>
                  <Text style={styles.gameContextTitle}>{currentGame.matchup}</Text>
                  <Text style={styles.gameContextMeta}>
                    {currentGame.gameDate} · Kickoff {currentGame.kickoffTime}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.gameContextMuted}>
                <Ionicons name="time-outline" size={18} color={colors.muted} />
                <Text style={styles.gameContextMutedText}>Gameday schedule loads here when available.</Text>
              </View>
            )}

            <View style={styles.heroStatStack}>
              <View
                style={[
                  styles.heroStatRow,
                  selectedDrafts.length > 0 ? styles.heroStatRowEmphasized : null,
                ]}
              >
                <View style={styles.heroStatTextCol}>
                  <Text style={styles.heroStatLabel}>Selected</Text>
                  <Text style={styles.heroStatHint}>Dishes on this publish</Text>
                </View>
                <Text style={styles.heroStatValue}>{String(selectedDrafts.length)}</Text>
              </View>
              <View
                style={[
                  styles.heroStatRow,
                  totalServingsSelected > 0 ? styles.heroStatRowEmphasized : null,
                ]}
              >
                <View style={styles.heroStatTextCol}>
                  <Text style={styles.heroStatLabel}>Servings</Text>
                  <Text style={styles.heroStatHint}>Total you are listing</Text>
                </View>
                <Text style={styles.heroStatValue}>{String(totalServingsSelected)}</Text>
              </View>
              <View style={styles.heroStatRow}>
                <View style={styles.heroStatTextCol}>
                  <Text style={styles.heroStatLabel}>Window</Text>
                  <Text style={styles.heroStatHint}>Availability and pickup hold</Text>
                </View>
                <Text style={styles.heroStatValue}>{availabilityWindow}</Text>
              </View>
            </View>
          </Card>

          <Text style={styles.sectionEyebrow}>Listing</Text>
          <Text style={styles.sectionTitle}>Which tailgate?</Text>
          <Text style={styles.sectionSubtitle}>Surplus posts use this group name and lot copy.</Text>

          {hostTailgates.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tailgateScroll}
            >
              {hostTailgates.map((t) => {
                const selected = t.id === selectedHostTailgate.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setSelectedTailgateId(t.id)}
                    style={({ pressed }) => [
                      styles.tailgatePickWrap,
                      selected && styles.tailgatePickWrapSelected,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    <ImageBackground
                      source={tailgateHeroSource(t)}
                      style={styles.tailgatePickImage}
                      imageStyle={styles.tailgatePickImageRadius}
                    >
                      <View style={styles.tailgatePickDim} />
                      <View style={styles.tailgatePickBody}>
                        {selected ? (
                          <View style={styles.tailgatePickBadge}>
                            <Ionicons name="checkmark-circle" size={18} color={colors.textInverse} />
                          </View>
                        ) : null}
                        <Text style={styles.tailgatePickName} numberOfLines={2}>
                          {t.groupName}
                        </Text>
                        <Text style={styles.tailgatePickMeta} numberOfLines={2}>
                          {t.locationDetail}
                        </Text>
                      </View>
                    </ImageBackground>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <Card variant="soft" noPadding style={styles.singleTailgateCard}>
              <ImageBackground
                source={tailgateHeroSource(selectedHostTailgate)}
                style={styles.singleTailgateHero}
                imageStyle={styles.tailgatePickImageRadius}
              >
                <View style={styles.tailgatePickDim} />
                <View style={styles.singleTailgateInner}>
                  <Text style={styles.tailgatePickName}>{selectedHostTailgate.groupName}</Text>
                  <View style={styles.singleTailgateLocRow}>
                    <Ionicons name="location-outline" size={16} color={colors.goldLight} />
                    <Text style={styles.singleTailgateLoc}>{selectedHostTailgate.locationDetail}</Text>
                  </View>
                </View>
              </ImageBackground>
            </Card>
          )}

          {menuError ? (
            <Card variant="soft" accentColor={colors.navy}>
              <View style={styles.stateIconWrap}>
                <Ionicons name="restaurant-outline" size={32} color={colors.goldLight} />
              </View>
              <Text style={styles.stateTitle}>Menu didn’t load</Text>
              <Text style={styles.errorBody}>{messageFromUnknownError(menuErr, 'Could not load publish data.')}</Text>
              <SecondaryButton label="Try again" onPress={() => void refetchMenu()} />
            </Card>
          ) : null}

          {!menuLoading && !menuError && menuItems.length === 0 ? (
            <Card variant="soft" accentColor={colors.navy}>
              <View style={styles.stateIconWrap}>
                <Ionicons name="fast-food-outline" size={34} color={colors.goldLight} />
              </View>
              <Text style={styles.stateTitle}>No menu items yet</Text>
              <Text style={styles.errorBody}>
                Add dishes to this tailgate before you can publish surplus from the kitchen.
              </Text>
              <PrimaryButton
                label="Manage tailgate"
                onPress={() =>
                  router.push({ pathname: '/tailgate-manage', params: { tailgateId: selectedHostTailgate.id } })
                }
              />
            </Card>
          ) : null}

          {!menuLoading && !menuError && menuItems.length > 0 ? (
            <>
              <Text style={[styles.sectionEyebrow, styles.sectionEyebrowSpaced]}>Menu</Text>
              <Text style={styles.sectionTitle}>Select leftovers</Text>
              <Text style={styles.sectionSubtitle}>
                Tap a row to include it. Set servings for each dish you list.
              </Text>

              <View style={styles.foodList}>
                {drafts.map((draft) => {
                  const menuRow = menuItems.find((m) => m.id === draft.foodItemId);
                  const qtyPrepared = menuRow?.quantityPrepared;
                  const thumb = foodThumbSource(draft.imageKey);
                  const toggleSelected = () =>
                    setDrafts((prev) =>
                      prev.map((d) => (d.foodItemId === draft.foodItemId ? { ...d, selected: !d.selected } : d)),
                    );
                  return (
                    <View
                      key={draft.foodItemId}
                      style={[styles.foodRowCard, draft.selected ? styles.foodRowCardSelected : styles.foodRowCardIdle]}
                    >
                      <Pressable
                        onPress={toggleSelected}
                        style={({ pressed }) => [styles.foodRowHit, pressed && styles.pressedOpacity]}
                      >
                        {thumb ? (
                          <Image source={thumb} style={styles.foodRowThumb} resizeMode="cover" />
                        ) : (
                          <View style={styles.foodRowThumbFallback}>
                            <Ionicons name="restaurant-outline" size={18} color={colors.goldLight} />
                          </View>
                        )}
                        <View style={styles.foodRowText}>
                          <Text style={styles.foodRowName} numberOfLines={2}>
                            {draft.foodName}
                          </Text>
                          {qtyPrepared !== undefined ? (
                            <Text style={styles.foodRowPrepared}>Prepared · {qtyPrepared} servings</Text>
                          ) : null}
                          <Text style={draft.selected ? styles.foodRowStatusOn : styles.foodRowStatusOff}>
                            {draft.selected ? 'Included · tap to remove' : 'Tap to add'}
                          </Text>
                        </View>
                        <View style={styles.foodRowCheck}>
                          <Ionicons
                            name={draft.selected ? 'checkbox' : 'square-outline'}
                            size={26}
                            color={draft.selected ? colors.goldLight : colors.muted}
                          />
                        </View>
                      </Pressable>
                      {draft.selected ? (
                        <View style={styles.foodRowServings}>
                          <Text style={styles.inputLabel}>Servings to list</Text>
                          <TextInput
                            value={draft.servingsRemaining}
                            onChangeText={(text) =>
                              setDrafts((prev) =>
                                prev.map((d) =>
                                  d.foodItemId === draft.foodItemId ? { ...d, servingsRemaining: text } : d,
                                ),
                              )
                            }
                            placeholder="12"
                            placeholderTextColor={colors.muted}
                            style={styles.input}
                            keyboardType="number-pad"
                          />
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>

              <Text style={[styles.sectionEyebrow, styles.sectionEyebrowSpaced]}>Timing</Text>
              <Text style={styles.sectionTitle}>Availability deadline</Text>
              <Text style={styles.sectionSubtitle}>
                Students can claim this surplus until this window ends.
              </Text>

              <View style={styles.segmentTrack}>
                {availabilityWindows.map((window, index) => {
                  const active = window === availabilityWindow;
                  return (
                    <Pressable
                      key={window}
                      onPress={() => setAvailabilityWindow(window)}
                      style={({ pressed }) => [
                        styles.segmentCell,
                        index < availabilityWindows.length - 1 && styles.segmentCellBorder,
                        active && styles.segmentCellActive,
                        pressed && styles.pressedOpacity,
                      ]}
                    >
                      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{window}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Pickup hold after claim</Text>
              <Text style={styles.sectionSubtitle}>
                After someone claims, TLAC holds their serving for this long.
              </Text>

              <View style={styles.segmentTrack}>
                {pickupWindows.map((window, index) => {
                  const active = window === pickupWindowMinutes;
                  return (
                    <Pressable
                      key={window}
                      onPress={() => setPickupWindowMinutes(window)}
                      style={({ pressed }) => [
                        styles.segmentCell,
                        index < pickupWindows.length - 1 && styles.segmentCellBorder,
                        active && styles.segmentCellActive,
                        pressed && styles.pressedOpacity,
                      ]}
                    >
                      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{window}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Card variant="soft" style={styles.noteCard}>
                <Text style={styles.noteCardKicker}>Pickup note</Text>
                <Text style={styles.noteCardHint}>
                  Neighbors see this note. Be specific about tent color, row, or flag.
                </Text>
                <TextInput
                  value={pickupNote}
                  onChangeText={setPickupNote}
                  placeholder="Pickup instructions"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, styles.noteInput]}
                  multiline
                />
              </Card>

              <Card style={styles.summaryCard} accentColor={colors.gold}>
                <Text style={styles.summaryKicker}>Ready to ship</Text>
                <Text style={styles.summaryTitle}>Publish summary</Text>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Dishes</Text>
                  <Text style={styles.summaryVal}>
                    {selectedDrafts.length} item{selectedDrafts.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Total servings</Text>
                  <Text style={styles.summaryVal}>{totalServingsSelected}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Available until</Text>
                  <Text style={styles.summaryVal}>{availabilityWindow}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Pickup hold</Text>
                  <Text style={styles.summaryVal}>{pickupWindowMinutes}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Tailgate</Text>
                  <Text style={styles.summaryVal} numberOfLines={2}>
                    {selectedHostTailgate.groupName}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Note</Text>
                  <Text style={styles.summaryValMuted} numberOfLines={3}>
                    {notePreview}
                  </Text>
                </View>
              </Card>

              {validationMessage ? (
                <Card variant="soft" accentColor={colors.navy}>
                  <View style={styles.inlineAlertRow}>
                    <Ionicons name="alert-circle-outline" size={22} color={colors.goldLight} />
                    <Text style={styles.validationText}>{validationMessage}</Text>
                  </View>
                </Card>
              ) : null}

              {publishError ? (
                <Card variant="soft" accentColor={colors.navy}>
                  <View style={styles.inlineAlertRow}>
                    <Ionicons name="warning-outline" size={22} color={colors.goldLight} />
                    <Text style={styles.publishErrorText}>{messageFromUnknownError(publishError, 'Could not publish surplus.')}</Text>
                  </View>
                </Card>
              ) : null}

              <View style={styles.ctaStack}>
                <PrimaryButton
                  label={isPublishing ? 'Publishing…' : 'Publish surplus'}
                  onPress={() => void handlePublish()}
                  disabled={blockPublish}
                />
              </View>
            </>
          ) : null}
        </>
      ) : null}

      <SecondaryButton label="Back to dashboard" onPress={() => router.push('/dashboard')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    gap: spacing.md,
    borderColor: colors.border,
  },
  heroKicker: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  heroLead: {
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '600',
    lineHeight: 23,
  },
  gameContext: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameContextIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameContextCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  gameContextLabel: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  gameContextTitle: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '800',
  },
  gameContextMeta: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '600',
    lineHeight: 18,
  },
  gameContextMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameContextMutedText: {
    flex: 1,
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '600',
    lineHeight: 22,
  },
  heroStatStack: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  heroStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    width: '100%',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  heroStatRowEmphasized: {
    borderColor: colors.gold,
    backgroundColor: colors.surfaceSoft,
  },
  heroStatTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  heroStatLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  heroStatHint: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
  heroStatValue: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '900',
    minWidth: 56,
    textAlign: 'right',
  },
  sectionEyebrow: {
    marginTop: spacing.xs,
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.55,
  },
  sectionEyebrowSpaced: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  sectionTitleSpaced: {
    marginTop: spacing.lg,
  },
  sectionSubtitle: {
    marginTop: spacing.xs,
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '600',
    lineHeight: 22,
  },
  tailgateScroll: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  tailgatePickWrap: {
    width: 220,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
  },
  tailgatePickWrapSelected: {
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  tailgatePickImage: {
    height: 148,
    justifyContent: 'flex-end',
  },
  tailgatePickImageRadius: {
    borderRadius: radii.lg,
  },
  tailgatePickDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 11, 21, 0.55)',
  },
  tailgatePickBody: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  tailgatePickBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  tailgatePickName: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tailgatePickMeta: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: typography.caption,
    fontWeight: '600',
    lineHeight: 18,
  },
  singleTailgateCard: {
    overflow: 'hidden',
    borderRadius: radii.lg,
    borderColor: colors.border,
  },
  singleTailgateHero: {
    minHeight: 140,
    justifyContent: 'flex-end',
  },
  singleTailgateInner: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  singleTailgateLocRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  singleTailgateLoc: {
    flex: 1,
    color: 'rgba(255,255,255,0.9)',
    fontSize: typography.body,
    fontWeight: '600',
    lineHeight: 22,
  },
  foodList: {
    gap: spacing.sm,
  },
  foodRowCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  foodRowCardIdle: {
    borderColor: colors.border,
  },
  foodRowCardSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.surfaceSoft,
  },
  foodRowHit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  foodRowThumb: {
    width: 54,
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cream,
  },
  foodRowThumbFallback: {
    width: 54,
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodRowText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  foodRowName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
    lineHeight: 22,
  },
  foodRowPrepared: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  foodRowStatusOff: {
    marginTop: 2,
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  foodRowStatusOn: {
    marginTop: 2,
    color: colors.gold,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  foodRowCheck: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: spacing.xs,
  },
  foodRowServings: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputLabel: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '800',
    paddingBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  noteCard: {
    gap: spacing.sm,
    borderColor: colors.border,
  },
  noteCardKicker: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteCardHint: {
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '600',
    lineHeight: 22,
  },
  noteInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    marginTop: spacing.xs,
  },
  segmentTrack: {
    flexDirection: 'row',
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  segmentCell: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  segmentCellBorder: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  segmentCellActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.18)',
  },
  segmentLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  segmentLabelActive: {
    color: colors.goldLight,
  },
  summaryCard: {
    gap: 0,
    borderColor: '#E3D5A6',
  },
  summaryKicker: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryTitle: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  summaryKey: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    minWidth: 88,
  },
  summaryVal: {
    flex: 1,
    textAlign: 'right',
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  summaryValMuted: {
    flex: 1,
    textAlign: 'right',
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '600',
    lineHeight: 22,
  },
  validationText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
    lineHeight: 22,
  },
  publishErrorText: {
    flex: 1,
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  inlineAlertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  ctaStack: {
    gap: spacing.sm,
    marginTop: spacing.sm,
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
    gap: spacing.md,
  },
  loadingHint: {
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: '600',
  },
  stateIconWrap: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stateTitle: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  pressedOpacity: {
    opacity: 0.92,
  },
});
