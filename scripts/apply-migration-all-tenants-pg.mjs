#!/usr/bin/env node
/**
 * Applies one product migration to every institute.
 *
 * - data_mode project: run the file unchanged on that database_url.
 * - data_mode shared_schema: rewrite public. to tenant_<slug> in memory,
 *   run it, and insert institute_migration_ledger.applied.
 *
 * Targets come from Pulsar platform_tenants when PULSAR_DATABASE_URL is set.
 * Otherwise they come from TENANTS_CONFIG_JSON in .env.local.
 *
 * Usage:
 *   npm run sql:apply-migration:all-tenants:pg -- supabase/migrations/<file>.sql
 */
import { spawnSync } from "node:child_process";
import { lookup } from "node:dns/promises";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import pg from "pg";

import { readEnvFile } from "./migrate-public-assets-lib.mjs";

const { Client } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ENV_LOCAL = path.join(ROOT, ".env.local");

const LEDGER_SQL = `
CREATE SCHEMA IF NOT EXISTS institute_migration_ledger;
CREATE TABLE IF NOT EXISTS institute_migration_ledger.applied (
  schema_name text NOT NULL,
  version text NOT NULL,
  file_name text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (schema_name, version)
);
`;

function ensureTypeStrip() {
  const flagged = process.execArgv.some((arg) => arg.includes("strip-types"));
  if (flagged || process.features?.typescript === "strip") return;
  const child = spawnSync(
    process.execPath,
    ["--experimental-strip-types", ...process.argv.slice(1)],
    { stdio: "inherit" },
  );
  process.exit(child.status ?? 1);
}

ensureTypeStrip();

function readLocalEnv() {
  if (!fs.existsSync(ENV_LOCAL)) return {};
  return readEnvFile(ENV_LOCAL);
}

function postgresUriHostname(uri) {
  try {
    return new URL(uri).hostname || "";
  } catch {
    return "";
  }
}

async function assertHostResolvable(hostname) {
  if (!hostname) return true;
  try {
    await lookup(hostname);
    return true;
  } catch (err) {
    const code = /** @type {NodeJS.ErrnoException} */ (err)?.code;
    console.error(`  DNS: cannot resolve "${hostname}" (${code || err?.message || err})`);
    return false;
  }
}

async function queryPulsarTargets(databaseUrl) {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    try {
      const result = await client.query(
        `select slug, database_url, data_mode, postgres_schema, is_enabled
         from public.platform_tenants`,
      );
      return result.rows;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!/data_mode|postgres_schema/.test(message)) throw err;
      const result = await client.query(
        `select slug, database_url, is_enabled from public.platform_tenants`,
      );
      return result.rows;
    }
  } finally {
    await client.end();
  }
}

function targetsFromJson(raw) {
  const list = JSON.parse(raw);
  if (!Array.isArray(list)) throw new Error("TENANTS_CONFIG_JSON must be an array");
  return list;
}

async function loadTargetRows() {
  const env = readLocalEnv();
  const pulsarUrl = (process.env.PULSAR_DATABASE_URL || env.PULSAR_DATABASE_URL || "").trim();
  if (pulsarUrl) return queryPulsarTargets(pulsarUrl);
  const raw = (env.TENANTS_CONFIG_JSON || process.env.TENANTS_CONFIG_JSON || "").trim();
  if (!raw) throw new Error("Set PULSAR_DATABASE_URL or TENANTS_CONFIG_JSON");
  return targetsFromJson(raw);
}

function parseCli() {
  const skipDnsCheck = process.argv.slice(2).includes("--skip-dns-check");
  const rel = process.argv.slice(2).find((arg) => arg !== "--skip-dns-check")?.trim();
  if (!rel) {
    console.error(
      "Usage: npm run sql:apply-migration:all-tenants:pg -- supabase/migrations/<file>.sql [--skip-dns-check]",
    );
    process.exit(1);
  }
  return { skipDnsCheck, migrationRel: rel };
}

async function withClient(databaseUrl, work) {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

async function ledgerAlreadyApplied(databaseUrl, schemaName, version) {
  return withClient(databaseUrl, async (client) => {
    await client.query(LEDGER_SQL);
    const found = await client.query(
      `select 1 from institute_migration_ledger.applied
       where schema_name = $1 and version = $2`,
      [schemaName, version],
    );
    return found.rowCount > 0;
  });
}

async function recordLedger(databaseUrl, schemaName, version) {
  await withClient(databaseUrl, async (client) => {
    await client.query(LEDGER_SQL);
    await client.query(
      `insert into institute_migration_ledger.applied (schema_name, version, file_name)
       values ($1, $2, $2)
       on conflict (schema_name, version) do nothing`,
      [schemaName, version],
    );
  });
}

async function main() {
  const { instituteTargetFromRecord, planInstituteMigrationApplies } = await import(
    pathToFileURL(path.join(ROOT, "src/lib/tenant/planInstituteMigrationApplies.ts")).href
  );
  const { skipDnsCheck, migrationRel } = parseCli();
  const migrationPath = path.isAbsolute(migrationRel) ? migrationRel : path.join(ROOT, migrationRel);
  if (!fs.existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sqlText = fs.readFileSync(migrationPath, "utf8");
  const version = path.basename(migrationPath);
  const rows = await loadTargetRows();
  const targets = rows
    .map((row) => instituteTargetFromRecord(row))
    .filter((row) => row !== null);
  const planned = planInstituteMigrationApplies({ fileName: version, sql: sqlText, targets });

  let anyFailed = false;
  let anyRan = false;

  for (const step of planned) {
    console.log("");
    console.log(`── ${step.slug} ──`);
    if (step.action === "skip") {
      console.log(`  SKIP ${step.reason}`);
      anyRan = true;
      continue;
    }
    if (step.action === "error") {
      console.error(`  ERROR: ${step.message}`);
      anyFailed = true;
      continue;
    }

    const host = postgresUriHostname(step.databaseUrl);
    if (!skipDnsCheck && !(await assertHostResolvable(host))) {
      anyFailed = true;
      continue;
    }

    if (step.ledgerSchema && (await ledgerAlreadyApplied(step.databaseUrl, step.ledgerSchema, version))) {
      console.log("  SKIP ledger");
      anyRan = true;
      continue;
    }

    anyRan = true;
    try {
      await withClient(step.databaseUrl, (client) => client.query(step.sql));
      if (step.ledgerSchema) await recordLedger(step.databaseUrl, step.ledgerSchema, version);
      console.log(step.ledgerSchema ? `  OK ${step.ledgerSchema}` : "  OK");
    } catch (err) {
      console.error(`  FAILED: ${err instanceof Error ? err.message : err}`);
      anyFailed = true;
    }
  }

  if (!anyRan || anyFailed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
