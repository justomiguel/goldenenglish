# Seat timer first, then the name

**Intent:** On a seat-map event, the buyer picks the ticket count and the seats before typing a name. The hold clock shows only after a seat is selected, and it is easy to see. A click checks that the seat is still free. If it is not, the seat is not added and the buyer is asked to pick again.

**Done when:**

- A seat-map registration shows ticket count (when the event sells more than one) and the seat map as step 1. The buyer name is step 2.
- An event with no seat map keeps the current order. The name stays first.
- The clock is absent when no seat is selected. It appears as soon as one selected seat is held.
- The clock uses large foreground type on both surfaces. It is not muted small text.
- A click on a seat that the latest check says is not free does not add that seat. The form asks for a new selection and keeps the other typed data.
- Companion detail fields, when the event asks for them, stay after the buyer name. The quantity control stays with the map.

**Out of scope:** Changing the 10-minute hold, unpaid `pending_payment` expiry, admin seat maps, and events with no seat map.

## Current behavior

`EventRegisterPurchaseFlow` numbers the who step first, then tickets, then amount, then pay. The seat map lives inside the ticket step, after the name.

`EventRegisterForm` already hides `holdCountdown` unless `selectedSeatKeys.length > 0` and `expiresAt` is set. The line is `text-sm` and `muted-foreground` inside `EventRegisterSeatHoldNotice`. On the desktop surface the notice is inline. On the PWA surface it is a sticky bar (`seatNoticePlacement="sticky"`).

`EventRegisterSeatPicker` disables a button when the last painted state is not `free`. `toggleSeat` does not read that state. A seat can still be added from a stale map, and the hold request learns the conflict after the click.

## Decision

1. **Order.** If `showSeatPicker` is true, render the ticket step before `EventRegisterWhoStep`. Step numbers follow that order. Amount and pay stay last.
2. **Quantity vs companions.** The quantity field stays in the first step, next to the map. Companion name, DNI, email, and birth date render after the who step. Split that inside `EventRegisterMultiTicketSection` with a mode, or a second small component. Do not pass a pile of boolean layout props through the purchase flow.
3. **Clock.** Render the countdown only when at least one seat is selected and the hold has `expiresAt`. Place it above the map on desktop and in the existing sticky bar on the PWA. Use `text-2xl` (or larger), `font-medium`, `tabular-nums`, and `text-[var(--color-foreground)]` on `bg-[var(--color-background)]`. Keep one short sentence from `holdCountdown`. Do not add a second clock.
4. **Click check.** Before adding a seat, refuse it when the painted state is not `free`. Also refresh `GET /api/events/[slug]/seats` for that click. If the key is locked or held by someone else, do not add it. Refresh the map. Set the lost-seat notice for that key and keep the rest of the form. Reuse `lostSeatsNotice`, `chooseAnotherSeat`, and `seat_lost` tracking. If the refresh fails, do not add the seat and show `holdFailed`.
5. **Deselect.** Removing a seat does not need a fresh availability check. When the selection becomes empty, hide the clock.

## Surfaces (Web vs PWA)

Tier A. Public event registration. Both trees share `EventRegisterForm`.

- **Web (`web-desktop`).** `EventRegisterDesktop` keeps the default inline notice. The clock sits above the map in the first step. It scrolls with the form. No fixed bar.
- **PWA (`web-mobile` / `pwa-mobile`).** `EventRegisterPwa` keeps `seatNoticePlacement="sticky"`. The same clock is the loud line in the sticky bar. Respect `env(safe-area-inset-bottom)`. Buttons stay at least 44px. The map order matches the desktop form. Do not add an `isPwa` flag to the shared picker.

Shared hooks and the enroll action stay compatible with both trees. Preview mode still shows the map and does not start a hold (`enabled: showSeatPicker && !preview`).

## Copy

No new keys if `holdCountdown`, `lostSeatsNotice`, `holdFailed`, and `chooseAnotherSeat` cover the lines. Spanish stays neutral tuteo. Add a key to `en.json`, `es.json`, and `pt.json` only if a line is missing.

## Tests

- Seat picker: a non-free seat click does not call the change handler with that key.
- Hold hook or picker: a refresh that marks the clicked key taken does not add it and surfaces the lost-seat notice.
- Purchase flow: with a seat map, the ticket step node is before the who step. Without a seat map, the who step stays first.
- Countdown text is absent when the selection is empty and present when a seat is selected.

## Risks

- `EventRegisterPurchaseFlow` is near the 250-line limit. Extract the reordered steps instead of growing the file.
- A click-time GET adds one request per new seat. Do not poll faster than the existing 15s interval.
- A failed GET must not look like a successful hold.

## Manual QA (user)

- Seat-map event, desktop: quantity and map are first. The clock appears only after a seat is chosen and is easy to read. The name comes after.
- Same event, narrow PWA: the sticky clock matches that rule and clears the home indicator.
- Two buyers: the second click on a just-taken seat does not select it and asks for another seat. Typed fields stay.
- Event with no map: the name is still first.
