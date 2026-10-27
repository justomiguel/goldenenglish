import { describe, expect, it } from "vitest";
import { digestChartSvgs } from "@/lib/admin-digest/adminWeeklyDigestCharts";
import { rasterizeDigestSvg } from "@/lib/admin-digest/rasterizeDigestCharts";
import { digestFixture } from "@/__tests__/lib/admin-digest/digestFixture";

describe("rasterizeDigestSvg", () => {
  it("turns the tuition chart into a PNG", async () => {
    const svg = digestChartSvgs(digestFixture(), {
      primary: "#103A5C",
      primaryLight: "#2A5B84",
      primaryDark: "#0A253D",
      foreground: "#FFFFFF",
      background: "#FAF9F6",
    }).cobro;
    const png = await rasterizeDigestSvg(svg);
    expect(png?.startsWith("iVBORw0KGgo")).toBe(true);
  });
});
