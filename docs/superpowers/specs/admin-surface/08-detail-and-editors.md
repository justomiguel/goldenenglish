# Mini 08 — Detail pages and leftover editors

**Parent:** [`../2026-08-21-admin-surface-language-design.md`](../2026-08-21-admin-surface-language-design.md)
**Needs:** Minis 03–07

## Intent

Sweep remaining admin `h1` elements that still use `--color-secondary` or the old `text-2xl` title: user ficha, event detail, CMS/theme/landing editors, student billing header, leftover requests/retention if they still render a title.

## Done when

```
rg 'h1[^\n]*--color-secondary' src/app/\\[locale\\]/dashboard/admin src/components/dashboard src/components/organisms src/components/desktop/organisms --glob '*.tsx'
```

returns no admin page titles. Detail pages may use `AdminPageHeader` without an icon, or with the parent destination icon. Editors keep their preview/canvas; only the page title row changes.

## Out of scope

Public/event landing titles. Parent/student/teacher portals. Message **body** prose that styles `h1` inside HTML.

## Files (indicative)

- `AdminUserIdentityHero.tsx` (name is a person, not a page title — keep as identity; do not force primary if the ficha already treats it as a name)
- `src/app/.../admin/events/[eventId]/page.tsx`
- `src/app/.../admin/users/[userId]/page.tsx` and `.../billing/page.tsx`
- CMS shells under `src/components/dashboard/admin/cms/`
- `src/app/.../admin/requests/page.tsx`, `retention/page.tsx` if present
