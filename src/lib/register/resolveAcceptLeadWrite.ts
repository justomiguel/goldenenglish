export type AcceptLeadWrite = {
  status: "enrolled" | "new";
  intake_state: "none" | "needs_section" | "section_full";
  accepted_student_id: string;
};

/** Alta creates the student and leaves the section for a later assign step. */
export function resolveAcceptLeadWrite(input: {
  requestedCount: number;
  pendingCount: number;
  paidCapture: boolean;
  studentId: string;
}): AcceptLeadWrite {
  void input.requestedCount;
  void input.pendingCount;
  void input.paidCapture;
  return {
    status: "new",
    intake_state: "needs_section",
    accepted_student_id: input.studentId,
  };
}
