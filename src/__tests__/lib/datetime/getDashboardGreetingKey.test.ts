import { describe, expect, it } from "vitest";
import { getDashboardGreetingKey, getInstituteHour } from "@/lib/datetime/getDashboardGreetingKey";

const TZ = "America/Argentina/Cordoba";

describe("getDashboardGreetingKey", () => {
  it("maps morning hours (06:00–11:59) to morning", () => {
    const at0900Utc = new Date("2026-04-13T12:00:00.000Z");
    expect(getInstituteHour(at0900Utc, TZ)).toBe(9);
    expect(getDashboardGreetingKey(at0900Utc, TZ)).toBe("morning");
  });

  it("maps afternoon hours (12:00–18:59) to afternoon", () => {
    const at1500Utc = new Date("2026-04-13T18:00:00.000Z");
    expect(getDashboardGreetingKey(at1500Utc, TZ)).toBe("afternoon");
  });

  it("maps evening hours (≥ 19:00) to evening", () => {
    const at2000Utc = new Date("2026-04-13T23:00:00.000Z");
    expect(getDashboardGreetingKey(at2000Utc, TZ)).toBe("evening");
  });

  it("maps late-night hours (< 06:00) to night", () => {
    const at0300Utc = new Date("2026-04-13T06:00:00.000Z");
    expect(getDashboardGreetingKey(at0300Utc, TZ)).toBe("night");
  });

  it("uses the supplied IANA timezone", () => {
    const sameInstant = new Date("2026-04-13T07:00:00.000Z");
    expect(getDashboardGreetingKey(sameInstant, "Asia/Tokyo")).toBe("afternoon");
    expect(getDashboardGreetingKey(sameInstant, "America/Argentina/Cordoba")).toBe("night");
  });
});
