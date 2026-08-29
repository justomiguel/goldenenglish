/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { planTrialSeatMark } from "@/lib/register/planTrialSeatMark";

describe("planTrialSeatMark", () => {
  it("marks present from booked and mints convert + invite", () => {
    expect(
      planTrialSeatMark({
        status: "booked",
        mark: "present",
        hasConvertToken: false,
        missedMailSent: false,
      }),
    ).toEqual({
      ok: true,
      nextStatus: "attended",
      mintConvertToken: true,
      sendInvite: true,
      mintRescheduleToken: false,
      sendMissed: false,
    });
  });

  it("marks late present from absent and still sends invite", () => {
    expect(
      planTrialSeatMark({
        status: "absent",
        mark: "present",
        hasConvertToken: false,
        missedMailSent: true,
      }),
    ).toEqual({
      ok: true,
      nextStatus: "attended",
      mintConvertToken: true,
      sendInvite: true,
      mintRescheduleToken: false,
      sendMissed: false,
    });
  });

  it("does not send a second invite when already attended", () => {
    expect(
      planTrialSeatMark({
        status: "attended",
        mark: "present",
        hasConvertToken: true,
        missedMailSent: false,
      }),
    ).toEqual({ ok: false, code: "noop" });
  });

  it("marks absent from booked and sends missed-you once", () => {
    expect(
      planTrialSeatMark({
        status: "booked",
        mark: "absent",
        hasConvertToken: false,
        missedMailSent: false,
      }),
    ).toEqual({
      ok: true,
      nextStatus: "absent",
      mintConvertToken: false,
      sendInvite: false,
      mintRescheduleToken: true,
      sendMissed: true,
    });
  });

  it("does not resend missed-you when already sent", () => {
    expect(
      planTrialSeatMark({
        status: "booked",
        mark: "absent",
        hasConvertToken: false,
        missedMailSent: true,
      }).sendMissed,
    ).toBe(false);
  });

  it("rejects marks on released seats", () => {
    expect(
      planTrialSeatMark({
        status: "released",
        mark: "present",
        hasConvertToken: true,
        missedMailSent: false,
      }),
    ).toEqual({ ok: false, code: "invalid" });
  });
});
