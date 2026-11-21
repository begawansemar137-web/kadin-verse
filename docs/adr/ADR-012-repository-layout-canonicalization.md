# ADR-012 — Repository layout canonicalization

**Status:** ACCEPTED — 2026-11-21 (approved by project owner in session; see commit)
**Date:** 2026-11-21
**Decision owner:** Architect (R/A), Product Owner (C), Engineering (C)
**Supersedes:** `SAD.md` §14 repository tree, `SDD.md` §3 repository tree, and the illustrative layout in `AGENTS.md` §4. All three now point here instead of restating a tree.
**Amended:** 2026-11-21, Amendment 1. Top-level specification documents stay at the repository root.

## Context

`PRD.md`, `SAD.md`, `SDD.md` and `AGENTS.md` each propose a repository layout for the future `kadin-next` implementation repo, and the three documents disagree in ways that are not reconciled anywhere:

1. **Placement of top-level docs.** `SAD.md:216-219` places `AGENTS.md`, `PRD.md`, `SAD.md`, `SDD.md` at the **repo root**. `SDD.md:33` places `PRD.md`, `SAD.md`, `SDD.md`, `uiux.md` under **`docs/`**. These are directly contradictory, not just differently detailed.
2. **`packages/` contents.** `SAD.md:205-208` proposes `packages/{contracts, design-tokens, shared-utils}`. `SDD.md:41` proposes `packages/{contracts, types, config}`. `AGENTS.md:69` shows only `packages/contracts/`. No document explains whether these are revisions of each other or distinct packages that should coexist.
3. **`db/` and `tests/` top-level folders** appear only in `SDD.md:42-43` (`db/{migrations,seeds}`, `tests/{contract,e2e,security}`); `SAD.md` and `AGENTS.md` have no equivalent, which could read as a disagreement rather than SDD simply being more specific.

Without a single canonical answer, Codex/OpenCode agents following `AGENTS.md`'s instruction to "read PRD/SAD/SDD" could legitimately scaffold three different repository shapes depending on which document they weight more heavily — which `AGENTS.md:16` itself warns against ("If documents disagree, do not silently resolve").

## Decision

Adopt the following **canonical repository layout** for `kadin-verse` (earlier drafts called it `kadin-next`). This tree reconciles all three prior proposals rather than discarding any of them:

```text
kadin-verse/                       # canonical repository (formerly referred to as "kadin-next")
├── AGENTS.md                      # agent entry point; stays at root
├── README.md
├── PRD.md, SAD.md, SDD.md         # specification baseline; stays at root (Amendment 1)
├── APK-ANALYSIS.md, FEATURE-INVENTORY.md, UIUX-ANALYSIS.md, SCREEN-INVENTORY.md
│                                  # discovery/analysis baseline; stays at root (Amendment 1)
├── uiux.md, traceability.md       # root, when created (Amendment 1)
├── KADIN-NEXTGEN-SPEC-001-008/    # baseline feature specs; new specs go in docs/specs/
├── .github/workflows/
├── apps/
│   ├── mobile/                    # React Native / Expo
│   │   └── src/
│   │       ├── app/               # Expo Router route files only (ADR-002)
│   │       ├── features/<feature>/{components,screens,domain,data,__tests__}/
│   │       ├── navigation/        # route policy, deep-link helpers, tab config
│   │       └── shared/{ui,api,auth,config,copy,domain,utils}/
│   └── admin/                     # Web CMS
├── services/
│   └── api/                       # Modular API / BFF
│       └── src/{modules,shared,adapters,infra}/
├── packages/
│   ├── contracts/                 # OpenAPI spec + generated types/clients — never hand-edited
│   ├── types/                     # hand-written shared TS types/DTOs not produced by codegen
│   ├── design-tokens/             # approved shared design tokens (color, spacing, typography)
│   ├── shared-utils/              # cross-cutting pure utility functions
│   └── config/                    # shared tsconfig/eslint/prettier base configs
├── db/
│   └── {migrations,seeds}/
├── tests/
│   └── {contract,e2e,security}/
├── infrastructure/                # IaC and environment templates
└── docs/
    ├── adr/                       # this file lives at docs/adr/ADR-012-...md
    ├── specs/
    ├── threat-model/
    ├── test-evidence/
    └── superpowers/plans/         # agent implementation plans
```

Create a folder only when the first real file needs it; an empty placeholder directory is not required by this ADR.

### Rationale per conflict

