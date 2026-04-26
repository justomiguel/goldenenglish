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
});
