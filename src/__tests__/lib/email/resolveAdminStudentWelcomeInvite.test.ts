/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import { resolveAdminStudentWelcomeInvite } from "@/lib/email/resolveAdminStudentWelcomeInvite";

describe("resolveAdminStudentWelcomeInvite", () => {
  it("invites only the tutor when the student is a minor", () => {
    const invite = resolveAdminStudentWelcomeInvite({
      isMinor: true,
      studentEmail: "kid@alumnos.test",
      tutorEmails: ["papa@example.com"],
    });
    expect(invite).toEqual({
      audience: "tutor",
      emails: ["papa@example.com"],
    });
  });

  it("does not invite a minor even if the student mailbox looks real", () => {
    const invite = resolveAdminStudentWelcomeInvite({
      isMinor: true,
      studentEmail: "ana@gmail.com",
      tutorEmails: ["mama@example.com"],
    });
    expect(invite?.emails).toEqual(["mama@example.com"]);
    expect(invite?.audience).toBe("tutor");
  });

  it("skips a minor when the tutor only has a synthetic mailbox", () => {
    vi.stubEnv("MAIL_TENANT", "alumnos.test");
    expect(
      resolveAdminStudentWelcomeInvite({
        isMinor: true,
        studentEmail: "ana@alumnos.test",
        tutorEmails: ["123@parents.alumnos.test"],
      }),
    ).toBeNull();
    vi.unstubAllEnvs();
  });

  it("invites the adult student when their mailbox is real", () => {
    expect(
      resolveAdminStudentWelcomeInvite({
        isMinor: false,
        studentEmail: "adulto@example.com",
        tutorEmails: ["tutor@example.com"],
      }),
    ).toEqual({
      audience: "student",
      emails: ["adulto@example.com"],
    });
  });

  it("falls back to the tutor when the adult student has no real mailbox", () => {
    expect(
      resolveAdminStudentWelcomeInvite({
        isMinor: false,
        studentEmail: "123@students.goldenenglish.local",
        tutorEmails: ["tutor@example.com"],
      }),
    ).toEqual({
      audience: "tutor",
      emails: ["tutor@example.com"],
    });
  });

  it("returns null when nobody has a deliverable mailbox", () => {
    expect(
      resolveAdminStudentWelcomeInvite({
        isMinor: false,
        studentEmail: "123@students.goldenenglish.local",
        tutorEmails: [],
      }),
    ).toBeNull();
  });
});
