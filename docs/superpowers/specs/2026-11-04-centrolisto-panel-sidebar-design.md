# CentroListo panel after login, with a sidebar

**Intent:** After sign-in, the person lands on a panel they can open. That panel has a sidebar, like the institute admin, with the panel tools. Public pages stay in the public header.

**Done when:**

- Sign-in on `/cuenta/login` leaves the form and opens the panel.
- A staff user opens `/admin`. An owner opens `/cuenta`.
- A non-staff user is not sent to `/admin` and is not bounced back to the login form.
- The public “Panel” link goes to `/cuenta`. Staff still reach `/admin` from that page.
- Signed-in `/admin` and `/cuenta` screens show one sidebar.
- Desktop shows a fixed left rail. A narrow viewport and the PWA open the same links from a menu button.
- Login and register stay on the public site chrome. They do not show the panel sidebar.

**Out of scope:** Institute dashboards. New admin tools. A second brand. Changing fleet tab data, owner site cards, or theme editors beyond wrapping them in the sidebar shell.

## What is wrong now

`PulsarAccountAuthForm` signs in in the browser, then calls `resolvePulsarPostLoginPath`, then `router.push`. Two failures follow.

1. The public header links “Panel” to `/${locale}/admin`. `admin/login` sends the person to `/cuenta/login?next=/${locale}/admin`. A signed-in owner is allowed to follow that `next`. `/admin` then requires staff and sends them to `admin/login` again. The form never settles on a panel.
2. Institute login uses `window.location.assign` so the next document request carries the session cookies. This form uses a client transition. The server can still treat the user as signed out and return `/cuenta/login`.

`PulsarAdminChrome` and `PulsarAccountFrame` are a top bar and a column of content. Institute admin uses `AdminSidebar` (`w-72`, logo, grouped links, sign out). CentroListo has no equivalent. Fleet tools are tabs on one page. Public pages live only in the marketing header.

## Decision

Send every signed-in person to a panel they can open. Put one sidebar on that panel. The sidebar lists the public CentroListo pages and the tools for that role.

After a successful `signInWithPassword`, navigate with `window.location.assign` to the path from `resolvePulsarPostLoginPath`. Do not use `router.push` for this hop.

`resolvePulsarPostLoginPath` keeps a safe `next` when the person may open it.

- Staff with `mustChangePassword` go to `/${locale}/admin/password`.
- Staff go to the safe `next`, or to `/${locale}/admin`.
- A signed-in owner goes to `/${locale}/cuenta` when `next` is missing, is `/${locale}/admin`, or is `/${locale}/admin/login`.
- An owner may still follow a safe theme path such as `/${locale}/admin/tenants/<slug>/theme`.
- No session returns `/${locale}/cuenta/login`.

The “Panel” control in `PulsarSiteChrome` and `PulsarSiteChromePwa` points at `/${locale}/cuenta`. `/cuenta` already redirects staff to `/admin`.

## Sidebar

One pure builder, `src/lib/pulsar/pulsarPanelNav.ts`, returns the panel tools only. Public pages stay in `PulsarSiteChrome` and `PulsarSiteChromePwa`. Labels come from `dict.pulsar.admin` and `dict.pulsar.account`. Spanish stays neutral tuteo.

**Panel:**

- Staff: Sitios, Cuentas, Correo, Analítica on `/${locale}/admin?tab=…`, plus Nuevo instituto `/${locale}/admin/tenants/new`.
- Owner: Tus sitios `/${locale}/cuenta`, and Nuevo sitio `/${locale}/cuenta/nuevo`.

The active item follows the pathname and the `tab` query. Fleet tabs stay. The sidebar is a second way to set the same `tab` key. Do not add a second query key.

Logo links to `/${locale}`. Sign out stays the existing `PulsarSessionMenu` action, placed at the bottom of the rail. Each row has a leading Lucide icon and a visible label. Icon-only controls are not used here.

`PulsarAdminChrome` renders the rail for every admin screen that already uses that chrome, including tenant detail, theme, and password. `PulsarAccountFrame` renders it when the path is not login or register.

## Options

1. **Shared sidebar on the signed-in shells, plus a hard navigation after login.** Recommended. One nav model. Owners and staff each land on a page that already exists.
2. **Keep the header and only fix the redirect.** Rejected. The person still cannot move across the main pages from the panel.
3. **Copy `AdminSidebar` and the institute link list.** Rejected. Those links are cohort, finance, and users. They are not CentroListo pages.

## Surfaces (Web vs PWA)

CentroListo account auth is public. The panel is the signed-in workspace. Institute Tier A trees are not part of this change.

- **Web (`web-desktop`):** a fixed left rail, about `w-72`, border and background from tokens. Content scrolls beside it. Login and register keep `PulsarSiteChrome` (two columns, wardrobe photo).
- **Narrow browser and PWA (`web-mobile` / `pwa-mobile`):** no permanent rail. A menu button in the top bar opens a sheet with the same tools. Targets are at least 44px. The sheet respects the safe area. Public `PulsarSiteChromePwa` stays the marketing chrome. Its Panel link goes to `/cuenta`. Do not put the panel rail on the public pages.

Admin has no PWA tree today. The sheet is the narrow behavior of this shell. It does not add a second admin product tree.

Shared hooks and actions stay compatible. `usePersistentPageTab` still owns `tab`. The sidebar only links to those URLs.

## Tests

- `resolvePulsarPostLoginPath`: owner plus `next=/es/admin` returns `/es/cuenta`. Staff plus the same `next` returns `/es/admin`. Owner plus a theme path keeps that path.
- Pure nav builder: staff items are the four tabs and new tenant. Owner items are sitios and nuevo sitio. Public routes are absent.
- Auth form: a successful sign-in assigns `window.location` to the resolved path.
- Sidebar render: the rail exposes the panel tools for the role under test. Precios and Presencia are absent.

## Manual QA (user)

- Sign in as an owner from `/cuenta/login`. The browser opens Tus sitios.
- Sign in as staff. The browser opens the fleet.
- Open Panel from the public header while signed in as an owner. The page is `/cuenta`, not a login loop.
- On a wide window, use the rail to open a fleet tab or Tus sitios. Precios stays in the public header.
- On a narrow window, open the menu and reach the same panel tools.
