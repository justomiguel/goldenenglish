# Mini 01 — Drawer icons

**Parent:** [`../2026-08-21-admin-surface-language-design.md`](../2026-08-21-admin-surface-language-design.md)
**Needs:** Mini 00

## Intent

The daily rail uses the shared icon map at `h-6 w-6`. The active item puts the icon in a 36px white/15 tile so the drawer feels as large as Home’s tiles, not a 2018 icon list.

## Done when

- `buildAdminDailyNavItems` stores `iconId` (not an inline React node) for the eight daily items.
- `AdminSidebarNavContent` renders `adminSurfaceIcon(iconId, "h-6 w-6")`.
- Active dark-tone items wrap the icon in `flex h-9 w-9 items-center justify-center rounded-xl bg-white/15`.
- Existing href, badge, tip and `data-tour` tests still pass.
- Mobile drawer inherits the same renderer (no second icon set).

## Out of scope

Page headers. Instituto hub. Changing item order or labels.

## Files

- Modify: `src/lib/dashboard/buildAdminDailyNavItems.tsx` (iconId instead of icon node; file may become `.ts`)
- Modify: `src/components/dashboard/AdminSidebarNavContent.tsx`
- Modify: `src/__tests__/lib/dashboard/buildAdminDailyNavItems.test.ts`
