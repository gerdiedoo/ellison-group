import "server-only";
import {
  parsePublicEnvironment,
  parseServerEnvironment,
} from "@/lib/env-schema";

export function publicEnvironment() {
  return parsePublicEnvironment({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

// Lazy validation permits the editorial site and build to run without credentials.
// Integrations still fail closed when their required credentials are absent.
export function serverEnvironment() {
  return parseServerEnvironment({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
    GOOGLE_GEMINI_MODEL: process.env.GOOGLE_GEMINI_MODEL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    RATE_LIMIT_SALT: process.env.RATE_LIMIT_SALT,
    GOOGLE_OAUTH_ENABLED: process.env.GOOGLE_OAUTH_ENABLED,
  });
}
