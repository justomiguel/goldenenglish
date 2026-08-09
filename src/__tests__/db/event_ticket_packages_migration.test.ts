/** @vitest-environment node */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Pin the contract of 183 as text — there is no Postgres harness in this repo.
 * The two halves that matter most here are the DNI uniqueness swap (dropping the
 * old constraint and creating the partial index must happen in this one file, so
 * there is never a window without duplicate protection) and the RLS, which has to
 * be a literal copy of event_form_fields' policies.
 */
const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/183_event_ticket_packages.sql"),
  "utf8",
);

describe("183_event_ticket_packages", () => {
  it("creates the packages table with its guard rails", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.event_ticket_packages/);
    expect(sql).toMatch(/benefits\s+TEXT\[\]\s+NOT NULL\s+DEFAULT\s+'\{\}'/);
    expect(sql).toMatch(/price\s+NUMERIC\(12,2\)\s+NOT NULL\s+CHECK \(price >= 0\)/);
    expect(sql).toMatch(/capacity\s+INT\s+NULL\s+CHECK \(capacity > 0\)/);
    expect(sql).toMatch(/event_id\s+UUID NOT NULL REFERENCES public\.events \(id\) ON DELETE CASCADE/);
  });

  it("keeps the packages ordered and stamped like its siblings", () => {
    expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS event_ticket_packages_event_position_idx/);
    expect(sql).toMatch(/DROP TRIGGER IF EXISTS event_ticket_packages_set_updated_at/);
    expect(sql).toMatch(/EXECUTE FUNCTION public\.set_updated_at\(\)/);
  });

  it("mirrors the event_form_fields policies exactly", () => {
    expect(sql).toMatch(/ALTER TABLE public\.event_ticket_packages ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/CREATE POLICY event_ticket_packages_select_public_or_admin/);
    // A draft or archived event must not leak its price list to the public.
    expect(sql).toMatch(/e\.status = 'published'/);
    expect(sql).toMatch(/e\.archived_at IS NULL/);
    expect(sql).toMatch(/OR public\.is_admin\(auth\.uid\(\)\)/);
    expect(sql).toMatch(/CREATE POLICY event_ticket_packages_modify_admin/);
  });

  it("links a seat to its package and to the titular that bought it", () => {
    expect(sql).toMatch(
      /ADD COLUMN IF NOT EXISTS ticket_package_id\s+UUID NULL\s*\n?\s*REFERENCES public\.event_ticket_packages \(id\) ON DELETE RESTRICT/,
    );
    expect(sql).toMatch(
      /ADD COLUMN IF NOT EXISTS primary_attendee_id UUID NULL\s*\n?\s*REFERENCES public\.event_attendees \(id\) ON DELETE CASCADE/,
    );
    expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS event_attendees_primary_attendee_idx/);
  });

  it("lets a companion exist without a document or a mailbox", () => {
    // Both are per-event toggles, so neither can stay NOT NULL at table level.
    expect(sql).toMatch(/ALTER COLUMN dni_or_passport DROP NOT NULL/);
    expect(sql).toMatch(/ALTER COLUMN email DROP NOT NULL/);
  });

  it("swaps the DNI uniqueness for a titular-only one, in this same file", () => {
    const dropAt = sql.indexOf("DROP CONSTRAINT IF EXISTS event_attendees_event_dni_unique");
    const indexAt = sql.indexOf("event_attendees_primary_dni_uniq");
    expect(dropAt).toBeGreaterThan(-1);
    expect(indexAt).toBeGreaterThan(dropAt);
    expect(sql).toMatch(/WHERE primary_attendee_id IS NULL AND dni_or_passport IS NOT NULL/);
  });

  it("refuses to allow several tickets without a maximum", () => {
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS allow_multiple_tickets\s+BOOLEAN NOT NULL DEFAULT false/);
    expect(sql).toMatch(/max_tickets_per_registration INT NULL/);
    expect(sql).toMatch(/CHECK \(max_tickets_per_registration > 1\)/);
    expect(sql).toMatch(
      /CHECK \(NOT allow_multiple_tickets OR max_tickets_per_registration IS NOT NULL\)/,
    );
  });

  it("adds the companion collection toggles", () => {
    for (const col of [
      "companion_collect_dni",
      "companion_collect_birth_date",
      "companion_collect_email",
    ]) {
      expect(sql).toMatch(new RegExp(`ADD COLUMN IF NOT EXISTS ${col}\\s+BOOLEAN NOT NULL DEFAULT false`));
    }
    expect(sql).toMatch(
      /ALTER TABLE public\.event_form_fields\s*\n\s*ADD COLUMN IF NOT EXISTS collect_for_companions BOOLEAN NOT NULL DEFAULT false/,
    );
  });

  it("destroys nothing", () => {
    expect(sql).not.toMatch(/\bDROP TABLE\b/i);
    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
    expect(sql).not.toMatch(/\bDELETE FROM\b/i);
    expect(sql).not.toMatch(/\bDROP COLUMN\b/i);
  });
});
