import { describe, expect, it } from "vitest";
import { mergeSharedPublicEvents } from "@/lib/events/mergeSharedPublicEvents";

// REGRESSION CHECK: A local slug hides the shared event. The shared row is not a second copy.

describe("mergeSharedPublicEvents", () => {
  it("keeps the local event when the slug matches", () => {
    const local = [{ slug: "gala", title: "Local" }];
    const shared = [{ slug: "gala", title: "Shared" }];
    expect(mergeSharedPublicEvents({ local, shared })).toEqual({
      rows: [{ slug: "gala", title: "Local" }],
      hiddenSlugs: ["gala"],
    });
  });

  it("appends a shared event when the slug is free", () => {
    const local = [{ slug: "taller", title: "Local" }];
    const shared = [{ slug: "gala", title: "Shared" }];
    expect(mergeSharedPublicEvents({ local, shared })).toEqual({
      rows: [
        { slug: "taller", title: "Local" },
        { slug: "gala", title: "Shared" },
      ],
      hiddenSlugs: [],
    });
  });
});
