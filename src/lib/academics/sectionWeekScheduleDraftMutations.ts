import type { SectionScheduleSlot } from "@/types/academics";
import { defaultSectionScheduleDurationMinutes } from "@/lib/academics/sectionScheduleDefaultDuration";
import { sectionScheduleSlotSelfOverlaps } from "@/lib/academics/sectionScheduleSelfOverlap";
import { timeToMinutes } from "@/lib/academics/sectionScheduleSlots";
import { minutesToHhMm, snapMinutesToStep } from "@/lib/academics/sectionScheduleTimeSnap";
import {
  normalizeForCompare,
  resolveNextSelectedIndex,
  resolvePreviousSelectionKey,
  slotKey,
  type SectionWeekScheduleDraftState,
} from "@/lib/academics/sectionWeekScheduleDraftCompare";

export type { SectionWeekScheduleDraftState } from "@/lib/academics/sectionWeekScheduleDraftCompare";
export { normalizeForCompare, slotKey } from "@/lib/academics/sectionWeekScheduleDraftCompare";

const STEP_MINUTES = 15;
const MIN_DURATION_MINUTES = 15;

function clampDurationMinutes(durationMinutes: number): number {
  if (!Number.isFinite(durationMinutes)) return MIN_DURATION_MINUTES;
  return Math.max(
    MIN_DURATION_MINUTES,
    snapMinutesToStep(durationMinutes, STEP_MINUTES),
  );
}

function buildSnappedSlotFromMinutes(args: {
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
}): SectionScheduleSlot {
  const start = snapMinutesToStep(args.startMinutes, STEP_MINUTES);
  let end = snapMinutesToStep(args.endMinutes, STEP_MINUTES);
  if (end - start < MIN_DURATION_MINUTES) {
    end = start + MIN_DURATION_MINUTES;
  }
  return {
    dayOfWeek: args.dayOfWeek,
    startTime: minutesToHhMm(start),
    endTime: minutesToHhMm(end),
  };
}

function removeIndex<T>(items: T[], index: number): T[] {
  return [...items.slice(0, index), ...items.slice(index + 1)];
}

type ApplyMutationArgs = Readonly<{
  state: SectionWeekScheduleDraftState;
  overlapError: string;
  nextSlots: SectionScheduleSlot[];
  /** If true, keep selection on the mutated slot even if its key changes. */
  nextSelectedSlot: SectionScheduleSlot | null;
}>;

function applyMutationResult(args: ApplyMutationArgs): SectionWeekScheduleDraftState {
  if (args.nextSelectedSlot) {
    const selectedIndex = args.nextSlots.findIndex(
      (s) => slotKey(s) === slotKey(args.nextSelectedSlot!),
    );
    return {
      slots: args.nextSlots,
      selectedIndex: selectedIndex >= 0 ? selectedIndex : null,
      error: null,
    };
  }

  const previousKey = resolvePreviousSelectionKey(args.state);
  return {
    slots: args.nextSlots,
    selectedIndex: resolveNextSelectedIndex({
      nextSlots: args.nextSlots,
      previousSelectionKey: previousKey,
    }),
    error: null,
  };
}

export function draftCreateAt(args: Readonly<{
  state: SectionWeekScheduleDraftState;
  dayOfWeek: number;
  startMinutes: number;
  overlapError: string;
}>): SectionWeekScheduleDraftState {
  const duration = clampDurationMinutes(defaultSectionScheduleDurationMinutes(args.state.slots));
  const candidate = buildSnappedSlotFromMinutes({
    dayOfWeek: args.dayOfWeek,
    startMinutes: args.startMinutes,
    endMinutes: args.startMinutes + duration,
  });

  if (sectionScheduleSlotSelfOverlaps(args.state.slots, candidate)) {
    return { ...args.state, error: args.overlapError };
  }

  const nextSlots = normalizeForCompare([...args.state.slots, candidate]);
  return {
    slots: nextSlots,
    selectedIndex: nextSlots.findIndex((s) => slotKey(s) === slotKey(candidate)),
    error: null,
  };
}

