# Registration enrollment-fee checkout (pre-inscription → pay → enroll)

**Date:** 2026-08-28
**Status:** Approved (brainstorm)
**Kind:** Design spec. One implementation plan under `docs/superpowers/plans/`.

**Related:**

- [`2026-08-24-registration-existing-student-and-multi-section-design.md`](2026-08-24-registration-existing-student-and-multi-section-design.md) — public form still creates a **lead**. Accept already enrols requested sections without capacity override. This spec adds pay-before-enrol and a shared accept core the gateway can call.
- [`2026-08-28-cohort-default-fees-design.md`](2026-08-28-cohort-default-fees-design.md) — effective matrícula = section amount, else cohort default, else `0`. Snapshot and the “once vs accumulate” check use **effective** amounts.
- [`2026-08-24-admin-email-send-toggles-design.md`](2026-08-24-admin-email-send-toggles-design.md) — new registry keys appear in Settings automatically.
- [`docs/adr/2026-04-communications-email-templates.md`](../../adr/2026-04-communications-email-templates.md) — `sendBrandedEmail` + tenant wrapper.
- [`docs/adr/2026-04-section-enrollment-fee.md`](../../adr/2026-04-section-enrollment-fee.md) — amount still lives on the section (plus cohort fallback). This spec adds a **cohort mode**, not a second price list.
- Event public pay (`pending_payment` → Flow / MP / transfer) — same guest-checkout idea; do not share event tables.

**Governing rules:** `28-tenant-register-surface.mdc` (do not fork `RegisterForm`), `03-architecture.mdc` (250-line ceiling), `04-security.mdc`, `09-i18n-copy.mdc` (en + es; keep `pt.json` in the same shape), `12-supabase-app-boundaries.mdc`, `21-migrations-production-no-data-destruction.mdc`, `08-analytics-observability.mdc`.

No ADR: checkout refs already map one `commerce_ref` to a target. This adds `registration_id` as another target, same as `bundle_id`.

## Intent

Every public form submit (`/register` and `/i/[token]`) emails the family a close, branded “we received your pre-inscription” note. If the chosen sections charge matrícula, the mail has a button to a **public token page** where they pay (Flow / Mercado Pago if configured, otherwise bank transfer + receipt). A confirmed online payment, or an admin-approved transfer, **creates the student (and tutor-as-parent when minor) and enrols the sections**. Transfer waiting for review, or no payment yet, stays a lead so the admin can still enrol and **waive** the fee. Successful enrolments leave the pre-inscription inbox and do not increment the home “needs action” number.

## Context

Today:

- Submit inserts `registrations` with `status = new`. **No email.**
- The public picker already hides full sections (`list_registration_section_options`). Submit does not re-check cupo; a race can create a lead for a full section.
- Admin accept (`acceptRegistration`) creates the student + tutor, enrols requested sections, sets `status = enrolled`.
- Matrícula is charged **after** enrol, from the logged-in portal (receipt / manual paid). Flow / MP exist for monthly tuition and for events, not for a lead.
- Home card counts `status = new`. The registrations list excludes `enrolled` but still shows every other lead.
- Email registry has no registration keys. `sendBrandedEmail` wraps copy in tenant chrome.
- `registration_status` enum is `new | contacted | enrolled`. Follow-up is `contacted_at` plus optional `status = contacted`.

## Decisions

