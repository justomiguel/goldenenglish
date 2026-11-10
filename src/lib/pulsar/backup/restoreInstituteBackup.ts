import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { LANDING_MEDIA_BUCKET } from "@/lib/cms/landingMediaBucket";
import { columnPlan, insertRowSql, parseNdjson, quoteIdent } from "@/lib/pulsar/backup/backupSql";
import { restoreRefusal, type RestoreFacts } from "@/lib/pulsar/backup/backupPreflight";
import { tableLoadOrder } from "@/lib/pulsar/backup/tableLoadOrder";
import type { SqlQuery } from "@/lib/pulsar/backup/buildInstituteBackup";

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,62})$/;

export type RestorePorts = {
  query: SqlQuery;
  slugTaken: (slug: string) => Promise<boolean>;
  schemaExists: (schema: string) => Promise<boolean>;
  occupiedHosts: () => Promise<string[]>;
  existingAuth: (ids: string[], emails: string[]) => Promise<{ ids: string[]; emails: string[] }>;
  deployedMigrations: readonly string[];
  insertTenant: (document: Record<string, unknown>) => Promise<boolean>;
  provision: (schema: string) => Promise<boolean>;
  upload: (bucket: string, objectPath: string, bytes: Uint8Array) => Promise<boolean>;
  attachHosts: (slug: string, hosts: string[]) => Promise<boolean>;
  rollback: (slug: string, schema: string) => Promise<void>;
  imageRoot?: string | null;
};

function decode(bytes: Uint8Array | undefined): string {
  return new TextDecoder().decode(bytes ?? new Uint8Array());
}

function revive(value: unknown): unknown {
  if (value && typeof value === "object" && "__bytea" in value) {
    const encoded = (value as { __bytea?: unknown }).__bytea;
    if (typeof encoded === "string") return Buffer.from(encoded, "base64");
  }
  return value;
}

function authRows(files: Record<string, Uint8Array>, name: string): Record<string, unknown>[] {
  return parseNdjson(decode(files[name]));
}

async function loadFacts(
  ports: RestorePorts,
  document: Record<string, unknown>,
  files: Record<string, Uint8Array>,
  lastMigration: string | null,
): Promise<RestoreFacts> {
  const users = authRows(files, "auth/users.ndjson");
  const ids = users.map((row) => String(row.id ?? ""));
  const emails = users.map((row) => String(row.email ?? ""));
  const existing = await ports.existingAuth(ids, emails);
  const hosts = Array.isArray(document.hosts) ? document.hosts.map(String) : [];
  return {
    lastMigration,
    deployedMigrations: ports.deployedMigrations,
    slugTaken: await ports.slugTaken(String(document.slug)),
    schemaExists: await ports.schemaExists(String(document.postgresSchema)),
    hosts,
    occupiedHosts: await ports.occupiedHosts(),
    authIds: ids,
    existingAuthIds: existing.ids,
    authEmails: emails,
    existingAuthEmails: existing.emails,
  };
}

async function foreignKeys(query: SqlQuery, schema: string) {
  const listed = await query(
    `SELECT src.relname AS src, ref.relname AS ref
     FROM pg_constraint con
     JOIN pg_class src ON src.oid = con.conrelid
     JOIN pg_class ref ON ref.oid = con.confrelid
     JOIN pg_namespace n ON n.oid = src.relnamespace
     WHERE n.nspname = $1 AND con.contype = 'f'`,
    [schema],
  );
  const byTable = new Map<string, string[]>();
  for (const row of listed.rows) {
    const src = String(row.src);
    const refs = byTable.get(src) ?? [];
    refs.push(String(row.ref));
    byTable.set(src, refs);
  }
  return byTable;
}

