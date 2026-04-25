import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { runAdminAttendanceCellsUpsert } from "@/lib/academics/adminAttendanceMatrixMutations";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logServerAuthzDenied, logServerException } from "@/lib/logging/serverActionLog";

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
    const { supabase, user } = await assertAdmin();
    const { locale, sectionId, cells } = parsed.data;
    const res = await runAdminAttendanceCellsUpsert(supabase, user.id, sectionId, cells);
    if (!res.ok) return NextResponse.json({ ok: false, code: res.code });

    void recordSystemAudit({
      action: "section_attendance_admin_cells_upsert",
      resourceType: "academic_section",
      resourceId: sectionId,
      payload: { count: cells.length },
    });

    revalidatePath(`/${locale}/dashboard/student`);
    revalidatePath(`/${locale}/dashboard/parent`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === ADMIN_SESSION_UNAUTHORIZED) {
      return NextResponse.json({ ok: false, code: "auth" }, { status: 401 });
    }
    if (msg === ADMIN_SESSION_FORBIDDEN) {
      logServerAuthzDenied("api/admin/attendance/cells", { reason: msg });
      return NextResponse.json({ ok: false, code: "forbidden" }, { status: 403 });
    }
    logServerException("api/admin/attendance/cells", e);
    return NextResponse.json({ ok: false, code: "save" }, { status: 500 });
  }
}
