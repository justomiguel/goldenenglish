/** @vitest-environment node */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The enroll RPC is the only place that decides a seat's price and status, and
 * every public registration goes through it. These assertions guard the parts
 * where a silent regression would be expensive: the availability rule (which is
 * what makes a waitlist a waitlist), the titular-only scoping of the duplicate
 * document check, and the promise that no payment row is created here.
 */
const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/184_enroll_event_attendee_packages.sql"),
  "utf8",
);

describe("184_enroll_event_attendee_packages", () => {
  it("replaces the old signature instead of overloading it", () => {
    const dropAt = sql.indexOf("DROP FUNCTION IF EXISTS public.enroll_event_attendee");
    const createAt = sql.indexOf("CREATE OR REPLACE FUNCTION public.enroll_event_attendee");
    expect(dropAt).toBeGreaterThan(-1);
    expect(createAt).toBeGreaterThan(dropAt);
  });

  it("adds the two new parameters last, both defaulted", () => {
    expect(sql).toMatch(/p_ticket_package_id UUID DEFAULT NULL/);
    expect(sql).toMatch(/p_companions JSONB DEFAULT '\[\]'::jsonb/);
    // Last two, so every existing positional caller keeps working untouched.
    const signature = sql.slice(
      sql.indexOf("CREATE OR REPLACE FUNCTION public.enroll_event_attendee"),
      sql.indexOf("RETURNS TABLE"),
    );
    const params = [...signature.matchAll(/^\s*(p_\w+)/gm)].map((m) => m[1]);
    expect(params.slice(-2)).toEqual(["p_ticket_package_id", "p_companions"]);
    expect(params[params.length - 3]).toBe("p_field_values");
  });

  it("returns the seats and the total on top of the existing five columns", () => {
    const returns = sql.slice(sql.indexOf("RETURNS TABLE"), sql.indexOf("LANGUAGE plpgsql"));
    expect(returns).toMatch(/attendee_id UUID/);
    expect(returns).toMatch(/attendee_status public\.event_attendee_status/);
    expect(returns).toMatch(/payment_required BOOLEAN/);
    expect(returns).toMatch(/payment_id UUID/);
    expect(returns).toMatch(/result_code TEXT/);
    expect(returns).toMatch(/seats INT/);
    expect(returns).toMatch(/total_amount NUMERIC\(12,\s*2\)/);
    // Order matters: existing callers read these positionally in some paths.
    expect(returns.indexOf("result_code")).toBeLessThan(returns.indexOf("seats INT"));
  });

  it("re-issues the grants for the new argument list", () => {
    // The grants in 146 name the old 18-argument list and do not carry over.
    const revoke = sql.slice(sql.indexOf("REVOKE ALL ON FUNCTION"));
    expect(revoke).toMatch(/FROM PUBLIC/);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.enroll_event_attendee\(/);
    expect(sql).toMatch(/TO anon, authenticated;/);
    const grantBlock = sql.slice(
      sql.indexOf("GRANT EXECUTE ON FUNCTION public.enroll_event_attendee("),
      sql.indexOf("TO anon, authenticated;"),
    );
    const argCount = grantBlock.split(",").length;
    expect(argCount).toBe(20);
  });

  it("keeps the waitlist rule exactly as it is today", () => {
    // Counting anything else here would make the first waitlisted person occupy
    // a seat forever, silently changing every existing event.
    expect(sql).toMatch(/status IN \('confirmed', 'pending_payment'\)/);
    expect(sql).not.toMatch(/status <> 'cancelled'/);
  });

  it("scopes the duplicate document check to titulars", () => {
    const dupBlock = sql.slice(
      sql.indexOf("lower(p_dni_or_passport)") - 400,
      sql.indexOf("'duplicate_dni'"),
    );
    expect(dupBlock).toMatch(/ea\.primary_attendee_id IS NULL/);
  });

  it("rejects the package and seat combinations the event does not allow", () => {
    for (const code of [
      "package_not_allowed",
      "package_required",
      "package_not_found",
      "multiple_tickets_not_allowed",
      "too_many_tickets",
      "companion_name_required",
      "insufficient_seats",
    ]) {
      expect(sql).toContain(`'${code}'`);
    }
  });

  it("never sells a partial group", () => {
    // A group that does not fit is refused outright and told what is left,
    // rather than being split across a confirmation and a waitlist.
    expect(sql).toMatch(/v_remaining/);
    expect(sql).toMatch(/'insufficient_seats'/);
  });

  it("still defers the payment row", () => {
    expect(sql).not.toMatch(/INSERT INTO public\.event_payments/);
    expect(sql).toMatch(/NULL::uuid/);
  });

  it("destroys nothing", () => {
    expect(sql).not.toMatch(/\bDROP TABLE\b/i);
    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
    expect(sql).not.toMatch(/\bDELETE FROM\b/i);
  });
});
