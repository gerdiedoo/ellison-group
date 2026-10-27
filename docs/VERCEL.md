# Vercel prototype deployment

The application is prepared for Vercel's Next.js runtime. `vercel.json` uses the existing production build and locked dependency installation. Supabase remains the shared backend. No account is linked and no deployment is implied by these files.

## 1. Import the repository

Sign in at https://vercel.com/new with the GitHub account that owns `gerdiedoo/ellison-group` and import that repository. Use the Hobby account for this personal, non-commercial prototype.

- Framework: **Next.js**.
- Root Directory: repository root (`./`), not `app/` or `prototype/`.
- Node.js Version: **24.x**.
- Install Command: `npm ci`.
- Build Command: `npm run build`.
- Output Directory: leave the Next.js default.

Use **development** as the deployment source. The repository's `main` branch contains only the initial commit. Vercel may initially select it; if so, create the project, then open **Settings → Environments → Production → Branch Tracking** and change the branch to **development**. Under Deployments create a new deployment with the `development` branch reference. Redeploying an old `main` deployment does not select newer development code. For this prototype, Vercel's “Production” environment simply supplies a stable prototype URL.

## 2. Configure environment variables

Copy the existing values from your private `.env.local` into Vercel's project environment settings, scoped to **Production** for the stable prototype URL. Use `.env.example` as the list of names. Do not commit or upload `.env.local` as source.

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your existing Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your existing public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Existing server-only service credential; mark sensitive |
| `GOOGLE_GEMINI_API_KEY` | Existing server-only Gemini credential; mark sensitive |
| `GOOGLE_GEMINI_MODEL` | Existing configured model from `.env.local` |
| `GOOGLE_GEMINI_FALLBACK_MODEL` | Existing configured fallback, if used |
| `RATE_LIMIT_SALT` | Existing server-only salt; mark sensitive |
| `GOOGLE_OAUTH_ENABLED` | `true` when the Supabase Google provider is configured |
| `NEXT_PUBLIC_SITE_URL` | Exact stable origin, for example `https://ellison-group.vercel.app`; use the actual assigned domain |

The site URL must match the URL you browse: public form and sign-in requests enforce this origin. Do not leave it at localhost or enter a path. If the domain is assigned after the initial deploy, set the variable and redeploy. Environment changes require a new deployment. Use the stable assigned URL for acceptance, rather than a changing per-commit deployment URL. If configuring Preview deployments too, give them their own exact site origin and permitted Supabase callback; Production values alone do not configure Preview.

## 3. Configure Supabase and Google callbacks

In **Supabase → Authentication → URL Configuration**:

- Set Site URL to the stable Vercel origin.
- Add the app callback under Redirect URLs: `https://YOUR-DOMAIN.vercel.app/auth/callback**`. The suffix covers the validated `next` query parameter; restrict the hostname to your actual project.
- Keep `http://localhost:3000/auth/callback**` if local development is still needed.

Google Cloud's authorized redirect URI stays the Supabase provider callback: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`. The Vercel app callback belongs in Supabase's redirect allowlist, not in place of Google's Supabase callback. Continue using the existing Google provider configuration.

Apply any outstanding SQL migrations through the Supabase SQL Editor or an authorized database connection. The earlier audit found migration `202610270006_note_attribution.sql` still outstanding on the hosted project; a service-role API key cannot apply DDL. Deployments do not automatically run migrations or seeds.

## 4. Verify the hosted prototype

1. Open `/api/version`; expect `interfaceRevision: "prototype-parity-2"` and the deployed development commit.
2. Open the public website, then `/admin` and sign in with the existing authorized staff account. Google visitor accounts do not automatically become administrators.
3. Confirm the six `[DEMO]` leads and shared saved conversations appear. The two demo homes and sixteen original imported homes are drafts, so the public catalog can legitimately be empty. Publish a clearly identified sample through Properties if public listing demonstration is wanted.
4. Submit a contact request and verify it in the CRM. Check Google sign-in returns to the stable hostname. Check image upload and chatbot handoff with the configured backend.

Gemini provider quotas remain separate from Vercel hosting. No hosted tests, successful Google consent, or deployment URL are claimed until the account is connected and these steps are executed.

Official references: [Git deployment and branch tracking](https://vercel.com/docs/git), [project settings](https://vercel.com/docs/project-configuration/project-settings), [Hobby plan](https://vercel.com/docs/plans/hobby).
