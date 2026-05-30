import { describe, expect, it } from "vitest";
import {
  buildAttendeeInitials,
  resolveAttendeePaymentStatusTone,
  resolveAttendeeRegistrationStatusTone,
} from "@/lib/events/resolveAttendeePresentation";

describe("resolveAttendeePresentation", () => {
  it("maps registration statuses to presentation tones", () => {
    expect(resolveAttendeeRegistrationStatusTone("confirmed")).toBe("success");
    expect(resolveAttendeeRegistrationStatusTone("pending_payment")).toBe("warning");
    expect(resolveAttendeeRegistrationStatusTone("cancelled")).toBe("error");
    expect(resolveAttendeeRegistrationStatusTone("waitlist")).toBe("muted");
  });

  it("maps payment statuses to presentation tones", () => {
    expect(resolveAttendeePaymentStatusTone("approved")).toBe("success");
    expect(resolveAttendeePaymentStatusTone("pending")).toBe("warning");
    expect(resolveAttendeePaymentStatusTone("rejected")).toBe("error");
    expect(resolveAttendeePaymentStatusTone(undefined)).toBe("muted");
  });

  it("builds attendee initials from names", () => {
    expect(buildAttendeeInitials("Ana", "Pérez")).toBe("AP");
    expect(buildAttendeeInitials("  ", "")).toBe("?");
  });

  it("uses muted tone for unknown statuses", () => {
    expect(resolveAttendeeRegistrationStatusTone("unknown")).toBe("muted");
    expect(resolveAttendeePaymentStatusTone("refunded")).toBe("muted");
  });
});
