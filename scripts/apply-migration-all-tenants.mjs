#!/usr/bin/env node
/**
 * Applies a single SQL migration file to every tenant database via `psql`.
 *
 * Reads the tenant list and each `databaseUrl` from `TENANTS_CONFIG_JSON` in `.env.local`.
 *
 * Usage:
 *   node scripts/apply-migration-all-tenants.mjs [path/to/migration.sql]
 *   node scripts/apply-migration-all-tenants.mjs --skip-dns-check
 *   npm run sql:apply-migration:all-tenants -- supabase/migrations/105_....sql
 */

import { spawnSync } from "node:child_process";
import { lookup } from "node:dns/promises";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readEnvFile } from "./migrate-public-assets-lib.mjs";

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

function resolvePsqlBinary() {
  const explicit = process.env.PSQL_PATH?.trim();
  if (explicit && fs.existsSync(explicit)) return explicit;

  const which = spawnSync("which", ["psql"], {
    encoding: "utf8",
    env: process.env,
  });
  const line = which.stdout?.trim().split("\n")[0];
  if (line && fs.existsSync(line)) return line;

  const brewPrefixes = [
    process.env.HOMEBREW_PREFIX,
    "/opt/homebrew",
    "/usr/local",
  ].filter(Boolean);
  for (const prefix of brewPrefixes) {
    const p = path.join(prefix, "opt", "libpq", "bin", "psql");
    if (fs.existsSync(p)) return p;
  }
  return "psql";
}

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
  console.error("  DNS resolution failed for the database host. Typical causes:");
  console.error("    • Use the Session pooler URI in TENANTS_CONFIG_JSON.databaseUrl (*.pooler.supabase.com)");
  console.error(`    • nslookup ${hostname || "db.<project>.supabase.co"}`);
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
  const rel =
    rest[0]?.trim() || "supabase/migrations/105_portal_upcoming_birthdays_for_viewer.sql";
  return { skipDnsCheck, migrationRel: rel };
}

async function main() {
  const { skipDnsCheck, migrationRel: rel } = parseCli();
  const migrationPath = path.isAbsolute(rel) ? rel : path.join(ROOT, rel);

  if (!fs.existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const tenants = loadTenantsFromEnvLocal();
  const psqlBin = resolvePsqlBinary();
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
    const r = spawnSync(psqlBin, [t.databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", migrationPath], {
      stdio: "inherit",
      env: process.env,
    });
    if (r.error?.code === "ENOENT") {
      console.error(
        "  `psql` not found. Install: macOS `brew install libpq` or set PSQL_PATH=/path/to/psql",
      );
      process.exit(1);
    }
    const code = typeof r.status === "number" ? r.status : 1;
    if (code !== 0) {
      console.error(`  FAILED (exit ${code})`);
      anyFailed = true;
    } else {
      console.log("  OK");
    }
  }

  if (!anyRan || anyFailed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
