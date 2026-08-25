# Admin surface language

**Date:** 2026-08-21
**Status:** Approved to execute sequentially (user traveling; asked for one umbrella spec + minis, then follow them one by one)
**Kind:** Umbrella. Child minis live in [`admin-surface/`](admin-surface/).

**Depends on:** [`2026-08-21-admin-ops-reskin-design.md`](2026-08-21-admin-ops-reskin-design.md) — chrome, daily drawer, Instituto hub inventory, Home cards. This spec does **not** reopen those IA decisions.

**Plan:** [`../plans/2026-08-21-admin-surface-language.md`](../plans/2026-08-21-admin-surface-language.md)

## Intent

An admin who just left Home should still be in the same product. Today they are not: Home uses a large primary display title, generous cards and 24–64px icons; every other admin destination uses a small `h1` in `--color-secondary` (the accent red) and 16px chrome. The drawer is already large and modern. The pages must speak that language.

This is a **visual language rebump**, not a second information-architecture pass. Routes, loaders, filters, forms and tours stay. What changes is how a page introduces itself and how its icons sit next to the drawer.

## Why a family of minis

There are ~60 admin routes. One dump that restyles them all in a single PR is unreviewable. The umbrella locks the language. Each mini applies that language to a closed set of screens and is independently shippable.

