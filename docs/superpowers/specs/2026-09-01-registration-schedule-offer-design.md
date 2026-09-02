# Registration schedule offer (full section → propose → family confirms)

**Date:** 2026-09-01  
**Status:** Approved (brainstorm)  
**Kind:** Design spec. One implementation plan under `docs/superpowers/plans/`.

**Related:**

- [`2026-08-31-registration-join-package-design.md`](2026-08-31-registration-join-package-design.md) — after the family accepts or picks another schedule, rebuild the join package and charge (or enrol if already captured).
- [`2026-08-28-registration-enrollment-fee-checkout-design.md`](2026-08-28-registration-enrollment-fee-checkout-design.md) — `/matricula/[token]`, `intake_state`, `registration_public_pay_context`. This spec **adds** `offer_pending` and `proposed_section_id`. It does **not** replace admin **Assign**.
- [`2026-08-28-trial-class-and-dual-cta-design.md`](2026-08-28-trial-class-and-dual-cta-design.md) — trial convert is out of scope.

**Governing rules:** `03-architecture.mdc` (250-line ceiling), `04-security.mdc`, `09-i18n-copy.mdc` (en + es; keep `pt.json` in the same shape), `12-supabase-app-boundaries.mdc`, `21-migrations-production-no-data-destruction.mdc`, `28-tenant-register-surface.mdc`.

No ADR: additive column + one new `intake_state` value. Same `registrations` row. No new table.

## Intent

When a reserve lead asked for a schedule that is now full, the admin can **propose a specific open schedule**. The family gets a mail and the same `/matricula` page: accept that offer, or pick any other open schedule. Confirming a schedule starts the join-package checkout (or enrols if they already paid). **Assign** stays for when staff already agreed offline.

## Context (today)

- Inbox **Sección llena** + admin **Asignar sección** writes `preferred_section_id` immediately (no family yes).
- `/matricula` already lists other open sections when full (`switchRegistrationPaySectionCore`).
- Mail `registration.section_full` is generic (“pick another”), not “we offer *this* one”.
- `intake_state` CHECK: `none | awaiting_fee | receipt_pending | needs_section | section_full`.
- Original request lives in `preferred_section_id` / `additional_section_ids`.

## Decisions

| Topic | Choice |
|-------|--------|
| Surfaces | Propose + Assign **both** on the expanded lead. Propose only when the requested schedule is full. |
| Family page | Same `/matricula/[token]`. Offer block on top; other open sections below. No pay UI until they accept or pick. |
| After confirm | Rebuild join package. `total > 0` and not captured → `awaiting_fee` + pay. `$0` → `none`. `fee_captured` → accept as `current` (no second charge). |
| Inbox after propose | New state **`offer_pending`**. Filter **Esperando respuesta**. Not staff-urgent. |
| Storage | `proposed_section_id` + `intake_state = offer_pending`. Do **not** overwrite `preferred_section_id` until the family confirms or admin assigns. |
| Re-propose | Allowed. Overwrites `proposed_section_id`, resends mail. |
| Proposed also full | Cannot accept. Page says pick another. Persist `section_full`, clear `proposed_section_id`. |
| Trial | Out of scope. |
| Assign | Unchanged: no offer mail; may still require join disposition when it enrols. |

## Data

Additive migration (next number after current `20x_`):

```
ALTER TABLE registrations
  ADD COLUMN proposed_section_id UUID
    REFERENCES academic_sections(id) ON DELETE SET NULL;

-- Drop + recreate CHECK to include 'offer_pending'
```

`CREATE OR REPLACE` `registration_public_pay_context` to also return `proposed_section_id`. Still no DNI, email, or tutor identity.

Index not required (inbox filters `intake_state`). No backfill. Old leads stay `section_full` with null proposal.

App types: add `offer_pending` to `RegistrationIntakeState`. Unknown values still parse as `none`.

## Admin

**Proponer nuevo horario** is enabled when:

- lead is actionable (`new` / `contacted`, not `enrolled`);
- `intake_state` is `section_full` **or** `requestedSectionFull`;
- there is at least one **other** current-cohort section with an open seat.

UI (expanded row / intake panel): select of open sections (exclude the full requested id) + **Proponer**. Does **not** ask for join disposition.

On success:

1. `proposed_section_id = chosen` (must have cupo at commit; reject if it is the full requested id or has no seat).
2. `intake_state = offer_pending`.
3. Family mail `registration.schedule_offer`.
4. Inbox label: **Esperando respuesta — propusimos {section}**.

**Asignar** remains. It confirms without a family yes (existing action). Clears `proposed_section_id`.

Re-propose from `offer_pending` is allowed (same control). Assign from `offer_pending` is allowed.

## Family `/matricula`

If `intake_state === offer_pending` and `proposed_section_id` is set and status ≠ enrolled:

- **Offer block:** “El horario de {original} se llenó. Te proponemos **{proposed}** ({schedule}). ¿Lo tomás?” + **Aceptar este horario**.
- **Other open sections** below (omit original-if-still-full and omit the proposed row). Same switch action as today.
- Hide Flow / MP / transfer until a schedule is confirmed in this step.

**Accept this** = switch to `proposed_section_id` (same core as picking another id).

After a successful switch:

- `preferred_section_id` = chosen; `proposed_section_id` = null.
- Rebuild join-package snapshot (live remaining-classes rule).
- `intake_state` = `awaiting_fee` if `total > 0` else `none` (unless `fee_captured` → accept core, `enrolled`).
- Re-render: pay block if due; already-in if enrolled.

If the proposed section has no seat on render or accept: do not charge; show “esa propuesta también se llenó, elegí otro”; set `section_full`, `proposed_section_id = null`.

Invalid token: not-found. Already enrolled: existing already-in, no offer UI.

