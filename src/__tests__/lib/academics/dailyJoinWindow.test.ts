import { describe, expect, it } from "vitest";
import { openDailyWindow } from "@/lib/academics/dailyJoinWindow";

const slot = { dayOfWeek: 1, startTime: "18:00", endTime: "19:00" };

describe("openDailyWindow", () => {
  it("opens 15 minutes before start", () => {
    const now = new Date("2026-11-02T20:45:00.000Z"); // Monday 17:45 in Cordoba (UTC-3)
    const open = openDailyWindow({
      now,
      timeZone: "America/Argentina/Cordoba",
      slots: [slot],
    });
    expect(open?.startTime).toBe("18:00");
    expect(open?.expUnix).toBe(
      Math.floor(new Date("2026-11-03T00:00:00.000Z").getTime() / 1000),
    );
  });

  it("stays open two hours after the end", () => {
    const now = new Date("2026-11-02T22:30:00.000Z"); // Monday 19:30
    expect(
      openDailyWindow({
        now,
        timeZone: "America/Argentina/Cordoba",
        slots: [slot],
      })?.startTime,
    ).toBe("18:00");
  });

  it("is closed one minute before the window", () => {
    const now = new Date("2026-11-02T20:44:00.000Z"); // Monday 17:44
    expect(
      openDailyWindow({
        now,
        timeZone: "America/Argentina/Cordoba",
        slots: [slot],
      }),
    ).toBeNull();
  });

  it("picks the earlier start when two windows overlap", () => {
    const now = new Date("2026-11-02T21:00:00.000Z"); // Monday 18:00
    const open = openDailyWindow({
      now,
      timeZone: "America/Argentina/Cordoba",
      slots: [
        { dayOfWeek: 1, startTime: "18:10", endTime: "19:00" },
        { dayOfWeek: 1, startTime: "17:50", endTime: "19:30" },
      ],
    });
    expect(open?.startTime).toBe("17:50");
  });

  it("picks earlier zoned start across calendar days when HH:MM sorts wrong", () => {
    const now = new Date("2026-11-03T03:40:00.000Z"); // Tue 00:40 Cordoba
    const open = openDailyWindow({
      now,
      timeZone: "America/Argentina/Cordoba",
      slots: [
        { dayOfWeek: 1, startTime: "22:00", endTime: "23:00" },
        { dayOfWeek: 2, startTime: "00:30", endTime: "01:00" },
      ],
    });
    expect(open?.startTime).toBe("22:00");
    expect(open?.dayOfWeek).toBe(1);
  });
});
