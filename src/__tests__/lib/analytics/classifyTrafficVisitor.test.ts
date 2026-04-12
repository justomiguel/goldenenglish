import { describe, it, expect } from "vitest";
import { classifyTrafficVisitor } from "@/lib/analytics/classifyTrafficVisitor";

describe("classifyTrafficVisitor", () => {
  it("classifies Googlebot as bot even with user id", () => {
    expect(
      classifyTrafficVisitor(
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "user-1",
      ),
    ).toBe("bot");
  });

  it("classifies normal browser with session as authenticated", () => {
    expect(
      classifyTrafficVisitor(
        "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0",
        "user-1",
      ),
    ).toBe("authenticated");
  });

  it("classifies normal browser without session as guest", () => {
    expect(
      classifyTrafficVisitor(
        "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0",
        null,
      ),
    ).toBe("guest");
  });

  it("treats empty UA without user as guest", () => {
    expect(classifyTrafficVisitor("", null)).toBe("guest");
  });

  it("treats undefined user agent like empty string", () => {
    expect(classifyTrafficVisitor(undefined, "user-1")).toBe("authenticated");
    expect(classifyTrafficVisitor(undefined, null)).toBe("guest");
  });
});
