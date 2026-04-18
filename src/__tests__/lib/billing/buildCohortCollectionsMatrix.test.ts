import { describe, expect, it } from "vitest";
import { buildCohortCollectionsMatrix } from "@/lib/billing/buildCohortCollectionsMatrix";
import type { CohortCollectionsBulkRaw } from "@/types/cohortCollectionsMatrix";

// REGRESSION CHECK: changes to the cohort matrix composition must keep the
// matrix sections aligned one-for-one with what `loadAdminSectionCollectionsView`
// returns per-section, so the overview tab and the per-section drill-down
// always agree on paid/overdue numbers.

const SCHEDULE_SLOTS = [
  { dayOfWeek: 2, startTime: "18:00", endTime: "19:30" },
];

function makeRaw(
  overrides: Partial<CohortCollectionsBulkRaw> = {},
): CohortCollectionsBulkRaw {
  return {
    cohort: { id: "cohort-1", name: "2026" },
    year: 2026,
    sections: [],
    enrollments: [],
    profiles: [],
    payments: [],
    scholarships: [],
    plans: [],
    ...overrides,
  };
}

describe("buildCohortCollectionsMatrix", () => {
  it("returns null when the RPC returned no cohort", () => {
    const out = buildCohortCollectionsMatrix(
      makeRaw({ cohort: null }),
      { todayYear: 2026, todayMonth: 6 },
    );
    expect(out).toBeNull();
  });

  it("returns the cohort with no sections when RPC returns empty arrays", () => {
    const out = buildCohortCollectionsMatrix(
      makeRaw(),
      { todayYear: 2026, todayMonth: 6 },
    );
    expect(out).not.toBeNull();
    expect(out!.cohortId).toBe("cohort-1");
    expect(out!.sections).toHaveLength(0);
    expect(out!.totals.totalStudents).toBe(0);
    expect(out!.totals.collectionRatio).toBe(0);
  });

  it("composes one matrix section per RPC section, sorted alphabetically by student", () => {
    const raw = makeRaw({
      sections: [
        {
          id: "sec-1",
          name: "Section A",
          archived_at: null,
          starts_on: "2026-01-01",
          ends_on: "2026-12-31",
          schedule_slots: SCHEDULE_SLOTS,
          enrollment_fee_amount: 0,
        },
      ],
      enrollments: [
        { section_id: "sec-1", student_id: "stu-z", created_at: "2026-01-01" },
        { section_id: "sec-1", student_id: "stu-a", created_at: "2026-01-01" },
      ],
      profiles: [
        { id: "stu-z", first_name: "Zara", last_name: "Z", document_number: "Z" },
        { id: "stu-a", first_name: "Ana", last_name: "A", document_number: "A" },
      ],
      plans: [
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
    });
    const out = buildCohortCollectionsMatrix(raw, {
      todayYear: 2026,
      todayMonth: 1,
    });
    expect(out!.sections).toHaveLength(1);
    expect(out!.sections[0]!.view.students.map((s) => s.studentName)).toEqual([
      "Ana A",
      "Zara Z",
    ]);
  });

  it("attributes a payment to the correct section/student pair", () => {
    const raw = makeRaw({
      sections: [
        {
          id: "sec-1",
          name: "Section A",
          archived_at: null,
          starts_on: "2026-01-01",
          ends_on: "2026-12-31",
          schedule_slots: SCHEDULE_SLOTS,
          enrollment_fee_amount: 0,
        },
        {
          id: "sec-2",
          name: "Section B",
          archived_at: null,
          starts_on: "2026-01-01",
          ends_on: "2026-12-31",
          schedule_slots: SCHEDULE_SLOTS,
          enrollment_fee_amount: 0,
        },
      ],
      enrollments: [
        { section_id: "sec-1", student_id: "stu-1", created_at: "2026-01-01" },
        { section_id: "sec-2", student_id: "stu-1", created_at: "2026-01-01" },
      ],
      profiles: [
        { id: "stu-1", first_name: "Ana", last_name: "P", document_number: "1" },
      ],
      plans: [
        {
          id: "plan-1",
          section_id: "sec-1",
          effective_from_year: 2026,
          effective_from_month: 1,
          monthly_fee: 100,
          currency: "USD",
          archived_at: null,
        },
        {
          id: "plan-2",
          section_id: "sec-2",
          effective_from_year: 2026,
          effective_from_month: 1,
          monthly_fee: 200,
          currency: "USD",
          archived_at: null,
        },
      ],
      payments: [
        {
          id: "pay-1",
          student_id: "stu-1",
          section_id: "sec-1",
          month: 1,
          year: 2026,
          amount: 100,
          status: "approved",
          receipt_url: null,
        },
      ],
    });
    const out = buildCohortCollectionsMatrix(raw, {
      todayYear: 2026,
      todayMonth: 12,
    });
    const sectionA = out!.sections.find((s) => s.view.sectionId === "sec-1")!;
    const sectionB = out!.sections.find((s) => s.view.sectionId === "sec-2")!;
    expect(sectionA.view.kpis.paid).toBe(100);
    expect(sectionB.view.kpis.paid).toBe(0);
  });

  it("aggregates totals across sections (collection ratio capped at 1)", () => {
    const raw = makeRaw({
      sections: [
        {
          id: "sec-1",
          name: "Section A",
          archived_at: null,
          starts_on: "2026-01-01",
          ends_on: "2026-12-31",
          schedule_slots: SCHEDULE_SLOTS,
          enrollment_fee_amount: 0,
        },
      ],
      enrollments: [
        { section_id: "sec-1", student_id: "stu-1", created_at: "2026-01-01" },
      ],
      profiles: [
        { id: "stu-1", first_name: "Ana", last_name: "P", document_number: "1" },
      ],
      plans: [
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
      payments: Array.from({ length: 12 }, (_, i) => ({
        id: `pay-${i}`,
        student_id: "stu-1",
        section_id: "sec-1",
        month: i + 1,
        year: 2026,
        amount: 100,
        status: "approved" as const,
        receipt_url: null,
      })),
    });
    const out = buildCohortCollectionsMatrix(raw, {
      todayYear: 2026,
      todayMonth: 12,
    });
    expect(out!.totals.paid).toBeGreaterThan(0);
    expect(out!.totals.collectionRatio).toBeLessThanOrEqual(1);
    expect(out!.totals.health).toBe("healthy");
  });
});