| Topic | Choice |
|-------|--------|
| Architecture | Lead + public `/matricula/[token]` page. Form never writes `section_enrollments` |
| Last seat | No hold. Re-check cupo on submit, on every public-page render, and immediately before Flow/MP start or receipt accept. If full: same page, pick another open section or WhatsApp the institute |
| Pay without account | Opaque `pay_token` on the lead. No login |
| Transfer | Same public page: `site_settings.bank_transfer_instructions` + upload, bound to the lead |
| No gateway | Hide broken buttons. Still show transfer (or contact + WhatsApp if instructions are empty) |
| Cohort mode | `once_for_all` or `per_section`. `once_for_all` is invalid when effective section amounts in that cohort differ |
| Amount source | Effective matrícula (section → cohort default → `0`). Snapshot frozen on submit and when the family changes section because the first one filled |
| Existing student | No new profile / tutor. Charge only unpaid lines; enrol those sections |
| Adult | Family emails and pay CTA go to the student, never a tutor |
| “No estoy seguro” | Still allowed. Can pay matrícula with no section when mode is `once_for_all`. Admin gets a dedicated mail and must assign a section |
| Auto-enrol | Shared accept core: admin waive / approve, Flow webhook, MP webhook |
| Access | New accounts get a set-password invite in the welcome mail. Never send a raw password |
| Idempotency | One successful matrícula charge per lead. Repeat webhook / double click is a no-op |
| Inbox / home | Default list + home **urgent** number = staff actions only. **Waiting payment** is a separate number on the same card. `enrolled` is gone from both |
| Admin mail on every lead | Yes, with a full ficha (not a one-liner) |
| Failed family mail | Lead still inserts. Do not fail the form because Resend failed |

## Goals

1. Family always gets a branded received mail after a successful submit.
2. Only sections with an open seat can be requested; a mid-submit fill is rejected (no orphan lead).
3. When matrícula is due, they can pay as guests; online pay or approved transfer enrols them.
4. Admin can waive, approve/reject a receipt, or assign a section when they paid without one.
5. Home and the default inbox only show work the admin must do, plus a separate waiting-payment count.

## Non-goals

- Seat hold / expiry of the token.
- Formal waitlist.
- Teacher notification or “what to bring / first class” mail.
- Paying matrícula from the logged-in parent/student strip (that path stays for already-enrolled students).
- Changing monthly tuition checkout.
- Password in plaintext in any email.

## Architecture

### Cohort mode

Additive column on `academic_cohorts`:

```
enrollment_fee_mode TEXT NOT NULL DEFAULT 'per_section'
  CHECK (enrollment_fee_mode IN ('once_for_all', 'per_section'))
```

Existing cohorts start as `per_section` (today each section enrolment has its own fee). Admin can switch on the cohort overview, next to the default-fee block from the sibling spec.

**Consistency (pure helper):** collect effective matrícula of every non-archived section in the cohort. If any two amounts differ, `once_for_all` cannot be saved. UI error: amounts are inconsistent; equalize section/default fees or keep “one per section”.

Effective amount uses `resolveCohortFeeDefaults` (or the same rules if that helper is not merged yet): section stored value if not `NULL`, else cohort `default_enrollment_fee_amount`, else `0`.

### Snapshot

Pure helper `buildRegistrationFeeSnapshot`:

Input: requested section ids (may be empty), cohort mode, effective amounts + currencies.

Output (stored on the lead as `fee_snapshot` JSONB):

```
{
  mode: "once_for_all" | "per_section",
  currency: "CLP" | "USD" | …,
  total: number,
  lines: [{ sectionId, sectionName, amount }],
  capturedAt: iso
}
```

Rules:

- Currency = currency of the first line with `amount > 0`, else `USD` (same fallback as cohort defaults).
- `once_for_all`: `total` = that shared effective amount once (even if they picked two sections). `lines` still list the sections (amounts shown as the shared fee on the first charged line, `0` on the rest) so the admin sees what they asked for.
- `per_section`: `total` = sum of effective amounts of requested sections.
- Empty section list + `once_for_all`: `total` = the shared cohort effective amount (any section, they are equal). `lines` = `[]`.
- Empty section list + `per_section`: `total` = `0`. Public page does not start a charge; it asks them to pick a section with cupo or WhatsApp. Admin mail still goes out (`needs_section` only after a later pay, not on submit).
- Existing student who already has an approved or exempt matrícula on **any** active enrolment in that cohort, and mode is `once_for_all`: `total` = `0` (already covered).
- Existing student + `per_section`: omit lines for sections they already have an approved/exempt enrolment fee on.

