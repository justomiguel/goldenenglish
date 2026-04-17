import type { NextFetchEvent, NextRequest } from "next/server";
import { shouldRecordPublicTrafficHit } from "@/lib/analytics/trafficMiddlewareRecord";
import {
  clientIpFromHeaders,
  insertTrafficPageHit,
} from "@/lib/analytics/recordTrafficPageHitServer";

/**
 * Records one `traffic_page_hits` row after the response is sent (Edge `waitUntil`).
 * Captures crawlers and headless clients that never run the in-browser beacon.
 */
export function scheduleTrafficPageHitFromMiddleware(
  request: NextRequest,
  userId: string | null,
  event: NextFetchEvent,
): void {
  const pathname = request.nextUrl.pathname;
  if (
    !shouldRecordPublicTrafficHit({
      method: request.method,
      pathname,
      getHeader: (n) => request.headers.get(n),
    })
  ) {
    return;
  }
  const get = (n: string) => request.headers.get(n);
  event.waitUntil(
    insertTrafficPageHit({
      pathname,
      userAgent: get("user-agent"),
      userId,
      referrer: get("referer"),
      geoCountry: get("x-vercel-ip-country"),
      geoRegion: get("x-vercel-ip-country-region"),
      clientIp: clientIpFromHeaders(get),
    }),
  );
}
