#!/usr/bin/env node
/**
 * Applies a single SQL migration file to every tenant database using `pg` (no `psql` binary).
 *
 * Reads the tenant list and each `databaseUrl` from `TENANTS_CONFIG_JSON` in `.env.local`.
 *
 * Usage:
 *   node scripts/apply-migration-all-tenants-pg.mjs <path/to/migration.sql> [--skip-dns-check]
 */

import { lookup } from "node:dns/promises";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { readEnvFile } from "./migrate-public-assets-lib.mjs";

const { Client } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ENV_LOCAL = path.join(ROOT, ".env.local");

function loadTenantsFromEnvLocal() {
  if (!fs.existsSync(ENV_LOCAL)) {
    console.error("Missing .env.local in project root.");
    process.exit(1);
  }
  const env = readEnvFile(ENV_LOCAL);
  const raw = (env.TENANTS_CONFIG_JSON || process.env.TENANTS_CONFIG_JSON || "").trim();
  if (!raw) {
    console.error("Missing TENANTS_CONFIG_JSON in .env.local.");
    process.exit(1);
  }
  let list;
  try {
    list = JSON.parse(raw);
  } catch {
    console.error("Invalid TENANTS_CONFIG_JSON in .env.local.");
    process.exit(1);
  }
  if (!Array.isArray(list) || list.length === 0) {
    console.error("TENANTS_CONFIG_JSON must be a non-empty array.");
    process.exit(1);
  }
  return list.map((row) => ({
    id: String(row?.slug ?? "").trim(),
    label: String(row?.slug ?? "").trim(),
    databaseUrl: String(row?.databaseUrl ?? "").trim(),
  }));
}

function postgresUriHostname(uri) {
  try {
    const u = new URL(uri);
    return u.hostname || "";
  } catch {
    return "";
  }
}

async function assertHostResolvable(hostname) {
  if (!hostname) return true;
  try {
    await lookup(hostname);
    return true;
  } catch (e) {
    const code = /** @type {NodeJS.ErrnoException} */ (e)?.code;
    console.error(`  DNS: cannot resolve "${hostname}" (${code || e?.message || e})`);
    return false;
  }
}

function parseCli() {
  const rest = process.argv.slice(2).filter((a) => a !== "--skip-dns-check");
  const skipDnsCheck = process.argv.slice(2).includes("--skip-dns-check");
  const rel = rest[0]?.trim();
  if (!rel) {
    console.error(
      "Usage: node scripts/apply-migration-all-tenants-pg.mjs <path/to/migration.sql> [--skip-dns-check]",
    );
    process.exit(1);
  }
  return { skipDnsCheck, migrationRel: rel };
}

async function runSql(dbUrl, sqlText) {
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    await client.query(sqlText);
  } finally {
    await client.end();
  }
}

async function main() {
  const { skipDnsCheck, migrationRel: rel } = parseCli();
  const migrationPath = path.isAbsolute(rel) ? rel : path.join(ROOT, rel);

  if (!fs.existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sqlText = fs.readFileSync(migrationPath, "utf8");
  const tenants = loadTenantsFromEnvLocal();

  let anyFailed = false;
  let anyRan = false;

  for (const t of tenants) {
    console.log("");
    console.log(`── ${t.label} (${t.id}) ──`);
    if (!t.databaseUrl) {
      console.error(`  ERROR: missing databaseUrl for "${t.id}" in TENANTS_CONFIG_JSON`);
      anyFailed = true;
      continue;
    }

    const host = postgresUriHostname(t.databaseUrl);
    if (!skipDnsCheck && !(await assertHostResolvable(host))) {
      anyFailed = true;
      continue;
    }

    anyRan = true;
    try {
      await runSql(t.databaseUrl, sqlText);
      console.log("  OK");
    } catch (e) {
      console.error(`  FAILED: ${e?.message || e}`);
      anyFailed = true;
    }
  }

  if (!anyRan || anyFailed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
