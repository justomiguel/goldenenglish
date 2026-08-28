/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { resolveAcceptLeadWrite } from "@/lib/register/resolveAcceptLeadWrite";

const studentId = "stu-1";

describe("resolveAcceptLeadWrite", () => {
  it("keeps the historic admin path: always enrolled", () => {
    expect(
      resolveAcceptLeadWrite({
        requestedCount: 0,
        pendingCount: 0,
        paidCapture: false,
        studentId,
      }),
    ).toEqual({
      status: "enrolled",
      intake_state: "none",
      accepted_student_id: studentId,
    });
  });

  it("sets needs_section when they paid with no schedule", () => {
    expect(
      resolveAcceptLeadWrite({
        requestedCount: 0,
        pendingCount: 0,
        paidCapture: true,
        studentId,
      }),
    ).toEqual({
      status: "new",
      intake_state: "needs_section",
      accepted_student_id: studentId,
    });
  });

  it("sets section_full when every requested section failed after pay", () => {
    expect(
      resolveAcceptLeadWrite({
        requestedCount: 2,
        pendingCount: 2,
        paidCapture: true,
        studentId,
      }),
    ).toEqual({
      status: "new",
      intake_state: "section_full",
      accepted_student_id: studentId,
    });
  });

  it("enrols when at least one requested section committed after pay", () => {
    expect(
      resolveAcceptLeadWrite({
        requestedCount: 2,
        pendingCount: 1,
        paidCapture: true,
        studentId,
      }),
    ).toEqual({
      status: "enrolled",
      intake_state: "none",
      accepted_student_id: studentId,
    });
  });
});
