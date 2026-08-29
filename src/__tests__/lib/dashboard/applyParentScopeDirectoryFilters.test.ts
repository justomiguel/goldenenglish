import { describe, expect, it } from "vitest";
import { applyParentScopeDirectoryFilters } from "@/lib/dashboard/applyParentScopeDirectoryFilters";

const now = new Date("2026-08-28T12:00:00.000Z");

describe("applyParentScopeDirectoryFilters", () => {
  it("keeps parents without children when children=without", () => {
    const profiles = [
      {
        id: "p1",
        first_name: "Ana",
        last_name: "A",
        phone: "1",
        created_at: "2026-01-01T00:00:00.000Z",
        last_session_start_at: null,
      },
      {
        id: "p2",
        first_name: "Bob",
        last_name: "B",
        phone: "2",
        created_at: "2026-01-01T00:00:00.000Z",
        last_session_start_at: null,
      },
    ];
    const kept = applyParentScopeDirectoryFilters(
      profiles,
      {
        kind: "filter",
        q: "",
        section: null,
        access: "all",
        children: "without",
      },
      {
        childrenByParent: new Map([["p1", [{ id: "s1" }]]]),
        emailById: new Map(),
      },
      now,
    );
    expect(kept.map((p) => p.id)).toEqual(["p2"]);
  });
});
