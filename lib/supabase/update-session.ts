import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { parsePublicEnvironment } from "@/lib/env-schema";
import type { Database } from "@/lib/database.types";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const env = parsePublicEnvironment({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (
    !env.NEXT_PUBLIC_SUPABASE_URL ||
    !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    return response;

  // A new client per request is required by @supabase/ssr. Never share sessions.
  const pendingCookies = new Map<
    string,
    {
      name: string;
      value: string;
      options: import("@supabase/ssr").CookieOptions;
    }
  >();
  const pendingHeaders = new Headers();
  const db = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies, headers) => {
          cookies.forEach((cookie) => {
            request.cookies.set(cookie.name, cookie.value);
            pendingCookies.set(cookie.name, cookie);
          });
          Object.entries(headers).forEach(([key, value]) =>
            pendingHeaders.set(key, value),
          );
          response = NextResponse.next({ request });
          pendingCookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          pendingHeaders.forEach((value, key) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );
  await db.auth.getClaims();
  // Even authenticated responses that did not refresh must not be cached publicly.
  if (!response.headers.has("Cache-Control"))
    response.headers.set("Cache-Control", "private, no-store");
  return response;
}
