"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { getDefaultSectionMaxStudents } from "@/lib/academics/getDefaultSectionMaxStudents";
import { sendTransferApprovedNotifications } from "@/lib/academics/sendTransferApprovedNotifications";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import { logServerException } from "@/lib/logging/serverActionLog";
import { cancelReminderJobsForEnrollmentId } from "@/lib/notifications/cancelReminderJobsAdmin";

export type AcademicTransferNotificationDict = {
  emailSubject: string;
  emailLead: string;
  inAppTitle: string;
  inAppBody: string;
};

export type AcademicTransferApproveCode =
  | "PARSE"
  | "NOT_PENDING"
  | "NOT_ELIGIBLE"
  | "RPC_FAILED"
  | "STALE"
  | "UNAUTHORIZED";

export type ApproveSectionTransferRequestResult =
  | { ok: true }
  | { ok: false; code: AcademicTransferApproveCode };

export type RejectSectionTransferRequestResult =
  | { ok: true }
  | { ok: false; code: "PARSE" | "NOT_PENDING" | "UNAUTHORIZED" };

const uuid = z.string().uuid();
const bulkIdsSchema = z.array(uuid).min(1).max(25);

export async function approveSectionTransferRequestAction(
  input: {
    locale: string;
    requestId: string;
    notificationDict: AcademicTransferNotificationDict;
  },
  opts?: { suppressRevalidate?: boolean },
): Promise<ApproveSectionTransferRequestResult> {
  try {
    const { supabase, user } = await assertAdmin();
    const rid = uuid.safeParse(input.requestId);
    if (!rid.success) return { ok: false, code: "PARSE" };

    const { data: req, error: rErr } = await supabase
      .from("section_transfer_requests")
      .select("id, student_id, from_section_id, to_section_id, status")
      .eq("id", rid.data)
      .maybeSingle();

    if (rErr || !req) return { ok: false, code: "PARSE" };
    if (req.status !== "pending") return { ok: false, code: "NOT_PENDING" };

    const { data: fromEnr, error: feErr } = await supabase
      .from("section_enrollments")
      .select("id")
      .eq("section_id", req.from_section_id)
      .eq("student_id", req.student_id)
      .eq("status", "active")
      .maybeSingle();

    if (feErr || !fromEnr) return { ok: false, code: "NOT_ELIGIBLE" };

    const defMax = getDefaultSectionMaxStudents();
    const { data: rpcData, error: rpcErr } = await supabase.rpc(
      "academic_admin_section_enroll_commit",
      {
        p_student_id: req.student_id,
        p_section_id: req.to_section_id,
        p_drop_section_enrollment_id: fromEnr.id,
        p_drop_next_status: "transferred",
        p_allow_capacity_override: false,
        p_default_max_students: defMax,
      },
    );

    if (rpcErr) return { ok: false, code: "RPC_FAILED" };

    const row = rpcData as { enrollment_id?: string } | null;
    if (!row?.enrollment_id) return { ok: false, code: "RPC_FAILED" };

    await cancelReminderJobsForEnrollmentId(fromEnr.id, "approveSectionTransferRequestAction");

    const { data: updatedRows, error: uErr } = await supabase
      .from("section_transfer_requests")
      .update({
        status: "approved",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", rid.data)
      .eq("status", "pending")
      .select("id");

    if (uErr) return { ok: false, code: "RPC_FAILED" };
    if (!updatedRows?.length) return { ok: false, code: "STALE" };

    void recordSystemAudit({
      action: "academic_transfer_request_approved",
      resourceType: "section_transfer_request",
      resourceId: rid.data,
      payload: {
        studentId: req.student_id,
        fromSectionId: req.from_section_id,
        toSectionId: req.to_section_id,
        newEnrollmentId: row.enrollment_id,
      },
    });

    const { data: toSec } = await supabase
      .from("academic_sections")
      .select("name, schedule_slots, teacher_id, academic_cohorts(name)")
      .eq("id", req.to_section_id)
      .maybeSingle();

    const sec = toSec as {
      name: string;
      schedule_slots: unknown;
      teacher_id: string;
      academic_cohorts: { name: string } | { name: string }[] | null;
    } | null;

    if (sec) {
      const cohortRaw = sec.academic_cohorts;
      const cohortName = Array.isArray(cohortRaw)
        ? (cohortRaw[0]?.name ?? "")
        : (cohortRaw?.name ?? "");
      const { data: teacherRow } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", sec.teacher_id)
        .maybeSingle();
      const teacherName = teacherRow
        ? `${teacherRow.first_name} ${teacherRow.last_name}`.trim()
        : sec.teacher_id;
      const slots = parseSectionScheduleSlots(sec.schedule_slots);
      const loc = input.locale === "en" ? "en" : "es";
      await sendTransferApprovedNotifications({
        supabase,
        locale: loc,
        studentId: req.student_id,
        sectionName: sec.name,
        cohortName,
        teacherName,
        scheduleSlots: slots,
        dict: {
          emailSubject: input.notificationDict.emailSubject,
          emailLead: input.notificationDict.emailLead,
          inAppTitle: input.notificationDict.inAppTitle,
          inAppBody: input.notificationDict.inAppBody,
        },
      });
    }

    if (!opts?.suppressRevalidate) revalidateAcademicSurfaces(input.locale);
    return { ok: true };
  } catch (err) {
    logServerException("approveSectionTransferRequestAction", err);
    return { ok: false, code: "UNAUTHORIZED" };
  }
}

export async function bulkApproveSectionTransferRequestsAction(input: {
  locale: string;
  requestIds: string[];
  notificationDict: AcademicTransferNotificationDict;
}): Promise<{ failedIds: string[] }> {
  const parsed = bulkIdsSchema.safeParse([...new Set(input.requestIds)]);
  if (!parsed.success) return { failedIds: [] };

  const failed: string[] = [];
  for (const id of parsed.data) {
    const r = await approveSectionTransferRequestAction(
      {
        locale: input.locale,
        requestId: id,
        notificationDict: input.notificationDict,
      },
      { suppressRevalidate: true },
    );
    if (!r.ok) failed.push(id);
  }
  revalidateAcademicSurfaces(input.locale);
  return { failedIds: failed };
}

export async function rejectSectionTransferRequestAction(input: {
  locale: string;
  requestId: string;
}): Promise<RejectSectionTransferRequestResult> {
  try {
    const { supabase, user } = await assertAdmin();
    const rid = uuid.safeParse(input.requestId);
    if (!rid.success) return { ok: false, code: "PARSE" };

    const { data: updatedRows, error } = await supabase
      .from("section_transfer_requests")
      .update({
        status: "rejected",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", rid.data)
      .eq("status", "pending")
      .select("id");

    if (error) return { ok: false, code: "PARSE" };
    if (!updatedRows?.length) return { ok: false, code: "NOT_PENDING" };

    void recordSystemAudit({
      action: "academic_transfer_request_rejected",
      resourceType: "section_transfer_request",
      resourceId: rid.data,
      payload: {},
    });

    revalidateAcademicSurfaces(input.locale);
    return { ok: true };
  } catch (err) {
    logServerException("rejectSectionTransferRequestAction", err);
    return { ok: false, code: "UNAUTHORIZED" };
  }
}