Execute in the order listed under [Waves](#waves). Do not start mini N+1 until mini N meets its Done when. Do not invent a new header pattern inside a later mini.

## Approaches considered

1. **Shared kit, then apply page by page (chosen).** One `AdminPageHeader`, one icon map, one card chrome. Drawer and Instituto consume the same icons. Later minis only swap headings.
2. Restyle each page independently. Faster first screenshot, then ten slightly different headers.
3. Token-only CSS (`h1 { color: primary }`). Titles get less red, but Instituto stays a text list and the drawer stays 20px.

## Decisions

| Topic | Choice |
|-------|--------|
| Page title | Same as Home: `font-display text-3xl font-bold tracking-tight text-[var(--color-primary)] md:text-[2.5rem]` |
| Title colour | **Primary only.** `--color-secondary` is never an admin page `h1` / hero title |
| Lead | `mt-2 max-w-2xl text-base text-[var(--color-muted-foreground)]` |
| Header shell | Tinted rounded-3xl banner (primary wash + soft indigo), not a bare title row |
| Header icon | Optional 64×64 (`h-16 w-16`) **white** rounded-2xl tile, Lucide `h-8 w-8` `strokeWidth={1.25}` |
| Header art | Quiet primary geometry + a **per-sidebar-family** cutout (`/images/dashboard/admin-hero-{students,teachers,registrations,academic,finance,messages,institute}.webp`) on the right, slightly overlapping the banner edge. Instituto children reuse the closest family. No shared one-photo-for-all cutout. |
| Header actions | Under the title block inside the banner; existing buttons, no new CTAs |
| Content card | White (`--color-background`) on the muted shell, `rounded-2xl`, `border-border`, `shadow-soft`, padding `p-6` unless the page already has a denser table |
| Drawer icons | Same Lucide set as the page header. Size `h-6 w-6`. Active item wraps the icon in a `h-9 w-9` white/15 tile |
| Instituto hub | Tile grid per group (title + big icon + tip), not a stacked chevron list. Same four groups as the ops-reskin spec |
| Tables / forms / tabs | Keep. They sit under the new header. Do not rebuild `AdminUsersScreen`, finance tabs, or the message mailbox |
| Home | Reference, not a restyle target. Do not regress Impulsa or metric cards |
| Copy | No new product nouns. Existing `es` / `en` / `pt` titles and leads stay |
| Tours | Existing `data-tour` values move onto `AdminPageHeader`. Do not rename anchors |
| Data | No migrations, no new RPCs, no new routes |
| Teacher / parent / student content | Out of scope. Teacher chrome already matches admin; do not restyle teacher lesson IA |
| Commits | Do not commit until the user asks. Spec + plan + implementation land together |

## Shared primitives (Mini 00)

| Primitive | Responsibility |
|-----------|----------------|
| `adminSurfaceIcon(id, className?)` | One Lucide node per destination. Drawer, Instituto tiles and page headers call this. |
| `AdminPageHeader` | Title, optional lead, optional icon id, optional actions, optional `data-tour` |
| `AdminSurfaceCard` | Optional wrapper for a page body that is not already a specialised card |

Header markup (normative):

```tsx
<header data-tour={tourAnchor} className="relative overflow-hidden rounded-3xl …banner…">
  {art}
  <div className="relative z-[1] flex flex-col gap-5">
    <div className="flex min-w-0 items-center gap-4">
      {icon /* white 64×64 tile */}
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-primary)] md:text-[2.5rem]">{title}</h1>
        {lead ? <p className="mt-2 max-w-xl text-base text-[var(--color-muted-foreground)]">{lead}</p> : null}
      </div>
    </div>
    {actions}
  </div>
</header>
```

## Icon map (normative)

| id | Lucide | Used on |
|----|--------|---------|
| `home` | `Home` | Drawer |
| `students` | `GraduationCap` | Drawer, Alumnos |
| `teachers` | `School` | Drawer, Profesores |
| `registrations` | `ClipboardList` | Drawer, Inscripciones |
| `academic` | `CalendarDays` | Drawer, Cohortes |
| `finance` | `Banknote` | Drawer, Finanzas |
| `messages` | `MessageCircle` | Drawer, Mensajes |
| `institute` | `Building2` | Drawer, Instituto hub |
| `calendar` | `Calendar` | Instituto tile, calendar page |
| `events` | `CalendarRange` | Instituto tile, events |
| `contents` | `BookOpen` | Instituto tile, contents |
| `badges` | `Award` | Instituto tile, badges |
| `coupons` | `Ticket` | Instituto tile, coupons |
| `promotions` | `Percent` | Instituto tile, promotions |
| `blog` | `Newspaper` | Instituto tile, blog |
| `cms` | `LayoutTemplate` | Instituto tile, sitio público |
| `siteSetup` | `Rocket` | Instituto tile, puesta en marcha |
| `settings` | `Settings` | Instituto tile, settings |
| `allAccounts` | `Users` | Instituto tile, Todas las cuentas |
| `analytics` | `Activity` | Instituto tile, analytics |
| `audit` | `ScrollText` | Instituto tile, audit |
| `glossary` | `BookMarked` | Instituto tile, glossary |
| `emailTemplates` | `Mails` | Instituto tile, email templates |

Ids not in this table do not get a header icon. Detail pages (one user, one event, one message) use the parent destination icon or none.

## Waves

| Mini | File | Scope |
|------|------|-------|
| 00 | [`admin-surface/00-kit.md`](admin-surface/00-kit.md) | Primitives + tests |
| 01 | [`admin-surface/01-drawer.md`](admin-surface/01-drawer.md) | Daily rail + mobile drawer icons |
| 02 | [`admin-surface/02-institute-hub.md`](admin-surface/02-institute-hub.md) | Instituto tile hub |
| 03 | [`admin-surface/03-people-and-registrations.md`](admin-surface/03-people-and-registrations.md) | Alumnos, Profesores, Todas las cuentas, alta, import, Inscripciones |
| 04 | [`admin-surface/04-academic.md`](admin-surface/04-academic.md) | Cohortes hub + section/contents list headers |
| 05 | [`admin-surface/05-finance.md`](admin-surface/05-finance.md) | Finanzas hub + receipts headers |
| 06 | [`admin-surface/06-messages.md`](admin-surface/06-messages.md) | Inbox, compose, thread |
| 07 | [`admin-surface/07-institute-children.md`](admin-surface/07-institute-children.md) | Calendar, events, badges, coupons, promotions, blog, CMS hub, settings, analytics, audit, glossary, email templates, site-setup title |
| 08 | [`admin-surface/08-detail-and-editors.md`](admin-surface/08-detail-and-editors.md) | User ficha, event detail, CMS/theme editors, remaining `h1` secondary titles under `/admin` |

## Out of scope (umbrella)

- Changing what any screen **does**
- New destinations in the drawer
- Restyling Home metric cards or Impulsa
- Parent, student, or teacher **content** pages
- Public site, landing, register
- Using `--color-secondary` for “emphasis” on titles
- Rewriting tables into card galleries (lists stay lists)

## Done when (umbrella)

Every admin `h1` under `src/app/[locale]/dashboard/admin` uses `AdminPageHeader` (or the same title classes if a page is a wizard that cannot take the header). Grep for `h1` + `--color-secondary` in that tree returns nothing. Drawer icons are `h-6` and share `adminSurfaceIcon`. Instituto is a tile hub. Each mini’s Done when is true.

## Manual QA

Owned by the user.

1. Home still looks like today.
2. Click every daily drawer item: title is large and primary; the icon matches the drawer.
3. Instituto tiles open the same hrefs as today; Blog / email-templates gating unchanged.
4. Alumnos still lists only students. Filters and create still work.
5. Finanzas tabs and Mensajes mailbox still work.
6. Phone drawer shows the larger icons.
7. Tours that start on Alumnos / Instituto / Finanzas / Mensajes still find their title anchors.
