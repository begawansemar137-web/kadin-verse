# PRD.md — KADIN Indonesia Next Generation Mobile Platform

**Document:** Product Requirements Document | **Version:** 1.0 (proposed baseline) | **Date:** 2026-11-18  
**Status:** Draft for stakeholder validation — not an approved KADIN requirement  
**Reference:** `Kadin_Indonesia_1.0.9_build_8okt_v_1.apk`; `APK-ANALYSIS.md`; `FEATURE-INVENTORY.md`; `UIUX-ANALYSIS.md`

## 1. Executive summary

Build a next-generation KADIN Indonesia mobile application as a trusted member-facing entry point for identity/membership, organizational information, news, events, and business services. Preserve relevant user outcomes while independently designing the codebase, user experience, data contracts and security architecture. The original APK is a **reference for discovery**, not a verified functional specification.

**Evidence boundary:** Static inspection confirms a React Native/Expo/Hermes package, image assets suggest Home, News, QR, Chat, Settings, Login, membership renewal, business directory, and other services. Actual screens, navigation order, working backend, workflows, roles, and data schemas have **not** been verified in an emulator. Every requirement below is a **proposed successor-product requirement**, unless explicitly marked as a verified packaged artifact.

## 2. Problem, vision and outcomes

### Problem hypotheses (validate)
- Members may need a unified digital identity and a reliable way to access KADIN services.
- Business service discovery, regional information and event participation may be fragmented.
- Administrators need auditable content, membership and service-request operations.

### Vision
One secure KADIN mobile entry point: **Discover → Join/Verify → Engage → Access Services → Grow Business**.

### Product outcomes and candidate KPIs
| Outcome | KPI (proposed) | Baseline | Initial target (proposal) |
|---|---|---|---|
| Successful member access | Login success rate | TBD | ≥98% excluding invalid credentials |
| Member engagement | Monthly active authenticated members | TBD | Set after 30-day pilot |
| Identity reliability | Valid QR verification success | TBD | ≥99% under healthy service conditions |
| Content utility | Article detail open rate | TBD | Set after pilot |
| Service access | Completed eligible service-request rate | TBD | Set per service |
| Quality | Crash-free sessions | TBD | ≥99.5% |

Targets are provisional and require baseline measurements and business approval.

## 3. Source traceability and confidence

| Evidence ID | Reference evidence | Supported conclusion | Not established |
|---|---|---|---|
| E-01 | APK config and native libraries | React Native + Expo, Hermes packaged | Source code and actual app logic |
| E-02 | `home-active`, `news-active`, `qr-active`, `chat-unactive`, `setting-active` | Candidate destinations | Actual tab order or navigation |
| E-03 | `bg-login` | Login visual asset exists | Authentication methods |
| E-04 | `membership-renewal`, `business-directory`, `kalender` | Service-oriented assets exist | Active features and transactions |
| E-05 | VisionCamera, Firebase Messaging, Room, OkHttp libraries | Capabilities/dependencies packaged | Whether used in production |

**Evidence levels:** C = confirmed packaged artifact; I = indicated candidate feature; P = new product proposal; U = unverified. The backlog below is P, inspired in part by I; no feature is claimed to be recovered end-to-end.

## 4. Personas, access and boundaries

| Persona | Proposed needs | Access |
|---|---|---|
| Guest | Read public news, discover services and events | Public content only |
| Member | Profile, membership status, digital card/QR, member services | Authenticated, verified membership |
| Organization admin | Manage member records, service requests, regional information | Role/organization scoped |
| Content editor | Publish news, events, announcements | Editorial permission |
| Service operator | Process applications and enquiries | Assigned queue only |
| Platform administrator | Manage roles, audit and configuration | Privileged, audited |

**Multi-tenancy:** KADIN national/regional authorization model is proposed, pending organization and data-owner approval. Never assume a member belongs to a province without a validated source.

## 5. Product scope and releases

