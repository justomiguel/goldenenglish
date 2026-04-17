/**
 * Resolves who receives class reminders for a student enrollment.
 * Minors → first linked tutor; adults → self.
 */
export function resolveClassReminderRecipientUserId(input: {
  studentId: string;
  isMinor: boolean;
  tutorIdsOrdered: string[];
}): { recipientUserId: string } | { error: "no_tutor_for_minor" } {
  if (!input.isMinor) {
    return { recipientUserId: input.studentId };
  }
  const first = input.tutorIdsOrdered[0];
  if (!first) {
    return { error: "no_tutor_for_minor" };
  }
  return { recipientUserId: first };
}
