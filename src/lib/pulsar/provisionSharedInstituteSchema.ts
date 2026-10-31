import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import pg, { type Client } from "pg";
import { logServerActionException, logServerWarn } from "@/lib/logging/serverActionLog";
import { createProvisionProgressWriter } from "@/lib/pulsar/instituteSchemaProvisionProgress";
import { isBrandDataMigration } from "@/lib/tenant/planInstituteMigrationApplies";
import {
  rewriteInstituteMigrationSql,
  stripAuthUsersTriggers,
} from "@/lib/tenant/rewriteInstituteMigrationSql";

const ROOT = process.cwd();
const LEDGER_SQL = `
CREATE SCHEMA IF NOT EXISTS institute_migration_ledger;
CREATE TABLE IF NOT EXISTS institute_migration_ledger.applied (
  schema_name text NOT NULL,
  version text NOT NULL,
  file_name text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (schema_name, version)
);`;

const DISPATCHER_SQL = `
CREATE OR REPLACE FUNCTION public.dispatch_institute_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  target text;
BEGIN
  target := NULLIF(NEW.raw_user_meta_data ->> 'tenant_schema', '');
  IF target IS NULL OR target !~ '^tenant_[a-z0-9_]{1,50}$' THEN
    RETURN NEW;
  END IF;
  EXECUTE format(
    'INSERT INTO %I.profiles (id, role, first_name, last_name, dni_or_passport, phone, birth_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7)',
    target
  )
  USING
    NEW.id,
    'student',
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'first_name'), ''), '—'),
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'last_name'), ''), '—'),
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'dni_or_passport'), ''), 'pending-' || replace(NEW.id::text, '-', '')),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'phone', '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'birth_date', '')), '')::date;
  RETURN NEW;
END;
$fn$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.dispatch_institute_new_user();
`;

function versionOf(fileName: string): string {
  return fileName.replace(/\.sql$/i, "");
}

export function shouldDiscardPartialInstituteSchema(ownerCount: number): boolean {
  return ownerCount === 0;
}

async function exposeSchema(client: Client, schema: string): Promise<void> {
  const current = await client.query<{ rolconfig: string[] | null }>(
    "SELECT rolconfig FROM pg_roles WHERE rolname = 'authenticator'",
  );
  const config = current.rows[0]?.rolconfig ?? [];
  const entry = config.find((item: string) => item.startsWith("pgrst.db_schemas="));
  const existing = entry ? entry.slice("pgrst.db_schemas=".length) : "public,storage,graphql_public";
  const names = new Set(
    existing
      .split(",")
      .map((name: string) => name.trim())
      .filter((name: string) => name.length > 0),
  );
  names.add(schema);
  const next = [...names].join(",");
  await client.query(`ALTER ROLE authenticator SET pgrst.db_schemas TO '${next.replace(/'/g, "")}'`);
  await client.query("NOTIFY pgrst, 'reload config'");
}

async function hideSchema(client: Client, schema: string): Promise<void> {
  const current = await client.query<{ rolconfig: string[] | null }>(
    "SELECT rolconfig FROM pg_roles WHERE rolname = 'authenticator'",
  );
  const config = current.rows[0]?.rolconfig ?? [];
  const entry = config.find((item: string) => item.startsWith("pgrst.db_schemas="));
  if (!entry) return;
  const next = entry
    .slice("pgrst.db_schemas=".length)
    .split(",")
    .map((name: string) => name.trim())
    .filter((name: string) => name.length > 0 && name !== schema);
  await client.query(
    `ALTER ROLE authenticator SET pgrst.db_schemas TO '${next.join(",").replace(/'/g, "")}'`,
  );
  await client.query("NOTIFY pgrst, 'reload config'");
}

async function discardPartialInstituteSchema(client: Client, schema: string): Promise<void> {
  await client.query("ROLLBACK").catch(() => undefined);
  const owners = await client.query(
    "SELECT 1 FROM public.platform_tenants WHERE postgres_schema = $1 LIMIT 1",
    [schema],
  );
  if (!shouldDiscardPartialInstituteSchema(owners.rowCount ?? 0)) return;
  await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await client.query(
    "DELETE FROM institute_migration_ledger.applied WHERE schema_name = $1",
    [schema],
  );
  await hideSchema(client, schema).catch(() => undefined);
}

