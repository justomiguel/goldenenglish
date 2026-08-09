/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Text-level guard only: it proves the statements are still in the file, not that the
 * database enforces them. The enforcement proof is
 * `e2e/critical-anon-privilege-hardening.spec.ts`, which talks to a running Postgres with
 * the anon key.
 */
describe("187_anon_privilege_hardening.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/187_anon_privilege_hardening.sql"),
    "utf-8",
  );

  /**
   * The file is mostly comment, and those comments necessarily name the very things the
   * negative assertions below forbid ("do not repeat 166's GRANT ALL", "service_role is
   * left untouched"). Stripping `--` lines makes those assertions measure the SQL that
   * runs rather than the prose explaining it.
   */
  const statements = sql.replace(/--[^\n]*/g, "");

  it("strips every write privilege from anon across the schema", () => {
    expect(sql).toMatch(
      /REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES\s+ON ALL TABLES IN SCHEMA public FROM anon;/,
    );
  });

  it("re-grants the one anonymous write the app needs, after the revoke", () => {
    const revoke = sql.search(/REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES/);
    const grant = sql.search(/GRANT INSERT ON public\.registrations TO anon;/);
    expect(revoke).toBeGreaterThan(-1);
    expect(grant).toBeGreaterThan(-1);
    // A GRANT before the blanket REVOKE would be silently undone by it.
    expect(grant).toBeGreaterThan(revoke);
  });

  it("explains why the registrations grant exists, so nobody deletes it as dead weight", () => {
    expect(sql).toMatch(/public registration/i);
    expect(sql).toMatch(/register\/actions\.ts/);
  });

  it("leaves SELECT alone: the public site reads through anon", () => {
    expect(statements).not.toMatch(/REVOKE[^;]*\bSELECT\b[^;]*ON ALL TABLES[^;]*FROM anon/i);
    expect(statements).not.toMatch(/REVOKE ALL[^;]*ON ALL TABLES[^;]*FROM anon/i);
  });

  /**
   * `anon` held USAGE and UPDATE on the only sequence in the schema, which is nextval and
   * setval on the Flow.cl commerceOrder counter. Both consumers are SECURITY DEFINER
   * functions owned by postgres, so they never draw on the caller's privileges.
   */
  it("takes the payment counter sequence away from anon but not authenticated", () => {
    expect(sql).toMatch(/REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;/);
    expect(sql).toMatch(
      /ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public\s+REVOKE ALL ON SEQUENCES FROM anon;/,
    );
    expect(statements).not.toMatch(/REVOKE[^;]*ON ALL SEQUENCES[^;]*FROM authenticated/i);
  });

  it("takes TRUNCATE, TRIGGER and REFERENCES off authenticated as well", () => {
    expect(sql).toMatch(
      /REVOKE TRUNCATE, TRIGGER, REFERENCES\s+ON ALL TABLES IN SCHEMA public FROM authenticated;/,
    );
    // But not the four privileges the application depends on and RLS scopes per row.
    expect(statements).not.toMatch(
      /REVOKE[^;]*\b(INSERT|UPDATE|DELETE)\b[^;]*FROM authenticated/i,
    );
  });

  it("closes migration 166's default privileges, which is what made this recur", () => {
    expect(sql).toMatch(
      /ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public\s+REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM anon;/,
    );
    expect(sql).toMatch(
      /ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public\s+REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM authenticated;/,
    );
  });

  it("guards the PG17-only MAINTAIN revoke behind a server version check", () => {
    expect(sql).toMatch(/current_setting\('server_version_num'\)::int >= 170000/);
    expect(sql).toMatch(/REVOKE MAINTAIN ON ALL TABLES IN SCHEMA public FROM anon, authenticated/);
  });

  it("leaves service_role untouched: admin clients and SECURITY DEFINER paths need it", () => {
    expect(statements).not.toMatch(/REVOKE[^;]*FROM[^;]*service_role/i);
  });

  it("carries the warning about repeating migration 166's blanket grant", () => {
    expect(sql).toMatch(
      /GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated/,
    );
    expect(sql).toMatch(/migration 166/);
    expect(sql).toMatch(/180, 181 and 182/);
  });

  /**
   * The warning above has to quote the forbidden statement verbatim to be useful, which
   * puts the phrase in the file. What matters is that no *statement* does it, which is
   * what profilesCarePrivilegeAllowlist.test.ts now checks after stripping comments.
   */
  it("does not itself look like a blanket grant to the care-note allowlist guard", () => {
    expect(statements).not.toMatch(
      /GRANT\s+(ALL|SELECT)[\s\S]{0,80}ON ALL TABLES IN SCHEMA public/i,
    );
  });

  it("is additive: no destructive statement on existing data", () => {
    // TRUNCATE survives only as a privilege name inside REVOKE / ALTER DEFAULT
    // PRIVILEGES, never as a command of its own.
    expect(statements).not.toMatch(/^\s*TRUNCATE\b/im);
    expect(statements).not.toMatch(/\bDROP TABLE\b/i);
    expect(statements).not.toMatch(/\bDROP COLUMN\b/i);
    expect(statements).not.toMatch(/\bDELETE FROM\b/i);
  });
});