### MVP / P0 — recommended
1. Public launch, onboarding and accessible navigation.
2. Authentication, consent, session management and account recovery (exact method TBD).
3. Member profile and membership status; safe fallback when no verified membership data exists.
4. Digital member card and short-lived verifiable QR (only if identity registry integration is approved).
5. Home/dashboard and public/member news.
6. Service catalogue with information pages and enquiry routing.
7. Settings, notifications preferences, help, privacy and logout.
8. Admin CMS and basic operational dashboard (web console).

### P1 — subsequent release
- Events and registration; business directory with consent-based publication; KADIN regional and association directories.
- Membership renewal workflow after payment, eligibility and authority rules are signed off.
- Training, mentoring and business development discovery.
- Push notifications after opt-in and provider configuration.

### P2 — discovery-led
- Forum/chat and AI assistant with knowledge governance and escalation.
- COO, ATA Carnet, APEC workflows, only after each service owner validates legal authority, integration, fees and process.
- Advanced recommendations, multilingual support, partner ecosystem integrations.

**Out of scope for MVP:** Third-party payment collection without approved payment partner; copying proprietary APK code/assets; access to unapproved legacy APIs; automated issuance of regulated certificates; unmoderated public chat; production AI responses without approved sources and safety controls.

## 6. Functional epics and acceptance criteria

### EPIC-01 Identity, onboarding and access — P0
**Stories:** As guest I can explore public content; as member I can authenticate and securely end my session; as admin I can revoke compromised access.

**Requirements:** welcome screen; guest/member route guards; approved login provider; verification and recovery; token rotation and secure storage; account deletion/request channel subject to retention policy.

**Acceptance criteria:**
- Given guest state, when opening member-only route, then the user sees a sign-in gate and can return safely.
- Given valid test identity, when login succeeds, then only authorized profile data is shown.
- Given logout, when reopening a protected route, then access is denied until reauthentication.
- Given expired credentials, when API responds 401, then app recovers safely without exposing tokens.

### EPIC-02 Home and navigation — P0
**Stories:** As a user I can reach relevant content and services with predictable navigation.

**Requirements:** adaptive home modules; accessible navigation; loading/empty/error states; search entry points; deep-link routing with authorization.

**Acceptance criteria:** home renders public content without login; protected cards are gated; every route has a valid back path; no dead-end navigation; text scaling and screen-reader labels supported.

### EPIC-03 Member profile and digital identity — P0, integration-gated
**Stories:** As member I can see my membership status; as verifier I can confirm a card is authentic without learning unnecessary personal information.

**Requirements:** verified member registry adapter; profile correction request; membership validity; QR token with expiry and server-side verification; revocation handling.

**Acceptance criteria:** unverified profiles are clearly labeled; expired/revoked QR fails verification; screenshot or stale token cannot be treated as perpetual proof; verifier sees minimum permitted data; unavailable registry shows a non-misleading error.

### EPIC-04 News and announcements — P0
**Stories:** As guest/member I can browse articles and open detail pages.

**Requirements:** CMS content model, category, publishing workflow, scheduled visibility, media alt text, search/pagination, moderation.

**Acceptance criteria:** unpublished items never appear publicly; pagination avoids duplicate content; broken images have fallbacks; article links respect access controls.

### EPIC-05 Service catalogue — P0
**Stories:** As user I can find available services, eligibility, contact points and official application routes.

**Requirements:** service taxonomy, regional eligibility, descriptions, owner, SLA disclaimer, enquiry action, audit trail for submissions.

**Acceptance criteria:** each published service has an owner and valid contact/action; unavailable service displays status; user can track submitted enquiry if enabled; no false claim of completed issuance.

### EPIC-06 Settings, support and consent — P0
**Requirements:** preferences, language readiness, privacy notice, notification consent, help, data-rights request and logout.

**Acceptance criteria:** consent defaults are lawful and configurable; preferences persist; support requests receive a tracking reference; logout clears local session material.

