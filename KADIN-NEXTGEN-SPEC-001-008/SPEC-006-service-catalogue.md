# SPEC-006 — Service Catalogue & Enquiries

**Project:** KADIN Indonesia Next Generation Mobile Platform  
**Version:** 1.0 (proposed) · **Priority:** P0 · **Traceability:** EPIC-05 / PRD §6 / SDD §§6–12  
**Approval:** Product Owner + Architect + Security/Data Owner as applicable  

## 1. Objective and boundaries
List official KADIN services, eligibility and contacts. Enquiry submission is not proof of service issuance or completion.

**In scope:** Core feature, typed interfaces, mobile/admin UI where applicable, synthetic/mock adapters, security enforcement, automated tests.  
**Out of scope:** Reverse-engineered proprietary code, live third-party integration without authorization, P1/P2 extensions, undocumented business policies.

## 2. Actors and user stories
- US-006-A As a visitor, I can browse active services and read eligibility.
- US-006-B As a user, I can submit an enquiry where enabled.
- US-006-C As a requester, I can see my own enquiry status.
- US-006-D As an operator, I can triage enquiries within assigned scope.

## 3. Functional design and UI states
- Implement a typed state model with **idle / loading / success / empty / error / offline** where relevant; protected flows add **unauthenticated / forbidden**.
- Ensure screen-reader labels, large text support, explicit retry, deterministic back navigation, and no silent error suppression.
- Feature flag unapproved integrations; synthetic fixtures must be visibly marked in non-production builds.
- Define DTO schemas with runtime validation and map API errors to safe user messages.

## 4. Business rules
- BR-001 Public catalogue shows only published/active services; unavailable service shows explicit status.
- BR-002 Each published service requires owner and valid contact/action.
- BR-003 Regional eligibility must be evaluated using approved scope rules.
- BR-004 Service request does not imply issuance, payment, certificate or approval.
- BR-005 Requests require spam/rate controls and audited state changes.
- BR-006 Requester may access own requests; scoped operators only assigned organization.

## 5. Proposed data schema
`services(id uuid PK, code text UNIQUE, title text, description text, status text, category text, organization_id uuid FK, owner_id uuid FK, contact_url text NULL, eligibility_json jsonb, updated_at timestamptz)`; `service_requests(id uuid PK, service_id uuid FK, requester_id uuid FK, organization_id uuid FK, status text CHECK IN ('submitted','triaged','in_progress','resolved','rejected','cancelled'), message text, created_at timestamptz, updated_at timestamptz)`; indexed requester/scope/status; audit event on transitions.

**Database controls:** UUID PK, UTC timestamps, FK and uniqueness constraints, indexed access paths, reversible migrations, no production PII in fixtures. Data retention and encryption classification require approval.

## 6. API contracts (provisional)
`GET /api/v1/public/services?cursor=&limit=` → paginated active services; `GET /api/v1/public/services/{id}` → detail with owner, eligibility, contact, status; `POST /api/v1/service-requests` [user, per policy] `{ "serviceId":"uuid", "message":"Please contact me" }` → 201 `{ "id":"uuid", "status":"submitted" }`; `GET /api/v1/service-requests/{id}` [owner/operator] → status; 403 cross-scope; 422 ineligible/invalid.

**API testing:** Validate success/error payloads, invalid inputs (400/422), unauthenticated (401), unauthorized (403), not found (404), conflict (409) where relevant; no stack traces or secrets. Publish OpenAPI 3.1 schemas and version contract changes.

## 7. Acceptance criteria — Given / When / Then
- **AC-006-01** Given published service When browsing Then its owner and eligibility are visible.
- **AC-006-02** Given unavailable service When viewing Then unavailability is clearly displayed.
- **AC-006-03** Given valid enquiry When submitting Then request ID and submitted status are returned.
- **AC-006-04** Given requester A When reading requester B request Then access is denied.
- **AC-006-05** Given enquiry submission When displaying confirmation Then no claim of issuance is shown.

## 8. Test cases and evidence
- **TC-006-01** Unit: service visibility, eligibility rules, request transitions.
- **TC-006-02** Integration: submit + audit, rate limit, cross-organization denial.
- **TC-006-03** Contract: service feed/detail and request response.
- **TC-006-04** E2E: browse→detail→submit→track with synthetic account.

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

