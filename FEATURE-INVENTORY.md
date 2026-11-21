# FEATURE-INVENTORY.md — KADIN Indonesia Android v1.0.9

**Version:** 1.0 | **Analysis date:** 2026-11-18  
**Source APK:** `Kadin_Indonesia_1.0.9_build_8okt_v_1.apk`  
**SHA-256:** `f3308c89705c9a9767b4f2d38c4ca6445ce626033e923ef4ed0a5ed7e5bfc852`  
**Companion:** `APK-ANALYSIS.md`

## 1. Scope and evidence methodology

This inventory is based on direct inspection of the APK ZIP archive, `assets/app.config`, and Expo `assets/app.manifest`, cross-checked with the companion architecture report. The bundle is Hermes binary and was **not** disassembled; no emulator walkthrough, authenticated session, or backend API test has been performed. Accordingly this is a **feature discovery inventory**, not a verified product specification.

Evidence labels:
- **C — Confirmed artifact:** literal asset/config/library found in APK; does not prove active screen or workflow.
- **I — Indicated feature:** product function suggested by a first-party named asset; requires runtime validation.
- **H — Hypothesis:** proposed user behavior inferred from naming, not established by APK.
- **U — Unknown:** not determinable from available static evidence.

**Important:** Names of asset files are evidence of design intent or packaged UI resources, **not** evidence that a feature is accessible, implemented end-to-end, or backed by a working service. Do not reuse proprietary images, logos, credentials, or source code without authorization.

## 2. Application identity and technical context

| Attribute | Evidence | Confidence |
|---|---|---|
| App name | `assets/app.config`: Kadin Indonesia | C |
| Version | `1.0.9` | C |
| Android package in Expo config | `com.kadinverse` | C (config only) |
| Framework | React Native, Expo modules | C (packaged) |
| JS engine | Hermes libraries and binary JS bundle | C (packaged) |
| Navigation support | `@react-navigation/elements` assets, React Native Screens libraries | C (packaged), route tree U |
| OTA updates | Expo Updates URL in config | C (configured), runtime U |
| Feature source of truth | JS bundle and runtime screens | Not yet inspected |

## 3. Navigation / screen candidates

| ID | Candidate tab/screen | Exact packaged asset evidence | Confidence | Verification needed |
|---|---|---|---|---|
| NAV-01 | Home | `home-active`, `home-unactive` | I | Tab order, landing widgets, logged-in vs guest |
| NAV-02 | News | `news-active`, `news-unactive` | I | Listing, detail, search, categories, pagination |
| NAV-03 | QR | `qr-active`, `qr-unactive` | I | QR generation vs scanner vs member validation |
| NAV-04 | Chat | `chat-unactive`, `chat-new`, `chat-assistant` | I | Forum, direct messaging, bot, permissions |
| NAV-05 | Settings | `setting-active`, `setting-unactive` | I | Profile, notification, logout, app preferences |
| NAV-06 | Login | `bg-login` | I | Login methods, registration, OTP, SSO, recovery |

**Observation:** The presence of an `*-active` and `*-unactive` icon pair suggests tab selection states, but does not establish the exact navigation implementation or even whether all tabs are available in production.

## 4. Functional module inventory

