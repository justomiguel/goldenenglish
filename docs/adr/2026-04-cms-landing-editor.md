# ADR: CMS de copy e imágenes del landing (PR 4)

## Contexto

Los PRs 1-3 introdujeron el modelo `site_themes` + `site_theme_media`, el runtime que aplica los tokens del tema activo, y el editor de design system. Falta la parte de **contenido del landing**: que un administrador pueda, desde el panel, cambiar los textos bilingües (ES/EN) y reemplazar las imágenes de cada sección del landing sin tocar el repositorio ni el diccionario.

Reglas aplicables: `08-analytics-observability` (auditoría), `09-i18n-copy` (textos desde diccionario), `10-engineering-governance` (ADR para contratos nuevos), `12-supabase-app-boundaries` (clientes Supabase solo vía `src/lib/supabase`), `13-postgrest-pagination-bounded-queries` (consultas acotadas, la columna `content` vive en la misma fila del tema) y `15-entity-crud-completeness` (CRUD completo por slot de copy/media).

## Decisión

Modelar "overrides de contenido" como **catálogo cerrado** + **JSONB mínimo** persistido en `site_themes.content`, y "overrides de imágenes" como filas `site_theme_media` + objetos en el bucket `landing-media` de Supabase Storage.

### Catálogo cerrado por sección (`landingContentCatalog.ts`)

- `LANDING_COPY_KEYS_BY_SECTION` asocia cada `LandingSectionSlug` con un array **finito** de rutas con punto (`hero.kicker`, `story.body1`, …). Solo esas rutas se pueden sobrescribir. Así el editor nunca crece "por accidente" más allá del diccionario real y los tests (`landingContentCatalog.test.ts`) detectan si se agrega una ruta que no existe en `dict.landing`.
- `LANDING_MEDIA_SLOTS_BY_SECTION` declara cuántos espacios de imagen expone cada sección (mapeo explícito, no conteo automático sobre el directorio público).

### Persistencia saneada (`cleanLandingContentForPersistence.ts`)

Antes de escribir en DB:
1. Se filtran secciones, claves y locales fuera del catálogo.
2. Se trimea cada valor y se descartan los vacíos.
3. Se descartan los valores que coinciden con el diccionario por defecto, para que `content` quede **mínimo**: solo las cosas realmente "custom".

Resultado: cuando alguien edita el diccionario base en un futuro refactor, los overrides que coincidían con el default ya no aparecen como falsos positivos.

### Merge en runtime (`applyLandingContentOverrides.ts`)

Sobre una copia profunda del diccionario base aplicamos los overrides por locale (`es` / `en`). El resto del diccionario (formularios, dashboard, etc.) queda intacto. El home page `src/app/[locale]/page.tsx` llama a `loadActiveTheme` → `applyLandingContentOverrides` → reparte el dict ya mergeado a los organismos del landing y a `LandingScreenDesktop`. Sin tema activo, el helper devuelve el diccionario sin cambios y el landing se ve igual que antes.

### Imágenes: bucket + resolver híbrido

- `landingMediaStoragePath.ts` genera rutas canónicas `themes/<id>/<section>/<position>-<timestamp>.<ext>` dentro de `landing-media`.
- `siteThemeMediaActions.ts` valida MIME (PNG/JPEG/WebP), tamaño (≤ 4 MB), sube al bucket, upsertea la fila `site_theme_media` y limpia el archivo anterior del slot.
- `resolveLandingImageSrc(section, filename, mediaMap?)` honra el override si existe; si no, cae al PNG incluido en `public/images/sections/...`. La posición se deduce del prefijo numérico del filename (`1.png`), preservando la convención existente.
- `buildLandingMediaMap` usa `createLandingMediaPublicUrlBuilder()`, que construye URLs públicas a `NEXT_PUBLIC_SUPABASE_URL/storage/v1/object/public/landing-media/...` sin crear un nuevo cliente Supabase en el borde cliente (respeta `12-supabase-app-boundaries`).

Las organismos del landing (`LandingHero`, `LandingStory`, `LandingStudentGallery`) reciben un `mediaMap?: LandingMediaMap` opcional. Sin el prop, el comportamiento es exactamente el actual (fallback estático).

### Editor UI

