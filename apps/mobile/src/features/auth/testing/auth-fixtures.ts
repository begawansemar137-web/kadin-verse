import { createFakeAuthProvider, FAKE_USER, type FakeAuthProvider } from '../data/fake-auth-provider';
import { createMemoryCredentialStore } from '../data/memory-credential-store';
import { createAuthService, type AuthService } from '../domain/auth-service';
import type { CredentialStore } from '../domain/credential-store';
import { serializeStoredSession, type Credentials } from '../domain/credentials';

/** Test-only helpers. Never import from app code. */
export const FIXED_NOW = Date.UTC(2026, 10, 22, 9, 0, 0);

export const seededSession = (overrides: Partial<Credentials> = {}): string =>
  serializeStoredSession({
    credentials: {
      accessToken: 'fake-access-seed',
      refreshToken: 'fake-refresh-seed',
      expiresAt: FIXED_NOW + 60 * 60_000,
      ...overrides,
    },
    user: FAKE_USER,
  });

type TestAuthOptions = {
  signedIn?: boolean;
  provider?: FakeAuthProvider | null;
  store?: CredentialStore;
  now?: () => number;
};

export const createTestAuthService = ({
  signedIn = false,
  now = () => FIXED_NOW,
  provider = createFakeAuthProvider({ now }),
  store = createMemoryCredentialStore(signedIn ? seededSession() : null),
}: TestAuthOptions = {}): AuthService => createAuthService({ provider, store, now });
