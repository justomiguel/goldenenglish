# Tenant design system — one identity per institute (umbrella spec)

**Status:** draft, waiting for approval.
**Type:** full spec. This file is the umbrella for phases 1 to 6. Each phase gets its own spec before its code.
**ADR:** `docs/adr/2026-11-tenant-design-system.md`. Write it from the "Decision" and "Options considered" sections after approval.

## Understanding

- The product must serve about 1000 institutes. Each institute is a different site with its own identity.
- A design change for one institute must change only that institute.
- Today, identity for the 6 bespoke clients lives in code. A scan on 2026-11-10 found 254 product files and 3805 hits for `nago`, `liora`, `mimundo`, `mozarthitos`, `espaciozenit`, and `matiss`.
- 22 shared files compare a slug two or more times (`templateKind === "nago"`). Each new bespoke client edits all of them.

## Problem

1. **Code per client does not scale.** Each bespoke `SiteThemeKind` adds a branch to the register, contact, blog, privacy, answer, chrome, PWA tab bar, CMS editor, media, and share preview dispatchers.
2. **Shared code changes leak.** An edit to a shared section component changes every institute that renders it. No institute can stay on the old look.
3. **Leaks of one client into shared paths.** Login, forgot-password, and reset-password use the Nago logo (`resolveNagoLogo`). The root layout builds Liora places. `encuentra-tu-clase` returns 404 unless the kind is `mozarthitos`. Event surface classes know only `nago` and `espaciozenit`.
4. **Lists drift.** `isBrandDataMigration` in `src/lib/tenant/planInstituteMigrationApplies.ts` lists slugs in a regex and omits `matiss`.
5. **Fonts are code.** Each bespoke kind has a `*FontRoot.tsx` with `next/font`. A font per tenant cannot work for 1000 tenants this way.

## Decision

The design system becomes **data per tenant** plus a **shared library of versioned section variants**.

1. **Tokens per tenant.** Palette, type scale, font id, radii, spacing, elevation, and motion live in a versioned theme document in the tenant schema. The server builds CSS custom properties from that document.
2. **Versioned variants.** A section variant has an id and a version `major.patch` (`hero.split@1.3`). A tenant pins the major version. A visual change ships as a new major version. A tenant on `@1` does not see `@2` until it chooses it.
3. **Patches reach all tenants.** A security or accessibility fix ships as a patch (`@1.3` to `@1.4`). Every tenant on `@1` gets it. Visual regression tests per variant block a patch that changes the look.
4. **Composition per tenant.** A site is an ordered list of sections. Each section names a variant, a pinned major version, and props. Two institutes look different with no client-specific code.
5. **Owned variants for bespoke work.** Client-only code ships as a variant with `owner: "<tenantSlug>"`. It uses the same contract, versions, and registry. Shared code never compares a tenant slug.
6. **Two editors.** CentroListo staff build the base site. The institute admin edits only the fields the staff left open (`editableBy: "staff" | "admin"`).
7. **Font catalog.** Tenants pick a font id from a curated, self-hosted catalog. The server emits `@font-face` only for the picked fonts.
8. **Publish per tenant.** A theme document has a draft and immutable published snapshots. Publish and rollback are per tenant and audited.
9. **Mechanical guard.** A precommit check fails when shared code compares a tenant slug. A new rule states the contract.

## Options considered

| Option | Why rejected |
|---|---|
| Keep one code tree per bespoke client (today) | Each client edits about 22 shared dispatchers. Cost grows with the client count. |
| Theme registry in code only (one module per kind) | Fixes the dispatchers for 6 clients. 1000 clients would still mean 1000 code modules and deploys for every identity change. |
| Free CSS per tenant | Breaks contrast (rule 26), allows unsafe CSS, and makes support impossible. |
| One deploy or repo per tenant | Forks auth, CMS, billing, and migrations. Operating cost grows with the client count. |
| No versions, all tenants on latest variant | A redesign changes 1000 sites at once. This is the exact failure the user wants to remove. |
| Strict pinning, even for patches | Security and accessibility fixes would wait for 1000 manual approvals. |

## Model (contract for phases 1 to 3)

### Theme document (per tenant, tenant schema)

```ts
type ThemeDocumentV1 = {
  contractVersion: 1;
  tokens: DesignTokensV1;
  fontIds: { heading: FontId; body: FontId };
  sections: ReadonlyArray<{
    id: string;
    variantId: string;
    major: number;
    props: unknown;
  }>;
  editableBy: Readonly<Record<string, "staff" | "admin">>;
};
```

- Draft and published snapshots are rows. A published snapshot is immutable.
- `site_themes` keeps identity (`slug`, `name`, brand assets). Phase 3 decides the table shape.
- Content copy stays localized (`es`, `en`, `pt`) per section props, as `SiteThemeContent` does today.

### Variant contract (code, shared library)

```ts
type SectionVariant<P> = {
  id: string;
  major: number;
  patch: number;
  owner?: string;
  propsSchema: ZodType<P>;
  consumesTokens: ReadonlyArray<keyof DesignTokensV1>;
  web: () => Promise<{ default: ComponentType<P> }>;
  pwa: () => Promise<{ default: ComponentType<P> }>;
};
```

- A variant reads tokens only through CSS custom properties. It has no hex values (rule 01).
- An owned variant is valid only for its owner tenant. The server action rejects it for other tenants with `variant_not_available`.
- A major version stays in code while one tenant pins it. Fleet telemetry counts tenants per variant and major version.

### Publish validation

