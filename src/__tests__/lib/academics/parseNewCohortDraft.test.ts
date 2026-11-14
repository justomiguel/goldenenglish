// REGRESSION CHECK: matrícula off stores no amount. Copy students requires a source cohort.
import { describe, expect, it } from "vitest";
import { failureSentenceForCode, parseNewCohortDraft } from "@/lib/academics/parseNewCohortDraft";

const base = {
  name: "2027",
  chargesEnrollmentFee: false,
  enrollmentFeeAmount: "",
  chargesMonthlyFee: false,
  monthlyFeeAmount: "",
  copySections: false,
  sourceCohortId: "",
  copyStudents: false,
};

describe("parseNewCohortDraft", () => {
  it("rejects a short name", () => {
    expect(parseNewCohortDraft({ ...base, name: "A" })).toEqual({
      ok: false,
      code: "name_too_short",
    });
  });

  it("requires an amount when matrícula is on", () => {
    expect(parseNewCohortDraft({ ...base, chargesEnrollmentFee: true })).toEqual({
      ok: false,
      code: "fee_amount_required",
    });
  });

  it("rejects a negative matrícula amount", () => {
    expect(
      parseNewCohortDraft({
        ...base,
        chargesEnrollmentFee: true,
        enrollmentFeeAmount: "-5",
      }),
    ).toEqual({ ok: false, code: "fee_amount_invalid" });
  });

  it("stores the amount and ignores copy students when copy is off", () => {
    expect(
      parseNewCohortDraft({
        ...base,
        chargesEnrollmentFee: true,
        enrollmentFeeAmount: "15000",
        copyStudents: true,
      }),
    ).toEqual({
      ok: true,
      name: "2027",
      slugBase: "2027",
      enrollmentFeeAmount: 15000,
      monthlyFeeAmount: null,
      sourceCohortId: null,
      copyStudents: false,
    });
  });

  it("stores the unified section fee only when that box is on", () => {
    expect(parseNewCohortDraft({ ...base, chargesMonthlyFee: true })).toEqual({
      ok: false,
      code: "monthly_fee_required",
    });
    expect(
      parseNewCohortDraft({ ...base, chargesMonthlyFee: true, monthlyFeeAmount: "45000" }),
    ).toMatchObject({ ok: true, monthlyFeeAmount: 45000, enrollmentFeeAmount: null });
  });

  it("requires a source cohort before copying students", () => {
    expect(parseNewCohortDraft({ ...base, copySections: true, copyStudents: true })).toEqual({
      ok: false,
      code: "source_required",
    });
  });

  it("shows the sentence for a known code and the raw code when unknown", () => {
    const messages = { name_too_short: "Name is too short. Code: name_too_short" };
    expect(failureSentenceForCode("name_too_short", messages)).toBe(messages.name_too_short);
    expect(failureSentenceForCode("copy_failed", messages)).toBe("copy_failed");
  });
});
