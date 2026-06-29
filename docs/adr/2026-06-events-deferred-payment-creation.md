# ADR: Creación diferida del pago de eventos (sin pagos "fantasma")

Fecha: 2026-06-25
Estado: Aceptado

## Contexto

El flujo de inscripción a eventos pagos (`enroll_event_attendee` →
`event_attendees` + `event_payments`) creaba la fila de `public.event_payments`
en estado `pending` **al momento de inscribirse**, antes de que ningún medio de
pago hubiera cobrado al asistente.

Consecuencia: cuando un asistente abría el checkout de Mercado Pago o Flow y
**no completaba** el pago (lo abandonaba o el gateway lo rechazaba), igual
quedaba una fila `pending` en `event_payments`. Esa fila aparecía en la cola de
aprobación del admin como un pago "por aprobar" que en realidad nunca ocurrió —
un pago **fantasma**.

Comportamiento esperado por el negocio:

- **Gateways online (Mercado Pago / Flow):** sólo debe existir una fila de pago
  si el gateway aprobó el cobro, y esa fila debe quedar **aprobada
  automáticamente** (de forma transparente) vía webhook / reconciliación de
  retorno. Nada que el admin tenga que aprobar a mano.
- **Transferencia bancaria:** sólo se genera un pago `pending` (para revisión
  manual del admin) cuando el asistente **sube un comprobante**.

## Decisión

Adoptar **creación diferida** del registro de pago. La fila de `event_payments`
deja de crearse en la inscripción y se materializa según el medio:

1. **RPC `enroll_event_attendee` ya no inserta en `event_payments`**
   (`supabase/migrations/158_events_defer_payment_creation.sql`). Sigue creando
   el `event_attendee` con su `status` (`confirmed` / `pending_payment` /
   `waitlist`) y ahora devuelve siempre `payment_id = NULL`.

2. **El checkout del gateway se vincula al asistente, no a una fila de pago.**
   La `external_reference` (MP) y el `commerceOrder` (Flow) pasan de
   `event_payment:<paymentId>` a `event_attendee:<attendeeId>`
   (`buildEventAttendeeReference`). `parseEventGatewayReference` entiende **ambos**
   formatos para reconciliar checkouts legacy en vuelo tras el deploy.

3. **`startEventGatewayPaymentCore` opera por `attendeeId` y no toca
   `event_payments`.** Carga el contexto canónico con
   `loadEventAttendeeGatewayContext` (monto/moneda derivados del precio por
   residencia del evento, nunca del monto reportado por el cliente/gateway),
   valida identidad y estado, y crea sólo el checkout.

4. **El pago se materializa como `approved` en la finalización.**
   `finalizeEventPaymentFromMercadoPago` / `finalizeEventPaymentFromFlowGateway`
   llaman a `upsertApprovedEventGatewayPaymentCore`, que crea (o actualiza) la
   fila como `approved` y promueve al asistente a `confirmed`. Es **idempotente**
   ante webhooks duplicados gracias al índice único
   `event_payments.event_attendee_id` (`137_events_core.sql`).

5. **La transferencia materializa la fila al subir comprobante.**
   `uploadEventPaymentReceiptServer` pasa a operar por `attendeeId` y hace
   upsert de la fila `pending` con `receipt_storage_path`.

6. **Blindaje del admin.** `approveEventPayment` / `rejectEventPayment` rechazan
   (`gateway_managed`) cualquier intento manual sobre pagos con
   `gateway_provider` no nulo: los pagos de gateway no se aprueban/rechazan a
   mano. La UI ya ocultaba esas acciones para pagos de gateway; el guard de
   servidor es defensa en profundidad.

## Alternativas consideradas

- **Mantener creación temprana y "limpiar" fantasmas con un job / rechazo
  automático por TTL.** Requiere un cron que distinga abandono real de checkout
  lento, sigue mostrando filas `pending` falsas entre medio y agrega estado a
  conciliar. La creación diferida elimina el problema de raíz en vez de
  parchear el síntoma.
- **Crear la fila `pending` y actualizarla a `approved`/`rejected` desde el
  gateway.** Es el modelo previo; el caso de abandono (sin webhook de rechazo)
  deja la fila colgada. Descartado.
- **`upsert` de PostgREST con `onConflict`.** El upsert se implementa en la capa
  de aplicación (select → insert con recuperación de carrera) para no depender de
  inferencia de índices y respetar `12-supabase-app-boundaries.mdc`.

## Casos de borde

- **Webhook duplicado / retorno + webhook simultáneos:** el índice único por
  `event_attendee_id` garantiza una sola fila; `upsertApprovedEventGatewayPaymentCore`
  recupera la fila ganadora si pierde la carrera del `INSERT`.
- **Checkouts legacy en vuelo:** referencias `event_payment:<id>` previas al
  deploy siguen reconciliando vía `markEventPaymentApprovedCore`.
- **Pagos fantasma preexistentes:** se decidió **no** migrar/borrar
  automáticamente; se limpian manualmente. La UI no permite borrar pagos con
  `gateway_provider`, así que la limpieza es por BD.
- **País/moneda en el retorno MP:** como la fila puede no existir aún al volver,
  `reconcileEventMercadoPagoReturn` resuelve la moneda desde el contexto del
  asistente (o la fila legacy) para cargar credenciales.

## Consecuencias

Positivas:

- No se generan pagos fantasma: un checkout abandonado/rechazado no deja rastro
  en `event_payments`.
- Los pagos online quedan aprobados de forma transparente; la cola del admin
  sólo contiene transferencias con comprobante.
- Monto/moneda canónicos derivados del evento, no del gateway.

Riesgos / follow-ups:

- Fantasmas históricos quedan en BD hasta limpieza manual.
- Si en el futuro se quieren múltiples comprobantes por asistente, requiere
  entidad hija y su propia ADR (igual que en pagos de alumno).

## Referencias

- Migración: `supabase/migrations/158_events_defer_payment_creation.sql`
- Helpers: `src/lib/events/parseEventGatewayReference.ts`,
  `src/lib/events/server/loadEventAttendeeGatewayContext.ts`,
  `src/lib/events/server/upsertApprovedEventGatewayPaymentCore.ts`
- Inicio/finalización: `src/lib/events/server/startEventGatewayPaymentCore.ts`,
  `finalizeEventPaymentFromMercadoPago.ts`, `finalizeEventPaymentFromFlowGateway.ts`,
  `reconcileEventGatewayPaymentReturn.ts`
- Transferencia: `src/lib/events/server/uploadEventPaymentReceiptServer.ts`
- Admin: `src/lib/events/server/reviewEventPaymentServer.ts`
- ADRs relacionadas: `2026-05-paid-events-registration.md`,
  `2026-05-mercadopago-integration.md`,
  `2026-05-payment-gateways-flow-chile-plan.md`,
  `2026-04-payments-idempotent-upload.md`
- Reglas: `02-testing-tdd.mdc`, `08-analytics-observability.mdc`,
  `10-engineering-governance.mdc`, `12-supabase-app-boundaries.mdc`,
  `17-trust-boundary-handlers.mdc`.
