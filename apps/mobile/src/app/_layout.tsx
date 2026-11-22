import { Stack, type ErrorBoundaryProps } from 'expo-router';

import { SessionProvider } from '@/features/auth/session-context';
import { NewsSourceProvider } from '@/features/news/news-source-context';
import { copy } from '@/shared/copy/id';
import { AppErrorFallback } from '@/shared/ui/AppErrorFallback';

/** Ensures a cold deep link (e.g. /news/abc) still has the tabs underneath to go back to. */
export const unstable_settings = { initialRouteName: '(tabs)' };

const RootLayout = () => (
  <SessionProvider>
    <NewsSourceProvider>
      <Stack screenOptions={{ headerBackTitle: copy.common.back }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="news/[id]" options={{ title: copy.news.detailTitle }} />
        <Stack.Screen name="card" options={{ title: copy.card.title }} />
        <Stack.Screen name="sign-in" options={{ title: copy.signIn.title }} />
      </Stack>
    </NewsSourceProvider>
  </SessionProvider>
);

/**
 * App-wide error boundary: any uncaught render error below the root layout shows a safe,
 * retryable message instead of a blank screen. The raw error is never rendered; crash
 * reporting is B-008 (telemetry) and needs privacy approval first.
 */
export const ErrorBoundary = ({ retry }: ErrorBoundaryProps) => <AppErrorFallback onRetry={retry} />;

export default RootLayout;
