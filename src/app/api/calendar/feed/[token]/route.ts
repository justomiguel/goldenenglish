import { NextResponse } from "next/server";
import { buildIcsCalendarFeedResponse } from "@/lib/calendar/buildIcsCalendarFeedResponse";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const r = await buildIcsCalendarFeedResponse(token);
  if (!r.ok) {
    return new NextResponse("", { status: r.status });
  }
  return new NextResponse(r.body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
