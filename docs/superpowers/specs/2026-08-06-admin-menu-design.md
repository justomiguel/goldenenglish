# An admin menu you can scan

**Date:** 2026-08-06
**Status:** Approved
**Program:** [`2026-08-06-usability-audit-program.md`](2026-08-06-usability-audit-program.md) — spec 5 of 8
**Closes:** F06, F07, F14, and the admin half of F04
**Depends on:** spec 4 (page titles) — this spec applies its `buildPageMetadata` helper
**Related:** `src/components/dashboard/adminSidebarNavGroups.tsx`,
`src/components/dashboard/AdminSidebarNavContent.tsx`,
`src/components/dashboard/AdminChromeHeader.tsx`, `src/dictionaries/{en,es,pt}.json`

## Intent

The admin menu has nineteen destinations. Seven of them sit under no heading at all, four
have names you cannot tell apart, several open a page whose title is a different word, and
before you reach any of it you scroll past a card advertising a link that is already in the
header twice.

## Context

### F14 — the menu starts 427 px down

`AdminSidebarNavContent.tsx:185` renders `TeacherSwitchCard` above every nav group: a
bordered card with a hint line, a second hint paragraph and a full-width call to action.

That destination is **already in the header twice**. `AdminChromeHeader.tsx:93` renders a
labelled teacher-portal link for desktop, and `AdminChromeHeader.tsx:81` renders the same
link as an icon for mobile, both behind the same `teacherPortalAllowed` flag the card uses.
The card is a third copy of one link, and it is the reason the first menu item sits below
the fold on a laptop.

Deleting it costs nothing: the action survives in the header on both breakpoints, including
inside the mobile drawer, which renders this same nav content beneath that same header.

### F06 — seven orphans

Three groups in `buildAdminSidebarNavGroups` pass `label: null`:

- one holding `Finanzas` alone
- one holding `Analítica`, `Auditoría`, `Contenido y temas`, `Configuración del sitio`,
  `Configuración` and `Mi perfil`

Seven of nineteen items, unheaded, the second cluster reading as a junk drawer at the
bottom of the menu.

### F07 — four names, two collisions

| Route | Menu label today |
|-------|------------------|
| `/admin/academic/contents` | Contenidos |
| `/admin/cms` | Contenido y temas |
| `/admin/site-setup` | Configuración del sitio |
| `/admin/settings` | Configuración |

Two pairs that differ only by a qualifier, in a menu where they are not adjacent, so you
cannot even compare them without scrolling.

### F04 — the label is not what the page calls itself

| Menu label | Page heading |
|------------|--------------|
| Resumen | Panel de administración |
| Hub académico | Cohortes y secciones |
| Contenido y temas | Gestión del sitio público |
| Configuración del sitio | Configuración del instituto |
| Inscripciones | Inscripciones web |
| Analítica | *(no heading at all)* |

## Decisions

| Topic | Choice |
|-------|--------|
| The teacher card | Deleted from the sidebar. The header keeps the link |
| Orphan groups | None. Every item sits under a heading |
| Group count | Eight, down from nine, by merging rather than adding |
| One destination, one name | The menu label, the `h1` and the tab title all read from a single dictionary key |
| Naming collisions | Resolved by making each name say what the thing is, not what kind of thing it is |
| Titles | Applied with spec 4's `buildPageMetadata` |

### The grouping

| Group | Items |
|-------|-------|
| Institución (administración) | Resumen |
| Personas | Usuarios, Inscripciones web, Eventos |
| Académico | Cohortes y secciones, Calendario maestro, Contenidos académicos, Logros |
| **Finanzas** | Finanzas, Cupones, Promociones |
| Comunicación | Mensajes, Plantillas de email, Blog |
| **Sitio y configuración** | Sitio público, Puesta en marcha, Configuración del instituto |
| **Datos** | Analítica, Auditoría |
| **Ayuda y cuenta** | Glosario de términos, Mi perfil |

"Marketing" disappears as a heading and its two items join Finanzas, because coupons and
promotions exist to change what a family pays. That puts every money screen in one place
and reduces the number of headings instead of inventing more.

### The names

| Route | Was (menu / heading) | Becomes, everywhere |
|-------|----------------------|---------------------|
| `/admin` | Resumen / Panel de administración | **Resumen** |
| `/admin/academic` | Hub académico / Cohortes y secciones | **Cohortes y secciones** |
| `/admin/academic/contents` | Contenidos | **Contenidos académicos** |
| `/admin/cms` | Contenido y temas / Gestión del sitio público | **Sitio público** |
| `/admin/registrations` | Inscripciones / Inscripciones web | **Inscripciones web** |
| `/admin/analytics` | Analítica / *(none)* | **Analítica**, and the page gains an `h1` |

