import { NextResponse } from "next/server";
import { uploadEventAttendeeFieldFileServer } from "@/lib/events/server/uploadEventAttendeeFieldFileServer";
import { logServerException, logServerWarn } from "@/lib/logging/serverActionLog";

export const runtime = "nodejs";

const ipHits = new Map<string, { count: number; ts: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const current = ipHits.get(ip);
  if (!current || now - current.ts > RATE_LIMIT_WINDOW_MS) {
    ipHits.set(ip, { count: 1, ts: now });
    return false;
  }
  current.count += 1;
  current.ts = now;
  ipHits.set(ip, current);
  return current.count > RATE_LIMIT_MAX;
}

function clientIp(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const ip = clientIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { ok: false, code: "rate_limited" },
        { status: 429, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const { slug } = await context.params;
    const form = await request.formData();
    const fieldId = String(form.get("fieldId") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const dniOrPassport = String(form.get("dniOrPassport") ?? "").trim();
    const locale = String(form.get("locale") ?? "es").trim() || "es";
    const file = form.get("file");

    if (!fieldId || !email || !dniOrPassport || !(file instanceof File)) {
      logServerWarn("api.events.fieldFile", { reason: "invalid_body", slug });
      return NextResponse.json(
        { ok: false, code: "invalid_body" },
        { status: 400, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const fileBytes = Buffer.from(await file.arrayBuffer());
    const result = await uploadEventAttendeeFieldFileServer({
      slug,
      locale,
      fieldId,
      email,
      dniOrPassport,
      fileName: file.name || "upload",
      fileBytes,
      fileMime: file.type || "application/octet-stream",
    });

    if (!result.ok) {
      const status =
        result.code === "event_not_found" || result.code === "field_not_found"
          ? 404
          : result.code === "invalid_file"
            ? 400
            : 500;

      return NextResponse.json(
        { ok: false, code: result.code },
        { status, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        path: result.path,
        fileSizeBytes: result.fileSizeBytes,
        fileMimeType: result.fileMimeType,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    logServerException("api/events/field-file", error);
    return NextResponse.json(
      { ok: false, code: "server_error" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
