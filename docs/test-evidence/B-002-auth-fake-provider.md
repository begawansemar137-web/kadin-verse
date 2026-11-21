# B-002 Auth interfaces with a fake provider — test evidence

**Branch:** feat/B-002-auth-fake-provider · **Date:** 2026-11-22 · **Evidence class:** PROPOSED (mock-only)
**Spec:** [ADR-003](../adr/ADR-003-identity-integration-boundary.md) ACCEPTED 2026-11-22 · **Plan:** [2026-11-22-b002-auth-fake-provider](../superpowers/plans/2026-11-22-b002-auth-fake-provider.md)
**Environment:** macOS (Darwin 27.2), Node v24.19.0, pnpm 11.22.0, Expo SDK 58, Jest 30 (jest-expo), RNTL 14.

## RED → GREEN log

All commands run from `apps/mobile` with `pnpm exec jest <path>`.

| Task | Failing run (first error) | Passing run |
|---|---|---|
| 1 credentials model | `…/credentials.test.ts` → `Could not locate module @/features/auth/domain/credentials` | same → `Tests: 17 passed, 17 total` |
| 2 ports, fake provider, stores | `…/fake-auth-provider.test.ts …/credential-stores.test.ts` → `Could not locate module @/features/auth/data/memory-credential-store` (and fake provider) | same → `Tests: 13 passed, 13 total`; full suite → `Tests: 115 passed, 115 total` |
| 3 AuthService | `…/auth-service.test.ts` → `Could not locate module @/features/auth/domain/auth-service` | same → `Tests: 30 passed, 30 total`; with `access.test.ts` → `43 passed` |
| 4 React binding and wiring | `…/session-context.test.tsx …/default-auth-service.test.ts` → `Could not locate module @/features/auth/default-auth-service`; context suite `4 failed, 1 passed` | same → `Tests: 7 passed, 7 total` |
| 5 screens and journeys | `…/Button.test.tsx …/router.test.tsx` → `8 failed, 12 passed` (Button disabled; 3 B-001 journeys on the removed `signInMock`; protected-route sign-out; 3 new B-002 journeys) | same → `Tests: 20 passed, 20 total` |

Deviations recorded during execution (ledger rulings):
- **Task 3:** the plan missed that `src/navigation/__tests__/access.test.ts` also imported the removed `MOCK_MEMBER`. It now uses a local member literal. A test was added pinning existing guard behavior: a `restoring` session does not pass `/card`. That test passes without a code change, because it pins the current guard rather than adding behavior.
- **Task 5:** the lint gate failed with `react/display-name` on the curried test wrapper in `session-context.test.tsx` (Task 4 code). The inner component is now named. No rule was disabled.

## Gates (fresh run on 4b1f684)

| Gate | Command (from `apps/mobile`) | Result |
|---|---|---|
| Typecheck | `pnpm typecheck` | exit 0 |
| Lint | `pnpm lint` | exit 0, no warnings |
| Unit + component + router | `pnpm exec jest` | `Test Suites: 16 passed, 16 total` · `Tests: 153 passed, 153 total` |

Typecheck was red between commits cae75e2 and aa4909d (Tasks 3–4), as the plan planned. It is green from 4b1f684 on, and the whole series lands in one PR.

## Acceptance mapping

| Criterion | Evidence |
|---|---|
| EPIC-01: after logout, a protected route is denied until re-authentication | router `session ends while on a protected route`, router `member can sign out from Akun and the card is gated again`, auth-service `sign out › becomes guest immediately, clears storage and revokes` |
| EPIC-01 / SDD AUTH-002: expired credentials or an API 401 recover safely without exposing tokens | router `AUTH-002: an expired stored session lands on the gate with an expired notice`; auth-service `handleUnauthorized` (3 tests) and `access tokens and expiry` (6 tests) |
| SDD AUTH-001: an unauthenticated user on a protected route sees the gate and no private data | router `deep link to /card as guest is gated…`, `dot-segment link /news/../card…` |
| EPIC-06: logout clears local session material | auth-service sign-out tests assert that `store.load()` returns `null` after sign-out, including when revoke throws |
| AGENTS §6: no access tokens in UI state or logs; secure storage only | auth-service `keeps tokens out of the UI session`, session-context `exposes no credentials through the hook`, credential-stores `round-trips through expo-secure-store under one key, device-only` (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`) |
| AGENTS §6: loading, error, offline, expired and success states | card/account `restoring` loading; sign-in failure copy per reason; offline refresh keeps the session; expired notice |
| ADR-003 §6: fake provider only in dev/preview | default-auth-service `uses the fake provider…when demo auth is on` / `has no provider when demo auth is off` |

## Review Focus (from the plan) and the tests that pin them

1. Sign-out during an in-flight sign-in: `sign out › discards a sign-in that completes after sign-out`.
2. Corrupt or old-format stored session: credentials `rejects …` (11 cases); auth-service `discards a corrupt stored session and clears it`.
3. Concurrent token requests at expiry: `refreshes once for concurrent callers when the token has expired`.
4. Offline cold start with an expired token: `stays signed in when offline at launch with an expired token`.
5. Secure storage failing: `treats an unreadable store as signed out`, `still signs in for this run when secure storage cannot save`, `still signs out when storage cannot be cleared`.

## NOT RUN

- **On-device secure storage (Android/iOS).** Jest replaces `expo-secure-store` with an in-memory mock, so persistence across app restarts on a real keystore is unverified. To reproduce: build with `npx eas-cli@latest build --profile preview --platform android` (and iOS), sign in with the demo account, force-quit, reopen, and confirm Beranda still greets "Anggota Demo". Then sign out, force-quit, reopen, and confirm guest.
- **Screen-reader pass** of the new alert texts (expired notice, sign-in failure) and of the disabled sign-in button state.

## Open items

- PRD D-03 (login method and IdP) is still open; no real adapter exists.
- Token lifetime (fake: 15 min) and the 30 s expiry skew are placeholders pending security approval.
- Storing `displayName` on the device needs a privacy review (ADR-003 Consequences).
- The new Indonesian copy is PROPOSED and needs UX/editorial approval.
