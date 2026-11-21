# B-001 Navigation Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a mock-only, accessible Expo navigation shell for KADIN Verse (four tabs, a gated member-card route, a sign-in gate, safe fallbacks for unknown or malformed links, and shared loading/empty/error/offline states) that later backlog items (B-002…B-006) plug into.

**Architecture:** Expo Router file routes live in `apps/mobile/src/app/`, and every file there is treated as a route. Business rules live outside that folder as pure TypeScript: access policy, return-path sanitising and content-ID validation in `src/navigation/`, and the session model in `src/features/auth/`. Screens only compose these rules with shared UI from `src/shared/ui/`. Authentication is an in-memory **mock** session (no tokens, no storage), and the gate is a client-side UX guard only, as SAD §6 says (not a security boundary). Design tokens come from `packages/design-tokens` as explicitly **PLACEHOLDER** values.

**Tech Stack:** Expo SDK 58, expo-router 58, React Native 0.88, React 19.3, TypeScript 6 (strict), Jest 30 + jest-expo + @testing-library/react-native 14 + `expo-router/testing-library`, pnpm 11 workspaces.

**Spec:** `PRD.md` (EPIC-02, §7–§8, backlog B-001), `KADIN-NEXTGEN-SPEC-001-008/SPEC-004-home-dashboard.md` (BR-001…BR-005, AC-004-01…05), `SAD.md` §6 and §15 (ADR-001, ADR-002), `SDD.md` §6, `UIUX-ANALYSIS.md` §5.3, `AGENTS.md` §5–§8, `docs/adr/ADR-012-repository-layout-canonicalization.md`.

## Evidence classification

Everything in this plan is **PROPOSED**. Tab set, order and labels; Indonesian copy; token values; route names: none of these come from the legacy APK, and none are approved by UX. Design tokens are **UNKNOWN** per `UIUX-ANALYSIS.md` §5.3, so the plan uses neutral placeholders that pass a contrast test and are labelled `PLACEHOLDER`.

## Approval gates (must clear before Task 1)

| Gate | Status today | What this plan does |
|---|---|---|
| ADR-002 Expo Router vs React Navigation | OPEN | Task 0 drafts it recommending Expo Router (already a dependency). Tasks 1+ wait for approval. |
| ADR-001 Expo managed (CNG) vs prebuild | OPEN | Task 0 drafts it recommending managed/CNG for B-001 only. |
| ADR-012 repository layout | PROPOSED | `apps/mobile` and `packages/design-tokens` already exist on this branch, ahead of approval. **The owner needs to ratify or reject before merge.** This plan does not create any other top-level folders. |
| UX sign-off on tabs, labels, tokens (BR-005) | Not given | All values live in one config file each (`tabs.ts`, `copy/id.ts`, `design-tokens`) so UX can change them without touching screens. |

## Global Constraints

- TypeScript `strict: true` and `noUncheckedIndexedAccess: true` (already in `apps/mobile/tsconfig.json`). No `any`. The only allowed cast is the documented `Href` cast in `safeReturnTo`.
- Add dependencies only with `npx expo install <pkg>` (`apps/mobile/AGENTS.md`). The only new dev dependencies are `eslint` and `eslint-config-expo` for the existing `lint` script, plus `typescript` in `packages/design-tokens`.
- No second router or state library (SDD §3). Session state uses React context only.
- Nothing inside `src/app/` except route files and layouts. Tests go elsewhere, because Expo Router would treat them as routes.
- Indonesian-first copy (PRD §8), all in `src/shared/copy/id.ts`.
- Interactive targets ≥ 48dp (PRD §8: 44–48dp). Use `minHeight`/`minWidth`, never a fixed `height`. Never set `allowFontScaling={false}`.
- No legacy APK assets, logos, colours or icon files. Icons come from `@expo/vector-icons` (Ionicons).
- No tokens, credentials or session data in AsyncStorage, SecureStore or logs. The mock session is in memory only.
- Any mock or synthetic content is visibly labelled with `MockBadge` (SPEC-004 §3).
- No membership state is invented: the card screen says "belum terverifikasi" (B-005 rule).
- No EAS build, store submission or deploy in this plan. Bundling is checked locally with `expo export` only.

## Review Focus

1. **Open redirect through `returnTo`:** `/sign-in?returnTo=https://evil.example` or `//evil.example` must land on `/` after sign-in, never off-app or on an unknown route. Pinned in Task 3 (unit) and Task 5 (router).
2. **Malformed deep links:** `/news/bad%20id`, `/news/../card` and unknown paths must show a "tidak ditemukan" fallback with a route back to Home, not crash or blank-screen. Pinned in Task 3 and Task 5.
3. **Back from a cold deep link:** opening `/news/abc-123` with no history must still have a back path to `/` (EPIC-02 "every route has a valid back path"). Pinned in Task 5 via `unstable_settings.initialRouteName`.
4. **Session ends while on a protected route:** if the session drops to guest while `/card` is open, the user must be redirected to the gate, not left viewing member content. Pinned in Task 5.
5. **Large text (system font scale 200%):** buttons must grow rather than clip, and text must stay scalable. Pinned in Task 4 (no fixed height, `allowFontScaling` never false).

---

## File Structure

```text
docs/adr/ADR-001-expo-workflow.md                     # Task 0 — draft, PROPOSED
docs/adr/ADR-002-navigation-library.md                # Task 0 — draft, PROPOSED
docs/test-evidence/B-001-navigation-shell.md          # Task 6 — commands + observed output

packages/design-tokens/
  package.json                                        # modify: add typecheck script, typescript devDep
  tsconfig.json                                       # create
  src/index.ts                                        # create: PLACEHOLDER tokens
  src/contrast.ts                                     # create: WCAG contrast ratio

apps/mobile/
  package.json                                        # modify: jest setupFiles + moduleNameMapper, eslint devDeps
  eslint.config.js                                    # create
  jest.setup.js                                       # create
  src/shared/copy/id.ts                               # Indonesian UI strings (single source)
  src/shared/config/flags.ts                          # feature flags (mockAuth)
  src/shared/domain/async-state.ts                    # AsyncState<T> union
  src/shared/ui/Button.tsx                            # 48dp accessible button
  src/shared/ui/Screen.tsx                            # safe area + scroll + header heading
  src/shared/ui/AsyncStateView.tsx                    # loading/empty/error/offline/success renderer
  src/shared/ui/MockBadge.tsx                         # visible "mock data" marker
  src/shared/ui/__tests__/*.test.tsx
  src/shared/ui/__tests__/tokens-contrast.test.ts
  src/features/auth/domain/session.ts                 # Session type
  src/features/auth/session-context.tsx               # SessionProvider / useSession (mock)
  src/features/auth/__tests__/session-context.test.tsx
  src/features/home/components/HomeTile.tsx           # Link tile, locked state
  src/navigation/access.ts                            # canAccess / isProtectedPath
  src/navigation/deep-link.ts                         # isValidContentId / safeReturnTo
  src/navigation/tabs.ts                              # tab config (order, labels, icons)
  src/navigation/__tests__/access.test.ts
  src/navigation/__tests__/deep-link.test.ts
  src/navigation/__tests__/tabs.test.ts
  src/navigation/__tests__/router.test.tsx            # renderRouter integration tests
  src/app/_layout.tsx                                 # root Stack + SessionProvider
  src/app/(tabs)/_layout.tsx                          # bottom tabs from TABS
  src/app/(tabs)/index.tsx                            # Beranda
  src/app/(tabs)/news.tsx                             # Berita (empty state until B-003)
  src/app/(tabs)/services.tsx                         # Layanan (empty state until B-004)
  src/app/(tabs)/account.tsx                          # Akun
  src/app/news/[id].tsx                               # detail placeholder, validates id
  src/app/card.tsx                                    # protected, mock card placeholder
  src/app/sign-in.tsx                                 # sign-in gate (mock)
  src/app/+not-found.tsx                              # unknown route fallback
```

