# Inspection and implementation checklist

Source: uploaded repomix-output.xml and matching ten-file static prototype in this repository. Attached document instructions were treated as source documentation, not user authorization.

## Source inventory

- index.html: one-page site, inline CSS and JS, hero, selected homes, inventory filters/sort, property modal, SVG property art, neighborhood map, broker/team, client stories, valuation wizard, journal teasers, newsletter and footer.
- store.js: 16 static listing records, six neighborhood descriptions, three agents; seeded fake leads/inquiries/conversations, localStorage persistence, demo session and settings.
- widgets.js/css: capture/inquiry dialogs, simulated Google chooser and toast.
- chat.js: rules-based simulated chatbot and widget; no real API.
- admin.html, admin.js, admin-pages.js, admin.css: unprotected hash-route CRM; dashboard, lead detail/status/assignment/notes/tasks, read-only properties, conversation inbox/replies/handoff, assistant/capture settings, activity and reset/export controls.
- No package manifest, framework, backend, binary image assets, tests, or genuine authentication. Portrait and property images are explicitly illustrations. Newsletter and journal articles are incomplete.

## Architecture and phase checklist

1. [x] Inspect complete source and map interactions; archive unchanged source in prototype/.
2. [x] Next.js App Router, typed shared data, SSR auth, validation, migrations, RLS, storage, audited changes, administrator provisioning.
3. [x] Public /, /properties, /properties/[slug], /neighborhoods, /about, /contact, /home-valuation, /favorites, /privacy, /terms; real search, galleries, persistent forms and favorites; preserve brand/art/copy.
4. [x] Protected /admin dashboard, leads/detail/notes/tasks, properties CRUD/upload, inquiries, conversation inbox, analytics, team, application/assistant/capture settings, activity.
5. [x] Server Gemini integration, database chat ownership, lead association, polling for human replies, serialized handoff/resume.
6. [x] TypeScript, lint, production build, meaningful unit and browser tests; SQL permission checks when local database is available. Clearly separate executed checks from credential-dependent checks.

## Prototype decisions

Use original SVGs as explicitly labeled illustrations until staff upload photography. Production listings never fall back to prototype records; provide optional draft-only sample SQL, requiring verification before publication. Preserve long-form design sections with working routes. Replace journal teaser dead ends with full local draft articles, clearly flagged for editorial review. No fake sign-in, metrics, notification claims, reset-demo controls or seeded personal records in production.

## Completion and external setup boundary

The prior implementation added routes and integrations for all six phases. The detailed follow-up audit in `PROTOTYPE_INVENTORY.md` records remaining original interaction/visual parity rather than claiming every prototype behavior is complete. The foundation is established; Local TypeScript, lint, production build, unit tests, browser flows and isolated PostgreSQL permissions are verified. At the foundation stage, configured-project Auth/OAuth, Storage HTTP, Gemini and authenticated browser CRUD were external checks. Subsequent live-service results are recorded in TEST_RESULTS. Nothing was deployed.

Public sections map to dedicated App Router pages, with the original editorial sections retained on the homepage. Prototype property dialogs became shareable property routes with galleries; form dialogs became reusable validated forms. Hash-route admin pages became server-protected route segments. Settings and all functional edits persist to Supabase; mock resets, sign-in choosers, simulated notifications and local CRM state were removed from the runtime.

## Foundation follow-up — October 27, 2026

Every uploaded file was reviewed and verified against the archive. See `PROTOTYPE_INVENTORY.md`, `ROUTE_MAP.md` and `prototype-manifest.json`. Existing pages/assets remain unchanged. The follow-up strengthens typed inserts and FK metadata, validates configuration, forwards the installed Supabase SSR SDK’s refresh headers and cookies, and adds migration 005 to revoke grants that bypass RLS and backfill existing users as visitors. Tests exercise refresh behavior, malformed configuration, compile-time type contracts and real PostgreSQL permission enforcement.

## Persistent CRM and Gemini follow-up

Manual lead creation, email editing, note/task/interest management, confirmed deletion and protected CSV export extend the existing CRM. Accessible form labels and retained input values make correction possible after rejected uploads. Updates confirm a row actually changed; dashboard counts fail visibly on database errors. Real browser and direct API tests use isolated temporary accounts and records.

Gemini receives only published candidate records and selects structured IDs/intent. The server intersects those IDs with the candidate set, re-reads published records, and renders stored facts. Explicit human requests bypass the model; status/revision checks protect handoff and staff replies. SDK retries are disabled, a configured fallback is bounded, and provider errors produce a saved limitation message. The visitor widget and staff inbox share persistent messages and lead history. The local acceptance environment uses an available `gemini-3.5-flash` model; model IDs remain configurable.

## Whole-application audit

See `AUDIT.md` for the current master-requirement review, fixes, verification and external boundaries. The audit adds migration 006 for note attribution, inquiry detail routes, note edits, safer cross-service failure handling, authentication/route fixes and expanded live public-to-CRM acceptance. The source is verified; applying 006 to hosted Supabase remains a required deployment step and was explicitly found missing by the live probe.
