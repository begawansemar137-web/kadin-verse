type MockAuthInputs = { isDev: boolean; env: string | undefined };

/**
 * Demo sign-in is on in development builds only. A non-dev demo build must opt in explicitly
 * with EXPO_PUBLIC_MOCK_AUTH=true; any other value (or none) keeps it off in release builds.
 */
export const resolveMockAuth = ({ isDev, env }: MockAuthInputs): boolean =>
  isDev || env === 'true';

/** Feature flags for unapproved integrations (SPEC-004 §3). */
export const flags = {
  // Accessed as a literal `process.env.EXPO_PUBLIC_*` so Expo inlines it at bundle time.
  mockAuth: resolveMockAuth({ isDev: __DEV__, env: process.env.EXPO_PUBLIC_MOCK_AUTH }),
} as const;
