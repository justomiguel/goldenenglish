/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveStudentPaymentSlot } from "@/lib/billing/resolveStudentPaymentSlot";

// REGRESSION CHECK: Changing the SELECT/INSERT shape here may affect
// `submitStudentPaymentReceipt`'s idempotency guarantees (double click,
// retry, two tutors). The contract under test is:
//   1. The ON CONFLICT-equivalent path returns ok with the existing pending
//      row when Postgres signals unique_violation (23505).
//   2. A racing peer that landed an already-resolved row downgrades the
//      response to `already_processed` (we never overwrite a non-pending
//      payment).
//   3. Any other insert error stays `upload_failed` so we don't silently
//      swallow real DB failures.

vi.mock("@/lib/billing/resolveSectionPlanMonthlyAmount", () => ({
  isStudentActivelyEnrolledInSection: vi.fn(),
  resolveSectionPlanMonthlyAmount: vi.fn(),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
}));

import {
  isStudentActivelyEnrolledInSection,
  resolveSectionPlanMonthlyAmount,
} from "@/lib/billing/resolveSectionPlanMonthlyAmount";

const enrolled = vi.mocked(isStudentActivelyEnrolledInSection);
const planAmount = vi.mocked(resolveSectionPlanMonthlyAmount);

interface SelectResponse {
  data: { id: string; status: string } | null;
  error: unknown;
}

interface InsertResponse {
  data: { id: string; status: string } | null;
  error: unknown;
}

function buildSupabase(opts: {
  selects: SelectResponse[];
  insert?: InsertResponse;
}) {
  const selectQueue = [...opts.selects];
  return {
    from: vi.fn((table: string) => {
      if (table !== "payments") throw new Error(`unexpected table ${table}`);
      const builder: Record<string, unknown> = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        is: vi.fn(() => builder),
        maybeSingle: vi.fn(() => {
          const next = selectQueue.shift();
          if (!next) throw new Error("no select response queued");
          return Promise.resolve(next);
        }),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve(opts.insert ?? { data: null, error: null }),
            ),
          })),
        })),
      };
      return builder;
    }),
  } as unknown as Parameters<typeof resolveStudentPaymentSlot>[0];
}

const baseInput = {
  studentId: "s1",
  sectionId: "sec1",
  month: 5,
  year: 2026,
  fallbackAmount: 100,
};

