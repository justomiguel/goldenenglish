# Plan — Section students enroll modal

**Spec:** `docs/superpowers/specs/2026-07-23-section-students-enroll-modal-design.md`

## Tasks

1. **RED** — Vitest: Enroll CTA opens modal with enroll controls; busy disables dismiss.
2. **GREEN** — Refactor `AcademicSectionEnrollCard` → button + `Modal`; pass as `headerActions` on roster.
3. **i18n** — `enrollOpenButton`, `enrollModalLead` in en/es/pt.
4. **Wire** — `AcademicSectionPageShellBody` students tab: roster only + enroll trigger in header.
5. **Verify** — `npx vitest run` on new/touched tests.
