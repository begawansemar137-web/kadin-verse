import type { AuthFailure, AuthProvider, RefreshResult, SignInResult } from './auth-provider';
import type { CredentialStore } from './credential-store';
import { isExpired, parseStoredSession, serializeStoredSession, type StoredSession } from './credentials';
import type { Session } from './session';

export type SignInOutcome = 'ok' | AuthFailure | 'unavailable';

export type AuthService = {
  readonly canSignIn: boolean;
  getSession: () => Session;
  subscribe: (listener: () => void) => () => void;
  restore: () => Promise<void>;
  signIn: () => Promise<SignInOutcome>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  handleUnauthorized: () => Promise<void>;
};

type AuthServiceDeps = { provider: AuthProvider | null; store: CredentialStore; now?: () => number };

/**
 * Session state machine (ADR-003 §2, §4, §5). Credentials live only in `stored`; the UI sees `session`.
 * `generation` increases on every sign-out or expiry so that late async results are discarded.
 * No method rejects: storage and provider failures become session states or outcomes.
 */
export const createAuthService = ({ provider, store, now = Date.now }: AuthServiceDeps): AuthService => {
  let session: Session = { status: 'restoring' };
  let stored: StoredSession | null = null;
  let generation = 0;
  let signOuts = 0;
  let restoring: Promise<void> | null = null;
  let signingIn: Promise<SignInOutcome> | null = null;
  let refreshing: Promise<boolean> | null = null;
  const listeners = new Set<() => void>();

  const setSession = (next: Session) => {
    session = next;
    listeners.forEach((listener) => listener());
  };

  const memberFrom = (current: StoredSession): Session => ({
    status: 'member',
    displayName: current.user.displayName,
    isMock: provider?.isMock ?? true,
  });

  const clearStore = async () => {
    try {
      await store.clear();
    } catch {
      // In-memory state is already cleared; see ADR-003 Consequences for the restore risk.
    }
  };

  const persist = async (current: StoredSession) => {
    try {
      await store.save(serializeStoredSession(current));
    } catch {
      // The session continues in memory; the next launch asks the user to sign in again.
    }
  };

  /** Synchronous part of ending a session: drop credentials, invalidate in-flight work, update the UI. */
  const endSession = (next: Session) => {
    stored = null;
    generation += 1;
    setSession(next);
  };

  const expire = async () => {
    endSession({ status: 'guest', notice: 'expired' });
    await clearStore();
  };

  const refreshOnce = (): Promise<boolean> => {
    if (refreshing) return refreshing;
    const current = stored;
    const refreshToken = current?.credentials.refreshToken ?? null;
    if (provider === null || current === null || refreshToken === null) {
      return expire().then(() => false);
    }
    const startedAt = generation;
    refreshing = provider
      .refresh(refreshToken)
      .catch((): RefreshResult => ({ ok: false, reason: 'network' }))
      .then(async (result) => {
        if (startedAt !== generation) return false;
        if (result.ok) {
          stored = { ...current, credentials: result.credentials };
          await persist(stored);
          if (startedAt !== generation) {
            await clearStore(); // signed out while saving: keep the sign-out durable
            return false;
          }
          return true;
        }
        if (result.reason === 'rejected') await expire();
        return false;
      })
      .finally(() => {
        refreshing = null;
      });
    return refreshing;
  };

  const restore = (): Promise<void> => {
    restoring ??= (async () => {
      let raw: string | null;
      try {
        raw = await store.load();
      } catch {
        raw = null;
      }
      const parsed = parseStoredSession(raw);
      if (provider === null || parsed === null) {
        if (raw !== null) await clearStore();
        setSession({ status: 'guest' });
        return;
      }
      stored = parsed;
      if (isExpired(parsed.credentials, now())) {
        await refreshOnce();
        if (stored === null) return; // refresh rejected: expire() already set the guest notice
      }
      setSession(memberFrom(parsed));
    })();
    return restoring;
  };

  const signIn = (): Promise<SignInOutcome> => {
    if (provider === null) return Promise.resolve('unavailable');
    signingIn ??= (async (): Promise<SignInOutcome> => {
      // Only a user sign-out cancels this sign-in. An expiry caused by the restore it waits on must not,
      // so the generation is captured after the restore, and sign-outs are counted from the call itself.
      const signOutsAtStart = signOuts;
      await restoring;
      const startedAt = generation;
      const cancelled = () => startedAt !== generation || signOutsAtStart !== signOuts;
      let result: SignInResult;
      try {
        result = await provider.signIn();
      } catch {
        result = { ok: false, reason: 'network' };
      }
      if (!result.ok) return result.reason;
      if (cancelled()) return 'cancelled';
      const current: StoredSession = { credentials: result.credentials, user: result.user };
      stored = current;
      setSession(memberFrom(current));
      await persist(current);
      if (cancelled()) {
        await clearStore(); // signed out while saving: keep the sign-out durable
        return 'cancelled';
      }
      return 'ok';
    })().finally(() => {
      signingIn = null;
    });
    return signingIn;
  };

  const signOut = async () => {
    const current = stored;
    signOuts += 1;
    endSession({ status: 'guest' });
    await clearStore();
    if (provider !== null && current !== null) {
      try {
        await provider.revoke(current.credentials);
      } catch {
        // Best effort: local sign-out already happened (ADR-003 §5).
      }
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    await restoring;
    const current = stored;
    if (current === null) return null;
    if (!isExpired(current.credentials, now())) return current.credentials.accessToken;
    const refreshed = await refreshOnce();
    return refreshed && stored !== null ? stored.credentials.accessToken : null;
  };

  const handleUnauthorized = async () => {
    await restoring;
    if (stored === null) return;
    await refreshOnce();
  };

  return {
    canSignIn: provider !== null,
    getSession: () => session,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    restore,
    signIn,
    signOut,
    getAccessToken,
    handleUnauthorized,
  };
};
