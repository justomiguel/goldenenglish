# Plan: register quiet assigned-section line

Spec: `docs/superpowers/specs/2026-10-28-register-quiet-assigned-section-line-design.md`

## Task 1 — Pure label helper

- Extend `src/lib/register/resolveRegisterSectionPickerView.ts` with `resolveRegisterAssignedSectionLabel`.
- Return the option label for the hidden preferred id, or `null` when the picker is visible, an enrollment link is present, or the id is the undecided sentinel.
- Test: same file as the existing picker-view tests.

## Task 2 — Copy + line

- Add `assignedSectionLine` to `en.json` / `es.json` / `pt.json` under `register`.
- In `RegisterFormContactAndSections`, when the helper returns a label, render one muted `role="note"` line next to the hidden field. Keep the hidden `preferred_section_id`.
- Do not render the line in enrollment-link mode.

## Task 3 — Tests + changelog

- `registerForm.test.tsx`: after Continue, assert the assigned section name when the combo is hidden; assert it is absent when show-all lists two sections; enrollment-link test already owns the card.
- Changelog entry in `catalogEntriesNow.ts` (families see the line).
