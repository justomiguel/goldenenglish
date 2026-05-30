import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadEventForPublicLanding } from "@/lib/dashboard/events/loadEventForPublicLanding";
import { validateEventAttendeePayload } from "@/lib/events/validateEventAttendeePayload";
import { enrollEventAttendeeServer } from "@/lib/events/server/enrollEventAttendeeServer";
import { logServerException } from "@/lib/logging/serverActionLog";

export const runtime = "nodejs";

const ipHits = new Map<string, { count: number; ts: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

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
      return NextResponse.json({ ok: false, code: "rate_limited" }, { status: 429 });
    }

    const { slug } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | {
          captchaToken?: string;
          locale?: string;
          base?: {
            firstName: string;
            lastName: string;
            dniOrPassport: string;
            email: string;
            phone?: string;
            birthDate?: string;
          };
          tutor?: {
            tutorId?: string;
            tutorFirstName?: string;
            tutorLastName?: string;
            tutorDniOrPassport?: string;
            tutorEmail?: string;
            tutorPhone?: string;
            tutorRelationship?: string;
          };
          fieldValues?: Array<{
            fieldId: string;
            valueText?: string;
            valueNumber?: number;
            valueDate?: string;
            fileStoragePath?: string;
            fileSizeBytes?: number;
            fileMimeType?: string;
          }>;
          isLocalResident?: boolean;
          paymentMethod?: string;
        }
      | null;

    if (!body?.base) {
      return NextResponse.json({ ok: false, code: "invalid_body" }, { status: 400 });
    }

    if (!body.captchaToken?.trim()) {
      return NextResponse.json({ ok: false, code: "captcha_required" }, { status: 400 });
    }

    const locale = body.locale?.trim() || "es";
    const supabase = await createClient();
    const event = await loadEventForPublicLanding(supabase, slug, locale);
    if (!event) {
      return NextResponse.json({ ok: false, code: "event_not_found" }, { status: 404 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const validated = validateEventAttendeePayload({
      base: body.base,
      tutor: body.tutor ?? {},
      fieldValues: body.fieldValues ?? [],
      fields: event.fields,
      legalAgeMajority: 18,
    });

    const result = await enrollEventAttendeeServer({
      eventId: event.id,
      userId: user?.id ?? null,
      firstName: validated.base.firstName,
      lastName: validated.base.lastName,
      dniOrPassport: validated.base.dniOrPassport,
      email: validated.base.email,
      phone: validated.base.phone ?? null,
      birthDate: validated.base.birthDate ?? null,
      source: user?.id ? "logged_in" : "public",
      isLocalResident: body.isLocalResident ?? true,
      tutor: validated.tutor,
      fieldValues: validated.fieldValues,
    });

    return NextResponse.json({ ok: true, result }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    logServerException("api/events/enroll", error);
    return NextResponse.json(
      { ok: false, code: "server_error" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
