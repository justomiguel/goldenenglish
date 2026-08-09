/** @vitest-environment node */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Pin the contract of 181 as text. There is no Postgres harness in this repo,
 * so the migration's shape is what we can assert here; the companion guard test
 * `profilesCarePrivilegeAllowlist` keeps the GRANT allowlist honest as
 * `profiles` grows.
 */
const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/181_student_care_notes.sql"),
  "utf8",
);

describe("181_student_care_notes", () => {
  it("adds the care columns additively", () => {
    for (const col of [
      "care_health_note",
      "care_diet_note",
      "care_support_note",
      "care_updated_at",
      "care_updated_by",
      "has_care_notes",
    ]) {
      expect(sql).toMatch(new RegExp(`ADD COLUMN IF NOT EXISTS\\s+${col}`));
    }
  });

  it("never destroys data", () => {
    expect(sql).not.toMatch(/DROP\s+TABLE/i);
    expect(sql).not.toMatch(/DROP\s+COLUMN/i);
    expect(sql).not.toMatch(/TRUNCATE/i);
    expect(sql).not.toMatch(/DELETE\s+FROM/i);
  });

  it("keeps has_care_notes in sync with a trigger and backfills it", () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.profiles_set_has_care_notes/);
    expect(sql).toMatch(/BEFORE INSERT OR UPDATE OF[\s\S]{0,120}care_health_note/);
    expect(sql).toMatch(/UPDATE public\.profiles/);
  });

  it("stops a linked minor from editing their own care notes", () => {
    const fn = sql.slice(sql.indexOf("profiles_block_minor_self_sensitive_update"));
    for (const col of ["care_health_note", "care_diet_note", "care_support_note"]) {
      expect(fn).toMatch(new RegExp(`NEW\\.${col} IS DISTINCT FROM OLD\\.${col}`));
    }
    // The seven columns protected before this migration must survive it.
    for (const col of [
      "first_name",
      "last_name",
      "phone",
      "birth_date",
      "dni_or_passport",
      "home_address_text",
      "home_place_id",
    ]) {
      expect(fn).toMatch(new RegExp(`NEW\\.${col} IS DISTINCT FROM OLD\\.${col}`));
    }
  });

  it("revokes table-level SELECT before granting the column allowlist", () => {
    const revokeAt = sql.search(/REVOKE\s+SELECT\s+ON\s+public\.profiles/i);
    const grantAt = sql.search(/GRANT\s+SELECT\s*\(/i);
    expect(revokeAt).toBeGreaterThan(-1);
    expect(grantAt).toBeGreaterThan(revokeAt);
  });

  it("never grants SELECT on the three note columns", () => {
    const grant = sql.slice(sql.search(/GRANT\s+SELECT\s*\(/i));
    for (const col of ["care_health_note", "care_diet_note", "care_support_note"]) {
      expect(grant).not.toContain(col);
    }
  });

  it("leaves service_role and the write grants alone", () => {
    expect(sql).not.toMatch(/REVOKE[^;]*service_role/i);
    expect(sql).not.toMatch(/REVOKE\s+(INSERT|UPDATE|DELETE)[^;]*public\.profiles/i);
  });

  it("warns that a future blanket GRANT ALL would silently undo this", () => {
    expect(sql).toMatch(/166/);
    expect(sql).toMatch(/GRANT ALL ON ALL TABLES/i);
  });
});