"Hub académico" goes because "hub" is not a word this audience uses, and because
"Cohortes y secciones" already says exactly what is behind the link. Each collision is
broken by qualifying the vaguer of the pair: academic contents against the public site,
and the setup wizard against the institute's settings.

**`/admin/site-setup` and `/admin/settings` are deliberately left for the implementer to
resolve** — the audit recorded `site-setup`'s heading as "Configuración del instituto",
which is what `/admin/settings` sounds like it should be, and the two cannot be named
correctly without reading both pages. The rule to apply: name each for what it does, make
one of them clearly the first-run wizard if that is what it is, and report the choice with
the evidence. Do not ship two names that differ only by a qualifier.

## Architecture

- `adminSidebarNavGroups.tsx` — regrouped. No item is added or removed, and no `href`
  changes. Only group membership, group labels and item labels move.
- `AdminSidebarNavContent.tsx` — `TeacherSwitchCard` and its `teacherNav` plumbing removed
  from the sidebar. Check every caller: `AdminSidebar` and `AdminMobileDrawer` both pass
  `teacherNav` down, and `AdminDashboardShell` sources it. Remove the prop through the
  chain rather than leaving it accepted and ignored.
- Dictionaries — group labels and the renamed items in `es`, `en` and `pt`. Renaming reuses
  existing keys where the key name still fits; where a key name would become misleading,
  rename the key too, and update every reference.
- The six pages above — heading reads the same key as its menu item; `/admin/analytics`
  gains an `h1`; each gets `generateMetadata` via `buildPageMetadata`.

The tour depends on this menu. `adminSidebarNavGroups.tsx` sets `tourId: "admin-nav-users"`
and `"admin-nav-academic"`, and `AdminChromeHeader` carries
`data-tour="admin-chrome-teacher-portal"`. **Every `data-tour` anchor must survive.** Tour
step copy that describes the old grouping or the deleted card has to be updated in the same
change; a tour that points at something no longer there is worse than no tour.

## Testing

TDD. Self-contained per `.cursor/rules/30-harness-self-contained-tests.mdc`.

1. **No orphan groups** — every group returned by `buildAdminSidebarNavGroups` has a
   non-null label. This is F06 expressed as an invariant, and it fails today.
2. **No near-duplicate names** — no two items in the menu have labels where one is a prefix
   of the other, or which differ only by a trailing qualifier. Assert over all three
   locales. This is F07 as an invariant and is what stops it recurring.
3. **Every destination survives** — the set of `href`s before and after the regrouping is
   identical. This is the safety net for a change that moves a lot of lines.
4. **Label matches heading** — for the six renamed routes, the menu label and the page's
   heading resolve to the same dictionary key.
5. **The teacher card is gone but the link is not** — `AdminSidebarNavContent` renders no
   link to the teacher portal; `AdminChromeHeader` still renders it for desktop and mobile
   when `teacherPortalAllowed`, and does not when it is false.
6. **Tour anchors intact** — `admin-nav-users`, `admin-nav-academic` and
   `admin-chrome-teacher-portal` are all still present.
7. **Locale parity** — the three dictionaries stay structurally identical.

## Done when

1. Every menu item is under a heading.
2. No two destinations have confusable names.
3. The first menu item is near the top of the sidebar, not below the fold.
4. Menu label, page heading and tab title agree for every renamed route.
5. `/admin/analytics` has an `h1`.
6. The teacher portal is still reachable in one click on desktop and on mobile.
7. No route changes. No `href` changes. Nothing is removed from the menu.
8. All three locales updated, and no tour step points at something that no longer exists.

## Out of scope

- Changing what any admin page does. This spec moves and renames links and headings.
- The remaining twelve admin pages' tab titles, beyond the six touched here. Mechanical
  follow-up, and better done once these names have settled.
- Breadcrumb consistency, which is F20 and lives in spec 4b.
- Reordering items within a group.

## Manual QA

Owned by the user per `.cursor/rules/32-manual-qa-user-owned.mdc`.

1. Log in as admin on a laptop. The first menu item is visible without scrolling.
2. Read the menu top to bottom: every item is under a heading, and no two read alike.
3. Open each renamed destination and confirm the page calls itself what the menu called it.
4. Confirm the teacher portal link still works from the header, on desktop and on a phone.
5. Run the admin tour and confirm no step points at the removed card.
6. Switch to English and Portuguese and confirm the new group headings are translated.
