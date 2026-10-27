"use server";
import { redirect } from "next/navigation";
import { supabase, configured } from "@/lib/supabase/server";
import { safeNext, emailSchema } from "@/lib/validation";
import { checkOrigin, rateLimit } from "@/lib/security";
import { serverEnvironment } from "@/lib/env";
export async function signIn(form: FormData) {
  let dest = "";
  try {
    await checkOrigin();
    if (!configured()) throw new Error("Supabase is not configured");
    await rateLimit("login", 10, 600);
    const db = await supabase();
    const email = emailSchema.parse(form.get("email"));
    const password = String(form.get("password") || "");
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw new Error("Email or password is incorrect");
    dest = safeNext(String(form.get("next") || "/admin"));
  } catch (e) {
    redirect(
      "/login?error=" +
        encodeURIComponent(e instanceof Error ? e.message : "Sign-in failed"),
    );
  }
  redirect(dest);
}
export async function googleSignIn(form: FormData) {
  let url = "";
  try {
    await checkOrigin();
    const env = serverEnvironment();
    if (!env.GOOGLE_OAUTH_ENABLED)
      throw new Error("Google sign-in is not configured");
    await rateLimit("oauth", 20, 600);
    const db = await supabase();
    const site = env.NEXT_PUBLIC_SITE_URL;
    const next = safeNext(String(form.get("next") || "/favorites"));
    const { data, error } = await db.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: site + "/auth/callback?next=" + encodeURIComponent(next),
      },
    });
    if (error || !data.url) throw new Error("Unable to start Google sign-in");
    url = data.url;
  } catch (e) {
    redirect(
      "/login?error=" +
        encodeURIComponent(e instanceof Error ? e.message : "Sign-in failed"),
    );
  }
  redirect(url);
}
export async function signOut() {
  const db = await supabase();
  await db.auth.signOut();
  redirect("/");
}
