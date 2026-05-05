import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';

import { AuthBootstrap } from '@/src/features/auth/AuthBootstrap';
import { store } from '@/src/redux/store';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AuthBootstrap>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthBootstrap>
      <StatusBar style="light" />
    </Provider>
  );
}