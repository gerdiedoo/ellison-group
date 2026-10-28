# Environment rollout

## Current state and pending cutover

The repository is currently on `development`. Historical prototype instructions in
VERCEL.md use that branch for the stable deployment. Do not change Production branch
tracking until reviewed application code and migrations are present on `main`.

Inspection found Vercel `the-ellison-group` (project
`prj_jOYe2dB0LvRBG6tPPJbBPpqlpWhI`, team
`team_BzGHupNSu2Fh4xvud9x9CEeC`) and Supabase `The Ellison Group`
(`uizrrxzvblorwdxdfiap`). The owner confirmed these as Production and requested
Vercel URLs for now. QA creation in organization `The Ellison` was attempted after
a $0/month quote, but Supabase rejected it because the account has reached the
two-active-free-project limit. No QA project was created. Free a slot or upgrade
before continuing hosted provisioning.
The Vercel Production and Preview variables currently share backend configuration.
Do not deploy QA until its database variables have been separated.

## Target mapping

| Branch | Vercel | Supabase |
| --- | --- | --- |
| main | Production | Dedicated Production project |
| qa | Preview with qa overrides | Dedicated QA project |
| feature/* | Preview | QA for compatible changes, isolated branch otherwise |
| local | Development | Local Docker stack |

## Local setup and environment sync

Install the Vercel and Supabase CLIs using reviewed pinned versions. Authenticate,
then link Vercel to the confirmed project before pulling configuration.

```bash
vercel login
vercel link
npm run env:pull -- development
# Alternatively copy docs/environment-templates/development.example to
# .env.development and fill it with local Supabase values.
supabase start
supabase db reset --local
npm run dev
```

`db reset --local` discards local data. `supabase status` displays local credentials;
keep that output private. Existing `.env.local` and `.env.development.local` can
override `.env.development`; reconcile them before launching the app.

```bash
npm run env:pull -- qa
npm run env:pull -- production
vercel env run --environment=preview --git-branch=qa -- npm run dev
```

The sync script pulls to a fresh private temporary file and replaces only the selected
snapshot, preventing old local-only entries from being retained by CLI merge behavior.
Vercel may omit Secret values. Fill local privileged keys privately when needed.
Next.js does not auto-load `.env.qa`. Keep NODE_ENV as development, test, or production.
Never use a QA build as a Production artifact: NEXT_PUBLIC values are frozen at build.

## Database changes and seeds

```bash
supabase migration new descriptive_change
# Edit the generated migration, then rebuild the local database.
supabase db reset --local
npm run test:db
```

Alternatively change local Studio and capture `supabase db diff --local --schema public
-f descriptive_change`. Review grants and RLS as well as tables. Do not generate both
manual and diff migrations for the same change. Never edit an applied shared migration.

```bash
supabase link --project-ref "$SUPABASE_QA_PROJECT_REF"
supabase migration list --linked
supabase db push --linked --dry-run
supabase db push --linked --include-seed
```

`supabase/seed.sql` is idempotent synthetic data and is deliberately unpublished.
For richer fixtures, inject QA variables, including SUPABASE_QA_PROJECT_REF:

```bash
node --env-file=.env.qa scripts/demo-data.mjs
```

Hosted demo writes require an explicit matching QA project ref. This is an operator
guard, not a replacement for separate credentials and project permissions.

Production uses the same reviewed migrations, without fixtures:

```bash
supabase link --project-ref "$SUPABASE_PROD_PROJECT_REF"
supabase migration list --linked
supabase db push --linked --dry-run
supabase db push --linked
```

Never use remote reset or --include-seed in Production. Use additive changes first;
remove old schema only after application compatibility has been verified.

## Hosted rollout checklist

1. Confirm the organization and cost, then provision QA near Production.
2. Inspect Production migration history and reconcile any drift before replaying QA.
3. Configure separate QA public and server credentials in Preview (and qa overrides).
   Configure Development for the local stack. Production values remain Production-only.
4. Configure NEXT_PUBLIC_SITE_URL to the exact deployed origin. Separate rate-limit
   salts, Gemini credentials, OAuth settings, Auth users and Storage per environment.
5. Set QA/Production Supabase Site URLs and allow their /auth/callback and /auth/confirm
   paths. Google provider callback is the corresponding Supabase /auth/v1/callback.
6. Create qa from the reviewed code; merge tested releases to main through PRs.
7. Bind the QA custom domain to Preview branch qa; bind the main domain to Production.
   Follow returned DNS requirements and verify QA deployment protection separately.
8. Enable required checks. The committed checks workflow runs application and DB tests;
   it does not apply migrations or gate Vercel automatically. Configure Deployment
   Checks or an ordered release workflow before Production cutover.
9. Order release execution: checks, backward-compatible migration, app deployment,
   smoke tests. Never run migrations from the application build command.

CI migration/deployment credentials must be scoped to protected GitHub environments
with the appropriate branch restrictions. Never expose them to pull-request jobs.
Provisioning, DNS and Auth configuration remain pending until verified in the accounts.
