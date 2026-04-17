import { describe, expect, it } from "vitest";
import { resolveClassReminderRecipientUserId } from "@/lib/notifications/resolveClassReminderRecipient";

describe("resolveClassReminderRecipientUserId", () => {
  it("returns student when not minor", () => {
    expect(
      resolveClassReminderRecipientUserId({
        studentId: "s1",
        isMinor: false,
        tutorIdsOrdered: ["t1"],
      }),
    ).toEqual({ recipientUserId: "s1" });
  });

  it("returns first tutor when minor", () => {
    expect(
      resolveClassReminderRecipientUserId({
        studentId: "s1",
        isMinor: true,
        tutorIdsOrdered: ["t1", "t2"],
      }),
    ).toEqual({ recipientUserId: "t1" });
  });

  it("errors when minor and no tutor", () => {
    expect(
      resolveClassReminderRecipientUserId({
        studentId: "s1",
        isMinor: true,
        tutorIdsOrdered: [],
      }),
    ).toEqual({ error: "no_tutor_for_minor" });
  });
});
