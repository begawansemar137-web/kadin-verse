# @kadin/contracts

API contracts between the mobile app, admin CMS and API/BFF (ADR-012). Specs here are **PROPOSED** until the API
owner approves them; nothing in this folder claims a legacy or production endpoint.

| File | Status | Consumers |
|---|---|---|
| `openapi/public-news.v1.yaml` | PROPOSED (ADR-013) | `apps/mobile/src/features/news/domain/dto.ts` (hand-written parser) |

Code generation is not set up yet (ADR-013 §2). Until it is, a change to a spec and to its hand-written parser must be
reviewed in the same PR.
