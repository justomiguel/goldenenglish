import { describe, expect, it } from "vitest";
import { fillVisitSeries, hitsTableForSchema } from "@/lib/pulsar/visitDaySeries";

describe("visitDaySeries", () => {
  it("rejects a schema that is not a plain identifier", () => {
    expect(hitsTableForSchema("public")).toBe("public.traffic_page_hits");
    expect(hitsTableForSchema("tenant_club")).toBe("tenant_club.traffic_page_hits");
    expect(hitsTableForSchema("public;drop")).toBeNull();
  });

  it("fills missing days with zero and keeps the given counts", () => {
    const series = fillVisitSeries(
      [
        { day: "2026-10-28", visits: 4 },
        { day: "2026-10-30", visits: 2 },
      ],
      "2026-10-30",
      3,
    );
    expect(series).toEqual([
      { day: "2026-10-28", visits: 4 },
      { day: "2026-10-29", visits: 0 },
      { day: "2026-10-30", visits: 2 },
    ]);
  });
});
