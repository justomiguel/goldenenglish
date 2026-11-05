# Event minor ticket: maximum age on the public legend

**Intent:** When an event sells a minor ticket, staff set the maximum age. The public event page and the registration form show that age, so a family does not have to guess.

**Done when:**

- Saving “Permitir menores de edad” requires an integer age from 1 to 99.
- The public event price block shows “Menores hasta {age} años” and the minor price.
- The registration hint under “Cuántas entradas son de menor” includes that same age.
- An event that already allows minors and has no age keeps the current sentence until staff save an age.
- en, es, and pt stay aligned. Spanish uses neutral tuteo.

**Out of scope:**

- The system does not reject a birth date above that age. Age is still checked at the event. The form only asks how many tickets are minor tickets.
- Packages, flows, and the institute legal age (`legalAgeMajority`) stay as they are.
- The events list card does not show the age.

## Context

`public.events.allow_minor_tickets` and `minor_ticket_price` (migration `223_event_minor_ticket_price.sql`) let staff sell a cheaper ticket. The public hint is fixed: “La edad se verifica en el evento.” (`events.register.minorTickets.hint`). The public price panel (`PublicEventDetailPanel`) shows local and non-local prices and does not mention minors.

The buyer types a count. The server prices that count. It does not compare a birth date with a cutoff.

## Decision

Store `public.events.minor_max_age` as `SMALLINT NULL`.

- The value is inclusive. `12` means a person who is 12 pays the minor price. A person who is 13 does not.
- The column is required in the app when `allow_minor_tickets` is true. The database stays nullable so old rows keep working.
- Turning the checkbox off clears the price and the age.
- Duplicating an event copies the age.

### Options considered

- **Institute-wide legal age only.** One number for every event. A kids show and an academy night need different cutoffs. Rejected.
- **Free-text legend.** Staff could write anything. The site would still depend on each person wording the same fact. Rejected.
- **Block enrollment from birth date.** Companion birth date is optional. The minor ticket is a count, not one row per child. Rejected for this change.

## Surfaces (Web vs PWA)

Public event detail and public registration are Tier A.

- **Web (`web-desktop`):** `PublicEventDetailPanel` adds one line under the price. `EventRegisterMinorTicketsField` shows the age in the existing hint. Admin pricing stays desktop (Tier B) and gains a number field next to the minor price.
- **PWA (`web-mobile` / `pwa-mobile`):** Registration uses the same `EventRegisterForm` inside `EventRegisterPwa`. The hint is the same sentence. The public event page uses the same `PublicEventDetailPanel` with `surfaceVariant`. No second layout.

Shared props (`PublicEventDetail.minorMaxAge`) feed both surfaces. A missing age hides the new line and keeps the old hint.

## Plan

1. Migration `supabase/migrations/<next>_event_minor_max_age.sql`: `ALTER TABLE public.events ADD COLUMN IF NOT EXISTS minor_max_age SMALLINT NULL` plus `CHECK (minor_max_age IS NULL OR (minor_max_age >= 1 AND minor_max_age <= 99))`. Update `masterdb.sql` in the same change. Apply with `npm run sql:apply-migration:all-tenants:pg`.
2. Pure helper `formatEventMinorAgeLegend` in `src/lib/events/`: returns the public sentence only when the age is an integer in range. Tests cover 12, null, 0, and 100.
3. Admin save in `eventCrudActions.ts`: when minors are allowed, reject a missing or out-of-range age with a stable code. Clear the age when minors are off. `revalidatePath` for the admin event and the public event routes. Client calls `router.refresh()` after success.
4. Loaders: `loadAdminEventDetailPageModel`, `loadEventForPublicLanding`, and `duplicateEventServer` / `duplicateEventPlan` include the column.
5. UI: number field in `AdminEventResidencyPriceFields`. Public line in `PublicEventDetailPanel`. Hint in `EventRegisterMinorTicketsField` receives the formatted sentence from the page.
6. Copy in `en.json`, `es.json`, and `pt.json`.
7. Short ADR `docs/adr/2026-11-05-event-minor-max-age.md` (persisted public fact). No new analytics event: this is staff configuration, so `recordSystemAudit` on the price save if that action already audits; otherwise add one audit row for the pricing save with `resource_type` `event` and payload `{ minor_max_age }` only.
8. Changelog entry when the feature ships.

## Risks

- Old events stay vague until staff open pricing and save an age. The public page must not invent 18.
- A check constraint rejects bad SQL. The action must validate first and return a field error, not a database exception.

## Definition of done

- Spec tests: helper, admin validation, public panel line, registration hint.
- Manual QA (user): publish an event with minor price and age 12, open the public page and the registration form on desktop and on a phone width, confirm both say “hasta 12 años”.
