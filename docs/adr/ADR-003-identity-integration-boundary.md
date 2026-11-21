# ADR-003 — Identity integration boundary (mobile client)

**Status:** ACCEPTED — 2026-11-22 (approved by project owner in session; see commit). Open before production:
privacy review of `displayName` at rest; security approval of token lifetime and expiry skew values.
**Date:** 2026-11-22
**Decision owner:** Architect (R/A), Security (A for token handling), Product (C), Engineering (C)
**Backlog:** B-002 (EPIC-01 Identity, onboarding and access)

## Context
- SDD §1 and §8.1 set the direction as OIDC Authorization Code + PKCE via an approved IdP, "ADR-003, blocked
  for live auth". PRD D-03 (login method: OTP, SSO or password) is still **open**, so no IdP can be chosen yet.
- AGENTS.md §8 allows B-002 to start with "auth interfaces, local fake provider, tests", and gates production
  integration on an approved identity/SSO choice and privacy rules.
- B-001 shipped an in-memory mock session (`signInMock`), with demo sign-in limited to dev and preview builds
  (`flags.mockAuth`). There are no tokens, no persistence and no expiry handling yet.
- EPIC-01 acceptance criteria that B-002 has to support: logout denies protected routes until the user signs in
  again; an expired credential (API 401) recovers safely without exposing tokens; logout clears local session
  material (EPIC-06).

This ADR fixes only the **client-side boundary**: what the app depends on, where credentials live, and how the
session reacts to expiry. Choosing the IdP (D-03) will be an amendment to this ADR, or a new ADR.

## Options
1. **Provider-agnostic port plus a fake adapter now (proposed).** The app depends on a small `AuthProvider`
   interface and a `CredentialStore` interface. A synthetic fake implements the provider until D-03 is decided.
2. **Wait for D-03.** Nothing is built. Session handling, expiry and storage would all be designed later,
   under integration time pressure.
3. **Build directly against a candidate IdP SDK.** This pre-empts D-03 and the security review, and AGENTS.md
   §3 forbids it.

## Decision (proposed)
Adopt option 1:

1. **Ports.** `AuthProvider { isMock; signIn(); refresh(refreshToken); revoke(credentials) }` returns typed
   results (`ok` or a failure reason of `cancelled | network | rejected`). It never throws to callers.
   `CredentialStore { load(); save(); clear() }` stores one opaque string. A real OIDC adapter will implement the
   same port. If the IdP needs a separate profile call (`GET /me`), that call happens inside the adapter.
2. **Tokens never enter React state.** An `AuthService`, plain TypeScript and outside React, holds the
   credentials. UI code sees only a `Session` (`restoring | guest | member{displayName,isMock}`). A test asserts
   that the serialised session contains no token.
3. **Persistence.** The stored session is versioned (`v: 1`). It holds the credentials plus a minimal user
   (`subject`, `displayName`) so the app can restore the session offline. It lives in `expo-secure-store`
   (already a dependency) with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, never in AsyncStorage. Unreadable or
   unrecognised data is discarded and the app starts as guest.
4. **Expiry policy.**
   - An access token counts as expired 30 s before `expiresAt` (a placeholder skew).
   - Refreshes are single-flight: concurrent callers share one refresh.
   - If the provider rejects the refresh, local credentials are cleared and the session becomes
     `guest` with an `expired` notice, so the user signs in again.
   - If the refresh fails on the network, the session is kept (offline tolerance) and no token is returned.
   - An API 401 forces one refresh attempt through `handleUnauthorized()`.
5. **Sign-out is local first.** In-memory credentials and the session change synchronously. Then the stored
   session is cleared. Then the provider is asked to revoke, best effort; a revoke failure never keeps the user
   signed in. An in-flight sign-in that finishes after sign-out is discarded.
6. **Provider selection.** The fake provider is wired in only when `flags.mockAuth` is true (dev builds and the
   EAS preview profile). Any other build has no provider: sign-in shows no action, and a leftover stored session
   is cleared.

## Out of scope (still gated)
Choosing an IdP or login method (D-03), the real OIDC/PKCE adapter, the API client and its use of
`getAccessToken`/`handleUnauthorized`, consent capture, account recovery, account deletion, and server-side
revocation by admins (B-007). Token lifetimes and the revocation policy (SDD §9, "short session lifetime and
revocation policy") need security approval; the values in code are placeholders.

## Consequences
- The UI and route guards can be built and tested against real session transitions (restore, expiry, logout)
  before an IdP exists. Swapping in a real adapter does not touch screens.
- Client guards stay UX only. The API remains the authorization boundary (SAD §6).
- Persisting `displayName` on the device is personal data at rest. It is encrypted by the platform keystore but
  still **needs privacy review** before production. If the review rejects it, persist credentials only and fetch
  the profile on restore. That change stays inside `AuthService`.
- If secure storage fails to clear on sign-out, the in-memory session is still guest, but the next launch could
  restore the old session. This is accepted for the fake provider. A real adapter should also revoke on the
  server, which makes such a restore fail at the first refresh.
- Reversible: the ports are small, and replacing the service implementation does not change the `Session` shape
  that screens use.
