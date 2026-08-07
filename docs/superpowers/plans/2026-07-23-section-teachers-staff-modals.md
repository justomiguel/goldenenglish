# Plan — Section teachers tab staff modals (option A)

**Spec:** `docs/superpowers/specs/2026-07-23-section-teachers-staff-modals-design.md`

## Steps

1. **RED** — `AcademicSectionStaffEditor.test.tsx`: three CTAs visible; lead/assistants/external form controls hidden until each CTA opens its dialog.
2. **GREEN** — Refactor `AcademicSectionStaffEditor` to CTA row + three `Modal`s wrapping existing Lead / Assistants / External blocks; close lead/external on successful save; keep assistants open after save; `disableClose` while pending.
3. **i18n** — Add open-button (+ optional modal title) keys in `en` / `es` / `pt`; update `staffAssignedChips.empty`.
4. **Polish** — Drop always-on card form chrome; reset draft state when a modal closes without needing a remount of props sync.
5. **Verify** — `npx vitest run` on staff editor + chips tests; dictionaries shape if asserted.
