# ADR-013: Remote content fetching and the news contract (mobile client)

**Status:** ACCEPTED (2026-11-22). Approved by the project owner in session; see commit. Still open before
production: editorial owner sign-off on the visibility rules and copy, and D-08 (public versus member-only content).
**Date:** 2026-11-22
**Decision owner:** Architect (R/A), Editorial owner (C, for the visibility rules), Engineering (C)
**Backlog:** B-003 (EPIC-04 News and announcements, SPEC-005)

## Context
- AGENTS.md §4 says the state and fetching approach is chosen and documented in an ADR. SAD §73 says to use TanStack Query
  for remote state "only if approved". SDD §3 says not to add a second state-management library without a recorded
  decision.
- AGENTS.md §8 lets B-003 start with "feed UI, content contracts, fake CMS". Production integration waits for editorial
  ownership and publish permissions.
- SPEC-005 business rules:
  - BR-003: only published articles with `published_at <= now` are public.
  - BR-004: pagination is stable and has no duplicates.
  - BR-005: images need alt text.
- SPEC-005 acceptance criteria AC-005-01, 02, 05 and 06 cover that read side.
- AC-005-03 and 04 cover the editorial workflow and approver rights. That workflow depends on ADR-006 (organisation
  scope), ADR-007 (CMS and backend) and the admin app, none of which exist yet.
- PRD D-08 (public versus member-only content) is open. PRD §4 only says guests can read public news.
- ADR-012 says `packages/contracts` holds an OpenAPI spec and code generated from it, never hand-edited. No codegen
  tooling exists yet.
- SDD §7 adopts PRD route naming as provisional: `GET /api/v1/public/news?cursor=&limit=` and
  `GET /api/v1/public/news/{id}`, with the envelope `{ data, page: { nextCursor, limit } }`.

## Decision
1. **No remote-state library yet.** The news feature uses two small hooks (`useNewsFeed`, `useArticle`) built on the
   existing `AsyncState` model.
   - They handle loading, empty, error, offline, a retry action, a "load more" action, and ignore responses that
     arrive after the screen unmounts.
   - TanStack Query is revisited when the second remote feature arrives (B-004 catalogue) or when caching and
     background refetch become requirements. That revisit is an amendment to this ADR.
2. **The contract comes first, and runtime validation happens at the client edge.**
   - A draft OpenAPI 3.1 file, `packages/contracts/openapi/public-news.v1.yaml`, describes the two public endpoints and
     the error envelope. It is marked PROPOSED.
   - The mobile client validates every response with hand-written parsers (`parseArticleSummaryPage`,
     `parseArticleDetail`) that return `null` on any defect. This follows the `parseStoredSession` pattern from
     ADR-003.
   - Choosing a schema library or a codegen tool is deferred to the API client work.
3. **The fake CMS is a fake server, not a fake repository.** `createFakeCms` answers requests shaped like the provisional
   routes, using wire-format JSON and HTTP-like status codes.
   - It enforces BR-003 visibility and keyset cursor pagination itself, because those are server rules.
   - The client (`createNewsClient(transport)`) parses those responses through the same code path a real HTTP
     transport will use.
   - Synthetic articles use statuses draft, in_review, published, archived and scheduled, so the visibility tests mean
     something.
4. **Keyset cursor.** Articles are ordered by `(publishedAt desc, id desc)`. The cursor is an opaque string that encodes
   the last item's key. If an article becomes eligible between page requests, it cannot duplicate or shift items
   already shown (AC-005-05).
5. **Public content only, until D-08 is decided.** The client shows only what the public endpoints return. There is no
   member-only content and no gating on the news routes. When an article is not visible, its detail screen shows "not
   found" (EPIC-04: links respect access controls).
6. **Plain-text bodies.** The article body is rendered as text paragraphs. No HTML or Markdown renderer, so no injection
   surface. Rich content is a later decision for the editorial owner.
7. **Image fallback.** An image with a missing or empty alt text is dropped at parse time, and so is any image URL
   that is not `https:` (BR-005). An image that fails to load is replaced by a neutral placeholder that keeps its alt
   text as the accessibility label (AC-005-06).
8. **Feature flag.** `flags.mockContent` follows the same rule as `mockAuth`: on in dev builds, or with
   `EXPO_PUBLIC_MOCK_CONTENT=true`.
   - When the flag is on, the fake CMS is wired in and every news screen shows the MockBadge (SPEC-005 §3: synthetic
     fixtures visibly marked).
   - When the flag is off, there is no source, and the feed shows the existing empty message.

## Out of scope (still gated)
- The editorial workflow (US-005-B/C, BR-001/002/006, AC-005-03/04), which belongs to B-007 with ADR-006/007.
- Member-only content (D-08).
- The real HTTP transport, and how it uses `getAccessToken` and `handleUnauthorized`.
- Search, media upload and MIME validation on the server side.
- OpenAPI codegen.
- Editorial copy and UX approval of the screens.

## Consequences
- The feed and detail screens, their states and the visibility rules can be tested end to end against the fake server
  now. Swapping in a real HTTP transport touches only the transport.
- Visibility is enforced by the (fake) server, not filtered on the client. That keeps the API as the authorisation
  boundary (SAD §6). The client never receives drafts in the first place.
- The OpenAPI draft and the hand-written parsers can drift apart. This is accepted until codegen is chosen. Both are
  reviewed in the same PR.
- Without a cache, news is fetched again each time a screen mounts. This is acceptable for the MVP volume and revisited
  with point 1.
- Reversible: the hooks and the client port are small, and adopting TanStack Query later replaces the hooks without
  touching the screens' `AsyncState` contract.
