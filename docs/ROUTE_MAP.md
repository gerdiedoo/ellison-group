# Routes and application boundaries

Verified against the actual `app/` tree on October 27, 2026. Parenthesized route groups do not appear in URLs. There is one root layout; `(public)` shares the public navigation/footer/chat, while `admin/layout.tsx` guards the CRM. The prototype itself has two HTML entrypoints and anchors/hash routes, not a framework router.

| URL                         | App Router file                           | Access                                                          | Prototype mapping                                                      |
| --------------------------- | ----------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `/about`                    | `app/(public)/about/page.tsx`             | Public                                                          | Original #kerry broker/team section                                    |
| `/contact`                  | `app/(public)/contact/page.tsx`           | Public                                                          | Original #consult/cform consultation dialog                            |
| `/favorites`                | `app/(public)/favorites/page.tsx`         | Signed-in account                                               | New page for original save-property behavior                           |
| `/home-valuation`           | `app/(public)/home-valuation/page.tsx`    | Public                                                          | Original #value/vform wizard                                           |
| `/journal/[slug]`           | `app/(public)/journal/[slug]/page.tsx`    | Public                                                          | Original #journal headlines, with later review-required article bodies |
| `/neighborhoods`            | `app/(public)/neighborhoods/page.tsx`     | Public                                                          | Original #neighborhoods map                                            |
| `/newsletter`               | `app/(public)/newsletter/page.tsx`        | Public                                                          | Original #nform, now a persistent request                              |
| `/`                         | `app/(public)/page.tsx`                   | Public                                                          | Original landing-page sections; source index.html                      |
| `/privacy`                  | `app/(public)/privacy/page.tsx`           | Public                                                          | New disclosure/consent support                                         |
| `/properties/[slug]`        | `app/(public)/properties/[slug]/page.tsx` | Public                                                          | Property dialog becomes a shareable listing route; #pdlg/#property-ID  |
| `/properties`               | `app/(public)/properties/page.tsx`        | Public                                                          | Inventory filters and sorting; #inventory                              |
| `/terms`                    | `app/(public)/terms/page.tsx`             | Public                                                          | New terms page                                                         |
| `/admin/activity`           | `app/admin/activity/page.tsx`             | Active agent or administrator                                   | Original admin.html#/activity                                          |
| `/admin/analytics`          | `app/admin/analytics/page.tsx`            | Active agent or administrator                                   | Expanded original dashboard reporting                                  |
| `/admin/assistant`          | `app/admin/assistant/page.tsx`            | Administrator                                                   | Original admin.html#/assistant                                         |
| `/admin/conversations/[id]` | `app/admin/conversations/[id]/page.tsx`   | Active agent or administrator                                   | Original admin.html#/conversations/:id                                 |
| `/admin/conversations`      | `app/admin/conversations/page.tsx`        | Active agent or administrator                                   | Original admin.html#/conversations                                     |
| `/admin/inquiries`          | `app/admin/inquiries/page.tsx`            | Active agent or administrator                                   | Expanded original lead inquiry table                                   |
| `/admin/lead-capture`       | `app/admin/lead-capture/page.tsx`         | Administrator                                                   | Original admin.html#/lead-capture                                      |
| `/admin/leads/new`          | `app/admin/leads/new/page.tsx`            | Active agent or administrator                                   | Manual lead capture with confirmed contact permission                  |
| `/admin/leads/export`       | `app/admin/leads/export/route.ts`         | Active agent or administrator                                   | Filtered private CSV export                                            |
| `/admin/leads/[id]`         | `app/admin/leads/[id]/page.tsx`           | Active agent or administrator                                   | Original admin.html#/leads/:id                                         |
| `/admin/leads`              | `app/admin/leads/page.tsx`                | Active agent or administrator                                   | Original admin.html#/leads                                             |
| `/admin`                    | `app/admin/page.tsx`                      | Active agent or administrator                                   | Original admin.html#/                                                  |
| `/admin/properties/[id]`    | `app/admin/properties/[id]/page.tsx`      | Active agent or administrator                                   | Original property drawer + new edit workflow                           |
| `/admin/properties/new`     | `app/admin/properties/new/page.tsx`       | Active agent or administrator                                   | New staff create workflow                                              |
| `/admin/properties`         | `app/admin/properties/page.tsx`           | Active agent or administrator                                   | Original admin.html#/properties                                        |
| `/admin/settings`           | `app/admin/settings/page.tsx`             | Administrator                                                   | Original admin.html#/settings; real configuration                      |
| `/admin/team`               | `app/admin/team/page.tsx`                 | Administrator                                                   | New real profile/role management                                       |
| `/api/chat`                 | `app/api/chat/route.ts`                   | Visitor cookie for existing chat; origin + rate limits for POST | New GET/POST boundary replacing local chat engine                      |
| `/api/inquiries`            | `app/api/inquiries/route.ts`              | Anonymous; origin + validation + rate limits                    | New POST boundary replacing direct local mutators                      |
| `/auth/callback`            | `app/auth/callback/route.ts`              | OAuth code and PKCE verifier cookie                             | New OAuth/PKCE authorization-code exchange                             |
| `/login`                    | `app/login/page.tsx`                      | Public                                                          | New real authentication; replaces simulated account choice             |

## Shared architecture

