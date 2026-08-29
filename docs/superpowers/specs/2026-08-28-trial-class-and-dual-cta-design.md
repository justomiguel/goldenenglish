# Trial class and dual public CTA (reserve vs agendar clase de prueba)

**Date:** 2026-08-28
**Status:** Approved (brainstorm)
**Kind:** Design spec. One implementation plan under `docs/superpowers/plans/`.

**Related:**

- [`2026-08-28-registration-enrollment-fee-checkout-design.md`](2026-08-28-registration-enrollment-fee-checkout-design.md) — reserve-cupo still creates a lead and pays matrícula on `/matricula/[token]`. Trial is a **second intent** on the same lead table, not a second people model.
- [`2026-08-28-cohort-default-fees-design.md`](2026-08-28-cohort-default-fees-design.md) — trial fee uses the same inherit rule as matrícula: section value if set, else cohort, else `0`.
- [`2026-08-24-registration-existing-student-and-multi-section-design.md`](2026-08-24-registration-existing-student-and-multi-section-design.md) — same DNI lookup, same tutor rules, same multi-section picker storage for reserve. Trial stores seats in a child table.
- [`2026-08-24-admin-email-send-toggles-design.md`](2026-08-24-admin-email-send-toggles-design.md) — new registry keys appear in Settings automatically.
- [`docs/adr/2026-04-communications-email-templates.md`](../../adr/2026-04-communications-email-templates.md) — `sendBrandedEmail` + tenant wrapper.

**Governing rules:** `28-tenant-register-surface.mdc` (do not fork `RegisterForm`; intent is a prop), `03-architecture.mdc` (250-line ceiling), `04-security.mdc`, `09-i18n-copy.mdc` (en + es; keep `pt.json` in the same shape), `12-supabase-app-boundaries.mdc`, `21-migrations-production-no-data-destruction.mdc`, `08-analytics-observability.mdc`, `05-pwa-mobile-native.mdc` (register is Tier A).

## Intent

The public site can show **Reservá tu cupo**, **Agendá tu clase de prueba**, or both. Reserve stays the current pre-inscription → matrícula → enrol path. Trial collects the same person data, books one or more upcoming class slots (those seats count toward cupo), never creates a login, and only becomes a student after the family pays matrícula or the current-month cuota — or the admin enrols them by hand.

Mozarthitos, Espacio Zenit, and Liora **start** with both buttons. Every other tenant **starts** with reserve only. The setting is visible on every tenant so an admin can turn trial on later. There is no hardcoded tenant denylist in application code.

## Context

Today:

- Landing CTAs are template-specific and almost all point at `/{locale}/register`. Liora’s primary label says “clase de prueba” but submits the **same** reserve lead.
- `RegisterForm` + `RegisterSectionMultiSelect` (combo only). Full sections are hidden by `list_registration_section_options` (migration 193).
- `registrations` has no intent. Accept / gateway capture creates the student + tutor and enrols.
- Site settings only gate `inscriptions_enabled`.
- Teacher attendance writes `section_attendance` for **enrolled** students (and feeds the class-credit ledger). A trial visitor has no `section_enrollments` row and must not be inserted there.
- Crons already run every 5 minutes (`/api/cron/class-reminders`) with `verifyCronRequest`.

## Decisions

| Topic | Choice |
|-------|--------|
| Architecture | Same `registrations` lead + child `registration_trial_seats`. `intent = reserve \| trial` |
| Tenant lock | **None.** Setting on every tenant. Defaults differ; admins can change them |
| Default CTA | `both` on Mozarthitos, Espacio Zenit, Liora (per-tenant seed/update). `reserve` everywhere else and as the SQL default |
| Trial fee source | Cohort `offers_trial` + `trial_fee_amount`; section can override each. `0` = free, not “off” |
| Off vs free | `offers_trial = false` hides the section from the trial picker. Amount `0` with `offers_trial = true` is a free trial |
| Cupo | A booked or attended trial seat counts as occupied. Absent / unmarked-next-day / released does not |
| Class date | Next upcoming occurrence of the chosen slot in the institute timezone |
| Calendar vs combo | Shared switch. Desktop default = week calendar. Narrow / PWA default = combo. Full = disabled on calendar, omitted from combo |
| Trial sections | Several seats allowed. One person / one tutor on convert. Checkout picks which seats become enrolments |
| Login | Trial never creates a user. User + welcome mail only after convert pay or admin accept |
| “Vino” | Teacher (attendance visitor row) **or** admin (inbox). Either present sends the convert mail |
| Admin reminder | Cron, **1 hour before** each booked seat |
| No-show | Cron, **next local day** after `scheduled_on` if still `booked`: treat as absent, release cupo, “te extrañamos” mail |
| Late present | If someone marks present after the missed-you mail, still send the convert mail |
| Reschedule | Same lead. Reuse trial payment; more expensive → pay the difference; cheaper → **refund** the difference |
| Convert pay | Family chooses which trial sections to join. Matrícula if due; else **current-month** cuota. Link valid **3 months** from first present |
| Pay without cupo | Never start checkout (trial fee or convert) for a section with no open seat |
| `/i/...` links | Reserve only. No trial intent on section links |
| Same DNI | See below. One open trial at a time |
| Cheaper reschedule refund | Gateway refund when the original charge was Flow/MP and the provider allows it. Transfer → admin records the refund (no silent “keep the money”) |

