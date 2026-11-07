# Seat timer first

Spec: `docs/superpowers/specs/2026-11-06-event-seat-timer-first-design.md`

1. `decideSeatToggle` refuses a seat that is not free. Add and replace stay allowed for a free seat.
2. `useEventSeatHold.confirmSeat` refreshes `GET /api/events/[slug]/seats` before a new seat is kept. A taken key is not selected. The lost-seat notice names it.
3. Seat-map registration renders the ticket step before the name. Companion details render after the name. No-map events keep the name first.
4. The countdown is `text-2xl`, ticks once a second, and is hidden when no seat is selected. Desktop: above the map. PWA: the existing sticky bar.
