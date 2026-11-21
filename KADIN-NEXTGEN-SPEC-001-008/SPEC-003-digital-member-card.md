# SPEC-003 — Digital Member Card & QR Verification

**Project:** KADIN Indonesia Next Generation Mobile Platform  
**Version:** 1.0 (proposed) · **Priority:** P0 · **Traceability:** EPIC-03 / PRD §6 / SDD §§6–12  
**Approval:** Product Owner + Architect + Security/Data Owner as applicable  

## 1. Objective and boundaries
Display a digital card and issue short-lived server-verifiable challenges only for verified active members. QR does not prove membership without authorized online verification.

**In scope:** Core feature, typed interfaces, mobile/admin UI where applicable, synthetic/mock adapters, security enforcement, automated tests.  
**Out of scope:** Reverse-engineered proprietary code, live third-party integration without authorization, P1/P2 extensions, undocumented business policies.

## 2. Actors and user stories
- US-003-A As a verified member, I can display my digital card.
- US-003-B As a verified member, I can generate a time-limited QR challenge.
- US-003-C As an authorized verifier, I can validate a QR and see minimal approved status.
- US-003-D As a member, I receive a clear expiry/revocation message.

## 3. Functional design and UI states
- Implement a typed state model with **idle / loading / success / empty / error / offline** where relevant; protected flows add **unauthenticated / forbidden**.
- Ensure screen-reader labels, large text support, explicit retry, deterministic back navigation, and no silent error suppression.
- Feature flag unapproved integrations; synthetic fixtures must be visibly marked in non-production builds.
- Define DTO schemas with runtime validation and map API errors to safe user messages.

## 4. Business rules
- BR-001 Only verified_active membership can request a challenge.
- BR-002 Challenge token must be unpredictable, short-lived, server-verifiable and single-use; TTL/clock skew are approval-gated.
- BR-003 Store only nonce hash, not raw QR bearer value; revoke on membership revocation.
- BR-004 Verification requires separate verifier entitlement, not simply admin role.
- BR-005 Never include personal IDs or full profile in QR payload.
- BR-006 Screenshots or cached QR must not be accepted after consumption or expiry.

## 5. Proposed data schema
`qr_challenges(id uuid PK, membership_link_id uuid FK, nonce_hash text UNIQUE NOT NULL, issued_at timestamptz, expires_at timestamptz, consumed_at timestamptz NULL, revoked_at timestamptz NULL, created_by uuid FK)`; index `(membership_link_id, expires_at)`; atomic consume transaction with unique nonce hash.

**Database controls:** UUID PK, UTC timestamps, FK and uniqueness constraints, indexed access paths, reversible migrations, no production PII in fixtures. Data retention and encryption classification require approval.

## 6. API contracts (provisional)
`POST /api/v1/membership/qr-tokens` [verified member] body `{}` → 201 `{ "challenge":"opaque-token", "expiresAt":"2026-11-18T10:01:00Z" }` (illustrative expiry only); 403 `MEMBERSHIP_NOT_VERIFIED`. `POST /api/v1/membership/verify` [verifier] body `{ "challenge":"opaque-token" }` → 200 `{ "valid":true, "membershipStatus":"verified_active" }`; 409 `QR_ALREADY_USED`; 410 `QR_EXPIRED`. Response fields subject to privacy approval.

**API testing:** Validate success/error payloads, invalid inputs (400/422), unauthenticated (401), unauthorized (403), not found (404), conflict (409) where relevant; no stack traces or secrets. Publish OpenAPI 3.1 schemas and version contract changes.

## 7. Acceptance criteria — Given / When / Then
- **AC-003-01** Given unverified membership When requesting QR Then issuance is denied.
- **AC-003-02** Given active member When generating QR Then an expiring challenge is returned.
- **AC-003-03** Given authorized verifier and unused challenge When verifying Then valid result is returned and challenge consumed atomically.
- **AC-003-04** Given same challenge When verifying again Then replay is rejected.
- **AC-003-05** Given expired or revoked challenge When verifying Then verification fails without PII disclosure.
- **AC-003-06** Given unauthorized user When calling verify Then 403 is returned.

## 8. Test cases and evidence
- **TC-003-01** Unit: nonce validation, expiry/skew, status guard.
- **TC-003-02** Integration: atomic consume under concurrent requests, revocation cascade.
- **TC-003-03** Contract: issue/verify 201/200/403/409/410.
- **TC-003-04** E2E: member card→QR→authorized verification with mock registry.
- **TC-003-05** Security: replay, brute force, rate limits, data minimization.

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

