import { parseOptionalFeeAmount } from "@/lib/billing/resolveCohortFeeDefaults";
import { slugifyPublicPathSegment } from "@/lib/site/slugifyPublicPathSegment";

export type NewCohortDraftCode =
  | "name_too_short"
  | "fee_amount_required"
  | "fee_amount_invalid"
  | "monthly_fee_required"
  | "monthly_fee_invalid"
  | "source_required";

export type NewCohortDraftInput = {
  name: string;
  chargesEnrollmentFee: boolean;
  enrollmentFeeAmount: string;
  chargesMonthlyFee: boolean;
  monthlyFeeAmount: string;
  copySections: boolean;
  sourceCohortId: string;
  copyStudents: boolean;
};

export type NewCohortDraft =
  | {
      ok: true;
      name: string;
      slugBase: string;
      enrollmentFeeAmount: number | null;
      monthlyFeeAmount: number | null;
      sourceCohortId: string | null;
      copyStudents: boolean;
    }
  | { ok: false; code: NewCohortDraftCode };

function parseChargedAmount(
  on: boolean,
  raw: string,
  required: NewCohortDraftCode,
  invalid: NewCohortDraftCode,
): { ok: true; amount: number | null } | { ok: false; code: NewCohortDraftCode } {
  if (!on) return { ok: true, amount: null };
  if (raw.trim() === "") return { ok: false, code: required };
  const amount = parseOptionalFeeAmount(raw);
  if (amount == null) return { ok: false, code: invalid };
  return { ok: true, amount };
}

export function parseNewCohortDraft(input: NewCohortDraftInput): NewCohortDraft {
  const name = input.name.trim();
  if (name.length < 2) return { ok: false, code: "name_too_short" };

  const enrollment = parseChargedAmount(
    input.chargesEnrollmentFee,
    input.enrollmentFeeAmount,
    "fee_amount_required",
    "fee_amount_invalid",
  );
  if (!enrollment.ok) return enrollment;
  const monthly = parseChargedAmount(
    input.chargesMonthlyFee,
    input.monthlyFeeAmount,
    "monthly_fee_required",
    "monthly_fee_invalid",
  );
  if (!monthly.ok) return monthly;
  const enrollmentFeeAmount = enrollment.amount;

  const source = input.sourceCohortId.trim();
  if (input.copySections && source.length === 0) {
    return { ok: false, code: "source_required" };
  }

  return {
    ok: true,
    name,
    slugBase: slugifyPublicPathSegment(name) || "cohort",
    enrollmentFeeAmount,
    monthlyFeeAmount: monthly.amount,
    sourceCohortId: input.copySections ? source : null,
    copyStudents: input.copySections && input.copyStudents,
  };
}

export function failureSentenceForCode(code: string, messages: Record<string, string>): string {
  const sentence = messages[code];
  return sentence && sentence.length > 0 ? sentence : code;
}
