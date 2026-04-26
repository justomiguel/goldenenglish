// REGRESSION CHECK: 070 must be runnable without the learning-task template
// migration. It may keep detached UUID pointers, but not hard FKs/helpers from 069.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("section content planning migration", () => {
  it("does not depend on learning task template tables or helpers", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/070_section_content_planning_assessments.sql"),
      "utf8",
    );

    expect(sql).not.toMatch(/REFERENCES\s+public\.content_templates/i);
    expect(sql).not.toMatch(/learning_task_/i);
    expect(sql).toMatch(/section_content_staff_can_manage_section/);
  });

  it("renames section planning into learning routes with template-backed steps", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/075_learning_routes_rename.sql"),
      "utf8",
    );

    expect(sql).toMatch(/RENAME TO learning_routes/i);
    expect(sql).toMatch(/RENAME TO learning_route_steps/i);
    expect(sql).toMatch(/RENAME COLUMN template_id TO content_template_id/i);
    expect(sql).toMatch(/ALTER COLUMN content_template_id SET NOT NULL/i);
    expect(sql).toMatch(/REFERENCES public\.content_templates \(id\) ON DELETE CASCADE/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.section_learning_routes/i);
    expect(sql).toMatch(/section_learning_route_mode/i);
    expect(sql).toMatch(/DROP COLUMN IF EXISTS section_id/i);
    expect(sql).toMatch(/DROP COLUMN IF EXISTS visibility/i);
    expect(sql).toMatch(/live_lesson_route_step_links/i);
    expect(sql).toMatch(/learning_route_visible_to_current_user/i);
  });
});
