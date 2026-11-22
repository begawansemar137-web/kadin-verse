type DemoFlagInputs = { isDev: boolean; env: string | undefined };

/**
 * Demo-only behaviour is on in development builds only. A non-dev demo build must opt in explicitly
 * with the flag's EXPO_PUBLIC_* variable set to exactly "true"; any other value keeps it off.
 */
export const resolveDemoFlag = ({ isDev, env }: DemoFlagInputs): boolean => isDev || env === 'true';

/** Same rule as resolveDemoFlag; name kept for the B-002 call sites and tests. */
export const resolveMockAuth = resolveDemoFlag;

/** Feature flags for unapproved integrations (SPEC-004 §3). */
export const flags = {
  // Accessed as literal `process.env.EXPO_PUBLIC_*` so Expo inlines them at bundle time.
  mockAuth: resolveDemoFlag({ isDev: __DEV__, env: process.env.EXPO_PUBLIC_MOCK_AUTH }),
  mockContent: resolveDemoFlag({ isDev: __DEV__, env: process.env.EXPO_PUBLIC_MOCK_CONTENT }),
} as const;
