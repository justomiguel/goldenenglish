# Subsecciones dinámicas y `template_kind` para landings (PR 6)

- **Estado:** Aceptada — 2026-04
- **Relacionada:** `docs/adr/2026-04-runtime-theming-and-landing-cms.md`,
  `docs/adr/2026-04-cms-landing-editor.md`,
  `docs/adr/2026-04-cms-properties-editor.md`.

## Contexto

Tras PR 1-5 ya tenemos:

- 6 secciones canónicas en la landing pública
  (`inicio`, `historia`, `oferta`, `modalidades`, `niveles`, `certificaciones`).
- Editor admin para sobrescribir copy ES/EN (catálogo cerrado por sección).
- Editor admin para reemplazar imágenes en slots conocidos.
- Editor de tokens (colores, layout, shadow, app, contact, social) y editor
  crudo de overrides allow-listed.

El equipo pidió dos cosas adicionales:

1. **Editar más libremente las secciones**, en particular **agregar
   subsecciones / cards / items** dentro de cada una sin tocar código.
2. **Tener un segundo template con un estilo completamente distinto** al
   actual, manteniendo la misma información. La idea es poder rotar
   "templates de ocasión" no solo cambiando paleta sino también la
   personalidad visual.

Lo que **no** está en este PR (queda como follow-up explícito al final).

## Decisión

Mantener las 6 secciones canónicas como contrato estable de la landing
(SEO, LCP, RSC) y extender el modelo `site_themes` con dos piezas
complementarias:

1. **`blocks JSONB DEFAULT '[]'`** — array de subsecciones dinámicas
   adjuntas a una sección canónica. Cada bloque es serializable y vive
   100% en la fila del template. No requiere tabla nueva (volumen acotado
   por template), no requiere ordenamiento entre tablas y permite editar
   con la misma UX que el resto del CMS.

   ```ts
   type LandingBlockKind = "card" | "callout" | "quote";
   interface LandingBlock {
     id: string;            // uuid v4 generado en server
     section: LandingSectionSlug;
     kind: LandingBlockKind;
     position: number;      // 0..N, normalizado en cada save
     copy: {
       es: { title?: string; body?: string };
       en: { title?: string; body?: string };
     };
     mediaPath?: string;    // path en bucket landing-media
   }
   ```

   Los `kind` arrancan acotados (catálogo cerrado) para garantizar que el
   renderer público los entiende; ampliar el catálogo es un PR pequeño
   (helper + componente + dict).

2. **`template_kind site_theme_kind NOT NULL DEFAULT 'classic'`** — enum
   Postgres con dos valores en v1 (`'classic'`, `'editorial'`). El layout
   de la landing pública **selecciona el shell** a renderizar según este
   campo, manteniendo el resto del modelo igual:

   - `classic` → `LandingMainSections` (lo de hoy).
   - `editorial` → `LandingMainSectionsEditorial` (variante con tipografía
     display, secciones a sangre completa, cards más editoriales).

   La copy y las imágenes **se comparten** entre ambos shells: el segundo
   template no duplica contenido, solo pinta diferente.

3. **Seed `Editorial`**: una migración de seed crea (idempotentemente) un
   segundo template con `template_kind = 'editorial'` y un set de
   overrides de tokens (paleta + tipografía display + radios) para que el
   admin lo encuentre listo para activar.

### Por qué no…

- **Page builder libre con drag & drop** — fuera de alcance: requiere
  vista previa real, motor de bloques recursivo, validaciones por
  breakpoint, selectores de estilo finos, accesibilidad por componente,
  drag&drop performante en RSC. Más coste que valor para un instituto que
  rota 1-2 templates por año.
- **Tabla `site_theme_blocks` separada** — el volumen esperado es ~10-30
  bloques por template; un `JSONB` se diff-ea fácil, no necesita joins en
  el render público y permite atomicidad por template (un solo update
  para reordenar/agregar/eliminar). Si el volumen explotara o aparecieran
  versiones por bloque, se promueve a tabla.
- **Reordenar / ocultar / agregar más secciones canónicas en este PR** —
  cambia el contrato de copy del editor de PR 4 (secciones cerradas) y la
  selección del shell, lo cual implica ADR de cambio de contrato de la
  landing. Postergado a un PR siguiente (ver follow-ups).
