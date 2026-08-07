import { describe, expect, it } from "vitest";
import { resolveUsersExportScope } from "@/lib/users/resolveUsersExportScope";

// REGRESSION CHECK: Export must prefer selection; only then ask filter vs all.
describe("resolveUsersExportScope", () => {
  it("uses selection when selectedIds is non-empty", () => {
    expect(
      resolveUsersExportScope({
        mode: "data",
        selectedIds: ["a", "b"],
        fallback: "filter",
      }),
    ).toEqual({ kind: "ids", ids: ["a", "b"] });
  });

  it("uses fallback when selection empty and mode is data", () => {
    expect(
      resolveUsersExportScope({
        mode: "data",
        selectedIds: [],
        fallback: "all",
      }),
    ).toEqual({ kind: "all" });
    expect(
      resolveUsersExportScope({
        mode: "data",
        selectedIds: [],
        fallback: "filter",
      }),
    ).toEqual({ kind: "filter" });
  });

  it("returns template regardless of selection", () => {
    expect(
      resolveUsersExportScope({
        mode: "template",
        selectedIds: ["a"],
        fallback: "all",
      }),
    ).toEqual({ kind: "template" });
  });
});
