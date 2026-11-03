import { describe, expect, it } from "vitest";
import { planDailyRoomSync } from "@/lib/academics/dailyRoomSyncPlan";

describe("planDailyRoomSync", () => {
  it("creates one room per hybrid slot and deletes a removed slot", () => {
    const plan = planDailyRoomSync({
      mode: "hybrid",
      slots: [{ dayOfWeek: 1, startTime: "18:00" }],
      existing: [{ dayOfWeek: 3, startTime: "18:00", dailyRoomName: "s" + "a".repeat(32) }],
    });
    expect(plan.create).toEqual([{ dayOfWeek: 1, startTime: "18:00" }]);
    expect(plan.delete).toEqual([
      { dayOfWeek: 3, startTime: "18:00", dailyRoomName: "s" + "a".repeat(32) },
    ]);
  });

  it("deletes every room when the mode is in person", () => {
    const existing = [{ dayOfWeek: 1, startTime: "18:00", dailyRoomName: "s" + "b".repeat(32) }];
    expect(planDailyRoomSync({ mode: "in_person", slots: [], existing }).delete).toEqual(existing);
    expect(planDailyRoomSync({ mode: "in_person", slots: [], existing }).create).toEqual([]);
  });
});
