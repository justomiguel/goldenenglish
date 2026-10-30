import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/230_courses.sql"), "utf8");
const checkout = readFileSync(resolve(process.cwd(), "supabase/migrations/231_course_checkout_refs.sql"), "utf8");

describe("course migrations", () => {
  it("copies route steps into courses and keeps the step table", () => {
    expect(sql).toContain("public.learning_courses");
    expect(sql).not.toContain("public.courses");
    expect(sql).toContain("learning_route_courses");
    expect(sql).toContain("migrated_from_step_id");
    expect(sql).not.toMatch(/DROP TABLE[^;]*learning_route_steps/i);
  });

  it("reserves a course commerce reference without removing the merch target", () => {
    expect(checkout).toContain("course_order_id");
    expect(checkout).toContain("shop_order_id IS NOT NULL");
    expect(checkout).toContain("payment_flow_reserve_commerce_ref_course");
  });
});
