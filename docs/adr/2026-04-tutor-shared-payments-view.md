# ADR: Vista financiera compartida tutor ↔ alumno y carga de comprobantes en nombre del alumno

Fecha: 2026-04-18
Estado: Aceptado

## Contexto

El producto tenía dos pantallas de pagos paralelas:

- **Alumno** (`/dashboard/student/payments`) con la **tira mensual por sección**
  (`StudentMonthlyPaymentsStrip`) introducida por la ADR
  `2026-04-section-fee-plans-and-monthly-strip`. Esta es la fuente de verdad de
  la cuota (`section_fee_plans.monthly_fee`) y de la creación idempotente del
  slot (`resolveStudentPaymentSlot`).
- **Tutor / padre** (`/dashboard/parent/payments`) con un formulario manual
  (`ParentPaymentForm`) que pedía mes/año/monto y subía un comprobante a un
  path desacoplado (`payment-receipts/{tutorId}/...`).

Las dos vistas no compartían lógica: el tutor escribía a mano el monto, no veía
qué meses estaban pagados o pendientes y los comprobantes acababan en una ruta
distinta de los que sube el alumno (que viven bajo
`payment-receipts/{studentId}/...` y son los únicos para los que
`studentReceiptSignedUrl` puede firmar URL).

El producto pidió que el **tutor vea exactamente lo mismo que el alumno** y
pueda subir el comprobante en su nombre. Surgieron dos preguntas explícitas:

1. **Privacidad** — el alumno mayor de edad debe poder revocar la visibilidad
   financiera al tutor sin perder el vínculo (que sigue gobernando otras
   relaciones del producto).
2. **Trazabilidad** — registrar quién subió cada comprobante (tutor vs alumno)
   para soporte y auditoría.

## Decisión

1. **Vista única, dos entradas.** Se reutiliza `StudentMonthlyPaymentsStrip` /
   `StudentMonthlyPaymentFocus` desde la pantalla del tutor. Los componentes se
   parametrizan con `studentId` y `submitAction` (server action inyectada),
   para que el tutor llame a `submitTutorPaymentReceipt` y el alumno siga
   llamando a `submitStudentPaymentReceipt`. Se elimina `ParentPaymentForm` y
   sus tests; deja de existir la vía “monto a mano”.
2. **Resolución de slot compartida.** El nuevo
   `resolveStudentPaymentSlot(supabase, { studentId, sectionId, month, year })`
   centraliza la creación idempotente (`payments` por `(student, year, month)`
   o `(student, section, year, month)` cuando hay plan), aplicando el monto del
   plan vigente. Tanto el alumno como el tutor lo invocan desde sus actions:
   tutores y alumnos llegan al **mismo** registro, sin duplicados.
3. **Storage canónico bajo `{studentId}/`.** El tutor sube siempre a
   `payment-receipts/{studentId}/{paymentId}-{ts}.{ext}`. Esto preserva
   `studentReceiptSignedUrl` (que valida el prefijo `userId/`) y permite que la
   misma URL firmada sirva al alumno y al tutor sin lógica duplicada.
4. **Trazabilidad.** Reutilizamos `payments.parent_id` como “quién subió”:
   queda en `NULL` cuando lo sube el alumno y con el `auth.uid()` del tutor en
   sus uploads. Además se emite `paymentReceiptSubmittedTutor` en
   `user_events` con `student_id`, mes/año y `section_id` opcional.
5. **Privacidad “default-allow + opt-out” para alumnos mayores.** Se extiende
   `public.tutor_student_rel` con dos columnas nullables:
   `financial_access_revoked_at TIMESTAMPTZ` y
   `financial_access_revoked_by UUID REFERENCES profiles(id)`.
   - El menor de edad **no** puede modificarlas (validado en app y en RLS).
   - El alumno mayor sí puede, vía
     `setTutorFinancialAccess(intent: revoke|restore)` desde su perfil.
   - El admin sigue pudiendo intervenir por las políticas RLS existentes para
     `tutor_student_rel`.
