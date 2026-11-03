import { describe, expect, it } from "vitest";
import { denyDailyJoin } from "@/lib/academics/dailyJoinDenial";

const allowedBase = {
  plan: "ecosistema" as const,
  mode: "remote" as const,
  hasCredentials: true,
  hasRoom: true,
  windowOpen: true,
};

describe("denyDailyJoin", () => {
  it("allows teacher and student when all checks pass", () => {
    expect(denyDailyJoin({ ...allowedBase, role: "teacher" })).toBeNull();
    expect(denyDailyJoin({ ...allowedBase, role: "student" })).toBeNull();
  });

  it("denies assistant and other roles", () => {
    expect(denyDailyJoin({ ...allowedBase, role: "assistant" })).toBe("person");
    expect(denyDailyJoin({ ...allowedBase, role: "other" })).toBe("person");
  });

  it("denies non-ecosistema plans", () => {
    expect(denyDailyJoin({ ...allowedBase, plan: "gestion", role: "teacher" })).toBe("plan");
  });

  it("denies in_person mode", () => {
    expect(
      denyDailyJoin({ ...allowedBase, mode: "in_person", role: "teacher" }),
    ).toBe("mode");
  });

  it("denies when credentials are missing", () => {
    expect(
      denyDailyJoin({ ...allowedBase, hasCredentials: false, role: "teacher" }),
    ).toBe("credentials");
  });

  it("denies when room is missing", () => {
    expect(denyDailyJoin({ ...allowedBase, hasRoom: false, role: "teacher" })).toBe("room");
  });

  it("denies when window is closed", () => {
    expect(
      denyDailyJoin({ ...allowedBase, windowOpen: false, role: "teacher" }),
    ).toBe("window");
  });

  it("returns the first failing check in order", () => {
    expect(
      denyDailyJoin({
        plan: "gestion",
        mode: "in_person",
        hasCredentials: false,
        hasRoom: false,
        windowOpen: false,
        role: "assistant",
      }),
    ).toBe("plan");
  });
});
