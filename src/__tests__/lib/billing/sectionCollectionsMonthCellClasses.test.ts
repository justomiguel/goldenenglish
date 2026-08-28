import { describe, expect, it } from "vitest";
import { sectionCollectionsMonthCellClasses } from "@/lib/billing/sectionCollectionsMonthCellClasses";

// REGRESSION CHECK: scholarship is a discount mark, not a payment status.
// Green (`--color-success`) means collected — never "has a scholarship".
describe("sectionCollectionsMonthCellClasses", () => {
  it("keeps unpaid scholarship months off the collected green", () => {
    const unpaid = sectionCollectionsMonthCellClasses("due", false, false);
    const unpaidScholarship = sectionCollectionsMonthCellClasses("due", false, true);

    expect(unpaid).not.toContain("--color-success");
    expect(unpaidScholarship).not.toContain("--color-success");
    expect(unpaidScholarship).toContain(unpaid);
  });

  it("keeps overdue scholarship months on the overdue red, not collected green", () => {
    const overdue = sectionCollectionsMonthCellClasses("due", true, false);
    const overdueScholarship = sectionCollectionsMonthCellClasses("due", true, true);

    expect(overdueScholarship).toContain("--color-error");
    expect(overdueScholarship).not.toContain("--color-success");
    expect(overdueScholarship).toContain(overdue);
  });

  it("still paints collected months green and adds a non-green scholarship mark", () => {
    const paid = sectionCollectionsMonthCellClasses("approved", false, false);
    const paidScholarship = sectionCollectionsMonthCellClasses("approved", false, true);

    expect(paid).toContain("--color-success");
    expect(paidScholarship).toContain(paid);
    expect(paidScholarship.length).toBeGreaterThan(paid.length);
    expect(paidScholarship.replace(paid, "")).not.toContain("--color-success");
  });
});
