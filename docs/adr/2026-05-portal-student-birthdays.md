# ADR: Portal student birthdays (dashboard + calendar)

## Context

The product needs visible **upcoming student birthdays** for rapport (greet peers / sectionmates) and **calendar integration** as all-day events. Birth dates live on `profiles.birth_date` (students). Visibility must follow academic scope (sections, tutor links, admin), not a blanket `SELECT` on all profiles.

## Decision

1. **Postgres RPC** `portal_upcoming_birthdays_for_viewer(p_viewer_id, p_range_start, p_range_end)` (`SECURITY DEFINER`) returns scoped rows with celebration dates in the requested civil range (institute “today” in `America/Argentina/Cordoba` for the `is_celebration_today` flag).
2. **JWT sessions** must pass `p_viewer_id = auth.uid()`; the **ICS feed** (service role) passes the profile id resolved from `calendar_feed_token` (same pattern as other feed data).
3. **Application layer** maps RPC rows to `ExpandedPortalOccurrence` (`kind: birthday`) and merges into the existing portal calendar pipeline; dashboards use the same RPC with a **two-week Monday window** in institute TZ.
4. **UI** uses dictionary keys under `dashboard.birthdays` and `dashboard.portalCalendar.legend.birthday`; FullCalendar styling uses `portal-cal-ev--birthday`.

## Options considered

- **Widen RLS on `profiles` for everyone** — rejected: leaks unrelated profiles; scope belongs in one audited function.
- **Compute birthdays only in TypeScript** — rejected: could not read peer birth dates under current RLS without either widening SELECT or duplicating rules in JS.

## Consequences

- New migration grants `EXECUTE` on the RPC to `authenticated` and `service_role`.
- Feed and UI stay consistent with the same business rules.
- Tests cover date window helpers, kind labels, and visual class for birthdays.