Each failure has a stable code and its own dictionary sentence (rule 50):

| Code | Cause |
|---|---|
| `contrast_below_aa` | A text or control token pair is below WCAG AA. |
| `font_not_in_catalog` | A font id is not in the catalog. |
| `variant_version_missing` | The pinned major version is not in the registry. |
| `variant_not_available` | An owned variant belongs to another tenant. |
| `token_missing` | A required token is empty. |
| `field_locked` | An admin tried to change a staff-only field. |

## Isolation guarantees

| Change | Who sees it |
|---|---|
| Token or content edit in tenant A | Tenant A only, after publish. |
| New major version of a shared variant | Only tenants that pin it. |
| Patch to a shared variant | All tenants on that major. Visual regression blocks look changes. |
| Owned variant edit | The owner tenant only. |
| Font catalog addition | No tenant, until one picks it. |

## Surfaces (Web vs PWA)

- **Public site (Tier A):** landing, `/register`, contact, blog, privacy, answer pages, events. Each variant ships a `web` and a `pwa` component. The entry uses `useAppSurface()` / `SurfaceMountGate`. PWA variants follow rule 05 (44 px targets, safe areas, bottom CTAs).
- **Design editor (Tier B):** desktop-only, under the CentroListo panel and the institute admin CMS. No PWA tree.
- **Existing PWA trees:** `PublicPwaTabBar`, `PublicInstalledTopBar`, and the Mozarthitos family guide PWA files must keep working during migration. Phase 4 lists their tests.

## Phases (one spec each)

Phase specs:

1. `2026-11-10-design-tokens-v1-design.md`
2. `2026-11-10-section-variant-registry-design.md`
3. `2026-11-10-theme-document-lifecycle-design.md`
4. `2026-11-10-migrate-bespoke-themes-design.md`
5. `2026-11-10-institute-hardcode-guard-design.md`
6. `2026-11-10-design-editor-design.md`
7. `2026-11-10-pwa-install-identity-design.md` (depends on 1, 3)
8. `2026-11-10-scale-1000-tenants-design.md` (depends on 1 to 3; budgets bind later phases)
9. `2026-11-10-email-identity-per-tenant-design.md` (depends on 1, 3)
10. `2026-11-10-dashboard-identity-per-tenant-design.md` (depends on 1, 3, 7)

The phase 3 spec adds `pages` to `ThemeDocumentV1` for the non-home public pages. That field is part of contract version 1.

| Phase | Spec | Scope | Depends on |
|---|---|---|---|
| 1 | Design tokens v1 | `DesignTokensV1` type and Zod, CSS custom property builder, contrast checker, font catalog, replace `*FontRoot.tsx` | this spec |
| 2 | Section variant registry | `SectionVariant` contract, registry, pinning, owner guard, fleet count per version, visual regression per variant | 1 |
| 3 | Theme document lifecycle | Tables and RLS, draft, publish, rollback, `editableBy`, `recordSystemAudit`, cache tag per tenant | 1, 2 |
| 4 | Migrate the 6 bespoke themes | Nago, Liora, Mi Mundo, Mozarthitos, Espacio Zenit, Matiss become tokens plus owned variants. Remove slug dispatchers and the leaks listed in "Problem" | 2, 3 |
| 5 | Guard and rule | Precommit check on slug literals in shared code, rule `53-no-institute-hardcode.mdc`, updates to rules 28 and 51, `-- ge:brand-data` marker for SQL | 2 |
| 6 | Design editor | Staff and admin editors for tokens, sections, fonts, preview, publish | 3 |

Phase 5 can start in report mode right after phase 2. It turns blocking at the end of phase 4.

## Rules and docs to update (during the phases)

- `28-tenant-register-surface.mdc`: a new tenant gets its `/register` look from tokens and variants. A new `Register<Tenant>Surface` file is no longer the default.
- `51-exclusive-client-themes.mdc`: an exclusive landing becomes a set of owned variants. A new `SiteThemeKind` per client stops.
- `01-design-system.mdc`: tokens come from the theme document. `SYSTEM_PROPERTIES_DEFAULTS` stays the default token set.
- `docs/runbooks/add-new-tenant.md` and `docs/runbooks/exclusive-landing-request.md`.

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| The migration changes the look of the 6 live clients | Phase 4 uses visual snapshots before and after per client. Each client moves alone. |
| Many major versions stay in code | Fleet count per version. A version with zero tenants for 90 days is removed through a spec. |
| Bundle grows with the variant count | `import()` per variant. Only pinned variants load. Lighthouse before and after (rule 06). |
| Admin breaks contrast | Publish validation blocks it (`contrast_below_aa`). |
| Fonts slow LCP | Self-hosted catalog, `font-display: swap`, at most 2 families per tenant. |
| Patch changes a look by mistake | Visual regression per variant in CI. A diff blocks the patch. |
| Scope is large | Each phase ships alone and keeps the current path working until phase 4 ends. |

## Observability

- `recordSystemAudit` on publish and rollback (`resource_type: "theme_document"`).
- `[ge:server]` logs with scope `themeDocument.publish` and the validation code.
- Fleet telemetry: tenants per variant id and major version.

## Definition of done (this umbrella spec)

- The user approves this file.
- The ADR is written from the sections above.
- The phase 1 spec is written and approved before any code.

## Out of scope (this spec)

- Code changes. Each phase spec owns its code.
- Dashboard identity and email identity are covered by phases 10 and 9.

## Manual QA (user)

Listed per phase. Phase 4 needs a visual check of each migrated client on Web and PWA.
