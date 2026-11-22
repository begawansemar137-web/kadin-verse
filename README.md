# KADIN Verse — KADIN Indonesia Next Generation Mobile Platform

Repository for the **independent** successor KADIN Indonesia mobile platform: a member-facing React Native / Expo / TypeScript app, an owned API/BFF, and an admin CMS.

> **Status:** B-001 navigation shell and B-002 auth boundary (fake provider) merged to `main`. B-003 public news feed with a synthetic CMS in review on `feat/B-003-news-feed` (ADR-013; D-08 public vs member content still open). ADR-001 (Expo managed/CNG), ADR-002 (Expo Router) and ADR-012 (repository layout) accepted 2026-11-21; ADR-003 (identity boundary; login method D-03 still open) and ADR-013 (news content boundary) accepted 2026-11-22. No live auth, membership, QR or backend; design tokens and copy are PLACEHOLDER pending UX approval.

## Start here

| Document | Purpose |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Rules for AI agents and human contributors — read first |
| [`PRD.md`](PRD.md) | Product scope, epics, release priorities, open decisions D-01…D-10 |
| [`SAD.md`](SAD.md) | Software architecture (proposed) |
| [`SDD.md`](SDD.md) | Software design (proposed) |
| [`UIUX-ANALYSIS.md`](UIUX-ANALYSIS.md) / [`SCREEN-INVENTORY.md`](SCREEN-INVENTORY.md) | UX discovery and candidate screens |
| [`FEATURE-INVENTORY.md`](FEATURE-INVENTORY.md) | Candidate features with confidence labels |
| [`APK-ANALYSIS.md`](APK-ANALYSIS.md) | Packaging evidence from the legacy app (reference only, not a spec) |
| [`KADIN-NEXTGEN-SPEC-001-008/`](KADIN-NEXTGEN-SPEC-001-008/) | Feature specs SPEC-001 … SPEC-008 |
| [`docs/adr/`](docs/adr/) | Architecture Decision Records |

## Clean-room rules (summary)

- The legacy APK is a discovery reference, **not** a source to copy. No decompiled code, proprietary assets, certificates, secrets or internal endpoints in this repo.
- APKs, `input/`, `analysis/` outputs and raw logs stay **outside** this repository (enforced in `.gitignore`).
- Synthetic test data only. Never commit PII, tokens or `.env` files.

## MVP scope (P0)

B-001 design system & navigation shell · B-002 identity/onboarding · B-003 news & CMS · B-004 service catalogue · B-005 member profile · B-006 digital QR (mock-only until approved) · B-007 admin RBAC & audit · B-008 privacy, telemetry, accessibility & release pipeline.

## Contributing

Short-lived branches per backlog item (e.g. `feat/B-001-navigation-shell`), one cohesive change per PR, test-first workflow. See `AGENTS.md` §5 and §10.
