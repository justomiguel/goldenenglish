/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { grantConvertClassPack } from "@/lib/register/grantConvertClassPack";

describe("grantConvertClassPack", () => {
  it("inserts an approved pack when the student has none this month", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const limit = vi.fn().mockResolvedValue({ data: [] });
    const inStatus = vi.fn(() => ({ limit }));
    const eqMonth = vi.fn(() => ({ in: inStatus }));
    const eqYear = vi.fn(() => ({ eq: eqMonth }));
    const eqStudent = vi.fn(() => ({ eq: eqYear }));
    const select = vi.fn(() => ({ eq: eqStudent }));
    const from = vi.fn((table: string) => {
      if (table === "student_class_packs") return { select, insert };
      return {};
    });
    const admin = { from } as unknown as SupabaseClient;

    const result = await grantConvertClassPack({
      admin,
      studentId: "stu-1",
      classPack: { amount: 40000, currency: "CLP", classCount: 4, priceId: "p-4" },
      year: 2026,
      month: 3,
    });

    expect(result.ok).toBe(true);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        student_id: "stu-1",
        year: 2026,
        month: 3,
        class_count: 4,
        amount: 40000,
        status: "approved",
      }),
    );
  });

  it("skips insert when a pack already exists for the period", async () => {
    const insert = vi.fn();
    const limit = vi.fn().mockResolvedValue({ data: [{ id: "pack-1" }] });
    const inStatus = vi.fn(() => ({ limit }));
    const eqMonth = vi.fn(() => ({ in: inStatus }));
    const eqYear = vi.fn(() => ({ eq: eqMonth }));
    const eqStudent = vi.fn(() => ({ eq: eqYear }));
    const select = vi.fn(() => ({ eq: eqStudent }));
    const from = vi.fn(() => ({ select, insert }));
    const admin = { from } as unknown as SupabaseClient;

    const result = await grantConvertClassPack({
      admin,
      studentId: "stu-1",
      classPack: { amount: 40000, currency: "CLP", classCount: 4, priceId: "p-4" },
      year: 2026,
      month: 3,
    });

    expect(result.ok).toBe(true);
    expect(insert).not.toHaveBeenCalled();
  });
});
