# Tenant landing SSR / fonts / home title — Implementation Plan

> **For agentic workers:** Execute inline in the approving session (user said dale). TDD per task. Do not commit unless the user asks.

**Goal:** Home SSR paints real landing HTML (title, h1, LCP image), serializes `main` once, and preloads only the active tenant fonts.

**Architecture:** Client `LandingSurfaceGate` builds desktop chrome internally and uses that tree as the `SurfaceMountGate` SSR slot (no skeleton). Page loads section organisms via `loadLandingMainSections(kind)` dynamic `import()`. Home title is `buildHomePageMetadata(brandName)` with `title.absolute`.

**Tech Stack:** Next.js App Router, Vitest, Testing Library, `renderToString` for SSR assertions.

**Global Constraints:** 250-line files; no new user-facing copy; dashboard gates unchanged; no sitemap/robots/env edits; no git commit unless asked.

---

### Task 1: `buildHomePageMetadata`

**Files:**
- Create: `src/lib/metadata/buildHomePageMetadata.ts`
- Test: `src/__tests__/lib/metadata/buildHomePageMetadata.test.ts`

**Produces:** `buildHomePageMetadata(brandName: string): Metadata` → `{ title: { absolute: brandName } }`

- [x] Failing test: absolute title is the brand; no `|`
- [x] Implement helper
- [x] `npx vitest run src/__tests__/lib/metadata/buildHomePageMetadata.test.ts`

### Task 2: `loadLandingMainSections`

**Files:**
- Create: `src/lib/landing/loadLandingMainSections.ts`
- Test: `src/__tests__/lib/landing/loadLandingMainSections.test.ts`

**Produces:** `loadLandingMainSections(kind: SiteThemeKind): Promise<ComponentType<LandingMainSectionProps>>` via `await import()` per kind. `classic` and unknown fallback → `LandingMainSections`.

- [x] Failing test: each `SITE_THEME_KINDS` value returns a function whose `.name` matches the organism
- [x] Implement switch + dynamic import
- [x] `npx vitest run src/__tests__/lib/landing/loadLandingMainSections.test.ts`

### Task 3: `LandingSurfaceGate` SSR

**Files:**
- Modify: `src/components/organisms/LandingSurfaceGate.tsx`
- Modify: `src/__tests__/components/surfaceGatesNarrow.test.tsx`
- Modify: `src/__tests__/components/smoke-part1.test.tsx`
- Create: `src/__tests__/organisms/LandingSurfaceGate.ssr.test.tsx`

**Produces:** No `desktop` prop. New `suppressHeader?: boolean`, `blogEnabled?: boolean`. `skeleton` and `desktop` are the same `LandingScreenDesktop` + `main`.

- [x] Failing `renderToString`: `main` text present; `loadingAria` / `aria-busy` absent
- [x] Implement; keep narrow PWA shell
- [x] Update smoke + narrow tests (drop `desktop`)
- [x] Vitest on the three files

### Task 4: Greenfield gate SSR

**Files:**
- Modify: `src/components/organisms/LandingGreenfieldSurfaceGate.tsx`
- Create: `src/__tests__/organisms/LandingGreenfieldSurfaceGate.ssr.test.tsx`

- [x] Failing `renderToString`: `main` present; skeleton `aria-busy` absent
- [x] Use current desktop tree as skeleton
- [x] Vitest on that file

### Task 5: Home page wiring

**Files:**
- Modify: `src/app/[locale]/page.tsx`

- [x] `generateMetadata` → `buildHomePageMetadata(brand.name)`
- [x] `const Sections = await loadLandingMainSections(templateKind)` then `<Sections {...props} />`
- [x] `<LandingSurfaceGate main={...} suppressHeader={marketingShell} blogEnabled={...} />` — no `desktop`
- [x] File ≤ 250 lines (124)

### Task 6: CWV note

Lab re-run of the five homes is **after deploy**. Record baseline in spec; do not block the code PR on prod Lighthouse. Local Vitest is the merge gate.

---

**Spec coverage:** title helper (1), font loader (2), gate SSR + single main (3), greenfield (4), page wiring (5), CWV post-deploy (6).
