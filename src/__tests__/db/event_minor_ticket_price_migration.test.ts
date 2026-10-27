import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  path.join(process.cwd(), "supabase/migrations/223_event_minor_ticket_price.sql"),
  "utf8",
);

describe("223_event_minor_ticket_price", () => {
  it("adds the event toggle, the minor price, and the attendee count", () => {
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS allow_minor_tickets BOOLEAN NOT NULL DEFAULT false");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS minor_ticket_price NUMERIC(12, 2) NULL");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS minor_ticket_count INTEGER NOT NULL DEFAULT 0");
    expect(sql).toContain("CHECK (minor_ticket_count >= 0)");
    expect(sql).not.toContain("DROP COLUMN");
    expect(sql).not.toContain("DROP TABLE");
  });
});
