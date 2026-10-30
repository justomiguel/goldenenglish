import "server-only";

import pg from "pg";
import { logServerWarn } from "@/lib/logging/serverActionLog";
import type { PulsarTenantRecord } from "@/lib/pulsar/pulsarTenantMapper";
import {
  chartToday,
  fillVisitSeries,
  hitsTableForSchema,
  VISIT_SERIES_DAYS,
  type VisitDayPoint,
} from "@/lib/pulsar/visitDaySeries";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("probe_timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/** Daily visits for one institute. Null means the read failed. */
export async function loadInstituteVisitSeries(
  tenant: PulsarTenantRecord,
): Promise<VisitDayPoint[] | null> {
  const schema = tenant.dataMode === "shared_schema" ? tenant.postgresSchema ?? "" : "public";
  const table = hitsTableForSchema(schema);
  if (!tenant.databaseUrl || !table) return null;
  const client = new pg.Client({
    connectionString: tenant.databaseUrl,
    connectionTimeoutMillis: 4_000,
  });
  try {
    await withTimeout(client.connect(), 4_000);
    const found = await withTimeout(
      client.query<{ day: string; visits: number }>(
        `select to_char((created_at at time zone 'America/Argentina/Cordoba')::date, 'YYYY-MM-DD') as day,
                count(*)::int as visits
         from ${table}
         where created_at >= now() - interval '14 days'
         group by 1`,
      ),
      4_000,
    );
    return fillVisitSeries(
      found.rows.map((row) => ({ day: String(row.day), visits: Number(row.visits) || 0 })),
      chartToday(),
      VISIT_SERIES_DAYS,
    );
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? String(err.code) : "visit_series_failed";
    if (code === "42P01") return fillVisitSeries([], chartToday(), VISIT_SERIES_DAYS);
    logServerWarn("loadInstituteVisitSeries", { slug: tenant.slug, code });
    return null;
  } finally {
    await client.end().catch(() => undefined);
  }
}
