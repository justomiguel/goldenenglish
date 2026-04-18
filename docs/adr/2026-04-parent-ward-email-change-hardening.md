# ADR — Hardening del cambio de email de un alumno por su tutor (parent → ward)

Fecha: 2026-04-18
Estado: Aceptado (acompaña la PR de hardening de seguridad).

## Contexto

`updateWardProfile` (`src/app/[locale]/dashboard/parent/children/[studentId]/actions.ts`)
permite que un usuario con rol `parent` actualice los datos del alumno con el
que tiene una relación en `tutor_student_rel`. Entre esos datos está el **email
de login** del alumno.

La implementación previa, ante un cambio de email, llamaba directamente a:

```ts
admin.auth.admin.updateUserById(studentId, {
  email: nextEmail,
  email_confirm: true,
});
```

con el cliente service-role, **sin re-autenticar al tutor**, **sin notificar al
email anterior** ni **dejar pista de auditoría**. El efecto práctico es que
cualquier sesión de tutor comprometida (XSS en otra pestaña, robo de cookies,
acceso físico al equipo, sesión olvidada en un dispositivo compartido) podía
**reasignar el email del alumno y, acto seguido, disparar un “forgot password”
desde el nuevo email para tomar control total de la cuenta del alumno**: un
**Account Takeover** clásico mapeable a OWASP A07 (Identification &
Authentication Failures) y A04 (Insecure Design — flujo crítico sin paso de
confirmación).

Mantener la posibilidad de que el tutor cambie el email del alumno sigue siendo
un requisito funcional legítimo (alumnos que pierden acceso a su correo, padres
que recuperan cuentas de menores), por eso la decisión es **endurecer el
flujo**, no eliminarlo.

## Decisión

El cambio de email del alumno por parte del tutor debe cumplir, en la **misma
acción**, las siguientes garantías:

1. **Re-autenticación del tutor (step-up)** — el formulario pide la **contraseña
   actual del tutor** y la acción la valida con `verifyUserPassword(parentEmail,
   parentPassword)` antes de tocar nada en `auth.users`. Solo se exige cuando
   `nextEmail !== currentEmail`; las ediciones de nombre/teléfono/fecha no
   requieren contraseña, para no añadir fricción innecesaria.
2. **Notificación al email anterior y al nuevo email** — al confirmarse el
   cambio se envía una nota con la plantilla
   `notifications.ward_email_changed` (registry `registryNotifications.ts`,
   editable desde `email_templates`). El email anterior aprende inmediatamente
   que se le retiró el acceso y puede contactar a soporte; el email nuevo queda
   con un mensaje de bienvenida que confirma quién hizo el cambio. Esto es la
   misma “mecánica de alerta” que aplican Google / Microsoft / Apple ante un
   cambio de email recuperable.
3. **Auditoría persistente** — se inserta una fila en `system_config_audit`
   (`action = "parent.ward.email_changed"`, `resource_type =
   "auth.user.email"`, `resource_id = studentId`, `payload = { old_email,
   new_email, parent_id, parent_email }`) usando el cliente admin (la tabla es
   admin-only por RLS y este flujo es lo bastante sensible como para aparecer
   en el visor de auditoría junto a cambios de configuración). Encaja con lo
   que pide `08-analytics-observability.mdc` para acciones de alto impacto.

`recordUserEventServer` se mantiene aparte para telemetría cliente del propio
formulario. La auditoría va a `system_config_audit` porque su consumidor es el
admin que investiga incidentes, no un agregado de funnel.

## Opciones consideradas

- **Bloquear por completo el cambio de email desde el portal de tutor** y
  redirigir a admin. Descartada: el caso real (menor que pierde acceso a su
  email familiar) es frecuente y un viaje extra al admin rompe el self-service
  que justifica el portal de tutor.
- **Quitar `email_confirm: true` y forzar el ciclo de Supabase** (link de
  confirmación al email nuevo). Mejor para “tomas de cuenta accidentales”, pero
  empeora el caso de uso real (el alumno suele no tener acceso al email viejo
  ni al nuevo en el momento). Mantenemos el auto-confirm pero compensamos con
  re-auth + notificación al email anterior + auditoría.
- **Solo añadir auditoría** sin re-auth. Insuficiente: la auditoría es
  detectiva, no preventiva, y no protege ante una sesión comprometida; el
  daño ya ocurre.

## Consecuencias

Positivas:

- **Cierra el vector de Account Takeover** en el portal de tutor sin matar el
  flujo legítimo.
- **Proporciona pista de incidente** trazable desde el visor admin de
  auditoría (`system_config_audit`).
- Establece un patrón replicable: cualquier mutación cross-account sensible
  debe combinar re-auth + notificación + auditoría.

Negativas / seguimiento:

- Pequeña fricción para el tutor: necesita escribir su contraseña al cambiar el
  email. Aceptable porque solo se pide cuando el email cambia.
- El envío de email a la dirección antigua puede fallar (mailbox lleno,
  bouncing). El fallo de notificación **no** revierte el cambio: se loguea con
  `logServerException` pero la operación sigue siendo exitosa. La auditoría
  queda en BD pase lo que pase.
- Test plan: ver `src/__tests__/app/parentUpdateWardProfile.test.ts`. Cubre
  re-auth requerida / inválida / correcta, no se exige password si el email no
  cambia, auditoría se inserta, notificaciones se envían a old + new.

## Referencias

- `.cursor/rules/04-security.mdc` — “Validate all user input on server” + “Never trust client-side checks alone”.
- `.cursor/rules/08-analytics-observability.mdc` — `system_config_audit` para acciones de impacto.
- `.cursor/rules/10-engineering-governance.mdc` — ADR cuando se cambian flujos de auth visibles.
- OWASP Top 10: A04 (Insecure Design), A07 (Authentication Failures).
