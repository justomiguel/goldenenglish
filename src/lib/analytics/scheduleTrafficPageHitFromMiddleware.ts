import type { NextFetchEvent, NextRequest } from "next/server";
import { shouldRecordPublicTrafficHit } from "@/lib/analytics/trafficMiddlewareRecord";
import {
  clientIpFromHeaders,
  insertTrafficPageHit,
} from "@/lib/analytics/recordTrafficPageHitServer";
import { runWithTenant } from "@/lib/tenant/tenantAls";
import { tenantFromHeaderGet } from "@/lib/tenant/tenantRegistry";

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
  const get = (n: string) => request.headers.get(n);
  if (
    !shouldRecordPublicTrafficHit({
      method: request.method,
      pathname,
      getHeader: get,
    })
  ) {
    return;
  }
  const tenant = tenantFromHeaderGet(get);
  const row = {
    pathname,
    userAgent: get("user-agent"),
    userId,
    referrer: get("referer"),
    geoCountry: get("x-vercel-ip-country"),
    geoRegion: get("x-vercel-ip-country-region"),
    clientIp: clientIpFromHeaders(get),
  };
  event.waitUntil(
    tenant ? runWithTenant(tenant, () => insertTrafficPageHit(row)) : insertTrafficPageHit(row),
  );
}
