# SPEC-004 — Home Dashboard & Navigation

**Project:** KADIN Indonesia Next Generation Mobile Platform  
**Version:** 1.0 (proposed) · **Priority:** P0 · **Traceability:** EPIC-02 / PRD §6 / SDD §§6–12  
**Approval:** Product Owner + Architect + Security/Data Owner as applicable  

## 1. Objective and boundaries
Deliver public home experience, clear navigation, feature discovery and protected deep-link handling. Home layout is a proposed design, not confirmed APK screen reconstruction.

**In scope:** Core feature, typed interfaces, mobile/admin UI where applicable, synthetic/mock adapters, security enforcement, automated tests.  
**Out of scope:** Reverse-engineered proprietary code, live third-party integration without authorization, P1/P2 extensions, undocumented business policies.

## 2. Actors and user stories
- US-004-A As a guest, I can view news and services on Home.
- US-004-B As a member, I can access membership and profile shortcuts.
- US-004-C As a user, I can recover from empty/error/offline states.
- US-004-D As a screen-reader user, I can navigate with accessible labels and logical focus.

## 3. Functional design and UI states
- Implement a typed state model with **idle / loading / success / empty / error / offline** where relevant; protected flows add **unauthenticated / forbidden**.
- Ensure screen-reader labels, large text support, explicit retry, deterministic back navigation, and no silent error suppression.
- Feature flag unapproved integrations; synthetic fixtures must be visibly marked in non-production builds.
- Define DTO schemas with runtime validation and map API errors to safe user messages.

## 4. Business rules
- BR-001 Home public modules must not require login.
- BR-002 Member-only shortcuts display sign-in gate for guests.
- BR-003 Deep links validate route parameters and authorization before showing content.
- BR-004 All tiles have loading, empty, error and offline states.
- BR-005 Tab ordering, design tokens and search behavior require UX approval.

## 5. Proposed data schema
No dedicated home persistence required for MVP. Optional `home_modules(id uuid PK, key text UNIQUE, title text, enabled boolean, sort_order integer, audience text, organization_id uuid NULL)` only if CMS-driven configuration is approved; otherwise local typed configuration. News/services data sourced from existing endpoints.

**Database controls:** UUID PK, UTC timestamps, FK and uniqueness constraints, indexed access paths, reversible migrations, no production PII in fixtures. Data retention and encryption classification require approval.

## 6. API contracts (provisional)
Reuse `GET /api/v1/public/news?limit=5` and `GET /api/v1/public/services?limit=5`. `GET /api/v1/me` only after authentication. **Do not create `/home` endpoint** unless an ADR approves a BFF aggregation requirement.

**API testing:** Validate success/error payloads, invalid inputs (400/422), unauthenticated (401), unauthorized (403), not found (404), conflict (409) where relevant; no stack traces or secrets. Publish OpenAPI 3.1 schemas and version contract changes.

## 7. Acceptance criteria — Given / When / Then
- **AC-004-01** Given guest When opening Home Then public news and services render without authentication.
- **AC-004-02** Given guest When tapping membership Then sign-in gate is shown.
- **AC-004-03** Given malformed protected deep link When opening Then safe fallback appears.
- **AC-004-04** Given no published content When opening Home Then meaningful empty state appears.
- **AC-004-05** Given screen reader When navigating tiles Then accessible labels and focus order are usable.

## 8. Test cases and evidence
- **TC-004-01** Unit: module visibility by auth state and deep-link parser.
- **TC-004-02** Component: loading/empty/error/offline snapshots and accessibility labels.
- **TC-004-03** Integration: news/services aggregation without exposing protected data.
- **TC-004-04** E2E: public Home→News→back; guest→protected gate.

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

