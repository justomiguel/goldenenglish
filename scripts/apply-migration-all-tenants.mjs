#!/usr/bin/env node
/**
 * Applies a single SQL migration file to every local tenant database via `psql`.
 *
 * Tenant env files (same as `run-dev-with-target.mjs`, gitignored):
 *   `.env.local.golden`, `.env.local.mozarthitos`, `.env.local.espaciozenit`
 *
 * Each file must define `DATABASE_URL` (or `DIRECT_URL`).
 * Prefer the Supabase Dashboard string you use from this machine — often **Session pooler**
 * (`aws-0-<REGION>.pooler.supabase.com:5432`) if corporate DNS refuses `db.<ref>.supabase.co`.
 *
 * Usage:
 *   node scripts/apply-migration-all-tenants.mjs [path/to/migration.sql]
 *   node scripts/apply-migration-all-tenants.mjs --skip-dns-check   # salta preflight DNS (psql igual necesita red)
 *   npm run sql:apply-migration:all-tenants -- supabase/migrations/105_....sql
 *
 * Requires: `psql` on PATH, or Homebrew `opt/libpq/bin/psql`, or `PSQL_PATH`.
 *
 * Troubleshooting "could not translate host name" / ENOTFOUND:
 *   - Some resolvers resolve `<ref>.supabase.co` but return **No answer** for `db.<ref>.supabase.co`
 *     (often on corporate DNS): use Dashboard → Connect → **Session pooler** URI for `DATABASE_URL`,
 *     or run migrations from Dashboard → SQL Editor.
 *   - Test: `nslookup db.<ref>.supabase.co` vs `nslookup <ref>.supabase.co`; compare with `8.8.8.8`.
 *   - Hotspot / VPN off applies when everything under `*.supabase.co` is blocked.
 */

import { spawnSync } from "node:child_process";
import { lookup } from "node:dns/promises";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readEnvFile } from "./migrate-public-assets-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const TENANTS = [
  {
    id: "golden",
    label: "Golden English",
    file: path.join(ROOT, ".env.local.golden"),
  },
  {
    id: "mozarthitos",
    label: "mozarthitos",
    file: path.join(ROOT, ".env.local.mozarthitos"),
  },
  {
    id: "espaciozenit",
    label: "Espacio Zenit",
    file: path.join(ROOT, ".env.local.espaciozenit"),
  },
  {
    id: "nago",
    label: "Capoeira Nago",
    file: path.join(ROOT, ".env.local.nago"),
  },
];

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

/** @param {string} uri postgresql://... */
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
  console.error("    • Corporate / split DNS: resolves <ref>.supabase.co but NOT db.<ref>.supabase.co (No answer)");
  console.error("      → Pegá en DATABASE_URL la URI «Session pooler» (Connect en el proyecto): host *.pooler.supabase.com");
  console.error("    • No internet, VPN, or firewall blocking relevant hostnames entirely");
  console.error("");
  console.error("  Try (same machine):");
  console.error(`    nslookup ${hostname || "db.<project>.supabase.co"}`);
  console.error(
    `    nslookup ${hostname || "db.<project>.supabase.co"} 8.8.8.8   # si esto sí resuelve, el DNS corporativo bloquea`,
  );
  console.error("    # o: desactivar VPN / usar hotspot / otra Wi‑Fi");
  console.error("");
  console.error("  Sin arreglar DNS desde esta laptop: abre cada proyecto en");
  console.error("    Supabase → SQL Editor → pega el contenido del archivo .sql → Run.");
  console.error("");
  console.error(
    "  Opción script: reintenta con --skip-dns-check (solo omite esta comprobación; psql sigue necesitando resolver el host).",
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

  const psqlBin = resolvePsqlBinary();
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
    // Preflight avoids noisy psql errors when the issue is DNS (common on locked-down networks).
    if (!skipDnsCheck && !(await assertHostResolvable(host))) {
      anyFailed = true;
      blockedByDns += 1;
      continue;
    }

    anyRan = true;
    const r = spawnSync(psqlBin, [dbUrl, "-v", "ON_ERROR_STOP=1", "-f", migrationPath], {
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
      console.log(`  OK`);
    }
  }

  if (!anyRan) {
    console.error("\nNothing was applied.");
    if (blockedByDns > 0) {
      console.error(
        `  ${blockedByDns} tenant(s): el host en DATABASE_URL/DIRECT_URL no resolvió (p. ej. db.<ref>.supabase.co).`,
      );
      console.error(
        "  → En cada proyecto: Connect → Session pooler → copiar esa URI al .env del tenant (usuario postgres.<ref>, host *.pooler.supabase.com).",
      );
      console.error("  → Sin cambiar URLs: pegar el .sql en Supabase → SQL Editor → Run.");
      console.error(
        "  → Hotspot / sin VPN ayuda solo si también falla el pooler; --skip-dns-check no quita ENOTFOUND (psql resuelve el mismo host).",
      );
    }
    if (missingFileOrUrl > 0) {
      console.error(
        "  Algún tenant: archivo .env ausente o sin DATABASE_URL/DIRECT_URL en el .env del tenant.",
      );
    }
    process.exit(1);
  }
  if (anyFailed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
