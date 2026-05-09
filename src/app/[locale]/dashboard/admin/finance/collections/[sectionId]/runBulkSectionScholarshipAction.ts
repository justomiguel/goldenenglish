"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

type BulkScholarshipScope = "all" | "selected" | "pending";

export interface BulkSectionScholarshipInput {
  locale: string;
  sectionId: string;
  year: number;
  discountPercent: number;
  scope: BulkScholarshipScope;
  selectedStudentIds?: string[];
  fromMonth: number;
  toMonth: number;
  note?: string;
}

export interface BulkSectionScholarshipResult {
  ok: boolean;
  successCount: number;
  failedCount: number;
  message?: string;
}

const inputSchema = z.object({
  locale: z.string(),
  sectionId: z.string().uuid(),
  year: z.number().int().min(2000).max(2100),
  discountPercent: z.number().min(1).max(100),
  scope: z.enum(["all", "selected", "pending"]),
  selectedStudentIds: z.array(z.string().uuid()).optional(),
  fromMonth: z.number().int().min(1).max(12),
  toMonth: z.number().int().min(1).max(12),
  note: z.string().max(2000).optional(),
});

export async function runBulkSectionScholarshipAction(
  input: BulkSectionScholarshipInput,
): Promise<BulkSectionScholarshipResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, successCount: 0, failedCount: 0, message: "Invalid input" };
  }

  const { sectionId, year, discountPercent, scope, selectedStudentIds, fromMonth, toMonth, note } =
    parsed.data;

  if (fromMonth > toMonth) {
    return { ok: false, successCount: 0, failedCount: 0, message: "Invalid month range" };
  }

  const dict = await getDictionary(parsed.data.locale);
  const d = dict.admin.finance.collections.bulkScholarship;

  try {
    const { supabase: admin, user } = await assertAdmin();

    const { data: enrollments, error: enrollErr } = await admin
      .from("section_enrollments")
      .select("id, student_id")
      .eq("section_id", sectionId)
      .eq("status", "active");

    if (enrollErr || !enrollments) {
      logSupabaseClientError("runBulkSectionScholarship:loadEnrollments", enrollErr, { sectionId });
      return { ok: false, successCount: 0, failedCount: 0, message: d.resultError };
    }

    let targetEnrollments = enrollments;

    if (scope === "selected" && selectedStudentIds && selectedStudentIds.length > 0) {
      const selectedSet = new Set(selectedStudentIds);
      targetEnrollments = enrollments.filter((e) => selectedSet.has(e.student_id));
    } else if (scope === "pending") {
      const { data: balances } = await admin
        .from("student_billing_balances")
        .select("student_id, pending_amount")
        .eq("section_id", sectionId)
        .eq("year", year);

      const studentsWithPending = new Set(
        (balances ?? []).filter((b) => (b.pending_amount ?? 0) > 0).map((b) => b.student_id),
      );
      targetEnrollments = enrollments.filter((e) => studentsWithPending.has(e.student_id));
    }

    if (targetEnrollments.length === 0) {
      return { ok: true, successCount: 0, failedCount: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    for (const enrollment of targetEnrollments) {
      const { error: insertErr } = await admin.from("section_enrollment_scholarships").insert({
        enrollment_id: enrollment.id,
        student_id: enrollment.student_id,
        section_id: sectionId,
        discount_percent: discountPercent,
        note: note?.trim() || null,
        valid_from_year: year,
        valid_from_month: fromMonth,
        valid_until_year: year,
        valid_until_month: toMonth,
        is_active: true,
        created_by: user.id,
      });

      if (insertErr) {
        logSupabaseClientError("runBulkSectionScholarship:insert", insertErr, {
          studentId: enrollment.student_id,
          sectionId,
        });
        failedCount += 1;
      } else {
        successCount += 1;
      }
    }

    void recordSystemAudit({
      action: "bulk_section_scholarship_applied",
      resourceType: "academic_section",
      resourceId: sectionId,
      payload: {
        actorId: user.id,
        discountPercent,
        scope,
        fromMonth,
        toMonth,
        year,
        successCount,
        failedCount,
      },
    });

    revalidatePath(`/${parsed.data.locale}/dashboard/admin/finance/collections/${sectionId}`, "page");

    const allOk = failedCount === 0 && successCount > 0;
    return {
      ok: allOk,
      successCount,
      failedCount,
      message: allOk ? undefined : failedCount > 0 ? d.resultPartial : undefined,
    };
  } catch (err) {
    logServerException("runBulkSectionScholarshipAction", err);
    return { ok: false, successCount: 0, failedCount: 0, message: d.resultError };
  }
}
