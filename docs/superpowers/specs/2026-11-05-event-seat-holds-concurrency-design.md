# Event seat holds and seat conflict recovery — design

Status: draft (awaiting approval)
Date: 2026-11-05
ADR: `docs/adr/2026-11-05-event-seat-holds.md` (written in the same change)

## Context

The public register page (`/[locale]/events/[slug]/register`) shows a seat map when `events.seat_map_config` is enabled.

Today:

1. The page reads `event_seat_locks` once, at render (`loadEventSeatLocks`).
2. The buyer picks seats in step 2, then fills the amount and pay steps.
3. On submit, `enrollEventAttendeeServer` validates seats, calls the enroll RPC, then inserts `event_seat_locks`. The unique key `(event_id, seat_key)` blocks a double sale. On `23505`, the code deletes the new attendee and returns `seat_already_taken`.

Problems:

- The buyer learns about a conflict only after the full form.
- The response does not name the lost seats. The form shows one generic sentence.
- The seat map does not refresh. The buyer can pick another taken seat.
- Enroll and lock are separate calls. The rollback deletes the attendee after the RPC already ran.

## Intent

A buyer who picks a seat keeps it for a short time. If a seat is lost, the buyer sees which seat, keeps every typed value, and picks a new seat with a suggestion.

## Decision (summary)

Three layers:

1. **Seat hold with TTL.** A seat pick creates a row in a new table `event_seat_holds`. The hold lasts 10 minutes and renews while the page is open.
2. **Live availability.** The page polls seat state every 15 seconds and on tab focus. A lost seat shows a notice before submit.
3. **Conflict recovery.** The enroll response names the lost seats. The form keeps all data, removes only the lost seats, scrolls to the map, and suggests near free seats.

## Data model

New migration `supabase/migrations/264_event_seat_holds.sql` (additive):

```sql
CREATE TABLE IF NOT EXISTS public.event_seat_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  seat_key TEXT NOT NULL,
  hold_token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT event_seat_holds_event_seat_unique UNIQUE (event_id, seat_key)
);
-- indexes on (hold_token_hash), (expires_at)
-- RLS enabled; admin-only policy (same as event_seat_locks). Public access goes through server routes.
```

Functions (`SECURITY DEFINER`, `SET search_path = public`, `REVOKE ... FROM anon, authenticated`, execute for `service_role` only):

- `public.hold_event_seats(p_event_id, p_token_hash, p_seat_keys text[], p_max_seats int, p_ttl_seconds int)`
  - One transaction.
  - Deletes expired holds for the event.
  - Deletes holds of this token that are not in `p_seat_keys` (the buyer changed seats).
  - Rejects seats that have any `event_seat_locks` row or a live hold of another token.
  - Upserts the remaining seats for this token with a new `expires_at`.
  - Returns `{ held text[], taken text[], expires_at }`.
- `public.release_event_seat_holds(p_event_id, p_token_hash)` — deletes the token holds.
- `public.claim_event_seats(p_event_id, p_attendee_id, p_token_hash, p_seats jsonb)`
  - One transaction.
  - Takes a row lock on matching holds (`FOR UPDATE`).
  - Inserts `event_seat_locks`. Deletes the token holds.
  - On a seat locked by someone else, or held by another live token, returns `{ ok: false, taken text[] }` and inserts nothing.

`masterdb.sql` gets the table and the functions.

Apply: `npm run sql:apply-migration:all-tenants:pg -- supabase/migrations/264_event_seat_holds.sql`.

### Hold token

- The browser makes a random UUID per event and keeps it in `sessionStorage` (`ge:event-seat-hold:<eventId>`).
- The server stores only `sha256(token)`. The token is a capability for that tab only. It does not identify a person.

## Server surface

New route handlers under `src/app/api/events/[slug]/seats/`:

| Route | Method | Purpose |
|---|---|---|
| `/api/events/[slug]/seats` | `GET` | Seat state: locks plus live holds of other tokens (`?token=` optional header `x-seat-hold-token`). Returns `{ locks, heldByOthers, myHolds, expiresAt }`. |
| `/api/events/[slug]/seats/hold` | `POST` | Body `{ token, seatKeys }`. Validates keys against `seat_map_config` (invalid, staff reserved, count above max). Calls `hold_event_seats`. |
| `/api/events/[slug]/seats/hold` | `DELETE` | Releases the token holds (best effort, `navigator.sendBeacon` on page hide is out of scope; TTL covers it). |

