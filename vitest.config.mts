import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${src("./src")}/` },
      // Portable stories: our UI components don't depend on Next, so the plain
      // React renderer is enough (the Next framework aliases React internals).
      { find: /^@storybook\/nextjs-vite$/, replacement: "@storybook/react" },
      // Tests import server modules directly; the real package throws outside a server bundle.
      { find: /^server-only$/, replacement: src("./node_modules/server-only/empty.js") },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html", "lcov"],
      include: ["src/lib/**", "src/features/**"],
      exclude: ["**/*.test.*", "**/*.stories.*", "**/index.ts"],
      thresholds: { lines: 80, functions: 80, branches: 75 },
    },
  },
});
