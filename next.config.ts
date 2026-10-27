import type { NextConfig } from "next";
import { execFileSync } from "node:child_process";

function sourceCommit() {
  const hosted = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA;
  if (hosted && /^[a-f0-9]{40}$/i.test(hosted)) return hosted.slice(0, 12);
  try {
    return execFileSync("git", ["rev-parse", "--short=12", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

const config: NextConfig = {
  poweredByHeader: false,
  // These are public build identifiers only. Never add credentials to `env`.
  env: {
    ELLISON_BUILD_COMMIT: sourceCommit(),
    ELLISON_INTERFACE_REVISION: "prototype-parity-2",
  },
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default config;
