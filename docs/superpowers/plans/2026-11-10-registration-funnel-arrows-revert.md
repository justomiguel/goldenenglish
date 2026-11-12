# Registration funnel arrows, step back, and contact mail

**Spec:** `docs/superpowers/specs/2026-11-10-registration-funnel-arrows-revert-design.md`

## Files

- `src/lib/register/registrationFunnelStage.ts` — paid only when captured. Awaiting section only when status is contacted and there is no fee.
- `src/lib/register/registrationFunnelRevert.ts` — pure patch and next stage.
- `src/lib/register/registrationInboxFilter.ts` — same rules in SQL.
- `src/app/[locale]/dashboard/admin/registrations/revertRegistrationFunnelStageAction.ts` — write, audit, revalidate.
- `src/app/[locale]/dashboard/admin/registrations/sendRegistrationContactEmailAction.ts` — institute chrome around the staff message.
- `src/components/molecules/RegistrationFunnelArrows.tsx` — joined chevrons.
- `src/components/molecules/RegistrationListToolbar.tsx` — use the arrows.
- `src/components/dashboard/RegistrationContactMailForm.tsx` — composer.
- `src/components/dashboard/AdminRegistrationFunnelPanel.tsx` — composer, back, confirm.
- Dictionaries `en.json`, `es.json`, `pt.json`.
- `supabase/pulsar-migrations/034_registration_funnel_arrows_changelog.sql`.

## Tasks

1. Lock the stage rules with tests, then change the classifier and the SQL filter.
2. Lock the revert walk with a pure test, then the server action.
3. Replace chips with the arrow group. Assert no `rounded-full` on a stage button.
4. Send the contact mail through `sendWrappedHtmlEmail`. Show each error code.
5. Mount the composer and the back confirm on the shared panel. Web and PWA already share that panel and the toolbar.
