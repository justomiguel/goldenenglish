# ADR: Ciclo de vida de los planes de cuota por sección (archivar vs. eliminar; versionado)

Fecha: 2026-04-18
Estado: Aceptado

## Contexto

La ADR `2026-04-section-fee-plans-and-monthly-strip.md` introdujo
`public.section_fee_plans` con vigencias (`effective_from_year/month`,
`period_start_year/month`, `monthly_fee`, `payments_count`,
`charges_enrollment_fee`). El editor admin (`AcademicSectionFeePlansEditor`)
permitía crear, editar y eliminar planes.

La regla `.cursor/rules/15-entity-crud-completeness.mdc` exige CRUD completo
con borrado seguro. En la práctica aparecieron dos casos que el "Crear /
Editar / Eliminar" plano no cubre bien:

1. **Editar un plan que ya tiene pagos**: si admin baja la cuota de USD 120
   a USD 100 en abril, ¿se reabren los pagos ya cobrados de marzo? Hoy los
   recibos guardan su `amount` en `payments`, pero la UI no transmite que
   editar el plan no reescribe el historial.
2. **Eliminar un plan que ya tiene pagos**: hoy el botón "Eliminar"
   ejecuta un `DELETE` sin chequear si hay pagos atribuibles a ese plan.
   Eso rompe trazabilidad y deja recibos huérfanos respecto del plan que
   los originó.

El usuario eligió, sobre cada caso de borde:

- **Editar plan en uso**: permitir editar pero mostrar advertencia visible
  ("en uso") y ofrecer "Duplicar como nueva versión".
- **Eliminar plan con pagos**: bloquear el hard delete con un error claro
  ("No se puede eliminar: hay pagos. Usá Archivar.") y permitir archivar
  desde el mismo botón.

## Decisión

1. **Soft delete** vía nueva migración `055_section_fee_plans_archive.sql`:
   se agregan `archived_at TIMESTAMPTZ NULL` y `archived_by UUID NULL`
   referenciando `auth.users` con índice parcial sobre planes activos
   (`section_fee_plans_section_active_idx WHERE archived_at IS NULL`).

2. **Hard delete restringido** por integridad referencial. Una server
   action dedicada (`deleteSectionFeePlanAction`) usa el helper puro
   `computeSectionFeePlansInUseIds(plans, payments)` y el adaptador
   `isSectionFeePlanInUse(supabase, sectionId, planId)` para devolver
   `{ ok: false, code: "IN_USE" }` cuando hay payments atribuibles al plan
   por su ventana `effective_from + period`. La UI no muestra el botón de
   borrado para planes en uso, pero la regla se aplica también en servidor
   (defensa en profundidad). La atribución considera **todos** los planes,
   incluidos los archivados, para no perder historial.

3. **Lifecycle separado en su propia action file** (`sectionFeePlanLifecycleActions.ts`)
   con `archive` / `restore` / `delete`, todos con auditoría
   (`recordSystemAudit` con `section_fee_plan_archived` /
   `section_fee_plan_restored` / `section_fee_plan_deleted`) y
   revalidación coherente de las superficies admin y alumno. Esto mantiene
   `sectionFeePlanActions.ts` enfocado en el upsert y respeta el límite de
   archivo de `03-architecture.mdc`.

4. **Versionado por convención, no por mutación**: editar un plan en uso
   sigue permitido. La UI muestra:
   - Badge **"en uso"** cuando `inUse = true` (calculado por el loader
     admin con `attachSectionFeePlansUsage`).
   - Mensaje explicativo al abrir el formulario en modo edición sobre un
     plan en uso ("Editarlo solo afecta a pagos futuros …").
   - Botón **"Duplicar como nueva versión"** que abre el formulario de
     creación pre-cargado con los valores actuales y `effective_from`
     desplazado un mes (para que sea una versión nueva sin tocar la
     anterior). Esa es la forma recomendada de cambiar la cuota cuando ya
     hay cobros.

5. **Visibilidad del catálogo activo vs archivado**:
   - `loadStudentMonthlyPaymentsView` y `resolveSectionPlanMonthlyAmount`
     filtran `archived_at IS NULL` para que los planes archivados nunca
     sean elegibles como plan vigente para nuevos pagos.
   - El admin sigue viendo todo y puede expandir/colapsar los archivados
     mediante un toggle ("Mostrar planes archivados (N)" /
     "Ocultar planes archivados").
   - `resolveEffectiveSectionFeePlan` se mantiene **agnóstico**: la
     filtración de archivados se hace en el caller, porque la atribución
     histórica para "in use" debe seguir contemplando los archivados.

## Alternativas consideradas

- **Hard delete con cascada a payments**: descartada, viola
  integridad y trazabilidad de cobros históricos.
- **Bloquear edición total de planes en uso**: descartada, demasiado
  rígido para el flujo administrativo (correcciones tipográficas,
  ajustes finos). El usuario prefirió advertencia visible + responsabilidad
  del admin.
- **Versionado automático en cada edición**: descartada como default;
  generaría ruido y rompería la mental model de "un plan = una versión".
  La acción "Duplicar como nueva versión" cubre el caso explícitamente.
- **Filtrar archivados dentro de `resolveEffectiveSectionFeePlan`**:
  descartada porque rompe la atribución histórica de payments a planes.

## Consecuencias

Positivas:

- Trazabilidad: ningún plan con cobros se borra accidentalmente.
- UX coherente con la regla `15-entity-crud-completeness` (CRUD completo
  con borrado seguro).
- Admin tiene 4 caminos claros: editar, duplicar versión, archivar,
  eliminar (cuando aplica).
- El alumno y resolutores de monto solo ven planes activos, sin riesgo
  de seleccionar un plan archivado.

Riesgos / follow-ups:

- `mapSectionFeePlanRow` ahora incluye `archivedAt`; loaders existentes
  fueron migrados a seleccionar `archived_at` en sus `select`. Cualquier
  loader nuevo debe replicar ese campo.
- Auditoría: `section_fee_plan_archived` / `_restored` / `_deleted` son
  nuevos `action` en `system_config_audit`. No requieren migración:
  `recordSystemAudit` ya acepta `action` libre.
- Tests: cubiertos hard delete bloqueado (`IN_USE`), archive, restore,
  helper puro `computeSectionFeePlansInUseIds`, y comportamiento del
  editor (badges, toggles, advertencia, duplicar). Sigue valiendo el
  contrato del upsert original.
- Migración 055: solo `ADD COLUMN IF NOT EXISTS`, idempotente; no rompe
  filas existentes (todos los planes existentes nacen con
  `archived_at = NULL`).
