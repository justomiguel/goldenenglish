import type { SectionScheduleSlot } from "@/types/academics";
import { normalizeSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";

export type SectionScheduleSlotDraft = {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

export function createEmptySectionScheduleSlotDraft(): SectionScheduleSlotDraft {
  return {
    dayOfWeek: "",
    startTime: "",
    endTime: "",
  };
}

export function sectionScheduleSlotsToDrafts(
  slots: SectionScheduleSlot[],
): SectionScheduleSlotDraft[] {
  return slots.map((slot) => ({
    dayOfWeek: String(slot.dayOfWeek),
    startTime: slot.startTime,
    endTime: slot.endTime,
  }));
}

export function sectionScheduleDraftsToSlots(
  drafts: SectionScheduleSlotDraft[],
): SectionScheduleSlot[] | null {
  return normalizeSectionScheduleSlots(
    drafts.map((draft) => ({
      dayOfWeek: Number(draft.dayOfWeek),
      startTime: draft.startTime.trim(),
      endTime: draft.endTime.trim(),
    })),
  );
}
