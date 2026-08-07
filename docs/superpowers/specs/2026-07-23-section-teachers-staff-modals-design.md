# Section teachers tab — staff editors behind modals

**Date:** 2026-07-23  
**Status:** Approved — option A (three CTAs → three modals)

## Intent

On the admin academic **section → Teachers** tab, the full teaching-staff editor (`AcademicSectionStaffEditor`: lead select, portal assistants pickers + student search, external names) is always visible under the assigned chips and feels noisy / hard to scan. Move those **edit flows behind clear CTAs + modals**, so the default view is the **assigned summary** and changing lead / assistants / externals is an intentional action — same presentation pattern as **Students → Enroll student** (`2026-07-23-section-students-enroll-modal-design.md`).

## Understanding

- Today `AcademicSectionPageShellBody` always renders `AcademicSectionStaffAssignedChips` then the full `AcademicSectionStaffEditor` (three always-on blocks with independent save actions).
- Mutation logic already lives in `updateAcademicSectionTeacherAction`, `replaceAcademicSectionAssistantsAction`, `replaceAcademicSectionExternalAssistantsAction`; presentation-only change.
- The assistants block is the noisiest (staff select + student combobox + list + save); lead and external are shorter but still crowd the tab when unused.
- Pattern: `Modal` atom, Lucide leading icons on buttons, dictionary copy (`09`), ≤250 LOC per file (`03`).

## Assumptions

1. **Default surface:** chips (“Assigned now”) stay on the tab; empty copy updates so it does not say “use the form below”.
2. **Three CTAs** next to / under the chips (not one mega-form on-page):
   - **Change lead teacher** → modal with current `AcademicSectionStaffEditorLeadBlock` (+ save).
   - **Manage assistants** → modal with current `AcademicSectionStaffEditorAssistantsBlock` (+ save).
   - **Manage external assistants** → modal with current `AcademicSectionStaffEditorExternalBlock` (+ save).
3. Separate modals keep today’s **independent dirty/save** semantics and avoid a long stacked form in one dialog.
4. **No server/API contract change** — same actions; UI + i18n + tests only.
5. While a save transition is pending, disable modal dismiss (same spirit as enroll modal / busy).
6. After successful save → existing `router.refresh()`; modal may stay open so the admin can continue edits, or close on success — **prefer close on successful save** for lead/external (single-field flows); **prefer stay open** for assistants until the admin dismisses (multi-add workflow), matching enroll “keep open while queue has work”.

## Proposed UX

1. Teachers tab shows **Assigned chips** + a compact **actions row** (three buttons with Lucide icons: e.g. `UserCog` / `UserPlus` / `UserRoundPlus` or similar).
2. Click CTA → `Modal` with section title from dict; body = existing block content (extracted/reused, not duplicated business logic).
3. `AcademicSectionStaffEditor` becomes a thin orchestrator of state + three modal triggers (or splits into `AcademicSectionStaffPanel` + modal wrappers) — no always-visible form fields on the tab.
4. Update `staffAssignedChips.empty` (and any lead under chips) so empty state points at the CTAs, not “the form below”.

## Plan (implementation outline)

| Step | Layer |
|------|--------|
| 1 | Refactor staff UI: chips + CTA row; wrap Lead / Assistants / External blocks in `Modal`s (reuse blocks; extract trigger organism if needed). Keep ≤250 LOC / file. |
| 2 | Dictionary keys `en` / `es` / `pt`: CTA labels, modal titles/aria, empty-state copy tweak. |
| 3 | Vitest RTL: each CTA opens its dialog; block controls visible inside; busy disables close where applicable. |
| 4 | Confirm admin tour anchors: only `sectionDetailTabTeachers` today — no L1/L2 change unless we add `data-tour` on CTAs. |
| 5 | Manual QA (user): assign lead, add portal + student assistant, add external via modals; chips refresh. |

## Risks & mitigation

| Risk | Mitigation |
|------|------------|
| File size when wiring three modals + state | Keep state in `AcademicSectionStaffEditor`; extract `AcademicSectionStaffActions` / per-modal shells. |
| Nested combobox focus inside `Modal` | Reuse existing `Modal` focus trap; smoke-test student search inside assistants modal. |
| i18n drift | Add keys in all three locales in the same change. |
| Tour / DOM presence | No required staff-editor anchors today; recheck `tourAnchorDomPresence` if shell fixture changes. |

## Done when

- [x] Teachers tab no longer shows always-on lead / assistants / external forms.
- [x] Clear CTAs open modals with the same edit + save behavior as today.
- [x] Chips still summarize lead / assistants / externals after refresh.
- [x] en / es / pt dictionaries updated; no hardcoded UI strings.
- [x] Self-contained Vitest coverage for open/close + modal content smoke.
- [ ] Manual QA (user): edit each staff type via modal → chips update.

## Out of scope

- Changing eligibility rules, schedule-overlap checks, or staff server actions.
- Merging the three save actions into one “Save all”.
- Teacher portal staff UI.
- New Driver.js tour for these CTAs (unless an existing matrix row requires anchors).

## Alternatives considered

| Option | Why not (default) |
|--------|-------------------|
| One “Edit teaching staff” modal with all three blocks | Still a long dialog; independent saves feel odd in one surface. Acceptable fallback if product prefers fewer buttons. |
| Only assistants behind modal; lead/external inline | Leaves half the clutter; user asked for the noisy “add assistants” pattern applied to info that should not stay on-tab. |

## Open question (pick one)

**A (recommended):** three CTAs → three modals.  
**B:** one CTA → one modal containing all three blocks (current editor body).
