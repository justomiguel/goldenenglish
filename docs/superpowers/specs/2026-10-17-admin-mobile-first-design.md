# Admin mobile-first

**Date:** 2026-10-17
**Status:** Approved (implement the attached plan)
**Kind:** UI adaptation. No API, schema, auth, or business-rule changes.

**Plan:** [`../plans/2026-10-17-admin-mobile-first.md`](../plans/2026-10-17-admin-mobile-first.md)

## Intent

Every existing admin screen, including routes that are not in the main menu, must be usable on a phone (320–430 px) without dropping fields, actions, or desktop behavior. Layouts reflow for touch. They do not shrink the desktop UI.

## Done when

- Chrome (header, drawer, help, command palette) is reachable with 44 px targets and safe-area padding.
- Wide admin tables render as labeled cards below `md` and as the current table at `md` and up. Every column value and every action stays visible.
- Attendance, section/cohort collections, and the record-payment month grid use a focused vertical editor on phones. The desktop matrix is unchanged.
- Hover-only affordances have a touch path. Drag boards accept touch and keep up/down buttons.
- `e2e/admin-mobile-responsive.spec.ts` visits admin routes at 320, 375, 430, 768, 1024, and 1440 and asserts no page-level horizontal overflow and no off-screen controls. Routes the isolated seed cannot open are listed as not validated.
- Vitest, lint, typecheck, and build stay green for the touched surfaces.
- New copy is in `en.json`, `es.json`, and `pt.json` (neutral tuteo).

## Out of scope

- New product features, IA, or visual rebrand.
- API, database, server-action contracts, and integrations.
- Student, parent, and teacher portals except shared primitives they already import (pagination, modal, input, tab bar). Those primitives must stay desktop-equivalent at `md+`.
- Hiding columns or actions to save space.

## Decisions

1. **Tables.** One `ResponsiveDataTable` molecule. `md+` is a real table. Below `md`, each row is a labeled card (`title`, `subtitle`, `badge`, `field`, `actions`). `UniversalListView` opts in with `mobileCards`.
2. **Matrices.** Phone view picks one student or one date/month and edits cells as a vertical list of 44 px controls. Same hooks and actions as the desktop matrix.
3. **Surface switch.** JavaScript branches use `useAppSurface()` (server snapshot = desktop). CSS-only reflow is used when both trees would be the same component with different classes.
4. **Touch.** `min-h-[44px] min-w-[44px]` below `md`. Desktop density may restore with `md:min-h-9`.
5. **Safe area.** Shared utilities in `globals.css` (`.pt-safe`, `.pb-safe`, `.px-safe`) on `env(safe-area-inset-*)`.
6. **No ADR.** No auth, data, or public contract change. This spec is the written record.

## Route inventory

Redirect-only routes have no UI: `/payments`, `/requests`, `/retention` (if it redirects), `/finance/receipts` (if it redirects), `/finance/collections` (if it redirects), `/academics`. The rest are in scope.

| Area | Routes | Mobile treatment |
|------|--------|------------------|
| Hub | `/`, `/institute`, `/changelog`, `/glossary` | Wrap grids, 44 px tiles |
| People | `/users`, `/users/new`, `/users/import`, `/users/[userId]`, `/users/[userId]/billing`, `/students`, `/teachers`, `/parents`, `/parents/compose` | Existing PWA lists stay. Billing matrix gets focused month list. Forms stack. |
| Academic | `/academic`, cohort, section, attendance, contents (global + section) | Attendance focused view. Assessment and transfer tables become cards. Graph canvas uses viewport height. |
| Finance | `/finance`, collections section, receipts | Collection matrices focused. Enrollment/history/scholarship tables become cards. Action bars 44 px + safe area. |
| Registrations | `/registrations` | Existing narrow cards stay. Desktop row actions 44 px below `md`. |
| Messages | `/messages`, thread, compose, communications templates | Filters wrap. Two-pane template editor stacks below `lg`. |
| CMS | `/cms`, templates, hero, landing, properties, blog | Two-pane editors stack. Raw theme table becomes cards. |
| Events | list, new, detail | List and attendees become cards. Actions wrap. Tabs scroll. |
| Calendar | `/calendar`, special events | Existing narrow agenda stays. Special-events table becomes cards. |
| Analytics | `/analytics` | Path tables wrap. Choropleth scales to container width. |
| Audit | `/audit` | 72 rem table becomes cards. Toolbar stacks. |
| Settings | settings, integrations, questionnaires + results | List table becomes cards. Forms stack. |
| Commerce | coupons, promotions, merch, merch orders | Forced min-widths become cards. |
| Badges | list, new, detail | List becomes cards. |
| Site setup | wizard | Steps stack. Review values wrap. |

Checklist is updated in the plan as each area lands.

## Manual QA (user)

- iPhone and Android: open drawer, search, help, a card list, attendance for one day, collections for one student, a form with the keyboard open, rotate to landscape.
- Confirm desktop at 1440 still shows tables and matrices.
- Confirm Driver.js tours still find `data-tour` anchors on desktop.

## Risks

- Shared primitives (pagination, tabs, input) are used outside admin. Phone sizing must not break desktop density (`md:` restores).
- Tour selectors must stay on the desktop tree.
- Files stay under 250 lines by splitting mobile views.
