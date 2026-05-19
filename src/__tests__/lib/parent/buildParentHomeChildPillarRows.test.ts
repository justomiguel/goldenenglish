import { describe, it, expect } from "vitest";
import {
  aggregatePillarLevelFromChildRows,
  buildParentHomeChildAttendanceRows,
  buildParentHomeChildPaymentRows,
} from "@/lib/parent/buildParentHomeChildPillarRows";

const labels = {
  attendanceOkDetail: "{pct}% on track",
  attendanceAttentionDetail: "{pct}% below target",
  attendanceUnknownDetail: "No data yet",
  paymentsOkDetail: "Fees up to date",
  paymentsAttentionDetail: "Overdue monthly fees",
};

describe("buildParentHomeChildPillarRows", () => {
  const children = [
    { studentId: "a", firstName: "Ana", lastName: "Lopez" },
    { studentId: "b", firstName: "Bruno", lastName: "Diaz" },
  ];

  it("builds per-child attendance rows", () => {
    const rows = buildParentHomeChildAttendanceRows(
      children,
      { a: 80, b: 55 },
      labels,
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]?.level).toBe("ok");
    expect(rows[1]?.level).toBe("attention");
    expect(rows[0]?.displayName).toContain("Lopez");
  });

  it("aggregates attention when any child needs review", () => {
    const rows = buildParentHomeChildPaymentRows(
      children,
      { a: false, b: true },
      labels,
    );
    expect(aggregatePillarLevelFromChildRows(rows)).toBe("attention");
  });
});
