import "server-only";

import pg from "pg";
import { LANDING_MEDIA_BUCKET } from "@/lib/cms/landingMediaBucket";
import { logServerActionException, logSupabaseError } from "@/lib/logging/serverActionLog";
import type { PulsarTenantRecord } from "@/lib/pulsar/pulsarTenantMapper";
import { createAdminClientFromCredentials } from "@/lib/supabase/admin";
import { removeInstitutePublicImageDir } from "@/lib/tenant/institutePublicImagePack";

const SCHEMA = /^tenant_[a-z0-9_]{1,50}$/;

async function dropSharedSchema(databaseUrl: string, schema: string): Promise<void> {
  const client = new pg.Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function deleteSharedAuthUsers(
  tenant: PulsarTenantRecord,
  schema: string,
): Promise<void> {
  const admin = createAdminClientFromCredentials(
    tenant.supabaseUrl,
    tenant.supabaseServiceRoleKey,
  );
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) break;
    for (const user of data.users) {
      const meta = user.user_metadata as { tenant_schema?: string } | undefined;
      if (meta?.tenant_schema !== schema) continue;
      await admin.auth.admin.deleteUser(user.id);
    }
    if (data.users.length < 200) break;
  }
}

async function removePublicImageObjects(tenant: PulsarTenantRecord): Promise<void> {
  const admin = createAdminClientFromCredentials(
    tenant.supabaseUrl,
    tenant.supabaseServiceRoleKey,
  );
  const prefix =
    tenant.dataMode === "shared_schema" && tenant.postgresSchema
      ? `${tenant.postgresSchema}/institute-public`
      : "institute-public";
  const { data, error } = await admin.storage.from(LANDING_MEDIA_BUCKET).list(prefix, { limit: 100 });
  if (error) {
    logSupabaseError("closeInstitute:storageList", error, { slug: tenant.slug });
    return;
  }
  const paths = (data ?? []).map((file) => `${prefix}/${file.name}`);
  if (paths.length === 0) return;
  const removed = await admin.storage.from(LANDING_MEDIA_BUCKET).remove(paths);
  if (removed.error) {
    logSupabaseError("closeInstitute:storageRemove", removed.error, { slug: tenant.slug });
  }
}

/**
 * Deletes one institute's files and, for a shared schema, that schema.
 * An external Supabase project is left in place.
 */
export async function closeInstituteDataPlane(
  tenant: PulsarTenantRecord,
): Promise<{ ok: true } | { ok: false; errorCode: "db_write_failed" }> {
  try {
    removeInstitutePublicImageDir(process.cwd(), tenant.slug);
  } catch (err) {
    logServerActionException("closeInstitute:images", err, { slug: tenant.slug });
    return { ok: false, errorCode: "db_write_failed" };
  }

  if (tenant.dataMode === "shared_schema") {
    const schema = tenant.postgresSchema ?? "";
    if (!SCHEMA.test(schema) || !tenant.databaseUrl) {
      return { ok: false, errorCode: "db_write_failed" };
    }
    try {
      await dropSharedSchema(tenant.databaseUrl, schema);
      await deleteSharedAuthUsers(tenant, schema);
    } catch (err) {
      logServerActionException("closeInstitute:schema", err, { slug: tenant.slug });
      return { ok: false, errorCode: "db_write_failed" };
    }
  }

  try {
    await removePublicImageObjects(tenant);
  } catch (err) {
    logServerActionException("closeInstitute:storage", err, { slug: tenant.slug });
  }
  return { ok: true };
}
