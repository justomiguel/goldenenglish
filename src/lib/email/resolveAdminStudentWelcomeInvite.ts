import { isDeliverableAuthEmail } from "@/lib/auth/isSyntheticAuthEmail";

export type AdminStudentWelcomeAudience = "student" | "tutor";

export type AdminStudentWelcomeInvite = {
  audience: AdminStudentWelcomeAudience;
  emails: string[];
};

function uniqueDeliverable(emails: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of emails) {
    const email = (raw ?? "").trim().toLowerCase();
    if (!isDeliverableAuthEmail(email) || seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

/**
 * Who gets the admin-created-student welcome: minors → tutor only
 * (never the child). Adults → the student when their mailbox is real,
 * otherwise a linked tutor.
 */
export function resolveAdminStudentWelcomeInvite(input: {
  isMinor: boolean;
  studentEmail: string | null | undefined;
  tutorEmails: Array<string | null | undefined>;
}): AdminStudentWelcomeInvite | null {
  const tutorEmails = uniqueDeliverable(input.tutorEmails);
  if (input.isMinor) {
    return tutorEmails.length > 0 ? { audience: "tutor", emails: tutorEmails } : null;
  }
  const studentEmails = uniqueDeliverable([input.studentEmail]);
  if (studentEmails.length > 0) {
    return { audience: "student", emails: studentEmails };
  }
  return tutorEmails.length > 0 ? { audience: "tutor", emails: tutorEmails } : null;
}
