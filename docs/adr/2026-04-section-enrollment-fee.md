# ADR — Matrícula a nivel de sección

Fecha: 2026-04
Estado: Aceptada
Relacionados: `2026-04-section-fee-plans-currency-and-proration.md`,
`12-supabase-app-boundaries.mdc`, `15-entity-crud-completeness.mdc`.

## Contexto

Hasta ahora, cada plan de cuotas (`public.section_fee_plans`) tenía un boolean
`charges_enrollment_fee` que solo declaraba si la sección "cobra matrícula",
pero el **monto real** salía de un valor global en `system.properties`
(`billing.enrollment_fee.default`, hoy `0`). En la práctica la administración
no podía definir cuánto cobra de matrícula cada sección y el dashboard de
alumnos solo mostraba un badge sin importe.

El producto necesita poder fijar **monto de matrícula por sección**, en la
misma moneda que la cuota mensual del plan vigente, y que ese importe sea
visible en superficies de alumno/admin.

## Decisión

1. La matrícula se modela **a nivel de sección** (`public.academic_sections`),
   no del plan de cuotas: una sección tiene un único monto de matrícula,
   independiente del historial de cuotas mensuales.
2. Se agrega la columna `academic_sections.enrollment_fee_amount NUMERIC(12,2)
   NOT NULL DEFAULT 0`, con `CHECK (enrollment_fee_amount >= 0)`.
   - `0` (default) ⇒ la sección **no cobra matrícula**.
   - `> 0` ⇒ la sección cobra ese importe en la moneda del plan vigente.
3. La moneda de la matrícula **reusa** la `currency` del plan de cuotas
   efectivo. Se evita duplicar campo: matrícula y cuota mensual de la misma
   sección comparten moneda por construcción.
4. Se elimina `section_fee_plans.charges_enrollment_fee`. La señal real de
   "cobra matrícula" es `enrollment_fee_amount > 0` en la sección. Esto evita
   estados inconsistentes (flag `true` con monto `0` o viceversa).
5. Se elimina `billing.enrollment_fee.default` de `system.properties` y el
   campo `enrollmentFeeDefault` de `getBillingTerms`: ya no hay un default
   global aplicable.
6. La RPC `admin_cohort_collections_bulk` (migración `057`) se redefine en la
   misma migración `058` para exponer `academic_sections.enrollment_fee_amount`
   en el payload `sections` y dejar de leer la columna eliminada
   `section_fee_plans.charges_enrollment_fee` en el payload `plans`.

## Opciones consideradas

- **A — Agregar `enrollment_fee_amount` al plan de cuotas** (`section_fee_plans`).
  Descartada: la matrícula históricamente no cambia con la misma frecuencia que
  la mensualidad y duplicaría datos por cada vigencia. Además genera la
  pregunta "¿qué monto de matrícula uso si tengo varios planes vigentes?".
- **B — Mantener el flag y agregar también el monto** en el plan.
  Descartada: dos formas de expresar lo mismo, riesgo de inconsistencia.
- **C (elegida) — Monto a nivel de sección, sin moneda propia**, dropear el
  flag, eliminar la propiedad global.

## Consecuencias

Positivas:
- Una sola fuente de verdad para "esta sección cobra matrícula y cuánto".
- La moneda queda alineada con la cuota mensual del plan vigente.
- Admin puede editar el importe directamente desde la pestaña "Cuotas" de la
  sección (`AcademicSectionEnrollmentFeeEditor`).

Riesgos / follow-ups:
- Las secciones existentes quedan con `enrollment_fee_amount = 0` tras la
  migración (el flag previo no implicaba un monto real, ya que el default
  global era `0`). Admin debe completar el monto cuando aplique.
- Si en algún momento se necesita prorrateo de matrícula o moneda distinta a
  la mensual, requeriría otro ADR.
- La superficie de "matrícula del alumno" (`profiles.enrollment_fee_exempt`,
  `last_enrollment_paid_at`, panel admin) sigue funcionando igual: ahora
  además puede mostrar el importe esperado por sección.

## Tests / observabilidad

- Tests pure-helpers actualizados: `buildStudentMonthlyPaymentsRow`,
  `buildSectionCollectionsView`, `formatSectionCollectionsExport`,
  `loadAdminSectionCollectionsView`, `loadAdminCohortCollectionsOverview`,
  `resolveStudentPaymentSlot`, `resolveEffectiveSectionFeePlan`,
  `computeSectionFeePlansUsage`.
- Test de UI nuevo: `AcademicSectionEnrollmentFeeEditor`.
- Auditoría: `recordSystemAudit` en la nueva acción
  `setSectionEnrollmentFeeAmount` con `action`
  `academic_section_enrollment_fee_updated`.
