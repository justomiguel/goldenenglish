import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { ADMIN_SESSION_UNAUTHORIZED } from "@/lib/dashboard/adminSessionErrors";
import { readImportJob } from "@/lib/import/importJobKv";

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
