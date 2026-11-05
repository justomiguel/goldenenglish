# Event seat holds

## Context

Two buyers can pick the same numbered seat. The unique key on `event_seat_locks` stops a double sale, but the buyer only learns this after the form is full. The message does not name the seat.

## Decision

Hold a seat for 10 minutes in `event_seat_holds` when the buyer selects it. The browser keeps a random token. The database stores only the token hash. `hold_event_seats`, `release_event_seat_holds`, and `claim_event_seats` run as `service_role` functions. A poll every 15 seconds refreshes the map. A lost seat keeps the typed form and offers a nearby free seat.

## Options considered

- Lock the seat only at submit. Rejected: the buyer fills the form and then loses the seat with no warning.
- Supabase Realtime on the lock table. Rejected for this change: polling is enough, and the hook can switch later.

## Consequences

- A cron deletes expired holds every 15 minutes. `hold_event_seats` also deletes expired rows for that event.
- One token cannot hold more seats than the event allows.
- Unpaid `pending_payment` locks still do not expire. That rule needs its own spec.
- Tests cover the pure suggestion, the routes, the cron secret, and the client poll.
