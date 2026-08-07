# Section students tab — enroll behind modal

**Date:** 2026-07-23  
**Status:** Approved — implemented

## Intent

On the admin academic **section → Students** tab, the enroll UI (`AcademicSectionEnrollCard`: search queue, capacity override, Preview / Enroll) is always visible above the roster and feels noisy / hard to scan. Move that flow **behind a clear primary CTA** that opens a **modal** with the same enrollment capabilities, so the roster is the default focus and “add a student” is an intentional action.

## Understanding

- Today `AcademicSectionPageShellBody` always renders `AcademicSectionEnrollCard` then `AcademicSectionRosterTable` in the `students` tab.
- Enrollment logic already lives in `useSectionEnrollmentQueue` + conflict modal; we keep that behavior, only change presentation.
- Pattern should match existing admin modals (`Modal` atom, Lucide leading icons on buttons, dictionary copy).

## Assumptions

1. **CTA placement:** primary button in the roster header row (next to “Section roster” title), e.g. “Enroll student” with `UserPlus` — not a second card above the table.
2. **One modal** holds search queue + capacity override + Preview / Enroll; nested schedule-conflict modal continues to stack as today.
3. **No server/API contract change** — same actions and hook; UI-only + i18n + tests.
4. Closing the modal while busy (enroll/preview pending) should not discard mid-flight work awkwardly: disable dismiss while `busy` (same spirit as conflict modal / long jobs).

## Proposed UX

1. Students tab shows **only the roster** (toolbar + table) by default.
2. Header actions: **Enroll student** button (primary, leading `UserPlus`).
3. Click → `Modal` titled with existing / new dict key (e.g. `enrollTitle`), body = current enroll form content.
4. After successful enroll → `router.refresh()` (already in hook); modal may stay open for bulk queue work, or close when queue empties after success — prefer **keep open while queue has remaining picks; close when queue is empty after a successful enroll-all** for a clean single-student happy path.
5. Empty roster: same CTA remains visible (no dead end).

## Plan (implementation outline)

| Step | Layer |
|------|--------|
| 1 | Refactor `AcademicSectionEnrollCard` into trigger + modal body (or thin `AcademicSectionEnrollModal` organism + button in roster header). Keep ≤250 LOC / file. |
| 2 | Wire CTA into `AcademicSectionRosterTable` header (or shell `students` fragment) so layout reads as one composition. |
| 3 | Dictionary keys `en.json` / `es.json` / `pt.json`: open button label, modal close if needed, optional short lead under title. |
| 4 | Vitest RTL: button opens modal; search/enroll controls visible inside dialog; busy disables close. |
| 5 | No admin tour anchors today on enroll card — confirm L1/L2 unchanged; update only if we add `data-tour`. |

## Risks & mitigation

| Risk | Mitigation |
|------|------------|
| Nested conflict modal + enroll modal stacking | Keep existing `ScheduleConflictResolutionModal`; use Modal z-stack patterns already in repo. |
| File size after modal wrapper | Split trigger vs form body if approaching 250 lines. |
| i18n drift | Add keys in all three locales in the same change. |

## Done when

- [x] Students tab no longer shows the always-on enroll card above the roster.
- [x] Clear **Enroll student** (or locale equivalent) button opens a modal with the full enroll flow.
- [x] Preview / enroll / capacity override / conflict resolution still work.
- [x] en / es / pt dictionaries updated; no hardcoded UI strings.
- [x] Self-contained Vitest coverage for open/close + modal content smoke.
- [ ] Manual QA (user): open Students tab → enroll one student via modal → roster refreshes.

## Out of scope

- Changing enrollment business rules, capacity RPC, or bulk APIs.
- Teacher portal roster.
- Redesign of move-to-section / drop flows inside the roster table.
- New admin Driver.js tour for this control (unless already required by an existing matrix row).
