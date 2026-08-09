/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("186_section_enrollment_links_bulk_state.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/186_section_enrollment_links_bulk_state.sql"),
    "utf-8",
  );

  it("revokes execute from PUBLIC and anon", () => {
    expect(sql).toMatch(
      /REVOKE ALL ON FUNCTION public\.section_enrollment_links_for_staff\(\) FROM PUBLIC/,
    );
    expect(sql).toMatch(
      /REVOKE ALL ON FUNCTION public\.section_enrollment_links_for_staff\(\) FROM anon/,
    );
  });

  it("grants execute to authenticated only", () => {
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.section_enrollment_links_for_staff\(\) TO authenticated/,
    );
  });

  it("gates each row on admin or section staff", () => {
    expect(sql).toMatch(/public\.is_admin\(auth\.uid\(\)\)/);
    expect(sql).toMatch(
      /public\.user_leads_or_assists_section\(auth\.uid\(\), l\.section_id\)/,
    );
  });
});
