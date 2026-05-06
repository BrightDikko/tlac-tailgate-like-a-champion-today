import type { ReactNode } from 'react';
import { ImageBackground, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';

import { placeImages } from '../assets/images';
import { colors } from '../theme/colors';

type WebPhoneFrameProps = {
  children: ReactNode;
};

export function WebPhoneFrame({ children }: WebPhoneFrameProps) {
  const { width } = useWindowDimensions();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const shouldUsePhoneFrame = width >= 460;

  if (!shouldUsePhoneFrame) {
    return <View style={styles.mobileWebRoot}>{children}</View>;
  }

  return (
    <ImageBackground
      source={placeImages['notre-dame-stadium']}
      resizeMode="cover"
      style={styles.webRoot}
      imageStyle={styles.webBackgroundImage}
    >
      <View style={styles.baseOverlay} />
      <View style={styles.tintOverlay} />
      <View style={styles.phoneShadow}>
        <View style={styles.phoneFrame}>
          <View style={styles.appSurface}>{children}</View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  mobileWebRoot: {
    flex: 1,
    width: '100%',
    minHeight: '100vh' as unknown as number,
    backgroundColor: colors.navy900,
    paddingTop: 12,
    paddingBottom: 12,
  },
  webRoot: {
    flex: 1,
    width: '100%',
    height: '100vh' as unknown as number,
    minHeight: '100vh' as unknown as number,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy900,
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 16,
    boxSizing: 'border-box' as never,
    overflow: 'hidden',
  },
  webBackgroundImage: {
    opacity: 0.40,
  },
  baseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 9, 20, 0.72)',
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 20, 33, 0.28)',
  },
  phoneShadow: {
    width: '100%',
    maxWidth: 430,
    height: 932,
    maxHeight: 'calc(100vh - 64px)' as unknown as number,
    minHeight: 720,
    borderRadius: 44,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 8 },
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
