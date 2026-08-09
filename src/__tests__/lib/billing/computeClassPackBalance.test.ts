import { describe, it, expect } from "vitest";
import { computeClassPackBalance } from "@/lib/billing/computeClassPackBalance";
import type { StudentClassPack } from "@/types/classPack";
import type { ClassCreditConsumption } from "@/types/classCreditLedger";

function pack(over: Partial<StudentClassPack>): StudentClassPack {
  return {
    id: "pack",
    studentId: "stu",
    year: 2026,
    month: 5,
    classCount: 4,
    amount: 32000,
    currency: "ARS",
    priceId: null,
    status: "approved",
    receiptStoragePath: null,
    gatewayProvider: null,
    paidAt: null,
    createdAt: null,
    ...over,
  };
}

function consumption(over: Partial<ClassCreditConsumption>): ClassCreditConsumption {
  return {
    id: "c",
    attendanceId: "att",
    studentId: "stu",
    enrollmentId: "enr",
    sectionId: "sec",
    attendedOn: "2026-05-04",
    year: 2026,
    month: 5,
    credits: 1,
    sourceStatus: "present",
    ...over,
  };
}

// REGRESSION CHECK: only 'approved' and 'exempt' may grant credits. If 'pending' ever starts granting,
// a family uploading an unreviewed transfer receipt gets free classes. And the balance must stay
// derived here — never stored — so an attendance correction cannot leave a stale number behind.

describe("computeClassPackBalance", () => {
  it("is all zeros with no packs and no consumptions", () => {
    expect(computeClassPackBalance({ year: 2026, month: 5, packs: [], consumptions: [] })).toEqual({
      granted: 0,
      consumed: 0,
      balance: 0,
    });
  });

  it("grants credits for an approved pack", () => {
    expect(
      computeClassPackBalance({
        year: 2026,
        month: 5,
        packs: [pack({ classCount: 4, status: "approved" })],
        consumptions: [],
      }),
    ).toEqual({ granted: 4, consumed: 0, balance: 4 });
  });

  it("grants credits for an exempt pack, which is the fully waived case", () => {
    expect(
      computeClassPackBalance({
        year: 2026,
        month: 5,
        packs: [pack({ classCount: 2, status: "exempt" })],
        consumptions: [],
      }),
    ).toMatchObject({ granted: 2, balance: 2 });
  });

  it("grants nothing for pending or rejected packs", () => {
    expect(
      computeClassPackBalance({
        year: 2026,
        month: 5,
        packs: [
          pack({ id: "a", classCount: 4, status: "pending" }),
          pack({ id: "b", classCount: 8, status: "rejected" }),
        ],
        consumptions: [],
      }),
    ).toEqual({ granted: 0, consumed: 0, balance: 0 });
  });

  it("sums several packs bought in the same month, which is how a top-up works", () => {
    expect(
      computeClassPackBalance({
        year: 2026,
        month: 5,
        packs: [
          pack({ id: "a", classCount: 4 }),
          pack({ id: "b", classCount: 2 }),
        ],
        consumptions: [],
      }),
    ).toMatchObject({ granted: 6, balance: 6 });
  });

  it("subtracts each consumption", () => {
    expect(
      computeClassPackBalance({
        year: 2026,
        month: 5,
        packs: [pack({ classCount: 4 })],
        consumptions: [
          consumption({ id: "c1", attendanceId: "a1" }),
          consumption({ id: "c2", attendanceId: "a2" }),
        ],
      }),
    ).toEqual({ granted: 4, consumed: 2, balance: 2 });
  });

  it("honours a consumption worth more than one credit", () => {
    expect(
      computeClassPackBalance({
        year: 2026,
        month: 5,
        packs: [pack({ classCount: 4 })],
        consumptions: [consumption({ credits: 2 })],
      }),
    ).toEqual({ granted: 4, consumed: 2, balance: 2 });
  });

  it("goes negative when classes were attended without credit, so the debt is visible", () => {
    expect(
      computeClassPackBalance({
        year: 2026,
        month: 5,
        packs: [],
        consumptions: [
          consumption({ id: "c1", attendanceId: "a1" }),
          consumption({ id: "c2", attendanceId: "a2" }),
        ],
      }),
    ).toEqual({ granted: 0, consumed: 2, balance: -2 });
  });

  it("ignores rows from other months, because the bag is strictly monthly", () => {
    expect(
      computeClassPackBalance({
        year: 2026,
        month: 5,
        packs: [pack({ id: "april", month: 4, classCount: 8 }), pack({ id: "may", classCount: 4 })],
        consumptions: [
          consumption({ id: "c-april", month: 4, attendanceId: "a-april" }),
          consumption({ id: "c-may", attendanceId: "a-may" }),
        ],
      }),
    ).toEqual({ granted: 4, consumed: 1, balance: 3 });
  });

  it("ignores rows from the same month of another year", () => {
    expect(
      computeClassPackBalance({
        year: 2026,
        month: 5,
        packs: [pack({ id: "old", year: 2025, classCount: 8 })],
        consumptions: [],
      }),
    ).toMatchObject({ granted: 0 });
  });
});
