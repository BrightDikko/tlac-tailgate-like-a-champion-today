import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  useGetMenuByTailgateIdQuery,
  useCreateMenuItemMutation,
  useDeleteMenuItemMutation,
  useUpdateMenuItemMutation,
} from '@/src/api/endpoints/menuApi';
import { useGetTailgateByIdQuery, useUpdateTailgateMutation } from '@/src/api/endpoints/tailgatesApi';
import { Card, FilterChip, PrimaryButton, Screen, SecondaryButton, SectionHeader } from '@/src/components';
import { selectIsAuthenticated } from '@/src/features/auth/authSelectors';
import { useAppSelector } from '@/src/redux/hooks';
import { API_MODE } from '@/src/services/config/env';
import type { FoodCategory, FoodItem, TailgateStatus } from '@/src/types';
import { colors } from '@/src/theme/colors';
import { radii } from '@/src/theme/radii';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import { isNotFoundError, messageFromUnknownError } from '@/src/utils/errorMessage';
import {
  CATEGORY_OPTIONS,
  FOOD_IMAGE_KEYS,
  FOOD_IMAGE_LABELS,
  foodThumbSource,
  labelFromKey,
  TAILGATE_IMAGE_KEYS,
  TAILGATE_IMAGE_LABELS,
  tailgatePreviewSource,
  validateMenuItemFields,
} from '@/src/utils/hostTailgateForm';
import { paramOne } from '@/src/utils/routeParams';

const STATUS_OPTIONS: TailgateStatus[] = ['planned', 'active', 'completed'];

