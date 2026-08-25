# Mini 02 — Instituto tile hub

**Parent:** [`../2026-08-21-admin-surface-language-design.md`](../2026-08-21-admin-surface-language-design.md)
**Needs:** Mini 00

## Intent

Instituto is the second Home: grouped tiles with the same large icons, not a settings dump of chevron rows.

## Done when

- Hub page uses `AdminPageHeader` with `iconId="institute"`.
- Each group is still Académico / Crecimiento / Sitio / Datos y ayuda.
- Each row is a tile: 56px icon, label, tip. Grid `sm:grid-cols-2 xl:grid-cols-3`.
- Builder adds `iconId` per row from the umbrella map.
- Blog and email-templates gating unchanged.
- `data-tour="admin-institute-hub"` stays on the page root.

## Out of scope

Restyling the child pages (Mini 07). Changing hrefs.

## Files

- Modify: `src/lib/dashboard/buildAdminInstituteHubGroups.ts`
- Modify: `src/components/dashboard/AdminInstituteHub.tsx`
- Modify: `src/app/[locale]/dashboard/admin/institute/page.tsx`
- Modify: `src/__tests__/lib/dashboard/buildAdminInstituteHubGroups.test.ts` (or create if missing)
