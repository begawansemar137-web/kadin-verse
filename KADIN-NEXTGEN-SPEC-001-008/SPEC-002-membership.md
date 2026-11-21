# SPEC-002 — Membership Registry & Status

**Project:** KADIN Indonesia Next Generation Mobile Platform  
**Version:** 1.0 (proposed) · **Priority:** P0 · **Traceability:** EPIC-03 / PRD §6 / SDD §§6–12  
**Approval:** Product Owner + Architect + Security/Data Owner as applicable  

## 1. Objective and boundaries
Link a signed-in user to an authoritative membership registry; distinguish unknown, pending, verified_active, verified_expired and unavailable. Never infer active membership from a local profile.

**In scope:** Core feature, typed interfaces, mobile/admin UI where applicable, synthetic/mock adapters, security enforcement, automated tests.  
**Out of scope:** Reverse-engineered proprietary code, live third-party integration without authorization, P1/P2 extensions, undocumented business policies.

## 2. Actors and user stories
- US-002-A As a member, I can view verified status and validity date.
- US-002-B As an applicant, I can see pending/unverified state clearly.
- US-002-C As a member, I can request profile correction through an approved channel.
- US-002-D As an operator, I can diagnose registry sync failure without changing source-of-truth records.

## 3. Functional design and UI states
- Implement a typed state model with **idle / loading / success / empty / error / offline** where relevant; protected flows add **unauthenticated / forbidden**.
- Ensure screen-reader labels, large text support, explicit retry, deterministic back navigation, and no silent error suppression.
- Feature flag unapproved integrations; synthetic fixtures must be visibly marked in non-production builds.
- Define DTO schemas with runtime validation and map API errors to safe user messages.

## 4. Business rules
- BR-001 Registry adapter is read-only unless explicitly authorized.
- BR-002 Only signed and trusted registry response can mark verified_active.
- BR-003 Timeout/failure returns unavailable, never verified_active.
- BR-004 Do not expose registry identifiers or sensitive personal data to other members.
- BR-005 Cache freshness TTL and stale-state labeling require ADR-004.
- BR-006 One active authoritative mapping per user and registry authority; conflicting mappings go to manual review.

## 5. Proposed data schema
`membership_links(id uuid PK, user_id uuid FK, registry_ref text NOT NULL, authority_code text NOT NULL, verification_status text NOT NULL, valid_until timestamptz NULL, checked_at timestamptz NULL, created_at timestamptz)`; UNIQUE(authority_code, registry_ref), partial unique active mapping per user/authority subject to business rules; encrypted or tokenized registry_ref; do not duplicate full registry PII.

**Database controls:** UUID PK, UTC timestamps, FK and uniqueness constraints, indexed access paths, reversible migrations, no production PII in fixtures. Data retention and encryption classification require approval.

## 6. API contracts (provisional)
`GET /api/v1/me/membership` [Bearer] → 200 `{ "status":"verified_active", "validUntil":"2027-12-31T23:59:59Z", "verifiedAt":"2026-11-18T00:00:00Z", "source":"approved_registry" }`; 503 `REGISTRY_UNAVAILABLE`; 404 `MEMBERSHIP_NOT_LINKED`. Correction workflow endpoint is **TBD** pending policy, not to be fabricated.

**API testing:** Validate success/error payloads, invalid inputs (400/422), unauthenticated (401), unauthorized (403), not found (404), conflict (409) where relevant; no stack traces or secrets. Publish OpenAPI 3.1 schemas and version contract changes.

## 7. Acceptance criteria — Given / When / Then
- **AC-002-01** Given verified registry data When opening membership Then verified status and validity are displayed.
- **AC-002-02** Given expired registry membership When loading status Then verified_expired is shown.
- **AC-002-03** Given registry timeout When refreshing Then unavailable is shown without claiming active status.
- **AC-002-04** Given user A When requesting user B membership Then no other-user data is returned.
- **AC-002-05** Given no linked membership When opening card Then an explanatory state is displayed.

## 8. Test cases and evidence
- **TC-002-01** Unit: registry status mapper, expiry boundaries, stale cache labeling.
- **TC-002-02** Integration: registry adapter success/timeout/error and mapping uniqueness.
- **TC-002-03** Contract: membership DTO states and 503 envelope.
- **TC-002-04** Security: cross-user access and PII redaction.

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

