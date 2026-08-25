/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("e2e seed-admin fixture events", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/seeds/e2e/seed-admin.sql"),
    "utf-8",
  );

  it("seeds a second public section for multi-section registration", () => {
    expect(sql).toContain("E2E Section B");
  });

  it("clears leftover scholarships so a 25% assign is visible after reseed", () => {
    expect(sql).toMatch(/DELETE FROM public\.section_enrollment_scholarships/);
    expect(sql).toMatch(/v_student_b/);
  });

  it("clears leftover attendees on fixture events so paid capacity stays open", () => {
    expect(sql).toMatch(/DELETE FROM public\.event_attendees/);
    expect(sql).toMatch(/e2e-paid-event/);
    expect(sql).toMatch(/e2e-free-event/);
    const deleteAt = sql.indexOf("DELETE FROM public.event_attendees");
    const paidInsertAt = sql.indexOf("'e2e-paid-event'");
    expect(deleteAt).toBeGreaterThan(paidInsertAt);
  });
});
