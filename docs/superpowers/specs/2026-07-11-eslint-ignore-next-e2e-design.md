# Keep product tooling off `.next-e2e`

**Intent:** Product `lint` / `next build` must not consume the isolated e2e Next output dir (`.next-e2e/**`). Leftover or mid-run e2e caches can be incomplete and break ESLint / `tsc`.

**Done when:**
- `eslint.config.mjs` ignores `.next-e2e/**`
- `tsconfig.json` does **not** include `.next-e2e/**/*.ts` (only `.next/types` for product builds)
- `npm run lint` and `npm run build` succeed with a dirty or partial `.next-e2e` present

**Out of scope:** Changing e2e harness `distDir` behavior beyond ignore/exclude.
