/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { parentFilterScopeQuery } from "@/lib/parents/parentFilterScopeQuery";

describe("parentFilterScopeQuery", () => {
  it("flattens filter scope including optional section and directory facets", () => {
    expect(
      parentFilterScopeQuery({
        kind: "filter",
        q: "ana",
        section: "sec-1",
        access: "never",
        phone: "with",
        created: "last30",
        email: "none",
        children: "without",
      }),
    ).toMatchObject({
      scope: "filter",
      q: "ana",
      section: "sec-1",
      access: "never",
    });
    expect(
      parentFilterScopeQuery({
        kind: "filter",
        q: "",
        access: "all",
      }),
    ).toMatchObject({ scope: "filter", section: "" });
  });
});
