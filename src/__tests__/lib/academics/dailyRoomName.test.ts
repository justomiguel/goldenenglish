import { describe, expect, it } from "vitest";
import { createDailyRoomName } from "@/lib/academics/dailyRoomName";

describe("createDailyRoomName", () => {
  // REGRESSION CHECK: Room names must stay `s` plus 32 hex chars so Daily
  // accepts them and later tasks can match stored rows.
  it("returns s plus 32 hex characters", () => {
    expect(createDailyRoomName()).toMatch(/^s[0-9a-f]{32}$/);
  });
});
