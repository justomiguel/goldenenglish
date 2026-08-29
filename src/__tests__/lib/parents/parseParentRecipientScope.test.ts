import { describe, expect, it } from "vitest";
import { parseParentRecipientScope } from "@/lib/parents/parseParentRecipientScope";

describe("parseParentRecipientScope", () => {
  it("reads explicit ids and drops invalid tokens", () => {
    expect(
      parseParentRecipientScope({
        ids: "11111111-1111-1111-1111-111111111111,not-a-uuid,22222222-2222-2222-2222-222222222222",
      }),
    ).toEqual({
      kind: "ids",
      ids: [
        "11111111-1111-1111-1111-111111111111",
        "22222222-2222-2222-2222-222222222222",
      ],
    });
  });

  it("reads a filter scope", () => {
    expect(
      parseParentRecipientScope({
        scope: "filter",
        q: "ana",
        section: "33333333-3333-3333-3333-333333333333",
        access: "never",
        phone: "without",
        created: "last30",
        email: "none",
        children: "with",
      }),
    ).toEqual({
      kind: "filter",
      q: "ana",
      section: "33333333-3333-3333-3333-333333333333",
      access: "never",
      phone: "without",
      created: "last30",
      email: "none",
      children: "with",
    });
  });

  it("returns empty ids when nothing is usable", () => {
    expect(parseParentRecipientScope({})).toEqual({ kind: "ids", ids: [] });
  });
});
