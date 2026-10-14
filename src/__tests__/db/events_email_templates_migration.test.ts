import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/212_event_email_templates.sql"),
  "utf8",
);

describe("212_event_email_templates", () => {
  it("stores per-event copies and the attendee locale", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public.event_email_templates/);
    expect(sql).toMatch(/NULLS NOT DISTINCT/);
    expect(sql).toMatch(/event_email_templates_flow_scope_chk/);
    expect(sql).toMatch(/event_email_templates_admin_all/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS registration_locale TEXT NOT NULL DEFAULT 'es'/);
    expect(sql).not.toMatch(/TRUNCATE|DROP TABLE|DROP COLUMN/i);
  });
});
