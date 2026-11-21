# B-002 Auth Interfaces with a Fake Provider — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the B-001 in-memory mock session with a provider-agnostic auth boundary (ports, a synthetic fake provider, secure persistence, restore/expiry/sign-out rules) so screens run on real session transitions before an IdP is chosen.

**Architecture:** A plain-TypeScript `AuthService` owns credentials and exposes only a token-free `Session` to React via `useSyncExternalStore`. It talks to two ports, `AuthProvider` (fake now, OIDC later) and `CredentialStore` (`expo-secure-store` in the app, in-memory in tests). Screens gain `restoring`, pending, failure and expired-notice states.

**Tech Stack:** Expo SDK 58, expo-router 58, React 19.3, TypeScript 6 strict (`noUncheckedIndexedAccess`), Jest 30 + jest-expo, RNTL 14, `expo-router/testing-library`, `expo-secure-store ~58.0.3` (already a dependency), pnpm 11.

**Spec:** `docs/adr/ADR-003-identity-integration-boundary.md` (ACCEPTED 2026-11-22.) Upstream: `PRD.md` EPIC-01 and EPIC-06, `SDD.md` §8.1, §11 and §12 (AUTH-001/002), `AGENTS.md` §6 and §8.

## Global Constraints

- Work on branch `feat/B-002-auth-fake-provider`. `main` is protected, so changes land through a PR with the `Typecheck, lint, test` check.
- Mock-only. No real IdP, no network calls, no production URLs, no real member data; synthetic values only (`Anggota Demo`, `fake-*` tokens).
- "Secure session storage for credentials; no access tokens in AsyncStorage or application logs." (AGENTS.md §6)
- "All privileged authorization must be enforced server-side, not just by hidden UI routes." Client guards are UX only.
- "Cover loading, empty, offline, error, unauthorized, expired-session, and success states." (AGENTS.md §6)
- TypeScript strict; no `any`; named exports; const arrow functions; feature-first layout `src/features/auth/{domain,data,testing,__tests__}`.
- The fake provider is wired in only when `flags.mockAuth` is true (dev and EAS preview). Other builds get `provider: null`.
- Indonesian copy is PROPOSED and needs UX/editorial approval (BR-005). Add new strings to `src/shared/copy/id.ts` only.
- Run Jest per file with `pnpm exec jest <path>` from `apps/mobile`. **Do not** use `pnpm test -- <args>`: it passes a literal `--` to Jest and silently runs nothing.
- Full gates (from `apps/mobile`): `pnpm typecheck`, `pnpm lint`, `pnpm exec jest`.
- No new dependencies.

## Review Focus

1. Sign-out tapped while a sign-in is still in flight: the user ends up signed out and nothing is persisted (pinned in Task 3).
2. Stored session that is corrupt, old-format or half-written: the app starts as guest, clears it, and does not crash (pinned in Tasks 1 and 3).
3. Several API calls asking for a token at the moment it expires: exactly one refresh, all callers get the new token (pinned in Task 3).
4. Cold start offline with an expired access token: the user stays signed in and is not logged out by a network blip (pinned in Task 3).
5. Secure storage throwing on save or clear: no crash, and the in-memory session is still correct (pinned in Task 3).

---

## File Structure

| File | Responsibility |
|---|---|
| `apps/mobile/src/features/auth/domain/credentials.ts` (new) | `Credentials`, `AuthUser`, `StoredSession` types; expiry check; versioned serialise/parse with runtime validation |
| `apps/mobile/src/features/auth/domain/auth-provider.ts` (new) | `AuthProvider` port and result types |
| `apps/mobile/src/features/auth/domain/credential-store.ts` (new) | `CredentialStore` port |
| `apps/mobile/src/features/auth/domain/session.ts` (modify) | UI-facing `Session` union: `restoring \| guest{notice?} \| member` |
| `apps/mobile/src/features/auth/domain/auth-service.ts` (new) | Session state machine: restore, sign-in, sign-out, token access, refresh, expiry |
| `apps/mobile/src/features/auth/data/fake-auth-provider.ts` (new) | Synthetic provider with configurable outcomes |
| `apps/mobile/src/features/auth/data/memory-credential-store.ts` (new) | In-memory store (tests) |
| `apps/mobile/src/features/auth/data/secure-credential-store.ts` (new) | `expo-secure-store` adapter |
| `apps/mobile/src/features/auth/default-auth-service.ts` (new) | Wires provider/store from `flags` |
| `apps/mobile/src/features/auth/session-context.tsx` (modify) | React binding: `SessionProvider service?`, `useSession()` |
| `apps/mobile/src/features/auth/testing/auth-fixtures.ts` (new) | Test-only helpers: fixed clock, seeded stores, `createTestAuthService` |
| `apps/mobile/jest.setup.js` (modify), `apps/mobile/jest.after-env.js` (new), `apps/mobile/package.json` (modify) | In-memory `expo-secure-store` mock, reset after each test |
| `apps/mobile/src/shared/ui/Button.tsx` (modify) | `disabled` prop with accessibility state |
| `apps/mobile/src/shared/copy/id.ts` (modify) | Sign-in failure and expired copy |
| `apps/mobile/src/app/sign-in.tsx`, `card.tsx`, `(tabs)/account.tsx` (modify) | Pending/failure/expired states; `restoring` loading states |
| `docs/test-evidence/B-002-auth-fake-provider.md` (new), `README.md` (modify) | Evidence and status |

---

### Task 1: Credentials model and versioned storage format

