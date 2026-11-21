# ADR-001 — Expo workflow: managed with Continuous Native Generation (B-001 scope)

**Status:** ACCEPTED — 2026-11-21 (approved by project owner in session; see commit)
**Date:** 2026-11-21
**Decision owner:** Architect (R/A), Engineering (C), Security (C)

## Context
SAD §15 lists ADR-001 (managed vs prebuild) as OPEN. B-001 uses only Expo SDK modules
(expo-router, react-native-screens, safe-area-context, vector-icons). No custom native code is required.

## Decision (proposed)
Use the **managed workflow with Continuous Native Generation**: `ios/` and `android/` are generated, not
committed (already ignored in `.gitignore`). Native configuration goes in `app.json` / config plugins only.
Re-open this ADR when B-002 (identity provider SDK) or B-006 (QR scanning/verification) introduces native
requirements.

## Consequences
- No local Xcode/Android Studio needed for B-001; device builds would go through EAS once a release ADR exists.
- Any library with native code requires a development build, not Expo Go.
