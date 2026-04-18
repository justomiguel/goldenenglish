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
      /**
       * `private` so shared caches (CDN, corporate proxy, ISP) cannot store
       * one user's calendar and serve it to another client that happens to
       * request the same token URL. The token alone is the access credential
       * (OWASP A02 — sensitive data exposure via caches).
       */
      "Cache-Control": "private, max-age=300",
    },
  });
}