## Mail

New registry key `registration.schedule_offer` (appears in Settings via existing registry scan).

Placeholders: greeting, student, original section, proposed section + schedule, `payBlock` (same token URL, CTA “Ver la propuesta”).

Re-propose sends the same key with the new names.

Do not send a dedicated admin mail on propose. `registration.section_full` stays for the automatic “seat vanished at pay time” path.

## Inbox

Add filter `offer_pending` → `intake_state.eq.offer_pending`.

| State | Filter | Staff urgent |
|-------|--------|----------------|
| Full, no offer | Sección llena | Yes |
| Offer sent | Esperando respuesta | **No** |
| Confirmed, unpaid package | Esperando pago | No |
| Offer also full | Sección llena | Yes |

Home card: optional count for “waiting for response” next to waiting-payment (same card, not the urgent number). If the card is already crowded, the registrations toolbar filter is enough for v1 — **toolbar filter is required; home count is optional and may ship in the same PR if the existing waiting-payment slot is cheap to clone**.

Copy en + es; `pt.json` same keys (`filterOfferPending`, `offerPending`, `proposeSchedule`, offer block strings).

`registrationInboxPrimaryKind`: `offer_pending` → same panel as assign (`assign`) so Propose + Assign stay visible. Or a dedicated `propose` kind that still renders both buttons. Do not hide Assign.

## Architecture (units)

| Unit | Responsibility |
|------|----------------|
| Migration | Column + CHECK + RPC replace. |
| Intake parse / inbox filter | `offer_pending` in unions, counts, toolbar. |
| `proposeRegistrationScheduleAction` | Admin-only. Cupo check. Write + mail. |
| Offer mail helper | `registration.schedule_offer` + pay block. |
| Pay context + page | Expose proposed id; render offer block; hide pay until confirmed. |
| `switchRegistrationPaySectionCore` | Clear `proposed_section_id`; rebuild join package; leave `offer_pending`. |
| Intake labels | “Propusimos {name}”. |

Do not grow `AdminRegistrationIntakeActions` past the 250-line ceiling — extract the propose select if needed.

## Error handling

- Propose without an open alternative / proposing the full section: `section_full` / validation; no write.
- Mail fail: lead still `offer_pending` (same as received-mail today).
- Switch to a section that filled mid-click: `section_full`; if it was the proposal, clear it and persist `section_full`.
- Assign / accept by hand during `offer_pending`: existing paths; clear `proposed_section_id`.
- Token unknown: not-found.

## Testing

Isolated unit tests **and** Playwright on the isolated stack (same gate as `test:e2e:precommit`). Related money journeys that are **not** this feature (join-package `/matricula` from a live section, trial `/unirse`, assign-without-offer) live in [`2026-09-01-registration-intake-e2e-design.md`](2026-09-01-registration-intake-e2e-design.md). Live MP/Flow stays Phase 7 nightly.

### Unit

- Propose: writes `proposed_section_id` + `offer_pending`; rejects full/same section; re-propose overwrites.
- Inbox: `offer_pending` counted and filtered; not in urgent.
- Pay page kind: `offer_pending` → offer UI, not pay; after switch → pay or enrolled.
- Switch from offer: clears proposal, rebuilds package total.
- Proposed gone: `section_full` + null proposal.
- i18n: new keys in en, es, pt shape.
- Migration test: CHECK includes `offer_pending`; RPC selects `proposed_section_id`.

### Playwright (required)

File: `e2e/critical-registration-schedule-offer.spec.ts` (picked up by existing project `chromium-critical-registration` via `critical-registration.*`).

Seed **must not** change `E2E Section A` fees or cupo (existing register→accept stays `$0` / unlimited). Add a dedicated `E2E Section Tiny` (`max_students = 1`, non-zero `enrollment_fee_amount`) and keep `E2E Section B` as the open alternative (give B a non-zero enrollment fee so confirm shows pay).

Journeys:

1. **Propose → mail → accept.** Register for Tiny while it has a seat → admin fills Tiny (enroll `e2e-student-b`) → inbox Sección llena → Proponer B → recorded mail `registration.schedule_offer` with `/matricula/{token}` → family sees offer + no Flow/MP/transfer → Aceptar este horario → pay / join-package amount (or enrolled if `$0`).
2. **Pick another.** Same setup through propose → family picks a third open row (or B via the list, not the accept button) → proposal cleared, package rebuilt.
3. **Assign still works.** From `offer_pending`, admin Asignar B (join disposition) without a family click → proposal cleared; no offer UI on the token.
4. **Dead offer.** After propose, fill B as well → family cannot accept; page says pick another / offer gone; inbox back to Sección llena.

Do **not** add a new Playwright project unless the regex stops matching. Reuse `gotoIsolated`, `registerForm` helpers, `chooseJoinBillingCurrent`, `clearRecordedEmails` / `fetchRecordedEmails`.

## Done when

1. Full-section lead: admin can propose an open schedule; family mail + `/matricula` show that offer and other open rows.
2. Accept or pick another → join package checkout (or enrol if already captured).
3. Inbox has **Esperando respuesta**; re-propose and assign still work.
4. If the offer fills, lead returns to **Sección llena** and the family cannot accept the dead offer.
5. Assign without a family yes still exists.
6. Isolated tests cover propose, switch-from-offer, inbox filter, and the full-offer edge.
7. Playwright journeys 1–4 above are green on `npm run test:e2e:precommit -- --project=setup --project=chromium-critical-registration`.

## Out of scope

- Trial `/unirse` offers.
- Seat hold / expiry on the proposal.
- WhatsApp / SMS.
- Auto-picking a schedule without admin.
- Replacing Assign.
- Backfilling old `section_full` rows.
- Home-card count (optional, not required for done).
