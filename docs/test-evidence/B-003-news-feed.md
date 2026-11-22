# B-003 Public news feed with a synthetic CMS — test evidence

**Branch:** feat/B-003-news-feed · **Date:** 2026-11-22 · **Evidence class:** PROPOSED (mock-only)
**Spec:** [SPEC-005](../../KADIN-NEXTGEN-SPEC-001-008/SPEC-005-news-cms.md), PRD EPIC-04, [ADR-013](../adr/ADR-013-news-content-boundary.md) ACCEPTED 2026-11-22 · **Plan:** [2026-11-22-b003-news-feed](../superpowers/plans/2026-11-22-b003-news-feed.md)
**Environment:** macOS (Darwin 27.2), pnpm 11.22.0, Expo SDK 58, Jest 30 (jest-expo), RNTL 14.

## RED → GREEN log

All commands run from `apps/mobile` with `pnpm exec jest <path>`.

| Task | Failing run (first error) | Passing run |
|---|---|---|
| 1 contract and parsers | `…/dto.test.ts` → `Could not locate module @/features/news/domain/dto` | same → `Tests: 18 passed, 18 total` |
| 2 fake CMS, client, fixtures | `…/fake-cms.test.ts …/news-client.test.ts` → `Could not locate module @/features/news/data/fake-cms` | same → `Tests: 25 passed, 25 total` |
| 3 flag, default source, provider | `src/shared/config …/default-news-source.test.ts` → `resolveDemoFlag is not a function`; `Could not locate module @/features/news/default-news-source` | same → `Tests: 6 passed, 6 total` |
| 4 hooks | `…/use-news-feed.test.tsx …/use-article.test.tsx` → `Could not locate module …/use-news-feed` (and `use-article`) | same → `Tests: 13 passed, 13 total` |
| 5 date format, card, image | `…/format-date.test.ts …/article-components.test.tsx` → `Could not locate module …/format-date` (and `ArticleCard`) | same → `Tests: 7 passed, 7 total` |
| 6 screens and journeys | `…/news-screens.test.tsx src/navigation/__tests__/router.test.tsx` → `ArticleDetailScreen` module missing; router `7 failed, 15 passed` (2 updated B-001 news tests + 5 new B-003 journeys) | `src/features/news src/navigation` → `Tests: 138 passed, 138 total` (14 suites) |

Deviations recorded during execution (ledger rulings):
- **Task 4:** the plan's test code called RNTL synchronously. RNTL 14 `render`, `renderHook`, `act`, `fireEvent` and `unmount` are async, as the B-002 tests already use them; every call is awaited. The "loading" assertion moved to a never-resolving source, because `await renderHook` flushes the first fetch. The double-tap test waits on `hasMore === false`, because `loadingMore === false` holds before the request starts and would pass vacuously.
- **Task 4:** the "empty first page" test first built a new client on every render, which made the hook refetch forever. Fixed in the test. The hook needs a stable `source`; `NewsSourceProvider` holds it in state.
- **Task 6:** lint (`react-hooks/set-state-in-effect`) rejected the effect calling an async fetch that set state after `await`. Both hooks now set state only inside `.then()` callbacks. No rule was disabled, and behaviour is unchanged.

## Gates (fresh run on dc9d553's tree, before this docs commit)

| Gate | Command (from `apps/mobile`) | Result |
|---|---|---|
| Typecheck | `pnpm typecheck` | exit 0 |
| Lint | `pnpm lint` | exit 0, no problems |
| Unit, component and journey tests | `pnpm exec jest` | Run 1: `1 failed, 233 passed, 234 total`. The failure was a 5 s timeout in `ArticleImageView › labels the image with its alt text`, while that file took 63 s under parallel load on the external drive; the test passed in isolation. Run 2: `Tests: 234 passed, 234 total`, `Test Suites: 25 passed, 25 total`, exit 0. |

The run-1 timeout is recorded as a load flake, not fixed. The assertion was not weakened and the timeout was not raised. If it recurs in CI, the fix is to investigate the first `Image` render cost in that file, not to raise the limit.

## Acceptance mapping

| Criterion | Evidence |
|---|---|
| AC-005-01 draft absent from public feed | `fake-cms.test.ts` › "AC-005-01/02: the feed lists only published articles that are already due"; `news-client.test.ts` › "never lists draft, in-review, archived or scheduled sample articles" |
| AC-005-02 scheduled absent until eligible | `fake-cms.test.ts` › "a scheduled article appears once its time has come" |
| AC-005-05 stable pagination, no duplicates | `fake-cms.test.ts` › keyset tests, including "an article that becomes eligible between pages causes no duplicates" and the tie-break test |
| AC-005-06 broken image fallback and alt text | `article-components.test.tsx` › "AC-005-06: replaces a broken image with a fallback that keeps the alt text"; `dto.test.ts` drops images without alt text or with non-`https` URLs (BR-005) |
| EPIC-04 article links respect access controls | `router.test.tsx` › "Review Focus 5" for draft, in review, archived and scheduled ids; `fake-cms.test.ts` 404 cases |
| SPEC-005 §3 states (loading, success, empty, error, offline, retry) | `use-news-feed.test.tsx`, `use-article.test.tsx`, `news-screens.test.tsx` |
| SPEC-005 §3 synthetic fixtures visibly marked | `news-screens.test.tsx` and `router.test.tsx` assert the MockBadge; `news-client.test.ts` › "sample articles are visibly synthetic" |
| DTO validation at the boundary (SPEC-005 §3, AGENTS §6) | `dto.test.ts`; `news-client.test.ts` › "Review Focus 1: maps a malformed 200 body to unavailable" |

## Review Focus (from the plan) and the tests that pin them

1. Malformed list response → `news-client.test.ts` › "Review Focus 1…", `dto.test.ts` › "rejects the whole page when …".
2. Article becomes eligible between pages → `fake-cms.test.ts` › "AC-005-05…".
3. Double tap on load more → `use-news-feed.test.tsx` › "Review Focus 3…".
4. Response after unmount → `use-news-feed.test.tsx` › "Review Focus 4…".
5. Deep link to a non-public article → `router.test.tsx` › "Review Focus 5…" (4 cases).

## NOT RUN

- On-device check of the image fallback and a screen-reader pass (TalkBack, VoiceOver) over the feed and detail screens. Reproduce with `npx expo start` in a dev build: the synthetic image hosts use `.invalid`, so every image shows the fallback.
- Android and iOS builds.

## Out of scope or still gated

- Editorial workflow: AC-005-03/04, BR-001/002/006 (B-007, with ADR-006 and ADR-007).
- Member-only content (PRD D-08).
- The real HTTP transport and its use of `getAccessToken` and `handleUnauthorized`.
- OpenAPI code generation. Until it exists, `packages/contracts/openapi/public-news.v1.yaml` and `dto.ts` must be reviewed together.

## Open items

- Editorial owner sign-off on the visibility rules; UX approval of copy, date format (WIB) and layout.
- D-08 decision.
