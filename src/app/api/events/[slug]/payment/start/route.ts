import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadPaymentGatewayEncryptionKeyRaw32 } from "@/lib/payment-gateways/loadPaymentGatewayEncryptionKey";
import {
  startEventGatewayPaymentCore,
  type EventGatewayMethod,
} from "@/lib/events/server/startEventGatewayPaymentCore";
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

function isGatewayMethod(value: string): value is EventGatewayMethod {
  return value === "mercadopago" || value === "flow";
}

const PRIVATE_NO_STORE = { "Cache-Control": "private, no-store" } as const;

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const ip = clientIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { ok: false, code: "rate_limited" },
        { status: 429, headers: PRIVATE_NO_STORE },
      );
    }

    const { slug } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | {
          attendeeId?: unknown;
          method?: unknown;
          email?: unknown;
          dniOrPassport?: unknown;
          locale?: unknown;
        }
      | null;

    const attendeeId = String(body?.attendeeId ?? "").trim();
    const method = String(body?.method ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const dniOrPassport = String(body?.dniOrPassport ?? "").trim();
    const localeRaw = String(body?.locale ?? "es").trim();
    const locale = localeRaw === "en" || localeRaw === "pt" ? localeRaw : "es";

    if (!attendeeId || !email || !dniOrPassport || !isGatewayMethod(method)) {
      logServerWarn("api.events.paymentStart", { reason: "invalid_body", slug });
      return NextResponse.json(
        { ok: false, code: "invalid_body" },
        { status: 400, headers: PRIVATE_NO_STORE },
      );
    }

    let encryptionKey32;
    try {
      encryptionKey32 = loadPaymentGatewayEncryptionKeyRaw32();
    } catch (error) {
      logServerException("api/events/payment-start:encryptionKey", error);
      return NextResponse.json(
        { ok: false, code: "server_error" },
        { status: 500, headers: PRIVATE_NO_STORE },
      );
    }

    const result = await startEventGatewayPaymentCore({
      admin: createAdminClient(),
      encryptionKey32,
      slug,
      attendeeId,
      method,
      email,
      dniOrPassport,
      locale,
    });

    if (!result.ok) {
      const status =
        result.code === "payment_not_found" || result.code === "identity_mismatch"
          ? 403
          : result.code === "payment_not_pending"
            ? 409
            : result.code === "currency_unsupported" || result.code === "method_unavailable"
              ? 422
              : 500;
      return NextResponse.json(
        { ok: false, code: result.code },
        { status, headers: PRIVATE_NO_STORE },
      );
    }

    return NextResponse.json(
      { ok: true, redirectUrl: result.redirectUrl },
      { headers: PRIVATE_NO_STORE },
    );
  } catch (error) {
    logServerException("api/events/payment-start", error);
    return NextResponse.json(
      { ok: false, code: "server_error" },
      { status: 500, headers: PRIVATE_NO_STORE },
    );
  }
}