export default function EditTailgateScreen() {
  const params = useLocalSearchParams<{ tailgateId?: string | string[] }>();
  const tailgateId = paramOne(params.tailgateId);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const remoteActionsLocked = API_MODE === 'remote' && !isAuthenticated;

  const {
    data: tailgate,
    isLoading: tailgateLoading,
    isError: tailgateError,
    error: tailgateErr,
    refetch: refetchTailgate,
  } = useGetTailgateByIdQuery(tailgateId ?? '', { skip: !tailgateId });

  const {
    data: menuResponse,
    isLoading: menuLoading,
    isError: menuError,
    error: menuErr,
    refetch: refetchMenu,
  } = useGetMenuByTailgateIdQuery({ tailgateId: tailgateId ?? '' }, { skip: !tailgateId });

  const [updateTailgate, { isLoading: isSaving, error: saveError, reset: resetSaveError }] =
    useUpdateTailgateMutation();

  const [createMenuItem, { isLoading: isCreatingMenu, error: createMenuErr, reset: resetCreateMenuErr }] =
    useCreateMenuItemMutation();

  const [updateMenuItem, { isLoading: isUpdatingMenu, error: updateMenuErr, reset: resetUpdateMenuErr }] =
    useUpdateMenuItemMutation();

  const [deleteMenuItem, { isLoading: isDeletingMenu, error: deleteMenuErr, reset: resetDeleteMenuErr }] =
    useDeleteMenuItemMutation();

  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState('');
  const [hostName, setHostName] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TailgateStatus>('planned');
  const [initializedForId, setInitializedForId] = useState<string | undefined>(undefined);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [menuItemName, setMenuItemName] = useState('');
  const [menuItemDescription, setMenuItemDescription] = useState('');
  const [menuItemQty, setMenuItemQty] = useState('1');
  const [menuItemCategory, setMenuItemCategory] = useState<FoodCategory | null>(null);
  const [editingMenuItemId, setEditingMenuItemId] = useState<string | null>(null);
  const [menuFieldError, setMenuFieldError] = useState<string | null>(null);
  const [tailgateImageKey, setTailgateImageKey] = useState<string | undefined>(undefined);
  const [menuFoodImageKey, setMenuFoodImageKey] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (tailgate === undefined) return;
    if (initializedForId === tailgate.id) return;
    setGroupName(tailgate.groupName);
    setGroupType(tailgate.groupType);
    setHostName(tailgate.hostName);
    setLocationDetail(tailgate.locationDetail);
    setDescription(tailgate.description);
    setStatus(tailgate.status);
    setTailgateImageKey(tailgate.imageKey);
    setInitializedForId(tailgate.id);
  }, [tailgate, initializedForId]);

  const menuItems = menuResponse?.data ?? [];
  const menuBusy = isCreatingMenu || isUpdatingMenu || isDeletingMenu;
  const mutationsLocked = remoteActionsLocked;
  const menuMutationErrCombined = createMenuErr ?? updateMenuErr ?? deleteMenuErr;
  const menuMutationBanner =
    menuMutationErrCombined !== undefined
      ? messageFromUnknownError(menuMutationErrCombined, 'Could not update.')
      : null;

  const resetMenuForm = () => {
    setMenuItemName('');
    setMenuItemDescription('');
    setMenuItemQty('1');
    setMenuItemCategory(null);
    setMenuFoodImageKey(undefined);
    setEditingMenuItemId(null);
    setMenuFieldError(null);
    resetCreateMenuErr();
    resetUpdateMenuErr();
    resetDeleteMenuErr();
  };

  const handleSaveTailgate = async () => {
    if (remoteActionsLocked) return;
    if (tailgateId === undefined) return;
    resetSaveError();
    setValidationError(null);
    if (groupName.trim() === '' || hostName.trim() === '' || locationDetail.trim() === '' || description.trim() === '') {
      setValidationError('Group name, host, location, and description are required.');
      return;
    }

    try {
      await updateTailgate({
        id: tailgateId,
        input: {
          id: tailgateId,
          groupName: groupName.trim(),
          groupType: groupType.trim(),
          hostName: hostName.trim(),
          locationDetail: locationDetail.trim(),
          description: description.trim(),
          status,
          ...(tailgateImageKey !== undefined ? { imageKey: tailgateImageKey } : {}),
        },
      }).unwrap();
      void refetchTailgate();
      router.replace({ pathname: '/tailgate-manage', params: { tailgateId } });
    } catch {
      // surfaced via saveError
    }
  };

  const handleMenuSubmit = async () => {
    if (remoteActionsLocked) return;
    if (tailgateId === undefined) return;
    setMenuFieldError(null);
    resetCreateMenuErr();
    resetUpdateMenuErr();
    resetDeleteMenuErr();

    const err = validateMenuItemFields(menuItemName, menuItemDescription, menuItemQty, menuItemCategory);
    if (err !== null) {
      setMenuFieldError(err);
      return;
    }

    const qty = Number.parseInt(menuItemQty, 10);

    try {
      if (editingMenuItemId !== null) {
        await updateMenuItem({
          id: editingMenuItemId,
          input: {
            id: editingMenuItemId,
            name: menuItemName.trim(),
            category: menuItemCategory!,
            description: menuItemDescription.trim(),
            quantityPrepared: qty,
            ...(menuFoodImageKey !== undefined ? { imageKey: menuFoodImageKey } : {}),
          },
        }).unwrap();
      } else {
        await createMenuItem({
          tailgateId,
          input: {
            tailgateId,
            name: menuItemName.trim(),
            category: menuItemCategory!,
            description: menuItemDescription.trim(),
            quantityPrepared: qty,
            ...(menuFoodImageKey !== undefined ? { imageKey: menuFoodImageKey } : {}),
          },
        }).unwrap();
      }
      resetMenuForm();
      void refetchMenu();
    } catch {
      // surfaced via createMenuErr / updateMenuErr
    }
  };

  const handleEditMenuItem = (item: FoodItem) => {
    setEditingMenuItemId(item.id);
    setMenuItemName(item.name);
    setMenuItemDescription(item.description);
    setMenuItemQty(String(item.quantityPrepared));
    setMenuItemCategory(item.category);
    setMenuFoodImageKey(item.imageKey);
    setMenuFieldError(null);
    resetCreateMenuErr();
    resetUpdateMenuErr();
    resetDeleteMenuErr();
  };

  const handleRequestDeleteMenuItem = (item: FoodItem) => {
    if (remoteActionsLocked) return;
    if (tailgateId === undefined) return;
    Alert.alert(
      'Delete menu item',
      `Remove “${item.name}” from this tailgate menu? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              resetDeleteMenuErr();
              try {
                await deleteMenuItem({ id: item.id, tailgateId }).unwrap();
                if (editingMenuItemId === item.id) {
                  resetMenuForm();
                }
              } catch {
                /* surfaced via deleteMenuErr */
              }
            })();
          },
        },
      ]
    );
  };

  const handleCancelMenuEdit = () => {
    resetMenuForm();
  };

  if (tailgateId === undefined) {
    return (
      <Screen scroll contentContainerStyle={styles.content} safeAreaEdges={['top', 'left', 'right']}>
        <SectionHeader title="Edit tailgate" />
        <Card variant="soft">
          <Text style={styles.muted}>No tailgate selected.</Text>
          <SecondaryButton label="Back to dashboard" onPress={() => router.replace('/dashboard')} style={styles.stackGap} />
        </Card>
      </Screen>
    );
  }

  if (tailgateLoading) {
    return (
      <Screen scroll contentContainerStyle={styles.content} safeAreaEdges={['top', 'left', 'right']}>
        <SectionHeader title="Edit tailgate" />
        <Card variant="soft">
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Loading tailgate" />
          </View>
        </Card>
      </Screen>
    );
  }

  if (tailgateError && isNotFoundError(tailgateErr)) {
    return (
      <Screen scroll contentContainerStyle={styles.content} safeAreaEdges={['top', 'left', 'right']}>
        <SectionHeader title="Edit tailgate" />
        <Card variant="soft">
          <Text style={styles.muted}>Tailgate not found.</Text>
          <SecondaryButton
            label="Back to manage"
            onPress={() => router.replace({ pathname: '/tailgate-manage', params: { tailgateId } })}
            style={styles.stackGap}
          />
        </Card>
      </Screen>
    );
  }

  if (tailgateError) {
    return (
      <Screen scroll contentContainerStyle={styles.content} safeAreaEdges={['top', 'left', 'right']}>
        <SectionHeader title="Edit tailgate" />
        <Card variant="soft">
          <Text style={styles.muted}>{messageFromUnknownError(tailgateErr, 'Could not load tailgate.')}</Text>
          <SecondaryButton label="Try again" onPress={() => void refetchTailgate()} style={styles.stackGap} />
        </Card>
      </Screen>
    );
  }

  if (tailgate === undefined) {
    return (
      <Screen scroll contentContainerStyle={styles.content} safeAreaEdges={['top', 'left', 'right']}>
        <SectionHeader title="Edit tailgate" />
        <Card variant="soft">
          <Text style={styles.muted}>Tailgate not found.</Text>
          <SecondaryButton
            label="Back to manage"
            onPress={() => router.replace({ pathname: '/tailgate-manage', params: { tailgateId } })}
            style={styles.stackGap}
          />
        </Card>
      </Screen>
    );
  }

  const menuPrimaryLabel = editingMenuItemId !== null ? 'Save menu item' : 'Add menu item';

  return (
    <Screen scroll contentContainerStyle={styles.content} safeAreaEdges={['top', 'left', 'right']}>
      <View style={styles.navDock}>
        <SecondaryButton label="Back to dashboard" onPress={() => router.replace('/dashboard')} />
      </View>
      <SectionHeader title="Edit tailgate" subtitle="Update listing details and menu for your group." />

      {mutationsLocked ? (
        <Card variant="soft" accentColor={colors.navy}>
          <Text style={styles.errorText}>Sign in to save changes to this tailgate.</Text>
        </Card>
      ) : null}

      {validationError ? (
        <Card variant="soft">
          <Text style={styles.errorText}>{validationError}</Text>
        </Card>
      ) : null}

      {saveError ? (
        <Card variant="soft">
          <Text style={styles.errorText}>{messageFromUnknownError(saveError, 'Could not update.')}</Text>
        </Card>
      ) : null}

      <Card style={styles.formCard}>
        <Text style={styles.label}>Group name</Text>
        <TextInput
          value={groupName}
          onChangeText={setGroupName}
          placeholder="Group name"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

        <Text style={styles.label}>Group type</Text>
        <TextInput
          value={groupType}
          onChangeText={setGroupType}
          placeholder="Group type"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

        <Text style={styles.label}>Host name</Text>
        <TextInput
          value={hostName}
          onChangeText={setHostName}
          placeholder="Host name"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          value={locationDetail}
          onChangeText={setLocationDetail}
          placeholder="Location"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Description"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.inputMultiline]}
          multiline
        />

        <Text style={styles.label}>Status</Text>
        <View style={styles.statusRow}>
          {STATUS_OPTIONS.map((s) => (
            <FilterChip
              key={s}
              label={s.charAt(0).toUpperCase() + s.slice(1)}
              selected={status === s}
              onPress={() => setStatus(s)}
            />
          ))}
        </View>
      </Card>

      <SectionHeader title="Tailgate photo" subtitle="Preset images for your listing (same as Student / Fan cards)." />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
        <FilterChip
          label="Default listing photo"
          selected={tailgateImageKey === undefined}
          onPress={() => setTailgateImageKey(undefined)}
        />
        {TAILGATE_IMAGE_KEYS.map((k) => (
          <FilterChip
            key={k}
            label={labelFromKey(k, TAILGATE_IMAGE_LABELS)}
            selected={tailgateImageKey === k}
            onPress={() => setTailgateImageKey(k)}
          />
        ))}
      </ScrollView>
      <Card variant="soft" noPadding style={styles.previewCard}>
        <ImageBackground
          source={tailgatePreviewSource(tailgateImageKey)}
          style={styles.heroPreview}
          resizeMode="cover"
        >
          <View style={styles.previewDim} />
        </ImageBackground>
      </Card>

      <PrimaryButton
        label="Save changes"
        onPress={() => void handleSaveTailgate()}
        disabled={isSaving || mutationsLocked}
      />

      <SectionHeader title="Menu" subtitle="Add or update dishes for this tailgate." />

      {menuError ? (
        <Card variant="soft">
          <Text style={styles.errorText}>{messageFromUnknownError(menuErr, 'Could not load tailgate.')}</Text>
          <SecondaryButton label="Try again" onPress={() => void refetchMenu()} style={styles.stackGap} />
        </Card>
      ) : null}

      {menuMutationBanner ? (
        <Card variant="soft">
          <Text style={styles.errorText}>{menuMutationBanner}</Text>
        </Card>
      ) : null}

      {menuFieldError ? (
        <Card variant="soft">
          <Text style={styles.errorText}>{menuFieldError}</Text>
        </Card>
      ) : null}

      {menuLoading && !menuError ? (
        <Card variant="soft">
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={colors.goldLight} accessibilityLabel="Loading menu" />
          </View>
        </Card>
      ) : (
        <>
          {menuItems.map((item) => (
            <Card key={item.id} variant="soft">
              <View style={styles.menuRow}>
                <Image source={foodThumbSource(item.imageKey)} style={styles.menuThumb} resizeMode="cover" />
                <View style={styles.menuTextCol}>
                  <Text style={styles.menuItemTitle}>{item.name}</Text>
                  <Text style={styles.menuItemMeta}>
                    {item.category} · Qty {item.quantityPrepared}
                  </Text>
                  <Text style={styles.menuItemDesc}>{item.description}</Text>
                </View>
              </View>
              <View style={styles.menuItemActions}>
                <SecondaryButton
                  label="Edit"
                  size="md"
                  onPress={() => handleEditMenuItem(item)}
                  disabled={mutationsLocked}
                />
                <SecondaryButton
                  label="Delete"
                  size="md"
                  onPress={() => handleRequestDeleteMenuItem(item)}
                  disabled={menuBusy || mutationsLocked}
                  textStyle={styles.destructiveButtonLabel}
                />
              </View>
            </Card>
          ))}

          <Card style={styles.formCard}>
            <Text style={styles.label}>Item name</Text>
            <TextInput
              value={menuItemName}
              onChangeText={setMenuItemName}
              placeholder="Menu item"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            <Text style={styles.label}>Dish photo</Text>
            <View style={styles.menuPhotoPreviewRow}>
              <Image
                source={foodThumbSource(menuFoodImageKey)}
                resizeMode="cover"
                style={styles.menuPhotoPreview}
                accessibilityLabel="Selected menu item photo preview"
              />
              <View style={styles.menuPhotoPreviewCopy}>
                <Text style={styles.menuPhotoPreviewLabel}>Dish photo</Text>
                <Text style={styles.menuPhotoPreviewText}>
                  {menuFoodImageKey
                    ? labelFromKey(menuFoodImageKey, FOOD_IMAGE_LABELS)
                    : 'Choose a photo to preview this dish.'}
                </Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              <FilterChip
                label="No image"
                selected={menuFoodImageKey === undefined}
                onPress={() => setMenuFoodImageKey(undefined)}
              />
              {FOOD_IMAGE_KEYS.map((k) => (
                <FilterChip
                  key={k}
                  label={labelFromKey(k, FOOD_IMAGE_LABELS)}
                  selected={menuFoodImageKey === k}
                  onPress={() => setMenuFoodImageKey(k)}
                />
              ))}
            </ScrollView>

            <Text style={styles.label}>Category</Text>
            <View style={styles.statusRow}>
              {CATEGORY_OPTIONS.map((c) => (
                <FilterChip
                  key={c.value}
                  label={c.label}
                  selected={menuItemCategory === c.value}
                  onPress={() => setMenuItemCategory(c.value)}
                />
              ))}
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput
              value={menuItemDescription}
              onChangeText={setMenuItemDescription}
              placeholder="Description"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.inputMultiline]}
              multiline
            />

            <Text style={styles.label}>Quantity prepared</Text>
            <TextInput
              value={menuItemQty}
              onChangeText={setMenuItemQty}
              placeholder="12"
              placeholderTextColor={colors.muted}
              style={styles.input}
              keyboardType="number-pad"
            />

            <PrimaryButton
              label={menuPrimaryLabel}
              onPress={() => void handleMenuSubmit()}
              disabled={menuBusy || mutationsLocked}
            />
            {editingMenuItemId !== null ? (
              <SecondaryButton label="Cancel menu edit" onPress={handleCancelMenuEdit} />
            ) : null}
          </Card>
        </>
      )}

      <SecondaryButton
        label="Back to manage"
        onPress={() => router.replace({ pathname: '/tailgate-manage', params: { tailgateId } })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  formCard: {
    gap: spacing.md,
    borderColor: colors.border,
  },
  label: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '800',
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
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  errorText: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  muted: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  stackGap: {
    marginTop: spacing.md,
  },
  loadingBlock: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  menuItemTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  menuItemMeta: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  menuItemActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  destructiveButtonLabel: {
    color: '#B91C1C',
    fontWeight: '800',
  },
  menuItemDesc: {
    color: colors.muted,
    fontSize: typography.body,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  navDock: {
    marginBottom: spacing.sm,
  },
  chipScroll: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  menuPhotoPreviewRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    padding: spacing.md,
  },
  menuPhotoPreview: {
    width: 72,
    height: 72,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cream,
  },
  menuPhotoPreviewCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  menuPhotoPreviewLabel: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuPhotoPreviewText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 22,
  },
  previewCard: {
    overflow: 'hidden',
    borderRadius: radii.lg,
    borderColor: colors.border,
  },
  heroPreview: {
    height: 140,
    width: '100%',
  },
  previewDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  menuRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  menuThumb: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
  },
  menuTextCol: {
    flex: 1,
    minWidth: 0,
  },
});
