import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    // Isolated Playwright / e2e Next dist (same class of generated output as `.next`).
    ".next-e2e/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "test-results/**",
    ".agents/**",
    // Nested checkouts of this repo (agent / feature isolation); they lint themselves.
    ".worktrees/**",
    "public/sw.js",
  ]),
]);

export default eslintConfig;
