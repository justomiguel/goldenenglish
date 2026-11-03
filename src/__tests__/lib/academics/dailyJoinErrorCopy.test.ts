import { describe, expect, it } from "vitest";
import { dailyJoinErrorCopy } from "@/lib/academics/dailyJoinErrorCopy";

const errors = {
  person: "You cannot join this class.",
  mode: "This class has no video call.",
  plan: "This class has no video call.",
  credentials: "The video call is not ready.",
  room: "The room does not exist yet.",
  window: "The class is not open now.",
  daily_failed: "The room could not be opened.",
};

describe("dailyJoinErrorCopy", () => {
  it("maps plan to the mode sentence", () => {
    expect(dailyJoinErrorCopy("plan", errors)).toBe(errors.mode);
  });

  it("maps each join code to its sentence", () => {
    expect(dailyJoinErrorCopy("window", errors)).toBe(errors.window);
    expect(dailyJoinErrorCopy("daily_failed", errors)).toBe(errors.daily_failed);
    expect(dailyJoinErrorCopy("unknown", errors)).toBe(errors.person);
  });
});