**Files:**
- Create: `apps/mobile/src/features/auth/domain/credentials.ts`
- Test: `apps/mobile/src/features/auth/__tests__/credentials.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type Credentials = { accessToken: string; refreshToken: string | null; expiresAt: number }`
  - `type AuthUser = { subject: string; displayName: string }`
  - `type StoredSession = { credentials: Credentials; user: AuthUser }`
  - `const EXPIRY_SKEW_MS = 30_000`
  - `isExpired(credentials: Credentials, now: number, skewMs?: number): boolean`
  - `serializeStoredSession(session: StoredSession): string`
  - `parseStoredSession(raw: string | null): StoredSession | null`

- [ ] **Step 1: Write the failing test**

```ts
// apps/mobile/src/features/auth/__tests__/credentials.test.ts
import {
  EXPIRY_SKEW_MS,
  isExpired,
  parseStoredSession,
  serializeStoredSession,
  type StoredSession,
} from '@/features/auth/domain/credentials';

const NOW = Date.UTC(2026, 10, 22, 9, 0, 0);

const sample: StoredSession = {
  credentials: { accessToken: 'fake-access-1', refreshToken: 'fake-refresh-1', expiresAt: NOW + 60_000 },
  user: { subject: 'fake-subject-0001', displayName: 'Anggota Demo' },
};

describe('isExpired', () => {
  it('is false well before expiry', () => {
    expect(isExpired(sample.credentials, NOW)).toBe(false);
  });

  it('is true inside the skew window', () => {
    expect(isExpired(sample.credentials, sample.credentials.expiresAt - EXPIRY_SKEW_MS)).toBe(true);
  });

  it('is true after expiry', () => {
    expect(isExpired(sample.credentials, sample.credentials.expiresAt + 1)).toBe(true);
  });
});

describe('stored session format', () => {
  it('round-trips', () => {
    expect(parseStoredSession(serializeStoredSession(sample))).toEqual(sample);
  });

  it('accepts a null refresh token', () => {
    const noRefresh = { ...sample, credentials: { ...sample.credentials, refreshToken: null } };
    expect(parseStoredSession(serializeStoredSession(noRefresh))).toEqual(noRefresh);
  });

  it.each([
    ['nothing stored', null],
    ['not JSON', '{oops'],
    ['JSON null', 'null'],
    ['a bare string', '"fake-access-1"'],
    ['unknown version', JSON.stringify({ ...sample, v: 2 })],
    ['missing version', JSON.stringify(sample)],
    ['missing access token', JSON.stringify({ v: 1, ...sample, credentials: { ...sample.credentials, accessToken: '' } })],
    ['non-numeric expiry', JSON.stringify({ v: 1, ...sample, credentials: { ...sample.credentials, expiresAt: 'soon' } })],
    ['numeric refresh token', JSON.stringify({ v: 1, ...sample, credentials: { ...sample.credentials, refreshToken: 7 } })],
    ['empty display name', JSON.stringify({ v: 1, ...sample, user: { ...sample.user, displayName: '' } })],
    ['missing user', JSON.stringify({ v: 1, credentials: sample.credentials })],
  ])('rejects %s', (_label, raw) => {
    expect(parseStoredSession(raw)).toBeNull();
  });

  it('drops unexpected extra fields', () => {
    const raw = JSON.stringify({ v: 1, ...sample, user: { ...sample.user, nik: '0000' } });
    expect(parseStoredSession(raw)).toEqual(sample);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `apps/mobile`): `pnpm exec jest src/features/auth/__tests__/credentials.test.ts`
Expected: FAIL, "Cannot find module '@/features/auth/domain/credentials'".

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/mobile/src/features/auth/domain/credentials.ts
/** Credential model for the auth boundary (ADR-003). Values here never reach React state or logs. */
export type Credentials = { accessToken: string; refreshToken: string | null; expiresAt: number };
export type AuthUser = { subject: string; displayName: string };
export type StoredSession = { credentials: Credentials; user: AuthUser };

/** PLACEHOLDER skew pending security approval of token lifetimes (ADR-003 §Out of scope). */
export const EXPIRY_SKEW_MS = 30_000;

const FORMAT_VERSION = 1;

export const isExpired = (credentials: Credentials, now: number, skewMs = EXPIRY_SKEW_MS): boolean =>
  now >= credentials.expiresAt - skewMs;

export const serializeStoredSession = (session: StoredSession): string =>
  JSON.stringify({ v: FORMAT_VERSION, credentials: session.credentials, user: session.user });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

/** Returns null for anything that is not a well-formed v1 record: callers treat that as "no session". */
export const parseStoredSession = (raw: string | null): StoredSession | null => {
  if (raw === null) return null;

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(data) || data.v !== FORMAT_VERSION) return null;
  const { credentials, user } = data;
  if (!isRecord(credentials) || !isRecord(user)) return null;

  const { accessToken, refreshToken, expiresAt } = credentials;
  const { subject, displayName } = user;

  if (!isNonEmptyString(accessToken)) return null;
  if (refreshToken !== null && !isNonEmptyString(refreshToken)) return null;
  if (typeof expiresAt !== 'number' || !Number.isFinite(expiresAt)) return null;
  if (!isNonEmptyString(subject) || !isNonEmptyString(displayName)) return null;

  return { credentials: { accessToken, refreshToken, expiresAt }, user: { subject, displayName } };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec jest src/features/auth/__tests__/credentials.test.ts`
