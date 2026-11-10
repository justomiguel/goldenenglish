/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  cohortIdBySection,
  matriculaBlocksManualAlta,
  registrationMatriculaAmount,
  registrationMatriculaFailureMessage,
  registrationMatriculaLines,
  sectionAssignedRegistrationWrite,
  sectionMatchesRegisteredCohort,
} from "@/lib/register/registrationMatriculaAlta";

describe("registrationMatriculaAlta", () => {
  it("blocks manual alta while a matrícula is unpaid", () => {
    expect(matriculaBlocksManualAlta({ chargesEnrollmentFee: true, feeCaptured: false })).toBe(
      true,
    );
    expect(matriculaBlocksManualAlta({ snapshotTotal: 80, feeCaptured: false })).toBe(true);
    expect(matriculaBlocksManualAlta({ chargesEnrollmentFee: true, feeCaptured: true })).toBe(
      false,
    );
    expect(matriculaBlocksManualAlta({ chargesEnrollmentFee: false, snapshotTotal: 0 })).toBe(
      false,
    );
  });

  it("uses the live fee when the snapshot total is zero", () => {
    expect(registrationMatriculaAmount(0, 120)).toBe(120);
    expect(registrationMatriculaAmount(80, 120)).toBe(80);
    expect(registrationMatriculaAmount(0, 0)).toBe(0);
  });

  it("shows the Mercado Pago line and keeps the approved student on the row", () => {
    expect(
      registrationMatriculaLines({
        status: "new",
        intakeState: "needs_section",
        enrollmentFeePaidMethod: "gateway",
        acceptedStudentId: "stu-1",
      }),
    ).toEqual(["mercadopago", "approved_without_section"]);
  });

  it("shows the receipt until staff approve it", () => {
    expect(
      registrationMatriculaLines({
        status: "new",
        intakeState: "receipt_pending",
        enrollmentFeeReceiptPath: "receipts/a.pdf",
      }),
    ).toEqual(["receipt_pending"]);
  });

  it("shows the in-person mark", () => {
    expect(
      registrationMatriculaLines({
        status: "new",
        intakeState: "needs_section",
        enrollmentFeePaidMethod: "cash",
        acceptedStudentId: "stu-1",
      }),
    ).toEqual(["in_person", "approved_without_section"]);
  });

  it("matches a section only inside the registered cohort", () => {
    expect(sectionMatchesRegisteredCohort("cohort-2027", "cohort-2027")).toBe(true);
    expect(sectionMatchesRegisteredCohort("cohort-2026", "cohort-2027")).toBe(false);
    expect(sectionMatchesRegisteredCohort(null, "cohort-2027")).toBe(false);
  });

  it("leaves the open list only after the section enrollment is saved", () => {
    expect(sectionAssignedRegistrationWrite()).toEqual({
      status: "enrolled",
      intake_state: "none",
    });
  });

  it("reads the cohort id from the preferred section row", () => {
    const map = cohortIdBySection([
      { id: "sec-1", cohort_id: "cohort-2027" },
      { id: "sec-2" },
    ]);
    expect(map.get("sec-1")).toBe("cohort-2027");
    expect(map.has("sec-2")).toBe(false);
  });

  it("keeps a known failure sentence and shows an unknown code", () => {
    const sentences = {
      section_cohort_mismatch: "Wrong cohort. Code: section_cohort_mismatch",
    };
    expect(
      registrationMatriculaFailureMessage(
        "section_cohort_mismatch",
        sentences,
        "Send this code. Code: {{code}}",
      ),
    ).toBe("Wrong cohort. Code: section_cohort_mismatch");
    expect(
      registrationMatriculaFailureMessage("no_such_code", sentences, "Send this code. Code: {{code}}"),
    ).toContain("no_such_code");
  });
});
