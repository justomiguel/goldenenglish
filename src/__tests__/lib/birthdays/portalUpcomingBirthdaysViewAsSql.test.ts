// REGRESSION CHECK: View-as birthdays must stay admin-gated, and a teacher
// viewer must include section staff plus assigned_teacher_id students.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/225_portal_upcoming_birthdays_view_as.sql"),
  "utf8",
);

describe("portal_upcoming_birthdays_for_viewer view-as contract", () => {
  it("lets an admin session query another viewer and still rejects everyone else", () => {
    expect(sql).toMatch(
      /auth\.uid\(\) IS NOT NULL AND p_viewer_id <> auth\.uid\(\) AND NOT public\.is_admin\(auth\.uid\(\)\)/,
    );
    expect(sql).toMatch(/RAISE EXCEPTION 'forbidden'/);
  });

  it("scopes a teacher to sections they lead or assist and to assigned students", () => {
    expect(sql).toMatch(/user_leads_or_assists_section\(p_viewer_id, se\.section_id\)/);
    expect(sql).toMatch(/v_role = 'teacher'[\s\S]*pr\.assigned_teacher_id = p_viewer_id/);
    expect(sql).not.toMatch(
      /v_role = 'teacher'[\s\S]{0,400}user_leads_or_assists_section\(p_viewer_id, se\.section_id\)/,
    );
  });
});
