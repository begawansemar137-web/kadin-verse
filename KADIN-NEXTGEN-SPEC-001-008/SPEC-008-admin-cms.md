# SPEC-008 — Admin CMS, RBAC & Operations

**Project:** KADIN Indonesia Next Generation Mobile Platform  
**Version:** 1.0 (proposed) · **Priority:** P0 · **Traceability:** EPIC-07 / PRD §6 / SDD §§6–12  
**Approval:** Product Owner + Architect + Security/Data Owner as applicable  

## 1. Objective and boundaries
Provide an auditable scoped administration console for editorial publishing, service ownership and monitoring. Admin does not bypass tenant isolation.

**In scope:** Core feature, typed interfaces, mobile/admin UI where applicable, synthetic/mock adapters, security enforcement, automated tests.  
**Out of scope:** Reverse-engineered proprietary code, live third-party integration without authorization, P1/P2 extensions, undocumented business policies.

## 2. Actors and user stories
- US-008-A As an editor, I can manage drafts in my organization.
- US-008-B As an approver, I can publish reviewed content in my scope.
- US-008-C As an organization admin, I can manage permitted scoped assignments.
- US-008-D As an operator, I can see health indicators and restricted audit records.

## 3. Functional design and UI states
- Implement a typed state model with **idle / loading / success / empty / error / offline** where relevant; protected flows add **unauthenticated / forbidden**.
- Ensure screen-reader labels, large text support, explicit retry, deterministic back navigation, and no silent error suppression.
- Feature flag unapproved integrations; synthetic fixtures must be visibly marked in non-production builds.
- Define DTO schemas with runtime validation and map API errors to safe user messages.

## 4. Business rules
- BR-001 Deny by default; every admin endpoint enforces server-side role + organization scope.
- BR-002 Editor cannot grant roles or publish unless separately entitled.
- BR-003 Regional operator cannot read or mutate another region without explicit grant.
- BR-004 Privileged actions append audit events; audit history cannot be edited by UI.
- BR-005 Role changes require authorized approver, policy and separation-of-duties review.
- BR-006 Member registry synchronization is observational until registry governance approval.

## 5. Proposed data schema
`organizations(id uuid PK, parent_id uuid FK NULL, type text, name text, status text)`; `role_assignments(id uuid PK, user_id uuid FK, organization_id uuid FK, role text, active_from timestamptz, active_until timestamptz NULL)`; `audit_events(id uuid PK, actor_id uuid FK, action text, target_type text, target_id uuid, organization_id uuid FK, request_id text, metadata jsonb, created_at timestamptz)` append-only; `admin_job_runs(id uuid PK, job_type text, status text, started_at timestamptz, finished_at timestamptz NULL)` proposed. Scope hierarchy and role taxonomy require ADR-006.

**Database controls:** UUID PK, UTC timestamps, FK and uniqueness constraints, indexed access paths, reversible migrations, no production PII in fixtures. Data retention and encryption classification require approval.

## 6. API contracts (provisional)
Reuse `POST /api/v1/admin/articles`, `/admin/articles/{id}/submit-review`, `/admin/articles/{id}/publish` with scoped Bearer auth. Additional `GET /api/v1/admin/audit-events`, `GET /api/v1/admin/health`, `POST /api/v1/admin/role-assignments` are **proposals only**, blocked pending ADR-006, audit retention and API review. Return 403 for unauthorized scope, avoid leaking existence of cross-scope records.

**API testing:** Validate success/error payloads, invalid inputs (400/422), unauthenticated (401), unauthorized (403), not found (404), conflict (409) where relevant; no stack traces or secrets. Publish OpenAPI 3.1 schemas and version contract changes.

## 7. Acceptance criteria — Given / When / Then
- **AC-008-01** Given editor When attempting to publish Then operation is rejected without state change.
- **AC-008-02** Given approver in region A When publishing region B article Then access is denied.
- **AC-008-03** Given authorized approver When publishing reviewed article Then status changes and audit is appended.
- **AC-008-04** Given role assignment change When saving Then actor, scope, before/after and timestamp are audited.
- **AC-008-05** Given unauthorized admin request When fetching audit events Then no records are disclosed.

## 8. Test cases and evidence
- **TC-008-01** Unit: policy matrix, scope hierarchy, editorial state guard.
- **TC-008-02** Integration: cross-tenant negative tests, audit immutability, publish atomicity.
- **TC-008-03** Contract: admin 401/403/409 envelopes.
- **TC-008-04** E2E: editor→review→approver→publish; region A vs B denial.

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

