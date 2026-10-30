import "server-only";

import { readdirSync } from "node:fs";
import path from "node:path";
import pg from "pg";
import { listVercelProjectDomainNames } from "@/lib/pulsar/attachVercelDomain";
import {
  buildFleetSiteReview,
  markerVersionForGenericTheme,
  productMigrationHead,
  type FleetSiteReview,
} from "@/lib/pulsar/fleetSiteReview";
import type { PulsarTenantRecord } from "@/lib/pulsar/pulsarTenantMapper";
import { logServerWarn } from "@/lib/logging/serverActionLog";
import { createPulsarAdminClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";
import { createAdminClientFromCredentials } from "@/lib/supabase/admin";

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");

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

function productFiles(): string[] {
  try {
    return readdirSync(MIGRATIONS_DIR);
  } catch {
    return [];
  }
}

async function ledgerVersions(databaseUrl: string, schemaName: string): Promise<string[]> {
  const client = new pg.Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 4_000,
  });
  try {
    await withTimeout(client.connect(), 4_000);
    const found = await withTimeout(
      client.query<{ version: string }>(
        "select version from institute_migration_ledger.applied where schema_name = $1",
        [schemaName],
      ),
      4_000,
    );
    return found.rows.map((row) => String(row.version));
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err ? String(err.code) : "ledger_failed";
    if (code !== "42P01") logServerWarn("loadPulsarFleetReview:ledger", { schemaName, code });
    return [];
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function genericThemePresent(tenant: PulsarTenantRecord): Promise<boolean> {
  if (tenant.dataMode === "shared_schema") return false;
  try {
    const client = createAdminClientFromCredentials(tenant.supabaseUrl, tenant.supabaseServiceRoleKey);
    const res = await client.from("site_themes").select("slug").eq("slug", "generic-deportes").maybeSingle();
    return Boolean(res.data && !res.error);
  } catch {
    return false;
  }
}

async function ownerFacts(): Promise<{
  links: { tenantSlug: string; ownerUserId: string }[];
  emails: Map<string, string>;
}> {
  if (!isPulsarSupabaseConfigured()) return { links: [], emails: new Map() };
  const admin = createPulsarAdminClient();
  const [linkRes, ownerRes] = await Promise.all([
    admin.from("platform_tenant_owners").select("tenant_slug, owner_user_id").limit(200),
    admin.from("platform_owners").select("user_id, email").limit(200),
  ]);
  if (linkRes.error) logServerWarn("loadPulsarFleetReview:owners", { code: linkRes.error.code ?? "links" });
  const links = (linkRes.data ?? []).map((row) => ({
    tenantSlug: String(row.tenant_slug),
    ownerUserId: String(row.owner_user_id),
  }));
  const emails = new Map<string, string>();
  for (const row of ownerRes.data ?? []) {
    emails.set(String(row.user_id), String(row.email));
  }
  return { links, emails };
}

/** Fleet facts for the sites table. A failed probe does not fail the page. */
export async function loadPulsarFleetReview(
  tenants: readonly PulsarTenantRecord[],
  platformHosts: readonly string[],
): Promise<Record<string, FleetSiteReview>> {
  const files = productFiles();
  const head = productMigrationHead(files);
  const token = process.env.VERCEL_TOKEN?.trim() ?? "";
  const projectId = process.env.VERCEL_PROJECT_ID?.trim() ?? "";
  const vercelConfigured = Boolean(token && projectId);
  const [owners, vercelNames] = await Promise.all([
    ownerFacts(),
    vercelConfigured
      ? listVercelProjectDomainNames({
          token,
          projectId,
          teamId: process.env.VERCEL_TEAM_ID,
        })
      : Promise.resolve(null),
  ]);
  const usedByOwner = new Map<string, number>();
  for (const link of owners.links) {
    usedByOwner.set(link.ownerUserId, (usedByOwner.get(link.ownerUserId) ?? 0) + 1);
  }
  const rows = await Promise.all(
    tenants.map(async (tenant) => {
      const schemaName = tenant.dataMode === "shared_schema" ? tenant.postgresSchema ?? "public" : "public";
      const [versions, themePresent] = await Promise.all([
        tenant.databaseUrl ? ledgerVersions(tenant.databaseUrl, schemaName) : Promise.resolve([]),
        genericThemePresent(tenant),
      ]);
      const link = owners.links.find((item) => item.tenantSlug === tenant.slug);
      const ownerEmail = link ? owners.emails.get(link.ownerUserId) ?? null : null;
      return [
        tenant.slug,
        buildFleetSiteReview({
          dataMode: tenant.dataMode,
          postgresSchema: tenant.postgresSchema,
          hosts: tenant.hosts,
          slug: tenant.slug,
          platformHosts,
          migrationHead: head,
          ledgerVersions: versions,
          markerVersion: markerVersionForGenericTheme(files, themePresent),
          vercelNames,
          vercelConfigured,
          ownerEmail,
          ownerUsed: link ? usedByOwner.get(link.ownerUserId) ?? 0 : null,
        }),
      ] as const;
    }),
  );
  return Object.fromEntries(rows);
}
