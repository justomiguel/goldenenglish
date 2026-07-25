# Section Configuration Week Schedule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild admin section Configuration as a unified settings summary plus a Mon–Sun week grid editor with drag/resize/create and explicit Save schedule, without changing the `SectionScheduleSlot` persistence contract.

**Architecture:** Pure helpers under `src/lib/academics/` own snap, default duration, and same-day self-overlap. A new client organism `AcademicSectionWeekScheduleEditor` holds draft slots + grid/inspector UI and calls existing `updateAcademicSectionScheduleAction`. `AcademicSectionConfigurationPanel` composes a new `AcademicSectionSettingsSummary` (regrouped existing editors) above the week editor. `SectionScheduleFields` stays for the new-section modal.

**Tech Stack:** Next.js App Router, React client components, Vitest + Testing Library, `@dnd-kit` (or pointer handlers if lighter), dictionaries en/es/pt, existing section schedule server action.

**Spec:** `docs/superpowers/specs/2026-07-24-section-configuration-week-schedule-design.md`

## Global Constraints

- File size ≤250 LOC (`03-architecture.mdc`); one main export per file.
- User-visible copy only via `src/dictionaries/en.json` + `es.json` + `pt.json` (`09`).
- Buttons: Lucide leading icons (`16`); no `alert`/`confirm` (`18`).
- After successful schedule save: action already revalidates; client must `router.refresh()` (`27`).
- TDD + self-contained tests (`02`, `30`); no Supabase clients outside `src/lib/supabase/`.
- Commits only when the user explicitly asks (repo foundation rule); skip “Commit” steps otherwise.
- Tier B admin: desktop-first; keyboard/inspector required for a11y (`26`).
- Data: `dayOfWeek` 0=Sunday … 6=Saturday; UI columns Mon→Sun.

## File map

| Path | Role |
|------|------|
| `src/lib/academics/sectionScheduleTimeSnap.ts` | `snapMinutesToStep`, `minutesToTime`, reuse `timeToMinutes` |
| `src/lib/academics/sectionScheduleDefaultDuration.ts` | Mode duration or 60 |
| `src/lib/academics/sectionScheduleSelfOverlap.ts` | Same-day overlap within one slot list (excluding self index) |
| `src/lib/academics/sectionScheduleWeekColumns.ts` | UI column order Mon→Sun → `dayOfWeek` |
| `src/hooks/useSectionWeekScheduleDraft.ts` | Draft state, dirty, create/move/resize/delete, save orchestration |
| `src/components/organisms/AcademicSectionWeekScheduleGrid.tsx` | Visual grid + pointer DnD |
| `src/components/organisms/AcademicSectionWeekScheduleBlockInspector.tsx` | Selected block form |
| `src/components/organisms/AcademicSectionWeekScheduleEditor.tsx` | Compose grid + inspector + save |
| `src/components/organisms/AcademicSectionSettingsSummary.tsx` | Zone A layout |
| `src/components/organisms/AcademicSectionConfigurationPanel.tsx` | Wire Zone A + B |
| Existing `AcademicSection*Editor.tsx` | Optional `variant="embedded"` to drop outer card chrome |
| `AcademicSectionScheduleEditor.tsx` | Delete or thin-reexport → week editor (prefer replace usages and keep file as re-export for one release if tests import it) |
| Dictionaries `en`/`es`/`pt` under `dashboard.academicSectionPage` | New keys |
| Tests under `src/__tests__/lib/academics/` and `src/__tests__/components/` | Pure + RTL |

---

### Task 1: Pure schedule helpers (TDD)

**Files:**
- Create: `src/lib/academics/sectionScheduleTimeSnap.ts`
- Create: `src/lib/academics/sectionScheduleDefaultDuration.ts`
- Create: `src/lib/academics/sectionScheduleSelfOverlap.ts`
- Create: `src/lib/academics/sectionScheduleWeekColumns.ts`
- Test: `src/__tests__/lib/academics/sectionScheduleWeekGridHelpers.test.ts`

