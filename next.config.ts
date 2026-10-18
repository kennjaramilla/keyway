import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
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
