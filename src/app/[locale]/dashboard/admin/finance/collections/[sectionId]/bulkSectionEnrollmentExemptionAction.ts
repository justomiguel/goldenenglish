"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { sendEnrollmentExemptionEmail } from "@/lib/email/billingBenefitEmails";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { revalidateStudentBillingPaths } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/revalidateStudentBilling";
import type { Locale } from "@/types/i18n";

const inputSchema = z.object({
  locale: z.string(),
  sectionId: z.string().uuid(),
  studentIds: z.array(z.string().uuid()).min(1).max(200),
  exempt: z.boolean(),
  reason: z.string().max(2000).optional(),
});

export interface BulkSectionEnrollmentExemptionResult {
  ok: boolean;
  updatedCount?: number;
  message?: string;
}

export async function bulkSectionEnrollmentExemptionAction(
  raw: z.infer<typeof inputSchema>,
): Promise<BulkSectionEnrollmentExemptionResult> {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Invalid input" };
  }

  const { locale, sectionId, studentIds, exempt, reason } = parsed.data;
  const dict = await getDictionary(locale);
  const b = dict.actionErrors.billingStudent;
  const tabs = dict.admin.finance.collections.sectionTabs;

  try {
    const { supabase, user } = await assertAdmin();
    const now = new Date().toISOString();
    const reasonTrim = reason?.trim() || null;

    const { data: memberships, error: memErr } = await supabase
      .from("section_enrollments")
      .select("student_id")
      .eq("section_id", sectionId)
      .eq("status", "active")
      .in("student_id", studentIds);

    if (memErr) {
      logSupabaseClientError("bulkSectionEnrollmentExemption:list", memErr, { sectionId });
      return { ok: false, message: tabs.enrollmentBulkError };
    }

    const allowedIds = [...new Set((memberships ?? []).map((r) => r.student_id as string))];
    if (allowedIds.length === 0) {
      return { ok: false, message: b.invalidData };
    }

    const updatePayload = {
      enrollment_fee_exempt: exempt,
      enrollment_exempt_authorized_by: exempt ? user.id : null,
      enrollment_exempt_at: exempt ? now : null,
      enrollment_exempt_reason: exempt ? reasonTrim : null,
    };

    const { error: upErr } = await supabase
      .from("section_enrollments")
      .update(updatePayload)
      .eq("section_id", sectionId)
      .eq("status", "active")
      .in("student_id", allowedIds);

    if (upErr) {
      logSupabaseClientError("bulkSectionEnrollmentExemption:update", upErr, { sectionId });
      return { ok: false, message: tabs.enrollmentBulkError };
    }

    void recordSystemAudit({
      action: exempt ? "bulk_section_enrollment_fee_exempt" : "bulk_section_enrollment_fee_exempt_revoked",
      resourceType: "academic_section",
      resourceId: sectionId,
      payload: {
        actorId: user.id,
        studentIds: allowedIds,
        exempt,
        reason: reasonTrim,
      },
    });

    if (exempt) {
      for (const sid of allowedIds) {
        try {
          await sendEnrollmentExemptionEmail({
            studentId: sid,
            locale: locale as Locale,
            reason: reasonTrim,
          });
        } catch (emailErr) {
          logServerException("bulkSectionEnrollmentExemption:email", emailErr, { studentId: sid });
        }
      }
    }

    for (const sid of allowedIds) {
      revalidateStudentBillingPaths(locale, sid);
    }

    revalidatePath(`/${locale}/dashboard/admin/finance/collections/${sectionId}`, "page");

    return {
      ok: true,
      updatedCount: allowedIds.length,
      message: tabs.enrollmentBulkDone.replace("{count}", String(allowedIds.length)),
    };
  } catch (err) {
    logServerException("bulkSectionEnrollmentExemptionAction", err);
    return { ok: false, message: tabs.enrollmentBulkError };
  }
}
