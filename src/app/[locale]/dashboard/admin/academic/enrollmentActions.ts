"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { buildSectionEnrollmentPreview } from "@/lib/academics/buildSectionEnrollmentPreview";
import { commitSectionEnrollmentRpc } from "@/lib/academics/commitSectionEnrollmentRpc";
import type { PreviewSectionEnrollmentResult } from "@/types/academics";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import { logServerException } from "@/lib/logging/serverActionLog";
import { cancelReminderJobsForEnrollmentId } from "@/lib/notifications/cancelReminderJobsAdmin";

const uuid = z.string().uuid();

export async function previewSectionEnrollmentAction(input: {
  studentId: string;
  sectionId: string;
  ignoreEnrollmentId?: string | null;
  allowCapacityOverride?: boolean;
}): Promise<PreviewSectionEnrollmentResult> {
  try {
    const { supabase } = await assertAdmin();
    const sid = uuid.safeParse(input.studentId);
    const sec = uuid.safeParse(input.sectionId);
    if (!sid.success || !sec.success) return { ok: false, code: "PARSE" };
    return await buildSectionEnrollmentPreview(supabase, {
      studentId: sid.data,
      sectionId: sec.data,
      ignoreEnrollmentId: input.ignoreEnrollmentId ?? null,
      ignoreCapacity: Boolean(input.allowCapacityOverride),
    });
  } catch (err) {
    logServerException("previewSectionEnrollmentAction", err);
    return { ok: false, code: "PARSE" };
  }
}

export async function enrollStudentInSectionAction(input: {
  locale: string;
  studentId: string;
  sectionId: string;
  dropSectionEnrollmentId?: string | null;
  dropNextStatus?: "dropped" | "transferred";
  allowCapacityOverride?: boolean;
}): Promise<{ ok: true; enrollmentId: string } | { ok: false; code: string }> {
  try {
    const { supabase } = await assertAdmin();
    const studentId = uuid.safeParse(input.studentId);
    const sectionId = uuid.safeParse(input.sectionId);
    if (!studentId.success || !sectionId.success) return { ok: false, code: "PARSE" };

    const dropId =
      input.dropSectionEnrollmentId && uuid.safeParse(input.dropSectionEnrollmentId).success
        ? input.dropSectionEnrollmentId
        : null;

    const preview = await buildSectionEnrollmentPreview(supabase, {
      studentId: studentId.data,
      sectionId: sectionId.data,
      ignoreEnrollmentId: dropId,
      ignoreCapacity: Boolean(input.allowCapacityOverride),
    });

    if (!preview.ok) {
      if (preview.code === "SCHEDULE_OVERLAP" && !dropId) return { ok: false, code: "SCHEDULE_OVERLAP" };
      if (preview.code === "CAPACITY_EXCEEDED" && !input.allowCapacityOverride) {
        return { ok: false, code: "CAPACITY_EXCEEDED" };
      }
      if (preview.code === "ALREADY_ACTIVE" || preview.code === "PARSE") {
        return { ok: false, code: preview.code };
      }
      if (preview.code === "SCHEDULE_OVERLAP") return { ok: false, code: "SCHEDULE_OVERLAP" };
    }

    const r = await commitSectionEnrollmentRpc(supabase, {
      studentId: studentId.data,
      sectionId: sectionId.data,
      dropId,
      dropNext: input.dropNextStatus ?? "dropped",
      allowCapacityOverride: Boolean(input.allowCapacityOverride),
    });
    if (!r.ok) return r;

    if (dropId) {
      await cancelReminderJobsForEnrollmentId(dropId, "enrollStudentInSectionAction");
    }

    void recordSystemAudit({
      action: "academic_section_enroll_commit",
      resourceType: "section_enrollment",
      resourceId: r.enrollmentId,
      payload: {
        studentId: studentId.data,
        sectionId: sectionId.data,
        dropSectionEnrollmentId: dropId,
        dropNextStatus: input.dropNextStatus ?? "dropped",
        allowCapacityOverride: Boolean(input.allowCapacityOverride),
      },
    });

    revalidateAcademicSurfaces(input.locale);
    revalidatePath(`/${input.locale}/dashboard/admin`, "page");
    return { ok: true, enrollmentId: r.enrollmentId };
  } catch (err) {
    logServerException("enrollStudentInSectionAction", err);
    return { ok: false, code: "UNAUTHORIZED" };
  }
}

export async function adminDirectSectionMoveAction(input: {
  locale: string;
  studentId: string;
  fromSectionId: string;
  toSectionId: string;
  allowCapacityOverride?: boolean;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  try {
    const { supabase } = await assertAdmin();
    const sid = uuid.safeParse(input.studentId);
    const from = uuid.safeParse(input.fromSectionId);
    const to = uuid.safeParse(input.toSectionId);
    if (!sid.success || !from.success || !to.success) return { ok: false, code: "PARSE" };

    const { data: enr } = await supabase
      .from("section_enrollments")
      .select("id")
      .eq("section_id", from.data)
      .eq("student_id", sid.data)
      .eq("status", "active")
      .maybeSingle();

    if (!enr?.id) return { ok: false, code: "PARSE" };

    const preview = await buildSectionEnrollmentPreview(supabase, {
      studentId: sid.data,
      sectionId: to.data,
      ignoreEnrollmentId: enr.id,
      ignoreCapacity: Boolean(input.allowCapacityOverride),
    });
    if (!preview.ok) {
      if (preview.code === "CAPACITY_EXCEEDED" && !input.allowCapacityOverride) {
        return { ok: false, code: "CAPACITY_EXCEEDED" };
      }
      if (preview.code !== "CAPACITY_EXCEEDED") {
        return { ok: false, code: preview.code };
      }
    }

    const r = await commitSectionEnrollmentRpc(supabase, {
      studentId: sid.data,
      sectionId: to.data,
      dropId: enr.id,
      dropNext: "transferred",
      allowCapacityOverride: Boolean(input.allowCapacityOverride),
    });
    if (!r.ok) return r;

    await cancelReminderJobsForEnrollmentId(enr.id, "adminDirectSectionMoveAction");

    void recordSystemAudit({
      action: "academic_admin_direct_move",
      resourceType: "section_enrollment",
      resourceId: r.enrollmentId,
      payload: {
        studentId: sid.data,
        fromSectionId: from.data,
        toSectionId: to.data,
      },
    });

    revalidateAcademicSurfaces(input.locale);
    return { ok: true };
  } catch (err) {
    logServerException("adminDirectSectionMoveAction", err);
    return { ok: false, code: "UNAUTHORIZED" };
  }
}

