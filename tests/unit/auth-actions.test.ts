import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error("REDIRECT " + url);
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  configured: () => true,
  supabase: vi.fn(),
}));
vi.mock("@/lib/security", () => ({ checkOrigin: vi.fn(), rateLimit: vi.fn() }));
vi.mock("@/lib/env", () => ({
  serverEnvironment: () => ({
    GOOGLE_OAUTH_ENABLED: false,
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  }),
}));
import { supabase } from "../../lib/supabase/server";
import { signIn, googleSignIn, signOut } from "../../app/actions/auth";
import { GET } from "../../app/auth/callback/route";
import { NextRequest } from "next/server";
const db = vi.mocked(supabase);
const login = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  db.mockResolvedValue({
    auth: {
      signInWithPassword: login,
      signOut: vi
        .fn()
        .mockResolvedValue({ error: new Error("Provider unavailable") }),
    },
  } as unknown as Awaited<ReturnType<typeof supabase>>);
  login.mockResolvedValue({ error: new Error("Invalid credentials") });
});
function form(next: string) {
  const f = new FormData();
  f.set("email", "visitor@example.com");
  f.set("password", "wrong-password");
  f.set("next", next);
  return f;
}
describe("authentication failure boundaries", () => {
  it("retains favorites destination after rejected credentials", async () => {
    await expect(signIn(form("/favorites"))).rejects.toThrow(
      "next=%2Ffavorites",
    );
  });
  it("does not preserve an external return URL", async () => {
    await expect(signIn(form("https://foreign.example"))).rejects.toThrow(
      "next=%2Fadmin",
    );
  });
  it("validates password length before provider requests", async () => {
    const f = form("/favorites");
    f.set("password", "x".repeat(1025));
    await expect(signIn(f)).rejects.toThrow("valid%20email%20and%20password");
    expect(login).not.toHaveBeenCalled();
  });
  it("keeps property context when OAuth is unavailable", async () => {
    await expect(
      googleSignIn(form("/properties/verified-home")),
    ).rejects.toThrow("next=%2Fproperties%2Fverified-home");
  });
  it("reports sign-out failures instead of claiming success", async () => {
    await expect(signOut()).rejects.toThrow("Unable+to+sign+out");
  });
  it("redirects failed OAuth exchanges without leaking provider errors", async () => {
    db.mockRejectedValue(new Error("Private provider details"));
    const response = await GET(
      new NextRequest(
        "http://localhost:3000/auth/callback?code=invalid&next=https://foreign.example",
      ),
    );
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=Authentication+failed",
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});
