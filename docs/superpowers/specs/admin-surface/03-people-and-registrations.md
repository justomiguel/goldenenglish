# Mini 03 — People and registrations

**Parent:** [`../2026-08-21-admin-surface-language-design.md`](../2026-08-21-admin-surface-language-design.md)
**Needs:** Mini 00

## Intent

The three people directories and web registrations open like Home: large primary title + matching drawer icon. List chrome on registrations matches people (KPI row, search + primary Export, white table card, primary actions). Filters, accept/edit/delete flows, and loaders stay.

## Done when

These pages use `AdminPageHeader`. People and registrations share the same list chrome:

| Route | iconId | Title source |
|-------|--------|--------------|
| `/admin/students` | `students` | `adminNav.students` |
| `/admin/teachers` | `teachers` | `adminNav.teachers` |
| `/admin/users` | `allAccounts` | `adminNav.allAccounts` |
| `/admin/users/new` | parent icon from `?role=` or `allAccounts` | existing create title |
| `/admin/users/import` | `students` | existing import title |
| `/admin/registrations` | `registrations` | `adminNav.registrations` + `tipRegistrations` |

`/admin/registrations` also shows four KPI cards from the existing `statusCounts` (total / pending / contacted / enrolled). Active status chips, table action headers, and accept icons use primary — never `--color-secondary`.

Tour anchors on those titles (`usersTitle`, registrations title, etc.) move onto the header.

## Out of scope

User ficha (Mini 08). Changing `lockRole` or CSV behaviour. New RPCs for registration stats.

## Files

- `src/app/[locale]/dashboard/admin/students/page.tsx`
- `src/app/[locale]/dashboard/admin/teachers/page.tsx`
- `src/app/[locale]/dashboard/admin/users/page.tsx`
- `src/app/[locale]/dashboard/admin/users/new/page.tsx`
- `src/app/[locale]/dashboard/admin/users/import/page.tsx`
- `src/app/[locale]/dashboard/admin/registrations/page.tsx`
