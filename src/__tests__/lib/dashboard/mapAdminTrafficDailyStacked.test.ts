import { describe, expect, it } from "vitest";
import {
  mapAdminTrafficDailyStacked,
  trafficVisitsSeries,
  trafficWeekOverWeekFromDaily,
} from "@/lib/dashboard/mapAdminTrafficDailyStacked";

describe("mapAdminTrafficDailyStacked", () => {
  it("maps RPC rows to numbers and a visits series that is auth + guest", () => {
    const daily = mapAdminTrafficDailyStacked([
      { day: "2026-08-01", authenticated_hits: "4", guest_hits: "11", bot_hits: "2" },
      { day: "2026-08-02", authenticated_hits: 8, guest_hits: 3, bot_hits: 9 },
    ]);
    expect(trafficVisitsSeries(daily)).toEqual([
      { day: "2026-08-01", visits: 15 },
      { day: "2026-08-02", visits: 11 },
    ]);
  });

  it("week-over-week splits the last 7 days vs the 7 before that", () => {
    const daily = mapAdminTrafficDailyStacked(
      Array.from({ length: 14 }, (_, i) => {
        const d = new Date(Date.UTC(2026, 7, 8 + i));
        const day = d.toISOString().slice(0, 10);
        return {
          day,
          authenticated_hits: i < 7 ? 10 : 20,
          guest_hits: 0,
          bot_hits: 0,
        };
      }),
    );
    expect(trafficWeekOverWeekFromDaily(daily)).toEqual({
      thisWeek: 140,
      lastWeek: 70,
    });
  });
});
