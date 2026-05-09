# Plan: pasarelas de pago por país (v1 Flow Chile + extensión futura)

## Verificación con documentación Flow (developers.flow.cl)

Fecha de consulta: 2026-05-09. Fuentes revisadas en sitio oficial:

- [Primeros pasos](https://developers.flow.cl/docs/intro) — credenciales en dashboard; bases `https://sandbox.flow.cl/api` (sandbox) y `https://www.flow.cl/api` (producción); firma HMAC-SHA256 de **todos** los parámetros del body/query (excepto que el parámetro `s` es la firma).
- [Crear orden](https://developers.flow.cl/docs/tutorial-basics/create-order) — **API versión 1**: `POST /payment/create`, `Content-Type: application/x-www-form-urlencoded`; respuesta JSON con `url`, `token`, `flowOrder`; checkout en `url + "?token=" + token`; campos obligatorios incluyen `urlConfirmation` y `urlReturn`.
- [Confirmación](https://developers.flow.cl/docs/tutorial-basics/order-confirmation) — Flow notifica con **`POST`** a `urlConfirmation`, body `application/x-www-form-urlencoded` con **`token`**; responder **HTTP 200** en **&lt; 15 s** (recomienden 1–10 s). Errores HTTP no revierten el pago en Flow.
- [Estado](https://developers.flow.cl/docs/tutorial-basics/status) — `GET /payment/getStatus` con query `apiKey`, `token`, `s`; `status`: 1 pendiente, **2 pagada**, 3 rechazada, 4 anulada; comprobar `commerceOrder`, `amount`, etc.

La doc también menciona `getStatusExtended` como alternativa en callbacks con más detalle de tarjeta; v1 puede usar `getStatus` y evaluar ampliar después.

**Nota:** Flow está orientado al mercado chileno (CLP, medios locales). En el producto lo tratamos como proveedor **asociado al país `CL`**; otros países usarán otros proveedores.

## Objetivo de producto

- **v1:** Admin configura credenciales Flow (Chile) persistidas en BD (cifradas); alumno/tutor pueden iniciar pago online de **cuotas mensuales** (`payments`) vía checkout Flow; confirmación vía callback servidor; conciliación con `getStatus` antes de marcar aprobado.
- **Futuro:** Misma fila/`provider` + `country_code` (o catálogo equivalente) para admitir otras pasarelas y países sin reescribir el flujo de negocio.

## Arquitectura extensible (multi-país)

| Capa | v1 | Evolución |
|------|----|-----------|
| **Persistencia** | Tabla `payment_gateway_credentials` con `provider`, `country_code` (p. ej. `flow` + `CL`), `environment`, secretos cifrados, `enabled`. | Nuevas filas `mercadopago` + `AR`, etc.; restricción única `(provider, country_code)` o política de “una credencial activa por par” según reglas de negocio. |
| **Contrato de dominio** | Puerto único: “iniciar checkout mensual” / “procesar webhook de proveedor X”. | `StartMonthlyCheckoutInput { countryCode, provider, … }` resuelve adaptador. |
| **Adaptadores** | Solo `FlowChileAdapter` (URLs y firma según doc Flow). | Un módulo por proveedor bajo `src/lib/payment-gateways/<provider>/`, misma interfaz (`createOrder`, `parseConfirmation`, `fetchStatus`). |
| **Habilitación en portal** | RPC tipo `is_flow_chile_checkout_enabled()` (SECURITY DEFINER, solo booleano) para no exponer columnas sensibles por RLS. | Generalizar a `is_gateway_checkout_enabled(country, provider)` o lectura de “pasarela preferida del sitio” en configuración. |
| **Webhooks** | Ruta dedicada `/api/payments/flow/confirm` (o prefijo `/api/payments/<provider>/...`). | Rutas o un router interno que delegue al adaptador según path/secret. |

## Seguridad y cumplimiento de reglas del repo

- Secretos: **AES-256-GCM** (o equivalente acordado) con clave solo en servidor (`PAYMENT_GATEWAY_SECRET_ENCRYPTION_KEY`); nunca `NEXT_PUBLIC_*`.
- Webhook: no confiar solo en el POST; **llamar siempre a `getStatus`** con el `token` y validar `commerceOrder` (= id estable del cobro interno), `status === 2`, y **monto/moneda** coherentes con la fila `payments`.
- Respuesta callback: **200** rápido; idempotente si Flow reintenta.
- Auditoría: `audit_events` vía `auditFinanceAction`; actor sistema cuando no hay usuario (callback).
- Observabilidad: evento de analítica al iniciar checkout (entre entidades ya existentes o extensión acotada según `eventConstants`).
- i18n: copy visible en `en.json` / `es.json`.

## Pasos de implementación (orden sugerido)

1. Migración SQL: tabla + políticas admin + RPC booleano Chile + trigger `updated_at`.
2. Lib pura: firma Flow (`param` orden lexicográfico + concatenación + HMAC SHA256).
3. Lib servidor: cifrar/descifrar credenciales; cargar credenciales con **service role** solo en rutas/actions que ya validaron rol o callback.
4. Server action admin: upsert credenciales Flow Chile + `recordSystemAudit` (sin volcar secretos en payload).
5. Action portal: resolver slot mensual (`resolveStudentPaymentSlot`), crear orden Flow, devolver URL de redirección; tutor con mismo patrón que comprobante + `parent_id` si aplica.
6. Route handler `POST` confirmación: parsear `token`, `getStatus`, finalizar pago aprobado + email/revalidaciones alineadas con `reviewPayment`.
7. Página `urlReturn` por locale (mensaje + enlace a pagos).
8. UI admin en hub finanzas (config Flow Chile); UI portal botón “Pagar con Flow” condicionado al RPC.
9. Tests Vitest: firma, cifrado, núcleo de finalización (mocks); smoke RTL si toca componente.
10. `.env.example`: clave de cifrado + nota de URL pública para sandbox/local (ngrok/túnel si hace falta).

## Definition of done

- Migración aplicable en Supabase sin datos destructivos.
- Admin puede guardar credenciales y activar/desactivar; portal solo muestra checkout cuando corresponde.
- Flujo sandbox documentado en PR (credenciales de prueba).
- Tests que fijen firma, verificación de estado pagado e idempotencia del webhook.

## Opciones consideradas

- **Solo env vars por comercio:** rechazado para el requisito “guardar API keys en BD desde admin”.
- **Una tabla por proveedor:** rechazado; una tabla genérica con `provider` + `country_code` escala mejor.

## Consecuencias

- Mantener doc Flow yRelease notes a mano: cambios en API o firmado rompen el adaptador.
- Multi-moneda: Flow documenta `currency`/`payment_currency`; el producto debe alinear monto con plan (`CLP` típico en Chile) u omitir Flow si el plan no es compatible con el contrato del proveedor.
