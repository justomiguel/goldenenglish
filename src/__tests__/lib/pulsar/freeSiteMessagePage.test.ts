import { describe, expect, it } from "vitest";
import { freeSiteMessageRange } from "@/lib/pulsar/freeSiteMessagePage";

describe("freeSiteMessageRange", () => {
  it("starts at the first page when the query is empty or invalid", () => {
    expect(freeSiteMessageRange(Number.NaN)).toEqual({ page: 1, from: 0, to: 19 });
    expect(freeSiteMessageRange(0)).toEqual({ page: 1, from: 0, to: 19 });
  });

  it("moves the window by 20 rows", () => {
    expect(freeSiteMessageRange(3)).toEqual({ page: 3, from: 40, to: 59 });
  });
});
