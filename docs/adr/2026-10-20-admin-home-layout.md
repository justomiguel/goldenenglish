# ADR: Admin home layout is personal

## Context

Each admin wants a different order and size for the cards on `/dashboard/admin`. The home is shared by every admin today, in one fixed grid. A phone and a large screen must show the same saved order. The phone stacks every card at full width.

## Decision

Store one jsonb document per admin in `public.admin_home_layouts`. The primary key is `profile_id`. RLS allows that row only when `profile_id = auth.uid()` and `is_current_user_admin()` is true. A missing row means the factory layout. Saving does not write `system_config_audit`, because the change is a personal preference.

## Options considered

- A column on `profiles`. Rejected. The home document is not a profile field, and a missing row must mean "use the factory" without a null check on every profile read.
- One institute layout plus a lock. Rejected. Admins are peers. One admin must not freeze the home for the others.

## Consequences

- Migration `217_admin_home_layouts.sql` is additive.
- The save action checks `assertAdmin()` and writes only the session user id.
- A failed save logs `[ge:server]`.
- Tests cover the pure layout, the SQL policies, and the action.
