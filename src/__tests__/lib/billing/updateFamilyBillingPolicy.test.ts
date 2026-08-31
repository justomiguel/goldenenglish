/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { updateFamilyBillingPolicy } from "@/lib/billing/updateFamilyBillingPolicy";
import {
  ALLOW_PARENT_PARTIAL_SECTION_PAYMENTS_KEY,
  CREDIT_PAID_TRIAL_ON_ENROLL_KEY,
} from "@/lib/billing/familyBillingPolicy";

describe("updateFamilyBillingPolicy", () => {
  it("upserts both keys in one write", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const supabase = { from: vi.fn().mockReturnValue({ upsert }) } as unknown as SupabaseClient;

    const result = await updateFamilyBillingPolicy(supabase, {
      creditPaidTrialOnEnroll: false,
      allowParentPartialSectionPayments: false,
    });

    expect(result.ok).toBe(true);
    expect(upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ key: CREDIT_PAID_TRIAL_ON_ENROLL_KEY, value: false }),
        expect.objectContaining({
          key: ALLOW_PARENT_PARTIAL_SECTION_PAYMENTS_KEY,
          value: false,
        }),
      ]),
      { onConflict: "key" },
    );
  });

  it("reports db_error when the upsert fails", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { message: "boom" } });
    const supabase = { from: vi.fn().mockReturnValue({ upsert }) } as unknown as SupabaseClient;
    const result = await updateFamilyBillingPolicy(supabase, {
      creditPaidTrialOnEnroll: true,
      allowParentPartialSectionPayments: true,
    });
    expect(result).toEqual({ ok: false, error: "db_error" });
  });
});
