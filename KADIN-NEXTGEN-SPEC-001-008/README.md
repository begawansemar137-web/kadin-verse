# KADIN Indonesia Next Generation — P0 Feature Specifications

Eight **proposed** implementation specifications derived from the attached PRD.md, SAD.md, SDD.md, and AGENTS.md (2026-11-18). The APK is a reference, not a source of licensed code or production API contracts.

| SPEC | Feature | PRD mapping | Main gate |
|---|---|---|---|
| SPEC-001 | Authentication & Session Management | EPIC-01 | IdP approval |
| SPEC-002 | Membership Registry & Status | EPIC-03 | Registry approval |
| SPEC-003 | Digital Member Card & QR Verification | EPIC-03 | QR/registry approval |
| SPEC-004 | Home Dashboard & Navigation | EPIC-02 | UX signoff |
| SPEC-005 | News, Articles & Editorial Workflow | EPIC-04 | Editorial RBAC |
| SPEC-006 | Service Catalogue & Enquiries | EPIC-05 | Service owner policy |
| SPEC-007 | Settings, Profile, Consent & Support | EPIC-06 | Privacy policy |
| SPEC-008 | Admin CMS, RBAC & Operations | EPIC-07 | RBAC / audit governance |

## Cross-document decisions requiring review
- SDD §2 identifies inconsistent endpoint naming across PRD/SAD; these specs follow SDD §7 provisional canonical paths.
- SPEC-004 Home is mapped to PRD EPIC-02; SPEC-003 QR and SPEC-002 Membership both map to EPIC-03.
- SPEC-008 Admin is EPIC-07. P1 Events/Directory/Payments and P2 AI are explicitly excluded.
- SPEC-007 proposes support/consent endpoints not fixed in SDD §7; approval is required before implementing live endpoints.
- No source code has been written or tests run as part of these documents.

## Recommended order
Bootstrap → 004 mock public shell → 005 public news + editorial → 006 catalogue → 001 mock auth → 002 mock membership → 003 mock QR → 007 settings → 008 admin hardening. Gate live integrations separately.