- **Variante de layout por sección** (en vez de `template_kind`
  template-wide) — daría más flexibilidad pero multiplica los componentes
  a probar (6 secciones × N variantes). El `template_kind` empaqueta una
  decisión visual coherente, que es lo que el equipo pide ("un template
  con estilo completamente distinto").
- **Almacenar HTML libre por bloque** — facilita XSS y rompe i18n
  estructurada. Bloques tipados con `title`/`body` plain-text mantienen
  el copy en diccionarios + overrides ya conocidos.

## Consecuencias

### Positivas

- Admin puede enriquecer secciones sin depender del equipo de producto:
  agregar cards de modalidades nuevas, callouts en certificaciones,
  testimonios cortos, etc.
- El segundo template es **un solo seed + un shell alternativo**: bajo
  coste de mantenimiento, alto impacto visual.
- Reuso 100% del pipeline existente: tokens (PR 3), copy/imagenes
  (PR 4), overrides crudos (PR 5), `loadActiveTheme` + cache invalidación
  (`SITE_THEME_ACTIVE_CACHE_TAG`).

### Riesgos / mitigaciones

- **Cap de blocks por template** — sin tope explícito un admin podría
  inflar el JSONB. Cap suave en server action (≤ 24 bloques por
  template, ≥ 0 por sección) para mantener payload bounded
  (`13-postgrest-pagination-bounded-queries.mdc`); el editor limita la
  UI antes de llegar al server.
- **Imágenes huérfanas de bloques eliminados** — al borrar un bloque, la
  acción intenta limpiar el storage; falla silenciosa registrada con
  `[ge:server]` (mismo patrón que `siteThemeMediaActions.ts`).
- **Render de bloques debe ser RSC** — no introducir `'use client'` en
  el shell público; los bloques renderizan tipografía/cards puras.
- **Auditoría** — cada CRUD emite `recordSystemAudit({ action:
  "site_theme_blocks_updated" | "site_theme_kind_updated" })`.

### Tests requeridos

- Pure helpers: validación de catálogo (`isLandingBlockKind`,
  `sanitizeLandingBlocksForPersistence`, normalización de `position`).
- Server actions: `addLandingBlockAction`, `updateLandingBlockAction`,
  `removeLandingBlockAction`, `setSiteThemeKindAction`.
- Loader: bloques se devuelven ordenados por `position` por sección.
- Render: `LandingMainSections` y `LandingMainSectionsEditorial` reciben
  los bloques y los pintan al pie de la sección correcta.
- Componente admin: añadir / editar / eliminar bloque dispara la acción
  correcta y refresca.

## Follow-ups (fuera de alcance de este PR)

- Reordenar secciones canónicas y ocultarlas por template.
- Agregar **secciones extra** standalone (no asociadas a una canónica).
- Soporte de imagen por bloque con multi-upload.
- Más `kind` en el catálogo (`video`, `faq`, `pricing-table`).
- Variante visual por sección (más fina que `template_kind` template-wide).
- Página de "preview" del template antes de activar.

## Apéndice — `template_kind = 'minimal'` (extensión inmediata)

Se añade un **tercer** `template_kind`, `'minimal'`, con su propio shell
(`LandingMainSectionsMinimal`) que reutiliza los mismos organisms y bloques,
pero los envuelve en contenedores aireados (`max-w-4xl`, `py-16/24`) con
separadores finos centrados. Las migraciones siguen siendo aditivas:

- `050_site_themes_kind_minimal.sql` extiende el enum
  `public.site_theme_kind` agregando el valor `'minimal'` y siembra una
  fila `Minimal` (no activa) con tokens propios.
- `SITE_THEME_KINDS` en `src/types/theming.ts` incluye `'minimal'`.
- `src/app/[locale]/page.tsx` selecciona el shell vía un único switch sobre
  `templateKind` (factorizado con `sharedShellProps`), de modo que sumar
  un cuarto kind en el futuro es una rama más, sin duplicar props.
- Diccionarios: `admin.cms.templates.landing.kindPicker.options.minimal`.

Sin cambios en el contrato de bloques, RLS, ni en el modelo de
`site_theme_media`. Si se agrega un cuarto kind, repetir este patrón:
nueva migración `ALTER TYPE … ADD VALUE`, nuevo shell, nueva entrada en
diccionarios y nueva rama en el switch.

## Apéndice — PR 7: reorden, kinds extra y editor visual del Hero

Tres mejoras que mantienen el contrato de PR 6 pero hacen el editor más
usable, sin nuevas tablas ni cambios de RLS:

### Reordenar subsecciones con flechas

- Server action `moveLandingBlockAction({ id, blockId, direction })` con
  `direction ∈ {-1, 1}`. Llama al helper puro `moveLandingBlock` que
  hace swap de `position` con el adyacente del mismo `section` y
  re-normaliza con `normalizeBlockPositions`. La operación es
  idempotente en bordes (no falla si está al principio o final).
- UI: `LandingBlockEditorRow` añade dos botones-icono (Lucide
  `ArrowUp`/`ArrowDown`) con `aria-label` + `title` traducidos. La
  habilitación se calcula en `LandingBlocksPanel` mirando el índice de
  cada bloque dentro del array ya ordenado por `position` (recibido
  desde `buildLandingSectionEditorViewModel`, que ya hace el sort).
- **Por qué flechas y no drag&drop**: drag&drop trae una dependencia
  pesada (react-dnd / dnd-kit), reglas de a11y propias (teclado, `aria-grabbed`)
  y costes de performance en la grilla densa del editor. Las flechas
  cumplen la regla `01-design-system.mdc` con controles nativos
  accesibles, son reutilizables en otras vistas y mantienen toda la
  ordenación en server.

### Kinds extra: `feature`, `stat`, `cta`, `divider`

- `LANDING_BLOCK_KINDS` pasa de 3 a 7 valores. El catálogo sigue
  cerrado (no JSONB libre) para que el renderer público garantice la
  rama. Cada nuevo kind tiene branch propio en `LandingBlocksRenderer`
  con tokens del design system:
  - `feature`: card ancha con barra acento `--color-primary`.
  - `stat`: card centrada con `title` como número grande.
  - `cta`: card con tinte `--color-secondary` para llamadas a la
    acción.
  - `divider`: separador horizontal con título centrado entre dos
    líneas finas.
- `feature`, `cta` y `divider` son **full-width** (`sm:col-span-2`)
  porque su intención es estructurar la grilla; `card`, `callout`,
  `quote` y `stat` siguen en grilla 2 columnas.
- Sin migración: el catálogo vive en TS, los datos viajan por JSONB
  ya existente.

### Editor visual del Hero

- Nueva ruta `/dashboard/admin/cms/templates/[id]/hero` que reutiliza
  `loadLandingEditorSection(...,'inicio')` y muestra los mismos copy
  fields y media slots del editor genérico, pero en layout 2-col con
  **vista previa en vivo** (`HeroLivePreview`). El preview no monta
  el organism real para no acoplar el editor al runtime, sino una
  representación compacta con los mismos tokens (kicker, brand
  title, CTAs, collage 3 imágenes).
- `HeroVisualEditorShell` orquesta el draft con el mismo
  `buildInitialLandingCopyDraft` / `isLandingCopyDraftDirty` que la
  pantalla genérica, así que las acciones servidor
  (`updateSiteThemeContentAction`, `resetSiteThemeContentAction`) y
  la auditoría no cambian.
- Toggle de locale (`es` / `en`) afecta solo al preview; los dos
  campos del formulario se editan a la vez.
- Acceso desde `LandingEditorOverview` con un CTA destacado
  (`labels.heroEditor.openCta`).

### Tests

- `landingBlocksCatalog.test.ts`: nuevos casos de `moveLandingBlock`
  (swap up/down, no-op en bordes, no cruza secciones, target
  inexistente).
- `siteThemeBlocksActions.test.ts`: `moveLandingBlockAction` rechaza
  direcciones inválidas, devuelve `not_found` cuando el bloque no
  existe y persiste el swap con auditoría `op: "move"`.
- `LandingBlocksRenderer.test.tsx`: cubre `quote`, `stat`, `divider`
  y full-width para `feature`/`cta`/`divider`.
- `LandingBlocksPanel.test.tsx`: el botón "down" del primer bloque
  llama a `moveLandingBlockAction` con `direction: 1`; los dos
  botones de un único bloque están deshabilitados.
- `HeroLivePreview.test.tsx`: defaults vs draft, locale
  `es`/`en`, `<img>` cuando hay src y placeholder cuando no.
- `HeroVisualEditorShell.test.tsx`: render de copy fields + preview,
  toggle ES/EN, save dispara `updateSiteThemeContentAction` y muestra
  banner de éxito.

### Editor por-kind y validación específica (cierre de PR 7)

Para que los nuevos `divider`/`stat` no fuercen un editor único de
4 campos, se añade un helper puro
`src/lib/cms/landingBlockKindFields.ts` con dos tablas:

- `LANDING_BLOCK_FIELDS_BY_KIND`: qué campos (`title` y/o `body`)
  edita cada kind. Hoy solo `divider` reduce campos a `["title"]`;
  los demás siguen con `title + body`.
- `LANDING_BLOCK_REQUIRED_FIELDS_BY_KIND`: cuál es el campo
  obligatorio antes de crear/guardar (todos exigen `title` salvo
  `quote`, que exige `body`).

`LandingBlockAddForm` y `LandingBlockEditorRow` consumen el helper
para renderizar **solo** los inputs aplicables al kind, y
`LandingBlocksPanel.handleAdd` reemplaza el viejo `copyHasContent`
por `isLandingBlockCopyValid(kind, copy)`. La validación nueva es
**más estricta** que la previa (que aceptaba cualquier campo en
cualquier idioma), pero **solo** se aplica en la UI: el sanitizer
de runtime (`parseLandingBlocks`) sigue aceptando bloques antiguos
con solo `body` para no perder datos preexistentes.

Tests: `src/__tests__/lib/cms/landingBlockKindFields.test.ts`
(7 casos cubriendo card-like, quote, divider y whitespace) y dos
casos nuevos en `LandingBlocksPanel.test.tsx` que verifican que
`divider` no muestra inputs de body ni en el alta ni en la fila de
edición.