All responses: `Cache-Control: private, no-store` (rule 17). The token is read from a header, not from the query string.

Abuse limits:

- Per-IP rate limit, same pattern as `enroll/route.ts`.
- `p_max_seats` = `maxTicketsPerRegistration` (or 1 when multi ticket is off). One token cannot hold more.
- TTL 10 minutes. A renew happens only while the page is visible.

Changes in the enroll flow (`enrollEventAttendeeServer`):

1. The body carries `seatHoldToken`.
2. Before the enroll RPC, call `hold_event_seats` with the same seats. This renews the hold and returns `taken`. If `taken` is not empty, return `seat_already_taken` with `takenSeatKeys` and do not call the enroll RPC. No attendee row is created.
3. After the enroll RPC, call `claim_event_seats` instead of the direct insert. The hold makes a failure here rare. On failure, keep the current attendee rollback and return `takenSeatKeys`.
4. `EnrollEventAttendeeServerResult` gets `takenSeatKeys?: string[]`. The route returns it.

Pure modules (`src/lib/events/`):

- `seatMapState.ts`: add the visual state `held` (held by another buyer). `resolveFloorSeatsWithState` accepts `heldByOthers`.
- New `suggestNearbyFreeSeats.ts`: input config, seat states, lost keys, needed count. Output: free seats on the same floor and block, same row first, then nearest rows, ordered by column distance.
- New `diffLostSeatSelection.ts`: input selected keys and fresh state. Output kept keys and lost keys.

Cron: new `/api/cron/event-seat-holds-cleanup` (every 15 minutes, `verifyCronRequest`). Deletes holds with `expires_at < now()`. `hold_event_seats` also cleans per event, so the cron is a backstop.

## Client surface

New hook `src/hooks/useEventSeatHold.ts`:

- Owns the token, the hold call on each selection change (debounced 300 ms), and the renew every 4 minutes while the tab is visible.
- Polls `GET /seats` every 15 seconds and on `visibilitychange` to visible.
- Returns `{ locks, heldByOthers, expiresAt, lostSeatKeys, suggestions, holdError, isHolding, acknowledgeLost }`.
- When a selected seat appears in `taken` or in fresh state as not free, the hook removes it from the selection and sets `lostSeatKeys`.
- When the hold expires (no renew possible), the hook tries one new hold. If a seat is gone, it sets `lostSeatKeys`.

`useEventRegisterForm` / `useEventRegisterSubmit`:

- Send `seatHoldToken`.
- On `seat_already_taken` with `takenSeatKeys`, do not clear any field. Pass the keys to `useEventSeatHold` (same path as a poll loss). Scroll to the seat step and focus the notice.

`EventRegisterSeatPicker`:

- New `held` tone and legend entry ("Someone else is choosing").
- Lost seats get a short highlight. Suggested seats get a visible ring and a button "Use suggested seats".

Copy (en, es, pt), under the existing `seatMap` labels:

- `lostSeatsNotice`: "The seat {labels} was just taken. Choose another seat. Your other data is safe." / es: "La butaca {labels} se acaba de ocupar. Elige otra. Tus demás datos siguen guardados."
- `useSuggestedSeats`, `holdCountdown` ("We keep your seats for {time}"), `holdExpired`, `legendHeld`, `holdFailed`.

Spanish uses neutral tuteo (rule 40).

## Surfaces (Web vs PWA)

Tier A (public event registration). `EventRegisterSurfaceEntry` uses `SurfaceMountGate`. `EventRegisterDesktop` and `EventRegisterPwa` both render the shared `EventRegisterForm` and `EventRegisterSeatPicker`.

