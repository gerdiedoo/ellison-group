import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { privileged } from "@/lib/supabase/server";
export function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
export async function visitor(create = false) {
  const jar = await cookies();
  let token = jar.get("eg_visitor")?.value;
  if (!token && create) {
    token = randomBytes(32).toString("hex");
    jar.set("eg_visitor", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return token ? hash(token) : null;
}
export async function checkOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  const expected = new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ).origin;
  if (origin !== expected) throw new Error("Invalid request origin");
}
export async function rateLimit(
  scope: string,
  limit = 10,
  seconds = 600,
  identity?: string,
) {
  const h = await headers();
  const salt = process.env.RATE_LIMIT_SALT;
  if (!salt)
    throw new Error(
      "Online requests are not available yet. Please call our team.",
    );
  // Use a trusted deployment-injected IP header; never trust arbitrary client identities.
  const ip =
    h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  const key = hash(salt + ":" + scope + ":" + (identity || ip));
  const { data, error } = await privileged().rpc("consume_rate", {
    p_key: key,
    p_limit: limit,
    p_seconds: seconds,
  });
  if (error)
    throw new Error("Abuse protection is unavailable. Please try again later.");
  if (!data) throw new Error("Too many requests. Please try again later.");
}

export async function readPublicJson(
  request: Request,
  maxBytes = 32768,
): Promise<unknown> {
  if (!request.body) throw new Error("Request body is required.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error("Request body is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
