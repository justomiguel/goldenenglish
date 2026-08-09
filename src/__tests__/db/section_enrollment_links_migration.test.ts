/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("182_section_enrollment_links.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/182_section_enrollment_links.sql"),
    "utf-8",
  );

  it("creates the dedicated token table keyed by section", () => {
    expect(sql).toMatch(
      /CREATE TABLE IF NOT EXISTS public\.section_enrollment_links/,
    );
    expect(sql).toMatch(/section_id UUID PRIMARY KEY/);
    expect(sql).toMatch(/token UUID NOT NULL DEFAULT gen_random_uuid\(\)/);
    expect(sql).toMatch(/is_active BOOLEAN NOT NULL DEFAULT true/);
  });

  it("makes the token unique", () => {
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS section_enrollment_links_token_key/,
    );
  });

  // The whole security model rests on this. Migration 166's ALTER DEFAULT PRIVILEGES
  // grants ALL on newly created tables to anon and authenticated automatically, so a
  // new table is exposed the moment it exists unless the migration revokes explicitly.
  it("keeps the token table unreachable from any browser session", () => {
    expect(sql).toMatch(
      /ALTER TABLE public\.section_enrollment_links ENABLE ROW LEVEL SECURITY/,
    );
    expect(sql).toMatch(
      /REVOKE ALL ON public\.section_enrollment_links FROM anon, authenticated/,
    );
    expect(sql).not.toMatch(/CREATE POLICY \w+ ON public\.section_enrollment_links/);
    expect(sql).not.toMatch(
      /GRANT \w+ ON public\.section_enrollment_links TO (anon|authenticated)/,
    );
  });

  // Pre-existing hole, fixed here by the repo owner's decision: table-wide grants plus
  // row-only RLS let anon read every column of every current-cohort section.
  it("revokes the anon read on academic_sections", () => {
    expect(sql).toMatch(/REVOKE SELECT ON public\.academic_sections FROM anon/);
  });

  it("adds the lead attribution column to registrations", () => {
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS source_section_link_id UUID/);
  });

  it("exposes the resolve function to anonymous visitors", () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.resolve_section_enrollment_link\(p_token uuid\)/,
    );
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.resolve_section_enrollment_link\(uuid\) TO anon/,
    );
  });

  it("only resolves an active token on a live section and cohort", () => {
    expect(sql).toMatch(/l\.is_active = true/);
    expect(sql).toMatch(/s\.archived_at IS NULL/);
    expect(sql).toMatch(/c\.archived_at IS NULL/);
  });

  it("keeps the staff-only functions away from anonymous visitors", () => {
    for (const fn of [
      "section_enrollment_link_lead_count",
      "section_enrollment_link_state",
    ]) {
      expect(sql).toMatch(
        new RegExp(`REVOKE ALL ON FUNCTION public\\.${fn}\\(uuid\\) FROM PUBLIC`),
      );
      // Migration 166 grants EXECUTE to anon directly, so FROM PUBLIC is not enough.
      expect(sql).toMatch(
        new RegExp(`REVOKE ALL ON FUNCTION public\\.${fn}\\(uuid\\) FROM anon`),
      );
      expect(sql).toMatch(
        new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${fn}\\(uuid\\) TO authenticated`),
      );
    }
  });

  it("gates the state function on admin or section staff", () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION public\.section_enrollment_link_state\(p_section_id uuid\)/,
    );
    expect(sql).toMatch(/public\.is_admin\(auth\.uid\(\)\)/);
    expect(sql).toMatch(
      /public\.user_leads_or_assists_section\(auth\.uid\(\), p_section_id\)/,
    );
  });

  it("is additive: no destructive statement on existing data", () => {
    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
    expect(sql).not.toMatch(/\bDROP TABLE\b/i);
    expect(sql).not.toMatch(/\bDROP COLUMN\b/i);
  });
});