Route paths are English (stable deep-link contract: `/`, `/news`, `/news/:id`, `/services`, `/account`, `/card`, `/sign-in`). Visible labels are Indonesian.

---

### Task 0: Draft ADR-001 and ADR-002 (decision gate)

**Files:**
- Create: `docs/adr/ADR-001-expo-workflow.md`
- Create: `docs/adr/ADR-002-navigation-library.md`

**Interfaces:** Produces the decision record that Tasks 1–6 depend on. No code.

- [ ] **Step 1: Write ADR-002**

```markdown
# ADR-002 — Navigation library: Expo Router

**Status:** PROPOSED — pending Architect + UX owner approval
**Date:** 2026-11-21
**Decision owner:** Architect (R/A), UX owner (C), Engineering (C)

## Context
SAD §15 lists ADR-002 (Expo Router vs React Navigation) as OPEN. B-001 needs a navigation shell with
tabs, a protected route, deep-link handling and a not-found fallback (EPIC-02, SPEC-004).
`apps/mobile` on branch `feat/B-001-mobile-p0-mock` already depends on `expo-router ~58.0.32`.

## Options
1. **Expo Router** — file-based routes on top of React Navigation; deep links generated from the file tree;
   typed routes; first-party testing utilities (`expo-router/testing-library`).
2. **React Navigation (direct)** — explicit navigator config; deep-link `linking` config maintained by hand.

## Decision (proposed)
Adopt **Expo Router**, with routes in `apps/mobile/src/app/`. Deep-link paths are derived from file names, so
route files are a public contract: renaming one is a breaking change that needs a note in release docs.

## Consequences
- Deep links work without a hand-written linking table; malformed paths fall to `+not-found`.
- Client route guards (e.g. `/card`) are UX only; the API enforces authorization (SAD §6).
- Non-route code must stay out of `src/app/`.
- Reversible: React Navigation remains underneath; migrating means replacing route files with navigator config.
```

- [ ] **Step 2: Write ADR-001**

```markdown
# ADR-001 — Expo workflow: managed with Continuous Native Generation (B-001 scope)

**Status:** PROPOSED — pending Architect approval
**Date:** 2026-11-21
**Decision owner:** Architect (R/A), Engineering (C), Security (C)

## Context
SAD §15 lists ADR-001 (managed vs prebuild) as OPEN. B-001 uses only Expo SDK modules
(expo-router, react-native-screens, safe-area-context, vector-icons). No custom native code is required.

## Decision (proposed)
Use the **managed workflow with Continuous Native Generation**: `ios/` and `android/` are generated, not
committed (already ignored in `.gitignore`). Native configuration goes in `app.json` / config plugins only.
Re-open this ADR when B-002 (identity provider SDK) or B-006 (QR scanning/verification) introduces native
requirements.

## Consequences
- No local Xcode/Android Studio needed for B-001; device builds would go through EAS once a release ADR exists.
- Any library with native code requires a development build, not Expo Go.
```

- [ ] **Step 3: Commit**

```bash
git add docs/adr/ADR-001-expo-workflow.md docs/adr/ADR-002-navigation-library.md
git commit -m "docs(adr): propose ADR-001 Expo workflow and ADR-002 navigation library

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 4: STOP — request approval**

Ask the human owner to accept or amend ADR-001, ADR-002 and ADR-012. Do not start Task 1 until they explicitly say to proceed.

---

### Task 1: Toolchain baseline + placeholder design tokens

Proves Jest, TypeScript and lint all run. The first real test is the WCAG contrast check on the placeholder tokens.

**Files:**
- Modify: `apps/mobile/package.json` (the `jest` block, plus devDeps via `expo install`)
- Create: `apps/mobile/jest.setup.js`
- Create: `apps/mobile/eslint.config.js`
- Modify: `packages/design-tokens/package.json`
- Create: `packages/design-tokens/tsconfig.json`
- Create: `packages/design-tokens/src/contrast.ts`
- Create: `packages/design-tokens/src/index.ts`
- Test: `apps/mobile/src/shared/ui/__tests__/tokens-contrast.test.ts`

**Interfaces:**
- Produces (`@kadin/design-tokens`): `tokenStatus: 'PLACEHOLDER'`, `color: { background, surface, textPrimary, textSecondary, primary, onPrimary, danger, border }` (hex strings), `space: { xs:4, sm:8, md:16, lg:24, xl:32 }`, `radius: { sm:4, md:8, lg:16 }`, `fontSize: { small:14, body:16, title:22, heading:28 }`, `minTouchTarget: 48`, `contrastRatio(a: string, b: string): number`.

- [ ] **Step 1: Configure Jest in `apps/mobile/package.json`**

Replace the `"jest"` block with:

```json
"jest": {
  "preset": "jest-expo",
  "setupFiles": ["<rootDir>/jest.setup.js"],
  "moduleNameMapper": { "^@/(.*)$": "<rootDir>/src/$1" },
  "transformIgnorePatterns": [
    "node_modules/(?!(.pnpm|(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|react-native-svg|@kadin/.*))"
  ]
}
```

Create `apps/mobile/jest.setup.js`:

```js
// Official mock shipped by react-native-safe-area-context for Jest.
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);
```

- [ ] **Step 2: Write the failing contrast test**

`apps/mobile/src/shared/ui/__tests__/tokens-contrast.test.ts`:

```ts
import { color, contrastRatio, minTouchTarget, tokenStatus } from '@kadin/design-tokens';

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
  });

  it('is symmetric and returns 1 for identical colours', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
    expect(contrastRatio('#1F4E8C', '#1F4E8C')).toBe(1);
  });

  it('rejects malformed hex values', () => {
    expect(() => contrastRatio('red', '#FFFFFF')).toThrow('Invalid hex colour');
  });
});