export async function prepareInstituteDataPlane(record: {
  dataMode?: string | null;
  databaseUrl: string | null;
  postgresSchema?: string | null;
}): Promise<{ ok: true; pulsarDatabaseUrl: string } | { ok: false; errorCode: string }> {
  const pulsarDatabaseUrl = process.env.PULSAR_DATABASE_URL?.trim() ?? "";
  if (pulsarDatabaseUrl) {
    const columns = await ensureInstituteDataPlaneColumns(pulsarDatabaseUrl);
    if (!columns.ok) return { ok: false, errorCode: "db_write_failed" };
  }
  if (record.dataMode === "shared_schema" && record.databaseUrl && record.postgresSchema) {
    const provisioned = await provisionSharedInstituteSchema({
      databaseUrl: record.databaseUrl,
      postgresSchema: record.postgresSchema,
    });
    if (!provisioned.ok) return provisioned;
  }
  return { ok: true, pulsarDatabaseUrl };
}

export async function ensureInstituteDataPlaneColumns(
  databaseUrl: string,
): Promise<{ ok: true } | { ok: false }> {
  const client = new pg.Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    const sql = readFileSync(
      path.join(ROOT, "supabase/pulsar-migrations/006_institute_data_plane.sql"),
      "utf8",
    );
    await client.query(sql);
    return { ok: true };
  } catch (err) {
    logServerActionException("ensureInstituteDataPlaneColumns", err);
    return { ok: false };
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function provisionSharedInstituteSchema(args: {
  databaseUrl: string;
  postgresSchema: string;
}): Promise<{ ok: true } | { ok: false; errorCode: "schema_provision_failed" }> {
  const schema = args.postgresSchema;
  if (!/^tenant_[a-z0-9_]{1,50}$/.test(schema)) {
    return { ok: false, errorCode: "schema_provision_failed" };
  }
  const client = new pg.Client({ connectionString: args.databaseUrl });
  try {
    await client.connect();
    await client.query(LEDGER_SQL);
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    await client.query(`
      GRANT USAGE ON SCHEMA ${schema} TO postgres, anon, authenticated, service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT ALL ON TABLES TO postgres, service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
      ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT SELECT ON TABLES TO anon;
    `);
    const dir = path.join(ROOT, "supabase/migrations");
    const files = readdirSync(dir)
      .filter((name) => /^\d+.*\.sql$/i.test(name))
      .sort();
    const productFiles = files.filter((name) => !isBrandDataMigration(name));
    const progress = createProvisionProgressWriter(client, schema, productFiles.length);
    await progress.ensure();
    let failingFile: string | null = null;
    try {
      for (const fileName of productFiles) {
        failingFile = fileName;
        const version = versionOf(fileName);
        const seen = await client.query(
          "SELECT 1 FROM institute_migration_ledger.applied WHERE schema_name = $1 AND version = $2",
          [schema, version],
        );
        if ((seen.rowCount ?? 0) > 0) {
          await progress.fileDone(fileName);
          continue;
        }
        await progress.file(fileName);
        const raw = readFileSync(path.join(dir, fileName), "utf8");
        const sql = stripAuthUsersTriggers(rewriteInstituteMigrationSql(raw, schema));
        await client.query(sql);
        await client.query(
          `INSERT INTO institute_migration_ledger.applied (schema_name, version, file_name)
           VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [schema, version, fileName],
        );
        await progress.fileDone(fileName);
      }
      await progress.grants();
      await client.query(`
      GRANT ALL ON ALL TABLES IN SCHEMA ${schema} TO postgres, service_role;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${schema} TO authenticated;
      GRANT SELECT ON ALL TABLES IN SCHEMA ${schema} TO anon;
      GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${schema} TO authenticated, service_role;
    `);
    await client.query(DISPATCHER_SQL);
    try {
      await exposeSchema(client, schema);
    } catch (err) {
      logServerWarn("provisionSharedInstituteSchema:expose", { schema, reason: "pgrst_schemas" });
      logServerActionException("provisionSharedInstituteSchema:expose", err);
    }
      await progress.succeed();
      return { ok: true };
    } catch (err) {
      await progress.fail(failingFile);
      throw err;
    }
  } catch (err) {
    logServerActionException("provisionSharedInstituteSchema", err, { schema });
    await discardPartialInstituteSchema(client, schema).catch((cleanupErr) => {
      logServerActionException("provisionSharedInstituteSchema:discard", cleanupErr, { schema });
    });
    return { ok: false, errorCode: "schema_provision_failed" };
  } finally {
    await client.end().catch(() => undefined);
  }
}
