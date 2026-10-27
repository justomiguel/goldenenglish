# Event Dual Bank Transfer Sources Design

**Date:** 2026-10-26  
**Sub-project:** 1 of 2 (Sub-project 2: Interactive Venue Seat Map & Reservations follows next)

## Intent

Allow an event to offer up to three transfer accounts. Account 1 and account 2 are text on the event. The third account is the Finance transfer text (`global`). Staff see that text in the event form. They choose which accounts the buyer can see: account 1, account 2, the global account, or any combination.

When two or more accounts are included, staff choose the assignment:

1. The buyer picks among the included accounts (`choose`).
2. A routing question maps each option to one included account, or to all included accounts (`by_question`). The buyer then picks.

When the attendee pays by transfer, the system stores `source_1`, `source_2`, or `global`, a label snapshot, and the question answer when it applies. Staff see that choice in Payments, Attendees, and the XLSX/PDF export.

## Done When

- Migration `219_event_dual_bank_transfer.sql` (and `supabase/migrations/masterdb.sql`) adds `bank_transfer_sources_config JSONB` and `allow_family_discount BOOLEAN NOT NULL DEFAULT false` to `public.events`, plus `transfer_source_key`, `transfer_source_label`, and `transfer_question_answer` to `public.event_attendees`.
- Pure domain module `src/lib/events/eventBankTransferSources.ts` validates, sanitizes, and resolves which transfer source(s) to display and which selection is required on submit.
- Admin create and pricing forms (`Resumen → Precios`) let staff:
  - Toggle whether the 10% family discount (`allow_family_discount`) is shown on the public registration form.
  - Configure multi-ticket purchases per person (`allow_multiple_tickets`, `max_tickets_per_registration`), and choose whether additional tickets stay under the primary buyer's name (`companion_require_details = false`) or require each companion's details (`companion_require_details = true`, plus optional ID, email, and birth date).
  - Show the Finance transfer text directly under the single-account transfer section when it exists, with `"Usar la cuenta global para el evento"` / `"Usar otras cuentas"` checkboxes, and `"Permitir más de una cuenta bancaria"`.
- Admin Event Summary tab (`AdminEventDetailSummaryTab`) uses collapsible accordion sections (`Fecha, lugar y cupo`, `Precios, entradas y cuentas de transferencia`, `Traducciones y descripción del evento`) to minimize vertical scrolling.
- Event duplication (`duplicateEventPlan` / `duplicateEventServer`) copies `bank_transfer_sources_config`.
- Public event registration (`EventRegisterForm`, `useEventRegisterForm`, `useEventRegisterSubmit`, `POST /api/events/[slug]/enroll`) renders a prominent total-to-pay summary card (`EventRegisterTotalSummaryCard`) showing the full sum across all selected tickets (`seats × unitPrice`) minus any active family or code discount, renders the routing question (when `mode === "by_question"`), renders the transfer account selector (when two sources are applicable), shows the active bank instructions, and requires a valid source selection before submitting a transfer registration.
- Admin event detail (`AdminEventPaymentsPanel` / `AdminEventPaymentReviewRow`, `AdminEventAttendeesPanel` / `AdminEventAttendeeExpandedDetails`, and XLSX/PDF exports in `buildEventAttendeesExportTable`) displays the chosen transfer source label and routing answer.
- Dictionaries `en.json`, `es.json` (neutral `es-419` tuteo), and `pt.json` include all new keys.
- Self-contained Vitest unit and component tests pass with ≥90% coverage on touched modules.

## Out of Scope

- Splitting a single attendee's transfer receipt across both bank accounts in one transaction (each registration pays into one chosen source).
- Modifying online payment gateways (Mercado Pago / Flow) — dual bank transfer applies only when the payment method is bank transfer.
- Interactive venue seat maps and seat reservations (covered in Sub-project 2 immediately after this sub-project).

## Approaches Considered

1. **Structured JSONB config on `events` + snapshot columns on `event_attendees` (Recommended):**
   - Keeps single-source `bank_transfer_instructions` untouched when dual mode is off.
   - Stores `bank_transfer_sources_config` on `events` and snapshots `transfer_source_key`, `transfer_source_label`, and `transfer_question_answer` on `event_attendees`.
   - Zero extra joins on public landing load; historical payment attribution remains intact even if staff later rename a source.
2. **Dedicated relational tables (`event_transfer_sources`, `event_transfer_options`):**
   - Rejected: adds unnecessary joins and multi-step CRUD for a bounded 2-source configuration edited inside the pricing card.
3. **Linking to arbitrary custom form fields (`event_form_fields`):**
   - Rejected: couples financial settlement attribution to form field edits/deletions and complicates export/payment reconciliation.

## Architecture & Data Flow

1. **Schema (`supabase/migrations/219_event_dual_bank_transfer.sql`):**
   - `events.bank_transfer_sources_config JSONB NULL`
   - `event_attendees.transfer_source_key TEXT NULL CHECK (transfer_source_key IN ('source_1', 'source_2', 'global'))`
   - `event_attendees.transfer_source_label TEXT NULL`
   - `event_attendees.transfer_question_answer TEXT NULL`
2. **Pure domain:**
   - `eventBankTransferSources.ts` parses and sanitizes the config. Legacy `mode` values `both`, `source_1`, and `source_2` become `included` plus `choose`. Option target `both` becomes `all`.
   - `eventTransferPresentation.ts` resolves the visible accounts. Global instructions come from the Finance setting at read time. They are not stored in the JSON.
3. **Server Validation & Persistence:**
   - `POST /api/events/[slug]/enroll` validates the transfer selection when transfer payment is required and dual mode is active, then passes `transferSelection` to `enrollEventAttendeeServer`, which persists `transfer_source_key`, `transfer_source_label`, and `transfer_question_answer` on `event_attendees` and logs audit metadata on admin config changes (`recordSystemAudit`).
4. **Admin & Exports:**
   - `loadEventPaymentsPaginated` and `loadEventAttendeesPaginated` select the 3 transfer columns from `event_attendees`.
   - `AdminEventPaymentReviewRow`, `AdminEventAttendeeExpandedDetails`, and `buildEventAttendeesExportTable` display the chosen transfer source and answer.
