/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("190_registration_tenant_extras.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/190_registration_tenant_extras.sql"),
    "utf-8",
  );

  it("adds tenant_extras jsonb with empty-object default", () => {
    expect(sql).toMatch(
      /ADD COLUMN IF NOT EXISTS tenant_extras JSONB NOT NULL DEFAULT '\{\}'::jsonb/,
    );
  });

  it("comments the column as a tenant pack payload", () => {
    expect(sql).toMatch(/COMMENT ON COLUMN public\.registrations\.tenant_extras/);
    expect(sql).toMatch(/tenant registration pack/);
  });
});
