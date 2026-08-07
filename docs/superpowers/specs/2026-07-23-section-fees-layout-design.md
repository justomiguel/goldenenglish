# Section Fees area — summary + two blocks layout

**Date:** 2026-07-23  
**Status:** Approved  
**Related:**
- Shell: `AcademicSectionShellWorkspace` fees panel (`AcademicSectionPageShellBody`)
- Editors: `AcademicSectionMonthlyFeeChargeModeEditor`, `AcademicSectionAdvanceMonthlyPaymentEditor`, `AcademicSectionFeePlansEditor`, `AcademicSectionEnrollmentFeeEditor`
- Pattern sibling: teachers modals / enroll modal (summary-first, intentional edit) — presentation only here, **not** modals
- Hub nav: `2026-07-23-section-shell-hub-navigation-design.md`

## Intent

Make the admin section **Fees (Cuotas)** area scannable: show a **read-only summary** of what families pay and how dues are charged, then two equal peer blocks — **Amounts** and **Charge rules** — instead of four stacked cards with no hierarchy.

## Understanding

- Today Fees mounts four independent bordered sections, each with its own Save (charge mode → advance → fee plans → enrollment fee).
- Primary job (product): see the **whole picture** and edit **amounts** and **rules** with equal weight (**choice C → layout option 1**).
- No change to server actions or dirty/save semantics per editor.
- Currency for plans comes from system billing settings; enrollment fee follows that currency story already in copy.

## Locked product decisions

| Decision | Choice |
|----------|--------|
| Layout | **Summary strip + two blocks** (Amounts / Charge rules) |
| Save model | Keep **per-editor Save** (no unified “save all”) |
| Modals | **Out** for this change (option 2 rejected) |
| Order inside Amounts | Monthly fee plans **first**, enrollment fee **second** |
| Order inside Charge rules | Charge basis (prorate/full) **first**, advance payment **second** |
| Summary | Read-only chips/KPIs; updates via existing `router.refresh()` after each save |

## Proposed UX

```
[ Fees lead (existing shell lead) ]

[ Summary — read-only ]
  Monthly plan: From MM/YYYY · CUR amount  |  Enrollment: CUR amount | 0 = none
  Charge basis: Prorate… / Full month…     |  Advance payment: Yes / No

[ Amounts ]
  · Monthly fee plans editor (unchanged internals)
  · Enrollment fee editor

[ Charge rules ]
  · Monthly fee charge mode editor
  · Allow advance monthly payment editor
```

### Summary content

| Chip / line | Source |
|-------------|--------|
| Current monthly plan | Pure helper from non-archived plans: latest `effectiveFrom` ≤ institute “today”; else empty copy |
| Enrollment fee | `section.enrollmentFeeAmount` (+ currency hint from system / active plan currency) |
| Charge basis | `monthlyFeeChargeMode` → dict option label |
| Advance | `allowAdvanceMonthlyPayment` → yes/no dict |

No edit controls on the summary. Clicking a chip is **not** required (blocks below are already visible).

### Visual grouping

- One outer surface (or light section headers) for **Amounts** and **Charge rules** with dictionary titles + short leads.
- Nested editors may drop redundant outer `h2` weight or keep titles as subsection headings — prefer **one H2 per block**, editors as H3 / unlabeled forms under the block lead to reduce title noise.
- Icons on block headers (Lucide) per **16**.

## Architecture / layers

| Layer | Work |
|-------|------|
| Pure lib | `resolveCurrentSectionFeePlanSummary` (or similar) from plans + calendar date |
| UI | `AcademicSectionFeesPanel` orchestrator: summary + Amounts + Charge rules; wire existing four editors |
| Page body | Replace flat `space-y-4` stack with the panel |
| i18n | Block titles/leads, summary labels, empty plan / yes-no; en + es + pt |
| Tests | Helper unit tests; RTL: summary shows values; block order Amounts before Charge rules; editors still present |
| Tours | No new required anchors unless we add `data-tour`; update explain copy only if it still says “four cards” |

## Options considered

| Option | Why not |
|--------|---------|
| Summary + modals for each editor | More clicks; rejected vs always-visible edit |
| Single “Save all” form | Changes mutation contract / dirty handling |
| **Summary + two blocks (chosen)** | Equal weight for amounts & rules; keeps four saves |

## Non-goals

- Changing fee plan CRUD, archive, or charge-mode / advance / enrollment actions.
- Finance Collections screens.
- Merging enrollment fee into fee-plan rows.
- Teacher/parent payment UX.

## Risks and mitigation

| Risk | Mitigation |
|------|------------|
| “Current plan” definition disputed | Document helper rule; unit-test edge cases (no plans, all archived, future-only) |
| Nested card borders feel heavy | Flatten inner section chrome under block wrappers |
| Title duplication | Block H2 + shorter editor titles or demote editor titles |

## Definition of done

- [x] Fees area shows summary then Amounts then Charge rules in that order.
- [x] All four editors remain functional with existing saves + refresh.
- [x] Summary reflects current plan / enrollment / mode / advance from props.
- [x] Dictionaries en/es/pt; Vitest for helper + panel order/smoke.
- [ ] Manual QA (user): edit each of the four controls; summary updates after refresh.

## Out of scope

- Unified save, modals, or new billing fields.
