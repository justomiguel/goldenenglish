import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/209_events_registration_field_order.sql"),
  "utf8",
);

describe("209_events_registration_field_order", () => {
  it("adds opt-in required flags and an empty default order", () => {
    expect(sql).toMatch(/require_phone BOOLEAN NOT NULL DEFAULT false/);
    expect(sql).toMatch(/require_birth_date BOOLEAN NOT NULL DEFAULT false/);
    expect(sql).toMatch(/registration_field_order TEXT\[\] NOT NULL DEFAULT '\{\}'/);
  });
});
