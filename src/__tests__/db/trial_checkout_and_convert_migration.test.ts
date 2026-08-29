/** @vitest-environment node */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("199_trial_checkout_and_convert", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/199_trial_checkout_and_convert.sql"),
    "utf-8",
  );

  it("reserves TRIAL- and JOIN- commerce refs", () => {
    expect(sql).toMatch(/payment_flow_reserve_commerce_ref_trial/);
    expect(sql).toMatch(/'TRIAL-'/);
    expect(sql).toMatch(/payment_flow_reserve_commerce_ref_join/);
    expect(sql).toMatch(/'JOIN-'/);
  });

  it("exposes guest trial pay, reschedule, and convert RPCs", () => {
    expect(sql).toMatch(/registration_public_trial_pay_context/);
    expect(sql).toMatch(/registration_public_reschedule_ok/);
    expect(sql).toMatch(/registration_public_convert_context/);
  });
});
