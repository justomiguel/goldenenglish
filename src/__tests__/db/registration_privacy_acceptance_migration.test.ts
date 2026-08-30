/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("201_registration_privacy_acceptance.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/201_registration_privacy_acceptance.sql"),
    "utf-8",
  );

  it("adds nullable acceptance time and policy version on registrations", () => {
    expect(sql).toMatch(
      /ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ/,
    );
    expect(sql).toMatch(
      /ADD COLUMN IF NOT EXISTS privacy_policy_version TEXT/,
    );
    expect(sql).not.toMatch(/privacy_accepted_at TIMESTAMPTZ NOT NULL/);
    expect(sql).not.toMatch(/privacy_policy_version TEXT NOT NULL/);
  });

  it("comments both columns as public-form proof", () => {
    expect(sql).toMatch(/COMMENT ON COLUMN public\.registrations\.privacy_accepted_at/);
    expect(sql).toMatch(/COMMENT ON COLUMN public\.registrations\.privacy_policy_version/);
  });
});
