# Academic section shell — hub + drill-down navigation

**Date:** 2026-07-23  
**Status:** Approved (hub nav + lean hub layout amendment)  
**Related:**
- Visibility: `visibleAcademicSectionHubAreas`, feature flags (`requires_evaluations_to_pass`, `uses_learning_route`)
- Spec: `2026-07-23-section-feature-flags-evaluations-learning-route-design.md`
- Health UI: `AcademicSectionHealthOverview`, `AcademicSectionHealthCharts`
- Tours: `.cursor/rules/33-admin-tutorials-contract.mdc` (`ADMIN_TOUR_ANCHORS.sectionDetailTabs`)

## Intent

Replace the dense **8-slot underline tab grid** on the admin academic section detail page with a **task-oriented hub** (cards) plus **drill-down** into each area, and a **compact area switcher** while inside a drill-down — so optional tabs (Evaluations / Learning route) never leave a broken-looking grid, and the shell feels like “choose a job” rather than “scan a settings strip”.

## Locked product decisions

| Decision | Choice |
|----------|--------|
| Pattern | **Hub + drill-down** |
| Feature flags | Cards omitted when flag off |
| Deep links | Keep `?tab=<areaId>`; no param / flag-off / `general` → hub |
| Mobile | Same pattern (Tier B admin) |

---

## Amendment — lean hub layout (2026-07-23)

**Product choice:** Option **A** (lean overview).

### Hub order

```
[ Section header ]

[ Area cards — first ]     ← larger icons
[ KPI summary strip ]
[ Alert chips when flags warrant ]
[ Charts — Attendance + Payments only ]
```

Cards sit **above** health charts so the primary action (“pick a job”) is first.

### Card chrome

- Enlarge Lucide icons on hub cards (target **`h-7 w-7` / `h-8 w-8`**, not `h-4 w-4`).
- Keep whole-card button + title + short lead.

### Lean health block (on hub only)

| Keep | Drop from hub |
|------|----------------|
| Summary strip (students / capacity % / attendance %) | Tasks radial chart |
| **Attendance** composition chart | Capacity treemap (redundant with strip) |
| **Payments** debt vs clear chart | Engagement bars |
| Flag chips: missing entry/exit (evaluations flag); missing objectives (route mode) | Assessments coverage chart |
| Optional one-line route title when `mode=route` | Readiness support/override chart |

Do **not** delete chart plot components from the repo if unused elsewhere yet — simply stop mounting them from the section hub overview. Loader/snapshot may still compute unused fields for now (no loader rewrite required in this amendment unless cheap).

### Tours

- Hub tour: cards first, then brief overview/charts step if still anchored on `sectionDetail`.
- Update copy that still implies “eight tabs” or a chart wall.

### Done when (amendment)

- [x] Hub renders **cards → strip → chips → 2 charts** (attendance + payments).
- [x] Hub card icons visibly larger (`h-7`+).
- [x] Tasks / capacity / engagement / assessments / readiness charts not shown on hub.
- [x] Vitest/RTL updated for order + lean chart set.
- [ ] Manual QA (user): hub scan order; flags on/off for chips.

### Out of scope (amendment)

- Redesigning chart plot libraries themselves.
- Teacher portal health dashboards.
- Changing which metrics are loaded server-side (optional follow-up).

---

## Original hub + drill-down (still in force)

### Drill-down

```
[ ← Back to section ]   [ Area title ]   [ Compact switcher ▾ ]
[ Area panel body ]
```

### Visibility

| Area id | Visible when |
|---------|----------------|
| `configuration`, `teachers`, `fees`, `attendance`, `students` | Always |
| `learningRoute` | `uses_learning_route === true` |
| `evaluations` | `requires_evaluations_to_pass === true` |
| `general` | Not a card — hub home only |

### URL

| URL | UI |
|-----|-----|
| `/…/sectionId` | Hub |
| `/…/sectionId?tab=fees` | Drill-down Fees |
| `/…/sectionId?tab=evaluations` (flag off) | Hub |
| `/…/sectionId?tab=general` | Hub |

## Non-goals (original)

- Changing panel internals beyond mount location.
- Teacher/student portal section navigation redesign.
- Removing feature-flag columns or disable guards.
