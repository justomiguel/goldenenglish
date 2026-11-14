export type SectionMoveCarryFlags = {
  payments: boolean;
  scholarships: boolean;
  enrollmentFee: boolean;
  annualSettlement: boolean;
  attendance: boolean;
  grades: boolean;
};

export const DEFAULT_SECTION_MOVE_CARRY: SectionMoveCarryFlags = {
  payments: true,
  scholarships: true,
  enrollmentFee: true,
  annualSettlement: true,
  attendance: false,
  grades: false,
};

export type MovePaymentRow = { id: string; month: number; year: number };
export type MoveScholarshipRow = { id: string; discountPercent: number };
export type CarryChoice = "leave" | "replace";
export type CarryResolution = { originId: string; choice: CarryChoice };

export type PaymentCollision = {
  kind: "payment";
  originId: string;
  destinationId: string | null;
  month: number;
  year: number;
};

export type ScholarshipCollision = {
  kind: "scholarship";
  originId: string;
  destinationIds: string[];
  discountPercent: number;
};

export type SectionMoveCollision = PaymentCollision | ScholarshipCollision;

export type SectionMoveCarryPlan = {
  paymentMoves: string[];
  paymentSupersede: { destinationId: string; supersededByPaymentId: string }[];
  scholarshipMoves: string[];
  scholarshipDeactivateIds: string[];
  copyEnrollmentFee: boolean;
  moveAnnualSettlements: boolean;
  moveAttendance: boolean;
  moveGrades: boolean;
};

type PlanInput = {
  flags: SectionMoveCarryFlags;
  originPayments: MovePaymentRow[];
  destinationPayments: MovePaymentRow[];
  originScholarships: MoveScholarshipRow[];
  destinationScholarships: { id: string }[];
  choices: CarryResolution[];
};

function periodKey(month: number, year: number): string {
  return `${year}-${month}`;
}

export function listSectionMoveCollisions(
  input: Omit<PlanInput, "choices">,
): SectionMoveCollision[] {
  const collisions: SectionMoveCollision[] = [];
  if (input.flags.payments) {
    const destByPeriod = new Map<string, MovePaymentRow>();
    for (const row of input.destinationPayments) destByPeriod.set(periodKey(row.month, row.year), row);
    const originsByPeriod = new Map<string, MovePaymentRow[]>();
    for (const row of input.originPayments) {
      const key = periodKey(row.month, row.year);
      originsByPeriod.set(key, [...(originsByPeriod.get(key) ?? []), row]);
    }
    for (const [key, origins] of originsByPeriod) {
      const dest = destByPeriod.get(key);
      if (!dest && origins.length < 2) continue;
      for (const origin of origins) {
        collisions.push({
          kind: "payment",
          originId: origin.id,
          destinationId: dest?.id ?? null,
          month: origin.month,
          year: origin.year,
        });
      }
    }
  }
  if (input.flags.scholarships && input.destinationScholarships.length > 0) {
    const destinationIds = input.destinationScholarships.map((row) => row.id);
    for (const origin of input.originScholarships) {
      collisions.push({
        kind: "scholarship",
        originId: origin.id,
        destinationIds,
        discountPercent: origin.discountPercent,
      });
    }
  }
  return collisions;
}

export function planSectionMoveCarry(
  input: PlanInput,
):
  | { ok: true; plan: SectionMoveCarryPlan }
  | { ok: false; code: "carry_choice_missing"; collision: SectionMoveCollision } {
  const collisions = listSectionMoveCollisions(input);
  const choiceByOrigin = new Map(input.choices.map((row) => [row.originId, row.choice]));
  for (const collision of collisions) {
    const choice = choiceByOrigin.get(collision.originId);
    if (choice !== "leave" && choice !== "replace") {
      return { ok: false, code: "carry_choice_missing", collision };
    }
  }

  const paymentMoves: string[] = [];
  const paymentSupersede: SectionMoveCarryPlan["paymentSupersede"] = [];
  const replacesByPeriod = new Map<string, number>();
  if (input.flags.payments) {
    const paymentCollision = new Map(
      collisions.filter((row): row is PaymentCollision => row.kind === "payment").map((row) => [row.originId, row]),
    );
    for (const origin of input.originPayments) {
      const collision = paymentCollision.get(origin.id);
      const choice = collision ? choiceByOrigin.get(origin.id) : "replace";
      if (choice === "leave") continue;
      const key = periodKey(origin.month, origin.year);
      const next = (replacesByPeriod.get(key) ?? 0) + 1;
      replacesByPeriod.set(key, next);
      if (next > 1) {
        return {
          ok: false,
          code: "carry_choice_missing",
          collision: collision ?? {
            kind: "payment",
            originId: origin.id,
            destinationId: null,
            month: origin.month,
            year: origin.year,
          },
        };
      }
      paymentMoves.push(origin.id);
      if (collision?.destinationId) {
        paymentSupersede.push({
          destinationId: collision.destinationId,
          supersededByPaymentId: origin.id,
        });
      }
    }
  }

  const scholarshipMoves: string[] = [];
  const scholarshipDeactivateIds = new Set<string>();
  if (input.flags.scholarships) {
    const scholarshipCollision = new Map(
      collisions
        .filter((row): row is ScholarshipCollision => row.kind === "scholarship")
        .map((row) => [row.originId, row]),
    );
    for (const origin of input.originScholarships) {
      const collision = scholarshipCollision.get(origin.id);
      const choice = collision ? choiceByOrigin.get(origin.id) : "replace";
      if (choice === "leave") continue;
      scholarshipMoves.push(origin.id);
      for (const id of collision?.destinationIds ?? []) scholarshipDeactivateIds.add(id);
    }
  }

  return {
    ok: true,
    plan: {
      paymentMoves,
      paymentSupersede,
      scholarshipMoves,
      scholarshipDeactivateIds: [...scholarshipDeactivateIds],
      copyEnrollmentFee: input.flags.enrollmentFee,
      moveAnnualSettlements: input.flags.annualSettlement,
      moveAttendance: input.flags.attendance,
      moveGrades: input.flags.grades,
    },
  };
}
