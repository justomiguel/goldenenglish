# Manual QA — section enrollment link (2026-08-08)

Human-only checks before and after applying migrations to each tenant database.
Implementers do **not** run `sql:apply-migration:all-tenants`; that is the repo owner’s call.

## On a real phone

1. As a teacher, open a section you lead → **Invitar familias** → **Crear link**.
2. Tap **Compartir** and confirm the native share sheet opens and offers WhatsApp (or the platform’s equivalent).
3. Send the link to yourself, open it outside the app, and confirm the branded registration surface loads with the fixed section card (no section dropdown).

## Per-tenant brand (rule 28)

With a live token, open `/[locale]/i/[token]` on each deployment and confirm the page wears that tenant’s chrome, not the classic layout:

- golden
- liora
- mimundo
- nago
- mozarthitos
- espaciozenit

## Inscriptions closed

1. Turn off `site_settings.inscriptions_enabled` (or the admin toggle that maps to it).
2. Confirm `/register` redirects or refuses public sign-ups as today.
3. Confirm the teacher’s enrollment link URL still loads the form and accepts a submission.

## Production databases

Apply, in order, on every tenant DB (owner only):

- `182_section_enrollment_links.sql`
- `186_section_enrollment_links_bulk_state.sql`
- `187_anon_privilege_hardening.sql`

Then smoke: generate → family submit → admin inbox shows **vía enlace** (or locale equivalent) → deactivate → old URL shows unavailable → rotate → new URL works, old does not.
