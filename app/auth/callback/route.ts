import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { safeNext } from "@/lib/validation";
import { serverEnvironment } from "@/lib/env";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const site = serverEnvironment().NEXT_PUBLIC_SITE_URL;
  if (code) {
    const db = await supabase();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(safeNext(request.nextUrl.searchParams.get("next")), site),
      );
  }
  return NextResponse.redirect(
    new URL("/login?error=Authentication+failed", site),
  );
}
