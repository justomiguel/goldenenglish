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

  it("adds graph edges and evaluable checkpoints for route studios", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/076_learning_route_graph_studio.sql"),
      "utf8",
    );

    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS position_x/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.learning_route_edges/i);
    expect(sql).toMatch(/from_step_id UUID NOT NULL REFERENCES public\.learning_route_steps \(id\) ON DELETE CASCADE/i);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.learning_route_checkpoints/i);
    expect(sql).toMatch(/assessment_id UUID NULL REFERENCES public\.learning_assessments \(id\) ON DELETE CASCADE/i);
    expect(sql).toMatch(/blocks_progress BOOLEAN NOT NULL DEFAULT FALSE/i);
    expect(sql).toMatch(/contributes_to_gradebook BOOLEAN NOT NULL DEFAULT FALSE/i);
    expect(sql).toMatch(/learning_route_checkpoints_delete_assessment/i);
    expect(sql).toMatch(/learning_route_edges_select_scope/i);
  });
});
