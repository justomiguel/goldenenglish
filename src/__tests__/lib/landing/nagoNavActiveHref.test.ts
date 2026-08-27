import { describe, expect, it } from "vitest";
import { resolveNagoNavActiveHref } from "@/lib/landing/nagoNavActiveHref";

describe("resolveNagoNavActiveHref", () => {
  it("marks events when the pathname is the events list or an event page", () => {
    expect(
      resolveNagoNavActiveHref({ locale: "es", pathname: "/es/events", intersectingIds: ["sobre"] }),
    ).toBe("/es/events");
    expect(
      resolveNagoNavActiveHref({
        locale: "es",
        pathname: "/es/events/roda",
        intersectingIds: [],
      }),
    ).toBe("/es/events");
  });

  it("picks the last intersecting landing section in document order", () => {
    expect(
      resolveNagoNavActiveHref({
        locale: "es",
        pathname: "/es",
        intersectingIds: ["sobre", "principios"],
      }),
    ).toBe("/es#principios");
  });

  it("falls back to #top on the landing when nothing is intersecting", () => {
    expect(
      resolveNagoNavActiveHref({ locale: "pt", pathname: "/pt", intersectingIds: [] }),
    ).toBe("/pt#top");
  });
});
