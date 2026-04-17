"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { buildSectionEnrollmentPreview } from "@/lib/academics/buildSectionEnrollmentPreview";
import { commitSectionEnrollmentRpc } from "@/lib/academics/commitSectionEnrollmentRpc";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import { logServerException } from "@/lib/logging/serverActionLog";
import { cancelReminderJobsForEnrollmentId } from "@/lib/notifications/cancelReminderJobsAdmin";

const uuid = z.string().uuid();

export async function rolloverEnrollStudentsAction(input: {
  locale: string;
  sourceSectionId: string;
  targetSectionId: string;
  studentIds: string[];
  allowCapacityOverride?: boolean;
}): Promise<{ ok: true; enrolled: number } | { ok: false; code: string; enrolled: number }> {
  try {
    const { supabase, user } = await assertAdmin();
    const src = uuid.safeParse(input.sourceSectionId);
    const sec = uuid.safeParse(input.targetSectionId);
    if (!src.success || !sec.success || input.studentIds.length === 0) {
      return { ok: false, code: "PARSE", enrolled: 0 };
    }

    let enrolled = 0;
    for (const raw of input.studentIds) {
      const st = uuid.safeParse(raw);
      if (!st.success) continue;

      const { data: dropRow } = await supabase
        .from("section_enrollments")
        .select("id")
        .eq("student_id", st.data)
        .eq("section_id", src.data)
        .eq("status", "active")
        .maybeSingle();

      if (!dropRow?.id) continue;

      const preview = await buildSectionEnrollmentPreview(supabase, {
        studentId: st.data,
        sectionId: sec.data,
        ignoreEnrollmentId: dropRow.id,
        ignoreCapacity: Boolean(input.allowCapacityOverride),
      });
      if (!preview.ok && preview.code === "ALREADY_ACTIVE") continue;
      if (!preview.ok && preview.code === "CAPACITY_EXCEEDED" && !input.allowCapacityOverride) {
        return { ok: false, code: "CAPACITY_EXCEEDED", enrolled };
      }
      if (!preview.ok && preview.code !== "CAPACITY_EXCEEDED") {
        return { ok: false, code: preview.code, enrolled };
      }

      const r = await commitSectionEnrollmentRpc(supabase, {
        studentId: st.data,
        sectionId: sec.data,
        dropId: dropRow.id,
        dropNext: "transferred",
        allowCapacityOverride: Boolean(input.allowCapacityOverride),
      });
      if (!r.ok) return { ok: false, code: r.code, enrolled };
      await cancelReminderJobsForEnrollmentId(dropRow.id, "rolloverEnrollStudentsAction");
      enrolled += 1;

      void recordSystemAudit({
        action: "academic_rollover_student_enrolled",
        resourceType: "section_enrollment",
        resourceId: r.enrollmentId,
        payload: {
          actorAdminId: user.id,
          studentId: st.data,
          sourceSectionId: src.data,
          targetSectionId: sec.data,
          financeFollowup: "regenerate_installments_if_applicable",
        },
      });
    }

    revalidateAcademicSurfaces(input.locale);
    return { ok: true, enrolled };
  } catch (err) {
    logServerException("rolloverEnrollStudentsAction", err);
    return { ok: false, code: "UNAUTHORIZED", enrolled: 0 };
  }
}
