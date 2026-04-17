"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  runAdminAttendanceCellsUpsert,
  runAdminAttendanceColumnFill,
  runAdminAttendanceColumnUndo,
} from "@/lib/academics/adminAttendanceMatrixMutations";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

const uuid = z.string().uuid();
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const payloadSchema = z.object({
  locale: z.string().min(1),
  cohortId: uuid,
  sectionId: uuid,
  enrollmentId: uuid,
  attendedOn: dateStr,
  status: z.enum(["present", "absent", "late", "excused"]),
});

export type AdminAttendanceCellState = { ok: true } | { ok: false; code: "auth" | "validation" | "forbidden" | "save" };

export type AdminAttendanceMatrixMutationState =
  | { ok: true; insertedEnrollmentIds?: string[] }
  | {
      ok: false;
      code: "auth" | "validation" | "forbidden" | "invalid_class_date" | "save" | "nothing_to_fill";
    };

const cellSchema = z.object({
  enrollmentId: uuid,
  attendedOn: dateStr,
  status: z.enum(["present", "absent", "late", "excused"]),
  notes: z.string().max(2000).optional().nullable(),
});

const upsertCellsSchema = z.object({
  locale: z.string().min(1),
  sectionId: uuid,
  cells: z.array(cellSchema).min(1).max(32),
});

const fillColumnSchema = z.object({
  locale: z.string().min(1),
  sectionId: uuid,
  attendedOn: dateStr,
});

const undoColumnSchema = z.object({
  locale: z.string().min(1),
  sectionId: uuid,
  attendedOn: dateStr,
  enrollmentIds: z.array(uuid).min(1).max(200),
});

async function revalidateAdminSectionAttendancePaths(
  supabase: SupabaseClient,
  locale: string,
  sectionId: string,
) {
  const { data: sec } = await supabase.from("academic_sections").select("cohort_id").eq("id", sectionId).maybeSingle();
  const cohortId = sec?.cohort_id as string | undefined;
  if (!cohortId) return;
  revalidatePath(`/${locale}/dashboard/admin/academic/${cohortId}/${sectionId}/attendance`);
  revalidatePath(`/${locale}/dashboard/admin/academic/${cohortId}/${sectionId}`);
  revalidatePath(`/${locale}/dashboard/student`);
  revalidatePath(`/${locale}/dashboard/parent`);
}

export async function adminUpsertSectionAttendanceCellsAction(
  _prev: AdminAttendanceMatrixMutationState | null,
  formData: FormData,
): Promise<AdminAttendanceMatrixMutationState> {
  try {
    const { supabase, user } = await assertAdmin();
    const raw = formData.get("payload");
    const parsed = upsertCellsSchema.safeParse(JSON.parse(typeof raw === "string" ? raw : "{}"));
    if (!parsed.success) return { ok: false, code: "validation" };

    const { locale, sectionId, cells } = parsed.data;
    const res = await runAdminAttendanceCellsUpsert(supabase, user.id, sectionId, cells);
    if (!res.ok) return { ok: false, code: res.code };

    void recordSystemAudit({
      action: "section_attendance_admin_cells_upsert",
      resourceType: "academic_section",
      resourceId: sectionId,
      payload: { count: cells.length },
    });
    await revalidateAdminSectionAttendancePaths(supabase, locale, sectionId);
    return { ok: true };
  } catch (err) {
    logServerException("adminUpsertSectionAttendanceCellsAction", err);
    return { ok: false, code: "auth" };
  }
}

