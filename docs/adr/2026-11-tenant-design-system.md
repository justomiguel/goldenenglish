# Tenant design system — data per tenant, versioned variants

Spec: `docs/superpowers/specs/2026-11-10-tenant-design-system-design.md`.

## Context

The product must serve about 1000 institutes. Each institute is a different site with its own identity. A design change for one institute must change only that institute.

Today the identity of 6 bespoke clients lives in code. A scan on 2026-11-10 found 254 product files and 3805 hits for their slugs. 22 shared files compare a slug two or more times. Each new bespoke client edits all of them. An edit to a shared section component changes every institute at once.

## Decision

- Tokens live per tenant in a versioned theme document in the tenant schema. The server builds CSS custom properties from it.
- Sections come from a shared library of variants. Each variant has a version `major.patch`. A tenant pins the major version.
- A visual change ships as a new major version. Tenants adopt it one by one.
- A security or accessibility fix ships as a patch. Every tenant on that major gets it. Visual regression per variant blocks a patch that changes the look.
- Client-only code ships as an owned variant (`owner: "<tenantSlug>"`). Shared code does not compare tenant slugs.
- CentroListo staff build the base site. The institute admin edits only fields marked `editableBy: "admin"`.
- Fonts come from a curated, self-hosted catalog. A tenant picks font ids.
- Each tenant publishes immutable snapshots and can roll back. Publish and rollback are audited.
- A precommit check blocks slug comparisons in shared code.

## Options considered

| Option | Why rejected |
|---|---|
| One code tree per bespoke client (today) | Each client edits about 22 shared dispatchers. Cost grows with the client count. |
| Theme registry in code only | Works for 6 clients. 1000 clients would need 1000 code modules and a deploy for each identity change. |
| Free CSS per tenant | Breaks WCAG AA, allows unsafe CSS, and blocks support. |
| One deploy or repo per tenant | Forks auth, CMS, billing, and migrations. |
| All tenants always on the latest variant | A redesign changes every site at once. |
| Strict pinning, also for patches | Security and accessibility fixes would wait for manual approval per tenant. |

## Consequences

- A new institute needs no code. It needs a theme document.
- A bespoke client adds owned variants only. It does not add a `SiteThemeKind`.
- Rules `28-tenant-register-surface.mdc` and `51-exclusive-client-themes.mdc` change in phase 5. This ADR supersedes the "ownership lives in code per kind" part of `docs/adr/2026-11-exclusive-client-themes.md` once phase 4 ends.
- Old major versions stay in code while a tenant pins them. Fleet telemetry counts tenants per version.
- CI gets visual regression per variant.
- Six live clients migrate one by one in phase 4, with visual snapshots before and after.
- Tests: token schema, CSS builder, contrast validator, registry guard, publish validation codes, slug guard.
- Observability: `recordSystemAudit` on publish and rollback, `[ge:server]` scope `themeDocument.publish`.
