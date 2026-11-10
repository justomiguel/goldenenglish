/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { resolveAcceptLeadWrite } from "@/lib/register/resolveAcceptLeadWrite";

const studentId = "stu-1";

describe("resolveAcceptLeadWrite", () => {
  it("keeps the lead open without a section after alta", () => {
    expect(
      resolveAcceptLeadWrite({
        requestedCount: 1,
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

  it("keeps a zero-fee alta on the open list too", () => {
    expect(
      resolveAcceptLeadWrite({
        requestedCount: 0,
        pendingCount: 0,
        paidCapture: false,
        studentId,
      }),
    ).toEqual({
      status: "new",
      intake_state: "needs_section",
      accepted_student_id: studentId,
    });
  });
});
