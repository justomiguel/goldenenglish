# Public read of `site_settings.initial_site_setup` (RLS)

## Context

The marketing landing (`/[locale]`) must decide whether to show CMS-themed content or a minimal greenfield shell while initial setup is incomplete. `loadNeedsInitialSiteSetup` reads `site_settings` where `key = initial_site_setup`. Anonymous sessions previously could not read that row (`site_settings_select_public` only allowed `inscriptions_enabled`), so the flag was effectively always “missing” for anon clients — inconsistent with admin reads.

## Decisión

Ampliar `site_settings_select_public` para permitir `SELECT` de la fila `initial_site_setup` (solo estado `completedAt` / valor ya pensado como público de proceso).

## Opciones consideradas

- **RPC solo servidor**: más código y llamadas extra por visita.
- **Espejar estado en cookie/header**: frágil y duplica fuente de verdad.

## Consecuencias

- Visitantes pueden conocer si el alta inicial está pendiente (información operativa baja sensibilidad); no expone secretos.
- La home puede omitir `loadActiveTheme()` hasta que `completedAt` esté definido.
- Tests de políticas: revisión manual / aplicar migración en staging antes de prod.