`total === 0` ⇒ no pay button, `intake_state = none`, admin accepts as today.

### Lead columns (additive)

| Column | Type | Meaning |
|--------|------|---------|
| `pay_token` | `TEXT UNIQUE NOT NULL` | Unguessable token (32-byte hex). Generated on insert |
| `intake_state` | `TEXT NOT NULL DEFAULT 'none'` | `none` \| `awaiting_fee` \| `receipt_pending` \| `needs_section` \| `section_full` |
| `fee_snapshot` | `JSONB NOT NULL DEFAULT '{}'` | Frozen quote |
| `fee_captured` | `BOOLEAN NOT NULL DEFAULT false` | True after a successful Flow/MP capture (even if enrol failed because the section filled) |
| `enrollment_fee_receipt_path` | `TEXT NULL` | Public-page transfer upload |
| `accepted_student_id` | `UUID NULL` REFERENCES `profiles(id)` | Set when the accept core creates or reuses the student, even if `needs_section` |

CHECK on `intake_state`. No change to `registration_status` enum. `status` stays `new` / `contacted` / `enrolled`. `contacted` / `contacted_at` remain the “I already talked to them” stamp and do not clear `intake_state`.

Anon insert already allowed on `registrations`. New columns are writable on insert for `pay_token`, `intake_state`, `fee_snapshot` only if the submit **server action** sets them (the action uses the user-scoped client today). Generate token and snapshot **in the action**, not from the browser. Do not accept a client-supplied token or snapshot.

Public pay page does **not** `SELECT` the row as anon. A `SECURITY DEFINER` RPC `registration_public_pay_context(p_token text)` returns the safe projection (names, section labels, schedule, snapshot, intake_state, transfer instructions flag). Revoke from `PUBLIC`; grant `anon` + `authenticated`.

### Submit

Shared by `submitPublicRegistration` and `submitSectionLinkRegistration`:

1. Existing validation (inscriptions enabled, schema, extras pack).
2. For every requested section: `registration_public_section_label` **and** an open-seat check (same rule as `list_registration_section_options`: `max_students IS NULL` or active enrolments `< max`). If any requested section is full or no longer public → `{ ok: false }` with the existing invalid-section copy (or a dedicated “that schedule filled up” string). **No insert.**
3. Build snapshot. Insert lead with `pay_token`, snapshot, `fee_captured = false`, `intake_state = total > 0 ? awaiting_fee : none`.
4. Send `registration.received` to the family contact (tutor if minor, student if adult or existing student). Send `registration.admin_received` to every `profiles.role = admin` (same list pattern as site-contact). Mail failure is logged, not returned to the family.

### Public page `/{locale}/matricula/[token]`

Tenant-branded, no auth. Invalid / unknown token → not-found page (no ficha leak).

**On every RSC render** and again inside start-pay / upload actions:

- If `status = enrolled`: “you are already in” + schedule. No pay UI.
- If `fee_captured` and `intake_state = section_full`: no second charge. Show the filled-section block; picking an open section runs the accept core.
- If any **requested** section is full and not yet captured: do not show pay. Show the filled-section block. Persist `intake_state = section_full` if it was `awaiting_fee`.
- If `intake_state = needs_section` (paid or waived, no section): “we have your matrícula; the institute will assign a schedule.” No second charge.
- If snapshot `total === 0` and there is no section (`per_section` + “no estoy seguro”): no charge UI. Ask them to pick an open section (rebuilds snapshot) or WhatsApp. Stay `none` until they pick and `total > 0`.
- Else show the pay block.

**Pay block**

1. Close copy: we received {student} for {section} ({schedule}). We will try to keep that schedule; seats can run out before payment.
2. Snapshot total + currency (never the live tariff).
3. Flow and/or Mercado Pago buttons only when that provider is actually configured for the tenant.
4. Transfer instructions from `bank_transfer_instructions` + file upload (image/PDF, same size/type limits as event receipts). Upload uses the service-role client into the existing payment-receipts bucket at `registration-enrollment/{registrationId}/{filename}`. Upload sets `receipt_pending`, stores the path, emails family (`billing.receipt_submitted_pending`) and admin (`registration.admin_receipt_pending`).
5. If no gateway and no instructions: contact copy + WhatsApp button when `social.whatsapp` is set; otherwise `brand.contactEmail` only.