### EPIC-07 Admin and content operations — P0
**Requirements:** scoped RBAC, content draft/review/publish, service owner administration, member sync health, audit logs, operational metrics.

**Acceptance criteria:** editor cannot grant roles; regional operator cannot access another region without entitlement; publishing requires permitted role; sensitive admin changes are logged.

### EPIC-08 Events — P1
**Requirements:** event catalogue, detail, registration, cancellation, capacity, check-in subject to approval.

**Acceptance criteria:** duplicate registration is prevented; capacity is enforced transactionally; cancelled event informs registered users.

### EPIC-09 Directory, regional network and associations — P1
**Requirements:** searchable profiles, membership/organization verification, visibility consent, filters, correction process.

**Acceptance criteria:** opt-out removes public listing; unauthorized users cannot export private contacts; regional scope is enforced.

### EPIC-10 Renewal and payments — P1, decision-gated
**Requirements:** eligibility, invoice/order, approved payment gateway, idempotent webhook, reconciliation, dispute/refund process.

**Acceptance criteria:** duplicate webhook cannot duplicate renewal; payment status is never inferred from client callback alone; renewal activation follows authoritative reconciliation.

### EPIC-11 Training, mentoring and development — P1
**Requirements:** programme discovery, application, capacity, status and partner referral.

**Acceptance criteria:** eligibility is explicit; applications are traceable; partner data sharing requires appropriate notice/authorization.

### EPIC-12 Messaging and AI copilot — P2
**Requirements:** opt-in messaging, moderation, rate limits, approved knowledge retrieval, source references, escalation to human support.

**Acceptance criteria:** AI cannot claim to issue certificates or change membership status; sensitive data access is role-scoped; unsupported answers escalate; abuse can be reported.

## 7. Information architecture (proposed, not recovered)

```text
App
├── Public
│   ├── Home
│   ├── News → Article
│   ├── Services → Service detail
│   ├── Events (P1)
│   └── Login / Help
└── Authenticated
    ├── Member Home
    ├── Digital Membership → QR → Verification status
    ├── Profile / Settings
    ├── Service requests
    ├── Directory / Programs (P1)
    └── Chat / AI Assistant (P2)

Admin Web: Content → Services → Membership Sync → Requests → Analytics → Audit
```

Tab count and final labels require UX testing; do not assume exact legacy tab structure.

## 8. UX and visual design requirements

- Modern, responsive, Indonesian-first design with consistent spacing, typography, accessible contrast and 44–48dp minimum interactive targets where applicable.
- Shared states for loading, offline, empty, error, success, and permissions.
- Accessibility: screen reader labels, scalable text, focus order, reduced-motion consideration.
- Design tokens and brand assets require approval by KADIN; original packaged assets are reference-only unless licensed for reuse.
- Screen list for design: splash, guest home, login, member home, news list/detail, service catalogue/detail, membership card/QR, profile/settings, support, and admin screens. Add P1/P2 after scope sign-off.

## 9. Data model (logical proposal)

| Entity | Important fields | Notes |
|---|---|---|
| User | id, auth_subject, status, created_at | Separate authentication identity from membership |
| Member | id, user_id, registry_reference, status, valid_until | Authoritative registry integration required |
| Organization | id, name, type, region_id | National/regional hierarchy to validate |
| RoleAssignment | user_id, role, organization_id, valid_until | RBAC / scope |
| Article | id, title, body, status, published_at, editor_id | CMS workflow |
| Service | id, category, owner_id, eligibility, status | Service catalogue |
| ServiceRequest | id, service_id, requester_id, status, audit_ref | Workflow |
| Event | id, capacity, start_at, location, status | P1 |
| Registration | event_id, member_id, status | P1 |
| Consent | user_id, purpose, version, timestamp | Evidence of user choices |
| AuditEvent | actor, action, object, timestamp, metadata | Restricted and retained per policy |

Avoid storing unnecessary identity numbers or secrets. Data retention and data controller/processor assignments require legal review.

## 10. API contracts (draft; no legacy endpoints claimed)