**Interfaces:**
- Produces:
  - `snapMinutesToStep(minutes: number, stepMinutes?: number): number` — default step `15`
  - `minutesToHhMm(minutes: number): string` — `"HH:MM"`
  - `defaultSectionScheduleDurationMinutes(slots: { startTime: string; endTime: string }[]): number`
  - `sectionScheduleSlotSelfOverlaps(slots: SectionScheduleSlot[], candidate: SectionScheduleSlot, ignoreIndex?: number): boolean`
  - `SECTION_WEEK_UI_DAY_ORDER: readonly number[]` — `[1,2,3,4,5,6,0]` (Mon…Sun)
  - `sectionWeekUiColumnIndex(dayOfWeek: number): number`

- [ ] **Step 1: Write failing tests**

```ts
// src/__tests__/lib/academics/sectionScheduleWeekGridHelpers.test.ts
import { describe, expect, it } from "vitest";
import { snapMinutesToStep, minutesToHhMm } from "@/lib/academics/sectionScheduleTimeSnap";
import { defaultSectionScheduleDurationMinutes } from "@/lib/academics/sectionScheduleDefaultDuration";
import { sectionScheduleSlotSelfOverlaps } from "@/lib/academics/sectionScheduleSelfOverlap";
import {
  SECTION_WEEK_UI_DAY_ORDER,
  sectionWeekUiColumnIndex,
} from "@/lib/academics/sectionScheduleWeekColumns";

describe("sectionScheduleTimeSnap", () => {
  it("snaps to 15-minute boundaries", () => {
    expect(snapMinutesToStep(67)).toBe(60);
    expect(snapMinutesToStep(68)).toBe(75);
    expect(minutesToHhMm(75)).toBe("01:15");
  });
});

describe("defaultSectionScheduleDurationMinutes", () => {
  it("returns 60 when empty", () => {
    expect(defaultSectionScheduleDurationMinutes([])).toBe(60);
  });
  it("returns the mode of existing durations", () => {
    expect(
      defaultSectionScheduleDurationMinutes([
        { startTime: "09:00", endTime: "10:00" },
        { startTime: "11:00", endTime: "12:00" },
        { startTime: "14:00", endTime: "15:30" },
      ]),
    ).toBe(60);
  });
});

describe("sectionScheduleSlotSelfOverlaps", () => {
  it("detects same-day overlap and ignores self index", () => {
    const slots = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "10:00" },
      { dayOfWeek: 1, startTime: "10:00", endTime: "11:00" },
    ];
    expect(
      sectionScheduleSlotSelfOverlaps(slots, {
        dayOfWeek: 1,
        startTime: "09:30",
        endTime: "10:30",
      }),
    ).toBe(true);
    expect(
      sectionScheduleSlotSelfOverlaps(
        slots,
        { dayOfWeek: 1, startTime: "09:00", endTime: "10:00" },
        0,
      ),
    ).toBe(false);
  });
});

describe("sectionScheduleWeekColumns", () => {
  it("orders Mon→Sun for UI", () => {
    expect(SECTION_WEEK_UI_DAY_ORDER).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(sectionWeekUiColumnIndex(0)).toBe(6);
    expect(sectionWeekUiColumnIndex(1)).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npx vitest run src/__tests__/lib/academics/sectionScheduleWeekGridHelpers.test.ts
```

