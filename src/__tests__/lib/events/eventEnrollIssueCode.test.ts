import { describe, expect, it } from "vitest";
import { eventEnrollIssueCode } from "@/lib/events/eventEnrollIssueCode";

describe("eventEnrollIssueCode", () => {
  it("keeps a stable custom message", () => {
    expect(
      eventEnrollIssueCode({ message: "event_tutor_required", path: ["tutor"] }),
    ).toBe("event_tutor_required");
    expect(
      eventEnrollIssueCode({
        message: "required_field_missing:11111111-1111-4111-8111-111111111111",
        path: [],
      }),
    ).toBe("required_field_missing:11111111-1111-4111-8111-111111111111");
  });

  it("maps a field path when Zod writes its own sentence", () => {
    expect(
      eventEnrollIssueCode({ message: "Invalid email address", path: ["email"] }),
    ).toBe("email_invalid");
    expect(
      eventEnrollIssueCode({ message: "Too small", path: ["base", "firstName"] }),
    ).toBe("first_name_required");
    expect(eventEnrollIssueCode({ message: "Invalid", path: ["phone"] })).toBe("phone_required");
  });

  it("uses invalid_body when the issue has no known field", () => {
    expect(eventEnrollIssueCode({ message: "Invalid input", path: [] })).toBe("invalid_body");
  });
});
