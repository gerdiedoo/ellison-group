import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { NextRequest } from "next/server";
import { updateSession } from "../../lib/supabase/update-session";
vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
const create = vi.mocked(createServerClient);
function clientWithRefresh(
  refresh: (cookies: CookieMethodsServer) => Promise<void> | void,
) {
  const getClaims = vi.fn();
  create.mockImplementation((_url, _key, options) => {
    getClaims.mockImplementation(async () => {
      await refresh(options.cookies as CookieMethodsServer);
      return { data: { claims: { sub: "verified-user" } }, error: null };
    });
    return { auth: { getClaims } } as unknown as ReturnType<
      typeof createServerClient
    >;
  });
  return getClaims;
}
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-test-key");
  create.mockReset();
});
afterEach(() => vi.unstubAllEnvs());
describe("Supabase SSR session refresh", () => {
  it("does not construct an auth client when the project is unconfigured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(
      (await updateSession(new NextRequest("http://localhost:3000/"))).status,
    ).toBe(200);
    expect(create).not.toHaveBeenCalled();
  });
  it("verifies claims and preserves both request and response cookie writes", async () => {
    const getClaims = clientWithRefresh(async (cookies) => {
      await cookies.setAll?.(
        [
          {
            name: "sb-test-auth-token",
            value: "refreshed-session",
            options: { path: "/", sameSite: "lax", secure: true },
          },
        ],
        {
          "Cache-Control":
            "private, no-cache, no-store, must-revalidate, max-age=0",
          Expires: "0",
          Pragma: "no-cache",
        },
      );
    });
    const request = new NextRequest("https://homes.example/admin");
    const response = await updateSession(request);
    expect(getClaims).toHaveBeenCalledOnce();
    expect(request.cookies.get("sb-test-auth-token")?.value).toBe(
      "refreshed-session",
    );
    expect(response.cookies.get("sb-test-auth-token")).toMatchObject({
      value: "refreshed-session",
      path: "/",
      secure: true,
      sameSite: "lax",
    });
    expect(response.headers.get("Cache-Control")).toBe(
      "private, no-cache, no-store, must-revalidate, max-age=0",
    );
    expect(response.headers.get("Expires")).toBe("0");
    expect(response.headers.get("Pragma")).toBe("no-cache");
  });
  it("retains earlier cookies and cache headers across multiple SDK writes", async () => {
    clientWithRefresh(async (cookies) => {
      await cookies.setAll?.(
        [{ name: "auth.0", value: "part-0", options: { path: "/" } }],
        { "Cache-Control": "private, no-store", Expires: "0" },
      );
      await cookies.setAll?.(
        [{ name: "auth.1", value: "part-1", options: { path: "/" } }],
        {},
      );
    });
    const response = await updateSession(
      new NextRequest("http://localhost:3000/"),
    );
    expect(response.cookies.getAll().map((c) => c.name)).toEqual([
      "auth.0",
      "auth.1",
    ]);
    expect(response.headers.get("Expires")).toBe("0");
  });
  it("never publicly caches an existing session that needs no refresh", async () => {
    clientWithRefresh(() => {});
    const response = await updateSession(
      new NextRequest("http://localhost:3000/admin"),
    );
    expect(response.headers.get("Cache-Control")).toContain("private");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });
  it("creates a fresh auth client for each request", async () => {
    clientWithRefresh(() => {});
    await updateSession(new NextRequest("http://localhost:3000/"));
    await updateSession(new NextRequest("http://localhost:3000/"));
    expect(create).toHaveBeenCalledTimes(2);
  });
});
