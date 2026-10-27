import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("220_event_seat_map.sql migration", () => {
  it("adds seat_map_config, seat_labels, and event_seat_locks with unique (event_id, seat_key)", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/220_event_seat_map.sql",
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toContain("ADD COLUMN IF NOT EXISTS seat_map_config JSONB");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS seat_labels TEXT[]");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.event_seat_locks");
    expect(sql).toContain("UNIQUE (event_id, seat_key)");

    const masterDbPath = path.resolve(
      process.cwd(),
      "supabase/migrations/masterdb.sql",
    );
    const masterSql = fs.readFileSync(masterDbPath, "utf8");
    expect(masterSql).toContain("seat_map_config");
    expect(masterSql).toContain("event_seat_locks");
  });
});
