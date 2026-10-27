import { describe, it, expect } from "vitest";
import {
  parsePublicEnvironment,
  parseServerEnvironment,
} from "../../lib/env-schema";

describe("environment configuration boundaries", () => {
  it("allows editorial/build operation with no external credentials", () => {
    expect(parsePublicEnvironment({})).toEqual({});
    expect(parseServerEnvironment({})).toMatchObject({
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      GOOGLE_OAUTH_ENABLED: false,
    });
  });
  it.each([
    { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co" },
    { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-test-key" },
  ])("rejects partial Supabase configuration", (input) =>
    expect(() => parsePublicEnvironment(input)).toThrow(
      "Invalid environment configuration",
    ),
  );
  it("rejects non-HTTP database URLs", () =>
    expect(() =>
      parsePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: "file:///tmp/test",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-test-key",
      }),
    ).toThrow());
  it("treats blank example credentials as unconfigured", () =>
    expect(
      parsePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: "",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "  ",
      }),
    ).toMatchObject({ NEXT_PUBLIC_SUPABASE_URL: undefined }));
  it("normalizes the canonical site origin", () =>
    expect(
      parseServerEnvironment({ NEXT_PUBLIC_SITE_URL: "https://homes.example/" })
        .NEXT_PUBLIC_SITE_URL,
    ).toBe("https://homes.example"));
  it.each([
    "https://homes.example/admin",
    "https://homes.example?next=admin",
    "https://user:password@homes.example",
    "javascript:alert(1)",
  ])("rejects ambiguous callback origin %s", (value) =>
    expect(() =>
      parseServerEnvironment({ NEXT_PUBLIC_SITE_URL: value }),
    ).toThrow("NEXT_PUBLIC_SITE_URL"),
  );
  it("does not turn the text false into enabled OAuth", () =>
    expect(
      parseServerEnvironment({ GOOGLE_OAUTH_ENABLED: "false" })
        .GOOGLE_OAUTH_ENABLED,
    ).toBe(false));
  it("rejects mistyped OAuth flags", () =>
    expect(() =>
      parseServerEnvironment({ GOOGLE_OAUTH_ENABLED: "yes" }),
    ).toThrow("GOOGLE_OAUTH_ENABLED"));
  it("rejects short and copied-example abuse-protection salts", () => {
    expect(() => parseServerEnvironment({ RATE_LIMIT_SALT: "short" })).toThrow(
      "RATE_LIMIT_SALT",
    );
    expect(() =>
      parseServerEnvironment({
        RATE_LIMIT_SALT: "replace-with-a-random-32-byte-secret",
      }),
    ).toThrow("RATE_LIMIT_SALT");
  });
  it("keeps credentials out of configuration error messages", () => {
    const secret = "private-test-value-do-not-echo";
    try {
      parseServerEnvironment({
        SUPABASE_SERVICE_ROLE_KEY: secret,
        RATE_LIMIT_SALT: secret,
      });
      throw new Error("Should reject short salt");
    } catch (error) {
      expect(String(error)).toContain("RATE_LIMIT_SALT");
      expect(String(error)).not.toContain(secret);
    }
  });
  it("excludes private configuration from public client settings", () =>
    expect(
      parsePublicEnvironment({
        SUPABASE_SERVICE_ROLE_KEY: "private-key",
        GOOGLE_GEMINI_API_KEY: "private-gemini",
      }),
    ).toEqual({}));
});
