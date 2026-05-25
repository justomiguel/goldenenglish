# Mi Mundo — New Tenant and `mimundo` SiteThemeKind

## Context

Golden English is a white-label platform shared by multiple educational institutions (tenants). Each tenant is represented by a row in `public.site_themes` and uses a dedicated Supabase project or a shared project with a `SITE_BRAND_THEME_SLUG` env override.

**Jardín Maternal Mi Mundo** is the fifth tenant, a Buenos Aires–based kindergarten targeting families in Argentina (ARS). It requires:

- A dedicated marketing landing page that reflects its brand identity (Fraunces + Nunito + Caveat type triad, logo-derived color palette, butterfly motif, 6 classroom levels).
- Three active locales: `es` (primary), `en`, `pt`.
- A dedicated Supabase project (no `SITE_BRAND_THEME_SLUG` override needed — the one `site_themes` row is the active theme).
- CTA "Reservar mi cupo" routing to `/[locale]/register` (no new payment gateway in this scope).
- WCAG AA–compliant color usage: `#6D4C41` ink on `#FFF8EC` cream for body text, yellow `#FFD426` restricted to non-text/decorative surfaces, fuchsia `#EC2E88` restricted to large display headings (≥18 pt bold).

## Decision

1. Add `'mimundo'` as a new `site_theme_kind` enum value (migration `127_site_theme_kind_mimundo.sql`, additive, idempotent guard).
2. Seed `public.site_themes` with the Mi Mundo brand properties (migration `128_site_theme_mimundo_seed.sql`, upsert on `slug`).
3. Introduce a dedicated visual shell:
   - `LandingMainSectionsMimundo` as the root layout (font root + header + sections).
   - `LandingMimundoSections` orchestrates Hero → Propuesta → Salas → Jornada → Galería → Contacto → Footer.
   - `MiMundoSiteHeader` provides Iniciar sesión + Reservar mi cupo CTAs with accessible labels.
   - `MiMundoLandingGallery` reuses the Nago gallery pattern (polaroid frames, carousel lightbox).
   - `MiMundoLandingContactPanel` embeds `PublicContactForm`.
4. All landing copy is managed through `src/dictionaries/*.json` under the `landing.mm.*` namespace; no literals in components.
5. Animations (floating butterflies, fade-in-up, hover-lift, header blur) are gated by `@media (prefers-reduced-motion: reduce)`.

## Options considered

| Option | Rejected because |
|--------|------------------|
| Shared Supabase project with `SITE_BRAND_THEME_SLUG` env | Mi Mundo is a fully independent institution; a dedicated project avoids data co-mingling and simplifies onboarding |
| Re-using an existing landing template (Nago) with a brand override | The brand identity (butterfly motif, classroom naming, illustrated frames) diverges enough from Nago to warrant a separate template kind |
| Single `SiteThemeKind = "generic"` with a CMS-only customization path | Insufficient for distinct component structure (animated hero with butterflies, sala grid layout, jornada timeline); CMS-only path is for copy/image changes, not structural page differences |
| Next.js Payment Gateway (MercadoPago) in scope | Out of scope for this PR; the CTA routes to `/register`. Follow-up tracked in `docs/adr/2026-05-mercadopago-integration.md` |

## Consequences

**Immediate (this change set):**
- Two new additive migrations (127 + 128); no destructive data changes.
- New TypeScript enum value `"mimundo"` in `SITE_THEME_KINDS`, `MARKETING_FULL_BLEED_LANDING_KINDS`, and `MarketingLandingBrand`.
- New catalog `src/lib/cms/landingMimundoCatalog.ts` (~90 LOC) with `MIMUNDO_LANDING_COPY_KEYS_BY_SECTION`, `MIMUNDO_MEDIA_SLOTS_BY_SECTION`, `MIMUNDO_EDITABLE_COPY_KEYS`.
- New image helpers `mimundoLandingImages.ts` and `mimundoGalleryImages.ts` following the established Nago pattern.
- Dictionary additions in `es.json`, `en.json`, `pt.json` under `landing.mm.*` (~200 new keys total).
- Vercel target entry added to `scripts/vercel-targets.json` (org/project IDs placeholder `""` until the project is provisioned).
- Ops scripts extended: `dev:mimundo`, `pull:env:mimundo`, `apply:migrations:all` includes `mimundo`.
- Tests: ≥90% coverage gate satisfied by `landingMimundoCatalog.test.ts`, `mimundoLandingImages.test.ts`, `LandingMimundoSections.test.tsx`, `MiMundoLandingContactPanel.test.tsx`.

**Follow-ups (future PRs):**
- Provision actual Vercel project and Supabase project; populate `vercel-targets.json` org/project IDs.
- Integrate MercadoPago Checkout Pro for ARS once the gateway ADR is implemented (`2026-05-mercadopago-integration.md`).
- Run `npm run lighthouse:a11y:tenants` on the provisioned preview URL to validate WCAG AA metrics ≥90.
- Add Mi Mundo entry to `scripts/a11y-lighthouse-manifest.json` when the production domain is known.
- CMS admin UI: expose `MIMUNDO_EDITABLE_COPY_KEYS` through the landing content editor for self-service copy updates.