Expected: PASS, 17 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/auth/domain/credentials.ts apps/mobile/src/features/auth/__tests__/credentials.test.ts
git commit -m "feat(B-002): versioned credential model with validated storage format"
```

---

### Task 2: Ports, fake provider and credential stores

**Files:**
- Create: `apps/mobile/src/features/auth/domain/auth-provider.ts`, `apps/mobile/src/features/auth/domain/credential-store.ts`, `apps/mobile/src/features/auth/data/fake-auth-provider.ts`, `apps/mobile/src/features/auth/data/memory-credential-store.ts`, `apps/mobile/src/features/auth/data/secure-credential-store.ts`, `apps/mobile/jest.after-env.js`
- Modify: `apps/mobile/jest.setup.js`, `apps/mobile/package.json` (jest block)
- Test: `apps/mobile/src/features/auth/__tests__/fake-auth-provider.test.ts`, `apps/mobile/src/features/auth/__tests__/credential-stores.test.ts`

**Interfaces:**
- Consumes: `Credentials`, `AuthUser` from Task 1.
- Produces:
  - `type AuthFailure = 'cancelled' | 'network' | 'rejected'`
  - `type SignInResult = { ok: true; credentials: Credentials; user: AuthUser } | { ok: false; reason: AuthFailure }`
  - `type RefreshResult = { ok: true; credentials: Credentials } | { ok: false; reason: 'network' | 'rejected' }`
  - `type AuthProvider = { readonly isMock: boolean; signIn(): Promise<SignInResult>; refresh(refreshToken: string): Promise<RefreshResult>; revoke(credentials: Credentials): Promise<void> }`
  - `type CredentialStore = { load(): Promise<string | null>; save(value: string): Promise<void>; clear(): Promise<void> }`
  - `FAKE_USER: AuthUser`, `type FakeAuthOptions`, `type FakeAuthProvider = AuthProvider & { configure(next: Partial<FakeAuthOptions>): void; readonly calls: { signIn: number; refresh: number; revoke: number } }`, `createFakeAuthProvider(options?: Partial<FakeAuthOptions>): FakeAuthProvider`
  - `createMemoryCredentialStore(initial?: string | null): CredentialStore`
  - `SESSION_KEY = 'kadin.verse.session.v1'`, `createSecureCredentialStore(): CredentialStore`

- [ ] **Step 1: Add the in-memory `expo-secure-store` mock (test infrastructure)**

Append to `apps/mobile/jest.setup.js`:

```js
// In-memory stand-in for the native keystore. Reset after every test in jest.after-env.js.
jest.mock('expo-secure-store', () => {
  const store = new Map();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    getItemAsync: jest.fn(async (key) => (store.has(key) ? store.get(key) : null)),
    setItemAsync: jest.fn(async (key, value) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key) => {
      store.delete(key);
    }),
    __reset: () => store.clear(),
  };
});
```

Create `apps/mobile/jest.after-env.js`:

```js
// Keeps a session persisted by one test from being restored by the next.
afterEach(() => {
  require('expo-secure-store').__reset();
});
```

In `apps/mobile/package.json`, add this key to the `jest` block, next to `setupFiles`:

```json
"setupFilesAfterEnv": ["<rootDir>/jest.after-env.js"],
```

- [ ] **Step 2: Write the failing tests**

```ts
// apps/mobile/src/features/auth/__tests__/fake-auth-provider.test.ts
import { createFakeAuthProvider, FAKE_USER } from '@/features/auth/data/fake-auth-provider';

const NOW = Date.UTC(2026, 10, 22, 9, 0, 0);

describe('fake auth provider', () => {
  it('is marked as mock', () => {
    expect(createFakeAuthProvider().isMock).toBe(true);
  });

  it('signs in with synthetic credentials and the demo user', async () => {
    const provider = createFakeAuthProvider({ now: () => NOW, ttlMs: 60_000 });
    const result = await provider.signIn();
    expect(result).toEqual({
      ok: true,
      user: FAKE_USER,
      credentials: { accessToken: 'fake-access-1', refreshToken: 'fake-refresh-1', expiresAt: NOW + 60_000 },
    });
    expect(provider.calls.signIn).toBe(1);
  });

  it.each(['cancelled', 'network', 'rejected'] as const)('returns the configured %s failure', async (reason) => {
    const provider = createFakeAuthProvider({ signIn: reason });
    expect(await provider.signIn()).toEqual({ ok: false, reason });
  });

  it('refreshes a token it issued with a new pair', async () => {
    const provider = createFakeAuthProvider({ now: () => NOW });
    await provider.signIn();
    const result = await provider.refresh('fake-refresh-1');
    expect(result).toEqual({
      ok: true,
      credentials: { accessToken: 'fake-access-2', refreshToken: 'fake-refresh-2', expiresAt: expect.any(Number) },
    });
  });

  it('rejects a refresh token that is not a fake token', async () => {
    expect(await createFakeAuthProvider().refresh('real-looking-token')).toEqual({ ok: false, reason: 'rejected' });
  });

  it('rejects a refresh token after it was revoked', async () => {
    const provider = createFakeAuthProvider();
    const signIn = await provider.signIn();
    if (!signIn.ok) throw new Error('expected sign-in to succeed');
    await provider.revoke(signIn.credentials);
    expect(await provider.refresh('fake-refresh-1')).toEqual({ ok: false, reason: 'rejected' });
    expect(provider.calls.revoke).toBe(1);
  });

  it('can be reconfigured between calls', async () => {
    const provider = createFakeAuthProvider();
    provider.configure({ refresh: 'network' });
    expect(await provider.refresh('fake-refresh-9')).toEqual({ ok: false, reason: 'network' });
  });
});
```

```ts
// apps/mobile/src/features/auth/__tests__/credential-stores.test.ts
import * as SecureStore from 'expo-secure-store';

