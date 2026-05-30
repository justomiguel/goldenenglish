import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadEventPaymentReceiptServer } from "@/lib/events/server/uploadEventPaymentReceiptServer";
import { logServerException, logServerWarn } from "@/lib/logging/serverActionLog";

export const runtime = "nodejs";

const ipHits = new Map<string, { count: number; ts: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;

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
    const paymentId = String(form.get("paymentId") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const dniOrPassport = String(form.get("dniOrPassport") ?? "").trim();
    const receipt = form.get("receipt");

    if (!paymentId || !email || !dniOrPassport || !(receipt instanceof File)) {
      logServerWarn("api.events.paymentReceipt", { reason: "invalid_body", slug });
      return NextResponse.json(
        { ok: false, code: "invalid_body" },
        { status: 400, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const fileBytes = Buffer.from(await receipt.arrayBuffer());
    const result = await uploadEventPaymentReceiptServer({
      slug,
      paymentId,
      email,
      dniOrPassport,
      fileName: receipt.name || "receipt",
      fileBytes,
      fileMime: receipt.type || "application/octet-stream",
      uploadedByUserId: user?.id ?? null,
    });

    if (!result.ok) {
      const status =
        result.code === "payment_not_found" || result.code === "identity_mismatch"
          ? 403
          : result.code === "receipt_already_uploaded" ||
              result.code === "payment_not_pending"
            ? 409
            : result.code === "invalid_file"
              ? 400
              : 500;

      return NextResponse.json(
        { ok: false, code: result.code },
        { status, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    return NextResponse.json(
      { ok: true, path: result.path },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    logServerException("api/events/payment-receipt", error);
    return NextResponse.json(
      { ok: false, code: "server_error" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
