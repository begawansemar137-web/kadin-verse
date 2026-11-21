# SPEC-007 — Settings, Profile, Consent & Support

**Project:** KADIN Indonesia Next Generation Mobile Platform  
**Version:** 1.0 (proposed) · **Priority:** P0 · **Traceability:** EPIC-06 / PRD §6 / SDD §§6–12  
**Approval:** Product Owner + Architect + Security/Data Owner as applicable  

## 1. Objective and boundaries
Provide profile display, local preferences, privacy notices, explicit consent, support requests and secure sign-out. Data-rights requests require an approved operational workflow.

**In scope:** Core feature, typed interfaces, mobile/admin UI where applicable, synthetic/mock adapters, security enforcement, automated tests.  
**Out of scope:** Reverse-engineered proprietary code, live third-party integration without authorization, P1/P2 extensions, undocumented business policies.

## 2. Actors and user stories
- US-007-A As a user, I can view my profile and adjust non-sensitive preferences.
- US-007-B As a user, I can manage optional notification consent.
- US-007-C As a user, I can access privacy information and request support.
- US-007-D As a member, I can sign out securely.

## 3. Functional design and UI states
- Implement a typed state model with **idle / loading / success / empty / error / offline** where relevant; protected flows add **unauthenticated / forbidden**.
- Ensure screen-reader labels, large text support, explicit retry, deterministic back navigation, and no silent error suppression.
- Feature flag unapproved integrations; synthetic fixtures must be visibly marked in non-production builds.
- Define DTO schemas with runtime validation and map API errors to safe user messages.

## 4. Business rules
- BR-001 Optional consent is not preselected and must record purpose/policy version.
- BR-002 Consent changes are append-only evidence; latest effective state derived from history.
- BR-003 Profile display does not permit unauthorized membership registry edits.
- BR-004 Language/theme preferences can be local; synced settings need approved API.
- BR-005 Support request returns tracking reference without logging sensitive content.
- BR-006 Data deletion/correction requests are routed for policy review; do not promise immediate deletion.

## 5. Proposed data schema
`consent_records(id uuid PK, user_id uuid FK, purpose text, policy_version text, granted boolean, recorded_at timestamptz, source text)` append-only; `support_requests(id uuid PK, user_id uuid NULL FK, category text, description text, status text, tracking_code text UNIQUE, created_at timestamptz)` proposed pending policy; `user_preferences(user_id uuid PK FK, locale text, notifications_enabled boolean, updated_at timestamptz)` only if cross-device sync approved.

**Database controls:** UUID PK, UTC timestamps, FK and uniqueness constraints, indexed access paths, reversible migrations, no production PII in fixtures. Data retention and encryption classification require approval.

## 6. API contracts (provisional)
Reuse `GET /api/v1/me` for profile and OIDC sign-out. Proposed new endpoints **subject to ADR/API review**: `GET /api/v1/me/consents`, `POST /api/v1/me/consents` `{ "purpose":"notifications", "policyVersion":"v1", "granted":false }`, `POST /api/v1/support-requests` `{ "category":"account", "description":"Need assistance" }` → 201 `{ "trackingCode":"SUP-EXAMPLE" }`. Do not implement unapproved production handlers.

**API testing:** Validate success/error payloads, invalid inputs (400/422), unauthenticated (401), unauthorized (403), not found (404), conflict (409) where relevant; no stack traces or secrets. Publish OpenAPI 3.1 schemas and version contract changes.

## 7. Acceptance criteria — Given / When / Then
- **AC-007-01** Given new user When viewing optional consent Then it is not preselected.
- **AC-007-02** Given consent update When saving Then versioned event is recorded and latest state reflected.
- **AC-007-03** Given offline mode When changing local preference Then preference persists locally.
- **AC-007-04** Given valid support request When submitting Then tracking reference is shown.
- **AC-007-05** Given logout When returning to protected settings Then session is required.

## 8. Test cases and evidence
- **TC-007-01** Unit: consent reducer, preference persistence, form validation.
- **TC-007-02** Integration: append-only consent audit, support reference uniqueness.
- **TC-007-03** E2E: change preference→restart→persist; consent revoke; support submit; logout.
- **TC-007-04** Security: PII redaction and account separation.

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

