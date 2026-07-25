# Plan — Admin tours full L3 coverage + rule

**Spec:** `docs/superpowers/specs/2026-07-12-admin-tours-e2e-coverage-rule-design.md`  
**Date:** 2026-07-12

## Tasks

1. **RED** — Vitest: every `AdminScreenTourId` + `AdminTutorialId` must appear in `listTourRuntimeChecks` ids.
2. **GREEN** — Helper `requiredAnchorsFromContentOnlyDefs` + expand matrix for all screens + explicit create-student/teacher/admin task rows.
3. **Rules** — Update `33-admin-tutorials-contract.mdc` and `31-admin-tutorials-copy.mdc` checklists.
4. **Spec status** — Mark approved in design doc.
5. **Verify** — `npx vitest run` on listTourRuntimeChecks (+ related) tests.