## Goals

1. Dual CTA from a site setting, with safe defaults and no tenant denylist.
2. Trial form reuses person fields; wording is “agendá tu clase de prueba”.
3. Families pick sections on a week calendar or combo; full sections cannot be paid or booked.
4. Admins see trial leads in the existing inbox with (clase de prueba) and per-seat vino / no vino.
5. Teachers see trial visitors on that date’s attendance and can mark present/absent.
6. After a real visit, a 3-month guest link lets them pay matrícula or the current month and become a student once.
7. After a no-show, they can reschedule (reuse or adjust trial money) from the mail.

## Non-goals

- Hardcoding trial to three template kinds in UI or RLS.
- Creating a login, portal password, or `section_enrollments` row on trial book.
- Writing trial visits into `section_attendance` (would require a student id and would hit the class-credit ledger).
- Formal waitlist or seat-hold expiry for **reserve**.
- WhatsApp / SMS trial reminders (email only).
- “No estoy seguro” on a trial submit (at least one offered, open-seat slot is required).
- Auto-refund of matrícula or monthly cuota (only trial-fee **difference** on cheaper reschedule).
- Changing monthly checkout for students who are already enrolled.
- Password in plaintext in any email (welcome stays set-password invite / login + change password, same as reserve).

## Same DNI

Re-lookup by normalized document on submit, list, and accept (no client-supplied student id).

| Situation | Behavior |
|-----------|----------|
| Already enrolled in **that** section | Reject that seat. Copy: already a student of that class |
| Active student, **other** section | Trial allowed. Convert enrols the new section(s) on the existing profile. Mail is “te sumamos a…”, not welcome / change-password |
| Open trial already (any seat `booked` or `attended` and lead not converted) | Reject a second trial lead. They reschedule or finish the current one |
| Pending **reserve** lead | Trial in another section is allowed. Two inbox rows (reserve vs trial). Do not merge intents |
| Convert of an existing student | No second profile, no second tutor |

## Architecture

### Site setting `public_cta_mode`

Additive `site_settings` row:

```
key = 'public_cta_mode'
value = "reserve" | "trial" | "both"   -- JSON string
```

SQL default / missing key → `reserve`. Public readable (landing needs it), same pattern as `inscriptions_enabled`.

Admin **Settings** shows a three-way control on every tenant. No “hidden for other brands” branch.

Per-tenant **data** (not app code): Mozarthitos, Espacio Zenit, and Liora seeds/updates set `"both"`. Other tenant databases stay at `"reserve"` until an admin changes them.

Landing:

- `reserve` → one button, `/{locale}/register`.
- `trial` → one button, `/{locale}/register?intent=trial`.
- `both` → both buttons.
- Liora stops using “clase de prueba” as the label for reserve.

If `inscriptions_enabled` is false, both public CTAs that go to `/register` stay off. `/i/...` unchanged.

### Cohort and section trial offer

Additive columns (no drops):

**`academic_cohorts`**

| Column | Type | Meaning |
|--------|------|---------|
| `offers_trial` | `BOOLEAN NOT NULL DEFAULT false` | Cohort default: trial exists |
| `trial_fee_amount` | `NUMERIC NOT NULL DEFAULT 0` | `0` = free when offered |

**`academic_sections`**

| Column | Type | Meaning |
|--------|------|---------|
| `offers_trial` | `BOOLEAN NULL` | `NULL` = inherit cohort; `true`/`false` = override |
| `trial_fee_amount` | `NUMERIC NULL` | `NULL` = inherit cohort amount; a number (including `0`) overrides |

Pure helper `resolveSectionTrialOffer(section, cohort)`:

```
offers = section.offers_trial ?? cohort.offers_trial
amount = section.trial_fee_amount ?? cohort.trial_fee_amount
```

(`amount` is ignored when `offers` is false.)