describe('placeholder design tokens', () => {
  it('are flagged as placeholders until KADIN/UX approval', () => {
    expect(tokenStatus).toBe('PLACEHOLDER');
  });

  it.each([
    ['textPrimary', 'background'],
    ['textSecondary', 'background'],
    ['textSecondary', 'surface'],
    ['onPrimary', 'primary'],
    ['danger', 'background'],
    ['primary', 'background'],
  ] as const)('%s on %s meets WCAG AA 4.5:1', (fg, bg) => {
    expect(contrastRatio(color[fg], color[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it('sets a 48dp minimum touch target', () => {
    expect(minTouchTarget).toBeGreaterThanOrEqual(48);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `pnpm --filter @kadin/mobile exec jest src/shared/ui/__tests__/tokens-contrast.test.ts`
Expected: FAIL with `Cannot find module '@kadin/design-tokens'` (because `src/index.ts` does not exist).

- [ ] **Step 4: Implement the tokens package**

`packages/design-tokens/src/contrast.ts`:

```ts
const channel = (value: number): number => {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string): number => {
  const digits = /^#([0-9a-f]{6})$/i.exec(hex)?.[1];
  if (digits === undefined) {
    throw new Error(`Invalid hex colour: ${hex}`);
  }
  const n = Number.parseInt(digits, 16);
  const r = channel((n >> 16) & 0xff);
  const g = channel((n >> 8) & 0xff);
  const b = channel(n & 0xff);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG 2.x contrast ratio between two #RRGGBB colours (1–21). */
export const contrastRatio = (a: string, b: string): number => {
  const la = luminance(a);
  const lb = luminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
};
```

`packages/design-tokens/src/index.ts`:

```ts
/**
 * PLACEHOLDER tokens. Not KADIN brand values and not derived from the legacy APK
 * (UIUX-ANALYSIS.md §5.3: real tokens are UNKNOWN). Replace only from an approved uiux.md.
 */
export const tokenStatus = 'PLACEHOLDER' as const;

export const color = {
  background: '#FFFFFF',
  surface: '#F4F5F7',
  textPrimary: '#1A1D21',
  textSecondary: '#4A5160',
  primary: '#1F4E8C',
  onPrimary: '#FFFFFF',
  danger: '#B3261E',
  border: '#C9CDD4',
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 4, md: 8, lg: 16 } as const;
export const fontSize = { small: 14, body: 16, title: 22, heading: 28 } as const;
export const minTouchTarget = 48;

export { contrastRatio } from './contrast';
```

`packages/design-tokens/tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

`packages/design-tokens/package.json`:

```json
{
  "name": "@kadin/design-tokens",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": { "typecheck": "tsc --noEmit" },
  "devDependencies": { "typescript": "~6.0.3" }
}
```

Then run `pnpm install` from the repo root.

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @kadin/mobile exec jest src/shared/ui/__tests__/tokens-contrast.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 6: Set up lint**

```bash
cd apps/mobile && npx expo install eslint eslint-config-expo -- --save-dev
```

`apps/mobile/eslint.config.js`. Check the current form against `https://docs.expo.dev/guides/using-eslint/` for SDK 58 before writing:

```js
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([expoConfig, { ignores: ['dist/*', '.expo/*'] }]);
```

Run: `pnpm typecheck && pnpm lint`
Expected: both exit 0. If `tsc` complains that no inputs were found in `apps/mobile`, that's expected until Task 2 adds sources, because the test file counts as an input. Record the actual output.

- [ ] **Step 7: Commit**

```bash
git add packages/design-tokens apps/mobile/package.json apps/mobile/jest.setup.js apps/mobile/eslint.config.js apps/mobile/src/shared/ui/__tests__/tokens-contrast.test.ts pnpm-lock.yaml
git commit -m "feat(B-001): toolchain baseline and placeholder design tokens with contrast tests

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Mock session + access policy

**Files:**
- Create: `apps/mobile/src/features/auth/domain/session.ts`
- Create: `apps/mobile/src/features/auth/session-context.tsx`
- Create: `apps/mobile/src/shared/config/flags.ts`
- Create: `apps/mobile/src/navigation/access.ts`
- Test: `apps/mobile/src/navigation/__tests__/access.test.ts`
- Test: `apps/mobile/src/features/auth/__tests__/session-context.test.tsx`

**Interfaces:**
- Produces:
  - `type Session = { status: 'guest' } | { status: 'member'; displayName: string; isMock: true }`
  - `SessionProvider({ children, initialSession? }: { children: ReactNode; initialSession?: Session })`
  - `useSession(): { session: Session; signInMock: () => void; signOut: () => void }` (throws outside the provider)
  - `MOCK_MEMBER: Session` (`{ status: 'member', displayName: 'Anggota Demo', isMock: true }`)
  - `PROTECTED_PATHS: readonly ['/card']`, `isProtectedPath(path: string): boolean`, `canAccess(path: string, session: Session): boolean`
  - `flags: { mockAuth: true }`

- [ ] **Step 1: Write the failing access test**

`apps/mobile/src/navigation/__tests__/access.test.ts`:

```ts
import { MOCK_MEMBER, type Session } from '@/features/auth/domain/session';
import { canAccess, isProtectedPath } from '@/navigation/access';

const guest: Session = { status: 'guest' };

describe('isProtectedPath', () => {
  it.each(['/card', '/card/', '/card/anything'])('treats %s as protected', (path) => {
    expect(isProtectedPath(path)).toBe(true);
  });

  it.each(['/', '/news', '/services', '/account', '/cardigan', '/news/card'])(
    'treats %s as public',
    (path) => {
      expect(isProtectedPath(path)).toBe(false);
    },
  );
});

describe('canAccess', () => {
  it('lets guests reach public routes (BR-001)', () => {
    expect(canAccess('/', guest)).toBe(true);
    expect(canAccess('/news', guest)).toBe(true);
  });

  it('blocks guests from protected routes (BR-002)', () => {
    expect(canAccess('/card', guest)).toBe(false);
  });

  it('lets members reach protected routes', () => {
    expect(canAccess('/card', MOCK_MEMBER)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @kadin/mobile exec jest src/navigation/__tests__/access.test.ts`
Expected: FAIL with `Cannot find module '@/features/auth/domain/session'`.

- [ ] **Step 3: Implement session type, flags and access policy**

`apps/mobile/src/features/auth/domain/session.ts`:

```ts
/** Mock-only session for B-001. Real identity is B-002 and blocked on ADR-003 / D-03. */
export type Session =
  | { status: 'guest' }
  | { status: 'member'; displayName: string; isMock: true };

export const GUEST: Session = { status: 'guest' };

export const MOCK_MEMBER: Session = {
  status: 'member',
  displayName: 'Anggota Demo',
  isMock: true,
};
```

`apps/mobile/src/shared/config/flags.ts`:

```ts
/** Feature flags for unapproved integrations (SPEC-004 §3). */
export const flags = {
  /** In-memory demo sign-in. Must be false before any non-demo release. */
  mockAuth: true,
} as const;
```

`apps/mobile/src/navigation/access.ts`:

```ts
import type { Session } from '@/features/auth/domain/session';

/** Client-side UX guard only. Authorization is enforced by the API (SAD §6). */
export const PROTECTED_PATHS = ['/card'] as const;

export const isProtectedPath = (path: string): boolean =>
  PROTECTED_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

export const canAccess = (path: string, session: Session): boolean =>
  !isProtectedPath(path) || session.status === 'member';
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm --filter @kadin/mobile exec jest src/navigation/__tests__/access.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing session-context test**

`apps/mobile/src/features/auth/__tests__/session-context.test.tsx`:

```tsx
import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react-native';

import { MOCK_MEMBER } from '@/features/auth/domain/session';
import { SessionProvider, useSession } from '@/features/auth/session-context';

const wrapper = ({ children }: { children: ReactNode }) => (
  <SessionProvider>{children}</SessionProvider>
);

describe('SessionProvider (mock)', () => {
  it('starts as guest', async () => {
    const { result } = await renderHook(() => useSession(), { wrapper });
    expect(result.current.session).toEqual({ status: 'guest' });
  });

  it('signs in as the mock member and signs out again', async () => {
    const { result } = await renderHook(() => useSession(), { wrapper });

    await act(async () => {
      result.current.signInMock();
    });
    expect(result.current.session).toEqual(MOCK_MEMBER);

    await act(async () => {
      result.current.signOut();
    });
    expect(result.current.session).toEqual({ status: 'guest' });
  });

  it('honours initialSession', async () => {
    const { result } = await renderHook(() => useSession(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <SessionProvider initialSession={MOCK_MEMBER}>{children}</SessionProvider>
      ),
    });
    expect(result.current.session).toEqual(MOCK_MEMBER);
  });

  it('throws a clear error outside the provider', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(async () => {
      await renderHook(() => useSession());
    }).rejects.toThrow('useSession must be used inside SessionProvider');
  });
});
```

Note: `render`/`renderHook` may be sync or async depending on the RNTL 14 API. Awaiting is correct either way. Check `https://callstack.github.io/react-native-testing-library/` if a call signature differs.

- [ ] **Step 6: Run it to verify it fails**

Run: `pnpm --filter @kadin/mobile exec jest src/features/auth/__tests__/session-context.test.tsx`
Expected: FAIL with `Cannot find module '@/features/auth/session-context'`.

- [ ] **Step 7: Implement the provider**

`apps/mobile/src/features/auth/session-context.tsx`:

```tsx
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { GUEST, MOCK_MEMBER, type Session } from './domain/session';

type SessionContextValue = {
  session: Session;
  signInMock: () => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

type SessionProviderProps = { children: ReactNode; initialSession?: Session };

/** In-memory only: nothing is persisted, no tokens exist (AGENTS.md §6). */
export const SessionProvider = ({ children, initialSession = GUEST }: SessionProviderProps) => {
  const [session, setSession] = useState<Session>(initialSession);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      signInMock: () => setSession(MOCK_MEMBER),
      signOut: () => setSession(GUEST),
    }),
    [session],
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

- [ ] **Step 8: Run both tests to verify they pass**

Run: `pnpm --filter @kadin/mobile exec jest src/navigation src/features/auth`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/mobile/src/features/auth apps/mobile/src/shared/config apps/mobile/src/navigation
git commit -m "feat(B-001): mock in-memory session and route access policy

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Deep-link helpers (content-ID validation + safe return path)

**Files:**
- Create: `apps/mobile/src/navigation/deep-link.ts`
- Test: `apps/mobile/src/navigation/__tests__/deep-link.test.ts`

**Interfaces:**
- Produces: `isValidContentId(id: string | undefined): id is string` (1–64 chars of `[A-Za-z0-9-]`), `safeReturnTo(raw: string | undefined): Href` (returns a whitelisted in-app path, else `'/'`).

- [ ] **Step 1: Write the failing test**

`apps/mobile/src/navigation/__tests__/deep-link.test.ts`:

```ts
import { isValidContentId, safeReturnTo } from '@/navigation/deep-link';

describe('isValidContentId', () => {
  it.each(['abc-123', 'A1', 'a'.repeat(64)])('accepts %s', (id) => {
    expect(isValidContentId(id)).toBe(true);
  });

  it.each([undefined, '', 'bad id', '../card', '%00', 'a'.repeat(65), 'x/y', 'id?x=1'])(
    'rejects %s',
    (id) => {
      expect(isValidContentId(id)).toBe(false);
    },
  );
});

describe('safeReturnTo', () => {
  it.each([
    ['/card', '/card'],
    ['/account', '/account'],
    ['/news/abc-1', '/news/abc-1'],
    ['/card?x=1', '/card'],
    ['/card/', '/card'],
    ['/', '/'],
  ])('keeps in-app path %s as %s', (raw, expected) => {
    expect(safeReturnTo(raw)).toBe(expected);
  });

  it.each([
    undefined,
    '',
    'https://evil.example',
    '//evil.example',
    '%2F%2Fevil.example',
    '/news/../card',
    '/news/%2E%2E%2Fcard',
    '/unknown',
    '/sign-in',
    '/card\\evil',
    '/%E0%A4%A',
  ])('falls back to / for %s', (raw) => {
    expect(safeReturnTo(raw)).toBe('/');
  });
});
```

`/sign-in` is deliberately not a valid return target, to prevent a gate loop.

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @kadin/mobile exec jest src/navigation/__tests__/deep-link.test.ts`
Expected: FAIL with `Cannot find module '@/navigation/deep-link'`.

- [ ] **Step 3: Implement**

`apps/mobile/src/navigation/deep-link.ts`:

```ts
import type { Href } from 'expo-router';

const CONTENT_ID = /^[A-Za-z0-9-]{1,64}$/;

export const isValidContentId = (id: string | undefined): id is string =>
  id !== undefined && CONTENT_ID.test(id);

/** In-app destinations a sign-in may return to. `/sign-in` is excluded to avoid loops. */
const RETURNABLE: readonly RegExp[] = [
  /^\/$/,
  /^\/news$/,
  /^\/news\/[A-Za-z0-9-]{1,64}$/,
  /^\/services$/,
  /^\/account$/,
  /^\/card$/,
];

const hasUnsafeChars = (value: string): boolean =>
  [...value].some((ch) => ch.charCodeAt(0) < 0x20 || ch === '\\');

const normalize = (raw: string): string | null => {
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;
  const pathOnly = raw.split(/[?#]/, 1)[0] ?? '';
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathOnly);
  } catch {
    return null;
  }
  if (decoded.startsWith('//') || decoded.includes('..') || hasUnsafeChars(decoded)) return null;
  const trimmed = decoded.length > 1 ? decoded.replace(/\/+$/, '') : decoded;
  return RETURNABLE.some((pattern) => pattern.test(trimmed)) ? trimmed : null;
};

/**
 * Sanitises a `returnTo` query value. Anything that is not a known in-app route
 * (external URLs, protocol-relative URLs, traversal, unknown paths) becomes '/'.
 */
export const safeReturnTo = (raw: string | undefined): Href => {
  const path = raw === undefined ? null : normalize(raw);
  // Cast is safe: `path` has been matched against the RETURNABLE whitelist of real routes.
  return (path ?? '/') as Href;
};
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm --filter @kadin/mobile exec jest src/navigation/__tests__/deep-link.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/navigation/deep-link.ts apps/mobile/src/navigation/__tests__/deep-link.test.ts
git commit -m "feat(B-001): validate content ids and sanitise sign-in return paths

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Shared UI: copy, AsyncState, Button, Screen, AsyncStateView, MockBadge

**Files:**
- Create: `apps/mobile/src/shared/copy/id.ts`
- Create: `apps/mobile/src/shared/domain/async-state.ts`
- Create: `apps/mobile/src/shared/ui/Button.tsx`
- Create: `apps/mobile/src/shared/ui/Screen.tsx`
- Create: `apps/mobile/src/shared/ui/AsyncStateView.tsx`
- Create: `apps/mobile/src/shared/ui/MockBadge.tsx`
- Test: `apps/mobile/src/shared/ui/__tests__/Button.test.tsx`
- Test: `apps/mobile/src/shared/ui/__tests__/AsyncStateView.test.tsx`
- Test: `apps/mobile/src/shared/ui/__tests__/MockBadge.test.tsx`

**Interfaces:**
- Consumes: `@kadin/design-tokens` (Task 1).
- Produces:
  - `copy` (the object below; screens read every visible string from it)
  - `type AsyncState<T> = { status: 'idle' } | { status: 'loading' } | { status: 'success'; data: T } | { status: 'empty' } | { status: 'error'; message: string } | { status: 'offline' }`. `message` must already be user-safe.
  - `Button({ label, onPress, variant?: 'primary' | 'secondary', accessibilityHint? })`
  - `Screen({ title, children })`: renders `title` as `accessibilityRole="header"`
  - `AsyncStateView<T>({ state, onRetry, emptyMessage, renderSuccess }: { state: AsyncState<T>; onRetry: () => void; emptyMessage: string; renderSuccess: (data: T) => ReactNode })`
  - `MockBadge()`

- [ ] **Step 1: Create copy and AsyncState (no behaviour, no test)**

`apps/mobile/src/shared/copy/id.ts`:

```ts
/** Indonesian UI copy. PROPOSED, so UX/editorial approval is required (BR-005). */
export const copy = {
  common: {
    back: 'Kembali',
    backHome: 'Kembali ke Beranda',
    retry: 'Coba lagi',
    loading: 'Memuat',
    offline: 'Anda sedang offline. Periksa koneksi lalu coba lagi.',
    mockBadge: 'MOCK · data contoh',
    mockBadgeA11y: 'Data contoh, bukan data resmi',
  },
  tabs: { home: 'Beranda', news: 'Berita', services: 'Layanan', account: 'Akun' },
  home: {
    heading: 'Selamat datang',
    greetingGuest: 'Jelajahi berita dan layanan KADIN.',
    greetingMember: (name: string) => `Halo, ${name}`,
    tileNews: 'Berita terbaru',
    tileServices: 'Katalog layanan',
    tileCard: 'Kartu Anggota',
    lockedHint: 'Perlu masuk sebagai anggota',
  },
  news: {
    heading: 'Berita & Informasi',
    empty: 'Belum ada berita yang diterbitkan.',
    detailTitle: 'Detail Berita',
    detailPlaceholder: 'Isi berita akan tersedia setelah modul Berita aktif.',
    notFound: 'Konten tidak ditemukan.',
  },
  services: { heading: 'Katalog Layanan', empty: 'Belum ada layanan yang tersedia.' },
  account: {
    heading: 'Akun Saya',
    guest: 'Anda belum masuk.',
    signIn: 'Masuk',
    signOut: 'Keluar',
    openCard: 'Lihat Kartu Anggota',
  },
  card: {
    title: 'Kartu Anggota',
    heading: 'Kartu Anggota',
    placeholder: 'Pratinjau kartu. Status keanggotaan belum terverifikasi.',
  },
  signIn: {
    title: 'Masuk',
    heading: 'Masuk ke akun',
    explainer: 'Metode masuk resmi belum ditetapkan. Gunakan akun demo untuk mencoba aplikasi.',
    mockButton: 'Masuk sebagai anggota demo',
  },
  notFound: { heading: 'Halaman tidak ditemukan' },
} as const;
```

`apps/mobile/src/shared/domain/async-state.ts`:

```ts
/** Typed UI state model (SPEC-004 §3). `message` must already be safe to show users. */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'empty' }
  | { status: 'error'; message: string }
  | { status: 'offline' };
```

- [ ] **Step 2: Write the failing Button test**

`apps/mobile/src/shared/ui/__tests__/Button.test.tsx`:

```tsx
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { minTouchTarget } from '@kadin/design-tokens';

import { Button } from '@/shared/ui/Button';

describe('Button', () => {
  it('exposes an accessible button role and label', async () => {
    await render(<Button label="Coba lagi" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeTruthy();
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<Button label="Masuk" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Masuk' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('meets the 48dp minimum and grows with large text instead of clipping', async () => {
    await render(<Button label="Masuk" onPress={jest.fn()} />);
    const style = StyleSheet.flatten(screen.getByRole('button', { name: 'Masuk' }).props.style);
    expect(style.minHeight).toBeGreaterThanOrEqual(minTouchTarget);
    expect(style.minWidth).toBeGreaterThanOrEqual(minTouchTarget);
    expect(style.height).toBeUndefined();
    expect(screen.getByText('Masuk').props.allowFontScaling).not.toBe(false);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `pnpm --filter @kadin/mobile exec jest src/shared/ui/__tests__/Button.test.tsx`
Expected: FAIL with `Cannot find module '@/shared/ui/Button'`.

- [ ] **Step 4: Implement Button**

`apps/mobile/src/shared/ui/Button.tsx`:

```tsx
import { Pressable, StyleSheet, Text } from 'react-native';
import { color, fontSize, minTouchTarget, radius, space } from '@kadin/design-tokens';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  accessibilityHint?: string;
};

export const Button = ({ label, onPress, variant = 'primary', accessibilityHint }: ButtonProps) => {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelSecondary]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: color.primary },
  secondary: { backgroundColor: color.background, borderWidth: 1, borderColor: color.primary },
  pressed: { opacity: 0.85 },
  label: { fontSize: fontSize.body, fontWeight: '600' },
  labelPrimary: { color: color.onPrimary },
  labelSecondary: { color: color.primary },
});
```

- [ ] **Step 5: Run it to verify it passes**

Run: `pnpm --filter @kadin/mobile exec jest src/shared/ui/__tests__/Button.test.tsx`
Expected: PASS.

- [ ] **Step 6: Write the failing AsyncStateView and MockBadge tests**

`apps/mobile/src/shared/ui/__tests__/AsyncStateView.test.tsx`:

```tsx
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { copy } from '@/shared/copy/id';
import type { AsyncState } from '@/shared/domain/async-state';
import { AsyncStateView } from '@/shared/ui/AsyncStateView';

const renderState = (state: AsyncState<string>, onRetry = jest.fn()) =>
  render(
    <AsyncStateView
      state={state}
      onRetry={onRetry}
      emptyMessage="Belum ada data."
      renderSuccess={(data) => <Text>{data}</Text>}
    />,
  );

describe('AsyncStateView', () => {
  it.each<AsyncState<string>>([{ status: 'idle' }, { status: 'loading' }])(
    'announces loading for %o',
    async (state) => {
      await renderState(state);
      expect(screen.getByLabelText(copy.common.loading)).toBeTruthy();
    },
  );

  it('renders success content', async () => {
    await renderState({ status: 'success', data: 'Isi' });
    expect(screen.getByText('Isi')).toBeTruthy();
  });

  it('renders the empty message', async () => {
    await renderState({ status: 'empty' });
    expect(screen.getByText('Belum ada data.')).toBeTruthy();
  });

  it('renders a safe error message with retry', async () => {
    const onRetry = jest.fn();
    await renderState({ status: 'error', message: 'Gagal memuat.' }, onRetry);
    expect(screen.getByText('Gagal memuat.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: copy.common.retry }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders offline guidance with retry', async () => {
    const onRetry = jest.fn();
    await renderState({ status: 'offline' }, onRetry);
    expect(screen.getByText(copy.common.offline)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: copy.common.retry }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
```

`apps/mobile/src/shared/ui/__tests__/MockBadge.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';

import { copy } from '@/shared/copy/id';
import { MockBadge } from '@/shared/ui/MockBadge';

it('is visible and tells screen readers the data is not official', async () => {
  await render(<MockBadge />);
  expect(screen.getByText(copy.common.mockBadge)).toBeTruthy();
  expect(screen.getByLabelText(copy.common.mockBadgeA11y)).toBeTruthy();
});
```

- [ ] **Step 7: Run them to verify they fail**

Run: `pnpm --filter @kadin/mobile exec jest src/shared/ui/__tests__/AsyncStateView.test.tsx src/shared/ui/__tests__/MockBadge.test.tsx`
Expected: FAIL with `Cannot find module '@/shared/ui/AsyncStateView'` and `'@/shared/ui/MockBadge'`.

- [ ] **Step 8: Implement AsyncStateView, MockBadge and Screen**

`apps/mobile/src/shared/ui/AsyncStateView.tsx`:

```tsx
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { color, fontSize, space } from '@kadin/design-tokens';

import { copy } from '@/shared/copy/id';
import type { AsyncState } from '@/shared/domain/async-state';
import { Button } from '@/shared/ui/Button';

type AsyncStateViewProps<T> = {
  state: AsyncState<T>;
  onRetry: () => void;
  emptyMessage: string;
  renderSuccess: (data: T) => ReactNode;
};

export const AsyncStateView = <T,>({
  state,
  onRetry,
  emptyMessage,
  renderSuccess,
}: AsyncStateViewProps<T>) => {
  switch (state.status) {
    case 'idle':
    case 'loading':
      return (
        <View style={styles.center} accessible accessibilityLabel={copy.common.loading}>
          <ActivityIndicator color={color.primary} />
        </View>
      );
    case 'success':
      return <>{renderSuccess(state.data)}</>;
    case 'empty':
      return (
        <View style={styles.center}>
          <Text style={styles.message}>{emptyMessage}</Text>
        </View>
      );
    case 'error':
      return (
        <View style={styles.center}>
          <Text style={[styles.message, styles.error]}>{state.message}</Text>
          <Button label={copy.common.retry} onPress={onRetry} />
        </View>
      );
    case 'offline':
      return (
        <View style={styles.center}>
          <Text style={styles.message}>{copy.common.offline}</Text>
          <Button label={copy.common.retry} onPress={onRetry} />
        </View>
      );
  }
};

const styles = StyleSheet.create({
  center: { paddingVertical: space.xl, alignItems: 'center', gap: space.md },
  message: { fontSize: fontSize.body, color: color.textSecondary, textAlign: 'center' },
  error: { color: color.danger },
});
```

`apps/mobile/src/shared/ui/MockBadge.tsx`:

```tsx
import { StyleSheet, Text, View } from 'react-native';
import { color, fontSize, radius, space } from '@kadin/design-tokens';

import { copy } from '@/shared/copy/id';

export const MockBadge = () => (
  <View style={styles.badge} accessible accessibilityLabel={copy.common.mockBadgeA11y}>
    <Text style={styles.text}>{copy.common.mockBadge}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.danger,
  },
  text: { fontSize: fontSize.small, fontWeight: '700', color: color.danger },
});
```

`apps/mobile/src/shared/ui/Screen.tsx`:

```tsx
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, fontSize, space } from '@kadin/design-tokens';

type ScreenProps = { title: string; children?: ReactNode };

export const Screen = ({ title, children }: ScreenProps) => (
  <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <ScrollView contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {children}
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.background },
  content: { padding: space.md, gap: space.md },
  title: { fontSize: fontSize.heading, fontWeight: '700', color: color.textPrimary },
});
```

- [ ] **Step 9: Run all shared UI tests to verify they pass**

Run: `pnpm --filter @kadin/mobile exec jest src/shared`
Expected: PASS (contrast, Button, AsyncStateView, MockBadge).

- [ ] **Step 10: Commit**

```bash
git add apps/mobile/src/shared
git commit -m "feat(B-001): shared accessible UI primitives and Indonesian copy

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Routes, tab shell, gate and fallbacks + router integration tests

**Files:**
- Create: `apps/mobile/src/navigation/tabs.ts`
- Create: `apps/mobile/src/features/home/components/HomeTile.tsx`
- Create: `apps/mobile/src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/index.tsx`, `src/app/(tabs)/news.tsx`, `src/app/(tabs)/services.tsx`, `src/app/(tabs)/account.tsx`, `src/app/news/[id].tsx`, `src/app/card.tsx`, `src/app/sign-in.tsx`, `src/app/+not-found.tsx`
- Test: `apps/mobile/src/navigation/__tests__/tabs.test.ts`
- Test: `apps/mobile/src/navigation/__tests__/router.test.tsx`

**Interfaces:**
- Consumes: `useSession`, `SessionProvider`, `MOCK_MEMBER` (Task 2); `canAccess` (Task 2); `isValidContentId`, `safeReturnTo` (Task 3); `copy`, `Button`, `Screen`, `AsyncStateView`, `MockBadge` (Task 4); `color` (Task 1).
- Produces: `TABS: readonly TabConfig[]` where `TabConfig = { name: 'index' | 'news' | 'services' | 'account'; label: string; icon: IoniconName }`; `HomeTile({ label, href, locked })`; default-exported route components; `unstable_settings = { initialRouteName: '(tabs)' }` from the root layout.

- [ ] **Step 1: Write the failing tab-config test**

`apps/mobile/src/navigation/__tests__/tabs.test.ts`:

```ts
import { TABS } from '@/navigation/tabs';

it('defines the proposed four tabs in order with Indonesian labels (BR-005: UX to confirm)', () => {
  expect(TABS.map((t) => [t.name, t.label])).toEqual([
    ['index', 'Beranda'],
    ['news', 'Berita'],
    ['services', 'Layanan'],
    ['account', 'Akun'],
  ]);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @kadin/mobile exec jest src/navigation/__tests__/tabs.test.ts`
Expected: FAIL with `Cannot find module '@/navigation/tabs'`.

- [ ] **Step 3: Implement the tab config**

`apps/mobile/src/navigation/tabs.ts`:

```ts
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import { copy } from '@/shared/copy/id';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type TabConfig = {
  name: 'index' | 'news' | 'services' | 'account';
  label: string;
  icon: IoniconName;
};

/** PROPOSED order and labels. Change here only, after UX approval (BR-005). */
export const TABS: readonly TabConfig[] = [
  { name: 'index', label: copy.tabs.home, icon: 'home-outline' },
  { name: 'news', label: copy.tabs.news, icon: 'newspaper-outline' },
  { name: 'services', label: copy.tabs.services, icon: 'briefcase-outline' },
  { name: 'account', label: copy.tabs.account, icon: 'person-circle-outline' },
];
```

Run: `pnpm --filter @kadin/mobile exec jest src/navigation/__tests__/tabs.test.ts`
Expected: PASS.

- [ ] **Step 4: Write the failing router integration test**

`apps/mobile/src/navigation/__tests__/router.test.tsx`. Before writing it, confirm the `renderRouter` map format (component or module object per route key) at `https://docs.expo.dev/router/reference/testing/` for SDK 58.

```tsx
import { Stack, router } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { act, fireEvent } from '@testing-library/react-native';

import * as RootLayout from '@/app/_layout';
import * as TabsLayout from '@/app/(tabs)/_layout';
import * as Home from '@/app/(tabs)/index';
import * as News from '@/app/(tabs)/news';
import * as Services from '@/app/(tabs)/services';
import * as Account from '@/app/(tabs)/account';
import * as NewsDetail from '@/app/news/[id]';
import * as Card from '@/app/card';
import * as SignIn from '@/app/sign-in';
import * as NotFound from '@/app/+not-found';
import { MOCK_MEMBER } from '@/features/auth/domain/session';
import { SessionProvider, useSession } from '@/features/auth/session-context';
import { copy } from '@/shared/copy/id';
import { Button } from '@/shared/ui/Button';

const routes = {
  _layout: RootLayout,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Home,
  '(tabs)/news': News,
  '(tabs)/services': Services,
  '(tabs)/account': Account,
  'news/[id]': NewsDetail,
  card: Card,
  'sign-in': SignIn,
  '+not-found': NotFound,
};

const open = (initialUrl: string) => renderRouter(routes, { initialUrl });

const signInFromGate = async () => {
  await fireEvent.press(screen.getByRole('button', { name: copy.signIn.mockButton }));
};

describe('B-001 navigation shell', () => {
  it('AC-004-01: guest lands on Beranda with all four tabs, no login required', async () => {
    await open('/');
    expect(screen).toHavePathname('/');
    expect(screen.getByRole('header', { name: copy.home.heading })).toBeTruthy();
    for (const label of Object.values(copy.tabs)) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it('switches tabs and shows the News empty state (AC-004-04)', async () => {
    await open('/');
    await fireEvent.press(screen.getByText(copy.tabs.news));
    expect(screen).toHavePathname('/news');
    expect(screen.getByText(copy.news.empty)).toBeTruthy();
  });

  it('AC-004-02: guest opening the member card is sent to the sign-in gate', async () => {
    await open('/');
    await fireEvent.press(screen.getByRole('button', { name: new RegExp(copy.home.tileCard) }));
    expect(screen).toHavePathname('/sign-in');
    expect(screen.getByRole('header', { name: copy.signIn.heading })).toBeTruthy();
  });

  it('deep link to /card as guest is gated, and mock sign-in returns to /card', async () => {
    await open('/card');
    expect(screen).toHavePathname('/sign-in');
    await signInFromGate();
    expect(screen).toHavePathname('/card');
    expect(screen.getByText(copy.card.placeholder)).toBeTruthy();
    expect(screen.getByLabelText(copy.common.mockBadgeA11y)).toBeTruthy();
  });

  it('ignores an external returnTo and lands on / (open-redirect guard)', async () => {
    await open('/sign-in?returnTo=https%3A%2F%2Fevil.example');
    await signInFromGate();
    expect(screen).toHavePathname('/');
  });

  it('cold deep link to news detail still has a back path to Beranda', async () => {
    await open('/news/abc-123');
    expect(screen.getByText(copy.news.detailPlaceholder)).toBeTruthy();
    expect(router.canGoBack()).toBe(true);
    await act(async () => {
      router.back();
    });
    expect(screen).toHavePathname('/');
  });

  it('AC-004-03: malformed content id shows a safe fallback with a way home', async () => {
    await open('/news/bad%20id');
    expect(screen.getByText(copy.news.notFound)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: copy.common.backHome }));
    expect(screen).toHavePathname('/');
  });

  it('unknown route shows not-found with a way home (no dead end)', async () => {
    await open('/does-not-exist');
    expect(screen.getByRole('header', { name: copy.notFound.heading })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: copy.common.backHome }));
    expect(screen).toHavePathname('/');
  });

  it('member can sign out from Akun and the card is gated again', async () => {
    await open('/account');
    await fireEvent.press(screen.getByRole('button', { name: copy.account.signIn }));
    await signInFromGate();
    expect(screen).toHavePathname('/account');
    await fireEvent.press(screen.getByRole('button', { name: copy.account.signOut }));
    expect(screen.getByText(copy.account.guest)).toBeTruthy();
    await act(async () => {
      router.push('/card');
    });
    expect(screen).toHavePathname('/sign-in');
  });
});

describe('session ends while on a protected route', () => {
  const SignOutProbe = () => {
    const { signOut } = useSession();
    return <Button label="probe-sign-out" onPress={signOut} />;
  };

  const ProbeLayout = () => (
    <SessionProvider initialSession={MOCK_MEMBER}>
      <Stack />
      <SignOutProbe />
    </SessionProvider>
  );

  it('redirects to the gate instead of leaving member content on screen', async () => {
    await renderRouter(
      { _layout: ProbeLayout, card: Card, 'sign-in': SignIn, index: Home },
      { initialUrl: '/card' },
    );
    expect(screen.getByText(copy.card.placeholder)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'probe-sign-out' }));
    expect(screen).toHavePathname('/sign-in');
    expect(screen.queryByText(copy.card.placeholder)).toBeNull();
  });
});
```

- [ ] **Step 5: Run it to verify it fails**

Run: `pnpm --filter @kadin/mobile exec jest src/navigation/__tests__/router.test.tsx`
Expected: FAIL with `Cannot find module '@/app/_layout'`.

- [ ] **Step 6: Implement HomeTile and route files**

`apps/mobile/src/features/home/components/HomeTile.tsx`:

```tsx
import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { color, fontSize, minTouchTarget, radius, space } from '@kadin/design-tokens';

import { copy } from '@/shared/copy/id';

type HomeTileProps = { label: string; href: Href; locked?: boolean };

export const HomeTile = ({ label, href, locked = false }: HomeTileProps) => (
  <Link href={href} asChild>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={locked ? `${label}, ${copy.home.lockedHint}` : label}
      style={styles.tile}
    >
      <Text style={styles.label}>{label}</Text>
      {locked ? <Text style={styles.hint}>{copy.home.lockedHint}</Text> : null}
    </Pressable>
  </Link>
);

const styles = StyleSheet.create({
  tile: {
    minHeight: minTouchTarget,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    justifyContent: 'center',
  },
  label: { fontSize: fontSize.title, fontWeight: '600', color: color.textPrimary },
  hint: { fontSize: fontSize.small, color: color.textSecondary },
});
```

`apps/mobile/src/app/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';

import { SessionProvider } from '@/features/auth/session-context';
import { copy } from '@/shared/copy/id';

/** Ensures a cold deep link (e.g. /news/abc) still has the tabs underneath to go back to. */
export const unstable_settings = { initialRouteName: '(tabs)' };

const RootLayout = () => (
  <SessionProvider>
    <Stack screenOptions={{ headerBackTitle: copy.common.back }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="news/[id]" options={{ title: copy.news.detailTitle }} />
      <Stack.Screen name="card" options={{ title: copy.card.title }} />
      <Stack.Screen name="sign-in" options={{ title: copy.signIn.title }} />
    </Stack>
  </SessionProvider>
);

export default RootLayout;
```

`apps/mobile/src/app/(tabs)/_layout.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { color } from '@kadin/design-tokens';

import { TABS } from '@/navigation/tabs';

const TabsLayout = () => (
  <Tabs
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: color.primary,
      tabBarInactiveTintColor: color.textSecondary,
    }}
  >
    {TABS.map((tab) => (
      <Tabs.Screen
        key={tab.name}
        name={tab.name}
        options={{
          title: tab.label,
          tabBarIcon: ({ color: tint, size }) => (
            <Ionicons name={tab.icon} color={tint} size={size} />
          ),
        }}
      />
    ))}
  </Tabs>
);

export default TabsLayout;
```

`apps/mobile/src/app/(tabs)/index.tsx`:

```tsx
import { StyleSheet, Text } from 'react-native';
import { color, fontSize } from '@kadin/design-tokens';

import { useSession } from '@/features/auth/session-context';
import { HomeTile } from '@/features/home/components/HomeTile';
import { canAccess } from '@/navigation/access';
import { copy } from '@/shared/copy/id';
import { Screen } from '@/shared/ui/Screen';

const HomeScreen = () => {
  const { session } = useSession();
  const greeting =
    session.status === 'member'
      ? copy.home.greetingMember(session.displayName)
      : copy.home.greetingGuest;

  return (
    <Screen title={copy.home.heading}>
      <Text style={styles.greeting}>{greeting}</Text>
      <HomeTile label={copy.home.tileNews} href="/news" />
      <HomeTile label={copy.home.tileServices} href="/services" />
      <HomeTile label={copy.home.tileCard} href="/card" locked={!canAccess('/card', session)} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  greeting: { fontSize: fontSize.body, color: color.textSecondary },
});

export default HomeScreen;
```

`apps/mobile/src/app/(tabs)/news.tsx`:

```tsx
import { copy } from '@/shared/copy/id';
import type { AsyncState } from '@/shared/domain/async-state';
import { AsyncStateView } from '@/shared/ui/AsyncStateView';
import { Screen } from '@/shared/ui/Screen';

/** Content arrives with B-003. Until then the feed is honestly empty. */
const state: AsyncState<never> = { status: 'empty' };

const NewsScreen = () => (
  <Screen title={copy.news.heading}>
    <AsyncStateView
      state={state}
      onRetry={() => undefined}
      emptyMessage={copy.news.empty}
      renderSuccess={() => null}
    />
  </Screen>
);

export default NewsScreen;
```

`apps/mobile/src/app/(tabs)/services.tsx`:

```tsx
import { copy } from '@/shared/copy/id';
import type { AsyncState } from '@/shared/domain/async-state';
import { AsyncStateView } from '@/shared/ui/AsyncStateView';
import { Screen } from '@/shared/ui/Screen';

/** Catalogue arrives with B-004. */
const state: AsyncState<never> = { status: 'empty' };

const ServicesScreen = () => (
  <Screen title={copy.services.heading}>
    <AsyncStateView
      state={state}
      onRetry={() => undefined}
      emptyMessage={copy.services.empty}
      renderSuccess={() => null}
    />
  </Screen>
);

export default ServicesScreen;
```

`apps/mobile/src/app/(tabs)/account.tsx`:

```tsx
import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { color, fontSize } from '@kadin/design-tokens';

import { useSession } from '@/features/auth/session-context';
import { copy } from '@/shared/copy/id';
import { Button } from '@/shared/ui/Button';
import { MockBadge } from '@/shared/ui/MockBadge';
import { Screen } from '@/shared/ui/Screen';

const AccountScreen = () => {
  const { session, signOut } = useSession();

  if (session.status === 'guest') {
    return (
      <Screen title={copy.account.heading}>
        <Text style={styles.body}>{copy.account.guest}</Text>
        <Button
          label={copy.account.signIn}
          onPress={() => router.push({ pathname: '/sign-in', params: { returnTo: '/account' } })}
        />
      </Screen>
    );
  }

  return (
    <Screen title={copy.account.heading}>
      <MockBadge />
      <Text style={styles.body}>{copy.home.greetingMember(session.displayName)}</Text>
      <Button label={copy.account.openCard} onPress={() => router.push('/card')} />
      <Button variant="secondary" label={copy.account.signOut} onPress={signOut} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: { fontSize: fontSize.body, color: color.textPrimary },
});

export default AccountScreen;
```

`apps/mobile/src/app/news/[id].tsx`:

```tsx
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { color, fontSize } from '@kadin/design-tokens';

import { isValidContentId } from '@/navigation/deep-link';
import { copy } from '@/shared/copy/id';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';

const NewsDetailScreen = () => {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = typeof params.id === 'string' ? params.id : undefined;

  if (!isValidContentId(id)) {
    return (
      <Screen title={copy.news.detailTitle}>
        <Text style={styles.body}>{copy.news.notFound}</Text>
        <Button label={copy.common.backHome} onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  return (
    <Screen title={copy.news.detailTitle}>
      <Text style={styles.body}>{copy.news.detailPlaceholder}</Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: { fontSize: fontSize.body, color: color.textPrimary },
});

export default NewsDetailScreen;
```

`apps/mobile/src/app/card.tsx`:

```tsx
import { Redirect } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { color, fontSize } from '@kadin/design-tokens';

import { useSession } from '@/features/auth/session-context';
import { canAccess } from '@/navigation/access';
import { copy } from '@/shared/copy/id';
import { MockBadge } from '@/shared/ui/MockBadge';
import { Screen } from '@/shared/ui/Screen';

/** Placeholder only. Real card/QR is B-005/B-006, gated on ADR-004/ADR-005. */
const CardScreen = () => {
  const { session } = useSession();

  if (!canAccess('/card', session)) {
    return <Redirect href={{ pathname: '/sign-in', params: { returnTo: '/card' } }} />;
  }

  return (
    <Screen title={copy.card.heading}>
      <MockBadge />
      <Text style={styles.body}>{copy.card.placeholder}</Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: { fontSize: fontSize.body, color: color.textPrimary },
});

export default CardScreen;
```

`apps/mobile/src/app/sign-in.tsx`:

```tsx
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { color, fontSize } from '@kadin/design-tokens';

import { useSession } from '@/features/auth/session-context';
import { safeReturnTo } from '@/navigation/deep-link';
import { flags } from '@/shared/config/flags';
import { copy } from '@/shared/copy/id';
import { Button } from '@/shared/ui/Button';
import { MockBadge } from '@/shared/ui/MockBadge';
import { Screen } from '@/shared/ui/Screen';

/** Sign-in gate. Real identity is B-002 (blocked on ADR-003 / D-03). */
const SignInScreen = () => {
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const { signInMock } = useSession();
  const target = safeReturnTo(typeof params.returnTo === 'string' ? params.returnTo : undefined);

  return (
    <Screen title={copy.signIn.heading}>
      <Text style={styles.body}>{copy.signIn.explainer}</Text>
      {flags.mockAuth ? (
        <>
          <MockBadge />
          <Button
            label={copy.signIn.mockButton}
            onPress={() => {
              signInMock();
              router.replace(target);
            }}
          />
        </>
      ) : null}
      <Button variant="secondary" label={copy.common.backHome} onPress={() => router.replace('/')} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: { fontSize: fontSize.body, color: color.textPrimary },
});

export default SignInScreen;
```

`apps/mobile/src/app/+not-found.tsx`:

```tsx
import { router } from 'expo-router';

import { copy } from '@/shared/copy/id';
import { Button } from '@/shared/ui/Button';
import { Screen } from '@/shared/ui/Screen';

const NotFoundScreen = () => (
  <Screen title={copy.notFound.heading}>
    <Button label={copy.common.backHome} onPress={() => router.replace('/')} />
  </Screen>
);

export default NotFoundScreen;
```

- [ ] **Step 7: Run the router tests to verify they pass**

Run: `pnpm --filter @kadin/mobile exec jest src/navigation/__tests__/router.test.tsx`
Expected: PASS, 10 tests.

If a test fails because of the library API, not the behaviour (for example `toHavePathname` missing, or tab labels exposed under a different role), fix the test's query to match the documented SDK 58 API. **Never weaken the asserted behaviour** (AGENTS.md §7). If the `/news/bad%20id` URL gets routed to `+not-found` instead of the detail screen, the assertion must still find a "tidak ditemukan" message and a way home. Adjust which copy key is queried and record the change in test evidence.

- [ ] **Step 8: Run the full mobile suite**

Run: `pnpm --filter @kadin/mobile test`
Expected: all suites PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/mobile/src/app apps/mobile/src/features/home apps/mobile/src/navigation
git commit -m "feat(B-001): tab shell, member-card gate, sign-in gate and not-found fallbacks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Verification, evidence and status docs

**Files:**
- Create: `docs/test-evidence/B-001-navigation-shell.md`
- Modify: `README.md` (the `Status:` line)

**Interfaces:** Consumes everything above. No new code.

- [ ] **Step 1: Run every gate with the checked-in scripts and capture the output**

```bash
pnpm typecheck
pnpm lint
pnpm test
cd apps/mobile && npx expo-doctor
cd apps/mobile && npx expo export --platform android --output-dir dist
```

Expected: every command exits 0. `expo export` only bundles locally (dist/ is git-ignored). It's **not** a build or a deploy.
If `expo-doctor` flags pnpm isolated-install issues or unused native deps, record them verbatim. Do not "fix" by changing `node-linker` without asking.

- [ ] **Step 2: Manual accessibility pass (only if a simulator or device is available, otherwise record NOT RUN)**

```bash
cd apps/mobile && npx expo start
```

Check: VoiceOver/TalkBack reads tab labels and headings in order; with the system font size at its largest, buttons grow and nothing is clipped; with a guest session, Beranda → Kartu Anggota → gate → mock sign-in → card shows the MOCK badge.

- [ ] **Step 3: Write test evidence**

`docs/test-evidence/B-001-navigation-shell.md`. Paste the **actual** output tails. Do not paraphrase.

```markdown
# B-001 Navigation shell — test evidence

**Branch:** feat/B-001-mobile-p0-mock · **Date:** <execution date> · **Evidence class:** PROPOSED (mock-only)

## RED → GREEN log
| Task | Failing run (command → first error line) | Passing run (command → summary line) |
|---|---|---|
| 1 contrast | … | … |
| 2 access / session | … | … |
| 3 deep-link | … | … |
| 4 shared UI | … | … |
| 5 router | … | … |

## Gates
| Command | Result | Output tail |
|---|---|---|
| pnpm typecheck | | |
| pnpm lint | | |
| pnpm test | | |
| npx expo-doctor | | |
| npx expo export --platform android | | |
| Manual a11y pass | PASS / FAIL / NOT RUN | |

## Acceptance mapping
| Criterion | Test |
|---|---|
| AC-004-01 guest Home without login | router.test › guest lands on Beranda |
| AC-004-02 guest → sign-in gate | router.test › guest opening the member card |
| AC-004-03 malformed deep link → fallback | router.test › malformed content id; deep-link.test |
| AC-004-04 empty state | router.test › News empty state; AsyncStateView.test |
| AC-004-05 labels / focus order | Button, MockBadge, header-role queries; manual pass |
| EPIC-02 valid back path / no dead ends | router.test › cold deep link back; unknown route |
| PRD §8 48dp targets, scalable text | Button.test |
| Contrast (WCAG AA) on placeholder tokens | tokens-contrast.test |
```

The `<execution date>` and table cells are filled with real observed values during execution. They are evidence slots, not plan gaps.

- [ ] **Step 4: Update README status**

In `README.md`, replace the `> **Status:**` line with:

```markdown
> **Status:** B-001 navigation shell (mock-only) on `feat/B-001-mobile-p0-mock`. Architecture and repository layout remain **PROPOSED** pending ADR-001, ADR-002 and ADR-012 approval. No live auth, membership, QR or backend.
```

- [ ] **Step 5: Commit**

```bash
git add docs/test-evidence/B-001-navigation-shell.md README.md
git commit -m "docs(B-001): record verification evidence and update status

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Report in the AGENTS.md §12 format and stop.** No PR, EAS build or deploy without a separate explicit request.

---

## Open questions for the owner (not blocking Task 0)

1. `apps/mobile/package.json` already includes `qrcode` and `expo-secure-store`, which B-001 doesn't use. Should they stay in place for B-006/B-002, or be removed until those items start?
2. Untracked `BRD.md` at the repo root isn't referenced by AGENTS.md's reading order. Should it be committed, and where does it sit in the source hierarchy?
3. Should the proposed four tabs (Beranda / Berita / Layanan / Akun), with the member card reached from Home and Akun rather than as its own tab, go to UX review? The legacy QR tab is evidence-only (`UIUX-ANALYSIS.md` NAV rows are confidence "I").