- `app/layout.tsx`: root document, brand typography and Tailwind/global CSS. `app/(public)/layout.tsx`: public shell. `app/admin/layout.tsx`: protected CRM shell. Route authorization is repeated in data access and mutation functions; a hidden menu is never an authorization check.
- `components/`: reusable original-design sections, forms, property cards/actions/editor, chat and CRM form controls. Server rendering is the default; browser state is limited to interactions. No Vite/Firebase runtime is installed.
- `lib/supabase/server.ts`: one cookie-aware Supabase SSR client per request and an explicitly privileged server-only client. `proxy.ts` delegates verified session refresh to `lib/supabase/update-session.ts`; refreshed request/response cookies and the SDK's cache headers remain paired.
- `lib/auth.ts`: verified user plus active profile role; no roles from client/user metadata. `app/actions/auth.ts`: password sign-in, optional Google OAuth and sign-out. `app/auth/callback/route.ts`: PKCE exchange and local redirect validation.
- `lib/env-schema.ts`: pure Zod configuration parsing, safe error names and paired public settings. `lib/env.ts`: server-only access to actual process secrets. `.env.example`: configuration contract, no credentials.
- `lib/database.types.ts`: public rows, required insert keys, partial updates, FK relationships, enum/RPC contracts and table utility aliases. RLS applies regardless of what TypeScript permits.
- `lib/data.ts`, `lib/settings.ts`, `lib/security.ts`, `lib/validation.ts`: public catalog queries, supported settings, origin/rate/visitor ownership boundaries and server validation.
- `app/actions/crm.ts`: role-checked CRM Server Actions. `app/actions/favorites.ts`: account-owned favorites. `lib/gemini.ts`: server-only model requests.
- `app/error.tsx` and `app/not-found.tsx`: shared failures without exposing private data. These are infrastructure boundaries, not replacement product pages.

## Server interfaces

| Interface               | Operations and protected data                                                                                                                                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/inquiries`   | Validates request/consent and property context; salted rate limit; service-only capture RPC normalizes/deduplicates email and appends inquiry history. Chat association requires visitor ownership. Never accepts a client-selected lead ID. |
| `POST /api/chat`        | Starts a conversation or posts a visitor message/handoff. Checks origin, body size, quota, cookie ownership and published property context. Gemini is server-side; a revision guard rejects late replies after handoff.                      |
| `GET /api/chat?id=UUID` | Only the matching hashed visitor cookie can read that transcript. No lead contact records or internal notes are exposed.                                                                                                                     |
| Auth Server Actions     | Password/Google sign-in, checked redirects and sign-out; credentials stay with Supabase Auth.                                                                                                                                                |
| CRM Server Actions      | Verified active staff; administrators only for team/configuration. Zod validation and RLS independently enforce intended writes; agent replies use a locked DB function.                                                                     |
| Favorites Server Action | Verified account and published property; own-account read/insert/delete policies.                                                                                                                                                            |

## Database route dependencies and policy map

| Table                                   | Anonymous                 | Authenticated visitor       | Active staff / administrator                                          | Main routes                          |
| --------------------------------------- | ------------------------- | --------------------------- | --------------------------------------------------------------------- | ------------------------------------ |
| `properties`                            | Published rows, read only | Published rows              | Staff CRUD; published/draft status enforced                           | Catalog/details; CRM properties      |
| `profiles`                              | None                      | Own row, read only          | Staff read; admin update others; self-access changes blocked          | Login guards, assignments, team      |
| `leads`, `inquiries`, `lead_properties` | None                      | None                        | Staff CRUD under RLS; public writes only through validated server RPC | Forms, CRM leads/inquiries           |
| `notes`, `tasks`                        | None                      | None                        | Staff CRUD; note author checked on insert                             | Lead/conversation detail             |
| `conversations`                         | None                      | None directly               | Staff management; public server endpoints require visitor cookie      | Chat and CRM inbox                   |
| `messages`                              | None                      | None directly               | Staff read; replies only via staff-checked `agent_reply`              | Same persistent public/staff history |
| `favorites`                             | None                      | Own read/insert/delete only | Still own-account scope                                               | Favorites and save actions           |
| `settings`                              | None directly             | None                        | Staff read; admin update; safe selected settings rendered server-side | Public shell, admin configuration    |
| `activity_logs`                         | None                      | None                        | Staff read only; trigger-generated writes                             | CRM activity/dashboard               |
| `rate_limits`                           | None                      | None                        | No direct API access; service-only quota function                     | Public endpoint abuse controls       |

Every application table has RLS enabled. Explicit API table grants exclude TRUNCATE/REFERENCES/TRIGGER, which normal row policies do not protect. The public `property-images` bucket is only for listing artwork/photos; valid staff property paths and allowed MIME/size policies guard writes. No private lead documents belong in that bucket.

## Migration and setup map

1. `202610260001_initial.sql`: normalized tables, Auth signup profile, RLS, audit/capture/chat/rate functions and Storage.
2. `202610260002_reporting.sql`: staff-only aggregate analytics.
3. `202610260003_integrity.sql`: active-staff assignments, serialized replies, context validation and FK indexes.
4. `202610260004_conversation_search.sql`: staff-only persistent transcript search.
5. `202610270005_foundation_permissions.sql`: explicit least-privilege API grants, protected audit sequence, service-role grants and visitor-only backfill for Auth accounts predating the app.

Apply existing migrations plus new migrations; do not edit already-deployed historical migrations. Optional `supabase/seed-drafts.sql` imports the 16 historical properties as **unpublished** drafts and never seeds fake personal records. First administrator provisioning and environment/OAuth configuration are documented in README. The full current parity backlog is in `PROTOTYPE_INVENTORY.md`.