import { createMemoryCredentialStore } from '@/features/auth/data/memory-credential-store';
import { createSecureCredentialStore, SESSION_KEY } from '@/features/auth/data/secure-credential-store';

describe('memory credential store', () => {
  it('saves, loads and clears', async () => {
    const store = createMemoryCredentialStore();
    expect(await store.load()).toBeNull();
    await store.save('value');
    expect(await store.load()).toBe('value');
    await store.clear();
    expect(await store.load()).toBeNull();
  });

  it('can start seeded', async () => {
    expect(await createMemoryCredentialStore('seed').load()).toBe('seed');
  });
});

describe('secure credential store', () => {
  const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

  it('round-trips through expo-secure-store under one key, device-only', async () => {
    const store = createSecureCredentialStore();
    await store.save('value');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(SESSION_KEY, 'value', options);
    expect(await store.load()).toBe('value');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith(SESSION_KEY, options);
  });

  it('clears the key', async () => {
    const store = createSecureCredentialStore();
    await store.save('value');
    await store.clear();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(SESSION_KEY, options);
    expect(await store.load()).toBeNull();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm exec jest src/features/auth/__tests__/fake-auth-provider.test.ts src/features/auth/__tests__/credential-stores.test.ts`
Expected: FAIL, "Cannot find module '@/features/auth/data/fake-auth-provider'" (and the same for the stores).

- [ ] **Step 4: Write minimal implementation**

```ts
// apps/mobile/src/features/auth/domain/auth-provider.ts
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
```

```ts
// apps/mobile/src/features/auth/domain/credential-store.ts
/** Stores one opaque serialised session (ADR-003 §3). Must be platform secure storage in the app. */
export type CredentialStore = {
  load: () => Promise<string | null>;
  save: (value: string) => Promise<void>;
  clear: () => Promise<void>;
};
```

```ts
// apps/mobile/src/features/auth/data/fake-auth-provider.ts
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
```

```ts
// apps/mobile/src/features/auth/data/memory-credential-store.ts
import type { CredentialStore } from '../domain/credential-store';

/** Test double: not secure storage. Never wire this into the app. */
export const createMemoryCredentialStore = (initial: string | null = null): CredentialStore => {
  let value = initial;
  return {
    load: async () => value,
    save: async (next) => {
      value = next;
    },
    clear: async () => {
      value = null;
    },
  };
};
```

```ts
// apps/mobile/src/features/auth/data/secure-credential-store.ts
import * as SecureStore from 'expo-secure-store';

import type { CredentialStore } from '../domain/credential-store';

export const SESSION_KEY = 'kadin.verse.session.v1';

/** Keychain/Keystore entry readable only while unlocked and never migrated to another device. */
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const createSecureCredentialStore = (): CredentialStore => ({
  load: () => SecureStore.getItemAsync(SESSION_KEY, OPTIONS),
  save: (value) => SecureStore.setItemAsync(SESSION_KEY, value, OPTIONS),
  clear: () => SecureStore.deleteItemAsync(SESSION_KEY, OPTIONS),
});
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm exec jest src/features/auth/__tests__/fake-auth-provider.test.ts src/features/auth/__tests__/credential-stores.test.ts`
Expected: PASS, 13 tests.

- [ ] **Step 6: Run the full suite (the setup files changed)**

Run: `pnpm exec jest`
Expected: PASS, all previous suites still green (85 + Task 1 + Task 2 tests).

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/features/auth/domain/auth-provider.ts apps/mobile/src/features/auth/domain/credential-store.ts apps/mobile/src/features/auth/data apps/mobile/src/features/auth/__tests__/fake-auth-provider.test.ts apps/mobile/src/features/auth/__tests__/credential-stores.test.ts apps/mobile/jest.setup.js apps/mobile/jest.after-env.js apps/mobile/package.json
git commit -m "feat(B-002): auth provider and credential store ports with fake and secure-store adapters"
```

---

### Task 3: AuthService session state machine

**Files:**
- Modify: `apps/mobile/src/features/auth/domain/session.ts`
- Create: `apps/mobile/src/features/auth/domain/auth-service.ts`, `apps/mobile/src/features/auth/testing/auth-fixtures.ts`
- Test: `apps/mobile/src/features/auth/__tests__/auth-service.test.ts`

**Interfaces:**
- Consumes: Task 1 (`Credentials`, `StoredSession`, `isExpired`, `serializeStoredSession`, `parseStoredSession`); Task 2 (`AuthProvider`, `AuthFailure`, `SignInResult`, `RefreshResult`, `CredentialStore`, `createFakeAuthProvider`, `FAKE_USER`, `FakeAuthProvider`, `createMemoryCredentialStore`).
- Produces:
  - `type Session = { status: 'restoring' } | { status: 'guest'; notice?: 'expired' } | { status: 'member'; displayName: string; isMock: boolean }`
  - `type SignInOutcome = 'ok' | AuthFailure | 'unavailable'`
  - `type AuthService = { readonly canSignIn: boolean; getSession(): Session; subscribe(listener: () => void): () => void; restore(): Promise<void>; signIn(): Promise<SignInOutcome>; signOut(): Promise<void>; getAccessToken(): Promise<string | null>; handleUnauthorized(): Promise<void> }`
  - `createAuthService(deps: { provider: AuthProvider | null; store: CredentialStore; now?: () => number }): AuthService`
  - Fixtures: `FIXED_NOW: number`, `seededSession(overrides?: Partial<Credentials>): string`, `createTestAuthService(options?: { signedIn?: boolean; provider?: FakeAuthProvider | null; store?: CredentialStore; now?: () => number }): AuthService`

- [ ] **Step 1: Replace the session type**

`session.ts` drops `GUEST`/`MOCK_MEMBER` (their only users, `session-context.tsx` and tests, are rewritten in Task 4). During Tasks 3 and 4, typecheck fails until Task 5 lands; Jest still runs per file.

```ts
// apps/mobile/src/features/auth/domain/session.ts
/** UI-facing session. Holds no credentials (ADR-003 §2); AuthService owns tokens. */
export type Session =
  | { status: 'restoring' }
  | { status: 'guest'; notice?: 'expired' }
  | { status: 'member'; displayName: string; isMock: boolean };
```

- [ ] **Step 2: Write the test fixtures (test-only code, outside `__tests__` so Jest does not collect it as a suite)**

```ts
// apps/mobile/src/features/auth/testing/auth-fixtures.ts
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
```

- [ ] **Step 3: Write the failing test**

```ts
// apps/mobile/src/features/auth/__tests__/auth-service.test.ts
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
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm exec jest src/features/auth/__tests__/auth-service.test.ts`
Expected: FAIL, "Cannot find module '@/features/auth/domain/auth-service'" (raised through the fixtures import).

- [ ] **Step 5: Write minimal implementation**

```ts
// apps/mobile/src/features/auth/domain/auth-service.ts
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
      const startedAt = generation;
      await restoring;
      let result: SignInResult;
      try {
        result = await provider.signIn();
      } catch {
        result = { ok: false, reason: 'network' };
      }
      if (!result.ok) return result.reason;
      if (startedAt !== generation) return 'cancelled';
      const current: StoredSession = { credentials: result.credentials, user: result.user };
      stored = current;
      setSession(memberFrom(current));
      await persist(current);
      if (startedAt !== generation) await clearStore(); // signed out while saving
      return 'ok';
    })().finally(() => {
      signingIn = null;
    });
    return signingIn;
  };

  const signOut = async () => {
    const current = stored;
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
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm exec jest src/features/auth/__tests__/auth-service.test.ts`
Expected: PASS, 30 tests. If a narrowing complaint appears only under `tsc` (for example `stored` after an `await`), fix it by reading into a local `const` and keep the behavior unchanged.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/features/auth/domain/session.ts apps/mobile/src/features/auth/domain/auth-service.ts apps/mobile/src/features/auth/testing/auth-fixtures.ts apps/mobile/src/features/auth/__tests__/auth-service.test.ts
git commit -m "feat(B-002): auth service with restore, single-flight refresh, expiry and local-first sign-out"
```

---

### Task 4: React binding and default wiring

**Files:**
- Create: `apps/mobile/src/features/auth/default-auth-service.ts`
- Modify: `apps/mobile/src/features/auth/session-context.tsx`
- Test: `apps/mobile/src/features/auth/__tests__/session-context.test.tsx` (rewrite), `apps/mobile/src/features/auth/__tests__/default-auth-service.test.ts`

**Interfaces:**
- Consumes: `createAuthService`, `AuthService`, `SignInOutcome` (Task 3); `createFakeAuthProvider` and `createSecureCredentialStore` (Task 2); `flags` (`src/shared/config/flags.ts`); fixtures (Task 3).
- Produces:
  - `createDefaultAuthService(options?: { mockAuth?: boolean }): AuthService`, where `mockAuth` defaults to `flags.mockAuth`
  - `SessionProvider({ children, service? }: { children: ReactNode; service?: AuthService })`, which calls `service.restore()` on mount
  - `useSession(): { session: Session; canSignIn: boolean; signIn: () => Promise<SignInOutcome>; signOut: () => Promise<void> }`

- [ ] **Step 1: Write the failing tests**

```ts
// apps/mobile/src/features/auth/__tests__/default-auth-service.test.ts
import * as SecureStore from 'expo-secure-store';

import { SESSION_KEY } from '@/features/auth/data/secure-credential-store';
import { createDefaultAuthService } from '@/features/auth/default-auth-service';

describe('default auth service wiring', () => {
  it('uses the fake provider and secure storage when demo auth is on', async () => {
    const service = createDefaultAuthService({ mockAuth: true });
    expect(service.canSignIn).toBe(true);
    await service.restore();
    expect(await service.signIn()).toBe('ok');
    expect(service.getSession()).toMatchObject({ status: 'member', isMock: true });
    expect(await SecureStore.getItemAsync(SESSION_KEY)).not.toBeNull();
  });

  it('has no provider when demo auth is off', async () => {
    const service = createDefaultAuthService({ mockAuth: false });
    expect(service.canSignIn).toBe(false);
    await service.restore();
    expect(await service.signIn()).toBe('unavailable');
  });
});
```

```tsx
// apps/mobile/src/features/auth/__tests__/session-context.test.tsx
import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { AuthService } from '@/features/auth/domain/auth-service';
import { SessionProvider, useSession } from '@/features/auth/session-context';
import { createTestAuthService } from '@/features/auth/testing/auth-fixtures';

const MEMBER = { status: 'member', displayName: 'Anggota Demo', isMock: true };

const wrapperFor =
  (service: AuthService) =>
  ({ children }: { children: ReactNode }) => <SessionProvider service={service}>{children}</SessionProvider>;

describe('SessionProvider', () => {
  it('restores on mount: guest when nothing is stored', async () => {
    const { result } = await renderHook(() => useSession(), { wrapper: wrapperFor(createTestAuthService()) });
    await waitFor(() => expect(result.current.session).toEqual({ status: 'guest' }));
    expect(result.current.canSignIn).toBe(true);
  });

  it('restores a stored member session on mount', async () => {
    const service = createTestAuthService({ signedIn: true });
    const { result } = await renderHook(() => useSession(), { wrapper: wrapperFor(service) });
    await waitFor(() => expect(result.current.session).toEqual(MEMBER));
  });

  it('signs in and out through the service', async () => {
    const { result } = await renderHook(() => useSession(), { wrapper: wrapperFor(createTestAuthService()) });
    await waitFor(() => expect(result.current.session.status).toBe('guest'));

    await act(async () => {
      expect(await result.current.signIn()).toBe('ok');
    });
    expect(result.current.session).toEqual(MEMBER);

    await act(async () => {
      await result.current.signOut();
    });
    expect(result.current.session).toEqual({ status: 'guest' });
  });

  it('exposes no credentials through the hook', async () => {
    const service = createTestAuthService({ signedIn: true });
    const { result } = await renderHook(() => useSession(), { wrapper: wrapperFor(service) });
    await waitFor(() => expect(result.current.session.status).toBe('member'));
    expect(JSON.stringify(result.current)).not.toMatch(/fake-(access|refresh)/);
  });

  it('throws a clear error outside the provider', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(async () => {
      await renderHook(() => useSession());
    }).rejects.toThrow('useSession must be used inside SessionProvider');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec jest src/features/auth/__tests__/session-context.test.tsx src/features/auth/__tests__/default-auth-service.test.ts`
Expected: FAIL. `default-auth-service` cannot be found. In the context tests, the B-001 provider ignores `service`, so `canSignIn` is undefined and the stored member is never restored.

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/mobile/src/features/auth/default-auth-service.ts
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
```

```tsx
// apps/mobile/src/features/auth/session-context.tsx
import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';

import { createDefaultAuthService } from './default-auth-service';
import type { AuthService, SignInOutcome } from './domain/auth-service';
import type { Session } from './domain/session';

type SessionContextValue = {
  session: Session;
  canSignIn: boolean;
  signIn: () => Promise<SignInOutcome>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

type SessionProviderProps = { children: ReactNode; service?: AuthService };

/** Binds AuthService to React. Only the token-free Session crosses this boundary (ADR-003 §2). */
export const SessionProvider = ({ children, service: injected }: SessionProviderProps) => {
  const [service] = useState(() => injected ?? createDefaultAuthService());
  const session = useSyncExternalStore(service.subscribe, service.getSession);

  useEffect(() => {
    void service.restore();
  }, [service]);

  const value = useMemo<SessionContextValue>(
    () => ({ session, canSignIn: service.canSignIn, signIn: service.signIn, signOut: service.signOut }),
    [session, service],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = (): SessionContextValue => {
  const ctx = useContext(SessionContext);
  if (ctx === null) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return ctx;
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec jest src/features/auth/__tests__/session-context.test.tsx src/features/auth/__tests__/default-auth-service.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit** (screens still reference `signInMock`, so typecheck and router tests stay red until Task 5. Both commits go in the same PR.)

```bash
git add apps/mobile/src/features/auth/default-auth-service.ts apps/mobile/src/features/auth/session-context.tsx apps/mobile/src/features/auth/__tests__/session-context.test.tsx apps/mobile/src/features/auth/__tests__/default-auth-service.test.ts
git commit -m "feat(B-002): bind auth service to React and wire fake provider for dev and preview"
```

---

### Task 5: Screens: sign-in states, restoring states, router journeys

**Files:**
- Modify: `apps/mobile/src/shared/ui/Button.tsx`, `apps/mobile/src/shared/copy/id.ts`, `apps/mobile/src/app/sign-in.tsx`, `apps/mobile/src/app/card.tsx`, `apps/mobile/src/app/(tabs)/account.tsx`
- Test: `apps/mobile/src/shared/ui/__tests__/Button.test.tsx` (add a case), `apps/mobile/src/navigation/__tests__/router.test.tsx` (update and add)

**Interfaces:**
- Consumes: `useSession()` (Task 4); `createTestAuthService`, `seededSession`, `FIXED_NOW` (Task 3); `createFakeAuthProvider`, `createMemoryCredentialStore`, `AuthFailure` (Task 2).
- Produces: `Button` prop `disabled?: boolean`; copy `copy.signIn.expired: string` and `copy.signIn.failed: Record<AuthFailure, string>`.

- [ ] **Step 1: Write the failing tests**

Add to `apps/mobile/src/shared/ui/__tests__/Button.test.tsx`, inside its existing `describe`. Reuse the file's existing `render`/`screen`/`fireEvent` imports from `@testing-library/react-native`, adding any that are missing.

```tsx
  it('can be disabled: no press, announced as disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Kirim" onPress={onPress} disabled />);
    const button = screen.getByRole('button', { name: 'Kirim' });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
```

In `apps/mobile/src/navigation/__tests__/router.test.tsx`:

(a) Add `waitFor` to the existing `@testing-library/react-native` import. Replace the `MOCK_MEMBER` import line with:

```tsx
import { createFakeAuthProvider } from '@/features/auth/data/fake-auth-provider';
import { createMemoryCredentialStore } from '@/features/auth/data/memory-credential-store';
import { createTestAuthService, FIXED_NOW, seededSession } from '@/features/auth/testing/auth-fixtures';
```

(b) Replace `signInFromGate` so it waits for the async sign-in:

```tsx
const signInFromGate = async () => {
  await fireEvent.press(screen.getByRole('button', { name: copy.signIn.mockButton }));
  await waitFor(() => expect(screen).not.toHavePathname('/sign-in'));
};
```

(c) In the `session ends while on a protected route` and `mock member content is labelled on Beranda` blocks, replace `<SessionProvider initialSession={MOCK_MEMBER}>` with `<SessionProvider service={createTestAuthService({ signedIn: true })}>`. Then change the first assertion after `renderRouter` in each of those tests to its `findBy…` form, because the session now restores asynchronously:

```tsx
    expect(await screen.findByText(copy.card.placeholder)).toBeTruthy();
```

```tsx
    expect(await screen.findByText(copy.home.greetingMember('Anggota Demo'))).toBeTruthy();
```

(d) Append these new journeys:

```tsx
describe('B-002 sign-in states', () => {
  const layoutWith = (service: ReturnType<typeof createTestAuthService>) => {
    const Layout = () => (
      <SessionProvider service={service}>
        <Stack />
      </SessionProvider>
    );
    return Layout;
  };

  it('shows a safe message when sign-in fails and stays on the gate', async () => {
    const provider = createFakeAuthProvider({ signIn: 'network', now: () => FIXED_NOW });
    await renderRouter(
      { _layout: layoutWith(createTestAuthService({ provider })), 'sign-in': SignIn, card: Card, index: Home },
      { initialUrl: '/sign-in?returnTo=/card' },
    );
    await fireEvent.press(await screen.findByRole('button', { name: copy.signIn.mockButton }));
    expect(await screen.findByText(copy.signIn.failed.network)).toBeTruthy();
    expect(screen).toHavePathname('/sign-in');
  });

  it('AUTH-002: an expired stored session lands on the gate with an expired notice', async () => {
    const now = () => FIXED_NOW;
    const provider = createFakeAuthProvider({ refresh: 'rejected', now });
    const store = createMemoryCredentialStore(seededSession({ expiresAt: FIXED_NOW - 1 }));
    await renderRouter(
      {
        _layout: layoutWith(createTestAuthService({ provider, store, now })),
        'sign-in': SignIn,
        card: Card,
        index: Home,
      },
      { initialUrl: '/card' },
    );
    await waitFor(() => expect(screen).toHavePathname('/sign-in'));
    expect(await screen.findByText(copy.signIn.expired)).toBeTruthy();
    expect(screen.queryByText(copy.card.placeholder)).toBeNull();
  });

  it('a signed-in member reopening the app goes straight to the card (no gate flash)', async () => {
    await renderRouter(
      { _layout: layoutWith(createTestAuthService({ signedIn: true })), 'sign-in': SignIn, card: Card, index: Home },
      { initialUrl: '/card' },
    );
    expect(await screen.findByText(copy.card.placeholder)).toBeTruthy();
    expect(screen).toHavePathname('/card');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec jest src/shared/ui/__tests__/Button.test.tsx src/navigation/__tests__/router.test.tsx`
Expected: FAIL. The Button press is not prevented (no `disabled` prop). `copy.signIn.failed` and `copy.signIn.expired` are undefined. The "no gate flash" journey fails because `card.tsx` redirects while the session is `restoring`. The existing journeys fail because `sign-in.tsx` still calls `signInMock`.

- [ ] **Step 3: Write minimal implementation**

`Button.tsx`: add the `disabled` prop. Change the props type and the `Pressable` opening tag to this, and add `disabled: { opacity: 0.5 },` to `styles`.

```tsx
type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  accessibilityHint?: string;
  disabled?: boolean;
};

export const Button = ({ label, onPress, variant = 'primary', accessibilityHint, disabled = false }: ButtonProps) => {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
```

`id.ts`: extend `signIn` (keep the existing keys):

```ts
  signIn: {
    title: 'Masuk',
    heading: 'Masuk ke akun',
    explainer: 'Metode masuk resmi belum ditetapkan. Gunakan akun demo untuk mencoba aplikasi.',
    mockButton: 'Masuk sebagai anggota demo',
    expired: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
    failed: {
      cancelled: 'Proses masuk dibatalkan.',
      network: 'Tidak dapat terhubung. Periksa koneksi lalu coba lagi.',
      rejected: 'Masuk tidak berhasil. Silakan coba lagi.',
    },
  },
```

`sign-in.tsx`: the full file.

```tsx
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { color, fontSize } from '@kadin/design-tokens';

import type { AuthFailure } from '@/features/auth/domain/auth-provider';
import { useSession } from '@/features/auth/session-context';
import { safeReturnTo } from '@/navigation/deep-link';
import { copy } from '@/shared/copy/id';
import { Button } from '@/shared/ui/Button';
import { MockBadge } from '@/shared/ui/MockBadge';
import { Screen } from '@/shared/ui/Screen';

/** Sign-in gate. Uses the fake provider in dev/preview only; the real IdP is gated on D-03 (ADR-003). */
const SignInScreen = () => {
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const { session, canSignIn, signIn } = useSession();
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<AuthFailure | null>(null);
  const target = safeReturnTo(typeof params.returnTo === 'string' ? params.returnTo : undefined);
  const expired = session.status === 'guest' && session.notice === 'expired';

  const onSignIn = async () => {
    setPending(true);
    setFailure(null);
    const outcome = await signIn();
    setPending(false);
    if (outcome === 'ok') {
      router.replace(target);
    } else if (outcome !== 'unavailable') {
      setFailure(outcome);
    }
  };

  return (
    <Screen title={copy.signIn.heading}>
      {expired && failure === null ? (
        <Text accessibilityRole="alert" style={styles.notice}>
          {copy.signIn.expired}
        </Text>
      ) : null}
      {failure !== null ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {copy.signIn.failed[failure]}
        </Text>
      ) : null}
      <Text style={styles.body}>{copy.signIn.explainer}</Text>
      {canSignIn ? (
        <>
          <MockBadge />
          <Button label={copy.signIn.mockButton} disabled={pending} onPress={() => void onSignIn()} />
        </>
      ) : null}
      <Button variant="secondary" label={copy.common.backHome} onPress={() => router.replace('/')} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: { fontSize: fontSize.body, color: color.textPrimary },
  notice: { fontSize: fontSize.body, color: color.textPrimary, fontWeight: '600' },
  error: { fontSize: fontSize.body, color: color.danger, fontWeight: '600' },
});

export default SignInScreen;
```

`card.tsx`: wait for the restore before deciding. Add the import, and insert this block before the `canAccess` check.

```tsx
import { AsyncStateView } from '@/shared/ui/AsyncStateView';
```

```tsx
  if (session.status === 'restoring') {
    return (
      <Screen title={copy.card.heading}>
        <AsyncStateView state={{ status: 'loading' }} onRetry={() => undefined} emptyMessage="" renderSuccess={() => null} />
      </Screen>
    );
  }
```

`(tabs)/account.tsx`: add the same `restoring` block (title `copy.account.heading`, plus the `AsyncStateView` import) before the guest branch. In the member branch, render `<MockBadge />` only when `session.isMock`. Change the sign-out button to `onPress={() => void signOut()}`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec jest src/shared/ui/__tests__/Button.test.tsx src/navigation/__tests__/router.test.tsx`
Expected: PASS, including the 3 new B-002 journeys and the 13 existing router tests.

- [ ] **Step 5: Run all gates**

Run (from `apps/mobile`): `pnpm typecheck && pnpm lint && pnpm exec jest`
Expected: typecheck exit 0; lint exit 0 with no warnings; every suite passes. Record the exact counts for Task 6.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/shared/ui/Button.tsx apps/mobile/src/shared/ui/__tests__/Button.test.tsx apps/mobile/src/shared/copy/id.ts apps/mobile/src/app/sign-in.tsx apps/mobile/src/app/card.tsx "apps/mobile/src/app/(tabs)/account.tsx" apps/mobile/src/navigation/__tests__/router.test.tsx
git commit -m "feat(B-002): sign-in pending, failure and expired states; wait for session restore on gated screens"
```

---

### Task 6: Evidence, status and PR-readiness

**Files:**
- Create: `docs/test-evidence/B-002-auth-fake-provider.md`
- Modify: `README.md` (status line)

**Interfaces:**
- Consumes: the real command output from Tasks 1–5.
- Produces: nothing for code.

- [ ] **Step 1: Re-run all gates fresh and capture output**

Run (from `apps/mobile`): `pnpm typecheck; echo "typecheck exit $?"; pnpm lint; echo "lint exit $?"; pnpm exec jest 2>&1 | tail -8`
Expected: both exits are 0; Jest prints `Tests: N passed, N total` with no failures.

- [ ] **Step 2: Write the evidence file from that output** (no claims beyond what ran)

It contains:
- the header (backlog B-002, branch, ADR-003 status PROPOSED);
- a RED→GREEN table with one row per task: test file, the failure seen at RED, and the result at GREEN;
- gate results with the exact counts;
- an acceptance mapping:
  - EPIC-01 AC "logout → protected route denied": router "session ends while on a protected route" and auth-service "sign out" tests;
  - EPIC-01 AC "expired credentials / 401 recover safely": AUTH-002 router journey and the `handleUnauthorized` tests;
  - EPIC-06 "logout clears local session material": auth-service sign-out storage assertions;
  - AGENTS §6 "no tokens in state/logs": the token-free session assertions;
- the Review Focus items with the test that pins each one;
- **NOT RUN:** device/emulator check of `expo-secure-store` on Android and iOS (the Jest mock stands in for the native keystore). Reproduce with `eas build --profile preview` and sign in, kill the app, reopen, and confirm the user is still signed in.
- open items: D-03, token lifetimes, the `displayName`-at-rest privacy review, and ADR-003 approval.

- [ ] **Step 3: Update README status line** to note that B-002 auth boundary (fake provider) is in review, pending ADR-003 approval.

- [ ] **Step 4: Commit**

```bash
git add docs/test-evidence/B-002-auth-fake-provider.md README.md
git commit -m "docs(B-002): record verification evidence and update status"
```

---

## Out of scope (do not build here)

Real IdP/OIDC adapter; API client (it will consume `getAccessToken`/`handleUnauthorized` later); consent capture; account recovery and deletion; admin revocation; telemetry; changing `flags`; any change to `access.ts` semantics (only members pass `/card`; `restoring` is handled by screens, not by the guard).
