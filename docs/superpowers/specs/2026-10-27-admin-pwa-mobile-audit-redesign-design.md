# Admin PWA and Mobile Experience Audit and Redesign — Master Spec

## Ordered Specs

1. **Wave 1 — Shell, Calendar Narrow Container, and Stackable Tables:** `docs/superpowers/specs/2026-10-27-admin-pwa-wave1-shell-and-tables-design.md`
2. **Wave 2 — Section Workspace and Students View:** `docs/superpowers/specs/2026-10-27-admin-pwa-wave2-section-workspace-and-students-design.md`
3. **Wave 3 — Directories, User Dossier, and Finance Mobile UX:** `docs/superpowers/specs/2026-10-27-admin-pwa-wave3-directories-dossier-and-finance-design.md`
4. **Wave 4 — Events, Merch, Content Studio, Messages, Audit, and Headers:** `docs/superpowers/specs/2026-10-27-admin-pwa-wave4-events-merch-contents-messages-audit-design.md`

## Implementation Plan

- `docs/superpowers/plans/2026-10-27-admin-pwa-mobile-audit-redesign.md`

## Intent

Make every `/dashboard/admin/**` screen usable, scannable, and well-proportioned on phones and installed PWAs (`< 768px`). Eliminate nested card padding loss, broken mobile tables, duplicate headers, cramped list rows, and unstyled controls while keeping desktop (`md+`) workflows fast and dense.

## Done When

- All 4 ordered specs are implemented and verified with self-contained Vitest tests.
- All `ADMIN_TOUR_ANCHORS` remain intact.
- No file exceeds 250 lines (`03-architecture.mdc`).
- Product changelog entry is prepended before commit (`39-commit-product-changelog.mdc`).

## Out of Scope

- Database schema or RLS changes.
- Business rule changes for billing, enrollment, or attendance.
