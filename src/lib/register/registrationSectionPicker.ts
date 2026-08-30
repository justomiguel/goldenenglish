import type { SectionScheduleSlot } from "@/types/academics";
import type { RegisterIntent } from "@/lib/settings/resolveRegisterIntent";
import { parseSectionScheduleSlots, timeToMinutes } from "@/lib/academics/sectionScheduleSlots";
import { snapMinutesToStep } from "@/lib/academics/sectionScheduleTimeSnap";
import { SECTION_WEEK_SCHEDULE_STEP_MINUTES } from "@/lib/academics/sectionScheduleWeekWindow";
import { SECTION_WEEK_UI_DAY_ORDER } from "@/lib/academics/sectionScheduleWeekColumns";
import { sectionScheduleWeekdayKey } from "@/lib/academics/sectionScheduleWeekdayKey";

export type RegistrationSectionPickerOption = {
  id: string;
  label: string;
  hasOpenSeat: boolean;
  offersTrial: boolean;
  slots: SectionScheduleSlot[];
};

export type RegisterPickerCell = {
  sectionId: string;
  label: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  disabled: boolean;
};

const PICKER_WINDOW_PAD_MINUTES = 30;
const PICKER_MIN_WINDOW_MINUTES = 4 * 60;
const COHORT_LABEL_SEP = " — ";

/** Visible calendar title: section name only (RPC labels are `cohort — section`). */
export function registerPickerSectionShortName(label: string): string {
  const i = label.indexOf(COHORT_LABEL_SEP);
  if (i < 0) return label.trim();
  return label.slice(i + COHORT_LABEL_SEP.length).trim() || label.trim();
}

export function formatRegisterPickerSelectionChip(
  cells: RegisterPickerCell[],
  weekdays: {
    sun: string;
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
    sat: string;
  },
): string {
  const first = cells[0];
  if (!first) return "";
  const slots = [...cells].sort((a, b) => {
    const byDay =
      SECTION_WEEK_UI_DAY_ORDER.indexOf(a.dayOfWeek) -
      SECTION_WEEK_UI_DAY_ORDER.indexOf(b.dayOfWeek);
    if (byDay !== 0) return byDay;
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
  const hours = slots.map(
    (cell) =>
      `${weekdays[sectionScheduleWeekdayKey(cell.dayOfWeek)]} ${cell.startTime}–${cell.endTime}`,
  );
  return [registerPickerSectionShortName(first.label), ...hours].join(" · ");
}

export function resolveRegisterPickerWeekWindowMinutes(
  cells: Array<{ startTime: string; endTime: string }>,
): { start: number; end: number } {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const cell of cells) {
    const start = timeToMinutes(cell.startTime);
    const end = timeToMinutes(cell.endTime);
    if (start >= 0) min = Math.min(min, start);
    if (end >= 0) max = Math.max(max, end);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return { start: 8 * 60, end: 12 * 60 };
  }
  min = Math.max(0, snapMinutesToStep(min - PICKER_WINDOW_PAD_MINUTES, SECTION_WEEK_SCHEDULE_STEP_MINUTES));
  max = Math.min(24 * 60, snapMinutesToStep(max + PICKER_WINDOW_PAD_MINUTES, SECTION_WEEK_SCHEDULE_STEP_MINUTES));
  if (max - min < PICKER_MIN_WINDOW_MINUTES) {
    max = Math.min(24 * 60, min + PICKER_MIN_WINDOW_MINUTES);
  }
  return { start: min, end: max };
}

function registerPickerCellKey(cell: RegisterPickerCell): string {
  return `${cell.sectionId}-${cell.dayOfWeek}-${cell.startTime}-${cell.endTime}`;
}

function registerPickerRangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function assignRegisterPickerOverlapColumns(
  cells: RegisterPickerCell[],
): Map<string, { col: number; colCount: number }> {
  const sorted = [...cells].sort((a, b) => {
    const byStart = timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    if (byStart !== 0) return byStart;
    return timeToMinutes(a.endTime) - timeToMinutes(b.endTime);
  });
  const colEnd: number[] = [];
  const colByKey = new Map<string, number>();
  for (const cell of sorted) {
    const start = timeToMinutes(cell.startTime);
    const end = timeToMinutes(cell.endTime);
    let col = colEnd.findIndex((busyUntil) => busyUntil <= start);
    if (col < 0) {
      col = colEnd.length;
      colEnd.push(end);
    } else {
      colEnd[col] = end;
    }
    colByKey.set(registerPickerCellKey(cell), col);
  }

  const out = new Map<string, { col: number; colCount: number }>();
  for (const cell of cells) {
    const key = registerPickerCellKey(cell);
    const start = timeToMinutes(cell.startTime);
    const end = timeToMinutes(cell.endTime);
    const clusterCols = cells
      .filter((other) =>
        registerPickerRangesOverlap(
          start,
          end,
          timeToMinutes(other.startTime),
          timeToMinutes(other.endTime),
        ),
      )
      .map((other) => colByKey.get(registerPickerCellKey(other)) ?? 0);
    out.set(key, {
      col: colByKey.get(key) ?? 0,
      colCount: Math.max(0, ...clusterCols) + 1,
    });
  }
  return out;
}

export function flattenRegisterPickerCells(
  options: RegistrationSectionPickerOption[],
  intent: RegisterIntent,
): RegisterPickerCell[] {
  const visible =
    intent === "trial" ? options.filter((o) => o.offersTrial) : options;
  return visible.flatMap((o) =>
    o.slots.map((slot) => ({
      sectionId: o.id,
      label: o.label,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      disabled: !o.hasOpenSeat,
    })),
  );
}

export function comboOptionsForRegisterPicker(
  options: RegistrationSectionPickerOption[],
  intent: RegisterIntent,
): { id: string; label: string }[] {
  return options
    .filter((o) => o.hasOpenSeat && (intent === "reserve" || o.offersTrial))
    .map((o) => ({ id: o.id, label: o.label }));
}

export function toLegacySectionOptions(
  options: RegistrationSectionPickerOption[],
): { id: string; label: string }[] {
  return options.filter((o) => o.hasOpenSeat).map((o) => ({ id: o.id, label: o.label }));
}

export function normalizeRegisterPickerOptions(
  options: Array<{ id: string; label: string } & Partial<RegistrationSectionPickerOption>>,
): RegistrationSectionPickerOption[] {
  return options.map((o) => ({
    id: o.id,
    label: o.label,
    hasOpenSeat: o.hasOpenSeat ?? true,
    offersTrial: o.offersTrial ?? true,
    slots: o.slots ?? [],
  }));
}

export function mapRegistrationSectionPickerRows(
  rows: unknown[] | null | undefined,
): RegistrationSectionPickerOption[] {
  return (rows ?? []).flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const r = row as {
      id?: unknown;
      label?: unknown;
      schedule_slots?: unknown;
      has_open_seat?: unknown;
      offers_trial?: unknown;
    };
    const id = typeof r.id === "string" ? r.id : "";
    const label = typeof r.label === "string" ? r.label : "";
    if (!id || !label) return [];
    return [
      {
        id,
        label,
        hasOpenSeat: r.has_open_seat !== false,
        offersTrial: r.offers_trial === true,
        slots: parseSectionScheduleSlots(r.schedule_slots),
      },
    ];
  });
}
