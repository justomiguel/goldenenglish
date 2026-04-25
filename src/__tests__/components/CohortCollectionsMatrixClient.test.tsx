import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dictEn } from "@/test/dictEn";
import { CohortCollectionsMatrixClient } from "@/components/dashboard/admin/finance/CohortCollectionsMatrixClient";
import { buildCohortCollectionsMatrix } from "@/lib/billing/buildCohortCollectionsMatrix";
import type { CohortCollectionsBulkRaw } from "@/types/cohortCollectionsMatrix";

const SCHEDULE_SLOTS = [
  { dayOfWeek: 2, startTime: "18:00", endTime: "19:30" },
];

const overviewDict = dictEn.admin.finance.overview;
const collectionsDict = dictEn.admin.finance.collections;

function makeRaw(): CohortCollectionsBulkRaw {
  return {
    cohort: { id: "cohort-1", name: "2026" },
    year: 2026,
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
      {
        section_id: "sec-1",
        student_id: "stu-ana",
        created_at: "2026-01-01",
        enrollment_fee_exempt: true,
        enrollment_exempt_reason: "Sibling agreement",
      },
      { section_id: "sec-1", student_id: "stu-zara", created_at: "2026-01-01" },
    ],
    profiles: [
      {
        id: "stu-ana",
        first_name: "Ana",
        last_name: "Smith",
        dni_or_passport: "A1",
        enrollment_fee_exempt: true,
        enrollment_exempt_reason: "Sibling agreement",
      },
      {
        id: "stu-zara",
        first_name: "Zara",
        last_name: "Lopez",
        dni_or_passport: "Z1",
        enrollment_fee_exempt: null,
        enrollment_exempt_reason: null,
      },
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
    payments: [
      {
        id: "pay-ana-jan",
        student_id: "stu-ana",
        section_id: "sec-1",
        month: 1,
        year: 2026,
        amount: 100,
        status: "approved",
        receipt_url: null,
      },
    ],
    scholarships: [],
    promotions: [
      {
        student_id: "stu-zara",
        code_snapshot: "PROMO25",
        promotion_snapshot: { name: "Welcome promo" },
        applies_to_snapshot: "monthly",
        monthly_months_remaining: 2,
        enrollment_consumed: null,
        applied_at: "2026-01-01T00:00:00Z",
      },
    ],
  };
}

describe("CohortCollectionsMatrixClient", () => {
  it("renders cohort totals, every active section and every student row", () => {
    const matrix = buildCohortCollectionsMatrix(makeRaw(), {
      todayYear: 2026,
      todayMonth: 12,
    })!;
    render(
      <CohortCollectionsMatrixClient
        matrix={matrix}
        overviewDict={overviewDict}
        collectionsDict={collectionsDict}
        locale="en"
        sectionHrefBase="/en/dashboard/admin/finance/collections"
      />,
    );

    expect(screen.getByText(overviewDict.totals.expectedYear)).toBeInTheDocument();
    expect(screen.getByText(overviewDict.totals.collected)).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: overviewDict.table.paidLabel }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: overviewDict.table.expectedLabel }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: overviewDict.table.overdueLabel }),
    ).toBeInTheDocument();
    expect(screen.getByText("Section A")).toBeInTheDocument();
    expect(screen.getByText("Ana Smith")).toBeInTheDocument();
    expect(screen.getByText("Zara Lopez")).toBeInTheDocument();
    expect(screen.getByText(collectionsDict.benefits.enrollmentExempt)).toBeInTheDocument();
    expect(screen.getByText("Promo Welcome promo")).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`${overviewDict.sectionHeader.monthlyFee}:`)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`${overviewDict.sectionHeader.enrollmentFee}:`)),
    ).toBeInTheDocument();

    const link = screen.getByRole("link", { name: overviewDict.sectionHeader.openSection });
    expect(link).toHaveAttribute(
      "href",
      "/en/dashboard/admin/finance/collections/sec-1",
    );
  });

  it("filters students by name and shows the empty-after-filter state", async () => {
    const matrix = buildCohortCollectionsMatrix(makeRaw(), {
      todayYear: 2026,
      todayMonth: 12,
    })!;
    render(
      <CohortCollectionsMatrixClient
        matrix={matrix}
        overviewDict={overviewDict}
        collectionsDict={collectionsDict}
        locale="en"
        sectionHrefBase="/en/dashboard/admin/finance/collections"
      />,
    );
    const input = screen.getByRole("searchbox", {
      name: overviewDict.filters.search,
    });
    await userEvent.type(input, "ana");
    expect(screen.getByText("Ana Smith")).toBeInTheDocument();
    expect(screen.queryByText("Zara Lopez")).not.toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, "noBodyMatchesThis");
    expect(
      screen.getByText(overviewDict.empty.noStudentsAfterFilter),
    ).toBeInTheDocument();
  });
});
