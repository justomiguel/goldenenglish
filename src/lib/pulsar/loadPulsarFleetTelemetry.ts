import { logServerWarn } from "@/lib/logging/serverActionLog";
import type { PulsarTenantRecord } from "@/lib/pulsar/pulsarTenantMapper";
import { createAdminClientFromCredentials } from "@/lib/supabase/admin";

export type TenantTelemetrySnapshot = {
  slug: string;
  status: "online" | "error";
  latencyMs: number | null;
  visits7d: number | null;
  visits30d: number | null;
  lastHitAt: string | null;
  errorCode: string | null;
};

const PROBE_TIMEOUT_MS = 4_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("probe_timeout")), ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export async function probeSingleTenantConnection(
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<{ ok: boolean; latencyMs: number; errorCode: string | null }> {
  const start = Date.now();
  try {
    const client = createAdminClientFromCredentials(supabaseUrl, serviceRoleKey);
    const res = await withTimeout(
      Promise.resolve(
        client.from("site_themes").select("id", { count: "exact", head: true }),
      ),
      PROBE_TIMEOUT_MS,
    );
    const latencyMs = Date.now() - start;
    if (res.error) {
      return {
        ok: false,
        latencyMs,
        errorCode: String(res.error.code || res.error.message || "db_error"),
      };
    }
    return { ok: true, latencyMs, errorCode: null };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const errorCode = err instanceof Error ? err.message : "connection_failed";
    return { ok: false, latencyMs, errorCode };
  }
}

async function probeTenantTelemetry(tenant: PulsarTenantRecord): Promise<TenantTelemetrySnapshot> {
  const start = Date.now();
  const now = Date.now();
  const since7dIso = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const since30dIso = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  const client = createAdminClientFromCredentials(
    tenant.supabaseUrl,
    tenant.supabaseServiceRoleKey,
  );

  const work = async (): Promise<TenantTelemetrySnapshot> => {
    const pingRes = await client
      .from("site_themes")
      .select("id", { count: "exact", head: true });
    const latencyMs = Date.now() - start;

    if (pingRes.error) {
      const code = String(pingRes.error.code || pingRes.error.message || "db_error");
      logServerWarn("loadPulsarFleetTelemetry:ping_error", {
        slug: tenant.slug,
        errorCode: code,
      });
      return {
        slug: tenant.slug,
        status: "error",
        latencyMs,
        visits7d: null,
        visits30d: null,
        lastHitAt: null,
        errorCode: code,
      };
    }

    const [hits7dRes, hits30dRes, lastHitRes] = await Promise.all([
      client
        .from("traffic_page_hits")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since7dIso),
      client
        .from("traffic_page_hits")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since30dIso),
      client
        .from("traffic_page_hits")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    return {
      slug: tenant.slug,
      status: "online",
      latencyMs,
      visits7d: hits7dRes.error ? 0 : (hits7dRes.count ?? 0),
      visits30d: hits30dRes.error ? 0 : (hits30dRes.count ?? 0),
      lastHitAt:
        !lastHitRes.error && lastHitRes.data && typeof lastHitRes.data.created_at === "string"
          ? lastHitRes.data.created_at
          : null,
      errorCode: null,
    };
  };

  return withTimeout(work(), PROBE_TIMEOUT_MS);
}

export async function loadPulsarFleetTelemetry(
  tenants: readonly PulsarTenantRecord[],
): Promise<Record<string, TenantTelemetrySnapshot>> {
  const settled = await Promise.allSettled(
    tenants.map((tenant) => probeTenantTelemetry(tenant)),
  );
  const out: Record<string, TenantTelemetrySnapshot> = {};
  tenants.forEach((tenant, idx) => {
    const item = settled[idx];
    if (item && item.status === "fulfilled") {
      out[tenant.slug] = item.value;
    } else {
      const reason =
        item && item.status === "rejected" && item.reason instanceof Error
          ? item.reason.message
          : "probe_failed";
      logServerWarn("loadPulsarFleetTelemetry:probe_rejected", {
        slug: tenant.slug,
        reason,
      });
      out[tenant.slug] = {
        slug: tenant.slug,
        status: "error",
        latencyMs: null,
        visits7d: null,
        visits30d: null,
        lastHitAt: null,
        errorCode: reason,
      };
    }
  });
  return out;
}
