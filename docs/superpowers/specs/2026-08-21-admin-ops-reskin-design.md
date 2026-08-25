# Admin operations reskin

**Date:** 2026-08-21
**Status:** Approved (brainstorm)
**Kind:** Full design spec. The implementation plan may split delivery into phases; this is one product change.

**Supersedes, for admin chrome and primary navigation only:**

- [`2026-08-06-admin-menu-design.md`](2026-08-06-admin-menu-design.md) — grouping and “every destination stays in the sidebar” no longer hold. Naming quality (one name per destination, no near-duplicates) still applies to whatever remains visible.
- [`2026-08-06-home-screen-priority-design.md`](2026-08-06-home-screen-priority-design.md) — the admin-home half. Birthdays stay below money; the uniform metric grid is replaced. The parent half of that spec is untouched.

**Related:**

- [`2026-08-07-parent-portal-layout-redesign-design.md`](2026-08-07-parent-portal-layout-redesign-design.md) — sibling reskin; teacher portal is not in this change.
- [`2026-07-11-admin-help-explain-screen-design.md`](2026-07-11-admin-help-explain-screen-design.md) and [`2026-07-11-admin-help-explain-all-sidebar-screens-design.md`](2026-07-11-admin-help-explain-all-sidebar-screens-design.md) — tour contract. Anchors survive; copy and several start-paths change in the same delivery.
- `src/components/dashboard/AdminDashboardShell.tsx`, `AdminSidebar.tsx`, `AdminChromeHeader.tsx`, `adminSidebarNavGroups.tsx`, `AdminHubHome.tsx`, `src/lib/admin-tutorials/*`, `src/dictionaries/{en,es,pt}.json`

## Intent

An administrator opens the portal to run the institute today: find a student, assign a section, take a payment, read a message, process a web registration. The current admin chrome treats nineteen destinations as equals, puts the brand in a full-width light header, and opens on a uniform metric grid titled “Resumen”.

This spec reskins the admin shell to match the approved operations layout, shortens the daily menu to the work of the morning, and puts everything else behind one **Instituto** hub. No route is deleted. No database migration.

## Context

### What an admin sees today

`AdminDashboardShell` renders a sticky light header (logo, tagline, teacher-portal button, public site, sign-out, locale) across the full viewport, then a max-width row of a light card sidebar plus a bordered white content column. `buildAdminSidebarNavGroups` lists eight groups: institution home, people, academic, finance, communications, site, data, help. `AdminHubHome` shows the dictionary title “Resumen”, an optional students-without-section banner that links to `/users`, a three-column metric grid (traffic, users, payments, registrations, messages), and birthdays underneath.

`/admin/users` is one directory for every role (`student`, `parent`, `teacher`, `admin`, `assistant`) with a role filter. Create and CSV import live under that layout. Parents already appear on the student profile as tutors.

Explain-home is the only chrome-and-content tour. Its sidebar step names “usuarios, inscripciones, pagos, sitio público, configuración y más”. Create-student / create-teacher / create-admin task tours say “abrí Usuarios”.

### Why it fails

1. **Daily work and setup share a menu.** Analytics, glossary, site setup, coupons and the public CMS sit at the same weight as students and payments.
2. **“Usuarios” is a database noun.** The job is “this student” or “this teacher”. Parents are found from the child, not from a third directory item.
3. **The chrome is a light toolbar, not a workplace.** The mockup — and Teach ’n Go, Jackrabbit and Shopify — put the brand and the daily list in a persistent dark rail, and keep the header for workspace switch and utilities.
4. **Home reports a title, not a person.** The first line should greet the admin and surface unfinished work, then offer occasional growth actions without putting those actions in the daily list.
5. **Tours teach the old map.** Leaving anchors in place while the labels and grouping move is worse than no tour.

### Closest products

Language-school and class-business admins (Teach ’n Go, Jackrabbit Class, Enrollsy) keep a short noun list (students, teachers, classes, payments, messages) and send settings to a hub, a gear, or the profile. Shopify’s Settings overlay is the hub pattern: one door, grouped rows, children do not re-enter the primary nav. K-12 ERPs (Lirmi, Napsis) split the product into workspaces; that fits specialised roles, not one institute admin. This spec follows Teach ’n Go + Shopify, not a second “Gestión” mode.

## Decisions