**Filled-section block (same URL)**

- Error: that schedule is full.
- List other **open-seat** sections in the same cohort (current, not archived). Choosing one is a **server action keyed by `pay_token`** (not a client write). It updates `preferred_section_id` / `additional_section_ids`, rebuilds the snapshot (live effective fees, new `capturedAt`), and then: if `fee_captured`, run the accept core; else set `intake_state = awaiting_fee` if `total > 0` else `none` and re-render the pay block. Reject the action if `status = enrolled`.
- If no open alternative: contact the admin + WhatsApp. Lead stays `section_full`.

Start Flow/MP: re-check cupo and `intake_state`; compare charge to **snapshot.total**; persist a checkout ref; redirect. If the seat vanished between render and click, return the filled-section view (no redirect).

### Gateway

Extend `payment_flow_checkout_refs` with nullable `registration_id` REFERENCES `registrations(id) ON DELETE CASCADE`. Target CHECK becomes: `payment_id` OR complete monthly slot OR `bundle_id` OR `registration_id` (exactly one family, same style as the bundle migration).

- Flow commerce ref prefix: `MAT-` + year + serial (new reserve RPC, service_role only).
- Mercado Pago `external_reference`: `enrollment:<registrationUuid>`. Extend the existing reference parser; do not break `tuition:` / `tuition-bundle:`.

Finalize (Flow confirm + MP confirm):

1. Load lead by registration id. If `enrolled` or `accepted_student_id` already set with `needs_section` after a prior success → no-op success.
2. Gateway amount must match `fee_snapshot.total` (existing currency helper). Mismatch → log, do not enrol.
3. Re-check cupo for requested sections. If full → do **not** enrol; do **not** invent a refund in-product; set `section_full`, email `registration.section_full`, leave finance reconciliation to the institute (out of scope to auto-refund). The family uses the same token page to pick another section and pay again only if the first charge was not captured; if it **was** captured, the page says “we received the payment; pick another schedule or WhatsApp” and admin sees `section_full` **plus** a paid snapshot (intake stays `section_full`; `accepted_student_id` is still null until they pick and the admin or a second finalize enrols).  
   **Captured + full (explicit):** mark a boolean `fee_captured` on the lead (`BOOLEAN NOT NULL DEFAULT false`). Set true on successful gateway finalize even if enrol fails. Public page then skips a second charge; choosing a new section with cupo runs the accept core immediately (no new payment).
4. On success: accept core, `fee_captured = true`, admin `registration.admin_enrolled` or `registration.admin_needs_section`, family `registration.welcome`.

### Accept core

Extract today’s `acceptRegistration` body into `acceptRegistrationLead` (name indicative) callable from:

- Admin accept (no fee / still `none`)
- Admin waive (`awaiting_fee` / `receipt_pending`)
- Admin approve receipt
- Admin assign section (`needs_section` / `section_full` after capture)
- Gateway finalize

Behaviour:

| Situation | Student | Tutor | Sections | Lead after |
|-----------|---------|-------|----------|------------|
| New minor | Create | Ensure parent by tutor DNI, link with form `tutor_relationship` | Requested, no capacity override | `enrolled` if ≥1 section committed; else `needs_section` |
| New adult | Create | None | Same | Same |
| Existing student | Reuse | Do not recreate | Only requested / assigned | `enrolled` if committed |
| Paid, no section | Create/reuse | As above | None | `status` stays `new`, `intake_state = needs_section`, `accepted_student_id` set |
| Waive | Same as accept | Same | Same | Enrol + mark those `section_enrollments` `enrollment_fee_exempt` with the admin reason |
| Approve receipt / gateway | Same | Same | Same | Mark enrolment fee approved / `last_enrollment_paid_at` so billing does not charge again |

