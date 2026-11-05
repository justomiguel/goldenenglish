/** @vitest-environment node */
// REGRESSION CHECK: Seat holds stay additive, qualified, and callable only by service_role.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("264_event_seat_holds.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/264_event_seat_holds.sql"),
    "utf-8",
  );

  it("creates the hold table and the three functions on public", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.event_seat_holds/);
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.hold_event_seats/);
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.release_event_seat_holds/);
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.claim_event_seats/);
    expect(sql).toMatch(/UNIQUE \(event_id, seat_key\)/);
  });

  it("does not destroy existing rows and limits execute to service_role", () => {
    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
    expect(sql).not.toMatch(/\bDROP TABLE\b/i);
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.hold_event_seats/);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.claim_event_seats\(uuid, uuid, text, jsonb\) TO service_role/);
  });
});
