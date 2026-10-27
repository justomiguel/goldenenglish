# Persistent page tabs

Spec: `docs/superpowers/specs/2026-10-27-persistent-page-tabs-and-section-teacher-icons-design.md`

1. Pure helpers in `src/lib/navigation/persistentPageTab.ts` plus unit tests.
2. Hook `usePersistentPageTab` plus a hook test (URL wins, storage fills a missing URL, change writes both).
3. Rule `.cursor/rules/42-persistent-page-tabs.mdc`.
4. Wire the hook into the page tabs listed in the spec. Nested tabs use `billing`, `insights`, or `roster`.
5. Icons on `AdminStudentSectionsList` with dictionary labels in en, es, and pt.
6. Clear `sessionStorage` in the Vitest setup so one test does not restore a tab into the next.
