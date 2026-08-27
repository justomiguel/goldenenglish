/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("189_section_reference_image.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/189_section_reference_image.sql"),
    "utf-8",
  );

  it("adds a nullable reference image path on academic_sections", () => {
    expect(sql).toMatch(
      /ALTER TABLE public\.academic_sections\s+ADD COLUMN IF NOT EXISTS reference_image_path TEXT/,
    );
  });

  it("returns the path from the public resolve rpc", () => {
    expect(sql).toMatch(/reference_image_path TEXT/);
    expect(sql).toMatch(/s\.reference_image_path/);
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.resolve_section_enrollment_link\(uuid\) TO anon/,
    );
  });

  it("creates a public-read section-images bucket", () => {
    expect(sql).toMatch(/'section-images'/);
    expect(sql).toMatch(/VALUES \('section-images', 'section-images', TRUE\)/);
    expect(sql).toMatch(/bucket_id = 'section-images'/);
    expect(sql).toMatch(/public\.is_admin\(auth\.uid\(\)\)/);
  });

  it("does not grant table select back to anon", () => {
    expect(sql).not.toMatch(/GRANT SELECT ON public\.academic_sections TO anon/);
  });
});
