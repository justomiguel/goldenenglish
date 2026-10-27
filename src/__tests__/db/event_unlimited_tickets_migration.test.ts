import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("221_event_unlimited_tickets_per_person.sql", () => {
  const sql = fs.readFileSync(
    path.resolve(process.cwd(), "supabase/migrations/221_event_unlimited_tickets_per_person.sql"),
    "utf8",
  );

  it("drops the per-person maximum and clears stored caps", () => {
    expect(sql).toContain("DROP CONSTRAINT IF EXISTS events_multi_ticket_max_required");
    expect(sql).toContain("SET max_tickets_per_registration = NULL");
    expect(sql).toContain("WHERE allow_multiple_tickets = true");
    expect(sql).not.toContain("too_many_tickets");
  });
});
