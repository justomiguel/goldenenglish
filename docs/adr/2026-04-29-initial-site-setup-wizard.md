# Initial site setup wizard (`site_settings.initial_site_setup`)

## Context

Greenfield Supabase deployments should not depend on manual `seed.sql` for institute branding and contact data. Operators need a single guided path that persists identity into the active `site_themes` row and marks completion in `site_settings`.

## Decisión

- Store completion in `site_settings` key `initial_site_setup` (`value.completedAt` ISO string).
- Migration `088_initial_site_setup_site_settings.sql` backfills completed state for existing installs (users, customized theme `properties`, or `site_theme_media`).
- Admin layout gates every admin route through `loadNeedsInitialSiteSetup` + client redirect to `/setup/first-run`, unless `SKIP_INITIAL_SITE_SETUP=1`.
- Completion uploads logo/favicon to bucket `landing-media`, merges theme overrides via `cleanThemeOverridesForPersistence`, upserts `site_settings`, then `recordSystemAudit` + `recordUserEventServer` (`section:initial_site_setup`) + cache invalidation.

## Opciones descartadas

- Inferring “needs setup” only from empty theme rows — migrations already seed `site_themes`; signal must be explicit.
- Logo/favicon only as URLs pasted by admins — weaker onboarding than uploads aligned with Storage-backed branding.

## Consecuencias

- Tests: `parseInitialSiteSetupRecord`, `completeInitialSiteSetupInputSchema` (Vitest).
- Follow-up: endurecer bootstrap en Internet público (rate limit, `FIRST_RUN_SETUP_SECRET`, o captcha) si el endpoint queda expuesto más allá de redes cerradas.

## Bootstrap de la primera cuenta admin (089 + `/setup/first-run`)

Cuando **no existe ningún** `profiles.role = admin` y el setup del sitio sigue pendiente, la ruta pública **`/[locale]/setup/first-run`** muestra primero el formulario `BootstrapAdminForm`, que crea el usuario vía **service role** con `provisioning_source: bootstrap_wizard` y `role: admin` (trigger `handle_new_user` ampliado en migración **089**). Después el cliente hace **sign-in** y continúa el mismo URL en modo **site wizard**. El gate del layout admin redirige a este path; `/dashboard/admin/site-setup` redirige al mismo canonical.
