import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { ADMIN_SESSION_UNAUTHORIZED } from "@/lib/dashboard/adminSessionErrors";
import { mergeImportJob, readImportJob } from "@/lib/import/importJobKv";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { IMPORT_JOB_CANCELLED_BY_USER } from "@/lib/import/importJobErrorCodes";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  let userId: string;
  try {
    const { user } = await assertAdmin();
    userId = user.id;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === ADMIN_SESSION_UNAUTHORIZED) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const job = await readImportJob(id);
  if (!job) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (job.ownerId !== userId) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { ownerId, ...rest } = job;
  void ownerId;
  return NextResponse.json(rest);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  let userId: string;
  try {
    const { user } = await assertAdmin();
    userId = user.id;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === ADMIN_SESSION_UNAUTHORIZED) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const job = await readImportJob(id);
  if (!job) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (job.ownerId !== userId) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  if (job.status === "done" || job.status === "error") {
    return NextResponse.json({ ok: true, cancelled: false, terminal: true });
  }

  await mergeImportJob(id, {
    ownerId: userId,
    status: "error",
    phase: "cancelled",
    message: IMPORT_JOB_CANCELLED_BY_USER,
    error: IMPORT_JOB_CANCELLED_BY_USER,
    current: typeof job.current === "number" ? job.current : 0,
    total: typeof job.total === "number" ? job.total : 0,
    activeRow: typeof job.activeRow === "number" ? job.activeRow : 0,
    activityAppend: { t: Date.now(), code: "cancelled_by_user" },
  });

  void recordSystemAudit({
    action: "csv_import_job_cancelled",
    resourceType: "import_job",
    resourceId: id,
    payload: { current: job.current ?? 0, total: job.total ?? 0 },
  });

  return NextResponse.json({ ok: true, cancelled: true });
}
