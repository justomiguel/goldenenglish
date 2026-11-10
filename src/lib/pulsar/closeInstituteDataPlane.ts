import "server-only";

import pg, { type Client } from "pg";
import { LANDING_MEDIA_BUCKET } from "@/lib/cms/landingMediaBucket";
import { logServerActionException, logSupabaseError } from "@/lib/logging/serverActionLog";
import { detachStaffHosts } from "@/lib/pulsar/attachVercelDomain";
import type { PulsarTenantRecord } from "@/lib/pulsar/pulsarTenantMapper";
import { hideSchema } from "@/lib/pulsar/provisionSharedInstituteSchema";
import { collectTenantStoragePaths } from "@/lib/pulsar/backup/collectTenantStoragePaths";
import {
  authUserBelongsToSchema,
  EXTERNAL_FK_SQL,
  EXTERNAL_VIEW_SQL,
  exclusiveTenantHosts,
  INSTITUTE_SCHEMA,
} from "@/lib/pulsar/tenantDeleteScope";
import { createAdminClientFromCredentials } from "@/lib/supabase/admin";
import { removeInstitutePublicImageDir } from "@/lib/tenant/institutePublicImagePack";
import { getPulsarHosts } from "@/lib/tenant/tenantRegistry";

async function otherSchemaDependsOn(client: Client, schema: string): Promise<boolean> {
  const [fks, views] = await Promise.all([
    client.query(EXTERNAL_FK_SQL, [schema]),
    client.query(EXTERNAL_VIEW_SQL, [schema]),
  ]);
  return (fks.rows?.length ?? 0) > 0 || (views.rows?.length ?? 0) > 0;
}

async function dropSharedSchema(databaseUrl: string, schema: string): Promise<void> {
  const client = new pg.Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    if (await otherSchemaDependsOn(client, schema)) {
      throw new Error("external_schema_dependency");
    }
    await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await client
      .query("DELETE FROM institute_migration_ledger.applied WHERE schema_name = $1", [schema])
      .catch(() => undefined);
    await client
      .query("DELETE FROM institute_migration_ledger.progress WHERE schema_name = $1", [schema])
      .catch(() => undefined);
    await hideSchema(client, schema).catch(() => undefined);
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
      if (!authUserBelongsToSchema(user.user_metadata, schema)) continue;
      await admin.auth.admin.deleteUser(user.id);
    }
    if (data.users.length < 200) break;
  }
}

async function removeBucketPaths(
  admin: ReturnType<typeof createAdminClientFromCredentials>,
  bucket: string,
  paths: readonly string[],
  slug: string,
): Promise<void> {
  for (let index = 0; index < paths.length; index += 100) {
    const slice = paths.slice(index, index + 100);
    const removed = await admin.storage.from(bucket).remove([...slice]);
    if (removed.error) {
      logSupabaseError("closeInstitute:storageRemove", removed.error, { slug, bucket });
    }
  }
}

async function removeSharedSchemaObjects(
  admin: ReturnType<typeof createAdminClientFromCredentials>,
  tenant: PulsarTenantRecord,
  schema: string,
): Promise<void> {
  const listed = await admin.storage.listBuckets();
  if (listed.error) {
    logSupabaseError("closeInstitute:storageBuckets", listed.error, { slug: tenant.slug });
  }
  const buckets = (listed.data ?? [])
    .map((bucket) => bucket.id || bucket.name)
    .filter((name): name is string => Boolean(name));
  const targets = buckets.length > 0 ? buckets : [LANDING_MEDIA_BUCKET];
  for (const bucket of targets) {
    const paths = await collectTenantStoragePaths(async (prefix, offset) => {
      const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 100, offset });
      if (error) {
        logSupabaseError("closeInstitute:storageList", error, { slug: tenant.slug, bucket });
        return [];
      }
      return data ?? [];
    }, schema);
    await removeBucketPaths(admin, bucket, paths, tenant.slug);
  }
}

async function removePublicImageObjects(tenant: PulsarTenantRecord): Promise<void> {
  const admin = createAdminClientFromCredentials(
    tenant.supabaseUrl,
    tenant.supabaseServiceRoleKey,
  );
  if (tenant.dataMode === "shared_schema") {
    const schema = tenant.postgresSchema ?? "";
    if (!INSTITUTE_SCHEMA.test(schema)) return;
    await removeSharedSchemaObjects(admin, tenant, schema);
    return;
  }
  const prefix = "institute-public";
  const { data, error } = await admin.storage.from(LANDING_MEDIA_BUCKET).list(prefix, { limit: 100 });
  if (error) {
    logSupabaseError("closeInstitute:storageList", error, { slug: tenant.slug });
    return;
  }
  const paths = (data ?? []).flatMap((file) =>
    file.name && !file.name.includes("/") && !file.name.includes("..") ? [`${prefix}/${file.name}`] : [],
  );
  await removeBucketPaths(admin, LANDING_MEDIA_BUCKET, paths, tenant.slug);
}

/**
 * Deletes one institute's files and, for a shared schema, that schema.
 * An external Supabase project is left in place.
 */
export async function closeInstituteDataPlane(
  tenant: PulsarTenantRecord,
  occupiedHosts: readonly string[] = [],
): Promise<{ ok: true } | { ok: false; errorCode: "db_write_failed" }> {
  try {
    removeInstitutePublicImageDir(process.cwd(), tenant.slug);
  } catch (err) {
    logServerActionException("closeInstitute:images", err, { slug: tenant.slug });
    return { ok: false, errorCode: "db_write_failed" };
  }

  if (tenant.dataMode === "shared_schema") {
    const schema = tenant.postgresSchema ?? "";
    if (!INSTITUTE_SCHEMA.test(schema) || !tenant.databaseUrl) {
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

  try {
    await detachStaffHosts(
      exclusiveTenantHosts({
        hosts: tenant.hosts,
        occupiedHosts,
        platformHosts: getPulsarHosts(),
      }),
    );
  } catch (err) {
    logServerActionException("closeInstitute:vercel", err, { slug: tenant.slug });
  }
  return { ok: true };
}
