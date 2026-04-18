# ADR · CMS — “Tema por defecto” como fila real de `site_themes`

## Contexto

Hasta esta iteración el grid del CMS (`/admin/cms/templates`) renderizaba un
card **virtual** llamado *Default theme* construido en el cliente a partir de
`system.properties` (helper `buildDefaultThemePresentation`). Ese card se
marcaba como “Activo” cuando ninguna fila de `site_themes` tenía
`is_active = true`, pero **no era editable**: no había `properties` ni
`content` ni `blocks` que respaldaran un override, así que un admin no podía
ajustar ni textos, ni tokens, ni hero, ni subsecciones del “tema por
defecto”. Eso rompía la promesa del CMS (“todo template se administra desde
acá”) y dejaba al equipo dependiendo de un cambio de código + redeploy
cualquier vez que quería retocar el contenido del estado base.

## Decisión

Convertir el “Tema por defecto” en una **fila real** de `public.site_themes`
con un nuevo flag `is_system_default boolean default false`:

1. Migración nueva `052_site_themes_system_default.sql`:
   - `ALTER TABLE … ADD COLUMN IF NOT EXISTS is_system_default boolean NOT NULL DEFAULT FALSE`.
   - Índice parcial `UNIQUE (is_system_default) WHERE is_system_default = TRUE`
     → como mucho **un** row puede ser el default del sistema.
   - Seed idempotente `INSERT … ON CONFLICT (slug) DO UPDATE SET is_system_default = TRUE`
     con `slug = 'default'`, `properties = '{}'`, `content = '{}'`,
     `blocks = '[]'`, `template_kind = 'classic'`. Si alguien ya tenía
     un row con `slug = 'default'`, lo promociona sin pisar overrides.
   - `UPDATE … SET is_active = TRUE WHERE is_system_default AND NOT EXISTS active`
     → si la base no tenía ningún tema activo, el default toma ese rol; el
     sitio público sigue pintando exactamente igual porque
     `properties/content/blocks` están vacíos y `loadEffectiveProperties()`
     hereda 1-a-1 desde `system.properties`.

2. Tipos: `SiteThemeRow.isSystemDefault: boolean` y `SYSTEM_DEFAULT_THEME_SLUG = 'default'`.
   Los tres loaders del CMS (`loadAdminSiteThemes`,
   `loadSiteThemeForEditor`, `loadSiteThemeForRawEditor`,
   `loadSiteThemeForLandingEditor`, `loadActiveTheme`) seleccionan y mapean
   el flag.

3. Guards en server actions:
   `archiveSiteThemeAction` rechaza con código estable
   `system_default_cannot_archive` cualquier intento de archivar el row
   `is_system_default = TRUE`. Activar / renombrar / duplicar / editar
   `properties` / `content` / `blocks` / `hero` siguen permitidos como en
   cualquier otro template — el default ya no es “especial” para edición,
   solo para borrado/archivado.

4. UI:
   - Eliminado `SiteThemeDefaultPreviewCard` virtual y `buildDefaultThemePresentation`.
   - El grid renderiza el row real con el mismo `SiteThemeTemplatePreviewCard`
     que el resto, agregando un badge **“Tema del sistema”** sobre el título
     y ocultando el botón **Archivar** cuando `row.isSystemDefault`.

5. i18n: nuevas claves
   `admin.cms.templates.preview.defaultBaseLabel` (renombrado conceptualmente
   a “Tema del sistema”) y `admin.cms.templates.errors.system_default_cannot_archive`
   en `en.json` + `es.json`. Las claves antiguas
   (`defaultName`, `defaultSlug`, `defaultDescription`) quedan eliminadas
   porque el row real ya expone su propio nombre y slug editables.

## Opciones consideradas

- **Mantener el default como virtual y exponer un editor especial que escriba
  `system.properties` desde la UI.** Descartado: `system.properties` es un
  artefacto de deploy versionado en git, escribirlo desde la app sería un
  side-effect tóxico (no atomicidad con el deploy, no historial,
  diverge entre entornos, complica el SSR).
- **Crear una tabla paralela `site_default_overrides` con un único row
  garantizado.** Descartado: duplica el modelo (`properties` / `content` /
  `blocks` ya viven en `site_themes`), exige acciones / loaders / RLS
  separados, y rompe la promesa del CMS de tratar todo template igual.
- **Dejar el card virtual en solo-lectura para siempre.** Es lo que había hoy;
  el requerimiento del producto pide explícitamente editar textos del default
  como cualquier otro tema.

## Consecuencias

Positivas:

- Un único modelo (`site_themes`) cubre **todos** los templates, incluido el
  default. Editor de tokens, properties raw, landing, hero y blocks reusan
  loaders y server actions existentes sin lógica condicional adicional.
- Borrado/archivado del fallback es **imposible** por SQL+server action, no
  por convención.
- El sitio público no cambia: con `properties = {}` / `content = {}` el row
  default produce exactamente el mismo render que antes.

Riesgos / follow-ups:

- Si alguien crea manualmente un row con `slug = 'default'` antes de la
  migración, el `ON CONFLICT (slug) DO UPDATE` lo promueve a system default
  sin pisar overrides. Eso es deliberado: respeta lo que el admin configuró,
  pero conviene revisar en el rollout que el row resultante refleje la
  intención (ej. que `is_active` siga apuntando al template correcto).
- El índice parcial UNIQUE garantiza un único system default; cualquier
  tentación futura de “tener varios defaults” pide ADR nuevo, no un bypass
  silencioso.
- Tests cubren: la forma de la migración, el guard de archive en server
  action y el render con badge / sin botón Archivar en `SiteThemeTemplatePreviewCard`
  + `SiteThemeTemplatesShell`.
