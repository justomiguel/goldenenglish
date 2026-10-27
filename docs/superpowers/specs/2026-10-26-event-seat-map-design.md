# Event Interactive Seat Map and Reservations Design

**Date:** 2026-10-26  
**Sub-project:** 2 of 2 (follows Sub-project 1: Event Dual Bank Transfer Sources)

## Intent

Make the numbered seat map **optional per event**:

1. **General admission (default, seat map off):** The event sells tickets up to the total `capacity` limit without a seat map, preserving the current behavior.
2. **Numbered seat map (when enabled by staff):** Staff turn on the seat map toggle for the event. By default, the editor immediately displays a full seat matrix for the floor (e.g., 10 rows × 16 columns) so all seats are visible right away. Staff configure each floor in two clear stages modeled after major ticketing platforms (Eventbrite, Ticket Tailor, Pretix):
   - **Stage 1 — Matrix dimensions:** Set `rows`, `cols` (seats per row), `startRowLabel`, `startSeatNumber`, optional aisle split (`splitIntoTwo`), the column after which the aisle appears (`aisleAfterCol`, `1..cols-1`), and the stage position (`top`, `bottom`, `left`, or `right`).
   - **Stage 2 — Paint seat availability:** Choose a brush (`Available / Free`, `Reserved by staff`, or `Unavailable / Hidden`) and click, drag-paint across a rectangular selection of seats, or click row/column headers to paint entire rows or aisles. Seats marked `Unavailable / Hidden` stay visible as ghosted cells in the admin matrix and disappear (leaving the physical space) on the public map.

When the seat map is enabled for an event, the public registration form renders a clean vector map with the stage and floor tabs (hiding the admin guide photo). A buyer must pick one seat per ticket in the registration (the primary attendee plus each companion). Selected seats stay in `pending` state while payment is under review. When staff approve the payment, the seats change to `purchased`. When staff reject the payment or remove the registration, the seats return to `free`. When the seat map is disabled, the public form shows no seat picker and enforces only the numeric event capacity.

## Done When

- Migration `220_event_seat_map.sql` (and `supabase/migrations/masterdb.sql`) adds `seat_map_config JSONB NULL` to `public.events` and `seat_assignments JSONB NULL` ( plus indexed lookup table `public.event_seat_locks`) to `public.event_attendees`.
- Pure domain module `src/lib/events/seatMapModel.ts` validates the 1000x1000 floor config, generates row and seat labels (`Row + Number`, with optional two-block aisle split), filters hidden cells, and computes seat totals.
- Pure domain module `src/lib/events/seatMapState.ts` resolves the four seat states (`free`, `reserved`, `pending`, `purchased`) and validates that a registration selects one free seat per ticket.
- Admin event detail adds a seat map editor tab with an explicit enable/disable toggle (`enabled: boolean`). When disabled, the event uses standard capacity-only ticket sales. When enabled, staff manage floors, upload an admin-only guide image with `InlineUploadProgressBar`, draw and split rectangular blocks on a 1000x1000 canvas, toggle hidden or staff-reserved seats, and sync total capacity from the visible seats.
- Public event registration (`EventRegisterForm` across Desktop and PWA surfaces) renders the clean vector seat picker with floor tabs, stage banner (`top`, `bottom`, `left`, `right`), row letter guides, realistic theater armchair (`butaca`) seat silhouettes with seat numbers inside, empty physical spacers for hidden cells, zoom controls, accessible legend, and seat chips when the event has an active seat map.
- Enrollment (`POST /api/events/[slug]/enroll` and `enroll_event_attendee` RPC) atomically locks the chosen seats as `pending` (or `purchased` when the event is free or paid via instant gateway) and rejects taken seats with code `seat_already_taken`.
- Manual payment review (`markEventPaymentApprovedCore`, `rejectEventPayment`, `revertEventPaymentApprovalCore`, `deleteEventPaymentServer`) and attendee removal update or release the seat locks.
- Admin Attendees, Admin Payments, and XLSX/PDF attendee exports display the assigned seat labels.
- Dictionaries `en.json`, `es.json` (neutral `es-419` tuteo), and `pt.json` include all seat map keys.
- Self-contained Vitest unit and component tests pass for the new modules and UI.