Admin: cohort fee block + section create/edit get a “Clase de prueba” group (toggle + amount). Copy states that `0` is free.

### Lead columns (additive)

No change to `registration_status`. Existing rows stay `intent = reserve`.

| Column | Type | Meaning |
|--------|------|---------|
| `intent` | `TEXT NOT NULL DEFAULT 'reserve'` | `reserve` \| `trial` |
| `trial_convert_token` | `TEXT UNIQUE NULL` | Unguessable; set on first **present** |
| `trial_convert_expires_at` | `TIMESTAMPTZ NULL` | First present + 3 months. Not refreshed on later presents |
| `trial_fee_snapshot` | `JSONB NOT NULL DEFAULT '{}'` | Frozen trial-class quote (`kind: "trial_fee"`) |
| `trial_fee_captured` | `BOOLEAN NOT NULL DEFAULT false` | True after a successful trial-fee capture |
| `trial_reschedule_token` | `TEXT UNIQUE NULL` | Minted on first `absent`. Guest reschedule URL |
| `trial_invite_sent_at` | `TIMESTAMPTZ NULL` | Last convert-invite mail; late present may send again |

CHECK on `intent`. Generate tokens and snapshots in the **server action**, never from the browser.

Reserve keeps using `pay_token` / `fee_snapshot` / `/matricula/[token]` as today.

### Child table `registration_trial_seats`

One row per booked slot on a trial lead.

| Column | Type | Meaning |
|--------|------|---------|
| `id` | `UUID PK` | |
| `registration_id` | `UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE` | |
| `section_id` | `UUID NOT NULL REFERENCES academic_sections(id)` | |
| `day_of_week` | `SMALLINT NOT NULL` | Copied from the slot (`0–6` same as `schedule_slots`) |
| `start_time` | `TIME NOT NULL` | |
| `end_time` | `TIME NOT NULL` | |
| `scheduled_on` | `DATE NOT NULL` | Next occurrence in institute TZ at book / reschedule time |
| `trial_fee_amount` | `NUMERIC NOT NULL` | Frozen effective amount for that section |
| `status` | `TEXT NOT NULL DEFAULT 'booked'` | `booked` \| `attended` \| `absent` \| `released` |
| `marked_at` | `TIMESTAMPTZ NULL` | |
| `marked_by` | `UUID NULL REFERENCES profiles(id)` | Teacher or admin; null when cron auto-absents |
| `admin_reminder_sent_at` | `TIMESTAMPTZ NULL` | Set when the 1 h-before admin mail is sent |
| `missed_mail_sent_at` | `TIMESTAMPTZ NULL` | Set when the family missed-you mail is sent |

CHECK on `status`. Unique `(registration_id, section_id, scheduled_on)` so a lead cannot double-book the same visit.

**Cupo occupancy:** a seat counts if `status IN ('booked', 'attended')`.

`list_registration_section_options` and every open-seat RPC used by register / trial / convert / start-pay must add held trial seats to occupied count (same `max_students IS NULL` = unlimited rule as today).

RLS: no anon select of the child table. Public book/reschedule goes through server actions + `SECURITY DEFINER` RPCs that return a safe projection (section label, schedule, status, amounts). Grant `anon` + `authenticated` only on those RPCs.

### Public form

`RegisterForm` gains `intent: "reserve" | "trial"` from `searchParams` (`?intent=trial`). Invalid `intent` → redirect to `/register` (reserve). If site mode is `reserve`, `intent=trial` redirects to `/register`. If site mode is `trial`, bare `/register` **redirects** to `/register?intent=trial`. If site mode is `both`, bare `/register` is reserve.

Do not add a second form component per tenant. Surfaces keep wrapping the same form.

**Copy:** trial uses “Agendá tu clase de prueba” for shell title, submit, and received mail. Reserve unchanged.

**Fields:** same student / tutor / extras pack as reserve.

**Section picker (both intents):**

- Toggle calendar ↔ combo. Persist only in component state (no setting).
- Viewport: `min-width` desktop breakpoint → calendar first; otherwise combo first. User can switch either way.
- Calendar = week grid of current-cohort public slots (`dayOfWeek` + times). Each cell is a button for `(sectionId, slot)`.
- Trial list = slots where `resolveSectionTrialOffer.offers === true`. Reserve list = all public sections (today’s rule).
- Open seat + offered → selectable.
- Full → calendar cell disabled (visible, not clickable). Combo **omits** it.
- Trial requires ≥ 1 selected slot. Reserve keeps “no estoy seguro”.

On trial submit:

