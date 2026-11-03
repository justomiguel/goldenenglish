# Section Daily rooms

ADR: `docs/adr/2026-11-03-section-daily-rooms.md`

## Intent

An Ecosistema institute can mark a section as in person, hybrid, or remote. A hybrid or remote section gets one private Daily room per weekly schedule slot. The teacher and enrolled students join that same room each week.

## Current state

Daily is not integrated. A calendar event can store an external meeting URL. That URL stays as it is. "Live class" on the teacher contents screen is a written record.

`platform_tenants` already stores per-institute secrets such as `resend_api_key`. The Pulsar tenant form edits those fields. `TenantConfig` loads them. `TenantPublicEnv` must not receive secrets.

`academic_sections.schedule_slots` is a list of weekday and start and end time. There is no row per class date.

The student home already renders `StudentNextClassCard` on desktop and inside `PwaPageShell`. The teacher section page is one desktop layout. The admin section configuration panel is desktop.

## Decision

### Institute record in Pulsar

Add these columns on `platform_tenants`:

- `commercial_plan`: `pagina`, `gestion`, or `ecosistema`. Default `gestion` for existing rows.
- `daily_api_key`: nullable text. Server only.
- `daily_domain`: nullable hostname, such as `academia.daily.co`. No scheme and no path.

`platform_tenant_owners.plan` stays `free` only. Do not reuse it for Página, Gestión, or Ecosistema.

Map the three fields on `TenantConfig` and on the Pulsar tenant form, in the same group as the Resend key. Also accept them inside `TENANTS_CONFIG_JSON` for local fallback. Do not put the key or the domain on `TenantPublicEnv`.

A change of plan or of the Daily key writes a Pulsar audit row. The payload lists the field names. It does not include the key.

### Section mode

Add `delivery_mode` on `academic_sections`: `in_person`, `hybrid`, or `remote`. Default `in_person`.

The control is on the admin section configuration panel. It renders only when `commercial_plan` is `ecosistema`. Página and Gestión keep the section screen as it is today.

`in_person` shows no Daily controls. `hybrid` and `remote` use the same Daily rules. Hybrid means the room is for people who are not in the classroom.

Only an institute admin can change the mode. The teacher cannot.

Saving the mode writes `recordSystemAudit` with the section id and the new mode.

### Rooms

When the saved mode is `hybrid` or `remote`, the plan is `ecosistema`, and both Daily fields are present, the server ensures one private room per schedule slot.

Store the room on the institute database in `section_daily_rooms`:

- `section_id`
- `day_of_week`
- `start_time`
- `daily_room_name`
- `daily_room_url`

Unique on `(section_id, day_of_week, start_time)`. The room name is `s` plus 32 hex characters. Privacy is `private`. Knocking is off. The room has no expiry, because the same URL is reused each week.

Create the room with `POST https://api.daily.co/v1/rooms` and `Authorization: Bearer` the institute key. Delete with `DELETE /v1/rooms/:name` before deleting the local row.

If a slot is removed, delete that room. If the mode becomes `in_person`, delete every room for the section. If the plan is no longer `ecosistema`, leave the rows in place and stop join. A later return to `ecosistema` reuses those rows.

If the key or the domain is missing, still save the mode. Do not call Daily. The configuration panel says the Daily fields are missing in Pulsar. The join button stays hidden.

If Daily fails, still save the section. The panel names each slot that has no room. The next save retries only those slots. A failed delete keeps the local row until Daily accepts the delete.

### Join window

Use the institute timezone from `analytics.timezone`. If that value is missing, use `America/Argentina/Cordoba` from `SYSTEM_PROPERTIES_DEFAULTS`.

The window opens 15 minutes before the slot start. It closes two hours after the slot end. The token `exp` is that close time.

If two windows contain the current time, the button uses the slot with the earlier start.

### Who may join

The server issues a token only when all of these are true:

- `commercial_plan` is `ecosistema`.
- `delivery_mode` is `hybrid` or `remote`.
- The Daily key and domain are present.
- A `section_daily_rooms` row exists for that slot.
- The current time is inside the window.
- The user is `academic_sections.teacher_id`, or a student with `section_enrollments.status = active` for that section.

