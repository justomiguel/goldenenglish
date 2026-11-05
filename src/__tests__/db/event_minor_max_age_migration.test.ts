import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  path.join(process.cwd(), "supabase/migrations/263_event_minor_max_age.sql"),
  "utf8",
);

describe("263_event_minor_max_age", () => {
  it("adds a nullable inclusive age on public.events", () => {
    expect(sql).toContain("ALTER TABLE public.events");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS minor_max_age SMALLINT NULL");
    expect(sql).toContain("minor_max_age >= 1 AND minor_max_age <= 99");
    expect(sql).not.toContain("DROP COLUMN");
    expect(sql).not.toContain("DROP TABLE");
  });
});
