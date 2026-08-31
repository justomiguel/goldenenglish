/** @vitest-environment node */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("205_nps_web_questionnaire.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/205_nps_web_questionnaire.sql"),
    "utf-8",
  );

  it("seeds a public published NPS questionnaire with 0-10 and qualitative prompts", () => {
    expect(sql).toContain("nps-experiencia-web");
    expect(sql).toContain("'published'");
    expect(sql).toContain("'public'");
    expect(sql).toContain("show_on_landing");
    expect(sql).toContain("limit_one_response");
    expect(sql).toContain('"0","1","2","3","4","5","6","7","8","9","10"');
    expect(sql).toMatch(/recomiend/);
    expect(sql).toMatch(/agregarías|agregarias/);
    expect(sql).toMatch(/experiencia online/);
    expect(sql).toMatch(/complementar/);
    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
    expect(sql).not.toMatch(/\bDROP TABLE\b/i);
  });
});