1. Same validation as reserve (inscriptions, schema, DNI rules above).
2. Re-check each slot: still public, still offers trial (if intent is trial), still has cupo **including other trial holds**. Any failure → no insert.
3. Insert lead `intent = trial`, `status = new`. Insert one `registration_trial_seats` row per slot (`status = booked`, `scheduled_on` = next occurrence).
4. Build `trial_fee_snapshot` (`total` = sum of frozen seat amounts; `once` is not used — trial is always per booked seat).
5. If `total > 0`: guest checkout `/{locale}/clase-prueba/[pay_token]` (reuse `pay_token` on the lead). Family mail includes the pay button. Do not start pay if a seat lost cupo between render and click.
6. If `total === 0`: no checkout. Confirm mail only.
7. Admin mail: trial ficha (student, seats, schedule, fee).
8. Mail failure does not fail the insert.

### Guest trial-fee page `/{locale}/clase-prueba/[token]`

Same chrome and payment methods as `/matricula/[token]` (Flow / MP / transfer). Copy is trial, not matrícula. Snapshot kind `trial_fee`. Capture sets `trial_fee_captured` and does **not** run `acceptRegistrationLead`.

If a requested seat is full before capture: no pay UI; they pick another offered open slot (server action). After capture, do not charge again.

### Inbox

Same `/dashboard/admin/registrations` list.

- Badge **(clase de prueba)** when `intent = trial`.
- Per seat: schedule, `booked` / `attended` / `absent`, cupo held or released.
- Filter `trial` alongside today’s urgent / awaiting_fee / etc.
- Admin actions on a seat: present (if `booked`) or absent (if `booked`). Present and absent run the **same domain function** as the teacher path.
- Resend convert mail if `trial_convert_token` is set and not expired.
- Admin accept / waive still allowed: creates the user (or reuses DNI) and enrols chosen sections without waiting for convert pay.
- Reserve rows unchanged.

### Teacher attendance

Loader for a class date adds **visitor rows** from `registration_trial_seats` where `section_id` matches and `scheduled_on` = that date and `status IN ('booked', 'attended', 'absent')`. Label them as trial / visitante. They are not `section_attendance` rows.

Mark present / absent calls `markTrialSeatAttendance`:

- `present` from `booked` or `absent` (late mark after auto no-show) → `attended`. Cupo is held again if it had been released. If the lead has no `trial_convert_token`, mint one and set `trial_convert_expires_at = now + 3 months`. Send `registration.trial_invite` when transitioning **into** `attended` (including late present). Do not send a second invite if the seat was already `attended`.
- `absent` from `booked` → `absent`, cupo released. Mint `trial_reschedule_token` if null. Send `registration.trial_missed` once per seat (`missed_mail_sent_at`).
- Cron auto-absent uses the same function with `marked_by = null`.
- `released` is only for leftover holds after convert pay or convert-link expiry — not a manual mark.

Bulk-fill “all present” for enrolled students **does not** mark trial visitors.

### Cron `GET /api/cron/trial-class-followup`

Auth: `verifyCronRequest`. Schedule: every 5 minutes (add to `vercel.json` next to class-reminders).

1. **Admin reminder:** seats `booked` whose class start (institute TZ, `scheduled_on` + `start_time`) is in `(now, now+1h]` and reminder not yet sent (boolean `admin_reminder_sent_at` on the seat). Email all admins: review whether {student} arrived and mark attendance.
2. **Auto no-show:** seats still `booked` where institute **local date** is `> scheduled_on`. Run the absent path (release cupo + family missed-you).
3. **Convert expiry:** leads with `trial_convert_expires_at < now` and `status != enrolled`: set remaining `attended` seats to `released` (cupo freed). Token stays expired; admin can mint a new one.

Idempotent. Log and continue per seat.

### Reschedule

Missed-you mail button → `/{locale}/register?intent=trial&reschedule={trial_reschedule_token}`. Unknown token → not-found (no ficha leak).

- Allowed when `intent = trial`, `status != enrolled`, and the lead has at least one `absent` seat.
- Picker is the trial picker (calendar / combo). New seats must have cupo and `offers_trial`.
- Replace or add seats: new rows `booked` with new `scheduled_on`; old absent rows stay for history.
- Money:
  - New trial total vs already captured trial fee.
  - Higher → guest pay for the **difference** only (snapshot `kind: "trial_fee_delta"`).
  - Lower → refund the difference (Flow/MP refund API when the original payment was that gateway). Transfer / refund failure → inbox flag “devolver diferencia” for the admin; do not block the new booking.
  - Free → confirm mail only.
- Same `registrations.id`. Still shows as clase de prueba.

### Convert page `/{locale}/unirse/[trial_convert_token]`

