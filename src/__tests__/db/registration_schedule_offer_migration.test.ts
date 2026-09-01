/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("206_registration_schedule_offer.sql", () => {
  const sql = readFileSync(
    resolve(
      process.cwd(),
      "supabase/migrations/206_registration_schedule_offer.sql",
    ),
    "utf-8",
  );

  it("adds proposed_section_id and offer_pending without dropping columns", () => {
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS proposed_section_id UUID/);
    expect(sql).toMatch(/offer_pending/);
    expect(sql).toMatch(/DROP FUNCTION IF EXISTS public\.registration_public_pay_context\(text\)/);
    expect(sql).toMatch(/proposed_section_id/);
    expect(sql).not.toMatch(/DROP COLUMN/i);
  });
});
