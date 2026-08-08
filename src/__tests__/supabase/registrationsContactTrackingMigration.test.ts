import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/176_registrations_contact_tracking.sql"),
  "utf8",
);

describe("migration 176 registrations contact tracking", () => {
  it("adds the follow-up columns idempotently", () => {
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ/i);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS contacted_by UUID/i);
    expect(sql).toMatch(/REFERENCES public\.profiles \(id\) ON DELETE SET NULL/i);
  });

  it("creates the status aggregates RPC granted to authenticated", () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.registrations_admin_list_aggregates/i,
    );
    expect(sql).toMatch(/SECURITY DEFINER/i);
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.registrations_admin_list_aggregates/i,
    );
  });

  it("excludes enrolled rows from the counts, matching the list loader", () => {
    expect(sql).toMatch(/status <> 'enrolled'/i);
  });

  it("destroys no data", () => {
    expect(sql).not.toMatch(/\b(DROP TABLE|TRUNCATE|DELETE FROM)\b/i);
  });
});