export async function fillEmptyAdminAttendanceColumnAction(
  _prev: AdminAttendanceMatrixMutationState | null,
  formData: FormData,
): Promise<AdminAttendanceMatrixMutationState> {
  try {
    const { supabase, user } = await assertAdmin();
    const raw = formData.get("payload");
    const parsed = fillColumnSchema.safeParse(JSON.parse(typeof raw === "string" ? raw : "{}"));
    if (!parsed.success) return { ok: false, code: "validation" };

    const { locale, sectionId, attendedOn } = parsed.data;
    const res = await runAdminAttendanceColumnFill(supabase, user.id, sectionId, attendedOn);
    if (!res.ok) return { ok: false, code: res.code };

    void recordSystemAudit({
      action: "section_attendance_admin_fill_column",
      resourceType: "academic_section",
      resourceId: sectionId,
      payload: { attendedOn, inserted: res.insertedEnrollmentIds.length },
    });
    await revalidateAdminSectionAttendancePaths(supabase, locale, sectionId);
    return { ok: true, insertedEnrollmentIds: res.insertedEnrollmentIds };
  } catch (err) {
    logServerException("fillEmptyAdminAttendanceColumnAction", err);
    return { ok: false, code: "auth" };
  }
}

export async function undoAdminAttendanceColumnFillAction(
  _prev: AdminAttendanceMatrixMutationState | null,
  formData: FormData,
): Promise<AdminAttendanceMatrixMutationState> {
  try {
    const { supabase, user } = await assertAdmin();
    const raw = formData.get("payload");
    const parsed = undoColumnSchema.safeParse(JSON.parse(typeof raw === "string" ? raw : "{}"));
    if (!parsed.success) return { ok: false, code: "validation" };

    const { locale, sectionId, attendedOn, enrollmentIds } = parsed.data;
    const res = await runAdminAttendanceColumnUndo(supabase, user.id, sectionId, attendedOn, enrollmentIds);
    if (!res.ok) return { ok: false, code: res.code };

    void recordSystemAudit({
      action: "section_attendance_admin_undo_column_fill",
      resourceType: "academic_section",
      resourceId: sectionId,
      payload: { attendedOn, count: enrollmentIds.length },
    });
    await revalidateAdminSectionAttendancePaths(supabase, locale, sectionId);
    return { ok: true };
  } catch (err) {
    logServerException("undoAdminAttendanceColumnFillAction", err);
    return { ok: false, code: "auth" };
  }
}

export async function adminUpsertSectionAttendanceCellAction(
  _prev: AdminAttendanceCellState | null,
  formData: FormData,
): Promise<AdminAttendanceCellState> {
  try {
    const { supabase, user } = await assertAdmin();
    const raw = formData.get("payload");
    const parsed = payloadSchema.safeParse(JSON.parse(typeof raw === "string" ? raw : "{}"));
    if (!parsed.success) return { ok: false, code: "validation" };

    const p = parsed.data;
    const { data: enr } = await supabase
      .from("section_enrollments")
      .select("id, section_id")
      .eq("id", p.enrollmentId)
      .maybeSingle();
    if (!enr || (enr.section_id as string) !== p.sectionId) return { ok: false, code: "forbidden" };

    const { data: sec } = await supabase
      .from("academic_sections")
      .select("id, cohort_id")
      .eq("id", p.sectionId)
      .maybeSingle();
    if (!sec || (sec.cohort_id as string) !== p.cohortId) return { ok: false, code: "forbidden" };

    const { error } = await supabase.from("section_attendance").upsert(
      {
        enrollment_id: p.enrollmentId,
        attended_on: p.attendedOn,
        status: p.status,
        notes: null,
        recorded_by: user.id,
      },
      { onConflict: "enrollment_id,attended_on" },
    );
    if (error) {
      logSupabaseClientError("adminUpsertSectionAttendanceCellAction", error, {
        sectionId: p.sectionId,
        attendedOn: p.attendedOn,
      });
      return { ok: false, code: "save" };
    }

    revalidatePath(
      `/${p.locale}/dashboard/admin/academic/${p.cohortId}/${p.sectionId}/attendance`,
    );
    revalidatePath(`/${p.locale}/dashboard/admin/academic/${p.cohortId}/${p.sectionId}`);
    revalidatePath(`/${p.locale}/dashboard/student`);
    revalidatePath(`/${p.locale}/dashboard/parent`);
    return { ok: true };
  } catch (err) {
    logServerException("adminUpsertSectionAttendanceCellAction", err);
    return { ok: false, code: "auth" };
  }
}
