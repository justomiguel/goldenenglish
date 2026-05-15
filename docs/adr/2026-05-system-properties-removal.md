# ADR: Removal of `system.properties` (TS defaults + DB-driven configuration)

- **Fecha:** 2026-05-14
- **Estado:** Aceptado e implementado.
- **Relacionado:** `docs/adr/2026-04-runtime-theming-and-landing-cms.md`, `docs/adr/2026-04-cms-tokens-editor.md`, `docs/adr/2026-04-cms-properties-editor.md`, `docs/adr/2026-04-multi-site-brand-overlay.md`.

## Contexto

Hasta ahora, `system.properties` (archivo `.properties` en la raíz del monorepo) mezclaba cuatro dominios en una sola fuente acoplada al deploy:

1. **Identidad / marca / contacto / social** (`app.*`, `contact.*`, `social.*`).
2. **Tokens visuales** (`color.*`, `font.*`, `shadow.*`, `layout.*`, `color.calendarSpecial.*`).
3. **Parámetros operativos** (`legal.age.majority`, `academics.*`, `student.enrollment.renewal.warn.days`, `billing.term.*`, `analytics.*`).
4. Comentarios documentales (referencia rápida del modelo).

Limitaciones:

- **No soporta multi-tenant.** Cada tenant de Vercel comparte el mismo archivo en build-time; los overrides por tenant viven sólo en `site_themes.properties` (visual/marca/contacto) pero los operativos no tienen vehículo equivalente.
- **Requiere redeploy** para cualquier cambio de marca, contacto u operativo, incluso cuando ya existe el CMS y el wizard de site setup para administrarlos.
- **Acoplamiento I/O.** `loadProperties()` hacía `fs.readFileSync` en cada request server, lo que también complicaba Edge runtime y pruebas.
- **Wizard no re-entrant.** Un admin no podía reabrir el flujo guiado de configuración: la única superficie para reeditar marca/visual era el CMS raw editor.

## Decisión

Eliminar el archivo y mover su contenido a tres capas explícitas, todas accesibles desde la app:

1. **Defaults canónicos en TS** — `src/lib/theme/systemPropertiesDefaults.ts` exporta `SYSTEM_PROPERTIES_DEFAULTS: Readonly<Record<string, string>>` con las mismas claves y valores que tenía el archivo. Es la base inmutable que se mergea con cualquier override.
2. **Overrides de tema en `public.site_themes`** — sigue siendo el JSONB que el CMS y el wizard editan; `loadEffectiveProperties()` mergea defaults + override activo. El allow-list `THEME_OVERRIDE_KEY_PREFIXES` ahora incluye `font.*` además de `color.*`, `layout.*`, `shadow.*`, `app.*`, `contact.*` y `social.*`.
3. **Operativos en `public.site_settings`** — migración `125_site_settings_operational_defaults.sql` semilla idempotente con los valores actuales para `legal_age_majority`, `student_renewal_warn_days`, `billing_terms`, `academics_section_defaults`, `academics_attendance_matrix`, `analytics_config`. Cada uno cuenta con un loader async cacheado (`src/lib/<contexto>/load*.ts`) que cae a `SYSTEM_PROPERTIES_DEFAULTS` si la clave no está presente.

Además, el wizard de site setup (`/dashboard/admin/site-setup`) es ahora **re-entrant**: la página ya no redirige si `initial_site_setup.completedAt !== null`, y se carga con los valores actuales (`loadSiteSetupCurrentValues`). Se agregaron cuatro steps nuevos (Visual, Académicos, Legal & Billing, Analítica) para que un admin pueda mantener toda la configuración sin tocar SQL ni el CMS raw editor.

### Alternativas descartadas

- **Defaults neutros (placeholder en TS).** Rechazado: rompería los tenants Golden existentes que dependen de los valores actuales como fallback.
- **Meter operativos en `site_themes.properties`.** Rechazado: acopla operación (edad legal, billing, asistencia) con tema visual activo; un cambio de tema reactivaría defaults operativos no deseados.
- **Crear una pantalla CMS separada para operativos.** Rechazado: duplicaría superficies (el wizard ya es el flujo guiado) y rompería la UX de "una sola vista de configuración por tenant".

## Consecuencias

### Positivas

- Configuración de tenant 100% editable desde el wizard sin redeploy.
- Multi-tenant uniforme: cada deploy de Vercel lee sus propios `site_themes` + `site_settings`, los defaults TS son sólo fallback compartido.
- Sin I/O de disco para leer defaults; bundle TS reemplaza al lector síncrono.

### Coste

- Migración de consumidores síncronos a async loaders (en curso): `getLegalAgeMajorityFromSystem`, `studentEnrollmentRenewalWarnDays`, `getBillingTerms`, `getDefaultSectionMaxStudents`, `getTeacherPortalAllowedRoles`, `academicsAttendanceMatrixProperties`, `instituteTimeZone`. Mientras tanto el getter síncrono apunta a `SYSTEM_PROPERTIES_DEFAULTS` y queda marcado como deprecated en su JSDoc.
- El script `scripts/migrate-public-assets.mjs` deja `--write-system-properties` como no-op (con `console.warn`) — actualizar defaults ahora requiere code change.

### Observabilidad y caché

- Nuevo cache tag `site-settings-operational` (`src/lib/site/siteSettingsOperationalTag.ts`). El wizard llama `updateTag(SITE_SETTINGS_OPERATIONAL_CACHE_TAG)` al persistir, además del existente `revalidateSiteThemeSurfaces()`.
- Auditoría diferenciada en `system_config_audit`: `initial_site_setup_completed` (greenfield) vs `site_setup_reedited` (mode = "edit").

### Tests

- Unit tests para parsers puros (`parse*.ts`) y loaders con fallback a defaults.
- Tests del schema `siteSetupCompletionSchema` cubriendo `mode: "create"` (requiere logo/favicon) y `mode: "edit"` (logo/favicon opcionales).
- Tests existentes de `themeParser` y `getBrandPublic` validan que `loadProperties()` retorna copia fresca de `SYSTEM_PROPERTIES_DEFAULTS`.

### Gobernanza

- Cumple `10-engineering-governance`: este ADR documenta el cambio de contrato de datos.
- Cumple `21-migrations-production-no-data-destruction`: migración 125 es aditiva, `ON CONFLICT (key) DO NOTHING`.
- Cumple `12-supabase-app-boundaries`: loaders en `src/lib/<contexto>/`, clientes Supabase desde `src/lib/supabase/`.

## Seguimiento

- Tarea pendiente (fuera de este PR): migrar todos los call sites síncronos restantes a los nuevos loaders async, propagando `await` hasta la frontera RSC / action / route. El getter síncrono permanece como compatibilidad mientras tanto.
- Tarea pendiente (opcional): botón "Restablecer al default Golden" en el wizard, que limpie filas en `site_settings` y delegue a `SYSTEM_PROPERTIES_DEFAULTS`. No incluido para no introducir destrucción de datos sin confirmación explícita.
