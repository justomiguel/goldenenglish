# ADR: Calendario portal + feed iCal por token

## Contexto

Familias y docentes necesitan ver clases y evaluaciones en agenda externa. La suscripción por URL requiere un endpoint público sin cookie de sesión.

## Decisión

- Columna `profiles.calendar_feed_token` (UUID único, nullable). El usuario lo crea con acción autenticada; el feed `GET /api/calendar/feed/[token].ics` resuelve el perfil con **service role** y arma el calendario con las mismas reglas de alcance que la pantalla (rol en `profiles`).
- `academic_sections.room_label` opcional para filtro de aula en el calendario maestro admin.

## Opciones descartadas

- **Solo descarga .ics puntual** — no cumple suscripción persistente ni actualización en Google/Outlook.
- **JWT firmado en la URL** — más complejo; el token opaco en BD permite revocación/rotación futura alineada al perfil.

## Consecuencias

- Quien posea la URL ve el mismo calendario que el titular del token (riesgo inherente a iCal por URL); mitigación: no compartir el enlace y **rotar el token** desde la pantalla de sincronización (nuevo UUID en `profiles.calendar_feed_token`; se registra `user_events` con metadata `op: calendar_feed_token_rotated`).
- Operaciones de feed no pasan por RLS de sesión; el alcance se fuerza en código leyendo solo datos del `user_id` asociado al token.

## Eventos especiales (institucionales)

- Tabla `public.portal_special_calendar_events` — ver ADR [2026-04-portal-special-calendar-event-types.md](./2026-04-portal-special-calendar-event-types.md) para `event_type`, `calendar_scope`, visibilidad RLS y presentación ICS unificada.
- Los registros se fusionan en la misma composición que clases y exámenes (`composePortalCalendarPageEvents`) y aparecen en pantalla portal e **ICS**.
- CRUD admin en `/{locale}/dashboard/admin/calendar/special` con auditoría `recordSystemAudit` en mutaciones.
