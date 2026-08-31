/** @vitest-environment node */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("204_site_questionnaires.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/204_site_questionnaires.sql"),
    "utf-8",
  );

  it("creates the four tables and v1 enums", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.questionnaires/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.questionnaire_questions/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.questionnaire_responses/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.questionnaire_answers/);
    expect(sql).toContain("'single_choice'");
    expect(sql).toContain("'multi_choice'");
    expect(sql).toContain("'scale'");
  });

  it("scopes public read and named grants without GRANT ALL", () => {
    expect(sql).toMatch(/CREATE POLICY questionnaires_select_public_or_admin/);
    expect(sql).toMatch(/status = 'published'/);
    expect(sql).toMatch(/visibility = 'public'/);
    expect(sql).toMatch(/show_on_landing = true/);
    expect(sql).toMatch(/OR public\.is_admin\(auth\.uid\(\)\)/);
    expect(sql).toMatch(/GRANT SELECT, INSERT ON public\.questionnaire_responses/);
    expect(sql).not.toMatch(/GRANT ALL ON ALL TABLES/);
  });

  it("does not touch events or site_settings policies", () => {
    expect(sql).not.toContain("event_form_fields");
    expect(sql).not.toContain("site_settings");
  });
});
