// import { Stack } from 'expo-router';
import { Slot } from 'expo-router';
import { AppProvider } from '../contexts/AppContext';
import '../global.css';

export default function RootLayout() {
  return (
    <AppProvider>
      <Slot />
      {/* <Stack>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="(example-code)/nav" options={{ title: 'Nav' }} />
        <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
      </Stack> */}
    </AppProvider>
  );
}
