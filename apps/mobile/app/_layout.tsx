import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FacadeProvider } from '../src/api/FacadeProvider';

export default function RootLayout() {
  return (
    <FacadeProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </FacadeProvider>
  );
}
