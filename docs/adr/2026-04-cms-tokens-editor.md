# ADR: Editor visual del design system (PR3 — tokens override editor)

## Contexto

PR1 introdujo el modelo `site_themes` (con `properties` JSONB) y PR2 conectó el runtime para que esos overrides se inyecten como variables CSS sobre los defaults de `system.properties`. Faltaba lo que el usuario pidió originalmente: **una superficie en el panel admin para ver y cambiar el design system** (colores, layout, sombras, identidad de marca, contacto, redes), sin tocar el archivo `system.properties` ni redeployar.

Restricciones a respetar:

- **`01-design-system`** — `system.properties` sigue siendo la fuente de verdad para los **defaults**; el editor solo persiste **overrides**.
- **`03-architecture`** — capas separadas (helpers puros, loader server-only, server actions, componentes presentacionales), tope 250 líneas por archivo.
- **`09-i18n-copy`** — todo el copy del editor sale de `src/dictionaries/{en,es}.json`.
- **`12-supabase-app-boundaries`** — toda lectura/escritura de `site_themes` pasa por server actions + `assertAdmin()`; el cliente solo hace dispatch.
- **`08-analytics-observability`** — cada cambio queda en `system_config_audit` para soporte / auditoría.
- **`13-postgrest-pagination-bounded-queries`** — un template = una fila, lectura por PK.

## Decisión

Construir el editor sobre las piezas existentes sin cambiar el modelo de datos:

### Allow-list de claves editables

`THEME_OVERRIDE_KEY_PREFIXES` (en `src/types/theming.ts`) ya restringe los overrides a `color.*`, `layout.*`, `shadow.*`, `app.*`, `contact.*`, `social.*`. El editor reusa ese mismo set tanto para renderizar grupos como para validar el payload, así que es **imposible** que un admin sobreescriba `legal.age.majority`, `analytics.timezone` u otras claves operativas desde la UI.

### Helpers puros

- `src/lib/cms/groupThemeTokens.ts`: `groupThemeTokens(defaults, overrides)` arma el view-model del editor — agrupa por prefijo, marca cada token como `isOverridden` cuando difiere del default, y omite grupos vacíos. `tokenFieldKindFromKey` decide si un token se renderiza con color picker (`color.*`), input de sombra (`shadow.*`) o texto plano.
- `src/lib/cms/cleanThemeOverridesForPersistence.ts`: limpia el payload del editor antes de escribirlo: descarta claves fuera del allow-list, valores vacíos, y valores que coinciden con el default (así un rebrand de `system.properties` se sigue propagando aunque el admin haya tocado el editor antes).

### Loader server-only

`src/lib/cms/loadSiteThemeForEditor.ts` lee la fila por id (Supabase inyectado desde `assertAdmin()`), combina con `loadProperties()` y devuelve `{ theme, groups }`. El loader es server-only (`import "server-only"`) y respeta `12-supabase-app-boundaries`.

### Server actions

- `updateSiteThemePropertiesAction(input)` — valida con Zod, fetch + sanea + persiste, audita (`site_theme_properties_updated`, registrando solo el conteo y las claves modificadas, sin valores sensibles), invalida `site-theme-active` + revalidatePath de la landing y del CMS.
- `resetSiteThemePropertiesAction(input)` — wipe a `{}` del JSONB, audita (`site_theme_properties_reset`), misma invalidación.

Ambas devuelven el mismo `SiteThemeActionResult` discriminado que el resto de actions del CMS y aprovechan `resolveAdminContext()` + `revalidateSiteThemeSurfaces()`.

### Ruta y UI

- Ruta nueva: `/[locale]/dashboard/admin/cms/templates/[id]` (Tier B → desktop-only es aceptable según `05-pwa-mobile-native`).
- Página server-component: chequea `assertAdmin()`, llama al loader, renderiza `SiteThemeEditorShell`.
- `SiteThemeEditorShell` (cliente) maneja el draft en memoria con un `useState` lazy (snapshot pattern, compatible con React Compiler), expone `Save` y `Reset all`, y muestra error/success con `role="alert" / "status"`.
- Componentes presentacionales por separado para mantener el tope de 250 líneas: `SiteThemeEditorGroupCard`, `SiteThemeEditorTokenField`, `SiteThemeEditorPreview`, `siteThemeEditorDraft.ts`.
- En `SiteThemeTemplatesTable` ya existía el copy `openEditorCta`; PR3 lo conecta como `Link` directo a la nueva ruta para los templates no archivados.

> **Apéndice — preview visual del listado de templates** (post-PR7). La vista
> de templates pasó de tabla a **grid de preview cards**: cada tarjeta
> renderiza una mini-maqueta del template (kicker, título, CTAs, swatches)
> usando los mismos tokens que aplicará en el sitio público — los `properties`
> overrides se mezclan con `loadProperties()` server-side via el helper puro
> `extractThemePreviewTokens` (`src/lib/cms/themePreviewTokens.ts`), de modo
> que el cliente nunca tiene que leer `system.properties`. El tema activo se
> identifica con un badge prominente (`Currently active` / `Tema activo`) y un
> borde + ring tintado en `--color-primary`. La tabla densa anterior quedó
> deprecada (`SiteThemeTemplatesTable` se eliminó). Componentes nuevos:
> `SiteThemeTemplatesGrid`, `SiteThemeTemplatePreviewCard`,
> `SiteThemeTemplatePreviewMock` (todos client, presentacionales).

### i18n

Toda la UX del editor vive bajo `admin.cms.templates.editor.*` en `en.json` y `es.json` (títulos por grupo, labels de fields, errores estables alineados con `SiteThemeActionErrorCode`).

## Opciones consideradas

1. **Hardcodear un formulario por token** — descartado: cualquier nueva clave de `system.properties` requeriría editar el componente. La estrategia elegida arma el formulario a partir del archivo, así que añadir un token nuevo solo necesita actualizar `system.properties`.
2. **Editor JSON crudo del JSONB** — descartado: rompe `01-design-system` (no comunica qué claves son válidas) y obliga al admin a saber el formato. Mantenemos la validación servidor para no confiar en el cliente.
3. **Persistir todos los valores aunque coincidan con el default** — descartado: rompe la propiedad de “rebranding del archivo se propaga”. Solo se guardan diferencias reales.

## Consecuencias

- **Positivas**: el admin tiene control total del design system sin redeploy, manteniendo `system.properties` como fuente única de defaults. La UI escala al añadir tokens nuevos sin tocar componentes.
- **Riesgos**: un override mal escrito (p. ej. `color.primary = "not a color"`) llega a CSS; ya quedaba mitigado por `sanitizeCssValue` en `themeOverrides.ts`, que descarta valores con caracteres peligrosos. Para tokens no-CSS (p. ej. `app.tagline`) no hay sanitización adicional porque solo viaja por la capa brand.
- **Follow-ups**: editor de `content` (copy de landing) y de `media` (subir fotos) — modelo en BD ya existe, falta su propia UI; queda fuera de PR3.

## Tests

- `src/__tests__/lib/cms/groupThemeTokens.test.ts` (16 casos): grouping, allow-list, marcado de overrides, orden estable.
- `src/__tests__/lib/cms/cleanThemeOverridesForPersistence.test.ts` (6 casos): saneo del payload (allow-list, vacíos, coincidencia con defaults, trim, orden, defensa ante valores no-string).
- `src/__tests__/app/siteThemePropertiesActions.test.ts` (5 casos): admin guard, input inválido, not found, persistencia y audit del happy path, reset.
