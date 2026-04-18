# ADR: Subida idempotente de comprobantes de pago

Fecha: 2026-04-18
Estado: Aceptado

## Contexto

`submitStudentPaymentReceipt` y `submitParentPaymentReceipt`
(`src/app/[locale]/dashboard/{student,parent}/payments/actions.ts`) cargan el
comprobante mensual del alumno. La pieza central es
`resolveStudentPaymentSlot` (`src/lib/billing/`), que localiza —o crea— la
fila de `public.payments` para `(student_id, section_id, month, year)` antes
de subir el archivo a Storage y actualizar `receipt_url` / `amount`.

El flujo realiza **`SELECT … maybeSingle()` y, si no hay fila, `INSERT`**.
Hay dos formas conocidas de pegar la misma combinación a la vez:

1. **Doble click / reintento de red** del propio alumno o tutor.
2. **Dos tutores** del mismo alumno presionando "Subir comprobante" para la
   misma sección y mes.

Hoy, el segundo intento concurrente choca contra el índice parcial único
`payments_student_section_period_uidx` (`student_id, section_id, month, year`
con `section_id IS NOT NULL`) introducido en
`supabase/migrations/054_section_fee_plans.sql`, recibe el error de Postgres
`unique_violation = 23505`, y devolvemos `pe.uploadFailed` ("Could not upload
the file. Try again."). Es engañoso: la fila se creó, sólo perdimos la
carrera. Además, el archivo de Storage del segundo intento queda huérfano si
el usuario no reintenta.

## Decisión

1. **Mantener el contrato de unicidad en BD como fuente de verdad.** Los
   índices parciales únicos
   `payments_student_section_period_uidx (student_id, section_id, month, year)
   WHERE section_id IS NOT NULL`
   y
   `payments_student_legacy_period_uidx (student_id, month, year)
   WHERE section_id IS NULL`
   ya cubren el criterio de aceptación 1. Se añade un test de migración
   (`src/__tests__/db/payments_unique_period_migration.test.ts`) que **fija
   el contrato**: si una migración futura los borra, el test falla.
2. **Implementar la semántica de `INSERT … ON CONFLICT … DO NOTHING; SELECT`
   en la capa de aplicación**, no como RPC nueva. En
   `resolveStudentPaymentSlot`, cuando el `INSERT` falla con código `23505`,
   re-leemos la fila que escribió el peer concurrente y continuamos como si
   `SELECT` la hubiera devuelto desde el inicio:
   - Si quedó en `pending`, el caller hace su `UPDATE` de `receipt_url` /
     `amount` sobre la **misma** fila (el efecto "DO UPDATE" de la regla
     queda en el `UPDATE` posterior del action, idempotente).
   - Si la otra carrera ya marcó la fila como `approved` / `rejected` /
     `exempt`, devolvemos `already_processed` (no pisamos comprobantes
     resueltos).
   - Para errores distintos a `23505`, mantenemos `upload_failed`.
3. **No introducir RPC SQL `submit_payment_slot`** ni cambiar la firma de
   `submitStudentPaymentReceipt`. Las superficies (componentes, hooks,
   diccionarios `pe.alreadyProcessed` / `pe.uploadFailed`) no cambian.

## Alternativas consideradas

- **`upsert({...}, { onConflict: "student_id,section_id,month,year" })` de
  Supabase.** Funciona, pero los índices únicos son **parciales**
  (`WHERE section_id IS NOT NULL` / `WHERE section_id IS NULL`). PostgREST
  resuelve `on_conflict` por columnas y delega la inferencia a Postgres,
  que necesita el predicado coincidente para elegir el índice parcial.
  Es frágil ante futuras migraciones y opaco al lector. La forma
  `INSERT + recuperación 23505` es explícita, testeable sin Postgres real
  y respeta la regla de límites Supabase (`12-supabase-app-boundaries.mdc`)
  sin abrir un nuevo path de PostgREST.
- **RPC SQL dedicada con `INSERT … ON CONFLICT … DO UPDATE RETURNING`.**
  Más cercano al texto literal del criterio de aceptación, pero introduce
  un contrato BD nuevo (RPC + `SECURITY DEFINER` o políticas adicionales)
  para una operación que ya cabe en una server action. Lo descartamos
  hasta tener más casos que lo justifiquen.
- **Hacer determinístico el path de Storage** (`<userId>/<paymentId>.<ext>`
  con `upsert: true`) para evitar archivos huérfanos en la carrera. Mejora
  real, pero abre cuestiones aparte (sobrescribir un comprobante anterior
  que la admin ya descargó, conservar histórico, etc.). Queda fuera del
  alcance de esta ADR; ver "Riesgos / follow-ups".

## Casos de borde explícitos

### Múltiples comprobantes legítimos en una misma cuota

El modelo actual es **una celda = un pago** (una fila en `payments` por
`(student, section, month, year)`). El criterio de aceptación pregunta qué
pasa si el alumno paga la mitad por transferencia y la otra por depósito.

**Decisión:** se mantiene "una celda = un pago" en esta PR. La unicidad en
BD lo garantiza, y la idempotencia evita falsos errores cuando es el mismo
comprobante reintentado. Soportar múltiples comprobantes por cuota requiere
una entidad hija (p. ej. `payment_attachments`) y revisar reportes,
descargas y auditoría: queda como follow-up de producto, no se introduce
silenciosamente.

### Carrera entre dos tutores

Dos tutores que pulsen "Subir" simultáneamente para el mismo
`(student, section, month, year)` ya **no** rompen: uno de los dos `INSERT`
gana, el otro recupera la misma fila y sigue. **Last writer wins** sobre
`receipt_url` / `amount`: la admin ve el comprobante del segundo en
`payments`, ambos eventos quedan registrados en `user_events`
(`paymentReceiptSubmittedStudent` / `…Parent`) para auditoría —y
`recordSystemAudit` no aplica porque es acción de usuario, no de staff
(`08-analytics-observability.mdc`).

### Archivos de Storage huérfanos en reintentos

El path de upload sigue incluyendo `Date.now()` (`<userId>/<paymentId>-<ts>.<ext>`),
así que un reintento concurrente o tras error puede dejar archivos en
`payment-receipts` que `payments.receipt_url` no referencia. **Conocido,
fuera de alcance.** Lo recogemos como follow-up para una limpieza
periódica (cron) o para hacer el path determinístico cuando definamos la
política de histórico de comprobantes.

## Consecuencias

Positivas:

- Idempotencia real: doble click, reintento o dos tutores ya no producen
  errores falsos ni duplicados en `payments`.
- El contrato BD queda **fijado por test** (`054` migration test): no se
  pierde por una migración futura sin que CI grite.
- Cero superficie nueva para el cliente (sin nuevas claves i18n, sin RPC
  nueva, sin cambios en hooks).

Riesgos / follow-ups:

- Receptor "last writer wins" para dos tutores legítimos: si producto pide
  conservar ambos comprobantes, abrir `payment_attachments` con su propia
  ADR.
- Storage huérfano en reintentos: planificar limpieza periódica o
  determinismo del path en una ADR dedicada cuando se acuerde la política
  de histórico.
- La acción de **padre** (`/parent/payments/actions.ts`) no inserta filas
  hoy (sólo actualiza `pending`), así que no requiere cambios. Si en el
  futuro se le permite crear el slot, debe pasar por
  `resolveStudentPaymentSlot` para heredar la misma idempotencia.

## Referencias

- `src/lib/billing/resolveStudentPaymentSlot.ts`
- `src/app/[locale]/dashboard/student/payments/actions.ts`
- `supabase/migrations/054_section_fee_plans.sql`
- Tests:
  `src/__tests__/lib/billing/resolveStudentPaymentSlot.test.ts`,
  `src/__tests__/db/payments_unique_period_migration.test.ts`
- Reglas: `02-testing-tdd.mdc`, `08-analytics-observability.mdc`,
  `10-engineering-governance.mdc`, `12-supabase-app-boundaries.mdc`,
  `13-postgrest-pagination-bounded-queries.mdc`.
