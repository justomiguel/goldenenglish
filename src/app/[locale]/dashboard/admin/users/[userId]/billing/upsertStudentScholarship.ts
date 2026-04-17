"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { revalidateStudentBillingPaths } from "./revalidateStudentBilling";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

export async function upsertStudentScholarship(raw: {
  locale: string;
  studentId: string;
  discountPercent: number;
  note?: string;
  validFromYear: number;
  validFromMonth: number;
  validUntilYear: number | null;
  validUntilMonth: number | null;
  isActive: boolean;
}): Promise<{ ok: boolean; message?: string }> {
  const dict = await getDictionary(raw.locale);
  const b = dict.actionErrors.billingStudent;

  const id = z.string().uuid().safeParse(raw.studentId);
  if (!id.success) return { ok: false, message: b.invalidStudent };

  const parsed = z
    .object({
      discountPercent: z.number().min(0).max(100),
      note: z.string().max(2000).optional(),
      validFromYear: z.number().int().min(2000).max(2100),
      validFromMonth: z.number().int().min(1).max(12),
      validUntilYear: z.number().int().min(2000).max(2100).nullable(),
      validUntilMonth: z.number().int().min(1).max(12).nullable(),
      isActive: z.boolean(),
    })
    .safeParse(raw);

  if (!parsed.success) return { ok: false, message: b.invalidData };

  if (
    parsed.data.validUntilYear != null &&
    parsed.data.validUntilMonth != null
  ) {
    const start =
      parsed.data.validFromYear * 12 + parsed.data.validFromMonth;
    const end =
      parsed.data.validUntilYear * 12 + parsed.data.validUntilMonth;
    if (end < start) return { ok: false, message: b.invalidDateRange };
  }

  try {
    const { supabase } = await assertAdmin();
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", id.data)
      .single();
    if (prof?.role !== "student") return { ok: false, message: b.notAStudent };

    const { error } = await supabase.from("student_scholarships").upsert(
      {
        student_id: id.data,
        discount_percent: parsed.data.discountPercent,
        note: parsed.data.note?.trim() || null,
        valid_from_year: parsed.data.validFromYear,
        valid_from_month: parsed.data.validFromMonth,
        valid_until_year: parsed.data.validUntilYear,
        valid_until_month: parsed.data.validUntilMonth,
        is_active: parsed.data.isActive,
      },
      { onConflict: "student_id" },
    );
    if (error) {
      logSupabaseClientError("upsertStudentScholarship", error, { studentId: id.data });
      return { ok: false, message: b.saveFailed };
    }
    revalidateStudentBillingPaths(raw.locale, id.data);
    return { ok: true };
  } catch (err) {
    logServerException("upsertStudentScholarship", err);
    return { ok: false, message: b.forbidden };
  }
}
