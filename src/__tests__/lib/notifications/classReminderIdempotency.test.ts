import { describe, expect, it } from "vitest";
import { buildClassReminderIdempotencyKey } from "@/lib/notifications/classReminderIdempotency";

describe("buildClassReminderIdempotencyKey", () => {
  it("is stable for same inputs", () => {
    const a = buildClassReminderIdempotencyKey({
      sectionEnrollmentId: "e1",
      occurrenceStartMs: 1_700_000_000_000,
      kind: "prep_email",
    });
    const b = buildClassReminderIdempotencyKey({
      sectionEnrollmentId: "e1",
      occurrenceStartMs: 1_700_000_000_000,
      kind: "prep_email",
    });
    expect(a).toBe(b);
    expect(a).toContain("prep_email");
  });
});
