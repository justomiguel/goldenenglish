"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { assertTeacher } from "@/lib/dashboard/assertTeacher";
import {
  runTeacherAttendanceCellsUpsert,
  runTeacherAttendanceColumnFill,
  runTeacherAttendanceColumnUndo,
} from "@/lib/academics/teacherAttendanceMatrixMutations";
import { logServerException } from "@/lib/logging/serverActionLog";
import { userIsSectionTeacherOrAssistant } from "@/lib/academics/userIsSectionTeacherOrAssistant";
import { auditSectionAction } from "@/lib/audit";
import { awardStudentBadgesForEnrollments } from "@/lib/badges/awardStudentBadgesForEnrollments";

const uuid = z.string().uuid();
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

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

export type TeacherAttendanceMatrixActionState =
  | { ok: true; insertedEnrollmentIds?: string[] }
  | {
      ok: false;
      code: "auth" | "validation" | "forbidden" | "invalid_class_date" | "save" | "nothing_to_fill";
    };

function revalidateAttendance(locale: string, sectionId: string) {
  revalidatePath(`/${locale}/dashboard/teacher/sections/${sectionId}/attendance`);
  revalidatePath(`/${locale}/dashboard/teacher/sections/${sectionId}`);
  revalidatePath(`/${locale}/dashboard/admin/academic`);
}

export async function fillEmptyTeacherAttendanceColumnAction(
  _prev: TeacherAttendanceMatrixActionState | null,
  formData: FormData,
): Promise<TeacherAttendanceMatrixActionState> {
  try {
    const { supabase, profileId, user } = await assertTeacher();
    const raw = formData.get("payload");
    const parsed = fillColumnSchema.safeParse(JSON.parse(typeof raw === "string" ? raw : "{}"));
    if (!parsed.success) return { ok: false, code: "validation" };

    const { locale, sectionId, attendedOn } = parsed.data;
    if (!(await userIsSectionTeacherOrAssistant(supabase, profileId, sectionId))) {
      return { ok: false, code: "forbidden" };
    }

    const res = await runTeacherAttendanceColumnFill(supabase, profileId, sectionId, attendedOn);
    if (!res.ok) return { ok: false, code: res.code };

    await recordUserEventServer({
      userId: user.id,
      eventType: "action",
      entity: AnalyticsEntity.teacherSectionAttendance,
      metadata: { op: "fill_empty_column", sectionId, attendedOn, count: res.insertedEnrollmentIds.length },
    });
    void auditSectionAction({
      actorId: user.id,
      actorRole: "teacher",
      action: "create",
      resourceType: "section_attendance",
      resourceId: sectionId,
      summary: "Teacher filled empty attendance column",
      afterValues: {
        section_id: sectionId,
        attended_on: attendedOn,
        inserted_enrollment_ids: res.insertedEnrollmentIds,
      },
      metadata: { count: res.insertedEnrollmentIds.length },
    });

    if (res.insertedEnrollmentIds.length) {
      void awardStudentBadgesForEnrollments(res.insertedEnrollmentIds, locale);
    }
    revalidateAttendance(locale, sectionId);
    return { ok: true, insertedEnrollmentIds: res.insertedEnrollmentIds };
  } catch (err) {
    logServerException("fillEmptyTeacherAttendanceColumnAction", err);
    return { ok: false, code: "auth" };
  }
}

export async function undoTeacherAttendanceColumnFillAction(
  _prev: TeacherAttendanceMatrixActionState | null,
  formData: FormData,
): Promise<TeacherAttendanceMatrixActionState> {
  try {
    const { supabase, profileId, user } = await assertTeacher();
    const raw = formData.get("payload");
    const parsed = undoColumnSchema.safeParse(JSON.parse(typeof raw === "string" ? raw : "{}"));
    if (!parsed.success) return { ok: false, code: "validation" };

    const { locale, sectionId, attendedOn, enrollmentIds } = parsed.data;
    if (!(await userIsSectionTeacherOrAssistant(supabase, profileId, sectionId))) {
      return { ok: false, code: "forbidden" };
    }

    const res = await runTeacherAttendanceColumnUndo(supabase, profileId, sectionId, attendedOn, enrollmentIds);
    if (!res.ok) return { ok: false, code: res.code };
    void auditSectionAction({
      actorId: user.id,
      actorRole: "teacher",
      action: "delete",
      resourceType: "section_attendance",
      resourceId: sectionId,
      summary: "Teacher undid attendance column fill",
      beforeValues: {
        section_id: sectionId,
        attended_on: attendedOn,
        enrollment_ids: enrollmentIds,
      },
      afterValues: {
        section_id: sectionId,
        attended_on: attendedOn,
        enrollment_ids: [],
      },
      metadata: { count: enrollmentIds.length },
    });

    revalidateAttendance(locale, sectionId);
    return { ok: true };
  } catch (err) {
    logServerException("undoTeacherAttendanceColumnFillAction", err);
    return { ok: false, code: "auth" };
  }
}

export async function upsertTeacherAttendanceCellsAction(
  _prev: TeacherAttendanceMatrixActionState | null,
  formData: FormData,
): Promise<TeacherAttendanceMatrixActionState> {
  try {
    const { supabase, profileId, user } = await assertTeacher();
    const raw = formData.get("payload");
    const parsed = upsertCellsSchema.safeParse(JSON.parse(typeof raw === "string" ? raw : "{}"));
    if (!parsed.success) return { ok: false, code: "validation" };

    const { locale, sectionId, cells } = parsed.data;
    if (!(await userIsSectionTeacherOrAssistant(supabase, profileId, sectionId))) {
      return { ok: false, code: "forbidden" };
    }

    const res = await runTeacherAttendanceCellsUpsert(supabase, profileId, sectionId, cells);
    if (!res.ok) return { ok: false, code: res.code };
    void auditSectionAction({
      actorId: user.id,
      actorRole: "teacher",
      action: "update",
      resourceType: "section_attendance",
      resourceId: sectionId,
      summary: "Teacher updated attendance cells",
      afterValues: {
        section_id: sectionId,
        cells,
      },
      metadata: { count: cells.length },
    });

    void awardStudentBadgesForEnrollments(
      [...new Set(cells.map((c) => c.enrollmentId))],
      locale,
    );
    revalidateAttendance(locale, sectionId);
    return { ok: true };
  } catch (err) {
    logServerException("upsertTeacherAttendanceCellsAction", err);
    return { ok: false, code: "auth" };
  }
}
