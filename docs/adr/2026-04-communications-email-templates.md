# ADR: Comunicaciones — plantillas de email editables desde admin

## Contexto

Hoy el producto envía emails al cliente final (estudiantes, tutores, profesores) desde varios módulos sin un punto único de gestión:

- Mensajería del portal — `src/lib/messaging/notifyMessagingEmails.ts` (HTML inline en `emailMessaging.*` del diccionario).
- Beneficios de facturación — `src/lib/email/billingBenefitEmails.ts` (`wrapHtml()` con hex hardcoded).
- Te extrañamos / churn — `src/lib/email/churnInactivityEmail.ts` (HTML en `emailChurn.html`).
- Traslados aprobados — `src/lib/academics/sendTransferApprovedNotifications.ts` (HTML en TS).
- Calificación publicada — `src/lib/academics/sendGradePublishedParentEmails.ts` (`buildHtml()` en TS).
- Recordatorio de clase (prep) — `src/lib/notifications/processClassReminderJobHandlers.ts` (HTML inline en TS).

Consecuencias del estado actual:

- Cambios de copy obligan a desplegar.
- No hay layout unificado: cada email mezcla colores hex, fonts y headers distintos; el branding institucional (logo + nombre desde `system.properties`) aparece de forma desigual.
- No existe un punto único para que el admin vea **qué** emails salen al cliente y los ajuste.

Restricciones del repo:

- **`01-design-system`** — branding desde `system.properties` / `getBrandPublic()`, sin duplicar identidad.
- **`03-architecture`** — capas separadas (puros vs. infra), tope 250 LOC.
- **`04-security`** — server actions con `assertAdmin()`, sin mutaciones desde el cliente.
- **`08-analytics-observability`** — cada cambio en plantilla queda auditado en `system_config_audit`.
- **`09-i18n-copy`** — UX del admin desde diccionarios; **el contenido editable de plantillas vive en BD por locale**, no en `en.json`/`es.json`.
- **`12-supabase-app-boundaries`** — clientes Supabase solo en `src/lib/supabase/`; lectura/escritura del admin a través de server actions.
- **`13-postgrest-pagination-bounded-queries`** — catálogo acotado (≤50 filas), lectura por `template_key + locale`.
- **`15-entity-crud-completeness`** — la entidad **plantilla** se considera **catálogo cerrado** definido por código (registry); los admin pueden **leer y actualizar** cualquier entrada, pero **no crear ni borrar** keys nuevas (esas vienen del registry TS, que es el contrato con los emisores). Caso explícito de excepción del estándar de CRUD por ser **catálogo derivado del código**.

## Decisión

Introducir una capa única de **plantillas de email**:

### Modelo de datos

Nueva tabla `public.email_templates` (migración `053`):

```
template_key TEXT NOT NULL          -- 'messaging.teacher_new', etc.
locale       TEXT NOT NULL CHECK (locale IN ('es','en'))
subject      TEXT NOT NULL
body_html    TEXT NOT NULL          -- HTML del cuerpo (sin layout/header)
updated_at, updated_by
UNIQUE (template_key, locale)
```

RLS: `SELECT/INSERT/UPDATE` solo `is_admin(auth.uid())`. El `service_role` (backend de envío) lee con `createAdminClient()` (bypass RLS).

### Catálogo en código (registry)

`src/lib/email/templates/templateRegistry.ts` define las **keys conocidas** y, por cada una, el **default** (subject + body) para `es` y `en`. Es la fuente de verdad del **contrato** con los emisores y la lista que verá el admin en el combo. La BD solo guarda **overrides** del admin; si no hay fila, se usa el default del registry.

### Renderer unificado

`src/lib/email/templates/wrapEmailHtml.ts` envuelve cualquier `bodyHtml` en un layout HTML minimalista, compatible con email-clients (tablas + estilos inline), con:

- Header: logo (URL absoluta) + nombre de instituto desde `getBrandPublic()`.
- Body: tipografía system-ui, line-height legible, colores desde tokens (`color.primary`, `color.secondary`).
- Footer: dirección de contacto + email + opcional links sociales.

Es **puro** (recibe `brand`, `origin`, `bodyHtml`); fácil de testear sin mocks.

### Helpers de envío

- `loadEmailTemplate({ key, locale })` — lee BD (admin client), cae al registry si no hay fila; sustituye `{{vars}}` con `fillTemplate`.
- `sendBrandedEmail({ to, key, locale, vars })` — orquesta `loadEmailTemplate` + `wrapEmailHtml` + `getEmailProvider().sendEmail`. Es el punto único que llaman los emisores existentes.

### UI admin

Subsección nueva del grupo **Communication** en sidebar admin:

- Ruta: `/[locale]/dashboard/admin/communications/templates`
- `EmailTemplatesShell` (cliente): combo de plantillas (`template_key + locale`) + editor (subject, HTML) + **preview** en `<iframe srcDoc>` con el wrapper unificado aplicado.
- Server actions `loadEmailTemplateAction`, `saveEmailTemplateAction` con `assertAdmin()` + `recordSystemAudit('email_template_updated', ...)` sin volcar HTML completo en el payload (solo `key`, `locale`, longitud).

### Wiring

Los seis emisores existentes pasan a llamar `sendBrandedEmail`. Se mantiene el `EmailProvider` (puerto) intacto: la única diferencia es que el HTML siempre cruza por `wrapEmailHtml`, con copy opcionalmente sobreescrito en BD.

## Opciones consideradas

1. **Solo guardar HTML completo en BD** — descartado: si añadimos un emisor nuevo en código, no aparecería en el admin sin migración / seed manual. El registry permite tener la lista bajo control de código y delegar **solo el copy** a BD.
2. **Reutilizar `site_themes.content` para emails** — descartado: ese JSONB ya gobierna el copy de la landing pública por sección; mezclar emails diluye el contrato y rompe la separación CMS público vs. comunicaciones internas.
3. **Editor por-emisor (sin punto único)** — descartado por el pedido explícito del usuario: "agrupar todos los contactos por mail con un combo y poder modificarlos".

## Consecuencias

- **Positivas**: branding y layout consistentes en todos los emails que ve el cliente; admins ajustan copy sin redeploy; los emisores quedan más cortos al externalizar layout y copy.
- **Riesgos**: el HTML que escriba un admin podría romper rendering en clientes legacy. Mitigamos: `wrapEmailHtml` aplica el shell minimalista alrededor del cuerpo; el cuerpo del admin se inyecta tal cual (asume conocimiento HTML básico). Los placeholders (`{{var}}`) se documentan en la UI por cada key del registry.
- **Follow-ups**: cuando se añada SMTP de auth de Supabase (reset password, magic link), conectar esas plantillas vía el mismo registry no requerirá nuevo modelo de datos.

## Tests

- `src/__tests__/lib/email/templates/wrapEmailHtml.test.ts` — branding obligatorio, escapado, ausencia de scripts.
- `src/__tests__/lib/email/templates/templateRegistry.test.ts` — todas las keys tienen `es` y `en`, placeholders documentados.
- `src/__tests__/lib/email/templates/loadEmailTemplate.test.ts` — fallback al registry, override desde BD, sustitución de vars.
- `src/__tests__/components/EmailTemplatesShell.test.tsx` — combo cambia plantilla, edición + guardado, preview reflejada.
- `src/__tests__/app/emailTemplateActions.test.ts` — guard de admin, validación, audit.
