import type { NextConfig } from "next";

// A full script-src CSP needs nonces for Next's inline scripts; see docs/memory.md.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** Set to use the real API (github.com/kennjaramilla/keyway-api) instead of the in-browser mock. */
const apiUrl = process.env.KEYWAY_API_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  env: { NEXT_PUBLIC_API_MOCKING: apiUrl ? "off" : (process.env.NEXT_PUBLIC_API_MOCKING ?? "on") },
  // Fallback, so Next's own /api/assistant route still wins; everything else goes to the API.
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: apiUrl ? [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }] : [],
    };
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  cacheComponents: true,
  // Pages render after the in-browser mock API starts, so none can be instant; only
  // validate segments that opt in (otherwise every page logs a dev-only error).
  experimental: { instantInsights: { validationLevel: "manual-warning" } },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
    resolveAlias: {
      "msw/browser": { browser: "msw/browser", default: "./src/mocks/server-stub.ts" },
    },
  },
};

export default nextConfig;
