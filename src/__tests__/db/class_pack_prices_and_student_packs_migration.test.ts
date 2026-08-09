/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("179_class_pack_prices_and_student_packs.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/179_class_pack_prices_and_student_packs.sql"),
    "utf-8",
  );

  /** Statements only: the header comment quotes `payments` indexes, which would fool a whole-file match. */
  const statements = sql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
    .split(";");

  it("creates the site-level price catalog and the monthly bag", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.class_pack_prices/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.student_class_packs/);
  });

  it("keys the catalog by effectivity window plus class count, ignoring archived rows", () => {
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS class_pack_prices_period_count_uidx[\s\S]*?WHERE archived_at IS NULL/,
    );
  });

  it("declares no section_id column: the bag is per student and crosses sections", () => {
    const createStatements = statements.filter((s) => /CREATE TABLE/.test(s));
    expect(createStatements).toHaveLength(2);
    for (const statement of createStatements) {
      expect(statement).not.toMatch(/section_id/);
    }
  });

  // REGRESSION CHECK: several packs per month is the top-up feature. A unique index on
  // (student_id, year, month) would silently forbid buying more classes after running out.
  it("does not make the monthly bag unique per student and month", () => {
    const periodIndexes = statements.filter((s) =>
      /ON public\.student_class_packs \(student_id, year, month\)/.test(s),
    );
    expect(periodIndexes).toHaveLength(1);
    expect(periodIndexes[0]).not.toMatch(/UNIQUE/);
    expect(periodIndexes[0]).toMatch(/student_class_packs_student_period_idx/);
  });

  it("keeps the purchase snapshot independent of a later catalog edit", () => {
    expect(sql).toMatch(/price_id\s+UUID NULL REFERENCES public\.class_pack_prices \(id\) ON DELETE SET NULL/);
    expect(sql).toMatch(/class_count\s+SMALLINT NOT NULL/);
    expect(sql).toMatch(/amount\s+NUMERIC\(12, 2\) NOT NULL/);
  });

  it("reuses the payment_status enum so exempt means a fully waived pack", () => {
    expect(sql).toMatch(/status\s+public\.payment_status NOT NULL DEFAULT 'pending'/);
  });

  it("defines the family predicate as SECURITY DEFINER to avoid an RLS cycle", () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.user_is_family_of_student/);
    expect(sql).toMatch(/SECURITY DEFINER/);
    expect(sql).toMatch(/SET search_path = public/);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.user_is_family_of_student\(uuid, uuid\) TO authenticated/);
  });

  it("enables RLS on both tables", () => {
    expect(sql).toMatch(/ALTER TABLE public\.class_pack_prices ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/ALTER TABLE public\.student_class_packs ENABLE ROW LEVEL SECURITY/);
  });

  // REGRESSION CHECK: a family may create and edit its own pack only while pending. Approving is what
  // grants credits, so a self-service write that could set 'approved' would hand out free classes.
  it("restricts family self-service writes to pending packs", () => {
    expect(sql).toMatch(
      /CREATE POLICY student_class_packs_insert_family[\s\S]*?WITH CHECK \([\s\S]*?status = 'pending'/,
    );
    expect(sql).toMatch(
      /CREATE POLICY student_class_packs_update_family[\s\S]*?WITH CHECK \([\s\S]*?status = 'pending'/,
    );
  });

  // REGRESSION CHECK: `public.set_updated_at()` exists since 001 and every table in the repo uses it.
  // A per-table copy is one more definition to keep in sync for no benefit.
  it("reuses the shared set_updated_at helper instead of defining its own", () => {
    expect(sql).toMatch(/EXECUTE FUNCTION public\.set_updated_at\(\)/);
    expect(sql).not.toMatch(/CREATE OR REPLACE FUNCTION public\.class_pack_set_updated_at/);
  });

  it("is additive: no destructive statement on existing data", () => {
    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
    expect(sql).not.toMatch(/\bDROP TABLE\b/i);
    expect(sql).not.toMatch(/\bDROP COLUMN\b/i);
  });
});
