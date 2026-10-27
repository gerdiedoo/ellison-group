# Executed verification

Latest foundation verification: October 27, 2026, following the initial implementation checks on October 26. No external Supabase or Gemini credentials were configured.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed; no warnings or errors |
| `npm run build` | Passed, using Next.js's supported webpack compiler |
| `npm run test` | 51 unit tests passed across four files; compile-time insert/identity contracts passed with TypeScript |
| `npm run test:db` | All five migrations applied to fresh PostgreSQL 17; 42 database/security assertions passed with deliberately broad PUBLIC/API defaults |
| Playwright desktop and mobile | 22 tests passed, using the actual production server |
| `npm run verify:prototype` | 10 original source files and 10 illustration assets matched their SHA-256 manifest |
| Browser bundle secret-name scan | No service-role key or Gemini API key variable references found in `.next/static` |

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

## Not verified against live services

No claims are made for successful live Google OAuth, Supabase Auth sessions, real Storage HTTP uploads, Gemini calls, or authenticated CRM browser workflows. The isolated PostgreSQL suite validates database logic and policies, not GoTrue/PostgREST/Storage HTTP behavior. Real database-backed public filtering/pagination and authenticated CRUD need the configured-project acceptance checks in README.

Turbopack failed to create its worker socket in this environment. The final scripts use the supported webpack compiler, whose production build completed successfully. The Supabase CLI's initialization also could not create its global configuration directory on the read-only user home; the isolated PostgreSQL tests avoided that limitation. Application setup can use the Supabase SQL Editor or a normally configured CLI.
