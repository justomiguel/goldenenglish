export type TrialSeatStatus = "booked" | "attended" | "absent" | "released";

export type PlanTrialSeatMarkResult =
  | { ok: false; code: "noop" | "invalid" }
  | {
      ok: true;
      nextStatus: "attended" | "absent";
      mintConvertToken: boolean;
      sendInvite: boolean;
      mintRescheduleToken: boolean;
      sendMissed: boolean;
    };

export function planTrialSeatMark(input: {
  status: TrialSeatStatus;
  mark: "present" | "absent";
  hasConvertToken: boolean;
  missedMailSent: boolean;
  hasRescheduleToken?: boolean;
}): PlanTrialSeatMarkResult {
  if (input.status === "released") return { ok: false, code: "invalid" };

  if (input.mark === "present") {
    if (input.status === "attended") return { ok: false, code: "noop" };
    if (input.status !== "booked" && input.status !== "absent") {
      return { ok: false, code: "invalid" };
    }
    return {
      ok: true,
      nextStatus: "attended",
      mintConvertToken: !input.hasConvertToken,
      sendInvite: true,
      mintRescheduleToken: false,
      sendMissed: false,
    };
  }

  if (input.status !== "booked") {
    return { ok: false, code: input.status === "absent" ? "noop" : "invalid" };
  }
  return {
    ok: true,
    nextStatus: "absent",
    mintConvertToken: false,
    sendInvite: false,
    mintRescheduleToken: !input.hasRescheduleToken,
    sendMissed: !input.missedMailSent,
  };
}
