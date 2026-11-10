import "server-only";

import pg from "pg";
import { readdirSync } from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { openBackup } from "@/lib/pulsar/backup/backupArchive";
import { downloadBackupObject, readBackupJob, writeBackupJob, type BackupJobState } from "@/lib/pulsar/backup/backupJobStore";
import { restoreInstituteBackup } from "@/lib/pulsar/backup/restoreInstituteBackup";
import { tenantRecordFromBackup } from "@/lib/pulsar/backup/tenantRecordFromBackup";
import { logServerActionException, logSupabaseError } from "@/lib/logging/serverActionLog";
import { attachStaffExtraHosts } from "@/lib/pulsar/attachVercelDomain";
import { closeInstituteDataPlane } from "@/lib/pulsar/closeInstituteDataPlane";
import { provisionSharedInstituteSchema } from "@/lib/pulsar/provisionSharedInstituteSchema";
import { mapPulsarTenantToDbPayload } from "@/lib/pulsar/pulsarTenantMapper";
import {
  loadAllPulsarTenantsForAdmin,
  loadPulsarTenantBySlugForAdmin,
} from "@/lib/pulsar/pulsarTenantStore";
import { createPulsarAdminClient, readSharedPulsarCredentials } from "@/lib/supabase/pulsar";

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

export async function runInstituteBackupImport(args: {
  jobId: string;
  ownerId: string;
  email: string;
  objectPath: string;
  passphrase: string;
  locale: string;
}): Promise<void> {
  const job = await readBackupJob(args.jobId);
  if (!job) return;
  const shared = readSharedPulsarCredentials();
  if (!shared) {
    await mark(job, "schema", { status: "error", errorCode: "storage_failed" });
    return;
  }
  try {
    const bytes = await downloadBackupObject(args.objectPath);
    if (!bytes) {
      await mark(job, "storage", { status: "error", errorCode: "file_corrupt" });
      return;
    }
    const opened = await openBackup(bytes, args.passphrase);
    if (!opened.ok) {
      await mark(job, "seal", { status: "error", errorCode: opened.code });
      return;
    }
    const client = new pg.Client({ connectionString: shared.databaseUrl });
    await client.connect();
    const query = async (sql: string, params?: unknown[]) => {
      const result = await client.query(sql, params);
      return { rows: result.rows as Record<string, unknown>[] };
    };
    const admin = createPulsarAdminClient();
    try {
      await mark(job, "rows");
      const restored = await restoreInstituteBackup(opened.files, opened.manifest.lastMigration, {
        query,
        deployedMigrations: readdirSync(path.join(process.cwd(), "supabase/migrations")).filter((name) =>
          name.endsWith(".sql"),
        ),
        slugTaken: async (slug) => Boolean(await loadPulsarTenantBySlugForAdmin(slug)),
        schemaExists: async (schema) => {
          const found = await query("SELECT 1 FROM pg_namespace WHERE nspname = $1", [schema]);
          return found.rows.length > 0;
        },
        occupiedHosts: async () => (await loadAllPulsarTenantsForAdmin()).flatMap((row) => row.hosts),
        existingAuth: async (ids, emails) => {
          if (ids.length === 0 && emails.length === 0) return { ids: [], emails: [] };
          const found = await query(
            "SELECT id::text AS id, email FROM auth.users WHERE id = ANY($1::uuid[]) OR lower(email) = ANY($2::text[])",
            [ids, emails.map((email) => email.toLowerCase())],
          );
          return {
            ids: found.rows.map((row) => String(row.id)),
            emails: found.rows.map((row) => String(row.email ?? "")),
          };
        },
        insertTenant: async (document) => {
          const record = tenantRecordFromBackup(document, shared);
          if (!record) return false;
          const inserted = await admin.from("platform_tenants").insert(mapPulsarTenantToDbPayload(record));
          if (inserted.error) {
            logSupabaseError("pulsar.backup.import", inserted.error, { slug: record.slug });
            return false;
          }
          return true;
        },
        provision: async (schema) => {
          const result = await provisionSharedInstituteSchema({
            databaseUrl: shared.databaseUrl,
            postgresSchema: schema,
            ownerId: args.ownerId,
          });
          return result.ok;
        },
        upload: async (bucket, objectPath, fileBytes) => {
          const stored = await admin.storage.from(bucket).upload(objectPath, fileBytes, { upsert: true });
          return !stored.error;
        },
        attachHosts: async (slug, hosts) => {
          const attached = await attachStaffExtraHosts({ slug, hosts });
          return attached.ok;
        },
        rollback: async (slug) => {
          const tenant = await loadPulsarTenantBySlugForAdmin(slug);
          if (tenant) {
            const fleet = await loadAllPulsarTenantsForAdmin();
            await closeInstituteDataPlane(
              tenant,
              fleet.filter((row) => row.slug !== slug).flatMap((row) => row.hosts),
            );
          }
          await admin.from("platform_tenants").delete().eq("slug", slug);
        },
        imageRoot: process.cwd(),
      });
      if (!restored.ok) {
        await mark(job, "rows", { status: "error", errorCode: restored.code });
        return;
      }
      await mark(job, "done", {
        status: "done",
        imagesSkipped: restored.imagesSkipped,
        current: 1,
        total: 1,
      });
      await admin.from("platform_audit_log").insert({
        actor_user_id: args.ownerId,
        actor_email: args.email,
        action: "tenant.backup.import",
        tenant_slug: opened.manifest.slug,
        changed_fields: ["schema", "auth", "storage"],
      });
      revalidatePath(`/${args.locale}/admin`);
    } finally {
      await client.end().catch(() => undefined);
    }
  } catch (err) {
    logServerActionException("pulsar.backup.import", err, { jobId: args.jobId });
    await mark(job, "rows", { status: "error", errorCode: "schema_load_failed" }).catch(() => undefined);
  }
}