Guest, 3-month expiry. Unknown / expired → dedicated expired page (no ficha leak). Admin can mint a new token from the inbox (new 3-month window).

On each render and before start-pay:

- List seats that belong to the lead (the original trial sections). Family **checks which to join**.
- Drop any checked section that has no cupo (their own `attended` hold still counts as their seat). Unchecked `attended` holds are released when they **successfully pay** the ones they kept (so a leftover seat does not stay held after they join elsewhere). If they abandon the page, leftover `attended` holds stay until expiry, then a cron releases them and the convert token dies.
- Quote:
  - If any selected section has effective matrícula `> 0` (existing cohort mode + inherit rules): snapshot `kind: "enrollment"` — same helper as reserve.
  - Else: snapshot `kind: "first_month"` — sum of **current calendar month** amounts from the same monthly resolver used by billing (`resolveSectionPlanMonthlyAmount` / section fee plans + cohort default). No proration.
- Existing student: charge only unpaid matrícula lines / months they do not already have, same spirit as the enrolment-fee spec.
- No cupo → that section is not payable. Others still are.
- Capture (Flow / MP / approved transfer) runs `acceptRegistrationLead` for **selected** sections only. One student, one tutor if minor. `status = enrolled`.
- Family: `registration.welcome` for a **new** person (login + change password; never a raw password). `registration.trial_added` for an **existing** student (“te sumamos a…”).
- Admin: `registration.admin_trial_enrolled` (ficha + “vino de clase de prueba”).

Extend `payment_flow_checkout_refs` target family so a convert charge can point at `registration_id` with a purpose (`enrollment` vs `first_month` vs `trial_fee`). Do not break `MAT-` reserve refs. Use distinct commerce-ref prefixes: `TRIAL-`, `JOIN-`.

### Email registry (new keys)

All go through `sendBrandedEmail` and the existing send-gate toggles.

| Key | When |
|-----|------|
| `registration.trial_received` | Trial submit (pay block if `total > 0`) |
| `registration.admin_trial_received` | Same, to admins |
| `registration.admin_trial_attendance_due` | 1 h before class |
| `registration.trial_missed` | No-show / unmarked next day — reschedule CTA |
| `registration.trial_rescheduled` | New seat confirmed |
| `registration.trial_invite` | Seat became `attended` (including late present) — 3-month join CTA |
| `registration.trial_added` | Existing student converted |
| `registration.admin_trial_enrolled` | Admin notice after trial convert pay or admin accept of a trial lead |

Reserve templates stay as they are. Failed family mail never fails the write.

## Error handling

- Invalid `intent` or CTA mode mismatch → redirect to the allowed register URL.
- Full seat on submit or start-pay → `{ ok: false }`, no charge, no orphan seat.
- Double cron / double click on present → no second convert token; mail send is idempotent per transition.
- Expired convert token → no charge; admin can reissue.
- Gateway amount must match the frozen snapshot for that purpose. Mismatch → log, do not enrol / do not mark trial paid.
- Refund failure → book the cheaper seat anyway; admin inbox flag.

## Testing

- `resolveSectionTrialOffer`: inherit, section override, `offers=false` ignores amount, `0` is free.
- Occupied count includes `booked` + `attended` only.
- Next `scheduled_on` in institute TZ (before/after today’s slot).
- CTA mode: missing key = reserve; landing button count; `intent=trial` rejected when mode is reserve.
- DNI matrix: same section enrolled, other section, open trial, pending reserve.
- `markTrialSeatAttendance`: present mints token once; late present after auto-absent still invites; absent releases cupo.
- Cron: reminder window; next-day auto-absent; already marked seats skipped.
- Convert quote: matrícula vs first-month; skip full sections; existing student no second profile.
- Calendar: full cell disabled; combo omits full; trial hides `offers_trial=false`.
- RegisterForm not forked per tenant (one form, `intent` prop).

## Rollout

1. Additive migrations + helpers + cupo RPCs.
2. Settings + cohort/section admin fields.
3. Picker (calendar/combo) on register for both intents.
4. Trial submit + trial-fee page + inbox badge.
5. Teacher visitors + shared mark function + cron + mails.
6. Reschedule + convert page + first-month checkout.
7. Seed `public_cta_mode = both` on Mozarthitos, Espacio Zenit, Liora.

## Out of this spec’s first plan if it must split

Do **not** split CTA + picker from the lead model (the landing would lie). Acceptable split: ship book + inbox + attendance + no-show **before** convert/first-month checkout, with admin accept as the only convert path in that slice. Only do that if the implementation plan would otherwise exceed a single reviewable PR series. The product default is the full loop above.