Proposed namespace `/api/v1`:

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/public/news` | Public news feed | Public |
| GET | `/public/services` | Service catalogue | Public |
| GET | `/me` | Current user | User |
| GET | `/me/membership` | Verified membership state | Member |
| POST | `/membership/qr-tokens` | Create short-lived verification token | Verified member |
| POST | `/membership/verify` | Verify token under verifier authorization | Verifier |
| POST | `/service-requests` | Submit request | User |
| GET | `/service-requests/{id}` | Request status | Owner/operator |
| POST | `/admin/articles` | Create content | Editor |

Use OpenAPI 3.1, explicit pagination, standardized errors, idempotency for financial/transactional operations, and contract tests. These are new APIs, **not extracted APK endpoints**.

## 11. Proposed solution architecture

```text
React Native / Expo / TypeScript
  ├─ UI & Navigation (Expo Router or React Navigation: ADR required)
  ├─ Feature modules + state/query cache
  ├─ Secure session storage
  └─ Typed API client
                │ TLS
                ▼
API Gateway / BFF (new, owned)
  ├─ Identity & RBAC
  ├─ Member Registry Adapter (approved integration)
  ├─ Content & Service APIs
  ├─ Event / Directory / Renewal services (P1)
  └─ Audit / Observability
                │
        PostgreSQL + object storage + message queue (as needed)
                │
        Admin Web / CMS
