import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { foodImages, placeholderImages, tailgateImages } from '@/src/assets/images';
import {
  useGetMenuByTailgateIdQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
} from '@/src/api/endpoints/menuApi';
import { useGetTailgateByIdQuery, useUpdateTailgateMutation } from '@/src/api/endpoints/tailgatesApi';
import { Card, FilterChip, PrimaryButton, Screen, SecondaryButton, SectionHeader } from '@/src/components';
import type { FoodCategory, FoodItem, TailgateStatus } from '@/src/types';
import { colors } from '@/src/theme/colors';
import { radii } from '@/src/theme/radii';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

function paramOne(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  const v = Array.isArray(value) ? value[0] : value;
  return v === '' ? undefined : v;
}

const CATEGORY_OPTIONS: { value: FoodCategory; label: string }[] = [
  { value: 'entree', label: 'Entree' },
  { value: 'side', label: 'Side' },
  { value: 'drink', label: 'Drink' },
  { value: 'dessert', label: 'Dessert' },
];

const STATUS_OPTIONS: TailgateStatus[] = ['planned', 'active', 'completed'];

const TAILGATE_IMAGE_KEYS = Object.keys(tailgateImages) as (keyof typeof tailgateImages)[];
const FOOD_IMAGE_KEYS = Object.keys(foodImages) as (keyof typeof foodImages)[];

const TAILGATE_IMAGE_LABELS: Record<string, string> = {
  'domer-grill-crew': 'Domer grill crew',
  'gold-lot-bbq-smoke': 'Gold lot BBQ smoke',
  'irish-veggie-table': 'Irish veggie table',
  'touchdown-taco-cantina': 'Touchdown taco cantina',
  'zahm-dogs-chili': 'Zahm dogs and chili',
};

const FOOD_IMAGE_LABELS: Record<string, string> = {
  'blue-gold-cupcakes': 'Blue and gold cupcakes',
  'domer-smashburgers': 'Domer smashburgers',
  'four-cheese-mac': 'Four-cheese mac',
  'fudge-brownies': 'Fudge brownies',
  'lemonade-and-iced-tea': 'Lemonade and iced tea',
  'roasted-veggie-tacos': 'Roasted veggie tacos',
  'smoked-brisket': 'Smoked brisket',
  'smoked-wings': 'Smoked wings',
  'stadium-brats': 'Stadium brats',
};

function sentenceCase(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function labelFromKey(key: string, labels?: Record<string, string>): string {
  return labels?.[key] ?? sentenceCase(key.replace(/-/g, ' '));
}

function tailgatePreviewSource(key: string | undefined): ImageSourcePropType {
  if (key !== undefined && key in tailgateImages) {
    return tailgateImages[key as keyof typeof tailgateImages];
  }
  return placeholderImages.tailgate;
}

function foodThumbSource(key: string | undefined): ImageSourcePropType {
  if (key !== undefined && key in foodImages) {
    return foodImages[key as keyof typeof foodImages];
  }
  return placeholderImages.emptyVenue;
}

function mutationErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const d = (err as { data: unknown }).data;
    if (d && typeof d === 'object' && d !== null && 'message' in d) {
      return String((d as { message: string }).message);
    }
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return 'Could not update.';
}

function manageErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const d = (err as { data: unknown }).data;
    if (d && typeof d === 'object' && d !== null && 'message' in d) {
      return String((d as { message: string }).message);
    }
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return 'Could not load tailgate.';
}

function isNotFoundError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'data' in err) {
    const d = (err as { data: unknown }).data;
    if (d && typeof d === 'object' && d !== null) {
      if ('code' in d && (d as { code?: string }).code === 'NOT_FOUND') return true;
      const msg = 'message' in d ? String((d as { message: string }).message).toLowerCase() : '';
      if (msg.includes('not found')) return true;
    }
  }
  return false;
}

function validateMenuFields(name: string, description: string, qtyRaw: string, category: FoodCategory | null) {
  if (name.trim() === '') return 'Menu item name is required.';
  if (description.trim() === '') return 'Menu description is required.';
  if (category === null) return 'Pick a category.';
  const q = Number.parseInt(qtyRaw, 10);
  if (!Number.isFinite(q) || q < 1) return 'Quantity must be a positive integer.';
  return null;
}

export default function EditTailgateScreen() {
  const params = useLocalSearchParams<{ tailgateId?: string | string[] }>();
  const tailgateId = paramOne(params.tailgateId);

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
  const menuBusy = isCreatingMenu || isUpdatingMenu;
  const menuMutationErrCombined = createMenuErr ?? updateMenuErr;
  const menuMutationBanner =
    menuMutationErrCombined !== undefined ? mutationErrorMessage(menuMutationErrCombined) : null;

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
  };

  const handleSaveTailgate = async () => {
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
    if (tailgateId === undefined) return;
    setMenuFieldError(null);
    resetCreateMenuErr();
    resetUpdateMenuErr();

    const err = validateMenuFields(menuItemName, menuItemDescription, menuItemQty, menuItemCategory);
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
          <Text style={styles.muted}>{manageErrorMessage(tailgateErr)}</Text>
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

      {validationError ? (
        <Card variant="soft">
          <Text style={styles.errorText}>{validationError}</Text>
        </Card>
      ) : null}

      {saveError ? (
        <Card variant="soft">
          <Text style={styles.errorText}>{mutationErrorMessage(saveError)}</Text>
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

      <PrimaryButton label="Save changes" onPress={() => void handleSaveTailgate()} disabled={isSaving} />

      <SectionHeader title="Menu" subtitle="Add or update dishes for this tailgate." />

      {menuError ? (
        <Card variant="soft">
          <Text style={styles.errorText}>{manageErrorMessage(menuErr)}</Text>
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
              <SecondaryButton label="Edit" onPress={() => handleEditMenuItem(item)} />
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
              disabled={menuBusy}
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
