# Platform operator admin on every generated institute

## Intent

Every institute that this app generates gets one operator admin. The account is `justomiguelvargas@gmail.com`. The password lives in Pulsar `platform_settings.operator_admin_password`. Staff set it in the CentroListo panel. The value is not stored in git and is not sent back to the browser.

## Done when

- Shared-schema provision creates or updates that auth user and sets `profiles.role` to `admin` in the new schema.
- A project-mode save with a database URL does the same in `public`.
- A second run keeps the admin role and sets the password again, so the operator can always sign in with that password.
- The password is a query parameter. Logs do not print it. Source, tests, seeds, and docs do not contain the value. The panel does not display the saved password.
- Staff see `operator_admin_failed` with its own sentence in `en.json`, `es.json`, and `pt.json` when the project-mode seed fails. An unknown code stays visible as the raw code.
- `.cursor/rules/52-platform-operator-admin.mdc` states this procedure.
- `docs/runbooks/add-new-tenant.md` points at that rule.
- `supabase/seed_dev_admin.sql` uses the same email and reads `ge.operator_admin_password` from the session.
- Institute `matiss` exists as a shared-schema tenant. Template is `generic-idiomas`. The operator admin can sign in on that schema.

## Surfaces (Web vs PWA)

Tier B — desktop-only (no PWA tree).

The save screen is `src/app/[locale]/admin/tenants/new/page.tsx` and `PulsarAdminTenantForm`. There is no PWA twin. This change does not change the public CentroListo chrome.

## Out of scope

- A new `SiteThemeKind` or a Matiss landing.
- A new Vercel project.
- Changing the CentroListo staff password in `platform_staff`.
- Backfill of institutes that already exist, except the seed that runs when someone saves or provisions them again.
