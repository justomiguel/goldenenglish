# Academic section feature flags — evaluations & learning route

**Date:** 2026-07-23  
**Status:** Approved  
**Related:**
- Section shell: `AcademicSectionShellTabs`, `AcademicSectionPageShellBody`
- Learning route assignment: `section_learning_routes`, `AcademicSectionLearningRouteSelector`
- Assessments: `learning_assessments`, `AcademicSectionAssessmentsPanel`
- Governance: `.cursor/rules/10-engineering-governance.mdc` (ADR for data + progress contract)
- Tours: `.cursor/rules/33-admin-tutorials-contract.mdc`

## Intent

Admins control, per section and from the **Configuration** tab, whether the section:

1. **Requires evaluations to pass** — when on, show the **Evaluations** tab and apply evaluation-based pass/progress rules; when off, hide that surface and do not treat assessments as section pass requirements.
2. **Uses a learning route** — when on, show the **Learning route** tab (route vs free-flow assignment); when off, hide that surface and do not apply learning-route progress to learners for that section.

## Understanding

- Today both **Evaluations** and **Learning route** tabs are always visible on the admin section detail shell.
- Learning route assignment already lives in `section_learning_routes` (`mode`: `route` | `free_flow`).
- Assessments live in `learning_assessments` (section-scoped) plus attempts.
- Configuration already hosts period, capacity, min attendance, room, schedule editors with server actions + `router.refresh()`.

## Locked product decisions

| Decision | Choice |
|----------|--------|
| Approach | Two typed booleans on `academic_sections` |
| Default (new + existing) | **Both `false`** — tabs hidden until admin enables |
| Disable with existing data | **Block** — require clearing assessments / unassigning `mode=route` first |
| Disable without data | Allowed; data soft-preserved only when never blocked (no wipe on disable) |
| Scope | **Admin UI + student/teacher surfaces + pass/progress rules** |
| Enable | Always allowed |

## Data model

Migration (additive) on `public.academic_sections`:

| Column | Type | Default |
|--------|------|---------|
| `requires_evaluations_to_pass` | `boolean NOT NULL` | `false` |
| `uses_learning_route` | `boolean NOT NULL` | `false` |

No backfill to `true`. Update `masterdb.sql` if team workflow expects it. Document in ADR under `docs/adr/`.

## Admin UX

### Configuration toggles

Two controls in the Configuration panel (icons per **16**, copy per **09**):

1. Section has evaluations required to pass → binds `requires_evaluations_to_pass`.
2. Section follows a learning route → binds `uses_learning_route`.

Pattern: client editor + server action (assert admin, Zod, `revalidatePath` + client `router.refresh()`), audit via `recordSystemAudit` on change.

### Shell tabs

`AcademicSectionShellTabs` (or page body) builds visible tab list from flags:

| Tab | Visible when |
|-----|----------------|
| Evaluations | `requires_evaluations_to_pass === true` |
| Learning route | `uses_learning_route === true` |

Deep link `?tab=evaluations` / `?tab=learningRoute` when flag is off → fall back to `general` (or first visible tab). Update tab-order helpers / URL parsers accordingly.

### Admin tours

L1/L2: treat evaluation and learning-route anchors as **optional** (or conditioned on fixtures with flags on). Do not require those tabs’ always-visible anchors when flags default off. Update `listTourRuntimeChecks` / content-only defs as needed.

## Disable guards

Server action rejecting `false` when:

| Flag turning off | Block if |
|------------------|----------|
| `requires_evaluations_to_pass` | ≥1 row in `learning_assessments` for `section_id` |
| `uses_learning_route` | Row in `section_learning_routes` with `mode = 'route'` for the section |

Stable result codes (e.g. `has_evaluations`, `has_learning_route`) mapped to dictionary messages. Turning **on** never blocked by these checks.

Clarification: `free_flow` assignment alone does **not** block turning `uses_learning_route` off (only `mode = 'route'`). Prefer deleting or normalizing free_flow row when disabling if product needs a clean slate; minimum bar is blocking only when a concrete route is assigned.

## Business rules when flag is false

1. **Admin** — tab hidden; panel not mounted (or not reachable).
2. **Teacher / student / parent** — do not expose section assessments UI / learning-route progress UI for that section when the corresponding flag is false.
3. **Pass / progress / health** — section health and any “must pass via assessments” / route-gated progress **must not** require those features when the flag is false.
4. **Mutation gates** — creating/updating section assessments or assigning `mode=route` fails with a stable code if the matching flag is false.
5. **Free-flow** — only meaningful when `uses_learning_route` is true (chosen inside the Learning route tab).

## Layers touched

| Layer | Work |
|-------|------|
| Migration + ADR | Columns + decision record |
| `src/lib/academics/` | Load flags on section page data; pure helpers for visible tabs / guards |
| Server actions | Update flags; gate assessment / route assignment actions |
| UI | Configuration editors; conditional shell tabs |
| Dictionaries | en + es (+ pt if academic section namespace already localized) |
| Tests | Vitest: guards, tab filtering, action auth/validation, editor smoke |
| Tours | Contract updates for optional anchors |

## Non-goals

- Auto-delete assessments or route assignment on disable.
- Inferring defaults from existing data.
- Changing fees, staff, attendance, capacity, or schedule contracts.
- Cohort-level global flags (section-scoped only).
- Student portal guided tours for these surfaces.

## Risks and mitigation

| Risk | Mitigation |
|------|------------|
| Existing sections lose visible Evaluations / Learning route tabs overnight | Intentional (defaults off); document in ADR + release note for admins |
| Tours / E2E assume tabs always present | Mark anchors optional; update matrix and any section-detail tour steps |
| Stale deep links `?tab=` | Normalize to `general` when disabled |
| Health overview still flags missing route/assessments | Gate health flags on the same booleans |

## Definition of done

- [ ] Migration + ADR landed; defaults `false` for all sections.
- [ ] Configuration toggles persist and refresh UI.
- [ ] Evaluations / Learning route tabs only when flags on; deep-link fallback works.
- [ ] Disable blocked with clear i18n when assessments / `mode=route` exist.
- [ ] Student/teacher surfaces and pass/progress paths respect flags.
- [ ] Assessment create and route assign fail closed when flags off.
- [ ] Vitest coverage for helpers, actions, and tab visibility; tour contracts green.
- [ ] Manual QA (user): enable both flags → tabs appear; configure data → cannot disable until cleared; disable after clear → tabs gone.

## Options considered

| Option | Why rejected |
|--------|----------------|
| Infer visibility from existing assessments / route rows | No explicit Configuration control; cannot open empty tabs to start setup |
| JSONB `settings` blob | Worse typing/queryability for two booleans |
| Defaults `true` for existing | User chose opt-in defaults (`false`) |

## Open implementation notes (non-blocking)

- Exact Lucide icons and dictionary key paths follow existing `academicSectionPage` namespaces.
- Prefer a small pure helper `visibleAcademicSectionShellTabs(flags)` for shell + tests.
- Prefer one focused action file (e.g. `sectionFeatureFlagActions.ts`) rather than bloating unrelated period/capacity actions.