6. **RLS como puerta real.**
   - Función `SECURITY DEFINER`
     `tutor_can_view_student_finance(tutor_id, student_id)` que devuelve TRUE
     solo cuando hay vínculo y `financial_access_revoked_at IS NULL`.
   - Políticas en `payments` (SELECT/INSERT/UPDATE) y en `storage.objects` para
     el bucket `payment-receipts` que admiten al tutor solo si la función
     anterior devuelve TRUE. El alumno y el admin mantienen sus reglas
     existentes.
   - Política `tutor_student_rel_update_student_adult` para que el alumno mayor
     pueda actualizar sus propias filas de privacidad.
7. **UI mínima de privacidad.** El perfil del alumno mayor con tutores
   enlazados muestra `TutorFinancialAccessSection` con un botón por tutor para
   revocar / restaurar. Si revoca, el tutor sigue viéndolo en su picker pero
   con un banner “este alumno gestiona sus propios pagos”.
8. **Analítica adicional.** Nuevos `event_type` en
   `eventConstants.ts` / `UserEventTypeName`:
   `tutorFinancialAccessRevokedByStudent` y
   `tutorFinancialAccessRestoredByStudent`. La acción del tutor sigue dejando
   `paymentReceiptSubmittedTutor`. No usamos `recordSystemAudit` aquí porque
   no es una mutación de admin, sino del propio alumno sobre su propia fila.

## Alternativas consideradas

- **Mantener `ParentPaymentForm` y sumarle la tira.** Habría dejado dos
  vías de upload (la legacy “monto a mano” y la nueva con plan), riesgo de
  divergencia en montos y comprobantes en dos prefijos de storage. Descartada.
- **`opt-in`: el tutor solo ve si el alumno mayor activa el acceso.** Coincide
  con la realidad cultural del producto (familias que ya gestionan los pagos
  por defecto), pero rompería los flujos actuales de tutores que ya pagan por
  sus hijos adultos. Decidido **default-allow + opt-out** explícito,
  documentado en este ADR como contrato.
- **Subir comprobantes a `{tutorId}/`.** Habría obligado a generalizar
  `studentReceiptSignedUrl` (validación de prefijo, RLS Storage extra). Más
  complejo y con peor UX para el alumno (URL distinta según quién subió).
  Descartada.

## Consecuencias

Positivas:

- Una sola pantalla de pagos para el alumno y el tutor, alimentada por
  `section_fee_plans` y por la misma resolución de slot.
- Comprobantes en un prefijo canónico, accesibles al alumno, al tutor y al
  admin con la misma URL firmada.
- La privacidad del alumno mayor queda explícita y aplicada por RLS, no solo
  por convención de UI.
- Trazabilidad simple: `payments.parent_id` + analítica por tipo de evento.

Riesgos / follow-ups:

- La columna `parent_id` ya existía en `payments`; vuelve a usarse como flag
  de “quién subió”, no como “tutor responsable de la cuota”. Si en el futuro
  hace falta separar “tutor responsable de pago” de “quién subió cada
  comprobante”, conviene una columna nueva (`uploaded_by`).
- Se elimina la URL antigua `/dashboard/parent/payments` legacy y se reemplaza
  por la nueva. Tutores con accesos directos verán el cambio inmediato.
- Si el alumno mayor revoca y luego el admin necesita ver los pagos del tutor,
  el admin sigue pudiendo (RLS de admin no se toca); el bloqueo es solo para
  el tutor.

## Cobertura y observabilidad

- Tests unitarios: migración (`055_tutor_financial_access`), helpers de
  dominio (`resolveTutorStudentLink`, `listTutorStudentsWithFinance`), action
  del tutor y del alumno mayor, componentes nuevos (`ParentPaymentsEntry`,
  `TutorFinancialAccessSection`).
- Eventos de producto:
  `paymentReceiptSubmittedTutor`,
  `tutorFinancialAccessRevokedByStudent`,
  `tutorFinancialAccessRestoredByStudent`.
- i18n: claves nuevas en `dashboard.parent.paymentsPickerLabel`,
  `dashboard.parent.paymentsAccessRevokedTitle/Body`,
  `dashboard.myProfile.tutorAccess*` y `actionErrors.tutorFinancialAccess.*`.
