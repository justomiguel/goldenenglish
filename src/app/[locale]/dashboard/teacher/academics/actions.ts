"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertTeacher } from "@/lib/dashboard/assertTeacher";
import { teacherTransferReasonCodeSchema } from "@/lib/academics/teacherTransferSuggestionReasons";
import { searchTeacherStudentsInOwnSections } from "@/lib/academics/searchTeacherStudentsInOwnSections";
import { userIsSectionTeacherOrAssistant } from "@/lib/academics/userIsSectionTeacherOrAssistant";
import {
  logServerActionException,
  logServerAuthzDenied,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

const uuid = z.string().uuid();

export type TransferSuggestionActionState =
  | { ok: true }
  | { ok: false; code: "auth" | "validation" | "forbidden" | "duplicate" | "insert" };

function revalidateTeacherTransferPaths(locale: string) {
  revalidatePath(`/${locale}/dashboard/teacher/academics`);
  revalidatePath(`/${locale}/dashboard/teacher/sections`);
  revalidatePath(`/${locale}/dashboard/admin/academics`);
  revalidatePath(`/${locale}/dashboard/admin/academic`, "layout");
}

export async function searchTeacherStudentsInOwnSectionsAction(
  query: string,
  sectionIds: string[],
): Promise<{ id: string; label: string }[]> {
  try {
    const { supabase, profileId } = await assertTeacher();
    return await searchTeacherStudentsInOwnSections(supabase, profileId, query, sectionIds);
  } catch (err) {
    logServerActionException("searchTeacherStudentsInOwnSectionsAction", err);
    return [];
  }
}

export async function createSectionTransferRequestAction(input: {
  locale: string;
  studentId: string;
  fromSectionId: string;
  toSectionId: string;
  note?: string | null;
  reasonCode?: string | null;
}): Promise<{ ok: boolean }> {
  try {
    const { supabase, profileId } = await assertTeacher();
    const studentId = uuid.safeParse(input.studentId);
    const fromId = uuid.safeParse(input.fromSectionId);
    const toId = uuid.safeParse(input.toSectionId);
    if (!studentId.success || !fromId.success || !toId.success) return { ok: false };
    if (fromId.data === toId.data) return { ok: false };

    let reason_code: string | null = null;
    if (input.reasonCode != null && String(input.reasonCode).trim() !== "") {
      const rp = teacherTransferReasonCodeSchema.safeParse(input.reasonCode);
      if (rp.success) reason_code = rp.data;
    }

    const { error } = await supabase.from("section_transfer_requests").insert({
      student_id: studentId.data,
      from_section_id: fromId.data,
      to_section_id: toId.data,
      requested_by: profileId,
      note: input.note?.trim() ? input.note.trim() : null,
      reason_code,
    });

    if (error) {
      logSupabaseClientError("createSectionTransferRequestAction:insert", error, {
        studentId: studentId.data,
        fromSectionId: fromId.data,
        toSectionId: toId.data,
      });
      return { ok: false };
    }
    revalidateTeacherTransferPaths(input.locale);
    return { ok: true };
  } catch {
    logServerAuthzDenied("createSectionTransferRequestAction");
    return { ok: false };
  }
}

function fdStr(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function submitTransferSuggestionAction(
  _prev: TransferSuggestionActionState | null,
  formData: FormData,
): Promise<TransferSuggestionActionState> {
  try {
    const { supabase, profileId } = await assertTeacher();
    const locale = fdStr(formData, "locale");
    const studentId = fdStr(formData, "studentId");
    const fromSectionId = fdStr(formData, "fromSectionId");
    const toSectionId = fdStr(formData, "toSectionId");
    const kind = fdStr(formData, "kind") as "section" | "cohort";
    const comment = fdStr(formData, "comment");

    const sid = uuid.safeParse(studentId);
    const fromId = uuid.safeParse(fromSectionId);
    const toId = uuid.safeParse(toSectionId);
    const reasonParsed = teacherTransferReasonCodeSchema.safeParse(fdStr(formData, "reasonCode"));

    if (!locale || !sid.success || !fromId.success || !toId.success || !reasonParsed.success) {
      return { ok: false, code: "validation" };
    }
    if (fromId.data === toId.data) return { ok: false, code: "validation" };
    if (kind !== "section" && kind !== "cohort") return { ok: false, code: "validation" };

    const { data: fromSec, error: fromErr } = await supabase
      .from("academic_sections")
      .select("id, cohort_id, teacher_id")
      .eq("id", fromId.data)
      .maybeSingle();

    if (fromErr) {
      logSupabaseClientError("submitTransferSuggestionAction:fromSection", fromErr, {
        fromSectionId: fromId.data,
      });
      return { ok: false, code: "forbidden" };
    }
    const fromOk = await userIsSectionTeacherOrAssistant(supabase, profileId, fromId.data);
    if (!fromSec || !fromOk) {
      return { ok: false, code: "forbidden" };
    }

    const fromCohortId = fromSec.cohort_id as string;

    const { data: toSec, error: toErr } = await supabase
      .from("academic_sections")
      .select("id, cohort_id, teacher_id")
      .eq("id", toId.data)
      .maybeSingle();

    if (toErr) {
      logSupabaseClientError("submitTransferSuggestionAction:toSection", toErr, { toSectionId: toId.data });
      return { ok: false, code: "validation" };
    }
    if (!toSec) return { ok: false, code: "validation" };

    const toCohortId = toSec.cohort_id as string;

    if (kind === "section") {
      if (toCohortId !== fromCohortId) return { ok: false, code: "validation" };
    } else {
      if (toCohortId === fromCohortId) return { ok: false, code: "validation" };
      if ((toSec.teacher_id as string) !== profileId) return { ok: false, code: "forbidden" };
    }

    const { data: enroll, error: enErr } = await supabase
      .from("section_enrollments")
      .select("id")
      .eq("section_id", fromId.data)
      .eq("student_id", sid.data)
      .eq("status", "active")
      .maybeSingle();

    if (enErr) {
      logSupabaseClientError("submitTransferSuggestionAction:enrollment", enErr, {
        studentId: sid.data,
        sectionId: fromId.data,
      });
      return { ok: false, code: "validation" };
    }
    if (!enroll) return { ok: false, code: "validation" };

    const { data: pendingRow } = await supabase
      .from("section_transfer_requests")
      .select("id")
      .eq("student_id", sid.data)
      .eq("from_section_id", fromId.data)
      .eq("status", "pending")
      .maybeSingle();

    if (pendingRow) return { ok: false, code: "duplicate" };

    const { error } = await supabase.from("section_transfer_requests").insert({
      student_id: sid.data,
      from_section_id: fromId.data,
      to_section_id: toId.data,
      requested_by: profileId,
      note: comment ? comment : null,
      reason_code: reasonParsed.data,
    });

    if (error) {
      logSupabaseClientError("submitTransferSuggestionAction:insert", error, {
        studentId: sid.data,
        fromSectionId: fromId.data,
        toSectionId: toId.data,
      });
      return { ok: false, code: "insert" };
    }
    revalidateTeacherTransferPaths(locale);
    return { ok: true };
  } catch {
    logServerAuthzDenied("submitTransferSuggestionAction");
    return { ok: false, code: "auth" };
  }
}