## Out of Scope

- Automatic computer-vision seat detection from the uploaded image (the image acts as a visual tracing guide on the 1000x1000 admin canvas).
- Automatic expiration timer (TTL cron) for pending bank transfer seats; seats remain pending until staff approve, reject, or delete the registration.
- Different prices per individual seat (pricing continues to use the event, residency tier, flow, or ticket package rules).
- Curved or arbitrary polygon blocks (rectangles with optional two-part aisle split cover the venue layouts).

## Approaches Considered

1. **JSONB floor geometry on `events` + relational `event_seat_locks` table for active holds (Recommended):**
   - Stores floor definitions, rectangular blocks, hidden seat keys, and staff-reserved seat keys in `events.seat_map_config`.
   - Stores one row per occupied seat (`event_id`, `seat_key`, `attendee_id`, `seat_label`) in `public.event_seat_locks` with a `UNIQUE (event_id, seat_key)` constraint.
   - Pros: Postgres enforces zero double-booking with a unique index. Admin edits to block geometry stay fast. Rejecting a payment frees seats by deleting lock rows for that attendee.
   - Cons: Requires a small join or subquery to load occupied seat keys on the public page.
2. **Every individual seat as a row in a `public.event_seats` table:**
   - Rejected: resizing a drawn rectangle or changing row counts in the admin editor would require mutating hundreds of rows per drag operation and complicates undo/save.
3. **Storing both geometry and buyer holds inside a single JSONB column on `events`:**
   - Rejected: concurrent public checkouts would rewrite a large JSONB document and risk lost updates or heavy contention.

## Architecture & Data Flow

### 1. Coordinate System & Floor Matrix (`events.seat_map_config`)

- `seat_map_config` is `null` (or `{ enabled: false, floors: [] }`) by default. When `enabled` is `false`, the event operates in capacity-only mode (`events.capacity`) and ignores seat locks.
- When `enabled` is `true`, each floor has `id`, `name` (e.g. `Platea Baja`, `Platea Alta`), `order`, an optional `guideImageUrl` (shown only in the admin editor), a `stage` banner, and a default full-floor matrix block (`blocks[0]`) initialized with visible seats (`12 rows × 18 columns`) so every seat is immediately visible without manual rectangle drawing.
- **Two-stage admin workflow per floor:**
  1. **Stage 1 (Matrix dimensions):** Staff set `rows` (1..100), `cols` (1..100), `startRowLabel` (default `A`), `startSeatNumber` (default `1`), and optional center aisle (`splitIntoTwo`). Changing dimensions immediately renders the full seat matrix.
  2. **Stage 2 (Paint / unpaint seat availability):** Clicking or dragging across seats toggles directly between `free` (Available) and `hidden` (Unavailable / does not exist), acting as paint/unpaint based on the first seat clicked (clicking a free seat paints `hidden`; clicking a hidden seat unpaints back to `free`). Staff can also select the `reserved` brush to paint/unpaint staff holds, or click row/column headers (`A`, `B` / `1`, `2`) to toggle entire rows or columns.
- **Auto-renumbering across hidden/aisle cells:** Within each row, cells marked in `hiddenSeats` (aisles/cutouts) do not consume a seat number. Visible seats (`!hidden`) are numbered sequentially (`startSeatNumber`, `startSeatNumber + 1`, …) left-to-right across the row. If an entire row is hidden, subsequent visible rows still keep clean row letters.
- Global seat key format: `${floorId}:${blockId}:${rowIndex}:${colIndex}`.
- Human-readable label format: `${floorName} · ${rowLabel}-${seatNumber}`.

