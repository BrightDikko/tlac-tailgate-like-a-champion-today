import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';

import { WebPhoneFrame } from '@/src/components';
import { AuthBootstrap } from '@/src/features/auth/AuthBootstrap';
import { store } from '@/src/redux/store';

import './global.css';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AuthBootstrap>
        <WebPhoneFrame>
          <Stack screenOptions={{ headerShown: false }} />
        </WebPhoneFrame>
      </AuthBootstrap>
      <StatusBar style="light" />
    </Provider>
  );
}