If a requested section fails cupo or overlap, it stays pending (today’s `pendingSectionIds`). The lead is `enrolled` only when **every** requested section committed **or** the family had no section (`needs_section`). If they requested sections and **none** committed, do not set `enrolled`; set `section_full` (or keep `needs_section` if the failure was overlap, not cupo — overlap: leave `none` and return the existing accept error to the admin; gateway path emails `section_full` only for cupo).

Invite: after creating a **new** auth user, send a recovery/invite link (existing dashboard invite machinery). Welcome mail includes that URL. Existing students: welcome says use the access they already have.

Admin accept of `awaiting_fee` without waive is **not** offered as the primary action (that would skip payment silently). Primary is waive. Existing “Aceptar” stays only for `intake_state = none`.

### Admin inbox and home

**Home card** (`loadAdminHubSummary`):

- Urgent number: count of leads with `status != enrolled` AND `intake_state IN ('none', 'receipt_pending', 'needs_section', 'section_full')`. Readers treat a corrupt row (`none` + snapshot total `> 0`) as `awaiting_fee` so it does not vanish. Legacy rows with empty snapshot count as `none`. Do **not** use `status = new` alone.
- Separate line: count `intake_state = awaiting_fee` AND `status != enrolled`.
- Remove the “total including enrolled” figure from the urgent card.

**Registrations page** default filter = the urgent set. Chips: Acciones · Esperando pago · Comprobante · Falta sección · Sección llena · Contactados (stamp). `enrolled` is not a default row.

Row legend + actions:

| `intake_state` | Legend | Actions |
|----------------|--------|---------|
| `none` | — | Accept (today) |
| `awaiting_fee` | Pending matrícula {amount} | **Waive and enrol** (short reason required) |
| `receipt_pending` | Receipt in review | View receipt · Approve · Reject (visible note → `registration.receipt_rejected`, back to `awaiting_fee`) |
| `needs_section` | Paid — assign schedule | Section picker (open seats only) → enrol + welcome with schedule |
| `section_full` | Schedule full | Same picker, or WhatsApp the tutor |

Waive / approve / assign all call the accept core. If cupo is gone at confirm, show the error and the picker; do not enrol.

KPIs on the page: acciones · esperando pago · contactados · enrolled (historical count, not the list).

Audit: `registration_fee_waived`, `registration_receipt_approved`, `registration_receipt_rejected`, `registration_section_assigned`, plus existing accept audit.

### Email catalog

New `sendBrandedEmail` keys (locale defaults in the registry; admin-editable):

| Key | To | When |
|-----|----|------|
| `registration.received` | Family | Submit ok. CTA to `/matricula/{token}` only if `total > 0` |
| `registration.admin_received` | Each admin | Same moment. Full ficha |
| `registration.admin_receipt_pending` | Each admin | Transfer uploaded |
| `registration.admin_enrolled` | Each admin | Accept core enrolled ≥1 section |
| `registration.admin_needs_section` | Each admin | Paid or waived with no section |
| `registration.welcome` | Family | After the accept core. If a section committed: schedule + portal/invite. If `needs_section` only: “recibimos la matrícula; te asignamos horario”. When the admin later assigns a section, send this key **again** with the real schedule |
| `registration.receipt_rejected` | Family | Admin rejected receipt |
| `registration.section_full` | Family | Cupo gone at pay / finalize |

Reuse `billing.receipt_submitted_pending` for the family after upload (period label = “Matrícula”, amount from snapshot).

**Family received (default es tone):** “Hola {greetingName}, recibimos la preinscripción de **{studentName}** para **{sectionName}** ({scheduleLabel}). Vamos a intentar dejarlo en ese horario, pero los cupos se pueden acabar.” Button “Pagar matrícula” when due. Undecided: “Todavía no hay horario; podés pagar la matrícula y te asignamos sección.” No fee: “El instituto te va a confirmar el lugar.”

