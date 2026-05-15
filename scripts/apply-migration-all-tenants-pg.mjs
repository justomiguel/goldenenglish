#!/usr/bin/env node
/**
 * Applies a single SQL migration file to every tenant database using `pg` (no `psql` binary).
 *
 * Same env conventions as `apply-migration-all-tenants.mjs`:
 *   `.env.local.golden`, `.env.local.mozarthitos`, … with `DATABASE_URL` or `DIRECT_URL`.
 *
 * Usage:
 *   node scripts/apply-migration-all-tenants-pg.mjs [path/to/migration.sql]
 *   node scripts/apply-migration-all-tenants-pg.mjs --skip-dns-check
 *   npm run sql:apply-migration:all-tenants:pg -- supabase/migrations/126_....sql
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

const TENANTS = [
  { id: "golden", label: "Golden English", file: path.join(ROOT, ".env.local.golden") },
  { id: "mozarthitos", label: "mozarthitos", file: path.join(ROOT, ".env.local.mozarthitos") },
  { id: "espaciozenit", label: "Espacio Zenit", file: path.join(ROOT, ".env.local.espaciozenit") },
  { id: "nago", label: "Capoeira Nago", file: path.join(ROOT, ".env.local.nago") },
];

function postgresUriHostname(uri) {
  try {
    const u = new URL(uri);
    return u.hostname || "";
  } catch {
    return "";
  }
}

function printDnsHints(hostname) {
  console.error("");
  console.error("  DNS resolution failed for the database host. Typical fixes:");
  console.error(
    "    • Use Session pooler URI from Supabase Connect (*.pooler.supabase.com)",
  );
  console.error(`    • nslookup ${hostname || "<host>"}`);
  console.error("");
  console.error(
    "  Fallback: paste the .sql into Supabase → SQL Editor, or retry with --skip-dns-check.",
  );
  console.error("");
}

async function assertHostResolvable(hostname) {
  if (!hostname) return true;
  try {
    await lookup(hostname);
    return true;
  } catch (e) {
    const code = /** @type {NodeJS.ErrnoException} */ (e)?.code;
    if (code === "ENOTFOUND" || code === "ESERVFAIL") {
      console.error(`  DNS: cannot resolve "${hostname}" (${code})`);
      printDnsHints(hostname);
      return false;
    }
    console.error(`  DNS: unexpected error for "${hostname}":`, e?.message || e);
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

/**
 * @param {string} dbUrl
 * @param {string} sqlText
 */
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

  let anyFailed = false;
  let anyRan = false;
  let blockedByDns = 0;
  let missingFileOrUrl = 0;

  for (const t of TENANTS) {
    console.log("");
    console.log(`── ${t.label} (${t.id}) ──`);
    if (!fs.existsSync(t.file)) {
      console.warn(`  SKIP: missing env file ${path.basename(t.file)}`);
      missingFileOrUrl += 1;
      continue;
    }

    const env = readEnvFile(t.file);
    const dbUrl = (env.DATABASE_URL || env.DIRECT_URL || "").trim();
    if (!dbUrl) {
      console.error(`  ERROR: no DATABASE_URL or DIRECT_URL in ${path.basename(t.file)}`);
      anyFailed = true;
      missingFileOrUrl += 1;
      continue;
    }

    const host = postgresUriHostname(dbUrl);
    if (!skipDnsCheck && !(await assertHostResolvable(host))) {
      anyFailed = true;
      blockedByDns += 1;
      continue;
    }

    anyRan = true;
    try {
      await runSql(dbUrl, sqlText);
      console.log("  OK");
    } catch (e) {
      console.error(`  FAILED: ${e?.message || e}`);
      anyFailed = true;
    }
  }

  if (!anyRan) {
    console.error("\nNothing was applied.");
    if (blockedByDns > 0) {
      console.error(`  ${blockedByDns} tenant(s): DNS blocked (see hints above).`);
    }
    if (missingFileOrUrl > 0) {
      console.error("  Some tenants: missing .env or DATABASE_URL/DIRECT_URL.");
    }
    process.exit(1);
  }
  if (anyFailed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
