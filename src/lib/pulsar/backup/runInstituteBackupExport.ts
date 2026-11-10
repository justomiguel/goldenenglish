import "server-only";

import pg from "pg";
import { backupFileName, packBackupFiles, sealBackup } from "@/lib/pulsar/backup/backupArchive";
import { buildInstituteBackupFiles, type SqlQuery } from "@/lib/pulsar/backup/buildInstituteBackup";
import {
  readBackupJob,
  signBackupObject,
  uploadBackupObject,
  writeBackupJob,
  type BackupJobState,
} from "@/lib/pulsar/backup/backupJobStore";
import { tenantBackupDocument } from "@/lib/pulsar/backup/tenantBackupDocument";
import { logServerActionException } from "@/lib/logging/serverActionLog";
import { loadPulsarTenantBySlugForAdmin } from "@/lib/pulsar/pulsarTenantStore";
import { createAdminClientFromCredentials } from "@/lib/supabase/admin";
import { createPulsarAdminClient } from "@/lib/supabase/pulsar";

async function mark(job: BackupJobState, code: string, patch: Partial<BackupJobState> = {}): Promise<void> {
  const next: BackupJobState = {
    ...job,
    ...patch,
    activity: [...job.activity, { t: Date.now(), code }].slice(-80),
    updatedAt: Date.now(),
  };
  await writeBackupJob(next);
  Object.assign(job, next);
}

export async function runInstituteBackupExport(args: {
  jobId: string;
  ownerId: string;
  email: string;
  slug: string;
  passphrase: string;
}): Promise<void> {
  const job = await readBackupJob(args.jobId);
  if (!job) return;
  try {
    const tenant = await loadPulsarTenantBySlugForAdmin(args.slug);
    if (!tenant?.databaseUrl || tenant.dataMode !== "shared_schema" || !tenant.postgresSchema) {
      await mark(job, "schema", { status: "error", errorCode: "not_shared_schema" });
      return;
    }
    await mark(job, "schema");
    const client = new pg.Client({ connectionString: tenant.databaseUrl });
    await client.connect();
    const query: SqlQuery = async (sql, params) => {
      const result = await client.query(sql, params);
      return { rows: result.rows as Record<string, unknown>[] };
    };
    const storage = createAdminClientFromCredentials(tenant.supabaseUrl, tenant.supabaseServiceRoleKey);
    const buckets = await storage.storage.listBuckets();
    const names = (buckets.data ?? []).map((bucket) => bucket.id || bucket.name).filter(Boolean);
    try {
      await mark(job, "auth");
      await mark(job, "storage");
      const built = await buildInstituteBackupFiles({
        query,
        schema: tenant.postgresSchema,
        tenantJson: JSON.stringify(tenantBackupDocument(tenant)),
        buckets: names.length > 0 ? names : ["landing-media"],
        listStorage: async (bucket, prefix, offset) => {
          const listed = await storage.storage.from(bucket).list(prefix, { limit: 100, offset });
          return listed.data ?? [];
        },
        downloadStorage: async (bucket, objectPath) => {
          const file = await storage.storage.from(bucket).download(objectPath);
          if (file.error || !file.data) return null;
          return new Uint8Array(await file.data.arrayBuffer());
        },
      });
      await mark(job, "seal");
      const sealed = await sealBackup(
        packBackupFiles(built.files, {
          slug: tenant.slug,
          exportedAt: new Date().toISOString(),
          actorId: args.ownerId,
          lastMigration: built.lastMigration,
        }),
        args.passphrase,
      );
      const objectPath = `ready/${args.jobId}.cbk`;
      const stored = await uploadBackupObject(objectPath, sealed, "application/octet-stream");
      if (!stored) {
        await mark(job, "storage", { status: "error", errorCode: "storage_failed" });
        return;
      }
      const downloadUrl = await signBackupObject(objectPath);
      await mark(job, "done", {
        status: "done",
        downloadUrl: downloadUrl ?? undefined,
        downloadName: backupDownloadName(tenant.slug),
        current: 1,
        total: 1,
      });
      await createPulsarAdminClient().from("platform_audit_log").insert({
        actor_user_id: args.ownerId,
        actor_email: args.email,
        action: "tenant.backup.export",
        tenant_slug: tenant.slug,
        changed_fields: ["schema", "auth", "storage"],
      });
    } finally {
      await client.end().catch(() => undefined);
    }
  } catch (err) {
    logServerActionException("pulsar.backup.export", err, { slug: args.slug, jobId: args.jobId });
    await mark(job, "schema", { status: "error", errorCode: "schema_load_failed" }).catch(() => undefined);
  }
}

export function backupDownloadName(slug: string): string {
  return backupFileName(slug, new Date());
}
