# Mini 04 — Instituto list bodies

**Parent:** [`../2026-08-22-admin-experience-unification-design.md`](../2026-08-22-admin-experience-unification-design.md)
**Needs:** Mini 00

## Intent

Every Instituto tile lands on a list whose **body** matches Alumnos, not only the banner.

## Done when

Headers already use `AdminPageHeader`. Bodies:

| Page | Body |
|------|------|
| Events | Already KPI + card; Acciones stay primary Manage |
| Badges | Table card + edit CTA already restyled; Acciones header muted |
| Coupons / promotions | Create form + table already cards; retire stays error |
| Blog list | Cards + primary create; row buttons `rounded-xl` |
| Audit | Inherits Mini 00 via `UniversalListView` |
| Glossary | Page cards already restyled |
| Calendar special | Create form + table in body-card |
| Analytics | Chart sections already cards |
| Email templates | Workspace cards body-card |
| Settings | Forms already cards |

Sweep leftover `bg-surface` shells in those folders. Do not add KPIs without existing counts.

## Out of scope

Event attendee editors (detail, Mini 05). Theme canvas (Mini 01).