- `/[locale]/dashboard/admin/cms/templates/[id]/landing` — overview con todas las secciones y conteo de overrides.
- `/[locale]/dashboard/admin/cms/templates/[id]/landing/[section]` — editor por sección: lista de campos de copy (ES/EN lado a lado, `placeholder` = default del diccionario) y panel de imágenes con upload / delete / preview.
- Todas las cadenas visibles están en `dict.admin.cms.templates.landing.*` (ES + EN).

### Server actions

- `updateSiteThemeContentAction` y `resetSiteThemeContentAction` → mutan `site_themes.content`. La actualización es **por sección**: se serializa únicamente la sección tocada y se mergea con el resto existente.
- `uploadSiteThemeMediaAction` y `deleteSiteThemeMediaAction` → gestionan filas y archivos en el bucket. La subida limpia el objeto anterior del slot para no acumular basura.
- Todas: `assertAdmin`, validación Zod, `recordSystemAudit(action: "site_theme_content_updated" | "site_theme_content_reset" | "site_theme_media_uploaded" | "site_theme_media_deleted")`, `updateTag(SITE_THEME_ACTIVE_CACHE_TAG)` + `revalidatePath` sobre el home y el editor.

## Opciones descartadas

- **Copy libre sin catálogo** — permitiría crear claves que el front no renderiza nunca. El catálogo cerrado evita esa divergencia y hace posible testear que toda clave tenga correlato en `dict.landing`.
- **Duplicar el diccionario completo en JSONB** — cada fila crecería a decenas de KB y duplicaría cualquier cambio de copy futuro. Con overrides mínimos, la fila pesa lo que se tocó.
- **Bucket privado + rutas firmadas** — innecesario para assets de marketing, encarece el render y complica el SSR. El bucket `landing-media` ya está definido como público-lectura / admin-escritura.
- **Subida directa con `fetch` + upload multipart** — base64 permite validar tamaño/MIME del lado server antes de tocar el bucket; el payload extra (~33%) es aceptable para imágenes ≤ 4 MB y simplifica la acción.
- **Propagar `mediaMap` vía React Context** — los Server Components no comparten contexto con facilidad. Drilling explícito por props deja claro qué secciones pueden ser sobrescritas y facilita los tests.

## Consecuencias

Positivas

- El admin puede mantener landings de campaña con textos distintos e imágenes distintas sin releases de código.
- `site_themes.content` queda saneado (sin ruido) y es independiente de cualquier refactor futuro del diccionario.
- El landing cae limpio a los defaults cuando no hay tema activo o cuando falla Storage.
- Auditoría explícita de cada edición (`recordSystemAudit`) y revalidación del home (`SITE_THEME_ACTIVE_CACHE_TAG`) tras cada cambio.

Riesgos / follow-ups

- Las imágenes bypassean `next/image` optimizer cuando provienen del bucket (usamos `unoptimized`). A futuro, si escala, se puede precomputar variantes.
- El editor actual trabaja **una sola sección a la vez**; si más de un admin edita a la vez, se aplica "último gana" por sección (no hay bloqueo). Consistente con el editor de design system.
- Alt text por locale (`alt_es`, `alt_en`) ya está en el modelo pero el editor actual no lo expone; queda como mejora próxima (no bloquea el uso básico del editor).
- Catálogo de claves editables: cuando el equipo agregue copy nuevo al landing, hay que extender `LANDING_COPY_KEYS_BY_SECTION` para exponerlo al CMS. Los tests sirven de recordatorio.

## Tests

- `landingContentCatalog.test.ts` — todas las secciones tienen claves, sin duplicados, `isEditableLandingCopyKey` reconoce las rutas del catálogo.
- `applyLandingContentOverrides.test.ts` — ignora locales no soportados, claves fuera de catálogo, overrides vacíos; aplica los válidos.
- `cleanLandingContentForPersistence.test.ts` — filtra, trimea y descarta coincidencias con defaults.
- `resolveLandingMedia.test.ts` — construcción de mapa, resolución con/sin override, fallback a archivo estático.
- `landingMediaStoragePath.test.ts` — mapa de extensiones y forma del path.
- `buildLandingEditorViewModel.test.ts` — conteo de overrides en el overview y ordenamiento de slots.
- `siteThemeContentActions.test.ts` + `siteThemeMediaActions.test.ts` — guards de autorización, MIME, tamaño, `invalid_input`.
