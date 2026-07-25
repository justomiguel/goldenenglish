# Section feature flags — save on toggle

**Date:** 2026-07-24  
**Status:** Approved  
**Related:** `docs/superpowers/specs/2026-07-23-section-feature-flags-evaluations-learning-route-design.md`, `AcademicSectionFeatureFlagsEditor`, `updateAcademicSectionFeatureFlagsAction`

## Intent

Binary learning-feature preferences (`requires_evaluations_to_pass`, `uses_learning_route`) must persist when the admin toggles a checkbox — without relying on a separate Save click that is easy to miss in the Configuration summary.

## Understanding

- Golden DB columns exist and accept updates; the section under test stayed `false` because `updateAcademicSectionFeatureFlagsAction` was never successfully invoked from the UI.
- The editor used local state + an explicit Save button gated on `dirty`.
- PostgREST can return no error on UPDATE with 0 rows; the action should fail closed when no row is returned.

## Done when

1. Toggling either checkbox immediately calls the existing server action with both current flag values.
2. Success shows the existing saved status copy and calls `router.refresh()`; failures show the existing error dictionary keys (including disable guards).
3. On failure, the checkbox reverts to the last confirmed server value.
4. Action update path uses `.select(...).maybeSingle()` and returns `SAVE` when no row is returned.
5. Vitest covers save-on-toggle success/revert and the 0-row update failure.
6. Explicit Save button is removed (or no longer required); copy keys adjusted if the Save label becomes unused — prefer removing the control and keeping `saved` / error keys.

## Out of scope

- Changing column defaults, disable-guard rules, or tab visibility logic.
- Auto-save for period / capacity / room / schedule editors.
- Migrations.

## Manual QA (user)

1. Configuration → Funciones: toggle evaluations on → status “saved” → leave and return → still on; Evaluations hub card visible.
2. Toggle learning route on → same.
3. With assessments present, toggle evaluations off → guard error and checkbox back on.
