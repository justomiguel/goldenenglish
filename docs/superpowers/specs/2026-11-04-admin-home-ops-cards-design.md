# Admin home — ops cards

**Date:** 2026-11-04
**Status:** Draft — waiting for approval
**Tier:** B — admin desktop home. No PWA tree.

## Intent

The institute admin home shows the numbers a director checks in the morning.

1. Mails sent this calendar month against a cap of 5000 per institute.
2. Seats taken on each published event that has not started yet.
3. Active section enrollments in the current cohort, with the cohort name.
4. Classes today, and how many still have no attendance list.
5. Trial seats this week: booked, attended, and released.
6. Sections in the current cohort that are full or have one seat left.
7. Waitlist size on published events that have not started.
8. Event payments that still need a staff review.

## Done when

- The home board shows a mail card: `used / cap` and a bar. Default cap is 5000.
- A successful branded send writes one ledger row. The row stores how many recipients Resend accepted.
- A send that would pass the cap does not call Resend. The caller gets a stable code `email_monthly_cap`.
- The events card lists up to three published, not archived events with `event_date >= now()`. Each line shows held seats and capacity.
- A cohort card shows the current cohort name and the count of `section_enrollments` with `status = active`.
- A classes-today card shows how many current-cohort sections meet today and how many have zero attendance rows for that date.
- A trials card shows this week's `booked`, `attended`, and `released` counts.
- A section-seats card shows how many current-cohort sections are full and how many have one seat left.
- A waitlist card shows the waitlist total for those same upcoming published events.
- An event-payments card shows how many `event_payments` rows are `pending` and have no gateway.
- Copy is in `en.json`, `es.json`, and `pt.json`.
- Vitest covers the cap math, the ledger write, the refuse path, and a parser plus card smoke for every new number.
- An ADR records the ledger and the hard stop.

## Out of scope

- Backfill of mails sent before the ledger exists. The first month starts at 0.
- A platform-wide cap across institutes. Each institute database has its own ledger and cap.
- Editing the cap from CentroListo / Pulsar. The institute admin edits it on the existing email settings screen.
- A card for students under the section attendance minimum.
- A free-trial inventory. The product does not store open trial capacity. "Libres" on the card means seats with status `released`.
- Student or parent home. This screen is Tier B.

## Surfaces (Web vs PWA)

Admin home lives in `src/app/[locale]/dashboard/admin/page.tsx` and `AdminHubHome`. Search found no `AdminHubHome` under `src/components/pwa/`.

- **Web (`web-desktop`):** the cards sit on the existing widget board (`adminHomeLayout`).
- **PWA:** no tree. Do not add one. Shared loaders stay server-only and do not change Tier A props.

## Decisions

| Topic | Choice |
| --- | --- |
| Mail window | Calendar month in UTC. `sent_at >= date_trunc('month', timezone('utc', now()))`. |
| What counts | `recipient_count` on each successful provider accept. One API call that sends 40 mails adds 40. |
| Cap storage | `site_settings` key `email_monthly_cap`. Missing or invalid value means 5000. Staff can change it on the email settings form. |
| Hard stop | Yes. If `used + this send > cap`, do not send. Do not send a partial batch. |
| Past mails | Not counted. The card copy says the count starts with this counter. |
| Event window | Published, `archived_at` is null, `event_date >= now()`, nearest first, max 3 on the events card. |
| Seats | Same meaning as `events_admin_attendees_aggregates.total_seats`: attendee rows with `status <> 'cancelled'`. |
| Waitlist | Attendee rows with `status = 'waitlist'` on every published event in that window, not only the three lines. |
| Inscripciones | Active section enrollments in the cohort with `is_current = true`. The card names that cohort. Empty state when no current cohort. |
| Today | Institute zone from `analytics.timezone` (`getInstituteTimeZone`). Weekday `0 = Sunday` … `6 = Saturday`, same as `schedule_slots.dayOfWeek`. |
| Class meets today | Non-archived section of the current cohort whose parsed slots include today's weekday. |
| Missing list | That section has no `section_attendance` row for today on any of its enrollments. One row is enough to count the list as started. |
| Trial week | Monday through Sunday of the current institute week. Counts use `registration_trial_seats.scheduled_on` and `status`. |
| Section seats | `max_students` minus active enrollments. Full means zero seats left. One-left means exactly one. Skip a section when `max_students` is null. |
| Event payment review | `event_payments.status = 'pending'` and `gateway_provider` is null. Gateway rows stay on the finance hub. |
| Widget ids | `emailQuota`, `cohortEnrollments`, `classesToday`, `trialsThisWeek`, `sectionSeats`, `eventWaitlist`, `eventPaymentsReview`. Extend `upcomingEvents`. `layoutFromDraft` appends missing ids, so saved layouts gain the cards. |

## Card links

| Card | Href |
| --- | --- |
| Mail | `/{locale}/dashboard/admin/settings` |
| Events and waitlist | `/{locale}/dashboard/admin/events` |
| Cohort and section seats | `/{locale}/dashboard/admin/academic/{cohortId}` |
| Classes today | `/{locale}/dashboard/admin/calendar` |
| Trials | `/{locale}/dashboard/admin/registrations` |
| Event payments | `/{locale}/dashboard/admin/finance` |

## Options considered

