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
    const { supabase, profileId } = await assertTeacher();
    const raw = formData.get("payload");
    const parsed = undoColumnSchema.safeParse(JSON.parse(typeof raw === "string" ? raw : "{}"));
    if (!parsed.success) return { ok: false, code: "validation" };

    const { locale, sectionId, attendedOn, enrollmentIds } = parsed.data;
    if (!(await userIsSectionTeacherOrAssistant(supabase, profileId, sectionId))) {
      return { ok: false, code: "forbidden" };
    }

    const res = await runTeacherAttendanceColumnUndo(supabase, profileId, sectionId, attendedOn, enrollmentIds);
    if (!res.ok) return { ok: false, code: res.code };

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
    const { supabase, profileId } = await assertTeacher();
    const raw = formData.get("payload");
    const parsed = upsertCellsSchema.safeParse(JSON.parse(typeof raw === "string" ? raw : "{}"));
    if (!parsed.success) return { ok: false, code: "validation" };

    const { locale, sectionId, cells } = parsed.data;
    if (!(await userIsSectionTeacherOrAssistant(supabase, profileId, sectionId))) {
      return { ok: false, code: "forbidden" };
    }

    const res = await runTeacherAttendanceCellsUpsert(supabase, profileId, sectionId, cells);
    if (!res.ok) return { ok: false, code: res.code };

    revalidateAttendance(locale, sectionId);
    return { ok: true };
  } catch (err) {
    logServerException("upsertTeacherAttendanceCellsAction", err);
    return { ok: false, code: "auth" };
  }
}