A section assistant does not receive a token. A parent does not receive a token.

Issue the token with `POST https://api.daily.co/v1/meeting-tokens`. Set `room_name`. Set `is_owner` true only for the teacher. Set the display name from the profile. Do not self-sign tokens in this version.

On success, record a product `action`. The entity is `section:daily_class`. Metadata is the section id, the weekday, and the start time. The token is not metadata.

On Daily failure, show a dictionary error and a way back. Do not leave a token in the browser.

Log server failures with `[ge:server]` and scope `sectionDaily.join` or `sectionDaily.syncRooms`. Do not log the key or the token.

## Surfaces (Web vs PWA)

### Admin section configuration

Tier B, desktop only. The mode control is three choices on the existing configuration panel. Presencial hides every Daily line. Hybrid and remote show the missing-key notice or the slot sync result. No PWA tree.

### Student home

Tier A. `StudentDashboardEntry` already mounts the same `StudentNextClassCard` on desktop and inside `PwaPageShell`.

- Web: the join control sits on that card when the window is open.
- PWA and mobile browser: the same card shows the control at full width, at least 44 px tall, inside the existing safe-area shell.

The button is absent outside the window, for an in-person section, and when Daily is not ready.

### Teacher section page

The roster stays one layout. Add the join control next to the section name on a wide viewport. On a narrow viewport the same control is full width and at least 44 px tall. Do not rebuild the roster as a second tree.

### Call screen

New private routes:

- `/{locale}/dashboard/student/sections/{sectionId}/class`
- `/{locale}/dashboard/teacher/sections/{sectionId}/class`

The query carries `day` and `start`. `day` is `day_of_week` from 0 to 6. `start` is the slot `start_time`, `HH:MM`. Both routes are noindex, like the rest of the dashboard.

The server action returns the room URL and the token. The page loads Daily Prebuilt with those two values. The API key stays on the server.

- Web: the call fills the content area. A leave control returns to the previous dashboard page.
- Phone: the call uses the viewport, respects safe areas, and places the leave control in the thumb zone.

Both surfaces share the token action. They do not share one responsive call layout.

## Done when

- CentroListo staff can set Página, Gestión, or Ecosistema, plus the Daily key and domain, on the institute form.
- An Ecosistema admin can set the section mode. Other plans do not show the control.
- A hybrid or remote section has one stored room per slot after a successful Daily sync.
- An in-person save removes those rooms.
- The teacher and an active student can join during the window. Everyone else is denied.
- The student button appears on desktop and on the PWA home. The teacher button is usable on a narrow viewport.
- Copy for the new controls is in `en.json`, `es.json`, and `pt.json`. Spanish uses neutral tuteo.
- Tests listed below pass without calling Daily.

## Out of scope

- Parents joining the room.
- Recording, transcripts, and live streaming.
- A new room per calendar date.
- One room shared by every slot in the section.
- Replacing the calendar event meeting URL.
- A teacher-edited delivery mode.
- Self-signed meeting tokens.

## Tests

Do not call the Daily API. Inject a room client in tests.

- The join window follows the institute timezone. It opens 15 minutes before the start and closes two hours after the end.
- Overlapping windows pick the earlier start.
- Página and Gestión do not expose the mode control. Ecosistema does.
- In person does not create rooms. Hybrid and remote ask for one room per slot.
- The token action denies the wrong plan, an in-person section, missing credentials, a missing room, a person who is not the teacher and not an active student, and a time outside the window.
- An assistant is denied.
- `daily_api_key` and `daily_domain` are absent from `TenantPublicEnv`.
- The configuration panel hides Daily lines when the mode is in person.
- The student card renders the join control only inside the window, on the desktop tree and on the narrow tree.

## Manual QA (user)

- Set one institute to Ecosistema and paste a Daily key and domain in Pulsar.
- Mark one section hybrid, with two weekly slots. Confirm two private rooms in the Daily dashboard.
- Join as the teacher and as an enrolled student during the window. Confirm an assistant and a student from another section cannot join.
- Switch the section to in person and confirm the rooms are gone.
- Set the plan back to Gestión and confirm the mode control and the join button disappear.
