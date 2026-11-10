import { rowsToNdjson, selectPageSql } from "@/lib/pulsar/backup/backupSql";
import { collectTenantStoragePaths } from "@/lib/pulsar/backup/collectTenantStoragePaths";
import type { StorageListItem } from "@/lib/pulsar/backup/collectTenantStoragePaths";

export type SqlQuery = (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;

function textFile(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function cell(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) {
    return { __bytea: value.toString("base64") };
  }
  return value;
}

function pageRow(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, cell(value)]));
}

async function tableNames(query: SqlQuery, schema: string): Promise<string[]> {
  const listed = await query(
    `SELECT c.relname AS name
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = $1 AND c.relkind = 'r'
     ORDER BY c.relname`,
    [schema],
  );
  return listed.rows.map((row) => String(row.name));
}

async function columns(query: SqlQuery, schema: string, table: string): Promise<string[]> {
  const listed = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2
     ORDER BY ordinal_position`,
    [schema, table],
  );
  return listed.rows.map((row) => String(row.column_name));
}

async function tableNdjson(query: SqlQuery, schema: string, table: string, cols: string[]): Promise<string> {
  const rows: Record<string, unknown>[] = [];
  for (let offset = 0; offset < 1_000_000; offset += 1000) {
    const page = await query(selectPageSql(schema, table, cols, 1000, offset));
    rows.push(...page.rows.map(pageRow));
    if (page.rows.length < 1000) break;
  }
  return rowsToNdjson(rows);
}

export async function buildInstituteBackupFiles(input: {
  query: SqlQuery;
  schema: string;
  tenantJson: string;
  buckets: readonly string[];
  listStorage: (bucket: string, prefix: string, offset: number) => Promise<StorageListItem[]>;
  downloadStorage: (bucket: string, path: string) => Promise<Uint8Array | null>;
}): Promise<{ files: Record<string, Uint8Array>; lastMigration: string | null }> {
  const ledger = await input.query(
    `SELECT file_name FROM institute_migration_ledger.applied
     WHERE schema_name = $1 ORDER BY version DESC LIMIT 1`,
    [input.schema],
  );
  const lastMigration = ledger.rows[0]?.file_name ? String(ledger.rows[0].file_name) : null;
  const files: Record<string, Uint8Array> = {
    "tenant.json": textFile(input.tenantJson),
  };
  for (const table of await tableNames(input.query, input.schema)) {
    const cols = await columns(input.query, input.schema, table);
    if (cols.length === 0) continue;
    files[`schema/${table}.ndjson`] = textFile(await tableNdjson(input.query, input.schema, table, cols));
  }
  const users = await input.query(
    `SELECT id, email, encrypted_password, raw_user_meta_data, raw_app_meta_data
     FROM auth.users
     WHERE COALESCE(raw_user_meta_data->>'tenant_schema', '') = $1`,
    [input.schema],
  );
  files["auth/users.ndjson"] = textFile(rowsToNdjson(users.rows.map(pageRow)));
  const ids = users.rows.map((row) => String(row.id));
  const identities = ids.length
    ? await input.query(
        `SELECT id, user_id, identity_data, provider, provider_id
         FROM auth.identities WHERE user_id = ANY($1::uuid[])`,
        [ids],
      )
    : { rows: [] };
  files["auth/identities.ndjson"] = textFile(rowsToNdjson(identities.rows.map(pageRow)));
  for (const bucket of input.buckets) {
    const paths = await collectTenantStoragePaths(
      (prefix, offset) => input.listStorage(bucket, prefix, offset),
      input.schema,
    );
    for (const path of paths) {
      const bytes = await input.downloadStorage(bucket, path);
      if (!bytes) continue;
      files[`storage/${bucket}/${path}`] = bytes;
    }
  }
  return { files, lastMigration };
}