- [ ] **Step 3: Implement helpers** (each file ≤80 LOC; use `timeToMinutes` from `sectionScheduleSlots.ts`; for mode, pick shortest duration on tie)

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx vitest run src/__tests__/lib/academics/sectionScheduleWeekGridHelpers.test.ts
```

---

### Task 2: Dictionary keys

**Files:**
- Modify: `src/dictionaries/en.json` → `dashboard.academicSectionPage`
- Modify: `src/dictionaries/es.json` (same paths)
- Modify: `src/dictionaries/pt.json` (same paths)
- Modify: existing `scheduleEditor` object — extend, do not remove old keys still used by new-section modal / `SectionScheduleFields`

**Keys to add** (exact paths):

```json
"settingsSummary": {
  "title": "Section settings",
  "lead": "Period, room, capacity, and features for this section."
},
"scheduleEditor": {
  "...existing keys...",
  "unsavedBadge": "Unsaved changes",
  "selectedBlockTitle": "Selected block",
  "editTimes": "Edit times",
  "deleteBlock": "Delete block",
  "overlapError": "This block overlaps another on the same day.",
  "createHint": "Click an empty slot to add a block. Drag to move. Drag the bottom edge to resize.",
  "gridAria": "Weekly class schedule"
}
```

Spanish/Portuguese: natural equivalents; keep key paths identical.

- [ ] **Step 1: Add keys to en, es, pt in the same change**
- [ ] **Step 2: Run** `npx vitest run src/__tests__/i18n/dictionaries.test.ts` — expect PASS (shape parity)

---

### Task 3: Draft hook `useSectionWeekScheduleDraft`

**Files:**
- Create: `src/hooks/useSectionWeekScheduleDraft.ts`
- Test: `src/__tests__/hooks/useSectionWeekScheduleDraft.test.ts`

**Interfaces:**
- Consumes: helpers from Task 1; `sectionScheduleSlotsToDrafts` / `sectionScheduleDraftsToSlots` (or work in `SectionScheduleSlot[]` drafts with string times); `updateAcademicSectionScheduleAction`
- Produces:

```ts
export function useSectionWeekScheduleDraft(args: {
  locale: string;
  sectionId: string;
  initialSlots: SectionScheduleSlot[];
  dict: { scheduleInvalid: string; saveScheduleError: string; overlapError: string };
}): {
  slots: SectionScheduleSlot[];
  dirty: boolean;
  selectedIndex: number | null;
  setSelectedIndex: (i: number | null) => void;
  error: string | null;
  pending: boolean;
  createAt: (dayOfWeek: number, startMinutes: number) => void;
  moveBlock: (index: number, dayOfWeek: number, startMinutes: number) => void;
  resizeBlock: (index: number, endMinutes: number) => void;
  updateBlock: (index: number, patch: Partial<SectionScheduleSlot>) => void;
  removeBlock: (index: number) => void;
  save: () => void;
};
```

- [ ] **Step 1: Failing tests** — `createAt` uses default duration; `moveBlock` rejects overlap (slots unchanged + error); `save` with empty slots does not call action; successful save calls action + `router.refresh()`

Mock `next/navigation` and `updateAcademicSectionScheduleAction` like `AcademicSectionScheduleEditor.test.tsx`.

- [ ] **Step 2: Implement hook** — min duration 15′; snap all times; `dirty` via JSON compare of normalized slots vs initial

- [ ] **Step 3: Vitest PASS** for the hook file alone

---

### Task 4: Week grid + inspector UI

**Files:**
- Create: `src/components/organisms/AcademicSectionWeekScheduleGrid.tsx`
- Create: `src/components/organisms/AcademicSectionWeekScheduleBlockInspector.tsx`
- Create: `src/components/organisms/AcademicSectionWeekScheduleEditor.tsx`
- Test: `src/__tests__/components/AcademicSectionWeekScheduleEditor.test.tsx`
- Modify or re-export: `src/components/organisms/AcademicSectionScheduleEditor.tsx` → re-export week editor **or** update `AcademicSectionConfigurationPanel` only and keep list editor for modal; update `AcademicSectionScheduleEditor.test.tsx` behaviors that still apply (empty save invalid)

**Grid behavior (implement):**
- Columns from `SECTION_WEEK_UI_DAY_ORDER`; header labels from `dict.weekdays` mapped by day index.
- Default visible window 07:00–22:00 (`px` per 15′); if slots outside, expand min/max by ±30′.
- Click empty cell → `createAt`.
- Pointer drag on block → `moveBlock`; bottom-edge handle → `resizeBlock` (mouse/touch). Prefer `@dnd-kit` only if it stays under LOC budget; otherwise pointer events + `setPointerCapture`.
- `role="region"` + `aria-label={dict.gridAria}` (intentional Task 4 — incomplete grid semantics; inspector is the precision editor); blocks are buttons or focusable; selected outline uses tokens.
- Inspector: day select + time inputs + delete; wired to `updateBlock` / `removeBlock`.
- Dirty badge + Save button (Save icon).

- [ ] **Step 1: RTL smoke** — render with one Mon slot; click empty Tue cell → second block appears; Save with valid slots calls action; overlap attempt shows `overlapError`

- [ ] **Step 2: Implement UI files** (split if approaching 250 LOC)

- [ ] **Step 3: Tests PASS**; migrate/adjust `AcademicSectionScheduleEditor.test.tsx` so “cannot save zero slots” still holds against week editor

---

### Task 5: Settings summary layout

**Files:**
- Create: `src/components/organisms/AcademicSectionSettingsSummary.tsx`
- Modify: `src/components/organisms/AcademicSectionConfigurationPanel.tsx`
- Modify (as needed): `AcademicSectionPeriodEditor.tsx`, `AcademicSectionRoomLabelEditor.tsx`, `AcademicSectionCapacityEditor.tsx`, `AcademicSectionMinAttendanceEditor.tsx`, `AcademicSectionFeatureFlagsEditor.tsx` — add optional `embedded?: boolean` (default `false`) to omit outer bordered `<section>` / duplicate title when nested
- Test: `src/__tests__/components/AcademicSectionConfigurationPanel.test.tsx` (or extend an existing shell/config test)

**Layout:**
- Outer surface with `settingsSummary.title` / `lead`
- Three groups: Clase (period + room), Cupo (capacity + min attendance), Funciones (flags)
- Then `<AcademicSectionWeekScheduleEditor … />`

- [ ] **Step 1: Failing RTL** — panel shows settings summary title and schedule grid aria; does not require six top-level “card” headings from old stack if those titles move inside groups

- [ ] **Step 2: Implement composition**

- [ ] **Step 3: PASS**; run related editor tests that still mount standalone editors

---

### Task 6: Tours + regression sweep

**Files:**
- Grep: `scheduleEditor`, `sectionDetail`, `configuration`, `AcademicSectionConfiguration` under `src/lib/admin-tutorials/` and `src/__tests__/lib/admin-tutorials/`
- Update anchors / L2 fixtures only if Configuration schedule anchors exist

- [ ] **Step 1: Grep for tour anchors** — if none for schedule fields, document “no L1/L2 change” in PR notes
- [ ] **Step 2: If anchors exist**, update selectors + `tourAnchorDomPresence` fixture to week grid `data-tour`
- [ ] **Step 3: Run**

```bash
npx vitest run src/__tests__/lib/admin-tutorials/tourCatalogContract.test.ts src/__tests__/lib/admin-tutorials/tourAnchorDomPresence.test.tsx src/__tests__/lib/academics/sectionScheduleWeekGridHelpers.test.ts src/__tests__/hooks/useSectionWeekScheduleDraft.test.ts src/__tests__/components/AcademicSectionWeekScheduleEditor.test.tsx src/__tests__/components/AcademicSectionScheduleEditor.test.tsx
```

Expected: all PASS

---

### Task 7: Manual QA checklist (user-owned)

Do **not** agent-walk the browser unless asked (`32`).

- [ ] Configuration: three settings groups usable; each save still works
- [ ] Click empty → block with 60′ (or mode duration)
- [ ] Drag block to another day; resize edge; snap feels like 15′
- [ ] Overlap blocked with message
- [ ] Unsaved badge; Save; reload shows slots
- [ ] Delete all blocks → cannot save (invalid)
- [ ] New-section modal still uses list schedule fields

---

## Spec coverage check

| Spec requirement | Task |
|------------------|------|
| Summary above + week below | 5 |
| Mon–Sun columns | 1, 4 |
| Click create / drag / resize / snap 15′ / default duration | 1, 3, 4 |
| Explicit Save schedule | 3, 4 |
| Inspector a11y path | 4 |
| Keep separate settings saves | 5 |
| No schema change | all |
| Out of scope new-section modal | 4 keeps `SectionScheduleFields` |
| i18n en/es/pt | 2 |
| Tests pure + RTL | 1, 3, 4, 5 |
| Tours if needed | 6 |
| Manual QA | 7 |
