# ADR-012 — Repository layout canonicalization

**Status:** ACCEPTED — 2026-11-21 (approved by project owner in session; see commit)
**Date:** 2026-11-21
**Decision owner:** Architect (R/A), Product Owner (C), Engineering (C)
**Supersedes (on approval):** `SAD.md` §14 repository tree, `SDD.md` §3 repository tree, and the illustrative layout in `AGENTS.md` §4, wherever they conflict with the canonical tree below.

## Context

`PRD.md`, `SAD.md`, `SDD.md` and `AGENTS.md` each propose a repository layout for the future `kadin-next` implementation repo, and the three documents disagree in ways that are not reconciled anywhere:

1. **Placement of top-level docs.** `SAD.md:216-219` places `AGENTS.md`, `PRD.md`, `SAD.md`, `SDD.md` at the **repo root**. `SDD.md:33` places `PRD.md`, `SAD.md`, `SDD.md`, `uiux.md` under **`docs/`**. These are directly contradictory, not just differently detailed.
2. **`packages/` contents.** `SAD.md:205-208` proposes `packages/{contracts, design-tokens, shared-utils}`. `SDD.md:41` proposes `packages/{contracts, types, config}`. `AGENTS.md:69` shows only `packages/contracts/`. No document explains whether these are revisions of each other or distinct packages that should coexist.
3. **`db/` and `tests/` top-level folders** appear only in `SDD.md:42-43` (`db/{migrations,seeds}`, `tests/{contract,e2e,security}`); `SAD.md` and `AGENTS.md` have no equivalent, which could read as a disagreement rather than SDD simply being more specific.

Without a single canonical answer, Codex/OpenCode agents following `AGENTS.md`'s instruction to "read PRD/SAD/SDD" could legitimately scaffold three different repository shapes depending on which document they weight more heavily — which `AGENTS.md:16` itself warns against ("If documents disagree, do not silently resolve").

## Decision

Adopt the following **canonical repository layout** for `kadin-next`. This tree reconciles all three prior proposals rather than discarding any of them:

```text
kadin-next/
├── AGENTS.md                      # stays at repo root — see rationale below
├── README.md
├── .github/workflows/
├── apps/
│   ├── mobile/                    # React Native / Expo
│   └── admin/                     # Web CMS
├── services/
│   └── api/                       # Modular API / BFF
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
    ├── PRD.md
    ├── SAD.md
    ├── SDD.md
    ├── uiux.md
    ├── traceability.md
    ├── adr/                       # this file lives at docs/adr/ADR-012-...md
    ├── specs/
    ├── threat-model/
    └── test-evidence/
```

### Rationale per conflict

**1. Doc placement — root vs. `docs/`.** Resolved in favor of `docs/`, with one named exception:
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

## Consequences

- `SAD.md` §14 and `SDD.md` §3 repository trees are **superseded by this ADR** once approved. Both documents should add a one-line pointer to this ADR rather than carry a layout that can drift out of sync again (see "Follow-up" below).
- `AGENTS.md` §4's illustrative layout should gain the same pointer; its text already correctly gates repo creation on ADR approval (`AGENTS.md:64`), so no behavioral change is required there beyond the reference.
- Agents following `AGENTS.md`'s DISCOVER/PLAN steps now have exactly one layout to scaffold against instead of three, removing a source of non-deterministic repo structure across agent runs.
- This ADR does not decide package manager, workspace tool (pnpm/turbo/nx/etc.), or monorepo-vs-polyrepo — those remain open per `SAD.md` ADR-007 and are out of scope here.

## Status and next steps

1. Architect and Product Owner review and accept or amend this ADR.
2. On acceptance, update the row for this ADR in `SAD.md` §15's ADR table (status OPEN → ACCEPTED) and patch the superseded trees in `SAD.md` §14 / `SDD.md` §3 / `AGENTS.md` §4 to reference this file instead of restating a tree.
3. No repository scaffolding should occur against this layout until step 2 is complete, per `AGENTS.md`'s "create only after ADR approval" rule.
