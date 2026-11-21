import { flags } from '@/shared/config/flags';

import { createFakeAuthProvider } from './data/fake-auth-provider';
import { createSecureCredentialStore } from './data/secure-credential-store';
import { createAuthService, type AuthService } from './domain/auth-service';

/** App wiring (ADR-003 §6): fake provider only for dev/preview builds; no provider otherwise. */
export const createDefaultAuthService = ({ mockAuth = flags.mockAuth }: { mockAuth?: boolean } = {}): AuthService =>
  createAuthService({
    provider: mockAuth ? createFakeAuthProvider() : null,
    store: createSecureCredentialStore(),
  });
