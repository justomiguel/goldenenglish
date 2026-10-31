import pg, { type Client } from "pg";
import { logServerActionException } from "@/lib/logging/serverActionLog";
import {
  buildProvisionJobSnapshot,
  type ProvisionProgressRecord,
} from "@/lib/pulsar/instituteSchemaProvisionProgressView";
import type { LongJobSnapshot } from "@/types/longJob";

const PROGRESS_SQL = `
CREATE TABLE IF NOT EXISTS institute_migration_ledger.progress (
  schema_name text PRIMARY KEY,
  status text NOT NULL,
  phase text NOT NULL,
  file_name text,
  applied_count integer NOT NULL DEFAULT 0,
  total_count integer NOT NULL DEFAULT 0,
  files text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);`;

const UPSERT_SQL = `
INSERT INTO institute_migration_ledger.progress
  (schema_name, status, phase, file_name, applied_count, total_count, files, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, now())
ON CONFLICT (schema_name) DO UPDATE SET
  status = EXCLUDED.status,
  phase = EXCLUDED.phase,
  file_name = EXCLUDED.file_name,
  applied_count = EXCLUDED.applied_count,
  total_count = EXCLUDED.total_count,
  files = EXCLUDED.files,
  updated_at = now()`;

export function createProvisionProgressWriter(client: Client, schema: string, totalCount: number) {
  const files: string[] = [];
  let appliedCount = 0;
  let lastFile: string | null = null;

  async function write(status: string, phase: string): Promise<void> {
    try {
      await client.query(UPSERT_SQL, [schema, status, phase, lastFile, appliedCount, totalCount, files]);
    } catch (err) {
      logServerActionException("provisionProgress:write", err, { schema, phase });
    }
  }

  return {
    async ensure(): Promise<void> {
      try {
        await client.query(PROGRESS_SQL);
      } catch (err) {
        logServerActionException("provisionProgress:ensure", err, { schema });
      }
      await write("running", "schema");
    },
    async file(fileName: string): Promise<void> {
      lastFile = fileName;
      await write("running", "migration");
    },
    async fileDone(fileName: string): Promise<void> {
      lastFile = fileName;
      files.push(fileName);
      appliedCount = files.length;
      await write("running", "migration");
    },
    async grants(): Promise<void> {
      await write("running", "grants");
    },
    async succeed(): Promise<void> {
      await write("succeeded", "done");
    },
    async fail(fileName: string | null): Promise<void> {
      lastFile = fileName;
      await write("failed", "migration");
    },
  };
}

export async function readInstituteSchemaProvisionSnapshot(schema: string): Promise<LongJobSnapshot> {
  const databaseUrl = process.env.PULSAR_DATABASE_URL?.trim() ?? "";
  if (!databaseUrl) return buildProvisionJobSnapshot(null);
  const client = new pg.Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    const row = await client.query<ProvisionProgressRecord>(
      `SELECT status, phase, file_name, applied_count, total_count, files
       FROM institute_migration_ledger.progress
       WHERE schema_name = $1`,
      [schema],
    );
    return buildProvisionJobSnapshot(row.rows[0] ?? null);
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
    if (code !== "42P01") {
      logServerActionException("readInstituteSchemaProvisionSnapshot", err, { schema });
    }
    return buildProvisionJobSnapshot(null);
  } finally {
    await client.end().catch(() => undefined);
  }
}
