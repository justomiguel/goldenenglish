// REGRESSION CHECK: optional / null steps must not enter L3 required anchors.
import { describe, expect, it } from "vitest";
import { requiredAnchorsFromContentOnlyDefs } from "@/lib/admin-tutorials/requiredAnchorsFromContentOnlyDefs";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

describe("requiredAnchorsFromContentOnlyDefs", () => {
  it("drops null and optional anchors", () => {
    expect(
      requiredAnchorsFromContentOnlyDefs([
        { key: "intro", anchor: null },
        { key: "title", anchor: ADMIN_TOUR_ANCHORS.usersTitle },
        { key: "subnav", anchor: ADMIN_TOUR_ANCHORS.usersSubnav, optional: true },
        { key: "table", anchor: ADMIN_TOUR_ANCHORS.usersTable },
      ]),
    ).toEqual([ADMIN_TOUR_ANCHORS.usersTitle, ADMIN_TOUR_ANCHORS.usersTable]);
  });
});