### 2. Seat States & Database Contract (`220_event_seat_map.sql`)

- Table `public.event_seat_locks`:
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE`
  - `seat_key TEXT NOT NULL`
  - `seat_label TEXT NOT NULL`
  - `attendee_id UUID NOT NULL REFERENCES public.event_attendees(id) ON DELETE CASCADE`
  - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - `UNIQUE (event_id, seat_key)`
- Column `public.event_attendees.seat_labels TEXT[] NULL` stores the human-readable labels on the primary attendee row for fast display in lists and XLSX/PDF exports.
- Effective state resolution for each visible seat key:
  - In `block.reservedSeats` -> `reserved` (staff).
  - In `event_seat_locks` where primary attendee `status = 'confirmed'` -> `purchased`.
  - In `event_seat_locks` where primary attendee `status = 'pending_payment'` -> `pending`.
  - Otherwise -> `free`.

### 3. Enrollment & Payment Lifecycle

1. Public page loads `seat_map_config` (stripping `guideImageUrl`) and the current `event_seat_locks` statuses (`pending` vs `purchased`).
2. Buyer chooses \(K\) seats where \(K = 1 + \text{companions.length}\).
3. `POST /api/events/[slug]/enroll` validates the \(K\) `seatKeys` against `seat_map_config` and passes them to `enrollEventAttendeeServer`.
4. Inside the enrollment flow, the server inserts into `event_seat_locks`. If a unique violation (`23505`) or taken check occurs, enrollment rolls back the attendee row and returns `seat_already_taken` (HTTP 409) so the client refreshes the map.
5. When `approveEventPayment` / `markEventPaymentApprovedCore` promotes the attendee to `confirmed`, the seat state automatically resolves to `purchased`.
6. When `rejectEventPayment` or `deleteEventPaymentServer` rejects/deletes a payment, the server deletes the attendee's rows from `event_seat_locks` (and sets the attendee to `cancelled` on rejection or frees the hold) so the seats become `free` again.
7. When an admin deletes an attendee, `ON DELETE CASCADE` removes `event_seat_locks` and frees the seats.

### 4. Accessibility & Surfaces

- Public `EventRegisterSeatPicker` renders a structured theater layout aligned with the admin matrix:
  - Stage banner positioned at `top`, `bottom`, `left`, or `right` (`resolveStagePosition`).
  - Row letter badges (`A`, `B`, `C`, …) at the start and end of each row, plus the configured center aisle gap (`resolveBlockAisleCol`).
  - Each visible seat renders as an interactive theater armchair (`butaca`) SVG silhouette (curved backrest, armrests, seat cushion) with the seat number centered on the cushion.
  - Hidden cells (`cell.hidden`) render as empty layout spacers of identical dimensions so custom venue shapes and internal aisles keep exact alignment.
- Every seat button includes an `aria-label` with floor, row, number, and state from the dictionary.
- States use both color tokens and distinct visual cues on the armchair (solid primary fill for `free`, secondary fill + ring for `selected`, secondary muted for `reserved`, warning tone for `pending`, muted/crossed for `purchased`) to comply with `.cursor/rules/26-accessibility-contrast.mdc`.
- **Responsive fit-to-screen layout (no scroll at 100% zoom):**
  - Public `EventRegisterSeatPicker` (and admin `AdminEventSeatMapCanvas`) size the seat matrix fluidly using proportional CSS Grid columns (`grid-template-columns` with `minmax(0, 1fr)` per seat column, compact fractional tracks for row labels and the center aisle) inside a `w-full` container.
  - Each seat button and `TheaterSeatIcon` scales via SVG `viewBox` (`h-full w-full aspect-square`) so even wide matrices (e.g., 16–24 columns) shrink to fit mobile and desktop screens without horizontal or vertical scrollbars at default zoom (`1x`).
  - Optional zoom controls still allow zooming in (`> 1x`) if a buyer wants to enlarge a dense section.
