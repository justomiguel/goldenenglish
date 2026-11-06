# Public register section assignment mode

**Intent:** In Inscripciones, staff pick how the public register form treats sections. The family chooses a section, the form sends the first open section, or the lead arrives with no section and staff assign it.

**Done when:**

- The Inscripciones checkbox “Mostrar todas las secciones” is a group of three options.
- `student_choice` matches today’s on state. The family sees the list only when two or more sections have room. One open section is sent without a list.
- `first_open` matches today’s off state. The family does not see the list. The form sends the first open section.
- `admin_assign` hides the list. The lead is stored with no preferred section. Accept already opens the section picker for that lead.
- A section enrollment link (`/i/…`) still locks that section in every mode.
- An institute with no new row keeps today’s boolean: on becomes `student_choice`, off or missing becomes `first_open`.

**Out of scope:**

- Trial class and trial reschedule. Those flows still require a section.
- Staff creating a lead by hand. That screen still shows the section list.
- Changing which cohort supplies the public sections.
- A second picker on the admin accept step. The existing picker stays.

## Surfaces (Web vs PWA)

Public `/register` is Tier A and has no separate PWA tree. Theme shells (`RegisterNagoSurface`, `RegisterLioraSurface`, `RegisterClassicSurface`, `RegisterMiMundoSurface`, `RegisterMozarthitosSurface`, `RegisterEspacioZenitSurface`) all pass the same flag into `RegisterForm`. Change that shared flag. Do not add a PWA register form.

The section link route uses the same shells with `enrollmentLink` set. It must ignore the public mode and keep the locked section.

Inscripciones settings are Tier B. `InscriptionsSettingsForm` is desktop-only. No settings PWA tree exists.

Admin Inscripciones already has a narrow tree (`AdminRegistrationsScreenNarrow`). A lead with no preferred section already opens the shared accept picker. Do not add a new control there.

## Decision

Store one value on `site_settings`, key `register_section_mode`.

Allowed JSON strings:

- `student_choice`
- `first_open`
- `admin_assign`

Read the new key first. If it is missing or not one of those three strings, fall back to `register_show_all_sections`: `true` means `student_choice`, anything else means `first_open`.

Keep the old key. Do not delete it. New saves write only `register_section_mode`.

Rejected: a second checkbox next to the old one. Two booleans can disagree.

Rejected: overloading the old boolean. A boolean cannot store three modes.

## Data

Add the next institute migration after `264_event_seat_holds.sql`.

1. Insert `register_section_mode` when the row is absent.
2. If `register_show_all_sections` is JSON `true`, store `"student_choice"`. Otherwise store `"first_open"`.
3. Recreate `site_settings_select_public` with the key list from `227_registration_cohort_and_student_lookup.sql` plus `register_section_mode`. Anon and authenticated keep the same read right. The new key is not a secret.
4. Append that file to `supabase/migrations/masterdb.sql`.

No new table. No ADR. The public policy audience does not change.

The admin upsert already uses `site_settings_all_admin`. Do not add a write policy.

## Behavior

`resolveRegisterSectionPickerView` and `initialRegisterSelectedSectionIds` take the mode.

| Mode | Picker | Hidden section sent |
|---|---|---|
| `student_choice` | Visible when two or more sections are open | First id from `resolveRegisterChoosableIds` when the picker is hidden. Undecided sentinel when that list is empty. |
| `first_open` | Hidden | First id from `resolveRegisterChoosableIds`, or the undecided sentinel when that list is empty. |
| `admin_assign` | Hidden | Always the undecided sentinel. Do not show an assigned-section label. |

When `hasEnrollmentLink` is true, selection stays empty and the link section wins. Do not apply `admin_assign` on that route.

Submit still uses `resolvePublicRegistrationSections`. The undecided sentinel stores `preferred_section_id` null. Accept then shows the existing section step because the lead has no requested section.

Replace `setRegisterShowAllSections` with one admin action that validates the three strings, writes the new key, audits `site_settings_upsert`, and revalidates `/`, `/register`, and the settings page.

Copy for the three options goes in `en.json`, `es.json`, and `pt.json`. Spanish uses neutral tuteo. Remove the old checkbox strings in the same change.

If `InscriptionsSettingsForm` would pass 250 lines, extract the radio group into its own file.

## Tests

- Parser: valid strings win. A missing or unknown value follows the old boolean.
- Picker: the three rows in the table above, plus the enrollment-link short circuit.
- Settings action: a non-admin call fails. An unknown string fails. A valid string upserts `register_section_mode`.
- Register form: `admin_assign` does not render the section list and posts the undecided value.
- Register form: an enrollment link still posts its locked section when the public mode is `admin_assign`.
