import { createFakeAuthProvider, FAKE_USER } from '@/features/auth/data/fake-auth-provider';
import { createMemoryCredentialStore } from '@/features/auth/data/memory-credential-store';
import { createAuthService } from '@/features/auth/domain/auth-service';
import type { CredentialStore } from '@/features/auth/domain/credential-store';
import { parseStoredSession } from '@/features/auth/domain/credentials';
import { FIXED_NOW, seededSession } from '@/features/auth/testing/auth-fixtures';

const MEMBER = { status: 'member', displayName: FAKE_USER.displayName, isMock: true } as const;
const EXPIRED_GUEST = { status: 'guest', notice: 'expired' } as const;

const setup = (opts: { stored?: string | null; store?: CredentialStore } = {}) => {
  let time = FIXED_NOW;
  const now = () => time;
  const provider = createFakeAuthProvider({ now });
  const store = opts.store ?? createMemoryCredentialStore(opts.stored ?? null);
  const service = createAuthService({ provider, store, now });
  return { service, provider, store, advance: (ms: number) => (time += ms) };
};

const failingStore = (overrides: Partial<CredentialStore>): CredentialStore => ({
  ...createMemoryCredentialStore(),
  ...overrides,
});

describe('restore', () => {
  it('starts as restoring and becomes guest when nothing is stored', async () => {
    const { service } = setup();
    expect(service.getSession()).toEqual({ status: 'restoring' });
    await service.restore();
    expect(service.getSession()).toEqual({ status: 'guest' });
  });

  it('restores a stored member session', async () => {
    const { service } = setup({ stored: seededSession() });
    await service.restore();
    expect(service.getSession()).toEqual(MEMBER);
  });

  it('discards a corrupt stored session and clears it', async () => {
    const { service, store } = setup({ stored: '{half-written' });
    await service.restore();
    expect(service.getSession()).toEqual({ status: 'guest' });
    expect(await store.load()).toBeNull();
  });

  it('treats an unreadable store as signed out', async () => {
    const store = failingStore({ load: () => Promise.reject(new Error('keystore locked')) });
    const { service } = setup({ store });
    await service.restore();
    expect(service.getSession()).toEqual({ status: 'guest' });
  });

  it('refreshes an expired stored token and stays signed in', async () => {
    const { service, provider, store } = setup({ stored: seededSession({ expiresAt: FIXED_NOW - 1 }) });
    await service.restore();
    expect(service.getSession()).toEqual(MEMBER);
    expect(provider.calls.refresh).toBe(1);
    expect(parseStoredSession(await store.load())?.credentials.accessToken).toBe('fake-access-1');
  });

  it('stays signed in when offline at launch with an expired token', async () => {
    const { service, provider, store } = setup({ stored: seededSession({ expiresAt: FIXED_NOW - 1 }) });
    provider.configure({ refresh: 'network' });
    await service.restore();
    expect(service.getSession()).toEqual(MEMBER);
    expect(await store.load()).not.toBeNull();
  });

  it('ends the session with an expired notice when the refresh is rejected', async () => {
    const { service, provider, store } = setup({ stored: seededSession({ expiresAt: FIXED_NOW - 1 }) });
    provider.configure({ refresh: 'rejected' });
    await service.restore();
    expect(service.getSession()).toEqual(EXPIRED_GUEST);
    expect(await store.load()).toBeNull();
  });

  it('runs once even if called twice', async () => {
    const { service, provider } = setup({ stored: seededSession({ expiresAt: FIXED_NOW - 1 }) });
    await Promise.all([service.restore(), service.restore()]);
    expect(provider.calls.refresh).toBe(1);
  });
});

describe('without a provider (non-mock builds)', () => {
  it('cannot sign in and clears any leftover session', async () => {
    const store = createMemoryCredentialStore(seededSession());
    const service = createAuthService({ provider: null, store, now: () => FIXED_NOW });
    expect(service.canSignIn).toBe(false);
    await service.restore();
    expect(service.getSession()).toEqual({ status: 'guest' });
    expect(await store.load()).toBeNull();
    expect(await service.signIn()).toBe('unavailable');
  });
});

