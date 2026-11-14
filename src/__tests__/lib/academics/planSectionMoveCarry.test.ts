import { describe, expect, it } from "vitest";
import {
  DEFAULT_SECTION_MOVE_CARRY,
  listSectionMoveCollisions,
  planSectionMoveCarry,
} from "@/lib/academics/planSectionMoveCarry";

const originPayment = { id: "pay-origin", month: 3, year: 2026 };
const destPayment = { id: "pay-dest", month: 3, year: 2026 };
const otherPayment = { id: "pay-april", month: 4, year: 2026 };
const originScholarship = { id: "sch-origin", discountPercent: 50 };
const destScholarship = { id: "sch-dest" };

describe("planSectionMoveCarry", () => {
  it("starts with finance on and attendance and grades off", () => {
    expect(DEFAULT_SECTION_MOVE_CARRY).toEqual({
      payments: true,
      scholarships: true,
      enrollmentFee: true,
      annualSettlement: true,
      attendance: false,
      grades: false,
    });
  });

  it("moves a payment that does not exist in the destination", () => {
    const plan = planSectionMoveCarry({
      flags: { ...DEFAULT_SECTION_MOVE_CARRY, scholarships: false },
      originPayments: [otherPayment],
      destinationPayments: [],
      originScholarships: [],
      destinationScholarships: [],
      choices: [],
    });
    expect(plan).toEqual({
      ok: true,
      plan: expect.objectContaining({
        paymentMoves: ["pay-april"],
        paymentSupersede: [],
      }),
    });
  });

  it("asks for a choice when the destination already has that month", () => {
    const result = planSectionMoveCarry({
      flags: DEFAULT_SECTION_MOVE_CARRY,
      originPayments: [originPayment],
      destinationPayments: [destPayment],
      originScholarships: [],
      destinationScholarships: [],
      choices: [],
    });
    expect(result).toMatchObject({
      ok: false,
      code: "carry_choice_missing",
      collision: { kind: "payment", originId: "pay-origin", month: 3, year: 2026 },
    });
  });

  it("leaves a colliding payment on the origin", () => {
    const plan = planSectionMoveCarry({
      flags: DEFAULT_SECTION_MOVE_CARRY,
      originPayments: [originPayment, otherPayment],
      destinationPayments: [destPayment],
      originScholarships: [],
      destinationScholarships: [],
      choices: [{ originId: "pay-origin", choice: "leave" }],
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.plan.paymentMoves).toEqual(["pay-april"]);
    expect(plan.plan.paymentSupersede).toEqual([]);
  });

  it("supersedes the destination payment when staff replace it", () => {
    const plan = planSectionMoveCarry({
      flags: DEFAULT_SECTION_MOVE_CARRY,
      originPayments: [originPayment],
      destinationPayments: [destPayment],
      originScholarships: [],
      destinationScholarships: [],
      choices: [{ originId: "pay-origin", choice: "replace" }],
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.plan.paymentMoves).toEqual(["pay-origin"]);
    expect(plan.plan.paymentSupersede).toEqual([
      { destinationId: "pay-dest", supersededByPaymentId: "pay-origin" },
    ]);
  });

  it("does not move payments when the box is off", () => {
    const collisions = listSectionMoveCollisions({
      flags: { ...DEFAULT_SECTION_MOVE_CARRY, payments: false },
      originPayments: [originPayment],
      destinationPayments: [destPayment],
      originScholarships: [],
      destinationScholarships: [],
    });
    expect(collisions).toEqual([]);
    const plan = planSectionMoveCarry({
      flags: { ...DEFAULT_SECTION_MOVE_CARRY, payments: false },
      originPayments: [originPayment],
      destinationPayments: [destPayment],
      originScholarships: [],
      destinationScholarships: [],
      choices: [],
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.plan.paymentMoves).toEqual([]);
    expect(plan.plan.copyEnrollmentFee).toBe(true);
    expect(plan.plan.moveAttendance).toBe(false);
    expect(plan.plan.moveGrades).toBe(false);
  });

  it("deactivates the destination scholarship on replace and can leave another", () => {
    const second = { id: "sch-two", discountPercent: 25 };
    const missing = planSectionMoveCarry({
      flags: DEFAULT_SECTION_MOVE_CARRY,
      originPayments: [],
      destinationPayments: [],
      originScholarships: [originScholarship, second],
      destinationScholarships: [destScholarship],
      choices: [],
    });
    expect(missing).toMatchObject({ ok: false, code: "carry_choice_missing" });

    const plan = planSectionMoveCarry({
      flags: DEFAULT_SECTION_MOVE_CARRY,
      originPayments: [],
      destinationPayments: [],
      originScholarships: [originScholarship, second],
      destinationScholarships: [destScholarship],
      choices: [
        { originId: "sch-origin", choice: "replace" },
        { originId: "sch-two", choice: "leave" },
      ],
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.plan.scholarshipMoves).toEqual(["sch-origin"]);
    expect(plan.plan.scholarshipDeactivateIds).toEqual(["sch-dest"]);
  });

  it("refuses two payments that would occupy the same destination month", () => {
    const twin = { id: "pay-twin", month: 3, year: 2026 };
    const result = planSectionMoveCarry({
      flags: { ...DEFAULT_SECTION_MOVE_CARRY, scholarships: false },
      originPayments: [originPayment, twin],
      destinationPayments: [],
      originScholarships: [],
      destinationScholarships: [],
      choices: [
        { originId: "pay-origin", choice: "replace" },
        { originId: "pay-twin", choice: "replace" },
      ],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("carry_choice_missing");
  });
});