| ID | Candidate module | APK evidence (asset names) | Candidate capability to verify | Confidence | Priority for discovery |
|---|---|---|---|---|---|
| MOD-01 | Authentication / member entry | `bg-login` | Login, registration, session lifecycle | I | P0 |
| MOD-02 | Member home/dashboard | `home-active`, `home-unactive`, `logo-kadin-new` | Home feed, quick actions, personalization | I | P0 |
| MOD-03 | News & information | `news-active`, `news-unactive` | News feed, article detail, categories | I | P0 |
| MOD-04 | QR / digital identity | `qr-active`, `qr-unactive` | Member QR, verification, scanning | I | P0 |
| MOD-05 | Chat & assistant | `chat-unactive`, `chat-new`, `chat-assistant` | Chat, assistant, notifications | I | P0 |
| MOD-06 | Settings / account | `setting-active`, `setting-unactive`, `user-2` | Profile, preferences, logout | I | P0 |
| MOD-07 | Events / calendar | `kalender` | Event listing, event detail, calendar | I | P1 |
| MOD-08 | Service catalogue | `service` | Service directory, request or referral | I | P1 |
| MOD-09 | Business directory | `business-directory` | Company/member search, profile detail | I | P1 |
| MOD-10 | Business forum | `business-forum` | Business discussion, opportunities | I | P1 |
| MOD-11 | Chat forum | `chat-forum` | Group conversations, channels | I | P1 |
| MOD-12 | Regional KADIN | `kadin-provinsi` | Provincial chapters, directory, contacts | I | P1 |
| MOD-13 | Associations | `asosiasi` | Association directory / affiliation | I | P1 |
| MOD-14 | Training & certification | `training-and-certification` | Programs, enrollment, certificates | I | P1 |
| MOD-15 | Business mentoring | `business-mentoring` | Mentors, matching, scheduling | I | P1 |
| MOD-16 | Business development | `business-development` | Programs, opportunities, advisory | I | P1 |
| MOD-17 | Membership renewal | `membership-renewal` | Renewal eligibility, application, payment | I | P0 |
| MOD-18 | Other services | `other` | Additional services / menu | I | P2 |
| MOD-19 | COO service | `coo` | Certificate of Origin-related service | I | P1 |
| MOD-20 | ATA Carnet | `atacarnet` | ATA Carnet information or service | I | P1 |
| MOD-21 | APEC | `apec` | APEC-related service | I | P1 |

**Priority is for *discovery* only**, not a decision that the existing application implements or that a successor must implement each module.

## 5. Platform capabilities and dependencies (not product features)

| Capability | Packaged evidence | What can be concluded | What cannot be concluded |
|---|---|---|---|
| Camera | VisionCamera native library | Camera SDK is packaged | QR scanner, document capture or active use |
| Push | Firebase Messaging components (companion report) | Push dependency is present | Push registration or delivered notifications |
| Navigation | RN Screens, React Navigation assets | Navigation libraries are packaged | Actual route names and deep links |
| Local persistence | Android Room components (companion report) | Local DB library packaged | Schema, tables, offline support |
| Networking | OkHttp components (companion report) | Networking dependency packaged | Endpoints, auth protocol, data contracts |
| SVG / gestures | RN SVG, Gesture Handler | UI-related dependencies packaged | Which views use them |
| OTA | Expo Updates configuration | OTA URL configured | Actual update rollout behavior |

## 6. Candidate user journeys requiring runtime validation

These are **hypothetical discovery scripts**, not recovered implementation flows.

| Flow ID | Test scenario | Key questions | Evidence to collect |
|---|---|---|---|
| FLOW-01 | Fresh install → launch → login | Splash, onboarding, permissions, auth method? | Screenshots, screen transitions |
| FLOW-02 | Login → home → service menu | Which tiles exist and what is clickable? | Screen recording, navigation map |
| FLOW-03 | Home → news → article | Article detail, links, filters? | Screenshots, state matrix |
| FLOW-04 | Home → QR | Is QR displayed, scanned, or both? | Permission prompts, screen states |
| FLOW-05 | Home → chat | Human chat, forum or AI assistant? | Consent, error/empty states |
| FLOW-06 | Services → membership renewal | Form fields, verification, payment? | Sanitized form map, outcome states |
| FLOW-07 | Services → business directory | Search, filtering, detail pages? | List/detail screenshots |
| FLOW-08 | Services → COO / ATA Carnet / APEC | Informational pages vs transactional services? | Links, forms, handoffs |
| FLOW-09 | Profile → settings → logout | Account settings, persistence, session termination? | Screenshots, test notes |
| FLOW-10 | Network disabled / permission denied | Offline/error/retry behavior? | State matrix, sanitized logs |

## 7. Roles, entities, integrations — not yet established

**Roles (U):** Guest, member, company admin, KADIN regional operator, and central admin are **candidate personas only**; no role model has been recovered from the APK.

