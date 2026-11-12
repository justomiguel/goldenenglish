import { describe, expect, it, vi } from "vitest";
import { loadAdminSectionCollectionsView } from "@/lib/billing/loadAdminSectionCollectionsView";

// REGRESSION CHECK: this loader is the only entry point the admin uses to
// produce a section-collections view. Changes to query shape (filters,
// columns) directly affect security (RLS), volume and correctness.

interface TableResponse {
  data: unknown;
  error: null;
}

function buildSupabaseMock(responses: Record<string, TableResponse>) {
  return {
    from: vi.fn((table: string) => {
      const response = responses[table] ?? { data: [], error: null };
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        in: vi.fn(() => chain),
        is: vi.fn(() => chain),
        order: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        range: vi.fn(() => Promise.resolve(response)),
        maybeSingle: vi.fn().mockResolvedValue(response),
        single: vi.fn().mockResolvedValue(response),
        then: (resolve: (v: TableResponse) => void) => resolve(response),
      };
      return chain;
    }),
  } as never;
}

const SECTION = {
  id: "sec-1",
  name: "Section A",
  archived_at: null,
  cohort_id: "cohort-1",
  starts_on: "2026-01-01",
  ends_on: "2026-12-31",
  schedule_slots: [{ dayOfWeek: 2, startTime: "18:00", endTime: "19:30" }],
  enrollment_fee_amount: 0,
  academic_cohorts: { id: "cohort-1", name: "2026" },
};

