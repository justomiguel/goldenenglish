# Tenant landing SSR, fonts, and home title

**Date:** 2026-08-24
**Status:** Approved
**Kind:** Design spec. Implementation plan after approval.
**Program:** Sprint 1 of the tenant performance / SEO audit (canvas `tenant-perf-seo-audit`).

**Related:**

- `.cursor/rules/06-seo-performance.mdc` — public routes must ship title, LCP, no harsh CLS.
- [`2026-08-06-page-titles-design.md`](2026-08-06-page-titles-design.md) — locale layout dropped `title.default` to avoid `<brand> | <brand>`; the **home** page never set a title of its own, so `/[locale]` emits no `<title>`.
- Audit measurements 2026-08-24: homes 540–615 KB HTML, 0 `<title>` / 0 `<h1>` / 0 `<img>` in the first HTML, ~23 font preloads, `x-vercel-cache: MISS`.
- **Core Web Vitals lab (Lighthouse 12, mobile, 2026-08-25)** — this sprint exists to move these numbers, not only HTML shape:

  | Tenant | Perf | LCP | FCP | TBT (INP proxy) | CLS |
  |--------|------|-----|-----|-----------------|-----|
  | Golden | 65 | 9.7 s | 2.5 s | 140 ms | 0 |
  | Espacio Zenit | 60 | 10.4 s | 2.5 s | 210 ms | 0 |
  | Mi Mundo | 61 | 13.3 s | 2.4 s | 213 ms | 0 |
  | Mozarthitos | 69 | 13.4 s | 2.0 s | 20 ms | 0 |
  | Liora | 61 | 14.1 s | 3.4 s | 80 ms | 0 |

  LCP breakdown (Zenit / Golden / Mozarthitos): **Load Delay 76–87%**. The hero image is not requested until after `SurfaceMountGate` hydrates. CLS already Good. INP field not available (PSI 429). Nago: no public origin, skip lab.

**Governing rules:** `03-architecture.mdc` (250-line ceiling), `06-seo-performance.mdc`, `09-i18n-copy.mdc` (no new user-facing copy unless a title string is missing — home uses `brand.name`), `30-harness-self-contained-tests.mdc`, `32-manual-qa-user-owned.mdc`.

No ADR: this does not change auth, RLS, vendors, or persisted contracts. Public HTML/metadata shape changes; the spec is the written context (`10-engineering-governance`).

## Intent

Crawlers and first paint of every tenant **home** (`/[locale]`) see real marketing HTML: `<title>`, `<h1>`, and the LCP image. The document serializes the landing tree **once**. Only the **active** tenant font families are preloaded on that request.

## Done when

1. SSR of `LandingSurfaceGate` (and greenfield gate) renders the landing chrome + `main`, **not** `LandingScreenSkeleton`. A Vitest render **without** waiting for `useSyncExternalStore` client snapshot still finds the `main` heading / landmark.
2. `LandingSurfaceGate` accepts **one** `main` tree. It no longer takes a prebuilt `desktop` that wraps the same `main`. Desktop chrome is composed inside the gate from the existing flags (`suppressHeader`, marketing footer flags).
3. `[locale]/page.tsx` loads the landing sections module with a **dynamic `import()`** keyed on `templateKind`, so unused `*FontRoot` modules are not in the home module graph.
4. Home `generateMetadata` sets `title: { absolute: brand.name }` so the tab is the brand once (not empty, not `Brand | Brand`). Description stays inherited from the locale layout.
5. Existing gate / smoke tests updated; new unit tests are self-contained and pass alone.
6. **CWV gate (lab, same Lighthouse 12 mobile recipe as the baseline):** after the change is on a reachable URL (preview or prod), re-run the five homes. **Must:** LCP Load Delay is no longer the majority of LCP (baseline 76–87%). **Must:** LCP numeric is below the Poor floor of **4.0 s** on every measured home (baseline 9.7–14.1 s). **Target:** LCP Good (< 2.5 s). CLS must stay Good (0 / < 0.1). TBT must not regress past 200 ms on tenants that were already Good. Record the new table in the audit canvas or the plan’s verification notes. Nago stays skipped until it has a public origin.

## Out of scope

- ISR / dropping `force-dynamic` / skipping Supabase session on public GET (sprint 2).
- Canonical / hreflang per child route, sitemap `/login`, `robots` Disallow `/dashboard` (sprint 2).
- Changing Vercel `NEXT_PUBLIC_APP_URL`, SSL on `www.goldenenglish.ar`, or publishing Nago (operator checklist below — no repo code).
- Reworking `SurfaceMountGate` for dashboard / login / blog (those stay skeleton-gated).
- Reducing Espacio Zenit local font *count* inside its own FontRoot (only stop leaking those fonts onto other tenants’ homes).
- New dictionary strings, new analytics events, migrations.

## Context

Three platform bugs, not six brand bugs:

1. **Skeleton SSR.** `LandingSurfaceGate` is `"use client"` and uses `SurfaceMountGate`, which returns `LandingScreenSkeleton` until the client snapshot. Search and Lighthouse see an empty page. Hero `priority` images never appear in the first HTML.
2. **Duplicated RSC payload.** `[locale]/page.tsx` passes `desktop={<LandingScreenDesktop>{main}</LandingScreenDesktop>}` **and** `main={main}`. Next serializes both client props → ~550 KB HTML vs ~45 KB on `/contact`.
3. **Eager font graph.** The home page statically imports every `LandingMainSections*` (each pulls a `*FontRoot` / `next/font`). The response `Link` header preloads ~23 woff2/otf for every tenant.

The missing `<title>` is the page-titles spec leftover: locale layout keeps only `title.template`; home never sets a title.

## Decisions

