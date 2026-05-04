import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  /** Omit bottom safe inset when this screen sits above a tab bar */
  safeAreaEdges?: Edge[];
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  style,
  contentContainerStyle,
  backgroundColor = colors.background,
  safeAreaEdges,
}: ScreenProps) {
  const paddedStyle = padded ? styles.padded : undefined;
  const safeProps = safeAreaEdges ? { edges: safeAreaEdges } : {};

  if (scroll) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor }, style]} {...safeProps}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, paddedStyle, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }, style]} {...safeProps}>
      <View style={[styles.flex, paddedStyle, contentContainerStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
});
