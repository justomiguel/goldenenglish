"use server";

import { z } from "zod";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { revalidateRegistrationInbox } from "@/lib/register/registrationIntakeActionSupport";
import { createAdminClient } from "@/lib/supabase/admin";

const idZ = z.string().uuid();

type EnrollmentRow = {
  id?: unknown;
  section_id?: unknown;
  academic_sections?: unknown;
};

function cohortOf(value: unknown): string {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") return "";
  const cohortId = (row as { cohort_id?: unknown }).cohort_id;
  return typeof cohortId === "string" ? cohortId : "";
}

export async function moveRegistrationSectionAction(input: {
  locale: string;
  registrationId: string;
  sectionId: string;
  cohortId: string;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("moveRegistrationSection");
    return { ok: false, code: "forbidden" };
  }

  const registrationId = idZ.safeParse(input.registrationId);
  const sectionId = idZ.safeParse(input.sectionId);
  const cohortId = idZ.safeParse(input.cohortId);
  if (!registrationId.success || !sectionId.success || !cohortId.success) {
    return { ok: false, code: "not_found" };
  }

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("registrations")
    .select("id,status,accepted_student_id")
    .eq("id", registrationId.data)
    .maybeSingle();
  if (error || !data) {
    if (error) {
      logSupabaseClientError("moveRegistrationSection", error, { registrationId: registrationId.data });
    }
    return { ok: false, code: "not_found" };
  }
  const lead = data as { status?: unknown; accepted_student_id?: unknown };
  const studentId = typeof lead.accepted_student_id === "string" ? lead.accepted_student_id : "";
  if (lead.status !== "enrolled" || !studentId) return { ok: false, code: "not_found" };

  const section = await admin
    .from("academic_sections")
    .select("id,cohort_id")
    .eq("id", sectionId.data)
    .maybeSingle();
  if (section.error || !section.data) {
    if (section.error) {
      logSupabaseClientError("moveRegistrationSection", section.error, { sectionId: sectionId.data });
    }
    return { ok: false, code: "section_move_outside_cohort" };
  }
  if (String((section.data as { cohort_id?: unknown }).cohort_id ?? "") !== cohortId.data) {
    return { ok: false, code: "section_move_outside_cohort" };
  }

  const active = await admin
    .from("section_enrollments")
    .select("id,section_id,academic_sections(cohort_id)")
    .eq("student_id", studentId)
    .eq("status", "active");
  if (active.error) {
    logSupabaseClientError("moveRegistrationSection", active.error, { studentId });
    return { ok: false, code: "save_failed" };
  }
  const inCohort = ((active.data ?? []) as EnrollmentRow[]).filter(
    (row) => cohortOf(row.academic_sections) === cohortId.data,
  );
  if (inCohort.some((row) => String(row.section_id ?? "") === sectionId.data)) {
    return { ok: false, code: "section_move_same" };
  }

  const ids = inCohort.map((row) => String(row.id ?? "")).filter(Boolean);
  if (ids.length > 0) {
    const moved = await admin.from("section_enrollments").update({ status: "transferred" }).in("id", ids);
    if (moved.error) {
      logSupabaseClientError("moveRegistrationSection", moved.error, { registrationId: registrationId.data });
      return { ok: false, code: "save_failed" };
    }
  }
  const inserted = await admin.from("section_enrollments").insert({
    section_id: sectionId.data,
    student_id: studentId,
    status: "active",
  });
  if (inserted.error) {
    logSupabaseClientError("moveRegistrationSection", inserted.error, { registrationId: registrationId.data });
    return { ok: false, code: "save_failed" };
  }

  await recordSystemAudit({
    action: "registration_section_move",
    resourceType: "registration",
    resourceId: registrationId.data,
    payload: { cohort_id: cohortId.data, section_id: sectionId.data },
  });
  revalidateRegistrationInbox(input.locale);
  return { ok: true };
}
