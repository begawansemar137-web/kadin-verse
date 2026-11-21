# SPEC-005 — News, Articles & Editorial Workflow

**Project:** KADIN Indonesia Next Generation Mobile Platform  
**Version:** 1.0 (proposed) · **Priority:** P0 · **Traceability:** EPIC-04 / PRD §6 / SDD §§6–12  
**Approval:** Product Owner + Architect + Security/Data Owner as applicable  

## 1. Objective and boundaries
Publish searchable public news through a scoped editorial workflow. Unpublished, scheduled or archived items must not appear in public APIs.

**In scope:** Core feature, typed interfaces, mobile/admin UI where applicable, synthetic/mock adapters, security enforcement, automated tests.  
**Out of scope:** Reverse-engineered proprietary code, live third-party integration without authorization, P1/P2 extensions, undocumented business policies.

## 2. Actors and user stories
- US-005-A As a guest, I can browse and read published news.
- US-005-B As an editor, I can create/edit drafts and submit them for review.
- US-005-C As an approver, I can publish approved content within my organization scope.
- US-005-D As a reader, I can use pagination and see image fallback/alt text.

## 3. Functional design and UI states
- Implement a typed state model with **idle / loading / success / empty / error / offline** where relevant; protected flows add **unauthenticated / forbidden**.
- Ensure screen-reader labels, large text support, explicit retry, deterministic back navigation, and no silent error suppression.
- Feature flag unapproved integrations; synthetic fixtures must be visibly marked in non-production builds.
- Define DTO schemas with runtime validation and map API errors to safe user messages.

## 4. Business rules
- BR-001 Article state: draft→in_review→published→archived; rejection returns to draft.
- BR-002 Editors cannot self-grant approver rights; publish requires scoped approver.
- BR-003 Public feed only published articles with published_at <= now.
- BR-004 Pagination stable and duplicate-free; slug uniqueness scope to be approved.
- BR-005 Media requires safe MIME validation, size limits and meaningful alt text.
- BR-006 Every state transition records actor, scope and timestamp.

## 5. Proposed data schema
`articles(id uuid PK, slug text UNIQUE, title text, summary text, body text, status text CHECK IN ('draft','in_review','published','archived'), organization_id uuid FK, author_id uuid FK, published_at timestamptz NULL, version int DEFAULT 1, created_at timestamptz, updated_at timestamptz)`; `media_assets(id uuid PK, storage_key text, mime_type text, alt_text text, visibility text, owner_id uuid FK)`; `audit_events` for editorial transitions; index `(status,published_at DESC,id DESC)`.

**Database controls:** UUID PK, UTC timestamps, FK and uniqueness constraints, indexed access paths, reversible migrations, no production PII in fixtures. Data retention and encryption classification require approval.

## 6. API contracts (provisional)
`GET /api/v1/public/news?cursor=&limit=` → paginated public article summary; `GET /api/v1/public/news/{id}` → 200 published article or 404. `POST /api/v1/admin/articles` [editor] `{ "title":"Sample", "body":"...", "summary":"..." }` → 201 draft. `POST /api/v1/admin/articles/{id}/submit-review` [editor] → in_review. `POST /api/v1/admin/articles/{id}/publish` [approver] → published. Editing/rejection/media endpoints **TBD**, require OpenAPI change review.

**API testing:** Validate success/error payloads, invalid inputs (400/422), unauthenticated (401), unauthorized (403), not found (404), conflict (409) where relevant; no stack traces or secrets. Publish OpenAPI 3.1 schemas and version contract changes.

## 7. Acceptance criteria — Given / When / Then
- **AC-005-01** Given draft article When querying public feed Then it is absent.
- **AC-005-02** Given scheduled future publication When querying feed Then it is absent until eligible.
- **AC-005-03** Given scoped editor When submitting draft Then status becomes in_review and audit event exists.
- **AC-005-04** Given unauthorized editor When publishing Then 403 and no state change.
- **AC-005-05** Given published feed When paging Then articles are stable without duplicates.
- **AC-005-06** Given broken image When rendering detail Then fallback and alt text behavior is safe.

## 8. Test cases and evidence
- **TC-005-01** Unit: transition guards, scheduling predicate, cursor encoding.
- **TC-005-02** Integration: publish transaction and audit, org scope, pagination.
- **TC-005-03** Contract: public detail/feed DTO, 403/404 errors.
- **TC-005-04** E2E: draft→review→publish→public detail; rejection workflow after contract approval.

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

