// REGRESSION CHECK: schedule overlap blocks only another section in the same cohort.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/277_enroll_overlap_same_cohort.sql",
  "utf8",
);

describe("277 enroll overlap", () => {
  it("limits the overlap check to the target section cohort", () => {
    expect(migration).toContain("v_cohort UUID");
    expect(migration).toContain("AND s.cohort_id = v_cohort");
  });
});
