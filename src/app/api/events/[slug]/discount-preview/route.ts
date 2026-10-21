import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loadEventForPublicLanding } from "@/lib/dashboard/events/loadEventForPublicLanding";
import { previewEventDiscountCode } from "@/lib/events/server/previewEventDiscountCode";
import { resolveEventPriceForResidency } from "@/lib/events/resolveEventPriceTier";
import { logServerException } from "@/lib/logging/serverActionLog";

export const runtime = "nodejs";

const bodySchema = z.object({
  code: z.string().trim().min(1).max(32),
  flowId: z.string().uuid().optional(),
  isLocalResident: z.boolean().optional(),
  locale: z.string().optional(),
});

const PRIVATE = { "Cache-Control": "private, no-store" };

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, code: "invalid_code" }, { status: 400, headers: PRIVATE });
    }

    const supabase = await createClient();
    const event = await loadEventForPublicLanding(supabase, slug, parsed.data.locale ?? "es");
    if (!event) {
      return NextResponse.json({ ok: false, code: "invalid_code" }, { status: 404, headers: PRIVATE });
    }

    const flow = event.priceByFlow
      ? event.flows.find((item) => item.id === parsed.data.flowId)
      : null;
    const amount = event.priceByFlow
      ? (flow?.price ?? 0)
      : (resolveEventPriceForResidency(
          {
            price: event.price,
            priceLocal: event.priceLocal,
            priceNonLocal: event.priceNonLocal,
          },
          parsed.data.isLocalResident ?? true,
        ) ?? 0);

    const result = await previewEventDiscountCode(createAdminClient(), {
      eventId: event.id,
      code: parsed.data.code,
      amount,
      currency: event.currency,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 422, headers: PRIVATE });
  } catch (error) {
    logServerException("api/events/discount-preview", error);
    return NextResponse.json({ ok: false, code: "server_error" }, { status: 500, headers: PRIVATE });
  }
}
