# Home popup for featured events

**Intent:** In event admin, staff can mark a published upcoming event to appear as a dialog on the public home, so it is the first thing a visitor sees. If more than one event is marked, that same dialog is a carousel. The dialog always has a visible close control.

**Done when:**

- Event detail has a “Show on the home” control. It persists per event.
- The public home (`/[locale]`) opens one dialog when at least one eligible event is marked. One event shows that event. Two or more show a carousel of those events.
- The dialog can be closed with the close button, Escape, and the backdrop. After close, it stays closed for that browser session unless the set of featured events changes.
- Copy is in `en`, `es`, and `pt`. The admin change is audited. Tests cover eligibility, the carousel index, and that a dismissed set does not reopen.

**Out of scope:**

- Popups on routes other than the home.
- Auto-advancing slides.
- A new carousel library.
- Editing the popup layout per tenant template. One shared dialog, brand tokens only.
- Featuring drafts, cancelled, closed, archived, past, or section-private events.

## Context

Events are public when `status = 'published'` and `archived_at` is null (`events_select_public_or_admin`). Admins publish from `AdminEventPublishBar`. The home is `src/app/[locale]/page.tsx`, shared by every tenant landing through `LandingSurfaceGate`. There is no home announcement today.

`private_to_section` exists on `events`. Those events must not be promoted on the public home.

The shared `Modal` atom already uses `<dialog>`, traps focus, supports Escape, and renders a dictionary-backed close control. Public event cards already show cover, title, date, place, price, and a link to `/${locale}/events/${slug}`.

This adds a column and a public home surface. ADR required (`10-engineering-governance.mdc`).

## Decision

Add `show_on_home BOOLEAN NOT NULL DEFAULT false` on `public.events`.

The home loads a bounded list (at most 8) of events that are all of:

- `show_on_home = true`
- `status = 'published'`
- `archived_at` is null
- `private_to_section = false`
- `event_date >= now()`

Ordered by `event_date` ascending (soonest first). Titles, descriptions, and locations use the existing translation resolver for the active locale.

One client dialog mounts on the home for every template. Zero rows: render nothing.

## Options considered

- Show every published event without a flag. Rejected: staff asked to choose which events interrupt the home.
- One popup per event, stacked. Rejected: several dialogs trap focus and hide the close control.
- Autoplay the carousel. Rejected: WCAG carousel guidance treats auto-rotation as optional and requires a pause control plus `prefers-reduced-motion`. Manual prev/next is the accessible default.
- A new carousel package. Rejected: this is one slide at a time with prev/next. `@dnd-kit` does not apply. The repo already has prev/next gallery controls.

## Behavior

### Admin (Tier B)

On every event’s summary tab, a checkbox “Show as a popup on the home”, including drafts. The lead says it appears on the home only while the event is published, public, and still upcoming. Saving calls a server action, `recordSystemAudit` (`event_show_on_home_updated`, resource `event`, payload `{ show_on_home }`), `revalidatePath` for the admin event page and `/${locale}`, then `router.refresh()`.

Unpublishing does not clear the flag. The home query ignores anything that is not eligible, so a draft never pops up.

### Home dialog (Tier A, one shared component)

Mounted from the home page, above the landing, for classic and marketing templates. Not mounted during first-run site setup.

- Native dialog via `Modal` (`role="dialog"`, focus moved inside, focus restored on close).
- Visible close button with a Lucide icon and a dictionary `aria-label`. Escape and backdrop close the same way. No `alert` / `confirm`.
- Content per slide: cover (stable frame, loading state until the image settles), title, date (`Intl`), location when present, short plain-text excerpt, price via the existing price display, and a link button to the event page. Touch targets at least 44px. Safe-area padding on small screens.
- One event: no prev/next.
- Several events: `aria-roledescription="carousel"`, previous and next buttons (icons + dictionary names), and a text position such as “1 of 3” (not dots alone). Arrow keys move slides while focus is inside the carousel. No autoplay. `prefers-reduced-motion` does not change behavior because nothing animates on its own.
- Opening the dialog does not replace the landing HTML. The page still renders; the dialog opens on the client so the hero can paint. The cover is not marked as the page LCP image.

### Dismissal

`sessionStorage` key `ge:home-event-popup`, value = stable id list of the events currently eligible (sorted).

- If the stored list equals the current list, do not open.
- If the visitor has not dismissed this set, open.
- Close writes the current list.
- A new or removed event changes the list, so the dialog shows again in that session.
- A new browser session shows it again. No long-lived cookie.

### Analytics

Reuse `click` (no new `event_type`) with entity `section:events` and sanitized metadata: `surface: "home_popup"`, `event_id`, and `intent` of `dismiss` or `open_event`. No names or emails.

## Consequences

- Existing events stay off the home until an admin opts in.
- At most 8 slides. A ninth opted-in upcoming event waits until an earlier one is past or unmarked.
- Past events drop off automatically because of `event_date`.
- Section-private events never appear, even if the flag was set.

## Tests

- Pure eligibility: drops drafts, archived, private, past, and unmarked; caps at 8; orders by date.
- Dismissal helper: same id list stays closed; a changed list opens.
- Dialog smoke: close button is named; two events expose previous/next and the position text; one event does not.

## Manual QA (user)

- Mark one upcoming public event: home shows that dialog; close hides it until a new session.
- Mark a second: the dialog is a carousel; both events are reachable; close still works with the button, Escape, and the backdrop.
- Draft, past, or section-private events do not appear.
- Check a marketing landing and a phone-width home.
