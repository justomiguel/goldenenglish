#!/usr/bin/env node
/**
 * Emits ONE concatenated SQL file from supabase/migrations/*.sql (except masterdb.sql).
 *
 * Use case: paste once into Supabase Dashboard → SQL Editor on a **brand-new** project.
 *
 * Prefer normal tooling instead:
 *   supabase link && supabase db push
 * so `schema_migrations` stays aligned and future migrations apply cleanly.
 *
 * Postgres 55P04: new enum labels are not usable until commit. The emitted file
 * inserts `COMMIT` after each migration so a single paste behaves like one
 * transaction per migration (same as `supabase db push`).
 *
 * If you already pasted this bundle, repair CLI history before pushing next migrations:
 *   supabase migration repair --status applied <timestamp_or_version>
 * (see Supabase docs for `migration repair` / migration list.)
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "supabase", "migrations");
const distDir = join(__dirname, "..", "supabase", "dist");
const outFile = join(distDir, "all_migrations_concat.sql");

const header = `-- =============================================================================
-- GOLDEN ENGLISH — concatenación de migraciones (solo referencia / uso puntual)
-- =============================================================================
-- Generado por: node scripts/build-single-sql-for-sql-editor.mjs
--
-- Cuándo usarlo:
--   Proyecto Supabase **nuevo y vacío** y querés un solo pegado en SQL Editor.
--
-- Preferido en repos y equipos:
--   supabase link && supabase db push
--   (mantiene el historial de migraciones y evita re-aplicar DDL.)
--
-- Riesgos / detalles:
--   • Entre cada migración va un COMMIT (evita 55P04: uso de enum recién agregado).
--   • El SQL Editor del Dashboard de Supabase a veces ejecuta por sentencias cortando en ';'
--     SIN respetar bloques dollar-quote ($$ … $$). Eso rompe funciones PL/pgSQL y aparece
--     ERROR 42P01 relation "a" does not exist (un alias queda huérfano). Evitar pegar ahí;
--     usar la línea psql de abajo o \`supabase db push\`.
--   • No sustituye el tracking interno de migraciones; los próximos \`db push\`
--     pueden intentar re-ejecutar scripts ya aplicados → errores.
--   • No ejecutar dos veces sobre la misma base salvo que sepas lo que hacés.
--   • El archivo masterdb.sql del repo es solo lectura; ESTE es el bundle “editor”.
-- Ejecutar este archivo sin partir por ';' (p. ej. consola):
--   psql "<connection_string>" -v ON_ERROR_STOP=1 -f supabase/dist/all_migrations_concat.sql
-- =============================================================================

`;

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql") && f !== "masterdb.sql")
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

mkdirSync(distDir, { recursive: true });

const parts = [header];
for (const name of files) {
  const body = readFileSync(join(migrationsDir, name), "utf8").replace(/\s+$/u, "");
  parts.push(`\n\n-- ========== ${name} ==========\n\n`);
  parts.push(body);
  parts.push(
    "\n\n-- end migration (transaction boundary for enum ADD VALUE, etc.)\nCOMMIT;\n",
  );
}

writeFileSync(outFile, parts.join(""), "utf8");
console.error(`Wrote ${outFile} (${files.length} migration files).`);
console.error(
  "Prefer supabase db push over pasting this file; see header inside the SQL.",
);
