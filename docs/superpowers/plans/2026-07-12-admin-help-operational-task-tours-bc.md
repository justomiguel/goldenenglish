# Plan — Operational admin task tours (Phases B + C)

**Spec:** `docs/superpowers/specs/2026-07-12-admin-help-operational-task-tours-design.md`  
**Prerequisite:** Phase A shipped (catalog groups + 6 daily-ops tours).

## Phase B — Finance settings (guide-only)

1. Catalog ids: `enable-mercadopago`, `enable-flow`, `change-billing-currency` (group `billing`).
2. Path helper: `financeSettingsPath` → `…/finance?tab=settings`.
3. Anchors on settings cards: MP, Flow, currency field / save (no credential submit).
4. Shared builder or thin variants + starters; wire `startAdminTutorial`.
5. Dict en/es/pt + matrix rows (settings chrome always visible).

## Phase C — Content & user security

1. Catalog ids: `create-blog-article` (content), `reset-user-password` (users), `import-users` (users).
2. Paths: blog new, user security tab (`E2E_STUDENT_ID`), users import.
3. Anchors + builders + starters; guide-only for password; no import job start.
4. Dict + matrix + Vitest contracts.

## Shared

- Icons in `tutorialCatalogIcons.ts`
- `listTourRuntimeChecks` + e2e env already has student id
- Update `tourCatalogContract` / `AdminHelpTutorialList` fixtures
