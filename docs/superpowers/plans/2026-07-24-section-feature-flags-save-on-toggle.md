# Plan: Feature flags save on toggle

**Spec:** `docs/superpowers/specs/2026-07-24-section-feature-flags-save-on-toggle-design.md`

## Tasks

1. **Action** — After update, `.select("id").eq(...).maybeSingle()`; if missing → `SAVE`. Update unit test mock chain + add 0-row case.
2. **Editor** — Remove Submit/Save; on checkbox change, optimistic local state → call action → refresh or revert + error. Sync from `initial*` when props change after refresh.
3. **Dict** — Keep `saved` / errors; remove unused `save` key only if nothing else references it (grep first; can leave key for now to minimize churn).
4. **Tests** — Update `AcademicSectionFeatureFlagsEditor.test.tsx` for toggle-save and revert-on-failure.
