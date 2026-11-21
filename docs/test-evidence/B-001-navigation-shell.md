# B-001 Navigation shell — test evidence

**Branch:** feat/B-001-mobile-p0-mock · **Date:** 2026-11-21 · **Evidence class:** PROPOSED (mock-only)
**Environment:** macOS (Darwin 27.2), Node v24.19.0, pnpm 11.22.0, Expo SDK 58, Jest 30 (jest-expo).

## RED → GREEN log

All commands run from `apps/mobile` (`npx jest <path>`) or via `pnpm --filter @kadin/mobile exec jest <path>`.

| Task | Failing run (command → first error line) | Passing run (command → summary line) |
|---|---|---|
| 1 contrast | `jest src/shared/ui/__tests__/tokens-contrast.test.ts` → `Cannot find module '@kadin/design-tokens' from 'src/shared/ui/__tests__/tokens-contrast.test.ts'` | same → `Tests: 11 passed, 11 total` |
| 2 access | `jest src/navigation/__tests__/access.test.ts` → `Could not locate module @/features/auth/domain/session mapped as:` | same → `Tests: 12 passed, 12 total` |
| 2 session | `jest src/features/auth` → `Could not locate module @/features/auth/session-context mapped as:` | `jest src/navigation src/features/auth` → `Tests: 16 passed, 16 total` |
| 3 deep-link | `jest src/navigation/__tests__/deep-link.test.ts` → `Could not locate module @/navigation/deep-link mapped as:` | same → `Tests: 28 passed, 28 total` |
| 4 Button | `jest src/shared/ui/__tests__/Button.test.tsx` → `Could not locate module @/shared/ui/Button mapped as:` | same → `Tests: 3 passed, 3 total` |
| 4 state/badge | `jest …/AsyncStateView.test.tsx …/MockBadge.test.tsx` → `Could not locate module @/shared/ui/AsyncStateView` / `@/shared/ui/MockBadge` | `jest src/shared` → `Tests: 21 passed, 21 total` |
| 5 tabs | `jest src/navigation/__tests__/tabs.test.ts` → `Could not locate module @/navigation/tabs mapped as:` | same → `Tests: 1 passed, 1 total` |
| 5 router | `jest src/navigation/__tests__/router.test.tsx` → `Could not locate module @/app/_layout mapped as:` (after the ESM transform fix below) | same → `Tests: 10 passed, 10 total` |

Deviations recorded during execution:
- Router suite first failed with `Must use import to load ES Module: …/standard-navigation/lib/src/index.js` (an ESM-only dependency of expo-router 58). Fixed by adding `standard-navigation` to the Jest `transformIgnorePatterns` allowlist, then the expected RED above was observed.
- First GREEN attempt: 9/10. `AC-004-02` could not find the card tile by role `button`, because `<Link asChild>` sets `role="link"`. HomeTile now declares `accessibilityRole="link"`, and the test queries role `link`. The behaviour under test (guest taps the card tile and lands on `/sign-in`) is unchanged.
- `tsc` rejected passing the tab navigator's opaque `ColorValue` to Ionicons. The icon tint is now chosen from `focused` using the same two tokens, with no cast.
- `expo-doctor` reported `Missing peer dependency: expo-font` (required by `@expo/vector-icons`). Installed with `npx expo install expo-font` (this also adds its config plugin to `app.json`).
- Lint: `expo install` initially picked eslint 10, and `eslint-plugin-react@7.37.5` crashed on it (peer range ≤9). Pinned `eslint@^9.39.5`.

## Gates

Final run, after all changes including the review fix pass (typecheck, lint, test re-run; expo-doctor and export results are from before the fix pass, which changed no dependencies):

| Command | Result | Output tail |
|---|---|---|
| `pnpm typecheck` | PASS (exit 0) | `packages/design-tokens typecheck: Done` · `apps/mobile typecheck: Done` |
| `pnpm lint` | PASS (exit 0) | `apps/mobile lint$ expo lint` · `apps/mobile lint: Done` |
| `pnpm test` | PASS (exit 0) | `Test Suites: 10 passed, 10 total` · `Tests: 82 passed, 82 total` (after the review fix pass below) |
| `npx expo-doctor` (apps/mobile) | PASS (exit 0) | `Running 20 checks on your project...` · `20/20 checks passed. No issues detected!` |
| `npx expo export --platform android` | PASS (exit 0) | `› android bundles (1): _expo/static/js/android/entry-….hbc (2.9MB)`. Output was written outside the repo, because `apps/mobile/dist` is not git-ignored. Local bundle only; not a native build or a deploy. |
| Manual a11y pass (VoiceOver/TalkBack, 200% font, guest → card → gate → mock sign-in) | **NOT RUN** | No simulator or device was driven in this session. Reproduce with `cd apps/mobile && npx expo start`, then follow plan Task 6 step 2. |

## Acceptance mapping
| Criterion | Test |
|---|---|
| AC-004-01 guest Home without login | router.test › guest lands on Beranda with all four tabs |
| AC-004-02 guest → sign-in gate | router.test › guest opening the member card is sent to the sign-in gate; deep link to /card as guest is gated |
| AC-004-03 malformed deep link → fallback | router.test › malformed content id (`/news/bad%20id`); unknown route. `deep-link.test` covers the `isValidContentId` unit. Note: `/news/../card` never reaches the news detail route; URL parsing resolves it to `/card`, which stays gated (router.test › dot-segment link) |
| AC-004-04 empty state | router.test › News empty state; AsyncStateView.test |
| AC-004-05 labels / focus order | Button, MockBadge, header-role queries (automated); manual screen-reader pass **NOT RUN** |
| EPIC-02 valid back path / no dead ends | router.test › cold deep link back to Beranda; unknown route has a way home |
| Open redirect guard (`returnTo`) | deep-link.test (11 hostile inputs); router.test › external returnTo lands on / |
| Session ends on protected route | router.test › redirects to the gate instead of leaving member content on screen |
| PRD §8 48dp targets, scalable text | Button.test (minHeight/minWidth ≥ 48, no fixed height, allowFontScaling not false). Style-level only; real 200% rendering of the tab bar and headers is part of the manual pass (**NOT RUN**) |
| Mock content visibly labelled | MockBadge.test; router.test › MOCK badge on Beranda for the demo member, none for guests; card shows the badge |
| Demo sign-in off in release builds | flags.test › `resolveMockAuth` (on in `__DEV__`; release needs `EXPO_PUBLIC_MOCK_AUTH=true`) |
| Contrast (WCAG AA) on placeholder tokens | tokens-contrast.test |

## Final review fix pass

A fresh reviewer read the whole branch (68edc77..4f4ef7d). It found nothing Critical. These three items were fixed:

| Finding | Test | RED → GREEN |
|---|---|---|
| `mockAuth` was hard-coded `true`, so a release build would ship the demo sign-in | `flags.test.ts` › resolveMockAuth (3 tests) | `TypeError: (0 , _flags.resolveMockAuth) is not a function` → `Tests: 3 passed, 3 total` |
| Beranda showed "Halo, Anggota Demo" with no MOCK badge | router.test › shows the MOCK badge next to the demo member greeting | `Unable to find an element with accessibility label: Data contoh, bukan data resmi` → `Tests: 12 passed, 12 total` |
| This document overstated `/news/../card` coverage | router.test › dot-segment link stays gated | Characterization test: it pins existing, safe behaviour and passed on its first run. The fix is the corrected AC-004-03 row above. |
