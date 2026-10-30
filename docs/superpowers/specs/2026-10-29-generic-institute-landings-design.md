# Generic institute landings

## Intent

A new institute picks one of five landing templates in Pulsar Admin. The first visit runs the existing site-setup wizard. Stock favicon, logo, and hero live in `public/generic/`. If the wizard does not upload a favicon, the stock icon stays. An upload is stored in the institute Supabase project. For `shared_schema` that project is Pulsar, with the tenant storage prefix.

## Done when

- Admin can choose Deportes, Jardín, Colegio, Música, or Idiomas.
- The choice sets `brandThemeSlug` to `generic-<kind>`.
- A product migration adds the five `site_theme_kind` values and five inactive `site_themes` rows.
- Each row sets colors plus `app.favicon.path` and `app.logo.path` under `/generic/<kind>/`.
- The public home for that kind renders one article landing. Copy comes from the dictionaries.
- `sitemap.ts` already lists the public routes for the host. No second sitemap file.
- Uploads still use the site-setup storage path. They are not written into `public/generic/`.

## Out of scope

- A new Supabase project.
- Vercel Domains.
- A CMS editor for the generic story. The story is the template copy.
- Cloning the Nago, Liora, or Mi Mundo trees.

## Decision

One shared article layout. The kind changes copy, palette, and stock media. Five full brand trees would copy the same shell.

## Surfaces (Web vs PWA)

Tier A. The public shell stays `LandingSurfaceGate` (web header and PWA tab bar). The article is the same on both surfaces: one column, a 44px link, no hover-only action. Admin template select is Tier B desktop-only.

## Public files from admin data

A new institute does not ship a second brand tree. When the admin saves the wizard, the logo, the favicon, or the home image, the server writes `public/images/<slug>/`.

The pack uses what that admin entered:

- `app.name` and `app.tagline` become the share title and description.
- A PNG, JPG, or WebP upload becomes the WhatsApp image (`og.png` or `og.jpg`).
- A PNG upload becomes the Android and iPhone icons. The manifest and `robots.ts` stay the dynamic routes that already exist.
- If there is no raster upload yet, the share image is a PNG card with the name and the tagline, and the icons are solid PNGs in the template colors.

`public/generic/` stays the stock fallback. Uploads are not written there.

## Sections and default photos

The public page is one article today: one scene, one title, one paragraph, one photo, a second title, and a link. It does not render Historia, Oferta, Modalidades, Niveles, or Certificaciones. The landing editor shows only Inicio, with one image. The story text lives in the dictionaries. The institute admin cannot edit that text.

Named institutes edit many photos and many copy fields in their own admin. Pulsar staff can open the same editor for one institute.

## Edit from Pulsar

A Pulsar staff session can edit the active theme at `/[locale]/admin/tenants/[slug]/theme`. The page reuses `SiteThemeEditorShell`, `LandingEditorOverview`, and `LandingSectionEditorShell`. Middleware sets `x-ge-pulsar-theme-slug` from that path. Theme actions accept that header only when the caller is Pulsar staff, then bind that institute's data plane. The institute admin path stays `assertAdmin` when the header is absent.

Each of the six sections has one photo in the generic editor. The public article shows the upload, or `public/generic/<kind>/<section>.jpg` when the slot is empty. The theme favicon is `public/generic/<kind>/favicon.png`. Logo, colors, and name stay on the same theme screen. Android and iPhone icons keep using the uploaded logo file.

## Close

Pulsar Admin can close one institute. The action deletes `public/images/<slug>/`, the `platform_tenants` row, and, when `data_mode` is `shared_schema`, that `tenant_<slug>` schema. It does not delete `public/generic/`. It does not drop an external Supabase project. The confirm control is a modal. The person must type the slug.

## Apply

Write SQL for `public`. Apply with `npm run sql:apply-migration:all-tenants:pg`. Shared-schema create already runs new product files during provision.
