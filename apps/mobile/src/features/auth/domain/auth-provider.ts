import type { AuthUser, Credentials } from './credentials';

export type AuthFailure = 'cancelled' | 'network' | 'rejected';

export type SignInResult =
  | { ok: true; credentials: Credentials; user: AuthUser }
  | { ok: false; reason: AuthFailure };

export type RefreshResult =
  | { ok: true; credentials: Credentials }
  | { ok: false; reason: 'network' | 'rejected' };

/**
 * Identity provider port (ADR-003). The fake implements it now; the approved IdP adapter (D-03) later.
 * Implementations return failures as values. AuthService still guards against a throw.
 */
export type AuthProvider = {
  readonly isMock: boolean;
  signIn: () => Promise<SignInResult>;
  refresh: (refreshToken: string) => Promise<RefreshResult>;
  revoke: (credentials: Credentials) => Promise<void>;
};
