import { classifyTrafficVisitor } from "@/lib/analytics/classifyTrafficVisitor";
import { anonymizeIp } from "@/lib/analytics/sanitizeMetadata";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  logServerException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

function truncate(s: string | null, max: number): string | null {
  if (!s) return null;
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max)}...`;
}

export function clientIpFromHeaders(getHeader: (name: string) => string | null): string | null {
  const xf = getHeader("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    return first || null;
  }
  return getHeader("x-real-ip");
}

export interface TrafficPageHitInsert {
  pathname: string;
  userAgent: string | null;
  userId: string | null;
  referrer: string | null;
  geoCountry: string | null;
  geoRegion: string | null;
  clientIp: string | null;
}

/**
 * Persists one traffic row (server-only, service role).
 * Returns `ok: false` when misconfigured; logs insert errors.
 */
export async function insertTrafficPageHit(
  row: TrafficPageHitInsert,
): Promise<{ ok: true } | { ok: false; error: { message: string } }> {
  const ua = row.userAgent ?? "";
  const kind = classifyTrafficVisitor(ua, row.userId);
  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    logServerException("insertTrafficPageHit:noAdminClient", err);
    return { ok: false, error: { message: "server_misconfigured" } };
  }
  const ip = anonymizeIp(row.clientIp);
  const { error } = await admin.from("traffic_page_hits").insert({
    visitor_kind: kind,
    user_id: row.userId,
    pathname: row.pathname,
    referrer: truncate(row.referrer, 400),
    user_agent: truncate(ua, 600),
    geo_country: row.geoCountry?.trim() || null,
    geo_region: row.geoRegion?.trim() || null,
    client_ip: ip,
  });
  if (error) {
    logSupabaseClientError("insertTrafficPageHit:insert", error, { pathname: row.pathname });
    return { ok: false, error: { message: error.message ?? "insert_failed" } };
  }
  return { ok: true };
}
