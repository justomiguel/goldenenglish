# ADR: Plan de cuotas por sección y vista mensual estilo matriz para el alumno

Fecha: 2026-04-17
Estado: Aceptado

## Contexto

Hoy la pantalla del alumno en `/dashboard/student/payments` muestra una lista
plana de filas en `public.payments` (uno por mes/año) y un formulario suelto
para subir un comprobante. El monto de la cuota lo escribe el propio alumno y
no hay vínculo con la **sección académica** en la que está matriculado: cada
sección tampoco declara cuál es su **cuota mensual**, **cuántos pagos** se
cobran al año, ni si **paga matrícula**.

Esto produce dos problemas:

1. La UX del alumno es pobre: no puede ver de un vistazo qué meses ya pagó,
   cuáles tiene pendientes, ni cuál es el del mes en curso.
2. El monto de la cuota lo decide el alumno al cargar el comprobante, lo que
   genera errores y discusiones administrativas. Debería venir definido por la
   institución desde el admin de la sección.

El usuario pidió que la pantalla se parezca a la matriz de asistencia
(`SectionAttendanceMatrix`), donde se ve **una sola fila por sección con todos
los meses** del período, con foco en el mes en curso, y la opción de hacer
click en cualquier mes para enfocarlo y subir el comprobante de ese mes.

## Decisión

1. Introducir una nueva tabla `public.section_fee_plans` con vigencias
   (`effective_from_year, effective_from_month`) que almacena por sección:
   - `monthly_fee` (NUMERIC).
   - `payments_count` (cantidad de cuotas mensuales del período, 1..24).
   - `charges_enrollment_fee` (BOOLEAN, indica si esta sección cobra matrícula).
   - `period_start_month` y `period_start_year` (mes/año del primer pago del
     período cubierto por este plan).
   - Auditoría mínima (`created_at, updated_at, updated_by`).
2. Política RLS: lectura para alumno enrolado, su tutor, profesor y admin;
   escritura solo admin (consistente con `academic_sections`).
3. La matrícula sigue gestionándose por **`billing_invoices`** existente; el
   campo `charges_enrollment_fee` solo expone explícitamente esa propiedad de
   la sección al admin y a la UI (futuro automatizado de facturación). No se
   mezcla con el strip mensual.
4. El alumno verá una pantalla nueva con **una fila por sección activa** con
   12 celdas (los 12 meses del año) ordenadas, foco visual en el mes en curso
   y celdas deshabilitadas para los meses fuera del período del plan. Click en
   una celda enfoca el mes y abre un card que reusa `StudentPaymentForm`,
   con el monto pre-cargado desde el plan (con descuento de beca aplicado).
5. La acción `submitStudentPaymentReceipt` se extiende para aceptar
   `sectionId` opcional y, si no existe el slot `(student, year, month)` en
   `payments`, lo crea con `amount = plan.monthly_fee` (después de beca). El
   monto que viene del cliente se ignora cuando hay plan vigente para evitar
   discrepancias.
6. El editor de admin de sección suma una pestaña/sección **Plan de cuotas**
   con CRUD completo (regla `15-entity-crud-completeness`).

## Alternativas consideradas

- **Columnas en `academic_sections`** (sin tabla nueva): más simple, pero no
  preserva el historial de cambios de cuota durante el año. Descartada.
- **Una sola fila sumada por mes** cuando el alumno tiene varias secciones:
  pierde claridad de qué se está pagando por sección. Descartada.
- **Renderizar solo los meses del período** (omitir los 12 meses): produce
  filas de ancho variable y rompe la analogía visual con la matriz de
  asistencia. Descartada.

## Consecuencias

Positivas:

- Una sola fuente de verdad para la cuota mensual de cada sección.
- UX clara y consistente con el patrón ya conocido de la matriz de asistencia.
- El alumno puede subir comprobantes incluso si admin no creó el slot todavía.

Riesgos / follow-ups:

- Las secciones existentes no tienen plan: hasta que admin lo defina, el
  strip mostrará los meses como “sin plan” y el card de upload pedirá al
  admin que cargue el plan.
- La automatización de matrícula (auto-generar `billing_invoices` cuando
  `charges_enrollment_fee = true`) queda fuera de esta PR; la flag se
  expone como contrato y se podrá usar después.
- Cobertura: nuevos módulos en `src/lib/billing/` cubiertos por tests
  unitarios; nuevos componentes con tests de comportamiento.
- Analítica: se mantiene el evento existente
  `paymentReceiptSubmittedStudent`; se agrega `section_id` en metadata.
