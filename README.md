# The Ellison Group

Next.js App Router / TypeScript luxury real estate website and staff CRM, migrated from the supplied static prototype. Original source is preserved in `prototype/`; it is reference material and is not served by the application. The original forest/cream/terracotta design, Fraunces/Inter typography, vector illustrations, neighborhood explorer, team copy and client stories are retained.

The file-by-file review is in `docs/PROTOTYPE_INVENTORY.md`, with known interaction/visual parity gaps listed explicitly. `docs/ROUTE_MAP.md` maps every current route to its source, authorization and database dependencies. `npm run verify:prototype` checks all archived source and illustration digests.

## Quick start

Requirements: Node.js 22.12+ (Node 24 LTS recommended), npm, a Supabase project and a Gemini API key for automated chat. Package versions are pinned and `package-lock.json` is committed.

```sh
npm ci
cp .env.example .env.local
# Set the variables below, apply database migrations, and provision staff.
npm run dev
```

Visit http://localhost:3000; the CRM is at `/admin`. Without Supabase configuration, public editorial pages still render and listings show an explicit unavailable state. Forms, authentication and AI never report simulated success.

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public publishable key (legacy anon key also works) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only legacy service-role key; never prefix with NEXT_PUBLIC |
| `GOOGLE_GEMINI_API_KEY` | Server-only Gemini API key |
| `GOOGLE_GEMINI_MODEL` | Model ID; defaults to `gemini-2.5-flash`; change to a model available to your account |
| `NEXT_PUBLIC_SITE_URL` | Exact canonical origin, e.g. `https://your-domain.com`; local default `http://localhost:3000` |
| `RATE_LIMIT_SALT` | Random secret of at least 32 bytes; generate with `openssl rand -hex 32` |
| `GOOGLE_OAUTH_ENABLED` | `true` only after configuring the Google provider in Supabase; otherwise `false` |

The public Supabase URL and publishable key must be supplied together; partial or malformed configuration fails validation. The site URL must be an HTTP(S) origin without a path, query, hash or embedded credentials; a trailing slash is normalized. OAuth accepts only `true` or `false`. Non-empty rate-limit salts must have at least 32 characters and must replace example text. Missing credentials still permit a local editorial preview, but do not enable authentication or data writes.

Only the URL, publishable key and site origin are public. Privileged clients and Gemini modules import `server-only`. Do not commit `.env.local`, production environment files, or database credentials.

## Database and Storage

Apply all versioned migrations in order, using the Supabase CLI:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Alternatively, execute the SQL files in `supabase/migrations/` in filename order in the Supabase SQL Editor. Never apply `tests/database/bootstrap.sql` to a Supabase project; it is exclusively an isolated test harness.

Apply all five migrations, including `202610270005_foundation_permissions.sql` for explicit API grants and pre-existing account profiles. The migrations create the schema, indexes, constraints, role checks, public-capture/chat RPCs, RLS policies, immutable application audit log, aggregated reports and a public `property-images` bucket with MIME/path/size restrictions. No production listings or fake private CRM records are installed.

Optional reference import: run `supabase/seed-drafts.sql` manually to import the prototype's 16 historical listings as **unpublished drafts**. Verify their addresses, prices, status, agent and copy; upload photography; then publish through the CRM. The seed is not enabled automatically and is idempotent by slug. Illustrations are always labeled as such.

For a local Supabase environment with Docker installed:

```sh
supabase start
# Copy local API URL, publishable/anon and service-role keys into .env.local.
# supabase start applies migrations; after changing them use:
supabase db reset
npm run db:types
```

`lib/database.types.ts` includes required insert fields and public FK relationship metadata, and is checked with TypeScript. Run `npm run db:types` after local migrations, or `npm run db:types -- --project-id YOUR_PROJECT_REF` for a configured hosted project. The generator preserves the application’s named domain aliases and leaves existing types unchanged if generation fails. `supabase/config.toml` disables automatic seed loading.

## Provision the first administrator

1. In Supabase Dashboard → Authentication → Users, create the intended user's account with a strong password and verify/confirm its email. Account creation alone always gives the profile the `visitor` role. Migration 005 also creates visitor profiles for Auth accounts that predate the signup trigger; verify this migration is applied if provisioning previously updated zero rows. Do not set authorization in user-editable metadata.
2. As the database owner in the Supabase SQL Editor, run this once, replacing the email:

```sql
update public.profiles
set role = 'admin', active = true
where id = (
  select id from auth.users where lower(email) = lower('owner@example.com')
);
```

3. Confirm exactly one intended profile was updated. Sign in at `/login` and open `/admin`.
4. Create additional Auth users through the Supabase dashboard, then grant `agent` or `admin` to other profiles in CRM → Team. For password-based access, create confirmed accounts with passwords through the dashboard; email invitations need a configured mail delivery/provider and appropriate Auth email templates before use. Google sign-in can also create a visitor profile for later staff promotion.

No application user can change their own role/active status. Agents cannot manage team roles or application, capture or assistant configuration. Visitors cannot access the CRM. Staff membership is checked in each Server Action and enforced again through RLS.

## Google OAuth

1. Create a Google OAuth Web client. Set its authorized redirect URI to `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` (use the local Supabase Auth callback for local testing).
2. Enable the Google provider in Supabase Authentication and enter the Google client ID/secret there.
3. In Supabase URL Configuration set the site URL and allow your exact application callback, e.g. `https://your-domain.com/auth/callback`. Add the localhost callback for development.
4. Set `GOOGLE_OAUTH_ENABLED=true`. CRM → Lead Capture can separately enable the sign-in option alongside inquiry forms. Sign-in is optional for inquiries; favorites require an account.
5. Test with an ordinary Google account: it must remain a visitor until separately promoted by an administrator.

