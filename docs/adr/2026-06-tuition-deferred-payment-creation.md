# ADR: Creación diferida del pago de cuotas mensuales (sin pagos "fantasma")

Fecha: 2026-06-25
Estado: Aceptado

## Contexto

El flujo de cuotas mensuales de instituto creaba (o promovía) la fila de
`public.payments` para una ranura `(student, section, month, year)` **al iniciar
el checkout** del gateway. Cuando el alumno (o su tutor) abría Mercado Pago o
Flow y **no completaba** el pago —lo abandonaba o el gateway lo rechazaba—,
quedaba una fila `pending` en `payments`. Esa fila aparecía en la cola de
aprobación del admin como un pago "por aprobar" que nunca ocurrió: un pago
**fantasma**, idéntico al problema ya resuelto en eventos
(`2026-06-events-deferred-payment-creation.md`).

Comportamiento esperado por el negocio (mismo que en eventos):

- **Gateways online (Mercado Pago / Flow):** sólo debe existir una fila de pago
  si el gateway aprobó el cobro, y esa fila debe quedar **aprobada
  automáticamente** (transparente) vía webhook / reconciliación de retorno. Nada
  que el admin tenga que aprobar a mano.
- **Transferencia bancaria:** sólo se genera un pago `pending` (para revisión
  manual del admin) cuando el alumno/tutor **sube un comprobante**.

## Decisión

Adoptar **creación diferida** del registro de pago de cuota. La fila de
`payments` deja de crearse al iniciar el checkout y se materializa según el
medio.

1. **El checkout del gateway se vincula a la ranura de facturación, no a una
   fila de pago.** La `external_reference` (MP) y el `commerceOrder` (Flow) pasan
   del `payments.id` (UUID) a una referencia de ranura
   `tuition:<studentId>:<sectionId>:<year>:<month>[:<parentId>]`
   (`buildTuitionGatewayReference`). `parseMonthlyGatewayReference` entiende
   **ambos** formatos para reconciliar checkouts legacy en vuelo tras el deploy.

2. **`start{MercadoPago,Flow}MonthlyPaymentCore` validan sin crear fila.**
   Sustituyen `resolveStudentPaymentSlot` (que materializaba la fila) por
   `validateStudentSectionMonthlySlot`, que sólo verifica matrícula activa, plan
   de cuota efectivo, período/exención y ventana de pago anticipado. El monto y
   la moneda son canónicos del plan de la sección, nunca del cliente/gateway.

3. **Reserva de `commerceOrder` de Flow por ranura.** Se generaliza
   `payment_flow_checkout_refs` para no exigir `payment_id`; el RPC
   `payment_flow_reserve_commerce_ref_slot`
   (`159_tuition_defer_payment_creation.sql`) reserva una referencia ligada a la
   ranura. `reservePaymentFlowCommerceReferenceForSlot` envuelve el RPC.

4. **El pago se materializa como `approved` en la finalización.**
   `finalizeMercadoPagoPayment` / `finalizeMonthlyPaymentFromFlowGateway`
   despachan, según el tipo de referencia, a `finalizeMercadoPagoMonthlySlot` /
   `finalizeFlowMonthlySlot`, que llaman a `upsertApprovedMonthlyPaymentCore`.
   Ese core crea (o promueve `pending`/`rejected` →) la fila como `approved`, con
   auditoría financiera y **rollback** si la auditoría falla (regla 19: ningún
   "pago sin auditoría"). Es **idempotente** ante webhook duplicado / retorno +
   webhook simultáneos: ante `unique_violation` re-lee y promueve la fila
   ganadora.

5. **La transferencia materializa la fila al subir comprobante.**
   `resolveStudentPaymentSlot` se conserva para el flujo de comprobante: reusa la
   validación compartida y materializa la fila `pending` para revisión.

6. **Blindaje del admin.** `reviewPayment` rechaza (`gatewayManaged`) cualquier
   intento manual sobre pagos con `gateway_provider` no nulo: los pagos de
   gateway no se aprueban/rechazan a mano. Defensa en profundidad además de la
   UI.

## Alternativas consideradas

