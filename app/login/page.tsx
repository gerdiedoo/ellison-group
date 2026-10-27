import { SubmitButton } from "@/components/submit-button";
import { signIn, googleSignIn } from "@/app/actions/auth";
import Link from "next/link";
import { safeNext } from "@/lib/validation";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const p = await searchParams;
  return (
    <main className="wrap page" style={{ maxWidth: 600 }}>
      <Link href="/" className="eyebrow">
        The Ellison Group
      </Link>
      <h1>Welcome back.</h1>
      {p.error && (
        <p role="alert" className="error">
          {p.error}
        </p>
      )}
      <form action={signIn}>
        <input type="hidden" name="next" value={safeNext(p.next || null)} />
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
      </form>
      {process.env.GOOGLE_OAUTH_ENABLED === "true" && (
        <form action={googleSignIn} style={{ marginTop: 20 }}>
          <input type="hidden" name="next" value={p.next || "/favorites"} />
          <SubmitButton
            className="btn ghost"
            pendingLabel="Connecting to Google…"
          >
            Continue with Google
          </SubmitButton>
        </form>
      )}
      <p className="muted" style={{ marginTop: 24 }}>
        Staff access is provisioned by an administrator. Browsing and inquiries
        do not require an account.
      </p>
    </main>
  );
}
