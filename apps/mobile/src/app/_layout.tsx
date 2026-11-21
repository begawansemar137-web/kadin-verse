import { Stack } from 'expo-router';

import { SessionProvider } from '@/features/auth/session-context';
import { copy } from '@/shared/copy/id';

/** Ensures a cold deep link (e.g. /news/abc) still has the tabs underneath to go back to. */
export const unstable_settings = { initialRouteName: '(tabs)' };

const RootLayout = () => (
  <SessionProvider>
    <Stack screenOptions={{ headerBackTitle: copy.common.back }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="news/[id]" options={{ title: copy.news.detailTitle }} />
      <Stack.Screen name="card" options={{ title: copy.card.title }} />
      <Stack.Screen name="sign-in" options={{ title: copy.signIn.title }} />
    </Stack>
  </SessionProvider>
);

export default RootLayout;