| Topic | Choice |
|-------|--------|
| Visible SSR | Render desktop chrome + `main` as the `SurfaceMountGate` **skeleton** replacement: pass that tree as the **ssr/desktop** slot. After mount, desktop stays; narrow swaps **chrome only** (PWA header/footer) around the **same** `main`. |
| Duplicate tree | Delete the `desktop` prop. Gate builds `LandingScreenDesktop` internally. |
| Mobile first paint | Accept a possible chrome swap (classic header → PWA header) after hydration on narrow. Marketing full-bleed tenants already `suppressPwaHeader` / own chrome — swap is a no-op for the hero. Do **not** keep the skeleton to avoid that swap. |
| Fonts | `loadLandingMainSections(templateKind)` in `src/lib/landing/` with `await import()` per kind. Classic / editorial / minimal stay static-enough via their own dynamic branches. Greenfield path unchanged (no FontRoot). |
| Home title | `generateMetadata` on `[locale]/page.tsx` only. `absolute` so the root template does not wrap it. Greenfield uses the same brand absolute title (setup copy stays in description from locale layout). |
| LCP image | No new image work. Classic/marketing heroes already set `priority`. They start working once they are in the SSR HTML. |
| `force-dynamic` | Keep. Session email still needed for header CTAs. Caching is sprint 2. |

### Options rejected

| Option | Why not |
|--------|---------|
| Delete the gate; one responsive tree | Classic Golden still uses PWA header/footer on narrow (`LandingHeaderPwa`). Out of scope to unify chrome. |
| CSS-only hide of PWA vs desktop chrome with both in the DOM | Reintroduces a double tree in HTML. |
| `next/dynamic` with `ssr: false` for FontRoots | Fonts would miss SSR; worse LCP. Dynamic **server** `import()` keeps SSR for the active kind only. |
| Put `default: brand.name` back on locale layout | Reopens `<brand> \| <brand>` on every untitled child (page-titles spec). |

## Architecture

### `LandingSurfaceGate`

Client organism. Props after change:

- `main: ReactNode` (required, single landing tree)
- `brand`, `dict`, `locale`, `sessionEmail`
- existing chrome flags: `suppressPwaHeader`, `suppressHeader` (new, same meaning as desktop today), `marketingFullBleedShell`, `marketingLandingFooterBrand`, `suppressMarketingShellFooter`

`SurfaceMountGate`:

- `skeleton` **and** `desktop` = `LandingScreenDesktop` wrapping `main` (same tree).
- `narrow` = current PWA shell wrapping `main` (not a second copy of a different landing).

Greenfield gate: same idea — SSR the current desktop column instead of `LandingScreenSkeleton`. `main` already passed once; stop using skeleton.

### `loadLandingMainSections`

Pure dispatcher (no React in the loader if we return a component type):

```ts
export async function loadLandingMainSections(kind: SiteThemeKind)
  : Promise<LandingMainSectionsComponent>
```

Switch on `kind`, `await import` the matching organism. Tests: each kind resolves to a function; unknown/classic → `LandingMainSections`.

`[locale]/page.tsx` stays the RSC orchestrator (session, theme, overrides) and must stay ≤250 lines — extract the dispatcher if the page is tight.

### Home metadata

New helper or inline `generateMetadata` in the page (pages are excluded from coverage include; behavior tested via a small `buildHomePageMetadata` in `src/lib/metadata/` if the page would otherwise hide logic).

```ts
{ title: { absolute: brand.name } }
```

No robots/canonical change in this spec.

## Testing (TDD)

1. **`LandingSurfaceGate`** — first render (SSR snapshot): `main` content is in the document; `LandingScreenSkeleton` / `loadingAria` is **absent**. After mount on `web-mobile`, PWA shell still wraps `main`.
2. **`loadLandingMainSections`** — classic / each marketing kind returns a component; module path isolation (mock `import` or assert export names).
3. **`buildHomePageMetadata`** — `title.absolute === brand.name`; no `|` in the absolute string.
4. Update `surfaceGatesNarrow.test.tsx` and `smoke-part1` to the new props (no `desktop` prop).
5. Greenfield gate: SSR shows `main`, not skeleton.
6. **CWV verification (not Vitest):** `npx lighthouse@12 <url>/es --form-factor=mobile --screenEmulation.mobile --only-categories=performance`. Compare LCP, LCP breakdown (Load Delay %), TBT, CLS to the baseline table above.

Harness: each new/touched test file runnable alone (`npx vitest run <file>`).

## Operator checklist (not this PR)

Do in Vercel / DNS after or beside the code drop:

1. Mozarthitos: `NEXT_PUBLIC_APP_URL=https://www.mozarthitos.cl` (or the chosen apex) and redeploy.
2. Golden: fix or 301 `www.goldenenglish.ar` (expired cert). Keep one origin.
3. Nago: attach domain + production deploy; set `NEXT_PUBLIC_APP_URL`.

## Risks

| Risk | Mitigation |
|------|------------|
| Narrow classic: header swap after hydration | Marketing tenants suppress PWA header. Classic: swap is chrome-only; hero stays. Accept vs empty SSR. |
| Dynamic import + tests | Loader unit-tested; page still covered by existing landing section tests. |
| Client bundle of `LandingScreenDesktop` | Already pulled via the client gate; header/footer were already client. |
| Title absolute vs share cards | OG title remains `brand.name` from locale layout. |

## Definition of done

- Spec approved + plan on disk + TDD green for the files above.
- `npx vitest run` on each touched test file passes in isolation.
- Lighthouse mobile re-run on the five baseline homes meets Done when §6 (LCP < 4 s; Load Delay no longer the majority).
- No change to dashboard gates, sitemap, robots, or env files in this PR.