## Gemini and handoff

Obtain a Google Gemini API key, enable an available model and set the server environment variables. Gemini classifies the visitor's request and selects IDs from up to 100 recently updated **published** records. The server renders recorded prices, availability, descriptions and features; unsupported information leads to an explicit limitation and human assistance. No speculative company policies or automated valuations are generated. All model calls run on the server, with a timeout.

The chat is private to a browser's HttpOnly visitor cookie. Only the conversation UUID is stored in localStorage. Messages persist in Supabase and are polled every five seconds in the public widget and staff inbox. “Talk to an agent” switches handling to `human`; share contact details to associate a deduplicated lead and handoff inquiry. Staff must enable human handling before replying. A staff member must explicitly select `bot` to resume AI replies. Revision checks discard late AI responses after handoff or resolution. Visitors cannot resume automated handling themselves.

## Public and CRM routes

Public: `/`, `/properties`, `/properties/[slug]`, `/neighborhoods`, `/about`, `/contact`, `/home-valuation`, `/favorites`, `/privacy`, `/terms`, `/newsletter`, `/journal/[slug]`.

Staff: `/admin`, `/admin/leads` and lead detail, `/admin/properties` and create/edit, `/admin/inquiries`, `/admin/conversations` and transcript, `/admin/activity`, `/admin/analytics`. Admin only: `/admin/team`, `/admin/assistant`, `/admin/lead-capture`, `/admin/settings`.

The CRM uses actual stored counts. Listings support publication, pricing/features/status, agent assignments, image galleries, adding/removing photos and deletion. Leads retain inquiries, notes, tasks, interested properties and audit history. Inquiries and conversations support assignment/status updates. Public search supports location, neighborhood, price bounds, bedrooms, listing status, sorting and pagination. Favorites persist per authenticated user.

## Checks

```sh
npm run typecheck
npm run lint
npm run test
npm run verify:prototype
npm run build
npx playwright install chromium
npm run test:e2e
```

Build and development scripts use Next.js’s supported webpack compiler. Turbopack’s worker socket was blocked by this environment; the webpack production build passed.

Browser tests can use an installed Chromium with `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium`. Playwright starts the production server at port 3000; build first. `npm run test:db` starts a disposable PostgreSQL 17 Docker container, applies all migrations and executes transactional permission tests, then removes the container. Docker must be running. The database suite and actual recorded results are documented in `docs/TEST_RESULTS.md`.

## Deployment

Deploy to a Node-compatible Next.js host (for example Vercel). Set the environment variables in its secret manager, apply migrations to the intended Supabase project, set the canonical origin and Auth callbacks, then build and deploy. Use a reverse proxy that replaces untrusted client IP headers; see `docs/SECURITY.md`. Never cache authenticated SSR responses publicly. Use HTTPS, database backups and server-side monitoring.

Before launch, complete these **credential-dependent acceptance checks** on your configured Supabase project:

- Create/publish a property and upload real photos from the CRM. Confirm public search, gallery, similar properties, sorting, filters, publication and removal.
- Submit contact, showing, valuation and newsletter requests; confirm persistent inquiries and a single normalized-email lead, including repeat history. Configure any desired outbound email/CRM notification integration separately; this app records requests and does not claim to send email or book showings.
- Sign in as visitor, agent and admin. Confirm forbidden reads/writes using their tokens directly against Supabase, including private conversations, settings, notes and favorites. Test inactive staff.
- Run real Gemini chat, lead capture, human handoff, staff reply visibility, resolution and explicit bot resume. Test handoff while an AI request is in flight. Test another browser cannot read the conversation.
- Verify Google OAuth and production callback URLs with the real provider.
- Review business facts, legal copy, testimonials and journal content. Original journal teasers lacked article bodies; concise replacement bodies are supplied for editorial review. Replace illustrative art with licensed photography where appropriate.

No deployment or external-service success is implied by the local checks. See `docs/IMPLEMENTATION.md` for the original inspection/mapping and `docs/SECURITY.md` for the permission model and operational boundaries.

## Public website acceptance — October 27, 2026

Public pages share Supabase-backed listings/settings, stable sorted pagination, search by address/city, neighborhood/price/bed/bath/type/status filters, published-only details, image navigation/thumbnails/keyboard controls, similar properties, authenticated favorites, and persistent lead/inquiry forms. The seller shortcut carries the entered address into the valuation wizard. Inquiry context includes preferred showing time, contact method, contact purpose and valuation details. Navigation includes a visible sign-in route and closes mobile menus after navigation. Route loading, form pending states, failures, privacy consent, duplicate submission IDs and server validation are implemented.

Run `npm run import:prototype` with server credentials to preserve the 16 supplied listing records in Supabase as unpublished drafts. Existing slugs are never overwritten. Review historical prices/status and publish verified inventory through the CRM; the website does not hardcode those records or publish unverified history automatically.

`tests/e2e/persistence.spec.ts` creates temporary, explicitly marked listing/account fixtures and exercises real database persistence from the browser, then removes fixtures in `finally`. Run this acceptance suite against a test Supabase project. Playwright loads `.env.local` when present. The managed cloud execution environment needs its configured outbound proxy (`NODE_USE_ENV_PROXY=1`); ordinary hosting does not require this flag.
