import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
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
import { useGetMeQuery } from '@/src/api/endpoints/authApi';
import { useCreateMenuItemMutation } from '@/src/api/endpoints/menuApi';
import { useCreateTailgateMutation } from '@/src/api/endpoints/tailgatesApi';
import { Card, FilterChip, PrimaryButton, Screen, SecondaryButton, SectionHeader } from '@/src/components';
import type { CreateTailgateInput, FoodCategory, TailgateStatus } from '@/src/types';
import { colors } from '@/src/theme/colors';
import { radii } from '@/src/theme/radii';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

const CATEGORY_OPTIONS: { value: FoodCategory; label: string }[] = [
  { value: 'entree', label: 'Entree' },
  { value: 'side', label: 'Side' },
  { value: 'drink', label: 'Drink' },
  { value: 'dessert', label: 'Dessert' },
];

type DraftMenuItem = {
  localId: string;
  name: string;
  category: FoodCategory;
  description: string;
  quantityPrepared: number;
  imageKey?: string;
};

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

function newLocalId(): string {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
  return 'Could not create tailgate.';
}

function deriveAvatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]!.slice(0, 1) + parts[1]!.slice(0, 1)).toUpperCase();
  }
  const s = name.trim();
  if (s.length >= 2) return s.slice(0, 2).toUpperCase();
  if (s.length === 1) return s.toUpperCase();
  return 'TL';
}

function validateDraftMenuFields(name: string, description: string, qtyRaw: string, category: FoodCategory | null) {
  if (name.trim() === '') return 'Menu item name is required.';
  if (description.trim() === '') return 'Menu description is required.';
  if (category === null) return 'Pick a category.';
  const q = Number.parseInt(qtyRaw, 10);
  if (!Number.isFinite(q) || q < 1) return 'Quantity must be a positive integer.';
  return null;
}

