# ADR-002 — Navigation library: Expo Router

**Status:** ACCEPTED — 2026-11-21 (approved by project owner in session; see commit)
**Date:** 2026-11-21
**Decision owner:** Architect (R/A), UX owner (C), Engineering (C)

## Context
SAD §15 lists ADR-002 (Expo Router vs React Navigation) as OPEN. B-001 needs a navigation shell with
tabs, a protected route, deep-link handling and a not-found fallback (EPIC-02, SPEC-004).
`apps/mobile` on branch `feat/B-001-mobile-p0-mock` already depends on `expo-router ~58.0.32`.

## Options
1. **Expo Router** — file-based routes on top of React Navigation; deep links generated from the file tree;
   typed routes; first-party testing utilities (`expo-router/testing-library`).
2. **React Navigation (direct)** — explicit navigator config; deep-link `linking` config maintained by hand.

## Decision (proposed)
Adopt **Expo Router**, with routes in `apps/mobile/src/app/`. Deep-link paths are derived from file names, so
route files are a public contract: renaming one is a breaking change that needs a note in release docs.

## Consequences
- Deep links work without a hand-written linking table; malformed paths fall to `+not-found`.
- Client route guards (e.g. `/card`) are UX only; the API enforces authorization (SAD §6).
- Non-route code must stay out of `src/app/`.
- Reversible: React Navigation remains underneath; migrating means replacing route files with navigator config.
