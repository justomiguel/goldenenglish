#!/usr/bin/env node
/**
 * Applies supabase/dist/all_migrations_concat.sql via `psql` (not Dashboard).
 * Fixes 42P01 "relation a does not exist" caused by editors splitting on ';'
 * outside dollar-quoted PL/pgSQL blocks.
 *
 * Requires: Postgres client `psql` on PATH or Homebrew …/opt/libpq/bin/psql (env PSQL_PATH overrides).
 * Env: DATABASE_URL (direct Postgres URI from Supabase → Database settings)
 */

import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { loadEnvLocal } from "./migrate-public-assets-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const bundle = path.join(ROOT, "supabase", "dist", "all_migrations_concat.sql");

/** Prefer PATH; Homebrew libpq often is keg-only (no symlink). */
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

function main() {
  loadEnvLocal();
  const dbUrl =
    process.env.DATABASE_URL?.trim() || process.env.DIRECT_URL?.trim() || "";
  if (!dbUrl) {
    console.error(
      "Set DATABASE_URL in .env.local (Supabase → Database → URI, direct connection).",
    );
    process.exit(1);
  }
  if (!fs.existsSync(bundle)) {
    console.error(`Missing ${bundle}\nRun: npm run sql:bundle-editor`);
    process.exit(1);
  }

  const psqlBin = resolvePsqlBinary();
  const r = spawnSync(
    psqlBin,
    [dbUrl, "-v", "ON_ERROR_STOP=1", "-f", bundle],
    {
      stdio: "inherit",
      env: process.env,
    },
  );
  if (r.error?.code === "ENOENT") {
    console.error(
      "`psql` not found. Install Postgres client:\n  macOS: brew install libpq\nOr set PSQL_PATH=/path/to/psql",
    );
    process.exit(1);
  }
  process.exit(typeof r.status === "number" ? r.status : 1);
}

main();
