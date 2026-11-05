import { NextResponse } from "next/server";
import { prepareEventRegistrationUpload } from "@/lib/events/server/prepareEventRegistrationUpload";
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
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "default")
    .trim()
    .toLowerCase();
  const xf = request.headers.get("x-forwarded-for");
  const ip = xf
    ? (xf.split(",")[0]?.trim() ?? "unknown")
    : (request.headers.get("x-real-ip")?.trim() ?? "unknown");
  return `${host}|${ip}`;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const ip = clientIp(request);
    if (isRateLimited(ip)) {
      await logServerWarn("api.events.uploadUrl", { reason: "rate_limited" });
      return NextResponse.json(
        { ok: false, code: "rate_limited" },
        { status: 429, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const { slug } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | {
          email?: string;
          dniOrPassport?: string;
          locale?: string;
          fileName?: string;
          mimeType?: string;
          byteSize?: number;
          kind?: string;
          fieldId?: string;
        }
      | null;

    if (!body || (body.kind !== "receipt" && body.kind !== "field")) {
      await logServerWarn("api.events.uploadUrl", { reason: "invalid_body", slug });
      return NextResponse.json(
        { ok: false, code: "invalid_body" },
        { status: 400, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const result = await prepareEventRegistrationUpload({
      slug,
      locale: body.locale?.trim() || "es",
      email: String(body.email ?? ""),
      dniOrPassport: String(body.dniOrPassport ?? ""),
      fileName: String(body.fileName ?? ""),
      mimeType: String(body.mimeType ?? ""),
      byteSize: Number(body.byteSize ?? 0),
      kind: body.kind,
      fieldId: body.fieldId ?? null,
    });

    if (!result.ok) {
      const status =
        result.code === "event_not_found" || result.code === "field_not_found"
          ? 404
          : result.code === "sign_failed"
            ? 500
            : 400;
      return NextResponse.json(
        { ok: false, code: result.code },
        { status, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    return NextResponse.json(
      { ok: true, path: result.path, token: result.token },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    logServerException("api/events/upload-url", error);
    return NextResponse.json(
      { ok: false, code: "server_error" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
