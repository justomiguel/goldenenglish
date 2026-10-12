import { describe, expect, it } from "vitest";
import { eventPublicLandingFilters } from "@/lib/dashboard/events/eventPublicLandingFilters";

describe("eventPublicLandingFilters", () => {
  it("loads a draft preview by id without requiring the event to be published", () => {
    expect(
      eventPublicLandingFilters({
        slug: "",
        eventId: "evt-1",
        includeUnpublished: true,
      }),
    ).toEqual({ column: "id", value: "evt-1", publishedOnly: false });
  });

  it("keeps the public page on the published slug", () => {
    expect(eventPublicLandingFilters({ slug: "open-day" })).toEqual({
      column: "slug",
      value: "open-day",
      publishedOnly: true,
    });
  });
});