- **Web (`web-desktop`):** the lost-seat notice is an inline alert above the map (`role="alert"`). The countdown sits next to the "selected seats" line under the map. The submit footer shows the same notice when submit fails.
- **PWA (`web-mobile` / `pwa-mobile`):** the lost-seat notice is a sticky bottom bar inside the safe area, with a 44 px button "Choose another seat" that scrolls to the map. The countdown sits in the same bar while seats are held. The bar does not cover the submit button: the bar hides while the submit footer is on screen.
- The notice placement comes from a new prop on the form slot (`seatNoticeSlot`), filled by `EventRegisterDesktop` and `EventRegisterPwa`. The hook and the picker stay shared. No `isPwa` boolean in the picker.
- Existing tests to keep green: `EventRegisterForm*`, `EventRegisterSurfaceEntry*`, `EventRegisterMinorTicketsField.test.tsx`, any `*Pwa*` event register test.

## Observability

- `logServerInfo` / `logServerWarn` with scope `events.seats.hold` and `events.seats.conflict` (`eventId`, seat count, `source: poll | submit | claim`). No token, no personal data.
- Signed-in buyers: `trackEvent` `action` with entity `event:<id>` and metadata `{ kind: "seat_lost" }` on the client. This reuses an existing `event_type`. No new enum value.
- Admin seat tab (`loadAdminEventDetailPageModel`, tab `seats`) shows live holds as "in selection" (read only).

## Tests (TDD, self-contained)

- `src/__tests__/lib/events/suggestNearbyFreeSeats.test.ts`
- `src/__tests__/lib/events/diffLostSeatSelection.test.ts`
- `src/__tests__/lib/events/seatMapModel.test.ts` (extend: `held` state)
- `src/__tests__/lib/events/server/eventSeatHoldsServer.test.ts` (RPC adapters, error logging)
- `src/__tests__/lib/events/enrollEventAttendeeServer.test.ts` (extend: pre-check conflict skips the RPC; claim failure rolls back and returns keys)
- `src/__tests__/api/eventSeatsRoute.test.ts` and `eventSeatHoldRoute.test.ts` (private cache, token from header, rate limit, invalid seat)
- `src/__tests__/api/eventSeatHoldsCleanupCron.test.ts` (401 on `?secret=`)
- `src/__tests__/hooks/useEventSeatHold.test.ts` (fake timers: poll, renew, lost seat, expiry)
- `src/__tests__/components/EventRegisterSeatPicker.test.tsx` (held tone, suggestion button)
- `src/__tests__/components/EventRegisterForm*.test.tsx` (conflict keeps typed values)
- `src/__tests__/db/event_seat_holds_migration.test.ts` (qualified `public.`, no destructive SQL)

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| A bot holds every seat. | Per-IP rate limit, per-token seat cap, 10 minute TTL, renew only while visible. |
| Clock drift between app and DB. | `expires_at` is set with `now()` inside SQL. |
| Two tabs of one buyer. | Each tab has its own token. The second tab sees the first tab seats as held. Accepted. |
| Polling cost on big events. | 15 s interval, paused when hidden, one indexed query per call. |
| Enroll RPC side effects before a claim failure (discount use, payment row). | The pre-check hold makes this path rare. The current rollback stays. Plan step verifies cascade of discount redemption and payment rows on attendee delete. |
| Old `pending_payment` locks never free a seat. | Out of scope. See open questions. |

## Done when

- Picking a seat holds it. Another buyer sees it as held and cannot pick it.
- A seat lost during the form shows a notice that names it, before submit.
- A submit conflict names the lost seats, keeps every typed value and file, and offers near seats.
- No attendee row is created when the pre-check finds a conflict.
- Expired holds free the seat within 10 minutes without staff action.
- Desktop and PWA trees show the notice in their own layout.
- Vitest green with coverage gate. Migration applied with the all-tenants command.
- ADR written. Changelog entry added before commit.

Manual QA (user): two browsers on one event, pick the same seat, check the held tone, the countdown, the lost-seat notice, and the suggestion on desktop and phone.

## Out of scope

- Supabase Realtime push (polling is enough for this load; can replace polling later behind the same hook).
- Saving the form draft to `sessionStorage` across reloads (would store personal data in the browser; the conflict path no longer reloads the page).
- Expiring unpaid `pending_payment` registrations.
- Seat holds for staff manual enrollment (`admin_manual`).

## Open questions

1. Is 10 minutes the right hold time? (Default proposed.)
2. Should unpaid `pending_payment` seats expire after some days? This is a separate business rule and a separate spec.
