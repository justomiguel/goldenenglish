import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertTeacher } from "@/lib/dashboard/assertTeacher";
import { runTeacherAttendanceCellsUpsert } from "@/lib/academics/teacherAttendanceMatrixMutations";
import { userIsSectionTeacherOrAssistant } from "@/lib/academics/userIsSectionTeacherOrAssistant";
import { logServerException } from "@/lib/logging/serverActionLog";

const uuid = z.string().uuid();
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const cellSchema = z.object({
  enrollmentId: uuid,
  attendedOn: dateStr,
  status: z.enum(["present", "absent", "late", "excused"]),
  notes: z.string().max(2000).optional().nullable(),
});

const bodySchema = z.object({
  locale: z.string().min(1),
  sectionId: uuid,
  cells: z.array(cellSchema).min(1).max(32),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "validation" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, code: "validation" }, { status: 400 });
  }

  try {
    const { supabase, profileId } = await assertTeacher();
    const { locale, sectionId, cells } = parsed.data;

    if (!(await userIsSectionTeacherOrAssistant(supabase, profileId, sectionId))) {
      return NextResponse.json({ ok: false, code: "forbidden" }, { status: 403 });
    }

    const res = await runTeacherAttendanceCellsUpsert(supabase, profileId, sectionId, cells);
    if (!res.ok) return NextResponse.json({ ok: false, code: res.code });

    revalidatePath(`/${locale}/dashboard/teacher/sections/${sectionId}/attendance`);
    revalidatePath(`/${locale}/dashboard/teacher/sections/${sectionId}`);
    revalidatePath(`/${locale}/dashboard/admin/academic`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    logServerException("api/teacher/attendance/cells", e);
    return NextResponse.json({ ok: false, code: "auth" }, { status: 500 });
  }
}
