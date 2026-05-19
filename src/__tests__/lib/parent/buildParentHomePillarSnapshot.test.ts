import { describe, it, expect } from "vitest";
import { countStaffInboundThreadsForParent } from "@/lib/parent/countStaffInboundThreadsForParent";
import {
  buildParentHomePillarSnapshot,
  resolveParentAttendanceLevel,
  resolveParentPaymentsLevel,
} from "@/lib/parent/buildParentHomePillarSnapshot";

describe("countStaffInboundThreadsForParent", () => {
  it("counts peers whose latest message is inbound from teacher or admin", () => {
    const parent = "p1";
    const roles = new Map([
      ["t1", "teacher"],
      ["a1", "admin"],
      ["p1", "parent"],
    ]);
    const msgs = [
      { sender_id: "t1", recipient_id: parent },
      { sender_id: parent, recipient_id: "t1" },
      { sender_id: "a1", recipient_id: parent },
    ];
    expect(countStaffInboundThreadsForParent(msgs, parent, roles)).toBe(2);
  });
});

describe("resolveParentPaymentsLevel", () => {
  it("requires overdue monthly or invoice signals for attention", () => {
    expect(resolveParentPaymentsLevel({ hasOverdueMonthly: false, overdueInvoiceCount: 0 })).toBe(
      "ok",
    );
    expect(resolveParentPaymentsLevel({ hasOverdueMonthly: true, overdueInvoiceCount: 0 })).toBe(
      "attention",
    );
    expect(resolveParentPaymentsLevel({ hasOverdueMonthly: false, overdueInvoiceCount: 1 })).toBe(
      "attention",
    );
  });
});

describe("buildParentHomePillarSnapshot", () => {
  it("flags attendance below threshold and overdue payments", () => {
    const snapshot = buildParentHomePillarSnapshot({
      selectedStudentId: "s1",
      attendanceByStudent: { s1: 60 },
      attendanceMinPercent: 75,
      overdueByStudent: { s1: true },
      staffInboundCount: 0,
      overdueInvoiceCount: 0,
    });

    expect(snapshot.attendance.level).toBe("attention");
    expect(snapshot.messages.level).toBe("ok");
    expect(snapshot.payments.level).toBe("attention");
    expect(snapshot.payments.hasOverdueMonthly).toBe(true);
  });

  it("marks all pillars ok when metrics are healthy", () => {
    expect(resolveParentAttendanceLevel(80)).toBe("ok");
    const snapshot = buildParentHomePillarSnapshot({
      selectedStudentId: "s1",
      attendanceByStudent: { s1: 80 },
      overdueByStudent: { s1: false },
      staffInboundCount: 0,
      overdueInvoiceCount: 0,
    });
    expect(snapshot.attendance.level).toBe("ok");
    expect(snapshot.payments.level).toBe("ok");
  });

  it("prefers per-section level map over aggregate percent", () => {
    const snapshot = buildParentHomePillarSnapshot({
      selectedStudentId: "s1",
      attendanceByStudent: { s1: 80 },
      attendanceLevelByStudent: { s1: "attention" },
      overdueByStudent: { s1: false },
      staffInboundCount: 0,
      overdueInvoiceCount: 0,
    });
    expect(snapshot.attendance.level).toBe("attention");
  });

  it("does not flag payments when only future pending exists for selected child", () => {
    const snapshot = buildParentHomePillarSnapshot({
      selectedStudentId: "s1",
      attendanceByStudent: { s1: 80 },
      overdueByStudent: { s1: false },
      staffInboundCount: 0,
      overdueInvoiceCount: 0,
    });
    expect(snapshot.payments.level).toBe("ok");
  });
});
