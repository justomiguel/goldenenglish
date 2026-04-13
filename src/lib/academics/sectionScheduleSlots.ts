import { z } from "zod";
import type { SectionScheduleSlot } from "@/types/academics";

export const sectionScheduleSlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export const sectionScheduleSlotsSchema = z.array(sectionScheduleSlotSchema);

export function parseSectionScheduleSlots(raw: unknown): SectionScheduleSlot[] {
  const parsed = sectionScheduleSlotsSchema.safeParse(raw);
  if (!parsed.success) return [];
  return parsed.data;
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map((x) => Number(x));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return -1;
  return h * 60 + m;
}
