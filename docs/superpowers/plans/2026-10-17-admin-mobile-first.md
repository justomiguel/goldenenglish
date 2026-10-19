# Admin mobile-first — implementation plan

**Spec:** [`../specs/2026-10-17-admin-mobile-first-design.md`](../specs/2026-10-17-admin-mobile-first-design.md)

## Phases

1. Shell: 44 px chrome, safe-area utilities, command-palette button, help on phones.
2. Primitives: pagination, confirm modal, tab scroll, input/select/tiptap touch height, dnd touch sensors, hover-only affordances.
3. `ResponsiveDataTable` + `UniversalListView` `mobileCards` + RTL tests.
4. Migrate wide tables (audit, commerce, events, finance tabs, academic, badges, retention, questionnaires, special events, theme editor, analytics, choropleth).
5. Focused matrix views (attendance, collections, record-payment) + pure projection helper tests.
6. Per-route polish (forms, toolbars, grids, truncation, two-pane editors).
7. Playwright overflow sweep at six widths.
8. Vitest, lint, typecheck, build, coverage. Changelog. Ask before commit if unrelated WIP remains.

## Route checklist

Shared shell, phone card tables (`ge-stack-cards`), 44px targets under 768px, and focused matrix views cover these groups. Dynamic detail routes without a seeded id are listed as not validated in `e2e/admin-mobile-responsive.spec.ts`.

- [x] Shell and overlays
- [x] Hub, institute, changelog, glossary
- [x] Users, import, detail, billing, students, teachers, parents
- [x] Academic hub, attendance, contents, transfers, assessments
- [x] Finance hub, collections, receipts, billing matrix
- [x] Registrations
- [x] Messages and email templates
- [x] CMS, blog, hero, landing, properties
- [x] Events
- [x] Calendar and special events
- [x] Analytics
- [x] Audit
- [x] Settings and questionnaires
- [x] Coupons, promotions, merch
- [x] Badges
- [x] Site setup