```

**Technology decisions pending:** Expo managed vs prebuild, auth/SSO provider, backend hosting, CMS, database tenancy, payment partner, notification service, analytics, and regional data ownership. Vercel/Supabase/Railway may be evaluated, but are **not approved choices** in this PRD.

## 12. Security, privacy and compliance

- Align with Indonesia UU PDP, applicable electronic-system obligations, and KADIN internal governance after legal review.
- TLS, secrets in managed vault, least privilege, role- and organization-scoped authorization, audit logs and encryption at rest.
- No production credentials, private API tokens, or member PII in repositories, crash logs, or AI prompts.
- Secure QR design: short-lived opaque token, expiration, revocation, replay controls and minimal disclosure.
- Mobile security review against OWASP MASVS; threat model identity, deep links, API abuse, offline cache, account takeover and privileged administration.
- Approved privacy notice, data retention schedule, subject-rights procedures, consent and incident response before release.
- No reverse engineering of third-party production services beyond authorization; clean-room implementation of app functionality.

## 13. Non-functional requirements and SLO proposals

| Area | Proposed target / gate |
|---|---|
| Availability | API 99.9% monthly after production readiness review |
| Performance | p95 API latency ≤500ms for standard cached reads under defined load |
| Startup | Set target from benchmark on agreed low/mid-tier Android devices |
| Reliability | ≥99.5% crash-free sessions |
| Accessibility | WCAG 2.2 AA principles where applicable to mobile |
| Compatibility | Android minSdk to be decided from device analytics and dependency support |
| Security | No unresolved critical/high vulnerabilities at release without formal exception |
| Observability | Traces, request IDs, crash reporting, privacy-safe analytics |
| Recovery | RPO/RTO established through business impact assessment |

## 14. Delivery backlog and dependencies

| ID | Priority | Deliverable | Dependency | Acceptance gate |
|---|---|---|---|---|
| B-001 | P0 | Design system and navigation shell | UX sign-off | Accessible routes and states |
| B-002 | P0 | Identity and session | Auth provider decision | Login/logout/expiry tests |
| B-003 | P0 | News CMS and feed | Editorial owner | Publish visibility tests |
| B-004 | P0 | Service catalogue | Service owners | Verified contacts and statuses |
| B-005 | P0 | Member profile | Registry contract | Verified vs unverified distinction |
| B-006 | P0 | Digital QR | Registry + verifier rules | Expiry/revocation/replay tests |
| B-007 | P0 | Admin RBAC and audit | Organization model | Scope isolation tests |
| B-008 | P0 | Telemetry, privacy and release pipeline | Security/legal approvals | CI gates and consent review |
| B-009 | P1 | Events and registration | Event owner | Capacity and duplicate tests |
| B-010 | P1 | Directory | Publication consent | Visibility tests |
| B-011 | P1 | Renewal/payment | Finance/legal/payment provider | Reconciliation tests |
| B-012 | P2 | Chat and AI assistant | Knowledge governance | Safe escalation tests |

## 15. Implementation method for Codex/OpenCode

1. Confirm rights and scope; collect authorized screenshots and runtime evidence.
2. Finalize PRD decisions, UX flows, identity and registry contracts.
3. Write `SAD.md`, `SDD.md`, `uiux.md`, `AGENTS.md` and OpenAPI specs.
4. Bootstrap new repository; use modular feature boundaries and code ownership.
5. For every behavior: **RED** failing focused test → **GREEN** minimal implementation → **REFACTOR** with tests passing.
6. Run unit, integration, UI and security checks in CI; test actual device/emulator journeys.
7. Record evidence, deviations, decisions and release sign-offs. Never claim a test passed without running it.

**Suggested repo:** `apps/mobile`, `apps/admin`, `services/api`, `packages/contracts`, `docs`, `.github/workflows` (monorepo optional, ADR required).

## 16. Roadmap and stage gates (illustrative)

| Stage | Timebox proposal | Deliverable | Exit criteria |
|---|---|---|---|
| Discovery | Weeks 1–2 | Verified screen/flow inventory; interviews | Product owner validates critical journeys |
| Definition | Weeks 3–4 | PRD/SAD/SDD/OpenAPI and backlog | Security, identity, data ownership approved |
| MVP build | Weeks 5–10 | P0 vertical slices | Acceptance tests, integration readiness |
| Pilot | Weeks 11–12 | Controlled member pilot | KPI baseline, issue triage, support readiness |
| Scale | After pilot | P1 roadmap | Funding, owners and value evidence |

Schedule is a planning assumption, not an implementation commitment.

## 17. Risks, decisions and open questions

| ID | Issue | Impact | Decision owner |
|---|---|---|---|
| D-01 | KADIN authorization, branding and asset rights | Legal/reputation | KADIN sponsor/legal |
| D-02 | Member registry system of record | Identity accuracy | Membership owner |
| D-03 | Login method (OTP, SSO, password) | UX/security | Product + security |
| D-04 | QR purpose: display vs scan vs verify | Scope/architecture | Membership owner |
| D-05 | National/regional operator governance | RBAC/data tenancy | Organization leadership |
| D-06 | Services requiring external approvals | Operational risk | Service owners |
| D-07 | Payment/renewal rules | Financial controls | Finance/legal |
| D-08 | Public vs member-only content | Content policy | Editorial owner |
| D-09 | AI assistant inclusion in MVP | Cost/safety | Product sponsor |
| D-10 | Hosting and data residency | Compliance/TCO | IT/security |

## 18. Definition of Ready / Done

**Ready:** validated user story, owner, priority, data contract, UX states, security/privacy impact, acceptance criteria and test plan.

**Done:** independent implementation reviewed; focused tests observed failing then passing; full applicable suite and UI journeys pass; authorization and privacy checks pass; telemetry and support docs ready; PO accepts evidence.

## 19. Immediate next actions

- Run authorized emulator walkthrough of APK v1.0.9 and update `SCREEN-INVENTORY.md` with screenshots and observed transitions.
- Confirm KADIN ownership/authorization and access to current service documentation.
- Interview membership, service, regional, content, security and IT owners.
- Approve P0 scope, identity model, membership registry and QR semantics.
- Create SAD/SDD and implementation tickets only after unresolved assumptions are labeled or decided.

---

**Document control:** This PRD describes a **proposed new application**, not a claim that the uploaded APK implements all described features. Source-derived evidence is limited to the three companion static-analysis documents; business goals, priorities, architecture and performance targets are recommendations requiring approval.
