/** @vitest-environment node */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Migration 181 hides three columns of `public.profiles` from the API roles by
 * revoking table-level SELECT and re-granting an explicit allowlist. That is not
 * subtractive, so it rots in two directions and both are silent:
 *
 *  - a column added later and forgotten in the list becomes unreadable app-wide;
 *  - a blanket `GRANT ALL ON ALL TABLES` re-opens the care notes to everyone.
 *
 * There is no live-Postgres harness here, so instead of `has_column_privilege`
 * this derives the real column set from the migrations and compares it with the
 * granted set.
 */

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");
const CARE_NOTES = ["care_health_note", "care_diet_note", "care_support_note"];
const ALLOWLIST_MIGRATION = 181;

function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d+_.*\.sql$/.test(f))
    .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));
}

/** Split on semicolons, ignoring the ones inside `$$ ... $$` function bodies. */
function statements(sql: string): string[] {
  const source = sql.replace(/--[^\n]*/g, "");
  const out: string[] = [];
  let buffer = "";
  let insideDollarQuote = false;
  for (let i = 0; i < source.length; i += 1) {
    if (source.startsWith("$$", i)) {
      insideDollarQuote = !insideDollarQuote;
      buffer += "$$";
      i += 1;
      continue;
    }
    if (source[i] === ";" && !insideDollarQuote) {
      out.push(buffer);
      buffer = "";
      continue;
    }
    buffer += source[i];
  }
  if (buffer.trim()) out.push(buffer);
  return out;
}

/** Top-level comma split, so `NUMERIC(10,2)` stays in one piece. */
function splitTopLevel(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of body) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current);
  return parts;
}

const NON_COLUMN_KEYWORDS = /^(constraint|primary|unique|foreign|check|like|exclude)$/i;

/** Every column `public.profiles` has, replayed from the migrations in order. */
function profilesColumns(): Set<string> {
  const cols = new Set<string>();
  for (const file of ["masterdb.sql", ...migrationFiles()]) {
    let sql: string;
    try {
      sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    } catch {
      continue;
    }

    for (const statement of statements(sql)) {
      const trimmed = statement.trim();

      const created =
        /^CREATE TABLE\s+(?:IF NOT EXISTS\s+)?public\.profiles\s*\(([\s\S]*)\)\s*$/i.exec(trimmed);
      if (created) {
        for (const part of splitTopLevel(created[1])) {
          const name = /^([a-z_][a-z0-9_]*)\s+/i.exec(part.trim());
          if (name && !NON_COLUMN_KEYWORDS.test(name[1])) cols.add(name[1]);
        }
        continue;
      }

      const altered =
        /^ALTER TABLE\s+(?:IF EXISTS\s+)?(?:ONLY\s+)?public\.profiles\b([\s\S]*)$/i.exec(trimmed);
      if (!altered) continue;
      for (const add of altered[1].matchAll(
        /ADD COLUMN\s+(?:IF NOT EXISTS\s+)?([a-z_][a-z0-9_]*)/gi,
      )) {
        cols.add(add[1]);
      }
      for (const drop of altered[1].matchAll(
        /DROP COLUMN\s+(?:IF EXISTS\s+)?([a-z_][a-z0-9_]*)/gi,
      )) {
        cols.delete(drop[1]);
      }
      for (const renamed of altered[1].matchAll(
        /RENAME COLUMN\s+([a-z_][a-z0-9_]*)\s+TO\s+([a-z_][a-z0-9_]*)/gi,
      )) {
        cols.delete(renamed[1]);
        cols.add(renamed[2]);
      }
    }
  }
  return cols;
}

/** The column list inside the latest `GRANT SELECT ( ... ) ON public.profiles`. */
function grantedColumns(): Set<string> {
  for (const file of [...migrationFiles()].reverse()) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    const granted = /GRANT SELECT\s*\(([\s\S]*?)\)\s*ON\s+public\.profiles/i.exec(sql);
    if (granted) {
      return new Set(
        granted[1]
          .split(",")
          .map((column) => column.replace(/--.*$/gm, "").trim())
          .filter(Boolean),
      );
    }
  }
  return new Set();
}

describe("profiles care-note column privileges", () => {
  it("reconstructs a plausible profiles table", () => {
    const all = profilesColumns();
    expect(all.size).toBeGreaterThan(20);
    expect(all.has("id")).toBe(true);
    expect(all.has("role")).toBe(true);
    for (const col of CARE_NOTES) expect(all.has(col)).toBe(true);
  });

  it("grants SELECT on every profiles column except the three care notes", () => {
    const expected = [...profilesColumns()].filter((c) => !CARE_NOTES.includes(c)).sort();
    expect([...grantedColumns()].sort()).toEqual(expected);
  });

  it("never grants SELECT on a care note", () => {
    const granted = grantedColumns();
    for (const col of CARE_NOTES) expect(granted.has(col)).toBe(false);
  });

  it("has no later migration re-opening the columns with a blanket grant", () => {
    // Over statements, not raw text: a migration that *warns* about the blanket grant
    // has to quote it, and matching the comment would flag the warning as the offence.
    const offenders = migrationFiles()
      .filter((f) => Number.parseInt(f, 10) > ALLOWLIST_MIGRATION)
      .filter((f) =>
        statements(readFileSync(join(MIGRATIONS_DIR, f), "utf8")).some((statement) =>
          /GRANT\s+(ALL|SELECT)[\s\S]{0,80}ON ALL TABLES IN SCHEMA public/i.test(statement),
        ),
      );

    // A blanket grant restores table-level SELECT and silently exposes the care
    // notes again. If one is genuinely needed, re-apply the allowlist in that
    // same migration and list the file here with a comment saying why.
    expect(offenders).toEqual([]);
  });
});
