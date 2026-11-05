# CentroListo admin catalog of client site templates

**Intent:** Staff open one page in the CentroListo panel and review every site template offered to clients.

**Done when:**

- Signed-in staff see **Plantillas** in the panel rail, after Analítica and before Nuevo tenant.
- `/{locale}/admin/plantillas` lists every kind in `GENERIC_INSTITUTE_KINDS` (ten kinds).
- Each card shows the stock preview image, the existing kind name, and a link to `/{locale}/plantilla/{kind}`.
- A person without a staff session is sent to `/{locale}/admin/login`. A staff user who must change their password is sent to `/{locale}/admin/password`.
- The page is absent on an institute host (`notFound`).
- The page is `noindex`. It is absent from the sitemap and from `llms.txt`.
- Copy is in `en.json`, `es.json`, and `pt.json`. Spanish stays neutral tuteo.
- Owner nav (`/cuenta`) stays unchanged.

**Out of scope:** Editing a template. Color pickers. Creating a site from this page. Email templates. Institute CMS themes at `/dashboard/admin/cms/templates`.

## Context

The ten generic kinds live in `src/lib/theme/genericInstituteTemplates.ts`. A full page already renders at `/{locale}/plantilla/{kind}`. Names already live in `pulsar.solutionSet.presencia.templateKinds`. Preview files already live in `public/generic/{kind}/`.

Staff only meet those kinds inside **Nuevo tenant**. The panel rail (`buildPulsarPanelNav`) has Sitios, Cuentas, Correo, Analítica, Nuevo tenant, and Perfil.

Institute admin **Plantillas** is `site_themes` for that institute. It is a different catalog.

## Decision

Add a read-only staff page that reuses the kind list, the preview files, and the public preview route.

## Options

1. **Staff page plus one rail link.** Recommended. Review does not start a create flow.
2. **Rely on Nuevo tenant.** Rejected. The picker is inside a long form. Staff cannot browse without starting an alta.
3. **Put the catalog on the institute admin rail.** Rejected. Those templates belong to CentroListo, not to one institute.

## Surfaces (Web vs PWA)

CentroListo staff panel is Tier B. `PulsarPanelFrame` already supplies the rail on wide screens and the same links in a sheet on a narrow viewport and in the PWA. This change adds one item to `buildPulsarPanelNav` for `role: "staff"`. Both surfaces receive it. No second nav tree.

- **Web:** a grid of cards, about three columns on a wide pane.
- **Narrow and PWA:** the same cards in one column. The open-template control is at least 44px tall. The sheet already lists the new rail item.

`PulsarSiteChrome` and `PulsarSiteChromePwa` stay the public chrome. This page does not change their props.

## Page

Route: `src/app/[locale]/admin/plantillas/page.tsx`.

Guards match `admin/tenants/new/page.tsx`: `isPulsarPlatformRequest`, `getPulsarStaffSession`, password redirect, then `PulsarAdminChrome`.

`metadata.robots` is `{ index: false, follow: false }`. The CentroListo logo stays in the panel chrome. The document title is `Plantillas | CentroListo` through the existing title helper.

Organism `PulsarTemplateCatalog` (one file, under 250 lines):

- Title and one lead from `dict.pulsar.admin`.
- One card per `GENERIC_INSTITUTE_KINDS`.
- Image `src` from `genericPreviewSrc`. `alt` is the kind name.
- Name from `dict.pulsar.solutionSet.presencia.templateKinds`.
- Link label from `dict.pulsar.admin`. `href` is `templatePreviewHref` with the default palette, or `/{locale}/plantilla/{kind}` when that helper needs a palette. The link opens the live template page.

No color inputs. No create button.

## Tests

- `pulsarPanelNav.test.ts`: staff href list includes `/{locale}/admin/plantillas` in the position above. Owner hrefs stay the same. The new item is active only on that path.
- Catalog render: ten images, ten names, ten links whose `href` contains `/plantilla/` and the kind.

## Manual QA (user)

Sign in as staff on the CentroListo host. Open Plantillas from the rail. Open one card and confirm the full template page. On a narrow window, open the menu and confirm Plantillas is there.
