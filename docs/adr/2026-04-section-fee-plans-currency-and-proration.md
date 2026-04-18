# ADR: Plan de cuotas — moneda + prorrateo + modelo simplificado

Fecha: 2026-04-18
Estado: Aceptado
Reemplaza parcialmente: `2026-04-section-fee-plans-and-monthly-strip.md`

## Contexto

El primer ADR del plan de cuotas (`2026-04-section-fee-plans-and-monthly-strip.md`)
modeló cada plan con: `monthly_fee`, `payments_count`, `period_start_year`,
`period_start_month`, `effective_from_*` y `charges_enrollment_fee`.

Tras revisión con producto:

1. La cantidad de cuotas y el "período" del plan **se confunden** con el rango
   real de la sección académica. La sección ya tiene `starts_on` / `ends_on`
   (`public.academic_sections`) que define cuándo dicta clase. Duplicarlo en el
   plan generaba modelos redundantes y errores de carga ("plan dice 10 pagos,
   pero la sección termina en mes X").
2. Falta **moneda**: el campo `monthly_fee` se asumía USD del instituto, pero
   en la práctica las secciones pueden cobrar en USD, ARS, CLP u otras según
   convenios y país de la familia.
3. El **prorrateo** del primer mes de un alumno que se incorpora tarde se
   estaba dejando "para después". El usuario lo pidió explícito: si en el mes
   hay 4 clases y el alumno solo tuvo 1 disponible (porque entró después de
   las primeras 3), paga 1/4 de la cuota mensual.

## Decisión

1. **Simplificar** `public.section_fee_plans` a:
   - `monthly_fee NUMERIC(12, 2) >= 0`
   - `currency TEXT` (ISO 4217, validado por regex `^[A-Z]{3}$`, default `USD`)
   - `effective_from_year SMALLINT`, `effective_from_month SMALLINT`
   - `charges_enrollment_fee BOOLEAN`
   - `archived_at TIMESTAMPTZ`
   - Auditoría (`created_at`, `updated_at`, `updated_by`)
   - **Se eliminan** `payments_count`, `period_start_year`, `period_start_month`.
2. El **rango visible** del strip mensual del alumno deja de derivarse del
   plan: ahora viene de **`academic_sections.starts_on` / `ends_on`** que ya
   existe. Un mes está "fuera de período" cuando ninguna clase del schedule
   semanal cae dentro de la intersección (rango sección ∩ mes calendario ∩
   rango enrolment del alumno).
3. **Moneda**: se elige string ISO 4217 abierto (no enum, no catálogo cerrado)
   para no acoplar despliegues a cambios de catálogo. La UI muestra dropdown
   curado en cliente (USD, ARS, CLP, UYU, EUR, BRL, MXN), pero la BD acepta
   cualquier código de 3 letras mayúsculas.
4. **Prorrateo del mes**:
   - Total de clases del mes = ocurrencias del `schedule_slots` semanal de la
     sección que caen entre `max(section.starts_on, mes.start)` y
     `min(section.ends_on, mes.end)`.
   - Disponibles para el alumno = ocurrencias entre
     `max(section.starts_on, enrolment.created_at, mes.start)` y
     `min(section.ends_on, mes.end)`.
   - `monto = monthly_fee × (disponibles / total)` cuando `total > 0`.
   - Si `disponibles == 0` el mes queda "fuera de período" (no se ofrece pago).
   - La beca (`student_scholarships.discount_percent`) se aplica **después**
     del prorrateo (ambos son factores conmutativos, pero el orden documenta
     que beca actúa sobre el monto efectivo del mes).
5. La **moneda** del recibo del alumno se hereda del plan vigente al momento
   del recibo y queda registrada como metadata del evento de analítica
   (`paymentReceiptSubmittedStudent`). La columna `payments.amount` sigue
   numérica y la conversión multi-moneda (si llega a hacer falta) queda fuera
   de alcance — hoy cada alumno paga en la moneda de su sección.

## Alternativas consideradas

- **Mantener `payments_count` y `period_start_*`**: rechazada por
  redundancia con `academic_sections.starts_on/ends_on` y porque la duración
  del período no la decide el plan, la decide la sección.
- **Enum/catálogo cerrado de moneda**: rechazada porque introduce despliegues
  cada vez que aparece una moneda nueva (UYU, BOB, etc.) sin valor real.
- **Prorrateo por asistencia**: rechazada en este ADR — la lógica del prorrateo
  busca cobrar lo que el alumno tuvo *disponible*, no lo que asistió. Faltar
  no descuenta cuota (asistencia es otra discusión pedagógica).
- **Prorrateo manual** (admin elige el factor): rechazada porque generaba
  trabajo administrativo recurrente y errores. Se preserva como follow-up: si
  hace falta, se podría sumar override por `payments` row, pero no por defecto.

## Consecuencias

Positivas:

- Un único concepto de "rango temporal" de la sección.
- Cuota correcta para alumnos que entran tarde sin intervención manual.
- Soporte multi-moneda real para Latinoamérica.
- Modelo de datos más chico, más fácil de entender en admin.

Riesgos / follow-ups:

- **Migración**: la 054 está sin aplicar a producción → se acepta DROP
  destructivo de las 3 columnas en la 056. Si en el futuro hubiese datos
  reales, habría que crear una migración con preservación.
- **Calendarización**: el cálculo de "clases del mes" depende de
  `schedule_slots` (días de la semana). Cambios de aula puntuales (1 clase
  movida) no se descuentan hoy. Suficiente para el MVP del prorrateo.
- **Multi-moneda contable**: no hay conversión global ni reportes
  consolidados — el admin verá los recibos en la moneda de la sección.
- **Tests**: hay que actualizar tests existentes (`buildStudentMonthlyPaymentsRow`,
  `resolveEffectiveSectionFeePlan`, `computeSectionFeePlansUsage`, editor) y
  agregar tests puros para `countSectionMonthlyClasses` y
  `prorateMonthlyFee`.
- **Analítica**: el evento `paymentReceiptSubmittedStudent` suma metadata
  `currency` y `prorate_factor` (numerador/denominador) cuando aplique.
