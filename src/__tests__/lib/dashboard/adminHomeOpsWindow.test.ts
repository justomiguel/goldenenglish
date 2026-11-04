import { describe, expect, it } from "vitest";
import { adminHomeOpsWindow } from "@/lib/dashboard/adminHomeOpsWindow";

describe("adminHomeOpsWindow", () => {
  it("returns the institute date, weekday, and Monday–Sunday week", () => {
    const window = adminHomeOpsWindow(
      new Date("2026-11-04T15:00:00.000Z"),
      "America/Argentina/Cordoba",
    );
    expect(window).toEqual({
      today: "2026-11-04",
      weekday: 3,
      weekStart: "2026-11-02",
      weekEnd: "2026-11-08",
    });
  });

  it("keeps a Sunday inside the week that started on Monday", () => {
    const window = adminHomeOpsWindow(
      new Date("2026-11-08T15:00:00.000Z"),
      "America/Argentina/Cordoba",
    );
    expect(window.today).toBe("2026-11-08");
    expect(window.weekday).toBe(0);
    expect(window.weekStart).toBe("2026-11-02");
    expect(window.weekEnd).toBe("2026-11-08");
  });
});
