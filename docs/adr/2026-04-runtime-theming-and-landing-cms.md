# ADR: Theming en runtime y CMS de landing (`site_themes`)

## Contexto

Hoy la marca y los tokens visuales viven en `system.properties` (cargado por `loadProperties()` en `src/lib/theme/themeParser.ts`), pero los tokens reales de UI están **duplicados y hardcodeados** en `:root` de `src/app/globals.css`. Cambiar `color.primary` o `layout.border.radius` en `system.properties` no afecta la UI: hay drift (p. ej. `layout.border.radius=0.5rem` en archivo vs `0.75rem` en CSS, `color.background=#FFFFFF` vs `#FAF9F6`, tokens como `color.surface`, `color.success/warning/error/info`, `shadow.soft/card` que no existen en properties).

El equipo necesita además:

1. Un editor visual del **design system** desde el panel admin (ver tokens, cambiarlos).
2. Capacidad de mantener varios **templates** de landing (default, navidad, aniversario…) y activar uno cualquiera.
3. **Overrides de `system.properties`** desde la UI sin perder los valores del archivo (que siguen siendo defaults / seed).
4. Subida de **fotos por sección** de la landing y que las nuevas se usen automáticamente.

Las reglas clave del repo a respetar son `01-design-system` (`system.properties` única fuente de marca), `12-supabase-app-boundaries` (todo Supabase pasa por la app), `06-seo-performance` (no degradar LCP de la landing pública), `09-i18n-copy` (textos visibles desde `dictionaries/*.json`) y `13-postgrest-pagination-bounded-queries` (consultas acotadas).

## Decisión

Consolidar todas las solicitudes en **un solo modelo**: el “tema activo”. Un tema = `(properties_overrides + content_overrides + media_overrides)`. “Templating por ocasión”, “editor del design system” y “overrides de properties” son distintas vistas sobre la misma fila.

### Modelo de datos (PR 1)

- Tabla `public.site_themes` con `id, slug UNIQUE, name, is_active BOOLEAN, properties JSONB, content JSONB, created_at, updated_at, updated_by`. Constraint para garantizar **un solo activo a la vez**.
- Tabla `public.site_theme_media` con `(theme_id, section, position, storage_path, alt_es, alt_en)` para imágenes por sección de landing. Compartidas ES/EN en v1.
- Bucket Storage **`landing-media`** público RO, escritura solo admin.
- RLS: lectura `anon + authenticated` para tema activo y sus medios; escritura solo admin (`is_admin(auth.uid())`).

### Pipeline runtime (PR 1)

1. `loadProperties()` (sync, file) sigue siendo la fuente de **defaults**. `system.properties` se actualiza para cubrir todos los tokens que hoy están solo en CSS (surface, success/warning/error/info, shadow.soft/card) y se alinean los valores que hoy están en drift.
2. `loadActiveTheme()` (server async, cacheado con `unstable_cache` + tag `"site-theme-active"`) lee la fila activa.
3. `loadEffectiveProperties()` mergea `defaults + active.properties`.
4. `src/app/layout.tsx` se vuelve **async**, llama al merge una vez por request, e inyecta un `<style>` con `:root { --color-…: …; }` derivado de las claves token (`color.*`, `layout.*`, `shadow.*`). El bloque `:root` con tokens se elimina de `globals.css`.
5. `getBrandPublic(props)` se vuelve **puro** (recibe el map ya mergeado); el wrapper sin args sigue funcionando con defaults para callers que no necesitan overrides.

Sin tema activo, la app se ve **idéntica a hoy** porque defaults = valores actuales.

### Editor admin (PRs siguientes, fuera de PR 1)

- PR 2: `/dashboard/admin/cms/templates` — listar/crear/duplicar/activar/archivar.
- PR 3: `/dashboard/admin/cms/design-system` — viewer de tokens efectivos, editor por tema, selector de fonts entre 4-6 fuentes pre-cargadas con `next/font`.
- PR 4: `/dashboard/admin/cms/landing` — editor de copy ES/EN por sección + upload de imágenes a `landing-media`.
- PR 5: `/dashboard/admin/cms/properties` — tabla key/value avanzada para claves no cubiertas por los editores anteriores.

Cada acción admin: validación con Zod, `recordSystemAudit`, `revalidateTag("site-theme-active")`, y respeta `15-entity-crud-completeness` (templates: create/read/update/archive completos).

## Opciones descartadas

- **CMS externo (Sanity, Payload, Contentful, Tina)** — duplicaría auth, i18n, branding, y rompería `12-supabase-app-boundaries`. Volveremos a evaluar si aparece un sitio de marketing aparte (blog, autores, draft/preview reales).
- **Solo extender `site_settings`** — funciona para overrides simples pero no modela “varios templates guardados”; obligaría a versionar a mano por keys.
- **Fonts dinámicas (cualquier Google Font)** — costo de LCP / bundle no justificado. Pool fijo de fuentes vía `next/font`.
- **Activación programada (`active_from` / `active_until`)** — postergada a v2. v1: activación manual única.
- **Imágenes distintas por locale** — postergada. v1: una imagen por `(theme, section, position)` válida para ES y EN (mismo comportamiento que hoy).
- **Inyectar overrides como `<link>` CSS** — más complejo y peor cache control que un `<style>` inline corto.

## Consecuencias

Positivas

- `system.properties` por fin es la única fuente de tokens (deuda existente cerrada).
- `site_themes` permite preparar templates de ocasión por adelantado y activarlos con un click.
- Brand y tokens quedan testables sin `fs` (función pura).
- El admin gana un CMS pequeño, propio, alineado al stack y a las RLS existentes.

Riesgos / follow-ups

- El `<style>` inline en cada request añade ~1-2 KB; mitigamos con cache de tema activo.
- `layout.tsx` pasa a ser RSC async; verificar que no rompe metadata estática (no debería: `metadata` puede ser objeto exportado calculado al inicio del módulo, pero al pasar a depender de DB lo movemos a `generateMetadata`).
- Ordenar el unmount visual en producción: cuando se active un nuevo tema, `revalidateTag("site-theme-active")` invalida la cache; los clients reciben el nuevo `<style>` en la próxima navegación.
- Tests `≥ 90%` (`02-testing-tdd`): cubrir `themeOverrides`, `loadEffectiveProperties`, `brandPublicFromProperties`, y orquestación de `loadActiveTheme` con cliente Supabase mockeado.
- Audit / observabilidad (`08-analytics-observability`): cada activación, edición de tema y upload de media usa `recordSystemAudit({ action: "site_theme.*", ... })` (definido en PR 2-4).
- Coherencia con `15-entity-crud-completeness`: site_themes requiere CRUD completo (create + activate + edit + archive). Implementación completa en PR 2.