describe('sign in', () => {
  it('signs in, persists the session and keeps tokens out of the UI session', async () => {
    const { service, store } = setup();
    await service.restore();
    expect(service.canSignIn).toBe(true);
    expect(await service.signIn()).toBe('ok');
    expect(service.getSession()).toEqual(MEMBER);
    expect(parseStoredSession(await store.load())?.user).toEqual(FAKE_USER);
    expect(JSON.stringify(service.getSession())).not.toMatch(/fake-(access|refresh)/);
  });

  it.each(['cancelled', 'network', 'rejected'] as const)('stays guest and stores nothing on %s', async (reason) => {
    const { service, provider, store } = setup();
    await service.restore();
    provider.configure({ signIn: reason });
    expect(await service.signIn()).toBe(reason);
    expect(service.getSession()).toEqual({ status: 'guest' });
    expect(await store.load()).toBeNull();
  });

  it('maps a provider that throws to a network failure', async () => {
    const { service, provider } = setup();
    await service.restore();
    jest.spyOn(provider, 'signIn').mockRejectedValueOnce(new Error('boom'));
    expect(await service.signIn()).toBe('network');
    expect(service.getSession()).toEqual({ status: 'guest' });
  });

  it('shares one provider call between overlapping sign-ins (double tap)', async () => {
    const { service, provider } = setup();
    await service.restore();
    const [a, b] = await Promise.all([service.signIn(), service.signIn()]);
    expect([a, b]).toEqual(['ok', 'ok']);
    expect(provider.calls.signIn).toBe(1);
  });

  it('still signs in for this run when secure storage cannot save', async () => {
    const store = failingStore({ save: () => Promise.reject(new Error('disk full')) });
    const { service } = setup({ store });
    await service.restore();
    expect(await service.signIn()).toBe('ok');
    expect(service.getSession()).toEqual(MEMBER);
  });
});

describe('sign out', () => {
  it('becomes guest immediately, clears storage and revokes', async () => {
    const { service, provider, store } = setup({ stored: seededSession() });
    await service.restore();
    const done = service.signOut();
    expect(service.getSession()).toEqual({ status: 'guest' });
    await done;
    expect(await store.load()).toBeNull();
    expect(provider.calls.revoke).toBe(1);
    expect(await service.getAccessToken()).toBeNull();
  });

  it('still signs out when revoke throws', async () => {
    const { service, provider, store } = setup({ stored: seededSession() });
    await service.restore();
    jest.spyOn(provider, 'revoke').mockRejectedValueOnce(new Error('offline'));
    await service.signOut();
    expect(service.getSession()).toEqual({ status: 'guest' });
    expect(await store.load()).toBeNull();
  });

  it('still signs out when storage cannot be cleared', async () => {
    const store = failingStore({ clear: () => Promise.reject(new Error('keystore locked')) });
    const { service } = setup({ store });
    await service.restore();
    await service.signIn();
    await service.signOut();
    expect(service.getSession()).toEqual({ status: 'guest' });
  });

  it('discards a sign-in that completes after sign-out', async () => {
    const { service, store } = setup();
    await service.restore();
    const pending = service.signIn();
    await service.signOut();
    expect(await pending).toBe('cancelled');
    expect(service.getSession()).toEqual({ status: 'guest' });
    expect(await store.load()).toBeNull();
  });
});

describe('access tokens and expiry', () => {
  it('returns null for a guest', async () => {
    const { service } = setup();
    await service.restore();
    expect(await service.getAccessToken()).toBeNull();
  });

  it('returns the current token without refreshing while valid', async () => {
    const { service, provider } = setup({ stored: seededSession() });
    await service.restore();
    expect(await service.getAccessToken()).toBe('fake-access-seed');
    expect(provider.calls.refresh).toBe(0);
  });

  it('refreshes once for concurrent callers when the token has expired', async () => {
    const { service, provider, advance } = setup({ stored: seededSession() });
    await service.restore();
    advance(2 * 60 * 60_000);
    const tokens = await Promise.all([service.getAccessToken(), service.getAccessToken(), service.getAccessToken()]);
    expect(tokens).toEqual(['fake-access-1', 'fake-access-1', 'fake-access-1']);
    expect(provider.calls.refresh).toBe(1);
  });

  it('expires the session when the refresh is rejected', async () => {
    const { service, provider, store, advance } = setup({ stored: seededSession() });
    await service.restore();
    provider.configure({ refresh: 'rejected' });
    advance(2 * 60 * 60_000);
    expect(await service.getAccessToken()).toBeNull();
    expect(service.getSession()).toEqual(EXPIRED_GUEST);
    expect(await store.load()).toBeNull();
  });

  it('keeps the session but returns no token when the refresh fails offline', async () => {
    const { service, provider, advance } = setup({ stored: seededSession() });
    await service.restore();
    provider.configure({ refresh: 'network' });
    advance(2 * 60 * 60_000);
    expect(await service.getAccessToken()).toBeNull();
    expect(service.getSession()).toEqual(MEMBER);
  });

  it('expires the session when there is no refresh token', async () => {
    const { service, advance } = setup({ stored: seededSession({ refreshToken: null }) });
    await service.restore();
    advance(2 * 60 * 60_000);
    expect(await service.getAccessToken()).toBeNull();
    expect(service.getSession()).toEqual(EXPIRED_GUEST);
  });
});

