import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/210_events_registration_flows.sql"),
  "utf8",
);

describe("210_events_registration_flows", () => {
  it("adds flows, a flow price switch, and the attendee path", () => {
    expect(sql).toMatch(/price_by_flow BOOLEAN NOT NULL DEFAULT false/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public.event_registration_flows/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS flow_id UUID/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS registration_flow_id UUID/);
    expect(sql).toMatch(/event_registration_flows_modify_admin/);
  });
});