describe("loadAdminSectionCollectionsView", () => {
  it("returns null when section does not exist", async () => {
    const supa = buildSupabaseMock({
      academic_sections: { data: null, error: null },
    });
    const view = await loadAdminSectionCollectionsView(supa, "missing", {
      todayYear: 2026,
      todayMonth: 6,
    });
    expect(view).toBeNull();
  });

  it("returns empty view when section has no enrollments", async () => {
    const supa = buildSupabaseMock({
      academic_sections: { data: SECTION, error: null },
      section_enrollments: { data: [], error: null },
      section_fee_plans: { data: [], error: null },
    });
    const view = await loadAdminSectionCollectionsView(supa, "sec-1", {
      todayYear: 2026,
      todayMonth: 6,
    });
    expect(view).not.toBeNull();
    expect(view?.students).toEqual([]);
    expect(view?.kpis.totalStudents).toBe(0);
    expect(view?.monthlyFeeChargeMode).toBe("prorate_by_classes");
  });

  it("exposes monthly_fee_charge_mode from academic_sections", async () => {
    const supa = buildSupabaseMock({
      academic_sections: {
        data: { ...SECTION, monthly_fee_charge_mode: "full_month_fee" },
        error: null,
      },
      section_enrollments: { data: [], error: null },
      section_fee_plans: { data: [], error: null },
    });
    const view = await loadAdminSectionCollectionsView(supa, "sec-1", {
      todayYear: 2026,
      todayMonth: 6,
    });
    expect(view?.monthlyFeeChargeMode).toBe("full_month_fee");
  });

  it("aggregates students, plans, payments and scholarships into a view", async () => {
    const supa = buildSupabaseMock({
      academic_sections: { data: SECTION, error: null },
      section_enrollments: {
        data: [
          {
            student_id: "stu-1",
            created_at: "2026-01-01T00:00:00Z",
            enrollment_fee_exempt: true,
            enrollment_exempt_reason: "Convenio",
          },
          {
            student_id: "stu-2",
            created_at: "2026-01-01T00:00:00Z",
            enrollment_fee_exempt: false,
            enrollment_exempt_reason: null,
          },
        ],
        error: null,
      },
      section_fee_plans: {
        data: [
          {
            id: "plan-1",
            section_id: "sec-1",
            effective_from_year: 2026,
            effective_from_month: 1,
            monthly_fee: 100,
            currency: "USD",
            archived_at: null,
          },
        ],
        error: null,
      },
      profiles: {
        data: [
          {
            id: "stu-1",
            first_name: "Ana",
            last_name: "Pérez",
            dni_or_passport: "DOC1",
            enrollment_fee_exempt: true,
            enrollment_exempt_reason: "Convenio",
          },
          {
            id: "stu-2",
            first_name: "Bea",
            last_name: "Gómez",
            dni_or_passport: "DOC2",
            enrollment_fee_exempt: null,
            enrollment_exempt_reason: null,
          },
        ],
        error: null,
      },
      payments: {
        data: [
          {
            id: "pay-1",
            student_id: "stu-1",
            section_id: "sec-1",
            month: 1,
            year: 2026,
            amount: "100",
            status: "approved",
            receipt_url: null,
          },
        ],
        error: null,
      },
      student_scholarships: {
        data: [
          {
            student_id: "stu-1",
            discount_percent: "0",
            valid_from_year: 2026,
            valid_from_month: 1,
            valid_until_year: null,
            valid_until_month: null,
            is_active: true,
          },
        ],
        error: null,
      },
      student_promotions: {
        data: [
          {
            student_id: "stu-2",
            code_snapshot: "PROMO25",
            promotion_snapshot: { name: "Promo bienvenida" },
            applies_to_snapshot: "monthly",
            monthly_months_remaining: 2,
            enrollment_consumed: null,
            applied_at: "2026-01-01T00:00:00Z",
          },
        ],
        error: null,
      },
    });

    const view = await loadAdminSectionCollectionsView(supa, "sec-1", {
      todayYear: 2026,
      todayMonth: 6,
    });
    expect(view?.students).toHaveLength(2);
    expect(view?.students.map((s) => s.studentName).sort()).toEqual([
      "Gómez Bea",
      "Pérez Ana",
    ]);
    expect(view?.kpis.paid).toBe(100);
    expect(view?.students.find((s) => s.studentId === "stu-1")?.enrollmentFee.exempt).toBe(true);
    expect(view?.students.find((s) => s.studentId === "stu-2")?.activePromotionLabel).toBe("Promo bienvenida");
  });

  it("does not inherit profile enrollment exemption when section enrollment is not exempt", async () => {
    const supa = buildSupabaseMock({
      academic_sections: { data: SECTION, error: null },
      section_enrollments: {
        data: [
          {
            student_id: "stu-1",
            created_at: "2026-01-01T00:00:00Z",
            enrollment_fee_exempt: false,
            enrollment_exempt_reason: null,
          },
        ],
        error: null,
      },
      section_fee_plans: {
        data: [
          {
            id: "plan-1",
            section_id: "sec-1",
            effective_from_year: 2026,
            effective_from_month: 1,
            monthly_fee: 100,
            currency: "USD",
            archived_at: null,
          },
        ],
        error: null,
      },
      profiles: {
        data: [
          {
            id: "stu-1",
            first_name: "Ana",
            last_name: "Pérez",
            dni_or_passport: "DOC1",
            enrollment_fee_exempt: true,
            enrollment_exempt_reason: "Legacy global",
          },
        ],
        error: null,
      },
      payments: { data: [], error: null },
      student_scholarships: { data: [], error: null },
      student_promotions: { data: [], error: null },
    });

    const view = await loadAdminSectionCollectionsView(supa, "sec-1", {
      todayYear: 2026,
      todayMonth: 6,
    });

    expect(view?.students[0]?.enrollmentFee).toMatchObject({
      exempt: false,
      exemptReason: null,
    });
  });

  it("includes an approved cash payment that sits past the first 1000 rows", async () => {
    const pageOne = Array.from({ length: 1000 }, (_, index) => ({
      id: `old-${index}`,
      student_id: "stu-2",
      section_id: "sec-1",
      month: (index % 12) + 1,
      year: 2026,
      amount: "10",
      status: "approved",
      receipt_url: null,
      payment_method: "cash",
      paid_on: "2026-01-15",
    }));
    const cashRow = {
      id: "pay-cash",
      student_id: "stu-1",
      section_id: "sec-1",
      month: 11,
      year: 2026,
      amount: "100",
      status: "approved",
      receipt_url: null,
      payment_method: "cash",
      paid_on: "2026-11-12",
    };
    const pages = [pageOne, [cashRow]];
    let pageIndex = 0;
    const supa = {
      from: vi.fn((table: string) => {
        const payload =
          table === "academic_sections"
            ? { data: SECTION, error: null }
            : table === "section_enrollments"
              ? {
                  data: [
                    {
                      id: "enr-1",
                      student_id: "stu-1",
                      created_at: "2026-01-01T00:00:00Z",
                      enrollment_fee_exempt: false,
                      enrollment_exempt_reason: null,
                    },
                  ],
                  error: null,
                }
              : table === "section_fee_plans"
                ? {
                    data: [
                      {
                        id: "plan-1",
                        section_id: "sec-1",
                        effective_from_year: 2026,
                        effective_from_month: 1,
                        monthly_fee: 100,
                        currency: "USD",
                        archived_at: null,
                      },
                    ],
                    error: null,
                  }
                : table === "profiles"
                  ? {
                      data: [
                        {
                          id: "stu-1",
                          first_name: "Ana",
                          last_name: "Pérez",
                          dni_or_passport: "DOC1",
                          enrollment_fee_exempt: false,
                          enrollment_exempt_reason: null,
                        },
                      ],
                      error: null,
                    }
                  : { data: [], error: null };
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          in: vi.fn(() => chain),
          is: vi.fn(() => chain),
          order: vi.fn(() => chain),
          limit: vi.fn(() => chain),
          range: vi.fn(() => {
            const page = pages[pageIndex] ?? [];
            pageIndex += 1;
            return Promise.resolve({ data: page, error: null });
          }),
          maybeSingle: vi.fn().mockResolvedValue(payload),
          single: vi.fn().mockResolvedValue(payload),
          then: (resolve: (value: { data: unknown; error: null }) => void) => resolve(payload),
        };
        return chain;
      }),
    };

    const view = await loadAdminSectionCollectionsView(supa as never, "sec-1", {
      todayYear: 2026,
      todayMonth: 11,
    });
    const cell = view?.students
      .find((student) => student.studentId === "stu-1")
      ?.row.cells.find((item) => item.month === 11);
    expect(cell?.status).toBe("approved");
    expect(cell?.paymentMethod).toBe("cash");
  });
});
