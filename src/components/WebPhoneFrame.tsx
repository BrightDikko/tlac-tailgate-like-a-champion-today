import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { colors } from '../theme/colors';

type WebPhoneFrameProps = {
  children: ReactNode;
};

export function WebPhoneFrame({ children }: WebPhoneFrameProps) {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View style={styles.webRoot}>
      <View style={styles.phoneShadow}>
        <View style={styles.phoneFrame}>
          <View style={styles.appSurface}>{children}</View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    width: '100%',
    minHeight: '100vh' as unknown as number,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy900,
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 16,
    boxSizing: 'border-box' as never,
  },
  phoneShadow: {
    width: '100%',
    maxWidth: 430,
    height: 932,
    maxHeight: 'calc(100vh - 64px)' as unknown as number,
    minHeight: 720,
    borderRadius: 44,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  phoneFrame: {
    flex: 1,
    borderRadius: 44,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
  },
  appSurface: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
  },
});