| Topic | Choice |
|-------|--------|
| Scope | Full admin reskin: shell, daily menu, Instituto hub, Home, student/teacher lists, tours. Teacher portal unchanged |
| Daily sidebar | **Home**, **Alumnos**, **Profesores**, **Inscripciones web**, **Cohortes y secciones**, **Finanzas**, **Mensajes**, **Instituto** |
| Home label | The word **Home** in `es`, `en` and `pt` for the menu item and the document title (`buildPageMetadata`). The visible page heading is the greeting, not the word Home |
| Parents | No menu item. Visible from the student profile (existing tutors). Search a loose parent via command palette or Todas las cuentas |
| Secondary door | One **Instituto** hub page. Not an accordion, not a second workspace, not a profile-only dump |
| Settings vs extras | One hub with four groups (below). Jackrabbit’s gear+Module split is not used |
| People routes | `/admin/students` (role locked to `student`), `/admin/teachers` (role locked to `teacher`). `/admin/users` stays as **Todas las cuentas** |
| Create / import | Same screens as today. Alumnos opens create with `role=student` and owns CSV import. Profesores opens create with `role=teacher`. Admin/parent/assistant create from Todas las cuentas |
| Shell | Full-height sidebar left; header + content on the right. Content sits on muted gray; metric cards are white. No inner bordered page card |
| Sidebar colour | **Light workplace rail** (`--color-background` + `--color-foreground`), active item in a primary wash. Secondary is never the rail. Same light shell on teacher rail and mobile drawers. Workspace switch stays on primary. **Impulsa** lives only on Home (`--color-secondary` + `--color-secondary-foreground`). It is not in the sidebar or mobile drawer. |
| Teacher switch | Segmented **ADMIN / ÁREA DOCENTE** only when `teacherPortalAllowed`. It is the only teacher-portal control. The extra “Panel docente” header button is removed |
| Header utilities | Tagline, public site, sign-out, locale, existing command palette. No campus photograph (no brand asset) |
| Bell | Dropdown of the two counts the layout already loads (recent inbound messages, new registrations). No notification store. Hidden badge when both are zero |
| Profile | Below the logo: large avatar, display name and role. Kebab: **Mi perfil**, locale, sign-out. Institute settings do not live here |
| Breadcrumbs | Daily destinations: none. Instituto children: `Instituto → {page}`. `AdminBreadcrumb` as a global trail is removed |
| Home greeting | `Hola, {name}` using the existing profile display-name helper. If the name is empty, `Hola` alone. Not gendered “Bienvenida” |
| Home cards | Traffic (existing 30-day totals + week trend, **no sparkline** — the hub loader has no daily series and this spec does not add an RPC), accounts (all roles, primary link **Alumnos**), payments, registrations, messages, birthdays on the side |
| Students-without-section banner | Stays; links to **Alumnos**, not `/users` |
| Growth banner | **Impulsa tu instituto**: create-or-list event, new promotion, publish blog if `blog_enabled`. Existing routes only |
| Bell / palette / old URLs | Palette lists every destination including those that left the sidebar. Old `/admin/users` and every current href keep working |
| Tours | Copy and start paths updated in `es`/`en`/`pt`. Existing `data-tour` values are relocated, not deleted. New anchors only for Instituto, the growth banner, the bell and the profile footer |
| Database | No migrations |

### Daily menu (exact)

Order is fixed:

1. Home → `/[locale]/dashboard/admin`
2. Alumnos → `/[locale]/dashboard/admin/students`
3. Profesores → `/[locale]/dashboard/admin/teachers`
4. Inscripciones web → `/[locale]/dashboard/admin/registrations`
5. Cohortes y secciones → `/[locale]/dashboard/admin/academic`
6. Finanzas → `/[locale]/dashboard/admin/finance` (keep today’s cohort-aware query-string behaviour)
7. Mensajes → `/[locale]/dashboard/admin/messages` (badge = recent inbound)
8. Instituto → `/[locale]/dashboard/admin/institute`

No group headings on the daily list. Registrations keep their new-count badge.

### Instituto hub groups (exact)

Rendered as grouped rows (title, one-line purpose, chevron). No new pages behind a row except the hub itself.

**Académico** — Calendario maestro, Eventos, Contenidos académicos, Logros

**Crecimiento** — Cupones, Promociones, Blog (`blog_enabled` only)

**Sitio** — Sitio público, Puesta en marcha, Configuración del instituto, Todas las cuentas (`/admin/users`)

**Datos y ayuda** — Analítica, Auditoría, Glosario, Plantillas de email (mega-admin allowlist only)

While any of those destinations (or a child such as `/events/[id]`, `/users/[id]` for non-student/non-teacher) is open, the sidebar marks **Instituto** active. The page header shows `Instituto → {label}`.

### Active item on a person record

`/admin/users/[userId]` is unchanged. The sidebar highlight is **not** longest-prefix:

- `student` → Alumnos
- `teacher` → Profesores
- any other role → Instituto (Todas las cuentas)

`isAdminSidebarNavItemActive` must learn this exception; path prefix alone is wrong.

## Architecture

No new backend resource. Flags already in the admin layout (`teacherPortalAllowed`, `blog_enabled`, email-templates mega-admin, `siteSetupRequired`, the two badges) keep their meaning.

### Shell

`AdminDashboardShell` becomes: dark `AdminSidebar` (full viewport height, logo at top, daily nav, Instituto, profile footer) + column (`AdminChromeHeader` without the logo, then children on `--color-muted`). `siteSetupRequired` still hides the sidebar and the teacher switch.

`AdminMobileDrawer` renders the same daily list and Instituto, dark, via the existing hamburger. No persistent mobile sidebar.

`AdminChromeHeader` loses the logo, the teaching badge-as-advert, and the second teacher button. It gains the ADMIN / ÁREA DOCENTE control (teacher control keeps `data-tour="admin-chrome-teacher-portal"`) and the bell (`data-tour` new, optional in the home tour). Locale and sign-out keep their current tour ids.

The layout must load the admin’s display name and avatar for the footer and the Home greeting. Today it only reads `profiles.role`.

### People lists

`/admin/students` and `/admin/teachers` reuse `loadPaginatedAdminUsers` / `AdminUsersScreen` with the role argument forced and the role filter control hidden or disabled. Subnav: list + add. Import appears only on Alumnos and keeps `/admin/users/import`. Add links to `/admin/users/new?role=student` or `?role=teacher`. The create form honours that query. `/admin/users` remains the unfiltered directory (Instituto → Todas las cuentas) with today’s subnav (list, add, import).

### Home

`AdminHubHome` reads the greeting name from the layout (or a thin extra select). Banner, cards and birthdays stay on `loadAdminHubSummary` and `loadDashboardBirthdaysCard`. The users card still shows `byRole`; its `href` becomes `/students`. Traffic still deep-links to `/analytics`. The growth banner is a presentational strip with three links; omit the blog button when blog is off; omit the whole strip only if every destination is unavailable (blog off does not hide event or promotion).

### Command palette and glossary

Palette entries include Instituto, Alumnos, Profesores, Todas las cuentas, and every hub child. Glossary / help-catalog labels that repeat the old eight-group sidebar are rewritten to the daily list + Instituto. `adminNavLucideIcons` and tour icon maps gain keys for the new items; they do not keep dead “Resumen”/“Usuarios” as the live labels.

### Tours

| Tour | Change |
|------|--------|
| Explain Home | Rewrite sidebar, chrome (logo in rail, switch not “Panel docente”), title = greeting, banner → Alumnos, accounts card not “Usuarios”. Add Instituto. Optional steps: growth banner, bell, profile footer. Filter-for-DOM stays |
| Explain `/students`, `/teachers` | New content-only tours, same shape as today’s users tour, copy names the locked role. `/users` tour stays for Todas las cuentas |
| Explain Instituto | New content-only tour over the four groups |
| Explain hub children | One sentence: reached via Instituto, not the daily list. Anchors unchanged |
| create-student / import | Start at Alumnos. `admin-nav-users` moves to the Alumnos item (same id, new node) |
| create-teacher | Start at Profesores |
| create-admin | Start at Todas las cuentas (`/users/new`) |
| E2E / staleness | `adminScreenPath`, `listTourRuntimeChecks`, glossary tests and locale-parity tests updated in the same change. A tour that names a destination no longer in the daily sidebar fails the suite |

`admin-home` remains the only `chrome-and-content` tour.

## Error handling and flags

- Initial site setup: sidebar and Instituto hidden, as today.
- `teacherPortalAllowed === false`: no segmented switch.
- `blog_enabled === false`: no Blog row, no “Publicar en el blog”.
- Non-mega-admin: no email-templates row.
- Bell with both counts zero: no badge; menu can still open and say there is nothing waiting.
- Deep links to `/users`, `/analytics`, `/glossary`, etc. never 404.
- Missing display name: greeting is `Hola`; footer still shows role.

## Testing

TDD. Self-contained per `.cursor/rules/30-harness-self-contained-tests.mdc`. Locale parity for `es`/`en`/`pt`.

