# Executed verification

Initial foundation verification: October 27, 2026, following implementation checks on October 26. These checks preceded configuration of external Supabase/Gemini credentials; later live-service results follow below.

| Check                           | Result                                                                                                                                 |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`             | Passed                                                                                                                                 |
| `npm run lint`                  | Passed; no warnings or errors                                                                                                          |
| `npm run build`                 | Passed, using Next.js's supported webpack compiler                                                                                     |
| `npm run test`                  | 51 unit tests passed across four files; compile-time insert/identity contracts passed with TypeScript                                  |
| `npm run test:db`               | All five migrations applied to fresh PostgreSQL 17; 42 database/security assertions passed with deliberately broad PUBLIC/API defaults |
| Playwright desktop and mobile   | 22 tests passed, using the actual production server                                                                                    |
| `npm run verify:prototype`      | 10 original source files and 10 illustration assets matched their SHA-256 manifest                                                     |
| Browser bundle secret-name scan | No service-role key or Gemini API key variable references found in `.next/static`                                                      |

## Foundation verification details

The follow-up adds tests for paired/blank/invalid Supabase configuration, canonical origins, explicit OAuth flags, abuse-protection secrets and secret-safe errors. SSR tests mock only the SDK boundary and verify claims calls, per-request client creation, incoming/outgoing cookie updates, preservation across multiple writes, and Cache-Control/Expires/Pragma forwarding. These are unit tests, not claims of live authentication success.

PostgreSQL tests additionally verify existing-user visitor provisioning, API-role TRUNCATE/TRIGGER/REFERENCES denial on every app table, protected audit sequences, locked reply paths, explicit server-role access and inactive-agent denial. TypeScript contracts reject incomplete listing inserts, messages without conversations, and client-supplied audit identities.

`docs/PROTOTYPE_INVENTORY.md` records every source file and outstanding parity behavior; `docs/ROUTE_MAP.md` maps the actual filesystem routes and permission boundaries. No public design/component files or original assets changed in this foundation update.

## Unit coverage

Server email normalization, explicit consent, honeypot rejection, valuation context, showing dates, request UUIDs, message size, ignored lead ownership claims, safe redirects (including control characters), property numeric/slug validation, assistant configuration, grounded property facts, invented-ID rejection, unsupported valuations, human assistance, model response validation and pagination bounds.

## PostgreSQL integration coverage

A fresh disposable Docker container runs the actual migrations, RLS policies and transactional functions. The bootstrap supplies minimal Supabase `auth.users`, `auth.uid()`, Storage tables and platform roles. All test records roll back; the runner removes its own container.

Verified: anonymous published-only catalog access; private leads, conversations and settings; metadata cannot set roles; normalized-email deduplication; inquiry history and idempotency; existing identity preservation; own-account favorites and cross-account isolation; staff reads; settings/role restrictions; immutable audit log; self-access restrictions; rejected late AI reply after human handoff; visitor hash isolation; atomic rate limiting; RLS on all application tables; staff replies; full transcript search; explicit human handling; staff-only assignments; valid Storage paths; invalid-path and visitor upload denial; explicit bot resume; audit generation.

## Browser scope

The browser suite uses the actual production Next.js server without service credentials. It exercises buying/selling intent, submitted listing filters, neighborhood selection, the three-step valuation wizard, protected CRM redirects, favorites sign-in, legal pages, chat opening/closing, broker content, journal routes, foreign-origin rejection, explicit failure instead of false form success, and desktop/mobile overflow. Screenshot previews were inspected.

An initial added browser assertion matched both the form alert and Next.js's route accessibility announcer. It was scoped to the main content before the final rerun. This was a test locator issue; the form already displayed the correct unavailable-service error.

## Initial foundation boundary

At the foundation stage, successful live Google OAuth, Supabase Auth sessions, Storage HTTP uploads, Gemini calls and authenticated CRM browser workflows had not been verified. The isolated PostgreSQL suite validates database logic and policies, not GoTrue/PostgREST/Storage HTTP behavior. Real database-backed public filtering/pagination and authenticated CRUD need the configured-project acceptance checks in README.

Turbopack failed to create its worker socket in this environment. The final scripts use the supported webpack compiler, whose production build completed successfully. The Supabase CLI's initialization also could not create its global configuration directory on the read-only user home; the isolated PostgreSQL tests avoided that limitation. Application setup can use the Supabase SQL Editor or a normally configured CLI.

## Public site acceptance — October 27, 2026

The public website was built and tested with the configured Supabase project. The live browser acceptance case creates a confirmed temporary visitor account and two explicitly marked published property fixtures, then verifies real catalog search/filter results, property details and gallery navigation, sign-in, favorites insertion/removal, showing and question forms, valuation address prefill/submission, contact capture, email normalization/deduplication and recorded inquiry preferences. Fixtures are removed in a finally block; no staff account is promoted and no historical listing is published by the tests. Supabase administrative credentials stay in the Node test runner.

The optional draft import preserved all 16 prototype listings in the database as unpublished records. An initial test locator matched the login URL's `next` parameter before navigation completed; it was replaced with an exact destination URL. The new header sign-in link also required scoping the favorites sign-in assertion to main content. These locator fixes are included in the final suite.

Current unit count: 53 passed. The two unconfigured-environment browser cases are skipped when credentials are present; live persistence cases run instead. See the final browser verification result recorded below. Google consent is interactive and was not automated; Gemini's prior provider-overload response remains unrelated to these public form/database checks.

Final public-site result: production build, TypeScript and lint passed; 53 unit tests passed; 22 desktop/mobile browser tests passed, including actual Supabase Storage upload/public image read, sign-in/sign-out, favorites, and four persisted lead/inquiry flows. Two unconfigured-only cases were skipped because live credentials are present. All 10 source files and 10 original SVG assets passed preservation checks. Temporary acceptance users, properties, images and leads were removed; real audit events remain immutable by design.

## CRM and Gemini acceptance — October 27, 2026

Final application verification: TypeScript, ESLint and the production build passed; 68 unit tests passed. All five migrations applied to disposable PostgreSQL 17 and all 42 database/security assertions passed again. The preservation check matched all 10 original source files and all 10 SVG assets. A scan of `.next/static` found neither privileged secret values nor service-role/Gemini key variable references.

The full production-browser regression executed 28 cases: 25 passed, two unconfigured-only cases were skipped because live credentials are present, and the mobile Gemini case encountered an actual provider 503. That unchanged mobile case was rerun separately and passed (34.1 seconds), without needing its configured retry. Thus all 26 applicable desktop/mobile scenarios passed across these final runs; this was not a single uninterrupted green run. Desktop chat passed in 37.5 seconds, and both complete CRM acceptance cases passed in the full run.

The live CRM cases verify property create/edit/publish/unpublish/delete, genuine image upload/read/removal and rejected forged PNG data, normalized manual leads, notes/interests/tasks, inquiry status/assignment, inbox replies/resolution/internal notes, unchanged-value settings persistence, team role management, dashboard counts, analytics, audit history and filtered CSV export. Direct public-key API sessions verify visitor/anonymous privacy, agent CRUD, note-author restrictions, self-escalation denial, immutable audits, settings restrictions, inactive-agent denial, visitor upload denial and agent Storage access. A captured administrator Server Action replayed with visitor cookies was rejected.

The live chatbot cases verify actual Gemini-selected published property prices, features and links; exclusion of a draft; HttpOnly visitor identity; cross-browser transcript/message denial; foreign-origin denial; provider-independent natural-language human handoff; no assistant messages while human handling remains active, even with a malicious resume claim; consented lead creation and normalized deduplication with two preserved inquiries; the same visitor messages in the staff inbox; staff replies appearing in the visitor widget; explicit staff bot resume followed by a real factual AI reply; rejection of a late completion after a simulated in-flight lease and handoff; and rejection of writes to a resolved conversation.

Earlier iterations exposed an ambiguous select label, loss of form input after invalid uploads, and an effect returning the browser's scroll result as React cleanup. These were corrected before the final checks. Provider overload/timeouts were real: the alias/fallback models were intermittent. The local configuration now uses an available `gemini-3.5-flash`; SDK automatic retries are disabled and an optional explicit fallback is bounded. Provider failures continue to produce a persisted, honest unavailable message. Model availability remains an external dependency.

Tests use only explicitly marked temporary accounts/properties/leads/conversations/images, clean their own fixtures, and preserve immutable audit events. No existing user was promoted and no historical draft was published. Google consent and production deployment/callbacks were not automated or claimed as verified.

## Whole-application audit — October 27, 2026

The final audited source passed TypeScript, ESLint and the production build, with 83 unit tests across 10 files. All six migrations and 47 policy/integrity assertions passed in isolated PostgreSQL 17. The complete production-browser run passed 32 desktop/mobile cases, with two unconfigured-only skips, in one 4.8-minute run. Two additional visual-only reruns passed after screenshots were stabilized for font loading/animations; these repeat existing cases and are not added to the unique-case count. Desktop/mobile screenshots were inspected. The final mobile launcher/menu adjustment then passed all 26 affected public-browser cases, with two unconfigured-only skips; captures explicitly waited for the homepage rather than accepting its loading fallback.

The expanded live acceptance follows showing, property-question, valuation, contact and newsletter submissions into the same normalized lead, then signs in with a temporary agent and updates the captured showing inquiry through its new detail route. Tests also cover note text editing through the UI and direct API, malformed staff records, repeated queries, invalid OAuth callbacks/numeric filters, unknown journal keys and stale-chat polling recovery. Actual Gemini answers, staff replies/handoff/resume, role denials, Storage operations, settings persistence, audit and reports all passed in the completed run.

The hosted Auth settings endpoint confirmed Google is enabled. Interactive Google consent and production callbacks were not tested. The separate `npm run audit:hosted-notes` **exited 1**, correctly reporting that the hosted project still permits changes to a temporary note's author. The new migration 006 rejects that change in real isolated PostgreSQL, but cannot be applied using only the configured API key; no DDL database connection is available. Apply it through SQL Editor/CLI and rerun the probe. This finding is not reported as passed hosted enforcement.

One intermediate run exposed a neighborhood-count object that React could not serialize and a note assertion matching both paragraph/editor. Both were corrected before the completed run. A catalog-boundary regression test now guards serialization and inherited-property collisions. Mocked SDK-boundary tests cover failed Auth/code exchange and Storage operations; they do not claim live provider fault injection. Original source/asset hashes and the browser secret scan passed again. Full findings, limits and required external steps are in `AUDIT.md`.

## Original admin interface restoration — October 27, 2026

The admin now uses the original scoped CSS, original navigation SVG artwork, original shell and page structures described in `ADMIN_PARITY.md`. TypeScript, ESLint and the final production build passed; 87 unit tests passed across 11 files. Preservation checks again matched all 10 archived source files and 10 illustrations, and the final browser bundle secret scan passed.

The completed full production-browser regression executed 36 cases: 33 passed, 2 unconfigured-only cases were skipped, and the desktop Gemini case received a real provider 503. Both desktop/mobile prototype-comparison cases passed, including computed geometry against the unchanged source, screenshots of the main admin screens, collapse persistence, mobile navigation and profile sign-out. Both complete CRM/API cases and both public-to-admin persistence cases passed. The source's inline pipeline saves required test synchronization; ambiguous list/transcript text assertions were scoped to the transcript. An intermediate test-only wait for an open response stream was removed; timed-out runs were not counted as passed.

After the final source-label/color refinement, the focused rerun passed both prototype-comparison cases and the desktop Gemini case. The repeated mobile Gemini case encountered provider unavailability (including its retry); that same full mobile chat/handoff/resume case had passed in the full regression. All 34 applicable unique browser scenarios therefore passed at least once across these runs, but no single completely green external-service run is claimed. API-dependent Gemini availability remains intermittent; the application displays and persists its unavailable response honestly.

Visual captures use temporary marked data, not invented production figures. No historical listing was published or existing user promoted. No new database migration or environment variable is needed for the interface restoration. The previously recorded hosted migration 006 requirement remains separate. The reference prototype was served only on a separate local test port; it is not part of the deployed application.

## Latest prototype follow-up and requested demo data — October 27, 2026

The second uploaded bundle matched all ten original source files. The follow-up restores editable suggested prompts, saved conversation previews and readable audit labels, the public home inventory/filter section, and the original mobile forest navigation. A public `/api/version` endpoint identifies the running interface revision without exposing configuration. The user's preview is their own `localhost:3000` server; pulling and restarting/rebuilding that checkout is documented in LOCAL_PREVIEW.md.

Executed checks:

- TypeScript and ESLint passed after the final implementation and test-selector changes.
- Production `next build --webpack` passed. The final browser bundle scan checked 64 JavaScript/JSON/map artifacts against the actual server credential values and found no privileged secrets.
- All **90 unit tests across 11 files** passed, including suggested-prompt validation/defaults.
- Prototype preservation matched all **10 archived source files and 10 illustrations**.
- The full desktop/mobile browser run executed **38 cases: 32 passed, 2 skipped, 4 failed**. Two failures were real Gemini provider **429** responses. The other two were outdated sign-out selectors after restoring account/mobile menus; the tests were updated to open the visible menu first.
- The focused rerun of both prototype-comparison and both complete public-to-admin persistence cases passed **4/4**. Across these runs, **34 unique UI/data browser cases passed**. Both Gemini cases remain failed in this follow-up; they were not retried or counted as passed. The two skipped cases require deliberately missing integration configuration, which this project has configured.
- Desktop/mobile admin geometry was compared with the unchanged source; screenshots captured the primary CRM screens. The new home collection/navigation cases passed on both devices. Full CRM CRUD/direct-API authorization checks passed on both devices, as did catalog/images/favorites and all five public inquiry flows into one normalized CRM lead after correcting the test navigation.
- `/api/version` returned HTTP 200 and `interfaceRevision: "prototype-parity-2"` from the local production server.

At the user's explicit request, the configured Supabase project now retains six `[DEMO]` leads, six inquiries, three conversations, nine messages, four tasks, four interested-property links and two unpublished properties. The seed's removal was actually executed and the exact IDs verified absent; final recreation succeeded. A second seed inserted zero rows and preserved all existing field values. Service queries verified counts and parent references; anonymous publishable-key queries returned no draft properties and denied private CRM tables. No authentication accounts, existing staff roles, real contacts, company settings or original historical drafts were changed by the seed. Immutable audit records remain. See DEMO_DATA.md for repeatable seeding/removal.

No new migration or external credential is required for this interface update. The previously documented hosted migration 006 and Google consent/production callback acceptance remain independent setup boundaries. No hosted deployment or successful Gemini response is claimed for this follow-up.
