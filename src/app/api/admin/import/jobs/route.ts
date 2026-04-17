import { NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { logServerAuthzDenied, logServerException } from "@/lib/logging/serverActionLog";
import { csvStudentRowsSchema } from "@/lib/import/studentRowSchema";
import { isKvImportConfigured, mergeImportJob } from "@/lib/import/importJobKv";
import { runBulkImportJobWithKv } from "@/lib/import/runBulkImportJobWithKv";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";

export const runtime = "nodejs";

const bodySchema = z.object({
  locale: z.string().min(2).max(10),
  rows: z.array(z.record(z.string(), z.unknown())).min(1).max(4000),
});

export async function POST(request: Request) {
  if (!isKvImportConfigured()) {
    return NextResponse.json({ ok: false, code: "kv_not_configured" as const });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch (err) {
    logServerException("api/admin/import/jobs:POST:json", err);
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsedBody = bodySchema.safeParse(json);
  if (!parsedBody.success) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
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
    if (msg === ADMIN_SESSION_FORBIDDEN) {
      logServerAuthzDenied("api/admin/import/jobs:POST");
    } else {
      logServerException("api/admin/import/jobs:POST:assertAdmin", e);
    }
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const rowsParsed = csvStudentRowsSchema.safeParse(parsedBody.data.rows);
  if (!rowsParsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_rows" }, { status: 400 });
  }

  const dict = await getDictionary(parsedBody.data.locale);
  const tutorDefaults = {
    defaultFirstName: dict.admin.registrations.tutorAccountDefaultFirst,
    emptyLastName: dict.admin.registrations.emptyValue,
  };

  const jobId = crypto.randomUUID();
  await mergeImportJob(jobId, {
    ownerId: userId,
    status: "queued",
    phase: "queued",
    message: "",
    current: 0,
    total: rowsParsed.data.length,
    activityAppend: { t: Date.now(), code: "queued" },
  });

  void recordSystemAudit({
    action: "csv_import_job_started",
    resourceType: "import_job",
    resourceId: jobId,
    payload: { row_count: rowsParsed.data.length },
  });

  after(() =>
    runBulkImportJobWithKv(jobId, userId, rowsParsed.data, tutorDefaults),
  );

  return NextResponse.json({ ok: true, jobId });
}