- **Mantener creación temprana y limpiar fantasmas con un job / TTL.** Requiere
  un cron que distinga abandono real de checkout lento, sigue mostrando filas
  `pending` falsas entre medio y agrega estado a conciliar. La creación diferida
  elimina el problema de raíz.
- **Crear la fila `pending` y actualizarla desde el gateway.** Es el modelo
  previo; el abandono (sin webhook de rechazo) deja la fila colgada. Descartado.
- **`upsert` de PostgREST con `onConflict`.** El upsert se implementa en la capa
  de aplicación (select → insert con recuperación de carrera) para no depender de
  inferencia de índices y respetar `12-supabase-app-boundaries.mdc`.

## Casos de borde

- **Webhook duplicado / retorno + webhook:** `upsertApprovedMonthlyPaymentCore`
  recupera la fila ganadora si pierde la carrera del `INSERT`
  (`unique_violation`), garantizando una sola fila por ranura.
- **Checkouts legacy en vuelo:** referencias `payments.id` (UUID) previas al
  deploy siguen reconciliando por la rama `kind: "payment"`.
- **RLS en el retorno (sin fila previa):** los resolvers
  (`resolveMercadoPagoMonthlyPaymentReturnPage` /
  `resolveFlowMonthlyPaymentReturnPage`) saltan la verificación de visibilidad
  previa para referencias de ranura (aún no hay fila); finalizan vía admin y
  validan pertenencia **post-finalización** re-leyendo con el cliente del
  usuario.
- **Pagos fantasma preexistentes:** no se migran/borran automáticamente; la UI
  no permite borrar pagos con `gateway_provider`, la limpieza es por BD.

## Consecuencias

Positivas:

- No se generan pagos fantasma: un checkout abandonado/rechazado no deja rastro
  en `payments`.
- Los pagos online quedan aprobados de forma transparente; la cola del admin
  sólo contiene transferencias con comprobante.
- Monto/moneda canónicos derivados del plan de la sección, no del gateway.
- Modelo de ciclo de vida **consistente** entre eventos y cuotas.

Riesgos / follow-ups:

- Fantasmas históricos quedan en BD hasta limpieza manual.
- Múltiples comprobantes por ranura requerirían entidad hija y su propia ADR.

## Referencias

- Migración: `supabase/migrations/159_tuition_defer_payment_creation.sql`
- Helpers: `src/lib/billing/parseMonthlyGatewayReference.ts`,
  `src/lib/billing/validateStudentSectionMonthlySlot.ts`,
  `src/lib/billing/upsertApprovedMonthlyPaymentCore.ts`
- Inicio: `src/lib/billing/startMercadoPagoMonthlyPaymentCore.ts`,
  `src/lib/billing/startFlowMonthlyPaymentCore.ts`,
  `src/lib/payment-gateways/flow/reservePaymentFlowCommerceReference.ts`
- Finalización: `src/lib/billing/finalizeMercadoPagoPayment.ts`,
  `src/lib/billing/finalizeMonthlyPaymentFromFlowGateway.ts`,
  `src/lib/billing/finalizeMercadoPagoMonthlySlot.ts`,
  `src/lib/billing/finalizeFlowMonthlySlot.ts`,
  `src/lib/billing/lookupPaymentRowForFlowFinalize.ts`
- Retorno: `src/lib/billing/resolveMercadoPagoMonthlyPaymentReturnPage.ts`,
  `src/lib/billing/resolveFlowMonthlyPaymentReturnPage.ts`
- Transferencia: `src/lib/billing/resolveStudentPaymentSlot.ts`
- Admin: `src/app/[locale]/dashboard/admin/payments/reviewMonthlyPaymentsActions.ts`
- ADRs relacionadas: `2026-06-events-deferred-payment-creation.md`,
  `2026-05-mercadopago-integration.md`,
  `2026-05-payment-gateways-flow-chile-plan.md`,
  `2026-04-payments-idempotent-upload.md`,
  `2026-04-section-fee-plans-currency-and-proration.md`
- Reglas: `02-testing-tdd.mdc`, `08-analytics-observability.mdc`,
  `10-engineering-governance.mdc`, `12-supabase-app-boundaries.mdc`,
  `17-trust-boundary-handlers.mdc`.