1. **Daily list invariant** — `buildAdminSidebarNavGroups` (or its replacement) returns exactly the eight hrefs above, in that order. Inscripciones keeps the new-registration badge; Mensajes keeps the recent-inbound badge. No secondary destination appears in the primary list.
2. **Instituto hub inventory** — the hub render function lists every destination that left the sidebar, including Todas las cuentas, and omits Blog / email templates when their flags are false.
3. **Role lock** — students loader is called with `role=student` only; teachers with `role=teacher`; `/users` still accepts any role.
4. **Home** — greeting uses the display name; banner `href` is Alumnos; users card `href` is Alumnos; no sparkline node.
5. **Active nav** — student detail highlights Alumnos; teacher detail highlights Profesores; parent/admin detail highlights Instituto; `/events` highlights Instituto.
6. **Teacher switch** — present iff `teacherPortalAllowed`; `admin-chrome-teacher-portal` still exists in that case; no second teacher button.
7. **Tour anchors** — `admin-sidebar`, `admin-nav-users` (on Alumnos), `admin-nav-academic`, `admin-chrome-teacher-portal`, `admin-chrome-back-to-site`, `admin-chrome-sign-out`, `admin-chrome-locale`, and the hub card anchors still exist. Home explain copy does not contain the words that named the old dump (“Usuarios” as a sidebar destination, “configuración y más” as a daily grab-bag).
8. **Locale parity** — the three dictionaries stay structurally identical. The Home visible label is `Home` in all three.
9. **No href deleted** — every pre-change admin suffix in `ADMIN_CONTENT_ROUTES` still resolves.

## Done when

1. Desktop admin chrome is a dark brand-token sidebar + right-hand header, on every admin page except the initial setup wizard.
2. The daily sidebar is exactly the eight items in Decisions, with profile in the footer.
3. Instituto is a hub; its children do not appear in the daily list; `Instituto → {page}` is the only trail.
4. Alumnos and Profesores are locked lists; Todas las cuentas is `/users` inside Instituto; parents are not a menu item.
5. Home greets the admin, the unsectioned-students banner goes to Alumnos, cards match the approved set, Impulsa uses existing routes.
6. Bell only surfaces the two existing counts.
7. Command palette still reaches every former sidebar destination.
8. All three locales updated. Every tour that mentioned the old menu or “Usuarios” as the daily door is rewritten and still passes runtime/E2E checks.
9. Teacher portal uses the same chrome geometry (dark full-height rail + header on the right + muted canvas). Teacher destinations stay the current teacher list.
10. Home cards, switch, Impulsa and sidebar icons match the mockup’s scale (large greeting, pill switch, 12-col card grid, dark Impulsa with icons). No campus photo and no traffic sparkline.

## Amendment (2026-08-21 afternoon)

User review of the first cut vs the approved mockup:

- **Teacher chrome** is in scope: same layout as admin. Teacher IA (sections, calendar, academics, messages) is unchanged.
- **Visual scale** must follow the mockup: large greeting, large card icons, pill ADMIN / ÁREA DOCENTE on the left of the header with the tagline under it, Impulsa as a dark brand banner with icon buttons, birthdays on the right column.
- Still out: campus photograph, 19-item grouped admin sidebar, gendered “Bienvenida”, extra “Panel docente” button.
- Home traffic chart uses the existing `admin_traffic_daily_stacked` series (30 days). No new RPC.

## Out of scope

- IA of the teacher, parent or student portals (teacher **chrome** is in scope).
- A notification inbox, email digest, or persisted “alerts” table.
- Decorative campus / building photography.
- A Padres list, a Personal list, or merging parents into the Alumnos table.
- Merging `/admin/settings` with `/admin/site-setup`.
- A traffic sparkline or a new analytics RPC.
- Changing what any admin page **does** beyond chrome, entry path, default role filter, greeting and tour copy.
- Replacing the command palette or the Help FAB.

## Manual QA

Owned by the user per `.cursor/rules/32-manual-qa-user-owned.mdc`.

1. Log in as admin on a laptop. The first visible nav item is Home. Instituto is last, above the profile.
2. Open Instituto and walk every group. Blog appears only if enabled. Email templates only if mega-admin.
3. Open Alumnos: only students. Open Profesores: only teachers. Open Todas las cuentas: mixed roles.
4. Open a student profile: Alumnos is active. Open a parent profile: Instituto is active.
5. If the account can teach, the header switch opens the teacher portal; if not, the switch is absent.
6. Home: greeting, banner (if any) → Alumnos, Impulsa links work.
7. Run “Explícame esta pantalla” on Home, Alumnos, Instituto and Eventos. No step points at a control that is gone or names Usuarios as a sidebar item.
8. Switch `en` and `pt`: Home stays the word Home; groups on Instituto are translated.
9. Phone: hamburger opens the same daily list, dark.
