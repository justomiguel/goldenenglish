import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("152_bank_transfer_instructions_setting migration", () => {
  it("seeds bank_transfer_instructions and exposes it on public site_settings read", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/152_bank_transfer_instructions_setting.sql"),
      "utf8",
    );
    expect(sql).toContain("'bank_transfer_instructions'");
    expect(sql).toContain("site_settings_select_public");
    expect(sql).toMatch(/bank_transfer_instructions/);
  });
});
