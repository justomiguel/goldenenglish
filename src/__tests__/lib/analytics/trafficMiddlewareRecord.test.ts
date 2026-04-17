import { describe, it, expect } from "vitest";
import { shouldRecordPublicTrafficHit } from "@/lib/analytics/trafficMiddlewareRecord";

function h(map: Record<string, string>) {
  return (n: string) => map[n.toLowerCase()] ?? null;
}

describe("shouldRecordPublicTrafficHit", () => {
  it("records GET under a locale prefix", () => {
    expect(
      shouldRecordPublicTrafficHit({
        method: "GET",
        pathname: "/es/register",
        getHeader: h({}),
      }),
    ).toBe(true);
  });

  it("skips non-GET", () => {
    expect(
      shouldRecordPublicTrafficHit({
        method: "POST",
        pathname: "/es/register",
        getHeader: h({}),
      }),
    ).toBe(false);
  });

  it("skips paths without locale", () => {
    expect(
      shouldRecordPublicTrafficHit({
        method: "GET",
        pathname: "/register",
        getHeader: h({}),
      }),
    ).toBe(false);
  });

  it("skips Next.js link prefetch", () => {
    expect(
      shouldRecordPublicTrafficHit({
        method: "GET",
        pathname: "/en/about",
        getHeader: h({ "next-router-prefetch": "1" }),
      }),
    ).toBe(false);
  });

  it("skips sec-purpose prefetch", () => {
    expect(
      shouldRecordPublicTrafficHit({
        method: "GET",
        pathname: "/en/about",
        getHeader: h({ "sec-purpose": "prefetch" }),
      }),
    ).toBe(false);
  });
});