export default function CreateTailgateScreen() {
  const {
    data: currentUser,
    isLoading: meLoading,
    isError: meError,
    error: meErr,
  } = useGetMeQuery();

  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState('');
  const [hostName, setHostName] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [description, setDescription] = useState('');
  const [status] = useState<TailgateStatus>('planned');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [menuFormName, setMenuFormName] = useState('');
  const [menuFormDescription, setMenuFormDescription] = useState('');
  const [menuFormQty, setMenuFormQty] = useState('1');
  const [menuFormCategory, setMenuFormCategory] = useState<FoodCategory | null>(null);
  const [draftMenuItems, setDraftMenuItems] = useState<DraftMenuItem[]>([]);
  const [editingDraftIndex, setEditingDraftIndex] = useState<number | null>(null);
  const [menuBatchError, setMenuBatchError] = useState<string | null>(null);
  const [stuckTailgateId, setStuckTailgateId] = useState<string | null>(null);
  const [tailgateImageKey, setTailgateImageKey] = useState<string | undefined>(undefined);
  const [menuFoodImageKey, setMenuFoodImageKey] = useState<string | undefined>(undefined);

  const [createTailgate, { isLoading: isCreatingTailgate, error: createError, reset: resetCreateError }] =
    useCreateTailgateMutation();
  const [createMenuItem, { isLoading: isCreatingMenuItem, error: menuItemError, reset: resetMenuItemError }] =
    useCreateMenuItemMutation();

  useEffect(() => {
    if (currentUser === undefined) return;
    setHostName((prev) => {
      if (prev.trim() !== '') return prev;
      return (
        currentUser.displayName?.trim() || `${currentUser.firstName} ${currentUser.lastName}`.trim() || prev
      );
    });
  }, [currentUser]);

  const resetMenuForm = () => {
    setMenuFormName('');
    setMenuFormDescription('');
    setMenuFormQty('1');
    setMenuFormCategory(null);
    setMenuFoodImageKey(undefined);
    setEditingDraftIndex(null);
  };

  const handleAddOrSaveDraft = () => {
    setValidationError(null);
    const err = validateDraftMenuFields(menuFormName, menuFormDescription, menuFormQty, menuFormCategory);
    if (err !== null) {
      setValidationError(err);
      return;
    }
    const qty = Number.parseInt(menuFormQty, 10);
    if (editingDraftIndex !== null) {
      setDraftMenuItems((list) => {
        const next = [...list];
        const cur = next[editingDraftIndex];
        if (cur === undefined) return list;
        next[editingDraftIndex] = {
          ...cur,
          name: menuFormName.trim(),
          description: menuFormDescription.trim(),
          category: menuFormCategory!,
          quantityPrepared: qty,
          imageKey: menuFoodImageKey,
        };
        return next;
      });
    } else {
      setDraftMenuItems((list) => [
        ...list,
        {
          localId: newLocalId(),
          name: menuFormName.trim(),
          category: menuFormCategory!,
          description: menuFormDescription.trim(),
          quantityPrepared: qty,
          imageKey: menuFoodImageKey,
        },
      ]);
    }
    resetMenuForm();
  };

  const handleEditDraft = (index: number) => {
    const item = draftMenuItems[index];
    if (item === undefined) return;
    setEditingDraftIndex(index);
    setMenuFormName(item.name);
    setMenuFormDescription(item.description);
    setMenuFormQty(String(item.quantityPrepared));
    setMenuFormCategory(item.category);
    setMenuFoodImageKey(item.imageKey);
  };

  const handleRemoveDraft = (index: number) => {
    setDraftMenuItems((list) => list.filter((_, i) => i !== index));
    if (editingDraftIndex === index) resetMenuForm();
  };

  const handleCancelDraftEdit = () => {
    resetMenuForm();
  };

  const handleCreate = async () => {
    resetCreateError();
    resetMenuItemError();
    setValidationError(null);
    setMenuBatchError(null);
    setStuckTailgateId(null);

    if (currentUser?.id === undefined) {
      setValidationError('You must be signed in to create a tailgate.');
      return;
    }

    if (groupName.trim() === '' || hostName.trim() === '' || locationDetail.trim() === '' || description.trim() === '') {
      setValidationError('Group name, host, location, and description are required.');
      return;
    }

    const baseName = hostName.trim() || groupName.trim();
    const input: CreateTailgateInput = {
      groupName: groupName.trim(),
      groupType: groupType.trim() || 'Host tailgate',
      hostName: hostName.trim(),
      locationDetail: locationDetail.trim(),
      description: description.trim(),
      status,
      attendeeEstimate: 0,
      tags: [],
      featuredMenuItems: [],
      campusZone: '',
      servingWindow: '',
      imageTone: 'stadium',
      avatarInitials: deriveAvatarInitials(baseName),
      hostUserId: currentUser.id,
      createdByUserId: currentUser.id,
      ...(tailgateImageKey !== undefined ? { imageKey: tailgateImageKey } : {}),
    };

    let createdId: string;
    try {
      const created = await createTailgate(input).unwrap();
      createdId = created.id;
    } catch {
      return;
    }

    if (draftMenuItems.length === 0) {
      router.push({ pathname: '/tailgate-manage', params: { tailgateId: createdId } });
      return;
    }

    try {
      for (const d of draftMenuItems) {
        await createMenuItem({
          tailgateId: createdId,
          input: {
            tailgateId: createdId,
            name: d.name,
            category: d.category,
            description: d.description,
            quantityPrepared: d.quantityPrepared,
            ...(d.imageKey !== undefined ? { imageKey: d.imageKey } : {}),
          },
        }).unwrap();
      }
      router.push({ pathname: '/tailgate-manage', params: { tailgateId: createdId } });
    } catch {
      setStuckTailgateId(createdId);
      setMenuBatchError(
        'Your tailgate was created, but one or more menu items could not be saved. You can add them from Manage.'
      );
    }
  };

  const createDisabled =
    !currentUser?.id ||
    meLoading ||
    meError ||
    isCreatingTailgate ||
    isCreatingMenuItem;

  const createLabel =
    isCreatingTailgate || isCreatingMenuItem ? 'Creating…' : 'Create tailgate';

  const draftActionLabel = editingDraftIndex !== null ? 'Save menu item' : 'Add menu item';

  return (
    <Screen scroll contentContainerStyle={styles.content} safeAreaEdges={['top', 'left', 'right']}>
      <View style={styles.navDock}>
        <SecondaryButton label="Back to dashboard" onPress={() => router.replace('/dashboard')} />
      </View>
      <SectionHeader title="Create tailgate" subtitle="Set up a group listing for gameday." />

      {meError ? (
        <Card variant="soft">
          <Text style={styles.errorText}>{mutationErrorMessage(meErr)}</Text>
        </Card>
      ) : null}

      <Card variant="soft">
        <Text style={styles.noteCopy}>
          This creates a host listing for Bright Dikko. You can still browse other tailgates as Student / Fan.
        </Text>
      </Card>

      {validationError ? (
        <Card variant="soft">
          <Text style={styles.errorText}>{validationError}</Text>
        </Card>
      ) : null}

      {createError ? (
        <Card variant="soft">
          <Text style={styles.errorText}>{mutationErrorMessage(createError)}</Text>
        </Card>
      ) : null}

      {menuItemError && !menuBatchError ? (
        <Card variant="soft">
          <Text style={styles.errorText}>{mutationErrorMessage(menuItemError)}</Text>
        </Card>
      ) : null}

      {menuBatchError ? (
        <Card variant="soft">
          <Text style={styles.errorText}>{menuBatchError}</Text>
          {stuckTailgateId ? (
            <PrimaryButton
              label="Open tailgate manage"
              onPress={() =>
                router.push({ pathname: '/tailgate-manage', params: { tailgateId: stuckTailgateId } })
              }
              style={styles.stackGap}
            />
          ) : null}
        </Card>
      ) : null}

      <Card style={styles.formCard}>
        <Text style={styles.label}>Group name</Text>
        <TextInput
          value={groupName}
          onChangeText={setGroupName}
          placeholder="Domer Grill Crew"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

        <Text style={styles.label}>Group type</Text>
        <TextInput
          value={groupType}
          onChangeText={setGroupType}
          placeholder="Alumni chapter"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

        <Text style={styles.label}>Host name</Text>
        <TextInput
          value={hostName}
          onChangeText={setHostName}
          placeholder="Primary host"
          placeholderTextColor={colors.muted}
          style={styles.input}
          editable={!meLoading}
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          value={locationDetail}
          onChangeText={setLocationDetail}
          placeholder="Lot B, blue tent"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What makes your tailgate special?"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.inputMultiline]}
          multiline
        />
      </Card>

      <SectionHeader title="Tailgate photo" subtitle="Choose a preset hero image for cards and discovery." />
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

      <SectionHeader
        title="Menu items"
        subtitle="Optional — add dishes now or later from the tailgate manage screen."
      />
      <Text style={styles.summaryLine}>
        {draftMenuItems.length} menu item(s) will be added after the tailgate is created.
      </Text>

      <Card style={styles.formCard}>
        <Text style={styles.label}>Item name</Text>
        <TextInput
          value={menuFormName}
          onChangeText={setMenuFormName}
          placeholder="Grilled chicken sliders"
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
        <View style={styles.chipRow}>
          {CATEGORY_OPTIONS.map((c) => (
            <FilterChip
              key={c.value}
              label={c.label}
              selected={menuFormCategory === c.value}
              onPress={() => setMenuFormCategory(c.value)}
            />
          ))}
        </View>

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={menuFormDescription}
          onChangeText={setMenuFormDescription}
          placeholder="How it's prepared"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.inputMultiline]}
          multiline
        />

        <Text style={styles.label}>Quantity prepared</Text>
        <TextInput
          value={menuFormQty}
          onChangeText={setMenuFormQty}
          placeholder="12"
          placeholderTextColor={colors.muted}
          style={styles.input}
          keyboardType="number-pad"
        />

        <PrimaryButton label={draftActionLabel} onPress={handleAddOrSaveDraft} />
        {editingDraftIndex !== null ? (
          <SecondaryButton label="Cancel edit" onPress={handleCancelDraftEdit} />
        ) : null}
      </Card>

      {draftMenuItems.length > 0 ? (
        <View style={styles.draftList}>
          {draftMenuItems.map((item, index) => (
            <Card key={item.localId} variant="soft">
              <View style={styles.draftRow}>
                <Image source={foodThumbSource(item.imageKey)} style={styles.draftThumb} resizeMode="cover" />
                <View style={styles.draftTextCol}>
                  <Text style={styles.draftName}>{item.name}</Text>
                  <Text style={styles.draftMeta}>
                    {item.category} · Qty {item.quantityPrepared}
                  </Text>
                  <Text style={styles.draftDesc}>{item.description}</Text>
                </View>
              </View>
              <View style={styles.draftActions}>
                <SecondaryButton label="Edit" onPress={() => handleEditDraft(index)} />
                <SecondaryButton label="Remove" onPress={() => handleRemoveDraft(index)} />
              </View>
            </Card>
          ))}
        </View>
      ) : null}

      <PrimaryButton label={createLabel} onPress={() => void handleCreate()} disabled={createDisabled} />
      <SecondaryButton label="Back to dashboard" onPress={() => router.replace('/dashboard')} />
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  errorText: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  noteCopy: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  summaryLine: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  draftList: {
    gap: spacing.sm,
  },
  draftName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  draftMeta: {
    color: colors.goldLight,
    fontSize: typography.caption,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  draftDesc: {
    color: colors.muted,
    fontSize: typography.body,
    marginTop: spacing.xs,
  },
  draftActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  stackGap: {
    marginTop: spacing.md,
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
  draftRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  draftThumb: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
  },
  draftTextCol: {
    flex: 1,
    minWidth: 0,
  },
});
