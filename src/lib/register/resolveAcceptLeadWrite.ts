export type AcceptLeadWrite = {
  status: "enrolled" | "new";
  intake_state: "none" | "needs_section" | "section_full";
  accepted_student_id: string;
};

export function resolveAcceptLeadWrite(input: {
  requestedCount: number;
  pendingCount: number;
  paidCapture: boolean;
  studentId: string;
}): AcceptLeadWrite {
  if (input.paidCapture && input.requestedCount === 0) {
    return {
      status: "new",
      intake_state: "needs_section",
      accepted_student_id: input.studentId,
    };
  }
  if (
    input.paidCapture &&
    input.requestedCount > 0 &&
    input.pendingCount === input.requestedCount
  ) {
    return {
      status: "new",
      intake_state: "section_full",
      accepted_student_id: input.studentId,
    };
  }
  return {
    status: "enrolled",
    intake_state: "none",
    accepted_student_id: input.studentId,
  };
}