async function liveColumns(query: SqlQuery, schema: string, table: string): Promise<string[]> {
  const listed = await query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2
     ORDER BY ordinal_position`,
    [schema, table],
  );
  return listed.rows.map((row) => String(row.column_name));
}

function writeImage(root: string, slug: string, fileName: string, bytes: Uint8Array): "written" | "skipped" {
  if (!SLUG.test(slug) || !/^[a-z0-9._-]+$/i.test(fileName)) return "skipped";
  try {
    const dir = path.join(root, "public", "images", slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, fileName), bytes);
    return "written";
  } catch {
    return "skipped";
  }
}

async function loadTables(
  query: SqlQuery,
  schema: string,
  files: Record<string, Uint8Array>,
): Promise<{ ok: true } | { ok: false; code: "schema_load_failed" }> {
  const tables = Object.keys(files)
    .filter((name) => name.startsWith("schema/") && name.endsWith(".ndjson"))
    .map((name) => name.slice("schema/".length, -".ndjson".length));
  const fks = await foreignKeys(query, schema);
  const ordered = tableLoadOrder(tables.map((name) => ({ name, references: fks.get(name) ?? [] })));
  try {
    await query("SET session_replication_role = replica");
  } catch {
    // The role may not allow this. FK order still applies.
  }
  for (const table of ordered) {
    const rows = parseNdjson(decode(files[`schema/${table}.ndjson`]));
    if (rows.length === 0) continue;
    const fileColumns = Object.keys(rows[0] ?? {});
    const plan = columnPlan(fileColumns, await liveColumns(query, schema, table));
    if (!plan.ok) return plan;
    for (const row of rows) {
      const values = plan.insert.map((column) => revive(row[column]));
      await query(insertRowSql(schema, table, plan.insert), values);
    }
    if (plan.insert.includes("id")) {
      await query(
        `SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT MAX(id) FROM ${quoteIdent(schema)}.${quoteIdent(table)}), 1), true)`,
        [`${schema}.${table}`],
      ).catch(() => undefined);
    }
  }
  return { ok: true };
}

async function loadAuth(query: SqlQuery, files: Record<string, Uint8Array>): Promise<boolean> {
  const users = authRows(files, "auth/users.ndjson");
  const identities = authRows(files, "auth/identities.ndjson");
  try {
    for (const row of users) {
      const columns = ["id", "email", "encrypted_password", "raw_user_meta_data", "raw_app_meta_data"].filter(
        (column) => column in row,
      );
      await query(insertRowSql("auth", "users", columns), columns.map((column) => revive(row[column])));
    }
    for (const row of identities) {
      const columns = ["id", "user_id", "identity_data", "provider", "provider_id"].filter(
        (column) => column in row,
      );
      await query(insertRowSql("auth", "identities", columns), columns.map((column) => revive(row[column])));
    }
    return true;
  } catch {
    return false;
  }
}

export async function restoreInstituteBackup(
  files: Record<string, Uint8Array>,
  lastMigration: string | null,
  ports: RestorePorts,
): Promise<{ ok: true; imagesSkipped: boolean } | { ok: false; code: string }> {
  const document = JSON.parse(decode(files["tenant.json"])) as Record<string, unknown>;
  const slug = String(document.slug ?? "");
  const schema = String(document.postgresSchema ?? "");
  const refusal = restoreRefusal(await loadFacts(ports, document, files, lastMigration));
  if (refusal) return { ok: false, code: refusal };
  const inserted = await ports.insertTenant(document);
  if (!inserted) return { ok: false, code: "schema_load_failed" };
  const fail = async (code: string) => {
    await ports.rollback(slug, schema);
    return { ok: false as const, code };
  };
  if (!(await ports.provision(schema))) return fail("schema_load_failed");
  try {
    const loaded = await loadTables(ports.query, schema, files);
    if (!loaded.ok) return fail(loaded.code);
  } catch {
    return fail("schema_load_failed");
  }
  if (!(await loadAuth(ports.query, files))) return fail("auth_load_failed");
  let imagesSkipped = false;
  for (const [name, bytes] of Object.entries(files)) {
    if (!name.startsWith("storage/") || name.endsWith("/")) continue;
    const rest = name.slice("storage/".length);
    const slash = rest.indexOf("/");
    if (slash < 1) continue;
    const bucket = rest.slice(0, slash);
    const objectPath = rest.slice(slash + 1);
    if (!(await ports.upload(bucket, objectPath, bytes))) return fail("storage_failed");
    const image = objectPath.match(/^tenant_[a-z0-9_]+\/institute-public\/([^/]+)$/);
    if (bucket === LANDING_MEDIA_BUCKET && image) {
      const wrote = ports.imageRoot
        ? writeImage(ports.imageRoot, slug, image[1] ?? "", bytes)
        : "skipped";
      if (wrote === "skipped") imagesSkipped = true;
    }
  }
  const hosts = Array.isArray(document.hosts) ? document.hosts.map(String) : [];
  if (!(await ports.attachHosts(slug, hosts))) return fail("hosts_failed");
  return { ok: true, imagesSkipped };
}
