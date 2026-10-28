# CentroListo Logo A + Crónica de un Día en Paz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Logo A into chrome and hero, then replace the remaining AI-slop landing chrome with the quiet “Crónica de un Día en Paz” narrative.

**Architecture:** `CentroListoLogoMark` and `CentroListoGenerativeStage` already exist. `PulsarLandingHome` still renders pill chips, 3 metric boxes, red-vs-green Before/After, and icon-box pillars. This plan mounts the generative stage, rewrites the four organisms to hairline editorial layouts, and switches chronicle moments inside `startTransition` + `<ViewTransition>`.

**Tech Stack:** Next.js App Router, React 19 `<ViewTransition>`, Tailwind tokens from `loadPulsarPlatformProperties()`, Vitest + Testing Library.

## Global Constraints

- Every file must remain ≤ 250 lines (`.cursor/rules/03-architecture.mdc`).
- No decorative chips, repeated uppercase eyebrows, 3-box hero metrics, Lucide-in-a-box grids, or red-vs-green confrontation (`.cursor/rules/44-no-ai-slop-design.mdc`).
- Visible copy stays in `src/dictionaries/{es,en,pt}.json` (`.cursor/rules/09-i18n-copy.mdc`).
- Motion uses `cubic-bezier(0.22, 1, 0.36, 1)` and `prefers-reduced-motion: reduce`.
- Do not enable `experimental.viewTransition` in `next.config.ts` (that wraps every tenant `<Link>`). Use React `<ViewTransition>` only inside the chronicle.
- Mixed WIP exists in the tree. Do not commit this work until the user asks.

---

### Task 1: Failing tests for Logo A and the quiet chronicle

**Files:**
- Modify: `src/__tests__/components/organisms/pulsar/PulsarLandingPages.test.tsx`
- Create: `src/__tests__/components/organisms/pulsar/CentroListoLogoMark.test.tsx`

**Interfaces:**
- Consumes: `CentroListoGenerativeStage` `data-testid="centrolisto-generative-logo"`
- Consumes: `dict.pulsar.home.portals.tabs[*].label` as chronicle moment names

- [ ] **Step 1: Write the failing tests**

Home must show the generative canvas, the four week moments, and the three silences. Home must not depend on vertical chips or a 3-box metric row.

- [ ] **Step 2: Run Vitest and confirm RED**

Run: `npx vitest run src/__tests__/components/organisms/pulsar/PulsarLandingPages.test.tsx src/__tests__/components/organisms/pulsar/CentroListoLogoMark.test.tsx`

Expected: FAIL — `centrolisto-generative-logo` is missing from `PulsarLandingHome`.

---

### Task 2: Mount Logo A and rewrite Home + Chronicle

**Files:**
- Modify: `src/components/organisms/pulsar/CentroListoLogoMark.tsx`
- Modify: `src/components/organisms/pulsar/PulsarSiteChrome.tsx`
- Modify: `src/components/organisms/pulsar/PulsarLandingHome.tsx`
- Modify: `src/components/organisms/pulsar/PulsarInteractivePortalShowcase.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- `CentroListoLogoMark({ size?: "sm" | "md"; showWordmark?: boolean })`
- `CentroListoGenerativeStage` stays the hero canvas
- Chronicle tabs call `startTransition(() => setActiveIndex(i))` and wrap the vignette in `<ViewTransition default="none" enter="cl-fade-in" exit="cl-fade-out">`

- [ ] **Step 3: Implement the quiet hero, chronicle, silences ledger, and chrome wordmark**
- [ ] **Step 4: Run the Task 1 tests and confirm GREEN**

---

### Task 3: Quiet Product, Clients, and Contact surfaces

**Files:**
- Modify: `src/components/organisms/pulsar/PulsarProductoView.tsx`
- Modify: `src/components/organisms/pulsar/PulsarCompetitorComparisonSection.tsx`
- Modify: `src/components/organisms/pulsar/PulsarClientesView.tsx`
- Modify: `src/components/organisms/pulsar/PulsarContactoView.tsx`
- Modify: `src/dictionaries/en.json` (salesy home/nav/meta/pillars → quiet tone matching `es.json`)
- Modify: `src/dictionaries/pt.json` (same)

- [ ] **Step 5: Replace icon-box grids with numbered ledgers and a calm comparison table**
- [ ] **Step 6: Run `npx vitest run src/__tests__/components/organisms/pulsar/` and confirm GREEN**
