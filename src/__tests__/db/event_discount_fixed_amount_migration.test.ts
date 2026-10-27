import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("222_event_discount_fixed_amount.sql migration", () => {
  it("stores one mode per code and snapshots the amount on the redemption", () => {
    const sql = fs.readFileSync(
      path.resolve(process.cwd(), "supabase/migrations/222_event_discount_fixed_amount.sql"),
      "utf8",
    );
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2)");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS ticket_count INT");
    expect(sql).toContain("event_discount_codes_mode");
    expect(sql).toContain("discount_amount, ticket_count");
    const master = fs.readFileSync(path.resolve(process.cwd(), "supabase/migrations/masterdb.sql"), "utf8");
    expect(master).toContain("222_event_discount_fixed_amount.sql");
    expect(master).toContain("event_discount_codes_mode");
  });
});