describe('handleUnauthorized (API 401, AUTH-002)', () => {
  it('forces a refresh even before the expiry time', async () => {
    const { service, provider } = setup({ stored: seededSession() });
    await service.restore();
    await service.handleUnauthorized();
    expect(provider.calls.refresh).toBe(1);
    expect(await service.getAccessToken()).toBe('fake-access-1');
    expect(service.getSession()).toEqual(MEMBER);
  });

  it('ends the session with an expired notice when the refresh is rejected', async () => {
    const { service, provider } = setup({ stored: seededSession() });
    await service.restore();
    provider.configure({ refresh: 'rejected' });
    await service.handleUnauthorized();
    expect(service.getSession()).toEqual(EXPIRED_GUEST);
  });

  it('does nothing for a guest', async () => {
    const { service, provider } = setup();
    await service.restore();
    await service.handleUnauthorized();
    expect(provider.calls.refresh).toBe(0);
  });
});

/** A store whose save completes only when the test says so, to interleave sign-out with a pending write. */
const deferredSaveStore = (initial: string | null = null) => {
  let value = initial;
  let release: (() => void) | null = null;
  const store: CredentialStore = {
    load: async () => value,
    save: (next) =>
      new Promise<void>((resolve) => {
        release = () => {
          value = next;
          resolve();
        };
      }),
    clear: async () => {
      value = null;
    },
  };
  return { store, savePending: () => release !== null, releaseSave: () => release?.(), peek: () => value };
};

const until = async (condition: () => boolean) => {
  for (let i = 0; i < 50 && !condition(); i += 1) await Promise.resolve();
  if (!condition()) throw new Error('condition never became true');
};

describe('interleavings found in final review', () => {
  it('does not report a sign-in started during restore as cancelled when restore expires the old session', async () => {
    const { service, provider } = setup({ stored: seededSession({ expiresAt: FIXED_NOW - 1 }) });
    provider.configure({ refresh: 'rejected' });
    const restoring = service.restore();
    const pending = service.signIn();
    await restoring;
    expect(await pending).toBe('ok');
    expect(service.getSession()).toEqual(MEMBER);
  });

  it('reports cancelled and leaves storage empty when sign-out lands while the new session is being saved', async () => {
    const { store, savePending, releaseSave, peek } = deferredSaveStore();
    const { service } = setup({ store });
    await service.restore();
    const pending = service.signIn();
    await until(savePending);
    await service.signOut();
    releaseSave();
    expect(await pending).toBe('cancelled');
    expect(service.getSession()).toEqual({ status: 'guest' });
    expect(peek()).toBeNull();
  });

  it('leaves storage empty when sign-out lands while a refreshed token is being saved', async () => {
    const { store, savePending, releaseSave, peek } = deferredSaveStore(seededSession());
    const { service, advance } = setup({ store });
    await service.restore();
    advance(2 * 60 * 60_000);
    const token = service.getAccessToken();
    await until(savePending);
    await service.signOut();
    releaseSave();
    expect(await token).toBeNull();
    expect(peek()).toBeNull();
    expect(service.getSession()).toEqual({ status: 'guest' });
  });
});

describe('subscribe', () => {
  it('notifies on change and stops after unsubscribe', async () => {
    const { service } = setup();
    const listener = jest.fn();
    const unsubscribe = service.subscribe(listener);
    await service.restore();
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    await service.signIn();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
