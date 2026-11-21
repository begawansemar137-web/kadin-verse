import type { AuthFailure, AuthProvider } from '../domain/auth-provider';
import type { AuthUser, Credentials } from '../domain/credentials';

/** Synthetic identity. Never a real person or member record (AGENTS.md §2). */
export const FAKE_USER: AuthUser = { subject: 'fake-subject-0001', displayName: 'Anggota Demo' };

export type FakeAuthOptions = {
  signIn: 'success' | AuthFailure;
  refresh: 'success' | 'network' | 'rejected';
  ttlMs: number;
  now: () => number;
};

export type FakeAuthProvider = AuthProvider & {
  configure: (next: Partial<FakeAuthOptions>) => void;
  readonly calls: { signIn: number; refresh: number; revoke: number };
};

const FAKE_REFRESH_PREFIX = 'fake-refresh-';

export const createFakeAuthProvider = (initial: Partial<FakeAuthOptions> = {}): FakeAuthProvider => {
  let options: FakeAuthOptions = {
    signIn: 'success',
    refresh: 'success',
    ttlMs: 15 * 60_000,
    now: Date.now,
    ...initial,
  };
  let counter = 0;
  const revoked = new Set<string>();
  const calls = { signIn: 0, refresh: 0, revoke: 0 };

  const issue = (): Credentials => {
    counter += 1;
    return {
      accessToken: `fake-access-${counter}`,
      refreshToken: `${FAKE_REFRESH_PREFIX}${counter}`,
      expiresAt: options.now() + options.ttlMs,
    };
  };

  return {
    isMock: true,
    calls,
    configure: (next) => {
      options = { ...options, ...next };
    },
    signIn: async () => {
      calls.signIn += 1;
      if (options.signIn !== 'success') return { ok: false, reason: options.signIn };
      return { ok: true, credentials: issue(), user: FAKE_USER };
    },
    refresh: async (refreshToken) => {
      calls.refresh += 1;
      if (options.refresh !== 'success') return { ok: false, reason: options.refresh };
      if (!refreshToken.startsWith(FAKE_REFRESH_PREFIX) || revoked.has(refreshToken)) {
        return { ok: false, reason: 'rejected' };
      }
      return { ok: true, credentials: issue() };
    },
    revoke: async (credentials) => {
      calls.revoke += 1;
      if (credentials.refreshToken !== null) revoked.add(credentials.refreshToken);
    },
  };
};