describe("resolveStudentPaymentSlot — section-aware idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enrolled.mockResolvedValue(true);
    planAmount.mockResolvedValue({
      code: "ok",
      amount: 250,
      currency: "USD",
      proration: { numerator: 1, denominator: 1, full: true },
    });
  });

  it("returns existing pending row without inserting", async () => {
    const supabase = buildSupabase({
      selects: [{ data: { id: "pay-1", status: "pending" }, error: null }],
    });
    const result = await resolveStudentPaymentSlot(supabase, baseInput);
    expect(result).toEqual({
      ok: true,
      payment: { id: "pay-1", status: "pending" },
      effectiveAmount: 250,
    });
  });

  it("rejects when existing row is already processed", async () => {
    const supabase = buildSupabase({
      selects: [{ data: { id: "pay-1", status: "approved" }, error: null }],
    });
    const result = await resolveStudentPaymentSlot(supabase, baseInput);
    expect(result).toEqual({ ok: false, reason: "already_processed" });
  });

  it("inserts a new pending row when none exists", async () => {
    const supabase = buildSupabase({
      selects: [{ data: null, error: null }],
      insert: { data: { id: "new-1", status: "pending" }, error: null },
    });
    const result = await resolveStudentPaymentSlot(supabase, baseInput);
    expect(result).toEqual({
      ok: true,
      payment: { id: "new-1", status: "pending" },
      effectiveAmount: 250,
    });
  });

  it("recovers from unique_violation 23505 by re-selecting the racing row", async () => {
    const supabase = buildSupabase({
      selects: [
        { data: null, error: null },
        { data: { id: "raced-1", status: "pending" }, error: null },
      ],
      insert: {
        data: null,
        error: { code: "23505", message: "duplicate key value" },
      },
    });
    const result = await resolveStudentPaymentSlot(supabase, baseInput);
    expect(result).toEqual({
      ok: true,
      payment: { id: "raced-1", status: "pending" },
      effectiveAmount: 250,
    });
  });

  it("downgrades to already_processed when the racing row is non-pending", async () => {
    const supabase = buildSupabase({
      selects: [
        { data: null, error: null },
        { data: { id: "raced-2", status: "approved" }, error: null },
      ],
      insert: {
        data: null,
        error: { code: "23505", message: "duplicate key value" },
      },
    });
    const result = await resolveStudentPaymentSlot(supabase, baseInput);
    expect(result).toEqual({ ok: false, reason: "already_processed" });
  });

  it("returns upload_failed when the conflict re-select cannot find the row", async () => {
    const supabase = buildSupabase({
      selects: [
        { data: null, error: null },
        { data: null, error: null },
      ],
      insert: {
        data: null,
        error: { code: "23505", message: "duplicate key value" },
      },
    });
    const result = await resolveStudentPaymentSlot(supabase, baseInput);
    expect(result).toEqual({ ok: false, reason: "upload_failed" });
  });

  it("surfaces non-conflict insert errors as upload_failed", async () => {
    const supabase = buildSupabase({
      selects: [{ data: null, error: null }],
      insert: {
        data: null,
        error: { code: "40001", message: "serialization failure" },
      },
    });
    const result = await resolveStudentPaymentSlot(supabase, baseInput);
    expect(result).toEqual({ ok: false, reason: "upload_failed" });
  });

  it("returns forbidden when the student is not actively enrolled", async () => {
    enrolled.mockResolvedValueOnce(false);
    const supabase = buildSupabase({ selects: [] });
    const result = await resolveStudentPaymentSlot(supabase, baseInput);
    expect(result).toEqual({ ok: false, reason: "forbidden" });
  });

  it("returns no_plan / out_of_period from the plan resolver", async () => {
    planAmount.mockResolvedValueOnce({ code: "no_plan" });
    const supabaseNoPlan = buildSupabase({ selects: [] });
    expect(await resolveStudentPaymentSlot(supabaseNoPlan, baseInput)).toEqual({
      ok: false,
      reason: "no_plan",
    });

    planAmount.mockResolvedValueOnce({ code: "out_of_period" });
    const supabaseOut = buildSupabase({ selects: [] });
    expect(await resolveStudentPaymentSlot(supabaseOut, baseInput)).toEqual({
      ok: false,
      reason: "out_of_period",
    });
  });

  it("propagates select errors as select_failed", async () => {
    const supabase = buildSupabase({
      selects: [{ data: null, error: { message: "boom" } }],
    });
    const result = await resolveStudentPaymentSlot(supabase, baseInput);
    expect(result).toEqual({ ok: false, reason: "select_failed" });
  });
});

describe("resolveStudentPaymentSlot — legacy path (no sectionId)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns slot_not_found when no legacy row exists", async () => {
    const supabase = buildSupabase({
      selects: [{ data: null, error: null }],
    });
    const result = await resolveStudentPaymentSlot(supabase, {
      ...baseInput,
      sectionId: null,
    });
    expect(result).toEqual({ ok: false, reason: "slot_not_found" });
  });

  it("returns the legacy row with fallback amount when pending", async () => {
    const supabase = buildSupabase({
      selects: [{ data: { id: "legacy-1", status: "pending" }, error: null }],
    });
    const result = await resolveStudentPaymentSlot(supabase, {
      ...baseInput,
      sectionId: null,
    });
    expect(result).toEqual({
      ok: true,
      payment: { id: "legacy-1", status: "pending" },
      effectiveAmount: 100,
    });
  });

  it("returns already_processed for non-pending legacy row", async () => {
    const supabase = buildSupabase({
      selects: [{ data: { id: "legacy-1", status: "approved" }, error: null }],
    });
    const result = await resolveStudentPaymentSlot(supabase, {
      ...baseInput,
      sectionId: null,
    });
    expect(result).toEqual({ ok: false, reason: "already_processed" });
  });

  it("returns select_failed when the legacy lookup errors", async () => {
    const supabase = buildSupabase({
      selects: [{ data: null, error: { message: "boom" } }],
    });
    const result = await resolveStudentPaymentSlot(supabase, {
      ...baseInput,
      sectionId: null,
    });
    expect(result).toEqual({ ok: false, reason: "select_failed" });
  });
});
