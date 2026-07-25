# Section drill-down areas — shared visual scheme

**Date:** 2026-07-23  
**Status:** Approved  
**Related:**
- Hub nav: `2026-07-23-section-shell-hub-navigation-design.md`
- Fees layout (canonical reference): `2026-07-23-section-fees-layout-design.md`
- Teachers modals / person cards (behavior already approved)
- Configuration panel: **WIP — do not redesign content in this change**

## Intent

Make every section **hub drill-down area** (Teachers, Learning route, Assessments, Fees, Attendance, Students) follow the **same visual hierarchy** established on Fees: summary when useful → one or more **block cards** with large icon wells + title + lead → embedded editors/tables inside. Put **Configuration last** in the hub card order and leave its internal layout for a later pass.

## Understanding

- Fees already ships: KPI summary (large icons) + Amounts / Charge rules block cards (`AcademicSectionFeesBlockHeader` pattern).
- Other areas diverge: Learning route uses its own bordered `bg-background` card; Assessments uses plain `h2`s; Attendance is flat; Teachers is list + CTA row without the Fees block chrome; Students is roster-only; Configuration is a long stack of independent editors (intentionally deferred).
- `AcademicSectionShellWorkspace` already wraps drill-down in an outer surface + area lead line — panels should **compose under** that chrome, not invent a third title system.

## Locked decisions

| Decision | Choice |
|----------|--------|
| Canonical scheme | Fees pattern (summary optional + block cards with large icon wells) |
| Shared UI | Promote Fees block header → reusable `AcademicSectionAreaBlockHeader` (or keep alias); optional thin `AcademicSectionAreaBlock` wrapper (border/surface/padding/shadow) |
| Configuration | **Hub order last only**; no content regrouping in this change |
| Behavior / saves | No mutation contract changes |
| Workspace outer card | Keep; inner block cards are intentional nesting (same as Fees) |

## Target layout (every area except Configuration)

```
[ Area chrome: back + title + switcher ]     ← existing
[ Area lead (workspace) ]                    ← existing; may enlarge icon to match

[ Optional summary band ]                    ← KPIs / assigned staff / roster counts
[ Block card(s) ]
  · Large icon well + H2 + lead + divider
  · Content (embedded editors, tables, CTAs)
```

### Per-area application

| Area | Summary | Block(s) |
|------|---------|----------|
| **Teachers** | Assigned person cards (existing list) as summary band | One “Manage staff” block: CTA row (existing modals) |
| **Learning route** | Optional: current mode chip (route title / free flow) | One block: selector + save (reuse existing form; restyle header) |
| **Assessments** | Optional: counts (learning / cohort) | Two blocks: Learning tests · Cohort rubric (existing tables) |
| **Fees** | Already done | Already done — adopt shared header molecule |
| **Attendance** | Optional: schedule line as summary meta | One block: matrix / empty states |
| **Students** | Optional: active count chip | One block: enroll CTA + roster |
| **Configuration** | — | **Skip content**; only move hub card to **last** |

## Hub card order

`ACADEMIC_SECTION_SHELL_HUB_AREA_ORDER` becomes:

`teachers → learningRoute → evaluations → fees → attendance → students → configuration`

(Flag-gated areas still omit when disabled.) Update any Vitest that asserts previous order.

## Architecture / layers

| Layer | Work |
|-------|------|
| Pure | Hub area order constant + `visibleAcademicSectionHubAreas` tests |
| UI | Shared `AcademicSectionAreaBlockHeader` (+ optional block shell); restyle panels listed above |
| Fees | Point at shared header (no UX regression) |
| i18n | Only if new block titles needed; prefer existing leads/titles |
| Tests | Order helper; smoke that each panel renders block headings / structure |

## Non-goals

- Redesigning Configuration internals (feature flags, period, capacity, schedule stack).
- Changing staff modals, enroll modal, fee save semantics, or attendance matrix behavior.
- New Driver.js tours.

## Risks

| Risk | Mitigation |
|------|------------|
| Triple titles (workspace lead + block title + editor h3) | Prefer workspace lead short; block title = job; editors stay `embedded` / h3 |
| Scope creep into Configuration | Explicit deferral in DoD |
| File size | Shared header molecule; one panel file per area |

## Definition of done

- [x] Hub cards order ends with Configuration; tests updated.
- [x] Teachers, Learning route, Assessments, Fees, Attendance, Students use the shared block-header / card scheme (summary where listed).
- [x] Configuration panel content unchanged.
- [x] Vitest for order + panel smoke; Manual QA (user) spot-check each area.

## Out of scope

- Configuration content regroup (summary + Amounts-style blocks) — follow-up spec.
- Hub overview charts / health strip redesign.
