import { z } from "zod";
import type { SectionScheduleSlot } from "@/types/academics";

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

function normalizeSlots(slots: SectionScheduleSlot[]): SectionScheduleSlot[] {
  return [...slots].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
}

export const sectionScheduleSlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timePattern),
  endTime: z.string().regex(timePattern),
}).refine((slot) => timeToMinutes(slot.endTime) > timeToMinutes(slot.startTime), {
  message: "end_after_start",
});

export const sectionScheduleSlotsSchema = z.array(sectionScheduleSlotSchema);

function preNormalizeSlotRow(x: unknown): unknown {
  if (!x || typeof x !== "object") return x;
  const o = x as Record<string, unknown>;
  const dw = o.dayOfWeek;
  const dayNum =
    typeof dw === "string" && dw.trim() !== "" ? Number(dw) : typeof dw === "number" ? dw : Number.NaN;
  const trimTime = (t: unknown) => (typeof t === "string" ? t.trim().slice(0, 5) : t);
  return {
    ...o,
    dayOfWeek: Number.isFinite(dayNum) ? dayNum : dw,
    startTime: trimTime(o.startTime),
    endTime: trimTime(o.endTime),
  };
}

export function parseSectionScheduleSlots(raw: unknown): SectionScheduleSlot[] {
  if (!Array.isArray(raw)) return [];
  const out: SectionScheduleSlot[] = [];
  for (const item of raw) {
    const one = sectionScheduleSlotSchema.safeParse(preNormalizeSlotRow(item));
    if (one.success) out.push(one.data);
  }
  return normalizeSlots(out);
}

export function normalizeSectionScheduleSlots(raw: unknown): SectionScheduleSlot[] | null {
  if (!Array.isArray(raw)) return null;
  const slots = parseSectionScheduleSlots(raw);
  if (slots.length === 0 || slots.length !== raw.length) return null;
  return slots;
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map((x) => Number(x));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return -1;
  return h * 60 + m;
}