1. **Read Resend's API for the month.** Rejected. The key is per institute, the call is slow, and a failed network hides the number. A local ledger is the source the cap can enforce.
2. **Show the cap and never block.** Rejected. A cap that still sends is only a label.
3. **One query per card.** Rejected. The home loads one snapshot. The page stays one round trip.
4. **Count only titular event rows as seats.** Rejected. Companion rows hold seats. Match `total_seats`.

## Data

New migration `supabase/migrations/250_email_send_ledger.sql`:

- Table `public.email_send_ledger`: `id`, `sent_at timestamptz default now()`, `template_key text`, `recipient_count int check (> 0)`.
- Index on `sent_at`.
- RLS on. `authenticated` admin can `select`. Inserts go through the service role only. No policy for `anon`.
- No `TRUNCATE` and no destructive change.

Cap is a row in `site_settings`, not a new env var (`46-prefer-database-over-env`).

Add `public.admin_home_ops_snapshot(p_today date, p_week_start date, p_week_end date, p_weekday int)` returning `jsonb`:

- `email_used` for the UTC month
- up to three event rows (`id`, `title`, `event_date`, `capacity`, `seats`)
- `waitlist_total` for all published events with `event_date >= now()`
- current cohort `id`, `name`, `active_enrollments`
- `classes_meeting`, `classes_missing_attendance`
- `trials_booked`, `trials_attended`, `trials_released`
- `sections_full`, `sections_one_left`
- `event_payments_pending_review`

The function reads `email_monthly_cap` from `site_settings` and returns it as `email_cap` (default 5000). Class and section counts use the current cohort only. Schedule matching uses `jsonb` slots with `dayOfWeek`.

`SECURITY DEFINER`, `search_path = public`, `REVOKE` from `public` and `anon`, `GRANT EXECUTE` to `authenticated`. Same grant as `admin_hub_profile_counts`. The admin home calls it only after `resolveIsAdminSession`. Document that gate in the ADR.

## App layers

- Pure: `src/lib/email/emailMonthlyCap.ts` — parse cap, decide allow or `email_monthly_cap`. No Supabase.
- Pure: `src/lib/dashboard/adminHomeOpsWindow.ts` — today, weekday, and Monday–Sunday dates in the institute zone. No Supabase.
- Pure: `src/lib/dashboard/parseAdminHomeOpsSnapshot.ts` — normalize the jsonb. No Supabase.
- Send path: after a successful Resend accept, insert the ledger row. Before send, read the month sum and call the pure check.
- Loader: `loadAdminHomeExtraWidgets` reads the snapshot when the layout shows any of these widgets.
- UI: one card component per widget, size `s`, except the events card which stays `m`. Mail card uses a `<progress>` bar. Empty states use dictionary lines.
- Settings: number field on `EmailSendsAdminSettingsForm`. Save validates an integer from 1 to 100000, writes `site_settings`, and calls `recordSystemAudit`.
- Refresh: settings save uses `revalidatePath` and `router.refresh()` (`27`).
- Logs: refuse, ledger insert failure, and snapshot failure use `[ge:server]` with scope `email.monthlyCap` or `adminHome.opsSnapshot`. Do not log recipient addresses.
- i18n: `admin.home.layout.widgets` plus the settings label. Spanish is neutral tuteo (`40`).
- Analytics: page view already covers the home. The cap edit is audit, not `user_events`.

## Error handling

- Ledger insert failure after Resend accepted the mail: log the error. Do not tell the recipient the mail failed. The month count can be short by that send. Say this in the ADR.
- Snapshot error: each new card shows its empty line. Log the Supabase error. Do not break the rest of the home.
- No current cohort: cohort, classes-today, and section-seats cards show the empty line.
- Cap setting save with a bad number: return a stable code. The form shows the dictionary error.

## Tests

- `emailMonthlyCap`: 4999 + 1 allows; 4999 + 2 refuses; missing cap is 5000; 0 and negative caps are invalid.
- `adminHomeOpsWindow`: a known instant in `America/Argentina/Cordoba` returns the expected date, weekday, and week bounds.
- Send path: success inserts `recipient_count`; at the cap, Resend is not called.
- Snapshot parser: events, empty events, cohort, no cohort, class counts, trial counts, seat counts, waitlist, pending payments.
- Card smoke: mail `12 / 5000`, event seats, cohort name, classes `3` with `1` missing, trials `2 / 1 / 0`, seats `1` full and `2` with one left, waitlist, pending payments.
- Settings action: writes the key and audits; rejects 0.

## Risks

- A bulk reminder near the cap fails as a whole. The card is the place the director sees why.
- Companion ticket rows count as seats. That matches the events admin aggregate.
- Institutes that already sent mail this month will see a low number until the month rolls.
- A section with one attendance row counts as started, even if some students are still blank.
- `released` is not unused capacity. The card label must say the seat was released.

## ADR

Write `docs/adr/2026-11-04-admin-home-email-cap.md` in the same change: context, the ledger plus hard stop, the rejected Resend-API option, the snapshot grant, and the short-count risk when the ledger insert fails.

## Manual QA (user)

- Open the admin home. Confirm the eight cards and the empty states.
- Send one test mail. Confirm the counter moves by 1.
- Set the cap to the current used count. Confirm the next send does not go out.
- Open an event with companions. Confirm the seat number matches the event admin total seats.
- On a day with class, confirm the classes card matches the calendar.
- Book a trial this week. Confirm the booked count moves by 1.
