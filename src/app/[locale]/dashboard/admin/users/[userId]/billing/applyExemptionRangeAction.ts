"use server";

import { z } from "zod";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { setPeriodExemption } from "./periodExemptionActions";

const ym = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});

export async function applyExemptionRange(raw: {
  locale: string;
  studentId: string;
  sectionId?: string;
  fromYear: number;
  fromMonth: number;
  toYear: number;
  toMonth: number;
  adminNote?: string;
}): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(raw.locale);
  const b = dict.actionErrors.billingStudent;

  const sid = z.string().uuid().safeParse(raw.studentId);
  if (!sid.success) return { ok: false, message: b.invalidStudent };
  const sectionId = raw.sectionId ? z.string().uuid().safeParse(raw.sectionId) : null;
  if (sectionId && !sectionId.success) return { ok: false, message: b.invalidData };

  const from = ym.safeParse({ year: raw.fromYear, month: raw.fromMonth });
  const to = ym.safeParse({ year: raw.toYear, month: raw.toMonth });
  if (!from.success || !to.success) return { ok: false, message: b.invalidRange };

  let y = from.data.year;
  let m = from.data.month;
  const endIdx = to.data.year * 12 + to.data.month;
  let curIdx = y * 12 + m;
  if (endIdx < curIdx) return { ok: false, message: b.invalidRangeOrder };

  while (curIdx <= endIdx) {
    const r = await setPeriodExemption({
      locale: raw.locale,
      studentId: sid.data,
      sectionId: sectionId?.data,
      year: y,
      month: m,
      exempt: true,
      adminNote: raw.adminNote,
    });
    if (!r.ok) return r;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    curIdx = y * 12 + m;
  }

  return { ok: true };
}