**1. Doc placement — root vs. `docs/`.** *Originally resolved in favor of `docs/`; reversed by Amendment 1 below. The original reasoning is kept for the record.*
- `AGENTS.md` **stays at repo root**. Agent-driven tooling (Claude Code, Codex, OpenCode) conventionally auto-discovers `AGENTS.md` at the project root; nesting it under `docs/` risks it being silently ignored by an agent harness. `AGENTS.md`'s own illustrative layout (`AGENTS.md:74`) already shows it at root, independent of this ADR.
- `PRD.md`, `SAD.md`, `SDD.md`, `uiux.md`, and `traceability.md` move to `docs/`, matching `SDD.md`'s proposal and keeping the repo root limited to tooling entry points (`AGENTS.md`, `README.md`, workflow/config files). `docs/adr/`, `docs/specs/`, and `docs/test-evidence/` were already agreed by all three documents (`SAD.md:291-296`, `SDD.md:33`, `AGENTS.md:70-72`), so this is a minimal, low-risk extension of an existing agreement rather than a new direction.
- `README.md` stays at root per universal convention; it was not previously specified by any of the three documents.

**2. `packages/` contents — merge, don't choose.** SAD's and SDD's proposed packages are not actually competing with each other; they cover different concerns and both carry a legitimate use case:
- `contracts` — agreed by all three documents; kept as-is (generated-only, OpenAPI-derived).
- `types` (from SDD) — kept distinct from `contracts` specifically because contracts must stay machine-generated/unedited, while ordinary cross-app shared types/DTOs need a hand-editable home.
- `design-tokens` and `shared-utils` (from SAD) — kept; both are referenced elsewhere in the same documents (`SAD.md:73` design tokens, `AGENTS.md:101` design tokens) and would otherwise have no package to live in.
- `config` (from SDD) — kept; standard monorepo location for shared lint/TS config, referenced nowhere else but uncontroversial.
- `AGENTS.md`'s single-package illustration (`packages/contracts/` only) is treated as a non-exhaustive snippet, not a fourth competing proposal — it is superseded/extended by this list, not contradicted.

**3. `db/` and `tests/` top-level folders.** Adopted from `SDD.md` as-is. `SAD.md`'s tree never claimed to be exhaustive (it predates `SDD.md` and omits several leaf-level details SDD adds); treat SDD's additions here as refinement, not disagreement.

## Amendment 1 — specification documents stay at the root (2026-11-21)

**Decision:** `PRD.md`, `SAD.md`, `SDD.md`, the discovery documents (`APK-ANALYSIS.md`, `FEATURE-INVENTORY.md`, `UIUX-ANALYSIS.md`, `SCREEN-INVENTORY.md`), `uiux.md` and `traceability.md` live at the repository root. `docs/` holds ADRs, new specs, threat models, test evidence and agent plans. Approved by the project owner on 2026-11-21.

**Why:** the canonical repository (`kadin-verse`) already keeps these documents at the root. `AGENTS.md` §1 tells every agent to read them there, and the accepted ADRs, specs and plans cite them by root path (for example `SAD.md` §6). Moving them would break those references in exchange for a tidier root, with no gain in correctness. The original problem was that the documents disagreed with each other; that is solved by having one canonical tree, whichever location it chooses.

**Effect:** no files move. Other documents that sketch a tree now point to this ADR.

## Consequences

- `SAD.md` §14 and `SDD.md` §3 repository trees are **superseded by this ADR**. Both now carry a pointer to this ADR instead of a tree, so they cannot drift out of sync again.
- `AGENTS.md` §4's illustrative layout is replaced by the same pointer.
- Agents following `AGENTS.md`'s DISCOVER/PLAN steps now have exactly one layout to scaffold against instead of three, removing a source of non-deterministic repo structure across agent runs.
- This ADR does not decide the package manager, workspace tool or monorepo-vs-polyrepo question; those remain open under `SAD.md` ADR-007. (The B-001 branch uses a pnpm workspace provisionally; ADR-007 should ratify or replace it.)

## Status and next steps

1. ~~Architect and Product Owner review and accept or amend this ADR.~~ Accepted 2026-11-21; Amendment 1 approved the same day.
2. ~~Update `SAD.md` §15 (OPEN → ACCEPTED) and replace the trees in `SAD.md` §14, `SDD.md` §3 and `AGENTS.md` §4 with pointers to this file.~~ Done in the docs follow-up PR.
3. Scaffolding against this layout is authorized. Other ADRs (identity, registry, QR, tenancy; see `SAD.md` §15) still gate their features; this ADR only settles directory shape.
