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

All six implementation phases are complete in source. Local TypeScript, lint, production build, unit tests, browser flows and isolated PostgreSQL permissions are verified. The configured-project acceptance checks (Auth/OAuth, Storage HTTP, Gemini and authenticated full-browser CRUD) remain external setup tasks, listed explicitly in README and TEST_RESULTS. Nothing was deployed.

Public sections map to dedicated App Router pages, with the original editorial sections retained on the homepage. Prototype property dialogs became shareable property routes with galleries; form dialogs became reusable validated forms. Hash-route admin pages became server-protected route segments. Settings and all functional edits persist to Supabase; mock resets, sign-in choosers, simulated notifications and local CRM state were removed from the runtime.
