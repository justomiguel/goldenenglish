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
      // Each table call returns a thenable-friendly chain that resolves to the
      // configured response when an "await" terminator (.maybeSingle / .in /
      // .eq chained then) is reached.
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        in: vi.fn(() => chain),
        is: vi.fn(() => chain),
        order: vi.fn(() => chain),
        limit: vi.fn(() => chain),
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
  });

  it("aggregates students, plans, payments and scholarships into a view", async () => {
    const supa = buildSupabaseMock({
      academic_sections: { data: SECTION, error: null },
      section_enrollments: {
        data: [{ student_id: "stu-1" }, { student_id: "stu-2" }],
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
            payments_count: 12,
            charges_enrollment_fee: false,
            period_start_year: 2026,
            period_start_month: 1,
            archived_at: null,
          },
        ],
        error: null,
      },
      profiles: {
        data: [
          { id: "stu-1", first_name: "Ana", last_name: "Pérez", document_number: "DOC1" },
          { id: "stu-2", first_name: "Bea", last_name: "Gómez", document_number: "DOC2" },
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
    });

    const view = await loadAdminSectionCollectionsView(supa, "sec-1", {
      todayYear: 2026,
      todayMonth: 6,
    });
    expect(view?.students).toHaveLength(2);
    expect(view?.students.map((s) => s.studentName).sort()).toEqual([
      "Ana Pérez",
      "Bea Gómez",
    ]);
    expect(view?.kpis.paid).toBe(100);
  });
});
