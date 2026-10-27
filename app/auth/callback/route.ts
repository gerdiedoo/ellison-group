import { NextResponse, type NextRequest } from "next/server";
import { supabase, configured } from "@/lib/supabase/server";
import { safeNext } from "@/lib/validation";
import { serverEnvironment } from "@/lib/env";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const site = serverEnvironment().NEXT_PUBLIC_SITE_URL;
  let success = false;
  try {
    if (code && configured()) {
      const db = await supabase();
      const { error } = await db.auth.exchangeCodeForSession(code);
      success = !error;
    }
  } catch {
    // Provider/network failures never imply a successful session exchange.
  }
  const response = NextResponse.redirect(
    new URL(
      success
        ? safeNext(request.nextUrl.searchParams.get("next"))
        : "/login?error=Authentication+failed",
      site,
    ),
  );
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
