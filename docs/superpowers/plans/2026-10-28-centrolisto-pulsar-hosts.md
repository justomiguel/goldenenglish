# CentroListo.cl Brand Identity, Platform Hosts & High-Conversion Growth Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand Pulsar Lab into **CentroListo.cl** (`centrolisto.cl` / `www.centrolisto.cl`, keeping `pulsarlab.cl` as an active alias), inject a dedicated CentroListo brand token palette (`#047857` Ready Emerald + `#0F172A` Trust Navy), and ship a high-conversion B2B EdTech growth site showcasing all 12 production modules, an interactive 4-portal switcher, a competitor comparison matrix, industry verticals, and a 3-step launch roadmap.

**Architecture:** `DEFAULT_PULSAR_HOSTS` and migration `004_centrolisto_pulsar_hosts.sql` register `centrolisto.cl` and `www.centrolisto.cl` alongside `pulsarlab.cl`. `loadPulsarPlatformProperties()` in `src/lib/pulsar/pulsarBrandProperties.ts` supplies WCAG AA semantic CSS variables when `isPulsarPlatformRequest()` is true in `src/app/layout.tsx`. All visible copy lives in `dict.pulsar` across `es.json`, `en.json`, and `pt.json`, rendered by modular organisms under `src/components/organisms/pulsar/` (each ≤ 250 LOC).

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS (CSS custom properties), Lucide React, Vitest + Testing Library.

## Global Constraints

- Every file must remain ≤ 250 lines of code (`.cursor/rules/03-architecture.mdc`).
- No hardcoded hex values or user-facing strings in `.tsx` components; use `var(--color-*)` tokens and `dict.pulsar.*` keys across `es.json`, `en.json`, and `pt.json` (`.cursor/rules/01-design-system.mdc`, `.cursor/rules/09-i18n-copy.mdc`).
- Spanish copy uses neutral Latin American tuteo (`.cursor/rules/40-neutral-spanish-copy.mdc`); English copy uses short ASD-STE100 sentences (`.cursor/rules/41-asd-ste100-english.mdc`).
- Buttons and button-styled links include leading Lucide icons with `aria-hidden` (`.cursor/rules/16-admin-buttons-icons.mdc`).
- Prepend a product changelog entry in `src/lib/product-changelog/catalogEntriesRecent.ts` before committing (`.cursor/rules/39-commit-product-changelog.mdc`).

---

### Task 1: Platform Hosts, Public Origin Fallback & Brand Properties Helper

**Files:**
- Create: `src/lib/pulsar/pulsarBrandProperties.ts`
- Create: `supabase/pulsar-migrations/004_centrolisto_pulsar_hosts.sql`
- Modify: `src/lib/tenant/tenantRegistry.ts`
- Modify: `src/lib/site/requestPublicUrl.ts`
- Modify: `src/app/layout.tsx`
- Test: `src/__tests__/lib/tenant/pulsarHostResolution.test.ts`
- Test: `src/__tests__/lib/pulsar/pulsarTenantSchema.test.ts`
- Test: `src/__tests__/lib/site/requestPublicUrl.test.ts`
- Create Test: `src/__tests__/lib/pulsar/pulsarBrandProperties.test.ts`

**Interfaces:**
- Produces: `loadPulsarPlatformProperties(): ThemeProperties` in `src/lib/pulsar/pulsarBrandProperties.ts`
- Produces: `DEFAULT_PULSAR_HOSTS` including `"centrolisto.cl"` and `"www.centrolisto.cl"` in `src/lib/tenant/tenantRegistry.ts`

- [ ] **Step 1: Write failing tests for host resolution, schema reservation, public URL fallback, and `loadPulsarPlatformProperties`**
- [ ] **Step 2: Run Vitest on those 4 test files and confirm RED**
- [ ] **Step 3: Implement `DEFAULT_PULSAR_HOSTS`, `requestPublicUrl.ts` fallback, `004_centrolisto_pulsar_hosts.sql`, `pulsarBrandProperties.ts`, and `src/app/layout.tsx` wiring**
- [ ] **Step 4: Run Vitest on the 4 test files and confirm GREEN**

---

### Task 2: Multi-Locale `dict.pulsar` Copy (`es.json`, `en.json`, `pt.json`)

**Files:**
- Modify: `src/dictionaries/es.json`
- Modify: `src/dictionaries/en.json`
- Modify: `src/dictionaries/pt.json`

**Interfaces:**
- Produces: Expanded `dict.pulsar` namespace with:
  - `meta`, `nav` (with footer tagline, badge, and contact)
  - `home` (hero, vertical pills, stats, `portals` 4-tab interactive explorer, `beforeAfter` comparison, 3 unfair-advantage pillars, bottom CTA banner)
  - `product` (4 growth stages + 12 modules `m1`..`m12` + `comparison` table vs. schedulers, school systems, and spreadsheets)
  - `clients` (live ecosystem header + 6 industry vertical cards)
  - `contact` (3-step launch roadmap, direct email/WhatsApp cards, 5-point onboarding checklist, 4 executive FAQs)
  - `admin` (updated to CentroListo Control Plane)

- [ ] **Step 1: Update `dict.pulsar` in `src/dictionaries/es.json`, `src/dictionaries/en.json`, and `src/dictionaries/pt.json`**
- [ ] **Step 2: Verify JSON syntax and TypeScript `Dictionary` inference**

---

### Task 3: CentroListo Growth Organisms (`PulsarSiteChrome`, `PulsarInteractivePortalShowcase`, `PulsarLandingHome`, `PulsarProductoView`, `PulsarCompetitorComparisonSection`, `PulsarClientesView`, `PulsarContactoView`)

**Files:**
- Modify: `src/components/organisms/pulsar/PulsarSiteChrome.tsx`
- Create: `src/components/organisms/pulsar/PulsarInteractivePortalShowcase.tsx`
- Modify: `src/components/organisms/pulsar/PulsarLandingHome.tsx`
- Create: `src/components/organisms/pulsar/PulsarCompetitorComparisonSection.tsx`
- Modify: `src/components/organisms/pulsar/PulsarProductoView.tsx`
- Modify: `src/components/organisms/pulsar/PulsarClientesView.tsx`
- Modify: `src/components/organisms/pulsar/PulsarContactoView.tsx`
- Test: `src/__tests__/components/organisms/pulsar/PulsarLandingPages.test.tsx`

- [ ] **Step 1: Expand `src/__tests__/components/organisms/pulsar/PulsarLandingPages.test.tsx` to assert interactive portal tab switching, Before/After section, all 12 product modules (`m1`..`m12`), competitor comparison matrix, client industry verticals, and 3-step onboarding roadmap + FAQs**
- [ ] **Step 2: Run `npx vitest run src/__tests__/components/organisms/pulsar/PulsarLandingPages.test.tsx` and confirm RED**
- [ ] **Step 3: Implement the 7 organisms (keeping each file ≤ 250 LOC)**
- [ ] **Step 4: Run `npx vitest run src/__tests__/components/organisms/pulsar/PulsarLandingPages.test.tsx` and confirm GREEN**

---

### Task 4: Product Changelog, Full Verification & Line-Count Check

**Files:**
- Modify: `src/lib/product-changelog/catalogEntriesRecent.ts`

- [ ] **Step 1: Prepend `centrolisto-brand-and-growth-site` entry in `src/lib/product-changelog/catalogEntriesRecent.ts`**
- [ ] **Step 2: Run all unit/component tests and verify line counts (`wc -l`) on all touched files are ≤ 250**
