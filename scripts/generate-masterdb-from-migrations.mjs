#!/usr/bin/env node
/**
 * Rebuilds `supabase/migrations/masterdb.sql` as a **read-only context bundle**:
 * all incremental migration files concatenated in filename order.
 *
 * This is not a single idempotent “CREATE-only” snapshot (use `pg_dump --schema-only`
 * against a DB that has all migrations applied if you need that format).
 *
 * Source of truth for real environments: apply `supabase/migrations/*.sql` in order.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "supabase", "migrations");
const outFile = join(migrationsDir, "masterdb.sql");

const header = `-- WARNING: This file is for context only and is not meant to be run as one script.
-- It concatenates incremental migrations in numeric/filename order for quick review.
-- Real deployments must apply files under supabase/migrations/*.sql in order (not this bundle).
-- Regenerate: node scripts/generate-masterdb-from-migrations.mjs
`;

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql") && f !== "masterdb.sql")
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const parts = [header];
for (const name of files) {
  const body = readFileSync(join(migrationsDir, name), "utf8").replace(/\s+$/u, "");
  parts.push(`\n\n-- ========== ${name} ==========\n\n`);
  parts.push(body);
}

writeFileSync(outFile, parts.join(""), "utf8");
console.error(`Wrote ${outFile} (${files.length} migration files).`);
