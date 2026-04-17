import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

const coverageFull = process.env.VITEST_COVERAGE_FULL === "1";

const coverageInclude = coverageFull
  ? [
      "src/lib/**/*.{ts,tsx}",
      "src/hooks/**/*.{ts,tsx}",
      "src/proxy.ts",
      "src/components/**/*.{ts,tsx}",
      "src/app/**/*.{ts,tsx}",
    ]
  : ["src/lib/**/*.{ts,tsx}", "src/hooks/**/*.{ts,tsx}", "src/proxy.ts"];

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.tsx"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      /** Only files touched by the test run count toward % (no phantom 0% rows). */
      all: false,
      reporter: ["text", "lcov"],
      include: coverageInclude,
      exclude: [
        "src/test/**",
        "src/**/*.test.*",
        "src/types/**",
        "src/**/*.d.ts",
        "src/app/**/page.tsx",
        "src/app/**/layout.tsx",
        "src/app/**/opengraph-image.tsx",
      ],
      thresholds: coverageFull
        ? { lines: 0, statements: 0, functions: 0, branches: 0 }
        : {
            lines: 80,
            statements: 80,
            functions: 80,
            branches: 80,
          },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      /** Stub Next.js' `server-only` guard so server modules can be unit-tested in jsdom. */
      "server-only": path.resolve(__dirname, "./src/test/serverOnlyStub.ts"),
    },
  },
});
