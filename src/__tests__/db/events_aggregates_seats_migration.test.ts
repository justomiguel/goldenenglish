/** @vitest-environment node */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Pin the contract of 185 as text — there is no Postgres harness in this repo.
 * The risk this file guards against is a silent change of meaning: once a
 * purchase is several attendee rows, an admin reading "127" has to know whether
 * that is 127 people or 127 seats. Both numbers must exist, and the columns the
 * loaders already read must keep counting exactly what they counted before.
 */
const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/185_events_aggregates_seats.sql"),
  "utf8",
);

function definitionOf(fn: string): string {
  const start = sql.indexOf(`CREATE OR REPLACE FUNCTION public.${fn}`);
  expect(start).toBeGreaterThan(-1);
  const end = sql.indexOf("$$;", start);
  return sql.slice(start, end);
}

/** The return block of one function, so column assertions cannot match the other. */
function returnsBlockOf(fn: string): string {
  const definition = definitionOf(fn);
  return definition.slice(
    definition.indexOf("RETURNS TABLE"),
    definition.indexOf("LANGUAGE sql"),
  );
}

describe("185_events_aggregates_seats", () => {
  it("replaces both aggregate functions, because a return type cannot be widened in place", () => {
    expect(sql).toMatch(
      /DROP FUNCTION IF EXISTS public\.events_admin_list_aggregates\(TEXT, public\.event_status\[\]\)/,
    );
    expect(sql).toMatch(/DROP FUNCTION IF EXISTS public\.events_admin_attendees_aggregates\(UUID\)/);
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.events_admin_list_aggregates/);
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.events_admin_attendees_aggregates/);
  });

  it("keeps every column the loaders already read", () => {
    const list = returnsBlockOf("events_admin_list_aggregates");
    for (const column of [
      "total_events",
      "total_published",
      "total_upcoming",
      "total_attendees",
      "total_waitlist",
    ]) {
      expect(list).toContain(column);
    }

    const attendees = returnsBlockOf("events_admin_attendees_aggregates");
    for (const column of [
      "total_attendees",
      "total_confirmed",
      "total_pending_payment",
      "total_waitlist",
      "total_cancelled",
    ]) {
      expect(attendees).toContain(column);
    }
  });

  it("adds seats and registrations to both functions", () => {
    for (const fn of ["events_admin_list_aggregates", "events_admin_attendees_aggregates"]) {
      const block = returnsBlockOf(fn);
      expect(block).toContain("total_registrations");
      expect(block).toContain("total_seats");
    }
  });

  it("counts a registration as a titular row and a seat as any row", () => {
    // A companion is a row with primary_attendee_id set; it is a seat, never a
    // second registration. Both functions have to draw that line themselves.
    for (const fn of ["events_admin_list_aggregates", "events_admin_attendees_aggregates"]) {
      expect(definitionOf(fn)).toMatch(/ea\.primary_attendee_id IS NULL/);
    }
  });

  it("leaves cancelled seats out of the seat count but not out of the status breakdown", () => {
    const attendees = returnsBlockOf("events_admin_attendees_aggregates");
    expect(attendees).toContain("total_cancelled");
    expect(sql).toMatch(/ea\.status <> 'cancelled'/);
  });

  it("keeps the same grants and stays a SECURITY DEFINER read", () => {
    expect(sql).toMatch(/SECURITY DEFINER/);
    expect(sql).toMatch(/SET search_path = public/);
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.events_admin_list_aggregates\(TEXT, public\.event_status\[\]\) TO authenticated/,
    );
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.events_admin_attendees_aggregates\(UUID\) TO authenticated/,
    );
    expect(sql).toMatch(
      /REVOKE ALL ON FUNCTION public\.events_admin_list_aggregates\(TEXT, public\.event_status\[\]\) FROM PUBLIC/,
    );
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.events_admin_attendees_aggregates\(UUID\) FROM PUBLIC/);
  });

  it("touches no data", () => {
    expect(sql).not.toMatch(/\bDELETE FROM\b/i);
    expect(sql).not.toMatch(/\bDROP TABLE\b/i);
    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
  });

  it("runs as one transaction", () => {
    expect(sql.trimStart().startsWith("--") || sql.trimStart().startsWith("BEGIN")).toBe(true);
    expect(sql).toMatch(/^BEGIN;$/m);
    expect(sql.trimEnd().endsWith("COMMIT;")).toBe(true);
  });
});
