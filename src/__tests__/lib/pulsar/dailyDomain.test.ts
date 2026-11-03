import { describe, expect, it } from "vitest";
import { parseDailyDomain } from "@/lib/pulsar/dailyDomain";

describe("parseDailyDomain", () => {
  it("normalizes a hostname", () => {
    expect(parseDailyDomain(" Academia.Daily.co ")).toBe("academia.daily.co");
  });

  it("rejects URLs, empty strings, and embedded whitespace", () => {
    expect(parseDailyDomain("https://academia.daily.co/room")).toBeNull();
    expect(parseDailyDomain("")).toBeNull();
  });
});