**Candidate data entities (H):** User, Member, Company, NewsArticle, Event, Service, MembershipRenewal, BusinessDirectoryEntry, Conversation, Message, and ServiceApplication. These are **design hypotheses** pending observed UI/API evidence.

**Unknown integrations:** Login/SSO, membership database, payment gateway, CMS, chat backend, push provider configuration, QR verification service, and regional systems. No production endpoint or credentials are asserted in this report.

## 8. Discovery acceptance criteria

- [ ] Run APK on supported Android emulator/device and capture first-launch sequence.
- [ ] Enumerate actual bottom tabs and navigation tree; match to icon candidates.
- [ ] Verify each MOD-01 through MOD-21 as active, inaccessible, placeholder, or not present.
- [ ] Record screen ID, entry point, role requirement, input, output, loading/empty/error states.
- [ ] Confirm which flows require authenticated access using an authorized test account.
- [ ] Distinguish informational content, external webviews, and native transactional flows.
- [ ] Inspect manifest and DEX with JADX/Apktool for component and permission inventory.
- [ ] Inspect Hermes bundle only where legally authorized; document behavior, not proprietary code reproduction.
- [ ] Validate API contracts only against authorized test/staging systems.
- [ ] Approve final feature list with product owner before writing implementation PRD.

## 9. Feature inventory template for runtime findings

| Field | Required entry |
|---|---|
| Feature ID | `MOD-XX` |
| Screen ID | `SCR-XXX` |
| Feature name | User-facing label |
| Entry point | Tab, menu, deep link, etc. |
| Role | Observed account role |
| Preconditions | Auth, permissions, network |
| Main flow | Steps actually performed |
| Data fields | Visible fields, synthetic values only |
| Outcomes | Success, loading, empty, failure |
| Dependencies | Observed external integrations |
| Evidence | Screenshot/video/log reference |
| Status | Verified / Partial / Not available / Unknown |
| Confidence | Confirmed observation / Hypothesis |
| PRD decision | Reuse concept / Redesign / Exclude / Pending |

## 10. Proposed clean-room successor boundaries

1. **Reference analysis repository:** APK metadata, evidence ledger, sanitized screenshots and observations; restrict access.
2. **Product specification repository:** approved user journeys, feature definitions, acceptance criteria and independent design assets.
3. **New application repository:** React Native + Expo + TypeScript candidate architecture, independently authored components, APIs and tests.
4. **Backend contracts:** derive from new product requirements; do not rely on unauthorized reference production endpoints.
5. **Agent workflow:** use Codex/OpenCode on approved specifications; prohibit importing decompiled implementation or third-party secrets.

## 11. Next deliverables and recommended sequence

1. `SCREEN-INVENTORY.md` — runtime-confirmed screen catalog and screenshot references.
2. `USER-FLOWS.md` — verified navigation graph and edge cases.
3. `FEATURE-INVENTORY-v1.1.md` — upgrade indicated modules to verified status.
4. `PRD.md` — scope decisions and acceptance criteria for new app.
5. `SAD.md`, `SDD.md`, `uiux.md`, `AGENTS.md` — implementation-ready specifications.

## 12. Evidence appendix — first-party asset names

From Expo asset manifest, excluding library/node_modules assets:

`bg-login`, `logo-kadin-new`, `home-active`, `home-unactive`, `news-active`, `news-unactive`, `qr-active`, `qr-unactive`, `chat-unactive`, `setting-active`, `setting-unactive`, `placeholder`, `kalender`, `service`, `business-directory`, `business-forum`, `chat-forum`, `kadin-provinsi`, `asosiasi`, `training-and-certification`, `business-mentoring`, `business-development`, `membership-renewal`, `other`, `chat-new`, `chat-assistant`, `user-2`, `bg-dalam`, `coo`, `atacarnet`, `apec`.

**Provenance:** `assets/app.manifest` within supplied APK. Asset paths are of the form `/assets/src/assets/images` and `/assets/src/assets/images/icons`.