**Admin mails** always include: student name + DNI + birth date; tutor name + DNI + email + phone + relationship when present; requested sections + schedule; snapshot total + currency + mode; source (`/register` vs section-link id); existing-student yes/no; deep link to `/[locale]/dashboard/admin/registrations` (query `?id=` the lead). Subjects: “Nueva preinscripción”, “Comprobante por revisar”, “Nuevo alumno en {section}”, “Pagó matrícula — falta horario”.

Recipient resolution: `resolveRegistrationContact` (already used for WhatsApp digits) — tutor email if minor, else student email. Never the synthetic minor mailbox. Skip send when there is no real email (log). Admins: `profiles.role = admin`, exclude the public site-contact sender profile.

Mail off in Settings: skip silently (`{ ok: true, skipped: true }`).

### i18n

New dictionary keys under `register.enrollmentPay` (public page) and `admin.registrations.intake` (inbox legends, filters, waive/reject). Email **body** lives in the registry, not in `es.json`. Both `en` and `es`; keep `pt.json` keys in the same shape.

## Error handling

| Case | Behaviour |
|------|-----------|
| Section full on submit | No insert; form error |
| Section full on public render | Filled-section block; no charge |
| Section full after captured pay | `fee_captured`, `section_full`, no second charge; pick another section then accept core |
| Unknown token | Not found |
| Snapshot vs gateway mismatch | No enrol; log |
| Duplicate finalize | No-op |
| Resend failure | Log; user-facing submit still ok |
| Waive without reason | Action error; no write |
| `once_for_all` + mixed effective fees | Cohort save rejected |
| Gateway not configured | Buttons omitted |
| WhatsApp property empty | Omit WA button; show contact email if present |
| Existing student document occupied by non-student | Today’s `documentInUse` |

## Testing

Self-contained unit/component tests (no live Resend / Flow / MP):

1. Snapshot: once vs per_section; undecided; existing student already covered; inherited cohort default.
2. Cohort mode save: mixed effective amounts reject `once_for_all`; equal amounts allow it.
3. Submit: full section → no insert; open section → token + `awaiting_fee` or `none`.
4. Public context RPC shape / token miss → not found.
5. Accept core: new minor creates parent link; existing student does not; `needs_section` when no section; second call is no-op; waive sets exempt.
6. Finalize helper: amount match enrols; mismatch does not; `fee_captured` + full skips second charge.
7. Hub counts: enrolled ignored; `awaiting_fee` is the separate number; urgent includes receipt / needs_section / section_full / none.
8. Email registry: new keys listed; received template includes `payUrl` placeholder.
9. Public page: full section hides pay and lists alternatives; enrolled token shows already-in.

Migration test: new columns + CHECK + unique token; checkout-ref target CHECK includes `registration_id`; no DROP of existing columns.

Existing accept / register / monthly Flow tests stay green.

## Out of scope

- Automatic gateway refunds.
- Token TTL / cron to expire unpaid leads.
- Seat reservation (`pending_payment` occupying a cupo).
- Formal waitlist.
- Teacher mail, first-class kit mail.
- Logged-in portal matrícula checkout for these leads.
- Changing monthly bundle checkout.
- Applying cohort mode retroactively to already-enrolled students’ billing rows.

## Done when

1. Submit on `/register` and `/i/[token]` sends branded received mail (and admin ficha mail). Matrícula CTA present iff snapshot total > 0.
2. Full section on submit does not create a lead. Public pay page re-checks cupo and offers another open section or WhatsApp.
3. Flow/MP (when configured) or approved transfer enrols student + tutor and decrements cupo; welcome mail has schedule; admin gets “nuevo alumno en {sección}”.
4. Transfer upload leaves the lead in `receipt_pending`; reject returns them to pay; waive enrols with exemption.
5. Undecided + `once_for_all` pay creates the accounts and parks the lead in `needs_section` with a dedicated admin mail.
6. Home urgent number and the default inbox ignore `enrolled` and treat waiting payment as a separate count.
7. Tests above pass. No hardcoded user-facing copy.
)
