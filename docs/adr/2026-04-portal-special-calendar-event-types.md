# ADR: Tipos cerrados, alcance y visibilidad en eventos especiales del calendario portal

## Contexto

Los eventos en `portal_special_calendar_events` debían compartir una leyenda visual y semántica estable entre portal, PWA y suscripción iCal. La política `SELECT` abierta a todo `authenticated` exponía reuniones de padres a perfiles que no debían verlas. El feed iCal usa `service_role` y por tanto ignoraba RLS, requiriendo el mismo filtro en aplicación.

## Decisión

- Catálogo cerrado de `event_type` (`holiday`, `institutional_exam`, `parent_meeting`, `social`, `trimester_admin`) con `CHECK` en Postgres.
- Alcance con `calendar_scope` (`global`, `cohort`, `section`) y FK opcionales `cohort_id` / `section_id` con restricciones mutuamente excluyentes.
- `meeting_url` opcional (HTTP/HTTPS) para reuniones virtuales.
- RLS `SELECT` vía función `SECURITY DEFINER` `portal_special_calendar_row_visible`, alineada con `filterSpecialCalendarRowsForViewer` en TypeScript para el armado del ICS.
- Textos de leyenda y prefijos ICS desde diccionarios (`dashboard.portalCalendar.specialTypes`); colores desde tokens nuevos en `system.properties` (`color.calendarSpecial.*`).

## Opciones descartadas

- **Color libre por evento** — rompe la leyenda unificada y el contrato con familias.
- **Solo filtrado en cliente** — insuficiente frente a clientes PostgREST directos; se mantiene RLS estricta.
- **Alcance por “sede”** — no existe modelo de sede en cohortes/secciones; pospuesto hasta dominio de sucursales.

## Consecuencias

- Migración incremental `043_portal_special_calendar_event_types_scope_rls.sql` y tests en `src/__tests__/lib/calendar/`.
- El feed ICS aplica `applyPortalSpecialEventIcsPresentation` con `getDictionary(defaultLocale)` hasta exista preferencia de idioma en perfil.
- Ver también [2026-04-portal-calendar-ical-feed.md](./2026-04-portal-calendar-ical-feed.md).
