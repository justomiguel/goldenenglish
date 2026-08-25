# Mini 01 — Editors and wizard titles

**Parent:** [`../2026-08-22-admin-experience-unification-design.md`](../2026-08-22-admin-experience-unification-design.md)
**Needs:** Mini 00

## Intent

CMS / blog / site-setup open like every other admin page: the banner, then the existing canvas or steps.

## Done when

These shells render `AdminPageHeader` (icon `cms`, `blog`, or `siteSetup`) instead of a raw `h1`:

- `SiteThemeEditorShell.tsx`
- `SiteThemeRawEditorShell.tsx`
- `LandingEditorOverview.tsx`
- `LandingSectionEditorShell.tsx`
- `HeroVisualEditorShellTop.tsx`
- `SiteSetupWizard.tsx`
- `BootstrapAdminForm.tsx`
- `BlogArticleEditor.tsx` — title = existing `list.create` when no `articleId`, `list.title` when editing. Pass those two strings in from the page; do not add dictionary keys.

Existing `data-tour` on those title rows moves onto the header. Preview/canvas/step bodies stay.

Grep in those files: no `<h1`.

## Out of scope

Rewriting theme tokens, landing blocks, or wizard steps.

## Files

The eight shells above, plus `src/app/[locale]/dashboard/admin/cms/blog/new/page.tsx` and `.../cms/blog/[id]/edit/page.tsx` if they must pass list copy into the editor.
