# Plan: register hide undecided unless show all sections

Spec: `docs/superpowers/specs/2026-10-28-register-hide-undecided-unless-show-all-sections-design.md`

## Task 1 — Pure visibility helper

- Add `src/lib/register/resolveRegisterSectionPickerView.ts`.
- Input: choosable section ids (already filtered) + `showAllSections`.
- Output: `{ showPicker, hiddenPreferredSectionId }` — hidden id is first section, or undecided sentinel when the list is empty.
- Test: `src/__tests__/lib/register/resolveRegisterSectionPickerView.test.ts`.

## Task 2 — Setting

- Migration seed `register_show_all_sections` = false and add key to `site_settings_select_public`.
- `getRegisterShowAllSections()` in `inscriptionsServer.ts` (default false).
- Action `setRegisterShowAllSections` + audit + revalidate `/register` and settings.
- Checkbox on `InscriptionsSettingsForm`.
- Copy in en/es/pt under `admin.settings`.

## Task 3 — Public form

- `RegisterForm` takes `showAllSections`.
- Hide `RegisterSectionPicker` when `showPicker` is false; keep hidden `preferred_section_id`.
- Drop undecided `<option>` from `RegisterSectionMultiSelect`.
- Init `selectedSectionIds` from the hidden default so submit does not need a click.
- Enrollment link (`lockedPreferredId`) unchanged.

## Task 4 — Wire loaders

- `/register` page and enrollment-link / admin create-registration pass the flag.
- Tests: MultiSelect, RegisterForm, InscriptionsSettingsForm, settings helper, settings action.
