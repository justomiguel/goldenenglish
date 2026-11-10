# Exclusive client themes

## Context

Some `SiteThemeKind` values are full landings built for one institute (`mozarthitos`, `espaciozenit`, `nago`, `mimundo`, `liora`). Other values are the CentroListo catalog (`GENERIC_INSTITUTE_KINDS`) or shared shells (`classic`, `editorial`, `minimal`).

The CMS kind picker listed every `SITE_THEME_KINDS` value when the active kind was not generic. `setSiteThemeKindAction` saved any of those values. One institute could activate another institute's landing.

## Decision

- Ownership lives in code: `EXCLUSIVE_THEME_OWNERS` in `src/lib/theme/exclusiveThemeKinds.ts`. Each bespoke kind maps to its tenant slug.
- The CMS picker shows an exclusive kind only to that owner. The active kind stays on screen.
- The server action returns `kind_not_available` when the request tenant does not own the kind.
- A request with no tenant (single-client database, registry off) may use any kind.
- Catalog kinds stay out of this map. Exclusive kinds stay out of `GENERIC_INSTITUTE_KINDS`.
- The next special landing follows `docs/runbooks/exclusive-landing-request.md` and rule `51-exclusive-client-themes.mdc`.

## Options considered

| Option | Why rejected |
|---|---|
| Owner column on `site_themes` | The landing is code. It already ships in a deploy. A column needs a migration on every institute and can drift from the components. |
| One repo per client | Shared auth, CMS, and billing would fork. |

## Consequences

- Nago cannot switch its site to Mozarthitos. Golden cannot switch to Liora.
- CentroListo staff, on `/admin/tenants/[slug]/theme/landing`, see the kinds for that slug.
- A new bespoke kind without an owner row fails `exclusiveThemeKinds.test.ts`.
- Adding a client landing still needs the enum migration, the `/register` surface, and an ADR for that client.
