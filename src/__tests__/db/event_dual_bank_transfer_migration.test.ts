/** @vitest-environment node */
// REGRESSION CHECK: Dual bank transfer stays additive on events and event_attendees
// without breaking existing single-source events.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "supabase/migrations/219_event_dual_bank_transfer.sql",
);

describe("219_event_dual_bank_transfer", () => {
  it("adds bank_transfer_sources_config on events and transfer attribution columns on event_attendees", () => {
    const sql = readFileSync(migrationPath, "utf8");
    expect(sql).toMatch(/ALTER TABLE public\.events/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS bank_transfer_sources_config JSONB NULL/);
    expect(sql).toMatch(/ALTER TABLE public\.event_attendees/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS transfer_source_key TEXT NULL/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS transfer_source_label TEXT NULL/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS transfer_question_answer TEXT NULL/);
    expect(sql).toMatch(/transfer_source_key IN \('source_1', 'source_2', 'global'\)/);
  });
});