export function draftMoveBlock(args: Readonly<{
  state: SectionWeekScheduleDraftState;
  index: number;
  dayOfWeek: number;
  startMinutes: number;
  overlapError: string;
}>): SectionWeekScheduleDraftState {
  const current = args.state.slots[args.index];
  if (!current) return args.state;

  const duration = clampDurationMinutes(
    timeToMinutes(current.endTime) - timeToMinutes(current.startTime),
  );
  const candidate = buildSnappedSlotFromMinutes({
    dayOfWeek: args.dayOfWeek,
    startMinutes: args.startMinutes,
    endMinutes: args.startMinutes + duration,
  });

  if (sectionScheduleSlotSelfOverlaps(args.state.slots, candidate, args.index)) {
    return { ...args.state, error: args.overlapError };
  }

  const nextSlots = normalizeForCompare([
    ...removeIndex(args.state.slots, args.index),
    candidate,
  ]);

  const nextSelectedSlot = args.state.selectedIndex === args.index ? candidate : null;
  return applyMutationResult({
    state: args.state,
    overlapError: args.overlapError,
    nextSlots,
    nextSelectedSlot,
  });
}

export function draftResizeBlock(args: Readonly<{
  state: SectionWeekScheduleDraftState;
  index: number;
  endMinutes: number;
  overlapError: string;
}>): SectionWeekScheduleDraftState {
  const current = args.state.slots[args.index];
  if (!current) return args.state;

  const startMinutes = timeToMinutes(current.startTime);
  if (startMinutes < 0) return args.state;

  const candidate = buildSnappedSlotFromMinutes({
    dayOfWeek: current.dayOfWeek,
    startMinutes,
    endMinutes: args.endMinutes,
  });

  if (sectionScheduleSlotSelfOverlaps(args.state.slots, candidate, args.index)) {
    return { ...args.state, error: args.overlapError };
  }

  const nextRaw = [...args.state.slots];
  nextRaw[args.index] = candidate;
  const nextSlots = normalizeForCompare(nextRaw);

  const nextSelectedSlot = args.state.selectedIndex === args.index ? candidate : null;
  return applyMutationResult({
    state: args.state,
    overlapError: args.overlapError,
    nextSlots,
    nextSelectedSlot,
  });
}

export function draftUpdateBlock(args: Readonly<{
  state: SectionWeekScheduleDraftState;
  index: number;
  patch: Partial<SectionScheduleSlot>;
  overlapError: string;
}>): SectionWeekScheduleDraftState {
  const current = args.state.slots[args.index];
  if (!current) return args.state;

  const dayOfWeek = args.patch.dayOfWeek ?? current.dayOfWeek;
  const startRaw = args.patch.startTime ?? current.startTime;
  const endRaw = args.patch.endTime ?? current.endTime;

  const startMinutes = timeToMinutes(startRaw.trim().slice(0, 5));
  const endMinutes = timeToMinutes(endRaw.trim().slice(0, 5));
  if (startMinutes < 0 || endMinutes < 0) return args.state;

  const candidate = buildSnappedSlotFromMinutes({
    dayOfWeek,
    startMinutes,
    endMinutes,
  });

  if (sectionScheduleSlotSelfOverlaps(args.state.slots, candidate, args.index)) {
    return { ...args.state, error: args.overlapError };
  }

  const nextRaw = [...args.state.slots];
  nextRaw[args.index] = candidate;
  const nextSlots = normalizeForCompare(nextRaw);

  const nextSelectedSlot = args.state.selectedIndex === args.index ? candidate : null;
  return applyMutationResult({
    state: args.state,
    overlapError: args.overlapError,
    nextSlots,
    nextSelectedSlot,
  });
}

export function draftRemoveBlock(args: Readonly<{
  state: SectionWeekScheduleDraftState;
  index: number;
}>): SectionWeekScheduleDraftState {
  const existing = args.state.slots[args.index];
  if (!existing) return args.state;

  const previousKey = resolvePreviousSelectionKey(args.state);
  const nextSlots = removeIndex(args.state.slots, args.index);

  const selectedIndex =
    args.state.selectedIndex === args.index
      ? null
      : resolveNextSelectedIndex({ nextSlots, previousSelectionKey: previousKey });

  return {
    slots: nextSlots,
    selectedIndex,
    error: null,
  };
}
