# Plantillas nav placement

## Intent

Remove Plantillas from each institute admin sidebar. Add Plantillas to the CentroListo owner sidebar.

## Done when

- `buildAdminDailyNavItems` no longer links to `/dashboard/admin/cms/templates`.
- A path under `/cms/templates` highlights Instituto.
- The owner rail links to `/{locale}/cuenta/plantillas`.
- That page shows the same catalog as `/{locale}/admin/plantillas`.
- Staff who open the owner URL go to `/{locale}/admin/plantillas`.

## Out of scope

- Deleting the institute CMS theme editor.
- Removing the CMS hub link to that editor.

## Surfaces (Web vs PWA)

Tier B institute admin stays desktop-only. CentroListo owner and staff share `PulsarPanelFrame`. One nav list covers the wide rail and the narrow sheet.
