import { describe, expect, it } from "vitest";
import { parseRetentionPage } from "@/lib/academics/parseRetentionPage";

describe("parseRetentionPage", () => {
  it("uses 1 when the query is missing or not a page", () => {
    expect(parseRetentionPage(undefined)).toBe(1);
    expect(parseRetentionPage("0")).toBe(1);
    expect(parseRetentionPage("nope")).toBe(1);
  });

  it("keeps a positive page and caps the array form", () => {
    expect(parseRetentionPage("3")).toBe(3);
    expect(parseRetentionPage(["4", "9"])).toBe(4);
    expect(parseRetentionPage("100000")).toBe(10_000);
  });
});
