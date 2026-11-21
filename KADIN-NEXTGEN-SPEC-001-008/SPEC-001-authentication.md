# SPEC-001 — Authentication & Session Management

**Project:** KADIN Indonesia Next Generation Mobile Platform  
**Version:** 1.0 (proposed) · **Priority:** P0 · **Traceability:** EPIC-01 / PRD §6 / SDD §§6–12  
**Approval:** Product Owner + Architect + Security/Data Owner as applicable  

## 1. Objective and boundaries
Guests can browse public content; authenticated users access `/me` and protected routes. Production OIDC identity provider, claims mapping, revocation and recovery flows require ADR-003 approval.

**In scope:** Core feature, typed interfaces, mobile/admin UI where applicable, synthetic/mock adapters, security enforcement, automated tests.  
**Out of scope:** Reverse-engineered proprietary code, live third-party integration without authorization, P1/P2 extensions, undocumented business policies.

## 2. Actors and user stories
- US-001-A As a guest, I can open public Home/News/Services without signing in.
- US-001-B As a member, I can sign in with an approved provider and return to my intended route.
- US-001-C As a signed-in user, I can sign out and lose access to protected content.
- US-001-D As an administrator, I can revoke a compromised session under approved policy.

## 3. Functional design and UI states
- Implement a typed state model with **idle / loading / success / empty / error / offline** where relevant; protected flows add **unauthenticated / forbidden**.
- Ensure screen-reader labels, large text support, explicit retry, deterministic back navigation, and no silent error suppression.
- Feature flag unapproved integrations; synthetic fixtures must be visibly marked in non-production builds.
- Define DTO schemas with runtime validation and map API errors to safe user messages.

## 4. Business rules
- BR-001 Guest cannot access `/me`, membership or QR screens.
- BR-002 OIDC Authorization Code + PKCE; never use embedded client secret or password collection inside app.
- BR-003 Persist tokens only in OS secure storage; no tokens in URL, analytics or logs.
- BR-004 On 401, clear invalid session and show reauthentication; prevent retry loops.
- BR-005 Account identity is distinct from authoritative membership status.
- BR-006 Live login, recovery and revocation blocked until IdP/retention approval.

## 5. Proposed data schema
`users(id uuid PK, external_subject text UNIQUE NOT NULL, display_name text NULL, status text CHECK IN ('active','disabled'), created_at timestamptz, updated_at timestamptz)`; `auth_sessions(id uuid PK, user_id uuid FK, refresh_token_hash text NULL, revoked_at timestamptz NULL, expires_at timestamptz, created_at timestamptz)` **only if** backend owns sessions; for pure OIDC, prefer IdP session authority. `audit_events` records revocation and account-security actions. Never store plaintext credentials.

**Database controls:** UUID PK, UTC timestamps, FK and uniqueness constraints, indexed access paths, reversible migrations, no production PII in fixtures. Data retention and encryption classification require approval.

## 6. API contracts (provisional)
`GET /api/v1/me` [Bearer] → 200 `{ "id":"uuid", "displayName":"Sample", "roles":[] }`; 401 `UNAUTHENTICATED`; 403 `ACCOUNT_DISABLED`. Login/logout use approved IdP SDK/OIDC endpoints, **not invented application API routes**. Mock identity adapter for MVP until ADR-003.

**API testing:** Validate success/error payloads, invalid inputs (400/422), unauthenticated (401), unauthorized (403), not found (404), conflict (409) where relevant; no stack traces or secrets. Publish OpenAPI 3.1 schemas and version contract changes.

## 7. Acceptance criteria — Given / When / Then
- **AC-001-01** Given guest When opening a protected route Then a sign-in gate appears without leaking data.
- **AC-001-02** Given a valid mock identity When authentication completes Then `/me` shows only that user and intended route resumes.
- **AC-001-03** Given logout When reopening `/me` Then the app requires sign-in.
- **AC-001-04** Given expired token When API returns 401 Then credentials are cleared and no infinite retry occurs.
- **AC-001-05** Given a disabled account When fetching `/me` Then access is denied.

## 8. Test cases and evidence
- **TC-001-01** Unit: auth state transitions, guard, return URL allowlist, 401 handling.
- **TC-001-02** Integration: JWT validation issuer/audience/expiry in approved test IdP; `/me` isolation.
- **TC-001-03** E2E: guest→gate→mock sign-in→profile→logout→gate.
- **TC-001-04** Security: tampered token, expired token, replayed callback, deep-link injection.

**TDD procedure:** Write a focused failing test (RED), implement minimal behavior (GREEN), refactor while keeping tests green; run repo-specific typecheck, lint, tests, and required build before review. Record commands and results; do not claim tests executed without logs.

## 9. Implementation tasks
1. Confirm open decisions, access rights, and traceability with Product Owner.
2. Create typed DTOs, runtime validators, domain state transitions, and failing tests.
3. Implement data adapters and migrations with synthetic fixtures; verify isolation.
4. Implement screens/API handlers behind feature flags as necessary.
5. Run negative security tests, accessibility checks and API contract tests.
6. Update OpenAPI, traceability, ADRs, and release notes; request review.

## 10. Dependencies, risks and decision gates
- Requires repository bootstrap, environment separation, secure secrets handling, test infrastructure and CI checks.
- Follow SAD ADR-001/002/003/004/005/006/007/008 as applicable. Live identity, membership and QR integration remain blocked pending authoritative approvals.
- UX based on reference APK is **hypothesis unless runtime verified**. Do not present inferred screens or endpoints as recovered facts.


## Engineering contract (applies to this specification)
- **Status:** Proposed / awaiting product and architecture approval. This is an independent implementation specification, not a claim about the reference APK.
- **Source hierarchy:** PRD.md → SAD.md → SDD.md → AGENTS.md; reconcile conflicts through an ADR, not silent changes. API namespace `/api/v1`; provisional canonical naming from SDD §7.
- **Stack:** React Native + Expo + TypeScript strict (mobile); modular TypeScript API; PostgreSQL; scoped web admin. No third-party APK source/assets/secrets in the new repository.
- **API conventions:** JSON; UTC ISO-8601 timestamps; UUID IDs; `X-Request-Id`; error envelope `{ "error": { "code": "...", "message": "...", "requestId": "..." } }`; cursor pagination `{ "data": [], "page": { "nextCursor": null, "limit": 20 } }`.
- **Security:** Server-side authorization and organization scoping, no secrets in logs, validated input, audit on privileged mutations, synthetic test data only until approvals.
- **Definition of Done:** Reviewed specification, RED→GREEN→REFACTOR evidence, passing typecheck/lint/focused and regression tests, API contract tests, accessibility checks, traceability updated, human review. No unverified claim of production readiness.

